import { describe, it, expect } from 'vitest';
import { sendError, asyncHandler } from '../utils/errors.js';
import { FastifyReply } from 'fastify';

describe('Error Utilities', () => {
  describe('sendError', () => {
    it('should send error response with correct status and message', () => {
      const mockReply = {
        status: (code: number) => mockReply,
        send: (body: any) => body,
      } as unknown as FastifyReply;

      const statusSpy = { called: false, code: 0 };
      const sendSpy = { called: false, body: null as any };

      mockReply.status = (code: number) => {
        statusSpy.called = true;
        statusSpy.code = code;
        return mockReply;
      };

      mockReply.send = (body: any) => {
        sendSpy.called = true;
        sendSpy.body = body;
        return mockReply;
      };

      sendError(mockReply, 404, 'Not found');

      expect(statusSpy.called).toBe(true);
      expect(statusSpy.code).toBe(404);
      expect(sendSpy.called).toBe(true);
      expect(sendSpy.body).toEqual({
        error: 'Not found',
        statusCode: 404,
      });
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async operations', async () => {
      const mockRequest = {
        locale: 'en',
        log: { error: () => {} },
      };

      const mockReply = {
        status: () => mockReply,
        send: () => mockReply,
      } as unknown as FastifyReply;

      const handler = asyncHandler(async (request, reply, locale) => {
        expect(locale).toBe('en');
        return 'success';
      });

      await handler(mockRequest, mockReply);
    });

    it('should catch and handle errors', async () => {
      const mockRequest = {
        locale: 'en',
        log: { error: () => {} },
      };

      let errorStatus = 0;
      let errorBody: any = null;

      const mockReply = {
        status: (code: number) => {
          errorStatus = code;
          return mockReply;
        },
        send: (body: any) => {
          errorBody = body;
          return mockReply;
        },
      } as unknown as FastifyReply;

      const handler = asyncHandler(async () => {
        throw new Error('Test error');
      });

      await handler(mockRequest, mockReply);

      expect(errorStatus).toBe(500);
      expect(errorBody).toHaveProperty('error');
      expect(errorBody).toHaveProperty('statusCode');
    });
  });
});
