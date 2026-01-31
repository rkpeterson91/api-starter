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

### Production Flow (Google OAuth)

1. **Login**: Navigate to `http://localhost:3000/auth/google`
2. **Authorize**: Sign in with your Google account
3. **Redirect**: After successful login, you'll receive a JWT token
4. **Cookie**: Refresh token automatically stored in httpOnly cookie (7 days)
5. **Use Token**: Include JWT in `Authorization: Bearer <token>` header

### Development Flow (Test Tokens)

For local development without Google OAuth:

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

#### Check OAuth Configuration

```bash
curl http://localhost:3000/auth/status

# Response
{
  "googleOAuthConfigured": true,
  "loginUrl": "/auth/google"
}
```

#### Login with Google (Browser)

```bash
# Visit in browser:
http://localhost:3000/auth/google
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
  "googleId": null,
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
    "googleId": null,
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
  "googleId": null,
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
  "googleId": null,
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
