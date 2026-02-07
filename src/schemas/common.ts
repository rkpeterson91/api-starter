/**
 * Common JSON schemas used across the API
 * Provides single source of truth for reusable schema definitions
 */

export const errorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    statusCode: { type: 'number' },
  },
} as const;

export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    oauthProvider: { type: ['string', 'null'] },
    oauthId: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export const userResponseSchema = {
  type: 'object',
  properties: {
    user: userSchema,
  },
} as const;

export const usersArraySchema = {
  type: 'array',
  items: userSchema,
} as const;

export const successSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
} as const;

export const tokenResponseSchema = {
  type: 'object',
  properties: {
    token: { type: 'string' },
    user: userSchema,
  },
} as const;

// Common parameter schemas
export const idParamSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
  },
  required: ['id'],
} as const;
