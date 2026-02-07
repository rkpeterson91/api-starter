# Multi-Provider OAuth Support

This API now supports multiple OAuth providers through a flexible abstraction layer.

## Supported Providers

- **Google** - OAuth 2.0 with Google Sign-In
- **GitHub** - OAuth 2.0 with GitHub authentication
- **Microsoft** - OAuth 2.0 with Microsoft Account

## Configuration

Configure OAuth providers in your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

Only providers with configured credentials will be enabled.

## API Endpoints

### Get Available Providers

```http
GET /auth/providers
```

Returns an array of enabled OAuth providers:

```json
{
  "providers": [
    {
      "name": "google",
      "displayName": "Google",
      "loginUrl": "/auth/google/callback"
    },
    {
      "name": "github",
      "displayName": "GitHub",
      "loginUrl": "/auth/github/callback"
    }
  ]
}
```

### OAuth Callback

Each provider has its own callback endpoint:

```http
GET /auth/google/callback
GET /auth/github/callback
GET /auth/microsoft/callback
```

These endpoints handle the OAuth flow and return a JWT token.

### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

Returns the authenticated user's profile.

### Logout

```http
POST /auth/logout
Authorization: Bearer <token>
```

Logs out the user and clears session cookies.

## Architecture

### Provider Abstraction

The system uses a provider adapter pattern to normalize different OAuth APIs:

1. **Types** (`src/types/oauth.ts`) - Common interfaces for OAuth data
2. **Provider Adapters** (`src/utils/oauthProviders.ts`) - Normalize provider-specific responses
3. **Auth Plugin** (`src/plugins/auth.ts`) - Dynamic provider registration
4. **Auth Routes** (`src/routes/auth/index.ts`) - Generic OAuth handling

### Database Schema

Users are stored with generic OAuth fields:

- `oauth_provider` - Provider name (google, github, microsoft)
- `oauth_id` - User ID from the OAuth provider
- `oauth_access_token` - Current access token
- `oauth_refresh_token` - Refresh token (if available)
- `oauth_token_expires_at` - Token expiration timestamp

## Adding New Providers

To add a new OAuth provider:

1. Add provider configuration to `src/config/index.ts`
2. Create a provider adapter in `src/utils/oauthProviders.ts`
3. Add provider credentials to `.env`
4. Update the `ProviderName` type in `src/types/oauth.ts`

Example adapter:

```typescript
export async function fetchNewProviderUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const response = await fetch('https://provider.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();

  return {
    id: data.id,
    email: data.email,
    name: data.name || data.email.split('@')[0],
    picture: data.avatar_url,
  };
}
```

## Testing

The auth routes include comprehensive tests covering:

- Provider availability
- Dev token generation
- User authentication
- Token validation
- Logout functionality

Run tests with:

```bash
pnpm test
```

## Migration from Google-only

If you have existing users with the old Google-only authentication, they will continue to work. The system maintains backward compatibility with the legacy Google OAuth fields.

The migration automatically adds the new OAuth fields to the database while preserving existing data.
