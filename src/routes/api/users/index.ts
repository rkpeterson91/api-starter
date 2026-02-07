import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../../../models/index.js';
import { getMessages, type Locale } from '../../../i18n/messages.js';
import { sendError } from '../../../utils/errors.js';
import {
  userSchema,
  usersArraySchema,
  errorSchema,
  idParamSchema,
} from '../../../schemas/common.js';

interface CreateUserBody {
  name: string;
  email: string;
  role?: 'user' | 'admin';
}

interface UpdateUserBody {
  name?: string;
  email?: string;
}

interface UserParams {
  id: string;
}

export const userRoutes = async (fastify: FastifyInstance) => {
  // Add authentication to all user routes
  fastify.addHook('onRequest', fastify.authenticate);

  // CREATE - Create a new user
  fastify.post<{ Body: CreateUserBody }>(
    '/',
    {
      schema: {
        tags: ['Users'],
        description: 'Create a new user',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['user', 'admin'] },
          },
        },
        response: {
          201: userSchema,
          403: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) => {
      const locale = (request as any).locale as Locale;
      const messages = getMessages(locale);

      try {
        const { name, email, role } = request.body;

        // Only admins can create admin users
        if (role === 'admin' && request.user.role !== 'admin') {
          return sendError(reply, 403, 'Insufficient permissions to create admin users');
        }

        // Default to 'user' role if not specified or if requester is not admin
        const userRole = role && request.user.role === 'admin' ? role : 'user';

        const user = await User.create({ name, email, role: userRole });
        return reply.code(201).send(user);
      } catch (error) {
        request.log.error(error);
        return sendError(reply, 500, messages.errors.failedToCreateUser);
      }
    }
  );

  // READ - Get all users
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Users'],
        description: 'Get all users',
        security: [{ bearerAuth: [] }],
        response: {
          200: usersArraySchema,
          500: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const locale = (request as any).locale as Locale;
      const messages = getMessages(locale);

      try {
        const users = await User.findAll({
          order: [['createdAt', 'DESC']],
        });
        return reply.send(users);
      } catch (error) {
        request.log.error(error);
        return sendError(reply, 500, messages.errors.failedToFetchUsers);
      }
    }
  );

  // READ - Get a single user by ID
  fastify.get<{ Params: UserParams }>(
    '/:id',
    {
      schema: {
        tags: ['Users'],
        description: 'Get a user by ID',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          200: userSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      const locale = (request as any).locale as Locale;
      const messages = getMessages(locale);

      try {
        const { id } = request.params;
        const user = await User.findByPk(id);

        if (!user) {
          return sendError(reply, 404, messages.errors.userNotFound);
        }

        return reply.send(user);
      } catch (error) {
        request.log.error(error);
        return sendError(reply, 500, messages.errors.failedToFetchUser);
      }
    }
  );

  // UPDATE - Update a user
  fastify.put<{ Params: UserParams; Body: UpdateUserBody }>(
    '/:id',
    {
      schema: {
        tags: ['Users'],
        description: 'Update a user (self or admin only)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
          },
        },
        response: {
          200: userSchema,
          403: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: UserParams; Body: UpdateUserBody }>,
      reply: FastifyReply
    ) => {
      const locale = (request as any).locale as Locale;
      const messages = getMessages(locale);

      try {
        const { id } = request.params;

        // Users can only update themselves, unless they're an admin
        if (request.user.id !== Number(id) && request.user.role !== 'admin') {
          return sendError(reply, 403, 'Insufficient permissions to update this user');
        }

        const { name, email } = request.body;

        // Build update object with only defined fields
        const updateFields: Partial<UpdateUserBody> = {};
        if (name !== undefined) updateFields.name = name;
        if (email !== undefined) updateFields.email = email;

        // Optimized: single query update with returning the updated record
        const [affectedCount, affectedRows] = await User.update(updateFields, {
          where: { id },
          returning: true,
        });

        if (affectedCount === 0) {
          return sendError(reply, 404, messages.errors.userNotFound);
        }

        return reply.send(affectedRows[0]);
      } catch (error) {
        request.log.error(error);
        return sendError(reply, 500, messages.errors.failedToUpdateUser);
      }
    }
  );

  // DELETE - Delete a user
  fastify.delete<{ Params: UserParams }>(
    '/:id',
    {
      schema: {
        tags: ['Users'],
        description: 'Delete a user (self or admin only)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          204: {
            type: 'null',
            description: 'User deleted successfully',
          },
          403: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      const locale = (request as any).locale as Locale;
      const messages = getMessages(locale);

      try {
        const { id } = request.params;

        // Users can only delete themselves, unless they're an admin
        if (request.user.id !== Number(id) && request.user.role !== 'admin') {
          return sendError(reply, 403, 'Insufficient permissions to delete this user');
        }

        const deletedCount = await User.destroy({
          where: { id },
        });

        if (deletedCount === 0) {
          return sendError(reply, 404, messages.errors.userNotFound);
        }

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error);
        return sendError(reply, 500, messages.errors.failedToDeleteUser);
      }
    }
  );
};
