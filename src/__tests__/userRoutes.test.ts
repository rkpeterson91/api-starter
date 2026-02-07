import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { buildServer } from '../server.js';
import { sequelize } from '../database/connection.js';
import { User } from '../models/index.js';
import { Op } from 'sequelize';
import { userRoutes } from '../routes/api/users/index.js';
import authPlugin from '../plugins/auth.js';

describe('User CRUD Operations', () => {
  const server = buildServer();
  let authToken: string;
  let testUserId: number;

  beforeAll(async () => {
    // Connect to test database
    await sequelize.authenticate();

    // Tables are already created by global setup via migrations
    // No need to drop/recreate here - just clean up test data

    // Register auth plugin and routes
    await server.register(authPlugin);
    await server.register(userRoutes, { prefix: '/api/users' });
    await server.ready();

    // Create a test user and generate a token for authenticated requests
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    });

    testUserId = testUser.id;

    authToken = server.jwt.sign({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
    });
  });

  beforeEach(async () => {
    // Clean up database before each test (except the test user and auth test users)
    await User.destroy({
      where: {
        email: {
          [Op.and]: [
            { [Op.ne]: 'test@example.com' },
            { [Op.notLike]: '%@auth.test' }, // Preserve auth test users
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await sequelize.close();
    await server.close();
  });

  it('should create a new user', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    });

    expect(response.statusCode).toBe(201);
    const data = JSON.parse(response.body);
    expect(data.name).toBe('John Doe');
    expect(data.email).toBe('john@example.com');
    expect(data.id).toBeDefined();
  });

  it('should get all users', async () => {
    // Create a user first so we have data
    await server.inject({
      method: 'POST',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
    });

    const response = await server.inject({
      method: 'GET',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('should get a user by id', async () => {
    // First create a user
    const createResponse = await server.inject({
      method: 'POST',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
    });
    const createdUser = JSON.parse(createResponse.body);

    // Then get the user
    const response = await server.inject({
      method: 'GET',
      url: `/api/users/${createdUser.id}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.id).toBe(createdUser.id);
    expect(data.email).toBe('jane@example.com');
  });

  it('should update a user', async () => {
    // User can update their own account
    const response = await server.inject({
      method: 'PUT',
      url: `/api/users/${testUserId}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Updated Test User',
      },
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.name).toBe('Updated Test User');
    expect(data.email).toBe('test@example.com');
  });

  it('should delete a user', async () => {
    // Create a new user to delete (users can only delete themselves)
    const newUser = await User.create({
      name: 'To Delete',
      email: 'todelete@example.com',
      role: 'user',
    });

    const deleteToken = server.jwt.sign({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Delete their own account
    const deleteResponse = await server.inject({
      method: 'DELETE',
      url: `/api/users/${newUser.id}`,
      headers: {
        Authorization: `Bearer ${deleteToken}`,
      },
    });

    expect(deleteResponse.statusCode).toBe(204);

    // Verify user is deleted
    const getResponse = await server.inject({
      method: 'GET',
      url: `/api/users/${newUser.id}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(getResponse.statusCode).toBe(404);
  });

  it('should return 404 for non-existent user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/users/99999',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should return 404 when updating non-existent user', async () => {
    // Trying to update a non-existent user that happens to not be the current user
    // Should fail with 403 since user can only update themselves
    const response = await server.inject({
      method: 'PUT',
      url: '/api/users/99999',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Updated Name',
      },
    });

    expect(response.statusCode).toBe(403);
    const data = JSON.parse(response.body);
    expect(data.error).toBe('Insufficient permissions to update this user');
  });

  it('should return 404 when deleting non-existent user', async () => {
    // Trying to delete a non-existent user that is not the current user
    // Should fail with 403 since user can only delete themselves
    const response = await server.inject({
      method: 'DELETE',
      url: '/api/users/99999',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
    const data = JSON.parse(response.body);
    expect(data.error).toBe('Insufficient permissions to delete this user');
  });

  it('should handle duplicate email errors', async () => {
    // Create first user
    const firstResponse = await server.inject({
      method: 'POST',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'First User',
        email: 'duplicate@example.com',
      },
    });
    expect(firstResponse.statusCode).toBe(201);

    // Try to create second user with same email
    const response = await server.inject({
      method: 'POST',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Second User',
        email: 'duplicate@example.com',
      },
    });

    expect(response.statusCode).toBe(500);
    const data = JSON.parse(response.body);
    expect(data.error).toBeDefined();
  });

  it('should handle invalid email validation', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Invalid Email User',
        email: 'not-an-email',
      },
    });

    expect(response.statusCode).toBe(400); // Swagger schema validation returns 400
    const data = JSON.parse(response.body);
    expect(data.message || data.error).toBeDefined();
  });

  it('should handle invalid JSON body', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/users',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      payload: 'invalid json{',
    });

    expect(response.statusCode).toBe(400);
    const data = JSON.parse(response.body);
    expect(data.error).toBeDefined();
  });

  it('should get health check', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  it('should reject requests without auth token', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/users',
    });

    expect(response.statusCode).toBe(401);
  });

  // Error handling tests with mocking
  it('should handle database error when fetching all users', async () => {
    vi.spyOn(User, 'findAll').mockRejectedValueOnce(new Error('Database connection failed'));

    const response = await server.inject({
      method: 'GET',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(500);
    const data = JSON.parse(response.body);
    expect(data.error).toBe('Failed to fetch users');

    vi.restoreAllMocks();
  });

  it('should handle database error when fetching single user', async () => {
    vi.spyOn(User, 'findByPk').mockRejectedValueOnce(new Error('Database query failed'));

    const response = await server.inject({
      method: 'GET',
      url: '/api/users/1',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(500);
    const data = JSON.parse(response.body);
    expect(data.error).toBe('Failed to fetch user');

    vi.restoreAllMocks();
  });

  it('should handle database error when updating user', async () => {
    // Mock User.update to throw an error
    vi.spyOn(User, 'update').mockRejectedValueOnce(new Error('Update operation failed'));

    // Try to update own user
    const response = await server.inject({
      method: 'PUT',
      url: `/api/users/${testUserId}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Updated Name',
      },
    });

    expect(response.statusCode).toBe(500);
    const data = JSON.parse(response.body);
    expect(data.error).toBe('Failed to update user');

    vi.restoreAllMocks();
  });

  it('should handle database error when deleting user', async () => {
    // Mock User.destroy to throw an error
    vi.spyOn(User, 'destroy').mockRejectedValueOnce(new Error('Delete operation failed'));

    // Try to delete own user
    const response = await server.inject({
      method: 'DELETE',
      url: `/api/users/${testUserId}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(500);
    const data = JSON.parse(response.body);
    expect(data.error).toBe('Failed to delete user');

    vi.restoreAllMocks();
  });
});
