import Fastify from 'fastify';
import { config } from './config/index.js';

// Check if pino-pretty is available (dev dependency)
let hasPinoPretty = false;
try {
  await import('pino-pretty');
  hasPinoPretty = true;
} catch {
  // pino-pretty not available (production build)
}

export const buildServer = () => {
  const fastify = Fastify({
    logger: config.env === 'development' && hasPinoPretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
              colorize: true,
            },
          },
          serializers: {
            req(request) {
              return {
                method: request.method,
                url: request.url,
                host: request.headers.host,
                remoteAddress: request.ip,
                remotePort: request.socket?.remotePort,
                body: request.body,
              };
            },
          },
        }
      : config.env === 'development'
      ? { level: 'info' }  // Development without pino-pretty
      : { level: 'error' }, // Production
  });

  // Log request body after parsing in development
  if (config.env === 'development') {
    fastify.addHook('onRequest', async (request, reply) => {
      request.log.info({ method: request.method, url: request.url }, 'Incoming request');
    });

    fastify.addHook('preHandler', async (request, reply) => {
      if (request.body) {
        request.log.info({ body: request.body }, 'Request body');
      }
    });

    fastify.addHook('onResponse', async (request, reply) => {
      request.log.info({
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      }, 'Request completed');
    });
  }

  // Error handler to log invalid JSON
  fastify.setErrorHandler((error: any, request, reply) => {
    if (error.code === 'FST_ERR_CTP_INVALID_JSON_BODY' && config.env === 'development') {
      request.log.error({
        error: error.message,
        rawBody: request.body || 'Unable to capture raw body',
      }, 'Invalid JSON received');
    }
    
    // Send the error response
    reply.status(error.statusCode || 500).send({
      error: error.message,
      statusCode: error.statusCode || 500,
    });
  });

  // Health check route
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return fastify;
};
