import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildServer } from '../server.js';
import { sequelize } from '../database/connection.js';
import { User } from '../models/index.js';
import { authRoutes } from '../routes/auth/index.js';
import authPlugin from '../plugins/auth.js';
import { Op } from 'sequelize';

describe('Authentication Routes', () => {
  const server = buildServer();
  let authToken: string;
  let testUserId: number;

  beforeAll(async () => {
    await sequelize.authenticate();

    // Only sync if tables don't exist
    const tables = await sequelize.getQueryInterface().showAllTables();
    if (tables.length === 0) {
      await sequelize.sync();
    }

    await server.register(authPlugin);
    await server.register(authRoutes);
    await server.ready();

    // Create a test user and token with unique email pattern for auth tests
    const testUser = await User.create({
      name: 'Auth Test User',
      email: 'auth-test-user@auth.test',
    });
    testUserId = testUser.id;

    authToken = server.jwt.sign({
      userId: testUser.id,
      email: testUser.email,
    });
  });

  beforeEach(async () => {
    // Clean up auth test users (those with @auth.test domain)
    await User.destroy({
      where: {
        email: {
          [Op.like]: '%@auth.test',
          [Op.notLike]: 'auth-test-user@auth.test',
        },
      },
    });
  });

  afterAll(async () => {
    await sequelize.close();
    await server.close();
  });

  describe('GET /auth/providers', () => {
    it('should return authentication provider status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/providers',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('providers');
      expect(Array.isArray(data.providers)).toBe(true);
      // Providers array may be empty if no OAuth credentials are configured
      // Each provider should have the correct structure if present
      if (data.providers.length > 0) {
        data.providers.forEach((provider: any) => {
          expect(provider).toHaveProperty('name');
          expect(provider).toHaveProperty('displayName');
          expect(provider).toHaveProperty('loginUrl');
        });
      }
    });
  });

  describe('POST /auth/dev/token', () => {
    it('should generate a dev token for new user', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/dev/token',
        payload: {
          email: 'newdevuser@auth.test',
          name: 'New Dev User',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe('newdevuser@auth.test');
      expect(data.user.name).toBe('New Dev User');
    });

    it('should generate a dev token for existing user', async () => {
      // First request creates the user
      const firstResponse = await server.inject({
        method: 'POST',
        url: '/auth/dev/token',
        payload: {
          email: 'existingdev@auth.test',
          name: 'Existing Dev',
        },
      });
      expect(firstResponse.statusCode).toBe(200);

      // Second request finds existing user
      const secondResponse = await server.inject({
        method: 'POST',
        url: '/auth/dev/token',
        payload: {
          email: 'existingdev@auth.test',
          name: 'Different Name',
        },
      });

      expect(secondResponse.statusCode).toBe(200);
      const data = JSON.parse(secondResponse.body);
      expect(data.user.email).toBe('existingdev@auth.test');
      // Name should be the original name, not the new one
      expect(data.user.name).toBe('Existing Dev');
    });

    it('should return 400 when email is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/dev/token',
        payload: {
          name: 'No Email User',
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
    });

    it('should use default name when not provided', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/dev/token',
        payload: {
          email: 'noname@auth.test',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.user.name).toBe('Test User');
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('user');
      expect(data.user.id).toBe(testUserId);
      expect(data.user.email).toBe('auth-test-user@auth.test');
      expect(data.user.name).toBe('Auth Test User');
      expect(data.user).toHaveProperty('createdAt');
      expect(data.user).toHaveProperty('updatedAt');
    });

    it('should return 401 without token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when user no longer exists', async () => {
      // Create a temporary user
      const tempUser = await User.create({
        name: 'Temp User',
        email: 'temp@auth.test',
      });

      const tempToken = server.jwt.sign({
        userId: tempUser.id,
        email: tempUser.email,
      });

      // Delete the user
      await User.destroy({ where: { id: tempUser.id } });

      // Try to get user info
      const response = await server.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          Authorization: `Bearer ${tempToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('User not found');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/logout',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('message');
    });

    it('should clear refresh token cookie', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/logout',
      });

      expect(response.statusCode).toBe(200);
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      // Should set max-age to 0 or expires to past date
      expect(setCookieHeader).toContain('refreshToken');
    });
  });
});
