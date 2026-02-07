import 'dotenv/config';
import type { OAuthProvider } from '../types/oauth.js';

// Detect if running in a cloud environment
const isCloudEnvironment = () => {
  return !!(
    process.env.AWS_REGION ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.ECS_CONTAINER_METADATA_URI ||
    process.env.KUBERNETES_SERVICE_HOST ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.AZURE_FUNCTIONS_ENVIRONMENT
  );
};

// Configure OAuth providers
const providers: Record<string, OAuthProvider> = {
  google: {
    name: 'google',
    displayName: 'Google',
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },
  github: {
    name: 'github',
    displayName: 'GitHub',
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  },
  microsoft: {
    name: 'microsoft',
    displayName: 'Microsoft',
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    enabled: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
  },
};

// Get list of enabled providers
const getEnabledProviders = () => {
  return Object.values(providers).filter((p) => p.enabled);
};

// Get database name based on environment
const getDatabaseName = () => {
  const baseName = process.env.DB_NAME || 'api_starter_db';
  const env = process.env.NODE_ENV || 'development';
  // Append _test suffix in test environment (matching database.cjs behavior)
  return env === 'test' ? `${baseName}_test` : baseName;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  isCloudEnvironment: isCloudEnvironment(),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: getDatabaseName(),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  },
  oauth: {
    providers,
    enabledProviders: getEnabledProviders(),
    // Keep legacy google config for backward compatibility
    google: providers.google,
  },
  appUrl: process.env.APP_URL || 'http://localhost:3000',
};
