import fp from 'fastify-plugin';
import fastifyOAuth2 from '@fastify/oauth2';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    oauth: Record<string, any>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      userId: number;
      id: number;
      email: string;
      role: 'user' | 'admin';
    };
  }
}

// OAuth provider configurations
const oauthConfigurations = {
  google: fastifyOAuth2.GOOGLE_CONFIGURATION,
  github: fastifyOAuth2.GITHUB_CONFIGURATION,
  microsoft: fastifyOAuth2.MICROSOFT_CONFIGURATION,
};

export default fp(async (fastify: FastifyInstance) => {
  // Register cookie support
  await fastify.register(fastifyCookie);

  // Register JWT
  await fastify.register(fastifyJwt, {
    secret: config.jwt.secret,
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    },
  });

  // Initialize oauth object to store provider instances
  fastify.decorate('oauth', {});

  // Register OAuth providers dynamically
  for (const provider of config.oauth.enabledProviders) {
    const oauthConfig = oauthConfigurations[provider.name as keyof typeof oauthConfigurations];

    if (oauthConfig) {
      await fastify.register(fastifyOAuth2, {
        name: `${provider.name}OAuth2`,
        credentials: {
          client: {
            id: provider.clientId,
            secret: provider.clientSecret,
          },
          auth: oauthConfig,
        },
        startRedirectPath: `/auth/${provider.name}`,
        callbackUri: `${config.appUrl}/auth/${provider.name}/callback`,
        scope:
          provider.name === 'google'
            ? ['profile', 'email']
            : provider.name === 'github'
              ? ['user:email', 'read:user']
              : ['openid', 'profile', 'email'],
      });

      // Store reference to OAuth instance
      fastify.oauth[provider.name] = (fastify as any)[`${provider.name}OAuth2`];
    }
  }

  // Auth decorator for protected routes
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const decoded = (await request.jwtVerify()) as any;
      request.user = {
        userId: decoded.userId,
        id: decoded.userId, // Alias for consistency
        email: decoded.email,
        role: decoded.role || 'user',
      };
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
});
