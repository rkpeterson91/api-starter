# API Starter

A barebones Node.js backend API built with TypeScript, Fastify, PostgreSQL, Sequelize, and Vitest. Includes Google OAuth2 authentication.

## Prerequisites

- Node.js 24.13.0 (managed via nvm)
- **PostgreSQL database** (must be installed and running)
- pnpm package manager
- **Google Cloud Console project** (for OAuth authentication)

## Quick Start (For New Developers)

If you're pulling down this repo for the first time:

```bash
# 1. Use the correct Node version
nvm use

# 2. Copy environment variables
cp .env.example .env

# 3. Edit .env with your PostgreSQL and Google OAuth credentials

# 4. Run setup (installs dependencies + creates databases)
pnpm setup

# 5. Start the server
pnpm dev
```

That's it! The API will be running on `http://localhost:3000`

**Alternative: Docker Setup**

If you prefer using Docker:
```bash
pnpm docker:up
```

See [DOCKER.md](DOCKER.md) for complete Docker and CI/CD setup instructions.

## Google OAuth Setup

### 1. Create Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**

### 2. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
5. Copy the **Client ID** and **Client Secret**

### 3. Configure Environment Variables

Update your `.env` file:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
JWT_SECRET=your-super-secret-jwt-key
APP_URL=http://localhost:3000
```

**Important**: Change `JWT_SECRET` to a long random string in production!

## Detailed Setup Instructions

### 1. Install Node.js version

```bash
nvm use
# If you don't have the version, install it:
# nvm install
```

### 2. Install pnpm (if not already installed)

```bash
npm install -g pnpm
```

### 3. Configure environment variables

Copy the example environment file and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env` and update the database configuration if needed (defaults work for local PostgreSQL):

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=api_starter_db
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
```

### 4. Quick Setup (Recommended)

Run the setup script to install dependencies and create databases automatically:

```bash
pnpm setup
```

This will:
- Install all dependencies
- Create both `api_starter_db` and `api_starter_db_test` databases (if they don't exist)

**OR** do it manually:

```bash
# Install dependencies
pnpm install

# Create databases (checks if they exist first)
pnpm db:init
```

### 5. Start the development server

```bash
pnpm dev
```

The server will start on `http://localhost:3000`

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build the TypeScript code to JavaScript
- `pnpm start` - Start the production server (requires build first)
- `pnpm test` - Run tests with Vitest (uses separate test database)
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm setup` - Install dependencies and initialize databases (one command setup)
- `pnpm db:init` - Initialize/create databases (development and test)
- `pnpm docker:build` - Build Docker image
- `pnpm docker:up` - Start application with Docker Compose
- `pnpm docker:down` - Stop Docker containers
- `pnpm docker:logs` - View Docker logs

## API Endpoints

### Health Check
- `GET /health` - Check if the server is running

### Authentication
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - OAuth callback (handled automatically)
- `GET /auth/me` - Get current authenticated user (requires JWT authentication)
- `POST /auth/logout` - Logout and clear refresh token cookie
- `GET /auth/status` - Check if Google OAuth is configured
- `POST /auth/dev/token` - Generate test token (development only)

### Users (CRUD Operations - Protected Routes)

**All user routes require authentication via JWT token in Authorization header**

- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a user by ID
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

## Authentication Flow

### Production Flow (Google OAuth)

1. **Login**: Navigate to `http://localhost:3000/auth/google` in your browser
2. **Authorize**: Sign in with your Google account
3. **Redirect**: After successful login, you'll be redirected with a JWT token
4. **Cookie Set**: A refresh token is automatically stored in an httpOnly cookie (valid for 7 days)
5. **Use Token**: Include the JWT token in the `Authorization: Bearer <token>` header for protected routes

### Development Flow (Test Tokens)

For local development without setting up Google OAuth, use the dev token endpoint:

```bash
# Generate a test token
curl -X POST http://localhost:3000/auth/dev/token \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Response includes token you can use for testing
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com"
  }
}
```

**Note**: The `/auth/dev/token` endpoint is only available when `NODE_ENV=development`

## Example API Usage

### Check OAuth Configuration
```bash
curl http://localhost:3000/auth/status
```

### Development: Generate Test Token
```bash
# For local development without Google OAuth setup
curl -X POST http://localhost:3000/auth/dev/token \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","name":"Dev User"}'

# Save the token from response for subsequent requests
```

### Production: Login with Google (Browser)
```bash
# Visit this URL in your browser:
http://localhost:3000/auth/google
# After login, extract the token from the response
```

