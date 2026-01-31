import fp from 'fastify-plugin';
import fastifyOAuth2 from '@fastify/oauth2';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    googleOAuth2: any;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      userId: number;
      email: string;
    };
  }
}

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

  // Register Google OAuth only if credentials are provided
  if (config.oauth.google.enabled) {
    await fastify.register(fastifyOAuth2, {
      name: 'googleOAuth2',
      credentials: {
        client: {
          id: config.oauth.google.clientId!,
          secret: config.oauth.google.clientSecret!,
        },
        auth: fastifyOAuth2.GOOGLE_CONFIGURATION,
      },
      startRedirectPath: '/auth/google',
      callbackUri: `${config.appUrl}/auth/google/callback`,
      scope: ['profile', 'email'],
    });
  }

  // Auth decorator for protected routes
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const decoded = (await request.jwtVerify()) as any;
      request.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
});
