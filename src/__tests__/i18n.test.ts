import { describe, it, expect } from 'vitest';
import { getMessages, getLocaleFromHeader } from '../i18n/messages.js';

describe('i18n Messages', () => {
  describe('getMessages', () => {
    it('should return English messages by default', () => {
      const messages = getMessages();
      expect(messages.errors.userNotFound).toBe('User not found');
    });

    it('should return Spanish messages when locale is es', () => {
      const messages = getMessages('es');
      expect(messages.errors.userNotFound).toBe('Usuario no encontrado');
    });

    it('should return French messages when locale is fr', () => {
      const messages = getMessages('fr');
      expect(messages.errors.userNotFound).toBe('Utilisateur non trouvé');
    });

    it('should have all required error messages', () => {
      const messages = getMessages('en');
      expect(messages.errors).toHaveProperty('userNotFound');
      expect(messages.errors).toHaveProperty('failedToCreateUser');
      expect(messages.errors).toHaveProperty('failedToFetchUsers');
      expect(messages.errors).toHaveProperty('failedToFetchUser');
      expect(messages.errors).toHaveProperty('failedToUpdateUser');
      expect(messages.errors).toHaveProperty('failedToDeleteUser');
      expect(messages.errors).toHaveProperty('emailRequired');
      expect(messages.errors).toHaveProperty('authenticationFailed');
      expect(messages.errors).toHaveProperty('googleOAuthNotConfigured');
      expect(messages.errors).toHaveProperty('failedToFetchGoogleUserInfo');
      expect(messages.errors).toHaveProperty('unauthorized');
      expect(messages.errors).toHaveProperty('invalidToken');
    });

    it('should have all required success messages', () => {
      const messages = getMessages('en');
      expect(messages.success).toHaveProperty('loggedOutSuccessfully');
      expect(messages.success).toHaveProperty('userCreated');
      expect(messages.success).toHaveProperty('userUpdated');
      expect(messages.success).toHaveProperty('userDeleted');
    });

    it('should have all required validation messages', () => {
      const messages = getMessages('en');
      expect(messages.validation).toHaveProperty('invalidEmail');
      expect(messages.validation).toHaveProperty('nameRequired');
      expect(messages.validation).toHaveProperty('emailRequired');
    });
  });

  describe('getLocaleFromHeader', () => {
    it('should return en by default when no header', () => {
      const locale = getLocaleFromHeader();
      expect(locale).toBe('en');
    });

    it('should detect Spanish from es header', () => {
      const locale = getLocaleFromHeader('es');
      expect(locale).toBe('es');
    });

    it('should detect Spanish from es-MX header', () => {
      const locale = getLocaleFromHeader('es-MX');
      expect(locale).toBe('es');
    });

    it('should detect French from fr header', () => {
      const locale = getLocaleFromHeader('fr');
      expect(locale).toBe('fr');
    });

    it('should detect French from fr-FR header', () => {
      const locale = getLocaleFromHeader('fr-FR');
      expect(locale).toBe('fr');
    });

    it('should default to en for unsupported locales', () => {
      const locale = getLocaleFromHeader('de');
      expect(locale).toBe('en');
    });

    it('should handle complex Accept-Language headers', () => {
      const locale = getLocaleFromHeader('fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7');
      expect(locale).toBe('fr');
    });

    it('should handle en-US header', () => {
      const locale = getLocaleFromHeader('en-US');
      expect(locale).toBe('en');
    });

    it('should handle empty string', () => {
      const locale = getLocaleFromHeader('');
      expect(locale).toBe('en');
    });
  });
});
