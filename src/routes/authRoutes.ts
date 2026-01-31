import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/index.js';
import { getMessages, type Locale } from '../i18n/messages.js';
import { sendError } from '../utils/errors.js';
import { userResponseSchema, errorSchema, tokenResponseSchema } from '../schemas/common.js';
import { config } from '../config/index.js';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export const authRoutes = async (fastify: FastifyInstance) => {
  // OAuth callback handler
  fastify.get(
    '/auth/google/callback',
    {
      schema: {
        tags: ['Authentication'],
        description: 'Google OAuth callback handler (automatic redirect)',
        hide: true, // Hide from docs since it's called by Google
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const locale = (request as any).locale as Locale;
      const messages = getMessages(locale);

      try {
        if (!fastify.googleOAuth2) {
          return sendError(reply, 503, messages.errors.googleOAuthNotConfigured);
        }

        const { token } =
          await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

        // Fetch user info from Google
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });

        if (!response.ok) {
          return sendError(reply, 500, messages.errors.failedToFetchGoogleUserInfo);
        }

        const userInfo = (await response.json()) as GoogleUserInfo;

        // Calculate token expiration time
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (token.expires_in || 3600));

        // Create or update user in database
        const [user, created] = await User.findOrCreate({
          where: { email: userInfo.email },
          defaults: {
            name: userInfo.name,
            email: userInfo.email,
            googleId: userInfo.id,
            googleAccessToken: token.access_token,
            googleRefreshToken: token.refresh_token,
            googleTokenExpiresAt: expiresAt,
          },
        });

        // Optimized: update existing users with single query if needed
        if (!created) {
          const updateFields: any = {};
          let needsUpdate = false;

          if (user.googleId !== userInfo.id) {
            updateFields.googleId = userInfo.id;
            needsUpdate = true;
          }
          if (user.googleAccessToken !== token.access_token) {
            updateFields.googleAccessToken = token.access_token;
            needsUpdate = true;
          }
          if (token.refresh_token && user.googleRefreshToken !== token.refresh_token) {
            updateFields.googleRefreshToken = token.refresh_token;
            needsUpdate = true;
          }
          if (user.googleTokenExpiresAt?.getTime() !== expiresAt.getTime()) {
            updateFields.googleTokenExpiresAt = expiresAt;
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
    }
  );

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
          200: {
            type: 'object',
            properties: {
              user: userResponseSchema,
            },
          },
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const locale = (request as any).locale as Locale;
      const messages = getMessages(locale);

      try {
        const user = await User.findByPk(request.user!.userId, {
          attributes: ['id', 'name', 'email', 'createdAt', 'updatedAt'],
        });

        if (!user) {
          return sendError(reply, 404, messages.errors.userNotFound);
        }

        return reply.send({ user });
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

  // Health check for auth system
  fastify.get(
    '/auth/status',
    {
      schema: {
        tags: ['Authentication'],
        description: 'Check if Google OAuth is configured',
        response: {
          200: {
            type: 'object',
            properties: {
              googleOAuthConfigured: { type: 'boolean' },
              loginUrl: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        googleOAuthConfigured: !!fastify.googleOAuth2,
        loginUrl: fastify.googleOAuth2 ? '/auth/google' : null,
      });
    }
  );

  // Development-only: Generate test token
  if (process.env.NODE_ENV === 'development') {
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
