import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { User, UserRole } from '../models/User.js';

declare module 'fastify' {
  interface FastifyRequest {
    requireRole(role: UserRole | UserRole[]): Promise<void>;
  }
}

const rbacPlugin: FastifyPluginAsync = async (fastify) => {
  // Add requireRole helper to request object
  fastify.decorateRequest('requireRole', null);

  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    request.requireRole = async (role: UserRole | UserRole[]) => {
      // Check if user is authenticated
      if (!request.user) {
        throw fastify.httpErrors.unauthorized('Authentication required');
      }

      // Get user from database to ensure we have latest role
      const user = await User.findByPk(request.user.id);
      if (!user) {
        throw fastify.httpErrors.unauthorized('User not found');
      }

      // Check if user has required role
      const requiredRoles = Array.isArray(role) ? role : [role];
      if (!requiredRoles.includes(user.role)) {
        throw fastify.httpErrors.forbidden(
          `Access denied. Required role: ${requiredRoles.join(' or ')}`
        );
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
