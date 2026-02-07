import { FastifyPluginAsync } from 'fastify';
import { User } from '../../../models/User.js';
import { userSchema, usersArraySchema, errorSchema } from '../../../schemas/common.js';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all users (admin only)
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate, fastify.requireRole('admin')],
      schema: {
        tags: ['Admin'],
        description: 'Get all users (admin only)',
        security: [{ bearerAuth: [] }],
        response: {
          200: usersArraySchema,
          401: errorSchema,
          403: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const users = await User.findAll({
        attributes: { exclude: ['oauthAccessToken', 'oauthRefreshToken'] },
        order: [['createdAt', 'DESC']],
      });
      return users;
    }
  );

  // Update user role (admin only)
  fastify.patch(
    '/:id/role',
    {
      onRequest: [fastify.authenticate, fastify.requireRole('admin')],
      schema: {
        tags: ['Admin'],
        description: 'Update user role (admin only)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['user', 'admin'] },
          },
          required: ['role'],
        },
        response: {
          200: userSchema,
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      const { role } = request.body as { role: 'user' | 'admin' };

      const user = await User.findByPk(id);
      if (!user) {
        return reply.code(404).send({ error: 'User not found', statusCode: 404 });
      }

      user.role = role;
      await user.save();

      return user;
    }
  );

  // Delete user (admin only)
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate, fastify.requireRole('admin')],
      schema: {
        tags: ['Admin'],
        description: 'Delete a user (admin only)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: errorSchema,
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };

      // Prevent self-deletion
      if (request.user.id === id) {
        return reply.code(400).send({ error: 'Cannot delete your own account', statusCode: 400 });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return reply.code(404).send({ error: 'User not found', statusCode: 404 });
      }

      await user.destroy();

      return { message: 'User deleted successfully' };
    }
  );
};
