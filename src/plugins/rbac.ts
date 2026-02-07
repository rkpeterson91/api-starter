import { FastifyPluginAsync, FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { User, UserRole } from '../models/User.js';

declare module 'fastify' {
  interface FastifyRequest {
    requireRole(role: UserRole | UserRole[]): Promise<void>;
  }
  interface FastifyInstance {
    requireRole(
      role: UserRole | UserRole[]
    ): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const rbacPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Add requireRole helper to request object
  // Initialize with a no-op function that will be replaced in the hook
  fastify.decorateRequest('requireRole', async () => {});

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    request.requireRole = async (role: UserRole | UserRole[]) => {
      // Check if user is authenticated
      if (!request.user) {
        return reply.code(401).send({ error: 'Authentication required', statusCode: 401 });
      }

      // Get user from database to ensure we have latest role
      const user = await User.findByPk(request.user.id);
      if (!user) {
        return reply.code(401).send({ error: 'User not found', statusCode: 401 });
      }

      // Check if user has required role
      const requiredRoles = Array.isArray(role) ? role : [role];
      if (!requiredRoles.includes(user.role)) {
        return reply.code(403).send({
          error: `Access denied. Required role: ${requiredRoles.join(' or ')}`,
          statusCode: 403,
        });
      }
    };
  });

  // Add role checking decorator for routes
  fastify.decorate('requireRole', (role: UserRole | UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      await request.requireRole(role);
    };
  });
};

export default fp(rbacPlugin, {
  name: 'rbac',
  dependencies: ['jwt'],
});
