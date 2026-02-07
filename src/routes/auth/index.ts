import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../../models/index.js';
import { getMessages, type Locale } from '../../i18n/messages.js';
import { sendError } from '../../utils/errors.js';
import { userResponseSchema, errorSchema, tokenResponseSchema } from '../../schemas/common.js';
import { config } from '../../config/index.js';
import { fetchProviderUserInfo } from '../../utils/oauthProviders.js';
import type { ProviderName } from '../../types/oauth.js';

export const authRoutes = async (fastify: FastifyInstance) => {
  // Generic OAuth callback handler for all providers
  const handleOAuthCallback = async (
    provider: ProviderName,
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const locale = (request as any).locale as Locale;
    const messages = getMessages(locale);

    try {
      const oauthInstance = fastify.oauth[provider];

      if (!oauthInstance) {
        return sendError(reply, 503, `${provider} OAuth is not configured`);
      }

      const { token } = await oauthInstance.getAccessTokenFromAuthorizationCodeFlow(request);

      // Fetch user info using provider-specific adapter
      const userInfo = await fetchProviderUserInfo(provider, token.access_token);

      // Calculate token expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (token.expires_in || 3600));

      // Create or update user in database
      const [user, created] = await User.findOrCreate({
        where: { email: userInfo.email },
        defaults: {
          name: userInfo.name,
          email: userInfo.email,
          oauthProvider: provider,
          oauthId: userInfo.id,
          oauthAccessToken: token.access_token,
          oauthRefreshToken: token.refresh_token,
          oauthTokenExpiresAt: expiresAt,
        },
      });

      // Update existing users with new OAuth data
      if (!created) {
        const updateFields: any = {};
        let needsUpdate = false;

        if (user.oauthProvider !== provider) {
          updateFields.oauthProvider = provider;
          needsUpdate = true;
        }
        if (user.oauthId !== userInfo.id) {
          updateFields.oauthId = userInfo.id;
          needsUpdate = true;
        }
        if (user.oauthAccessToken !== token.access_token) {
          updateFields.oauthAccessToken = token.access_token;
          needsUpdate = true;
        }
        if (token.refresh_token && user.oauthRefreshToken !== token.refresh_token) {
          updateFields.oauthRefreshToken = token.refresh_token;
          needsUpdate = true;
        }
        if (user.oauthTokenExpiresAt?.getTime() !== expiresAt.getTime()) {
          updateFields.oauthTokenExpiresAt = expiresAt;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await User.update(updateFields, { where: { id: user.id } });
          Object.assign(user, updateFields);
        }
      }

      // Issue JWT token
      const jwtToken = fastify.jwt.sign(
        {
          userId: user.id,
          email: user.email,
        },
        {
          expiresIn: '7d',
        }
      );

      // Set refresh token in cookie
      reply.setCookie('refreshToken', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return reply.send({
        success: true,
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      request.log.error(error);
      return sendError(reply, 500, messages.errors.authenticationFailed);
    }
  };

  // Register OAuth callback routes for each enabled provider
  for (const provider of config.oauth.enabledProviders) {
    fastify.get(
      `/auth/${provider.name}/callback`,
      {
        schema: {
          tags: ['Authentication'],
          description: `${provider.displayName} OAuth callback handler (automatic redirect)`,
          hide: true, // Hide from docs since it's called by OAuth provider
        },
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        return handleOAuthCallback(provider.name as ProviderName, request, reply);
      }
    );
  }

  // Get current user
  fastify.get(
    '/auth/me',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Authentication'],
        description: 'Get current authenticated user',
        security: [{ bearerAuth: [] }],
        response: {
          200: userResponseSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const locale = (request as any).locale as Locale;
      const messages = getMessages(locale);

      try {
        const user = await User.findByPk(request.user!.userId);

        if (!user) {
          return sendError(reply, 404, messages.errors.userNotFound);
        }

        const userData = {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        return reply.send({ user: userData });
      } catch (error) {
        request.log.error(error);
        return sendError(reply, 500, messages.errors.failedToFetchUser);
      }
    }
  );

  // Logout
  fastify.post(
    '/auth/logout',
    {
      schema: {
        tags: ['Authentication'],
        description: 'Logout and clear refresh token cookie',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const locale = (request as any).locale as Locale;
      const messages = getMessages(locale);

      return reply
        .clearCookie('refreshToken')
        .send({ success: true, message: messages.success.loggedOutSuccessfully });
    }
  );

  // Get available authentication providers
  fastify.get(
    '/auth/providers',
    {
      schema: {
        tags: ['Authentication'],
        description: 'Get available authentication providers configured on the API',
        response: {
          200: {
            type: 'object',
            properties: {
              providers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    displayName: { type: 'string' },
                    loginUrl: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const providers = config.oauth.enabledProviders.map((p) => ({
        name: p.name,
        displayName: p.displayName,
        loginUrl: `/auth/${p.name}`,
      }));

      return reply.send({ providers });
    }
  );

  // Development-only: Generate test token
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    fastify.post(
      '/auth/dev/token',
      {
        schema: {
          tags: ['Authentication'],
          description: 'Generate test JWT token (development only)',
          body: {
            type: 'object',
            required: ['email'],
            properties: {
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
            },
          },
          response: {
            200: tokenResponseSchema,
            400: errorSchema,
          },
        },
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const locale = (request as any).locale as Locale;
        const messages = getMessages(locale);
        const { email, name } = request.body as { email?: string; name?: string };

        if (!email) {
          return sendError(reply, 400, messages.errors.emailRequired);
        }

        // Find or create user
        const [user] = await User.findOrCreate({
          where: { email },
          defaults: {
            name: name || 'Test User',
            email,
          },
        });

        // Generate token
        const token = fastify.jwt.sign(
          {
            userId: user.id,
            email: user.email,
          },
          {
            expiresIn: '7d',
          }
        );

        return reply.send({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      }
    );
  }
};
