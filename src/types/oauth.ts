/**
 * OAuth Provider Configuration and Types
 */

export interface OAuthProvider {
  name: string;
  displayName: string;
  clientId: string;
  clientSecret: string;
  enabled: boolean;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export type ProviderName = 'google' | 'github' | 'microsoft';
