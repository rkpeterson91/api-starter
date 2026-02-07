# API Guide

Detailed documentation for API endpoints and usage examples.

## 📚 Interactive Documentation

**Swagger UI**: http://localhost:3000/documentation

The interactive docs include:

- All endpoints with descriptions and examples
- Request/response schemas with validation rules
- Try-it-out functionality to test endpoints directly
- Authentication setup (JWT Bearer tokens)
- OpenAPI 3.0 spec at `/documentation/json`

## 🔐 Authentication Flow

### Production Flow (OAuth)

Supports multiple OAuth providers: Google, GitHub, Microsoft

1. **Check Providers**: GET `/auth/providers` to see available providers
2. **Login**: Navigate to `/auth/{provider}/callback` (e.g., `/auth/google/callback`)
3. **Authorize**: Sign in with your chosen OAuth provider
4. **Redirect**: After successful login, you'll receive a JWT token
5. **Cookie**: Refresh token automatically stored in httpOnly cookie (7 days)
6. **Use Token**: Include JWT in `Authorization: Bearer <token>` header

### Development Flow (Test Tokens)

For local development without OAuth:

```bash
# Generate a test token
curl -X POST http://localhost:3000/auth/dev/token \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Response includes token for testing
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com"
  }
}
```

**Note**: `/auth/dev/token` is only available when `NODE_ENV=development`

## 📍 API Endpoints

### Health Check

- `GET /health` - Check if the server is running

**Example:**

```bash
curl http://localhost:3000/health
```

### Authentication Endpoints

#### Get Available OAuth Providers

```bash
curl http://localhost:3000/auth/providers

# Response
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

#### Login with OAuth Provider (Browser)

```bash
# Visit in browser (use any configured provider):
http://localhost:3000/auth/google/callback
http://localhost:3000/auth/github/callback
http://localhost:3000/auth/microsoft/callback
```

#### Generate Development Token

```bash
curl -X POST http://localhost:3000/auth/dev/token \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","name":"Dev User"}'
```

#### Get Current User

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Logout

```bash
curl -X POST http://localhost:3000/auth/logout
```

### User CRUD Operations

**All user routes require JWT authentication**

#### Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Response (201 Created)
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "oauthProvider": null,
  "oauthId": null,
  "createdAt": "2026-01-31T12:00:00.000Z",
  "updatedAt": "2026-01-31T12:00:00.000Z"
}
```

#### Get All Users

```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response (200 OK)
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "oauthProvider": null,
    "oauthId": null,
    "createdAt": "2026-01-31T12:00:00.000Z",
    "updatedAt": "2026-01-31T12:00:00.000Z"
  }
]
```

#### Get User by ID

```bash
curl http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response (200 OK)
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "oauthProvider": null,
  "oauthId": null,
  "createdAt": "2026-01-31T12:00:00.000Z",
  "updatedAt": "2026-01-31T12:00:00.000Z"
}
```

#### Update User

```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Jane Doe","email":"jane@example.com"}'

# Response (200 OK)
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "oauthProvider": null,
  "oauthId": null,
  "createdAt": "2026-01-31T12:00:00.000Z",
  "updatedAt": "2026-01-31T12:00:10.000Z"
}
```

#### Delete User

```bash
curl -X DELETE http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response (204 No Content)
```

### Admin Operations (RBAC)

**Admin-only routes requiring admin role**

#### List All Users

```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Response (200 OK)
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "createdAt": "2026-02-07T12:00:00.000Z",
    "updatedAt": "2026-02-07T12:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Regular User",
    "email": "user@example.com",
    "role": "user",
    "createdAt": "2026-02-07T12:10:00.000Z",
    "updatedAt": "2026-02-07T12:10:00.000Z"
  }
]
```

#### Update User Role

```bash
curl -X PATCH http://localhost:3000/api/admin/users/2/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"role":"admin"}'

# Response (200 OK)
{
  "id": 2,
  "name": "Regular User",
  "email": "user@example.com",
  "role": "admin",
  "createdAt": "2026-02-07T12:10:00.000Z",
  "updatedAt": "2026-02-07T12:15:00.000Z"
}

# Error response for non-admin (403 Forbidden)
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Access denied. Required role: admin"
}
```

#### Delete User (Admin)

```bash
curl -X DELETE http://localhost:3000/api/admin/users/2 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Response (200 OK)
{
  "message": "User deleted successfully"
}

# Cannot delete yourself (400 Bad Request)
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Cannot delete your own account"
}
```

## 🌍 Internationalization

The API supports multiple languages for error messages:

```bash
# English (default)
curl http://localhost:3000/api/users/999 \
  -H "Authorization: Bearer YOUR_TOKEN"
# Response: {"error": "User not found"}

# Spanish
curl http://localhost:3000/api/users/999 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept-Language: es"
# Response: {"error": "Usuario no encontrado"}

# French
curl http://localhost:3000/api/users/999 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept-Language: fr"
# Response: {"error": "Utilisateur non trouvé"}
```

Supported languages: English (en), Spanish (es), French (fr)

## 🔒 Security Best Practices

1. **JWT Tokens**: Access tokens expire after 7 days
2. **Refresh Tokens**: Stored in httpOnly cookies (secure in production)
3. **HTTPS**: Always use HTTPS in production for OAuth
4. **Token Storage**: Never store JWT tokens in localStorage (use httpOnly cookies)
5. **CORS**: Configure CORS appropriately for your frontend domain

## ⚡ Performance Tips

1. **Connection Pooling**: Database connections are pooled (max: 10, min: 2)
2. **Optimized Queries**: Single-query updates and deletes
3. **Rate Limiting**: Consider adding rate limiting for production
4. **Caching**: Consider Redis for session/token caching in production

## 📝 Response Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Invalid request body/parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions (RBAC)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - OAuth not configured

## 🧪 Testing the API

Use the development token endpoint for quick testing:

```bash
# 1. Generate token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/dev/token \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}' | jq -r '.token')

# 2. Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# 3. Get all users
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
```
