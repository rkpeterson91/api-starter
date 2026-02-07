import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../server.js';
import { FastifyInstance } from 'fastify';

describe('Server', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Health Check', () => {
    it('should return 200 and status ok', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body).toHaveProperty('timestamp');
    });

    it('should return valid timestamp', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      const timestamp = new Date(body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/health',
        payload: 'invalid json',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should handle 404 routes', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/nonexistent',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Locale Detection', () => {
    it('should detect locale from Accept-Language header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'accept-language': 'es',
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should handle missing Accept-Language header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
