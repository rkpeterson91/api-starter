/**
 * OAuth Provider Adapters
 *
 * These adapters normalize user information from different OAuth providers
 * into a common format.
 */

import type { OAuthUserInfo, ProviderName } from '../types/oauth.js';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

interface GitHubUserInfo {
  id: number;
  email: string | null;
  name: string | null;
  login: string;
  avatar_url: string;
}

interface MicrosoftUserInfo {
  id: string;
  userPrincipalName: string;
  displayName: string;
  mail?: string;
}

/**
 * Fetch user info from Google
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  const data = (await response.json()) as GoogleUserInfo;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

/**
 * Fetch user info from GitHub
 */
export async function fetchGitHubUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  // Get user profile
  const profileResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!profileResponse.ok) {
    throw new Error('Failed to fetch GitHub user info');
  }

  const profile = (await profileResponse.json()) as GitHubUserInfo;

  // GitHub might not provide email in profile, fetch from emails endpoint
  let email = profile.email;
  if (!email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      const primaryEmail = emails.find((e) => e.primary && e.verified);
      email = primaryEmail?.email || emails[0]?.email;
    }
  }

  if (!email) {
    throw new Error('No email found in GitHub account');
  }

  return {
    id: String(profile.id),
    email,
    name: profile.name || profile.login,
    picture: profile.avatar_url,
  };
}

/**
 * Fetch user info from Microsoft
 */
export async function fetchMicrosoftUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Microsoft user info');
  }

  const data = (await response.json()) as MicrosoftUserInfo;

  return {
    id: data.id,
    email: data.mail || data.userPrincipalName,
    name: data.displayName,
  };
}

/**
 * Provider-specific user info fetchers
 */
export const providerAdapters = {
  google: fetchGoogleUserInfo,
  github: fetchGitHubUserInfo,
  microsoft: fetchMicrosoftUserInfo,
};

/**
 * Fetch user info from any supported provider
 */
export async function fetchProviderUserInfo(
  provider: ProviderName,
  accessToken: string
): Promise<OAuthUserInfo> {
  const fetcher = providerAdapters[provider];
  if (!fetcher) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return fetcher(accessToken);
}
