import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import { config } from '../config/index.js';

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'API Starter',
        description:
          'Barebones Node.js API with TypeScript, Fastify, PostgreSQL, and Sequelize. Includes Google OAuth2 authentication.',
        version: '1.0.0',
      },
      servers: [
        {
          url: config.appUrl,
          description: config.env === 'production' ? 'Production server' : 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token obtained from /auth/google or /auth/dev/token',
          },
        },
      },
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Authentication', description: 'Google OAuth and JWT authentication' },
        { name: 'Users', description: 'User CRUD operations (requires authentication)' },
      ],
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
});
