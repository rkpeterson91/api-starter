import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/index.js';

interface CreateUserBody {
  name: string;
  email: string;
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
    async (request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) => {
      try {
        const { name, email } = request.body;
        const user = await User.create({ name, email });
        return reply.code(201).send(user);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to create user' });
      }
    }
  );

  // READ - Get all users
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await User.findAll({
        order: [['createdAt', 'DESC']],
      });
      return reply.send(users);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch users' });
    }
  });

  // READ - Get a single user by ID
  fastify.get<{ Params: UserParams }>(
    '/:id',
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const user = await User.findByPk(id);

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        return reply.send(user);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch user' });
      }
    }
  );

  // UPDATE - Update a user
  fastify.put<{ Params: UserParams; Body: UpdateUserBody }>(
    '/:id',
    async (
      request: FastifyRequest<{ Params: UserParams; Body: UpdateUserBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { name, email } = request.body;

        const user = await User.findByPk(id);

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;

        await user.save();
        return reply.send(user);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to update user' });
      }
    }
  );

  // DELETE - Delete a user
  fastify.delete<{ Params: UserParams }>(
    '/:id',
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const user = await User.findByPk(id);

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        await user.destroy();
        return reply.code(204).send();
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to delete user' });
      }
    }
  );
};
