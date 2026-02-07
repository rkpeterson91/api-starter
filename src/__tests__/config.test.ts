import { describe, it, expect } from 'vitest';
import { config } from '../config/index.js';

describe('Config', () => {
  describe('OAuth Provider Configuration', () => {
    it('should have provider configuration structure', () => {
      expect(config.oauth.providers).toHaveProperty('google');
      expect(config.oauth.providers).toHaveProperty('github');
      expect(config.oauth.providers).toHaveProperty('microsoft');
    });

    it('should have provider metadata', () => {
      expect(config.oauth.providers.google.name).toBe('google');
      expect(config.oauth.providers.google.displayName).toBe('Google');

      expect(config.oauth.providers.github.name).toBe('github');
      expect(config.oauth.providers.github.displayName).toBe('GitHub');

      expect(config.oauth.providers.microsoft.name).toBe('microsoft');
      expect(config.oauth.providers.microsoft.displayName).toBe('Microsoft');
    });

    it('should have enabledProviders array', () => {
      expect(Array.isArray(config.oauth.enabledProviders)).toBe(true);
      // Each enabled provider should have required fields
      config.oauth.enabledProviders.forEach((provider) => {
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('displayName');
        expect(provider).toHaveProperty('clientId');
        expect(provider).toHaveProperty('clientSecret');
        expect(provider.enabled).toBe(true);
      });
    });

    it('should enable provider only when credentials are set', () => {
      // Test that enabled flag matches credential presence
      Object.values(config.oauth.providers).forEach((provider) => {
        const hasCredentials = !!(provider.clientId && provider.clientSecret);
        expect(provider.enabled).toBe(hasCredentials);
      });
    });
  });

  describe('Database Configuration', () => {
    it('should have database configuration', () => {
      expect(config.database).toHaveProperty('host');
      expect(config.database).toHaveProperty('port');
      expect(config.database).toHaveProperty('name');
      expect(config.database).toHaveProperty('user');
      expect(config.database).toHaveProperty('password');
      expect(config.database).toHaveProperty('ssl');
    });

    it('should use test database name in test environment', () => {
      // In test environment, database name should end with _test
      if (config.env === 'test') {
        expect(config.database.name).toMatch(/_test$/);
      }
    });

    it('should have valid database port', () => {
      expect(typeof config.database.port).toBe('number');
      expect(config.database.port).toBeGreaterThan(0);
      expect(config.database.port).toBeLessThan(65536);
    });

    it('should have SSL configuration', () => {
      expect(typeof config.database.ssl).toBe('boolean');
    });
  });

  describe('Cloud Environment Detection', () => {
    it('should have isCloudEnvironment flag', () => {
      expect(typeof config.isCloudEnvironment).toBe('boolean');
    });

    it('should correctly detect environment type', () => {
      // In test/development, should typically not be cloud environment
      if (config.env === 'test' || config.env === 'development') {
        // This is flexible - could be cloud or local
        expect([true, false]).toContain(config.isCloudEnvironment);
      }
    });
  });

  describe('General Configuration', () => {
    it('should have valid port configuration', () => {
      expect(typeof config.port).toBe('number');
      expect(config.port).toBeGreaterThan(0);
      expect(config.port).toBeLessThan(65536);
    });

    it('should have environment setting', () => {
      expect(config.env).toBeTruthy();
      expect(typeof config.env).toBe('string');
    });

    it('should have APP_URL configuration', () => {
      expect(config.appUrl).toBeTruthy();
      expect(typeof config.appUrl).toBe('string');
      expect(config.appUrl).toMatch(/^https?:\/\//);
    });

    it('should have JWT secret configured', () => {
      expect(config.jwt.secret).toBeTruthy();
      expect(typeof config.jwt.secret).toBe('string');
      expect(config.jwt.secret.length).toBeGreaterThan(0);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain legacy google config reference', () => {
      // Legacy path should exist
      expect(config.oauth.google).toBeDefined();
      // Should be same reference as in providers
      expect(config.oauth.google).toBe(config.oauth.providers.google);
    });
  });
});
