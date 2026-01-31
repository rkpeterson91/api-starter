import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { buildServer } from '../server.js';
import { sequelize } from '../database/connection.js';
import { User } from '../models/index.js';
import { Op } from 'sequelize';
import { userRoutes } from '../routes/userRoutes.js';
import authPlugin from '../plugins/auth.js';

describe('User CRUD Operations', () => {
  const server = buildServer();
  let authToken: string;

  beforeAll(async () => {
    // Connect to test database and sync models
    await sequelize.authenticate();

    // Drop all tables to ensure clean slate
    await sequelize.getQueryInterface().dropAllTables();

    // Recreate all tables with new schema
    await sequelize.sync();

    // Register auth plugin and routes
    await server.register(authPlugin);
    await server.register(userRoutes, { prefix: '/api/users' });
    await server.ready();

    // Create a test user and generate a token for authenticated requests
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      googleId: 'test-google-id',
    });

    authToken = server.jwt.sign({
      userId: testUser.id,
      email: testUser.email,
    });
  });

  beforeEach(async () => {
    // Clean up database before each test (except the test user)
    await User.destroy({ where: { email: { [Op.ne]: 'test@example.com' } } });
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
    // First create a user
    const createResponse = await server.inject({
      method: 'POST',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Bob Smith',
        email: 'bob@example.com',
      },
    });
    const createdUser = JSON.parse(createResponse.body);

    // Then update the user
    const response = await server.inject({
      method: 'PUT',
      url: `/api/users/${createdUser.id}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Robert Smith',
      },
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.name).toBe('Robert Smith');
    expect(data.email).toBe('bob@example.com');
  });

  it('should delete a user', async () => {
    // First create a user
    const createResponse = await server.inject({
      method: 'POST',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
      },
    });
    const createdUser = JSON.parse(createResponse.body);

    // Then delete the user
    const deleteResponse = await server.inject({
      method: 'DELETE',
      url: `/api/users/${createdUser.id}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(deleteResponse.statusCode).toBe(204);

    // Verify user is deleted
    const getResponse = await server.inject({
      method: 'GET',
      url: `/api/users/${createdUser.id}`,
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

    expect(response.statusCode).toBe(404);
    const data = JSON.parse(response.body);
    expect(data.error).toBe('User not found');
  });

  it('should return 404 when deleting non-existent user', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: '/api/users/99999',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(404);
    const data = JSON.parse(response.body);
    expect(data.error).toBe('User not found');
  });

  it('should handle duplicate email errors', async () => {
    // Create first user
    await server.inject({
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

    expect(response.statusCode).toBe(500);
    const data = JSON.parse(response.body);
    expect(data.error).toBeDefined();
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
    // First create a real user
    const createResponse = await server.inject({
      method: 'POST',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Test User',
        email: 'test-update-error@example.com',
      },
    });
    const createdUser = JSON.parse(createResponse.body);

    // Mock save to throw an error
    vi.spyOn(User.prototype, 'save').mockRejectedValueOnce(new Error('Save operation failed'));

    const response = await server.inject({
      method: 'PUT',
      url: `/api/users/${createdUser.id}`,
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
    // First create a real user
    const createResponse = await server.inject({
      method: 'POST',
      url: '/api/users',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Test User',
        email: 'test-delete-error@example.com',
      },
    });
    const createdUser = JSON.parse(createResponse.body);

    // Mock destroy to throw an error
    vi.spyOn(User.prototype, 'destroy').mockRejectedValueOnce(new Error('Delete operation failed'));

    const response = await server.inject({
      method: 'DELETE',
      url: `/api/users/${createdUser.id}`,
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
