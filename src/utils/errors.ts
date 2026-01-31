/**
 * Error handling utilities
 * Provides centralized error handling to eliminate repetitive try-catch blocks
 */

import { FastifyReply } from 'fastify';
import { getMessages, type Locale } from '../i18n/messages.js';

export interface ErrorResponse {
  error: string;
  statusCode: number;
}

/**
 * Send standardized error response
 */
export const sendError = (
  reply: FastifyReply,
  statusCode: number,
  message: string
): FastifyReply => {
  return reply.status(statusCode).send({
    error: message,
    statusCode,
  });
};

/**
 * Route handler wrapper that catches errors and formats responses
 */
export const asyncHandler = <T>(
  handler: (request: any, reply: FastifyReply, locale: Locale) => Promise<T>
) => {
  return async (request: any, reply: FastifyReply): Promise<void> => {
    try {
      const locale = request.locale as Locale;
      await handler(request, reply, locale);
    } catch (error) {
      request.log.error(error);
      const messages = getMessages(request.locale);
      return sendError(reply, 500, messages.errors.authenticationFailed);
    }
  };
};