### Get current user (with token)
```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Logout
```bash
curl -X POST http://localhost:3000/auth/logout
```

### Create a user (with token)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### Get all users (with token)
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get a user by ID (with token)
```bash
curl http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update a user
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe"}'
```

### Delete a user
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

## Project Structure

```
src/
├── __tests__/              # Test files
│   └── userRoutes.test.ts  # User routes tests
├── config/
│   └── index.ts            # Configuration management
├── database/
│   └── connection.ts       # Database connection
├── models/
│   ├── index.ts            # Model exports
│   └── User.ts             # User model with Google OAuth fields (googleId, tokens, etc.)
├── plugins/
│   └── auth.ts             # Authentication plugin (Google OAuth2, JWT, Cookie support)
├── routes/
│   ├── authRoutes.ts       # Authentication routes
│   └── userRoutes.ts       # User CRUD routes
├── scripts/
│   └── init-db.ts          # Database initialization script
├── index.ts                # Application entry point
└── server.ts               # Fastify server setup (auto-detects pino-pretty availability)

.github/
└── workflows/
    ├── ci.yml              # Automated testing workflow
    └── docker.yml          # Docker build and publish workflow

├── .dockerignore           # Docker build exclusions
├── .env.example            # Environment variables example
├── .env.docker             # Docker environment template
├── .nvmrc                  # Node version
├── docker-compose.yml      # Local Docker development setup
├── Dockerfile              # Multi-stage production Docker build
├── DOCKER.md               # Docker and CI/CD documentation
├── GITHUB_SETUP.md         # GitHub Actions setup guide
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vitest.config.ts        # Vitest configuration
```

## Troubleshooting

### Google OAuth Not Working

If OAuth authentication fails:

1. **Check OAuth Configuration**:
   ```bash
   curl http://localhost:3000/auth/status
   ```
   Should return `"googleOAuthConfigured": true`

2. **Verify Environment Variables**:
   - Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
   - Confirm `APP_URL` matches your development URL

3. **Use Development Token Instead**:
   ```bash
   curl -X POST http://localhost:3000/auth/dev/token \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

### PostgreSQL Connection Issues

If `pnpm db:init` fails:

1. **Ensure PostgreSQL is running**:
   ```bash
   brew services list | grep postgresql
   ```

2. **Check your PostgreSQL username**:
   ```bash
   whoami  # This is often your PostgreSQL username
   ```

3. **Update `.env` with correct credentials**:
   - Set `DB_USER` to your PostgreSQL username
   - Set `DB_PASSWORD` if your PostgreSQL user has a password

4. **Manually create databases** (if automatic creation fails):
   ```bash
   psql -U your_username -d postgres -c "CREATE DATABASE api_starter_db;"
   psql -U your_username -d postgres -c "CREATE DATABASE api_starter_db_test;"
   ```

### Port Already in Use

If port 3000 is already in use, change the `PORT` value in your `.env` file.

### Docker Container Restarting

If Docker containers are in a restart loop:

1. **Check container logs**:
   ```bash
   docker logs api-starter-api
   ```

2. **Common issues**:
   - Database connection failed: Verify `DB_HOST=postgres` in docker-compose.yml
   - Missing environment variables: Check docker-compose.yml environment section

3. **Rebuild containers**:
   ```bash
   pnpm docker:down
   pnpm docker:up
   ```

**Note**: The production Docker image doesn't include `pino-pretty` for logging. The server automatically detects this and uses standard JSON logging in containers.

## Technologies Used

- **TypeScript** - Type-safe JavaScript
- **Fastify** - Fast and low overhead web framework
- **PostgreSQL** - Relational database
- **Sequelize** - ORM for database operations
- **Vitest** - Fast unit testing framework
- **pnpm** - Fast, disk space efficient package manager
- **nvm** - Node version management
- **@fastify/oauth2** - Google OAuth2 authentication
- **@fastify/jwt** - JWT token management
- **@fastify/cookie** - Cookie-based session management

## Security Notes

1. **Never commit your `.env` file** - It contains sensitive credentials
2. **Change JWT_SECRET in production** - Use a long, random string (32+ characters)
3. **Use HTTPS in production** - OAuth requires HTTPS for security
4. **Rotate secrets regularly** - Update JWT secrets and OAuth credentials periodically
5. **Validate redirect URIs** - Ensure your Google Console redirect URIs match your deployment URLs
6. **Development token endpoint** - The `/auth/dev/token` endpoint is automatically disabled in production
7. **Cookie security** - Refresh tokens use httpOnly cookies with secure flag in production
8. **JWT expiration** - Access tokens expire after 7 days, requiring re-authentication

## Testing

Run the test suite:

```bash
pnpm test
```

Run tests with coverage:

```bash
pnpm test:coverage
```

## License

ISC
