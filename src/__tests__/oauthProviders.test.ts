import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchGoogleUserInfo,
  fetchGitHubUserInfo,
  fetchMicrosoftUserInfo,
  fetchProviderUserInfo,
} from '../utils/oauthProviders.js';

// Mock the global fetch
global.fetch = vi.fn();

describe('OAuth Provider Adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchGoogleUserInfo', () => {
    it('should fetch and normalize Google user info', async () => {
      const mockGoogleResponse = {
        id: 'google-123',
        email: 'user@gmail.com',
        verified_email: true,
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleResponse,
      });

      const result = await fetchGoogleUserInfo('mock-token');

      expect(global.fetch).toHaveBeenCalledWith('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: 'Bearer mock-token' },
      });

      expect(result).toEqual({
        id: 'google-123',
        email: 'user@gmail.com',
        name: 'John Doe',
        picture: 'https://example.com/photo.jpg',
      });
    });

    it('should throw error when Google API fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await expect(fetchGoogleUserInfo('invalid-token')).rejects.toThrow(
        'Failed to fetch Google user info'
      );
    });
  });

  describe('fetchGitHubUserInfo', () => {
    it('should fetch and normalize GitHub user info with email in profile', async () => {
      const mockGitHubProfile = {
        id: 12345,
        email: 'user@github.com',
        name: 'Jane Smith',
        login: 'janesmith',
        avatar_url: 'https://github.com/avatar.jpg',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubProfile,
      });

      const result = await fetchGitHubUserInfo('mock-token');

      expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/user', {
        headers: {
          Authorization: 'Bearer mock-token',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      expect(result).toEqual({
        id: '12345',
        email: 'user@github.com',
        name: 'Jane Smith',
        picture: 'https://github.com/avatar.jpg',
      });
    });

    it('should fetch email separately when not in profile', async () => {
      const mockGitHubProfile = {
        id: 12345,
        email: null,
        name: 'Jane Smith',
        login: 'janesmith',
        avatar_url: 'https://github.com/avatar.jpg',
      };

      const mockEmails = [
        { email: 'secondary@example.com', primary: false, verified: true },
        { email: 'primary@example.com', primary: true, verified: true },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubProfile,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmails,
        });

      const result = await fetchGitHubUserInfo('mock-token');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://api.github.com/user/emails', {
        headers: {
          Authorization: 'Bearer mock-token',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      expect(result.email).toBe('primary@example.com');
    });

    it('should use login as name when name is not provided', async () => {
      const mockGitHubProfile = {
        id: 12345,
        email: 'user@github.com',
        name: null,
        login: 'cooluser',
        avatar_url: 'https://github.com/avatar.jpg',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubProfile,
      });

      const result = await fetchGitHubUserInfo('mock-token');

      expect(result.name).toBe('cooluser');
    });

    it('should throw error when no email is found', async () => {
      const mockGitHubProfile = {
        id: 12345,
        email: null,
        name: 'Jane Smith',
        login: 'janesmith',
        avatar_url: 'https://github.com/avatar.jpg',
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubProfile,
        })
        .mockResolvedValueOnce({
          ok: false,
        });

      await expect(fetchGitHubUserInfo('mock-token')).rejects.toThrow(
        'No email found in GitHub account'
      );
    });

    it('should throw error when GitHub API fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await expect(fetchGitHubUserInfo('invalid-token')).rejects.toThrow(
        'Failed to fetch GitHub user info'
      );
    });
  });

  describe('fetchMicrosoftUserInfo', () => {
    it('should fetch and normalize Microsoft user info with mail field', async () => {
      const mockMicrosoftResponse = {
        id: 'microsoft-abc123',
        userPrincipalName: 'user@company.com',
        displayName: 'Bob Johnson',
        mail: 'bob.johnson@company.com',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMicrosoftResponse,
      });

      const result = await fetchMicrosoftUserInfo('mock-token');

      expect(global.fetch).toHaveBeenCalledWith('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: 'Bearer mock-token' },
      });

      expect(result).toEqual({
        id: 'microsoft-abc123',
        email: 'bob.johnson@company.com',
        name: 'Bob Johnson',
      });
    });

    it('should use userPrincipalName when mail is not provided', async () => {
      const mockMicrosoftResponse = {
        id: 'microsoft-abc123',
        userPrincipalName: 'user@company.onmicrosoft.com',
        displayName: 'Bob Johnson',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMicrosoftResponse,
      });

      const result = await fetchMicrosoftUserInfo('mock-token');

      expect(result.email).toBe('user@company.onmicrosoft.com');
    });

    it('should throw error when Microsoft API fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await expect(fetchMicrosoftUserInfo('invalid-token')).rejects.toThrow(
        'Failed to fetch Microsoft user info'
      );
    });
  });

  describe('fetchProviderUserInfo', () => {
    it('should route to correct provider adapter for Google', async () => {
      const mockGoogleResponse = {
        id: 'google-123',
        email: 'user@gmail.com',
        verified_email: true,
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleResponse,
      });

      const result = await fetchProviderUserInfo('google', 'mock-token');

      expect(result.id).toBe('google-123');
      expect(result.email).toBe('user@gmail.com');
    });

    it('should route to correct provider adapter for GitHub', async () => {
      const mockGitHubProfile = {
        id: 12345,
        email: 'user@github.com',
        name: 'Jane Smith',
        login: 'janesmith',
        avatar_url: 'https://github.com/avatar.jpg',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubProfile,
      });

      const result = await fetchProviderUserInfo('github', 'mock-token');

      expect(result.id).toBe('12345');
      expect(result.email).toBe('user@github.com');
    });

    it('should route to correct provider adapter for Microsoft', async () => {
      const mockMicrosoftResponse = {
        id: 'microsoft-abc123',
        userPrincipalName: 'user@company.com',
        displayName: 'Bob Johnson',
        mail: 'bob.johnson@company.com',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMicrosoftResponse,
      });

      const result = await fetchProviderUserInfo('microsoft', 'mock-token');

      expect(result.id).toBe('microsoft-abc123');
      expect(result.email).toBe('bob.johnson@company.com');
    });

    it('should throw error for unsupported provider', async () => {
      await expect(fetchProviderUserInfo('invalid' as any, 'mock-token')).rejects.toThrow(
        'Unsupported provider: invalid'
      );
    });
  });
});
