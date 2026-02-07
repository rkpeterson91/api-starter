# API Starter

A modern Node.js API template with TypeScript, Fastify, PostgreSQL, and OpenAPI docs. Features optional Google OAuth2, i18n support, and a production-ready setup.

## 🚀 One-Command Setup

```bash
./scripts/quickstart.sh
```

This interactive script will:

- Copy `.env.example` to `.env`
- Optionally configure Google OAuth
- Install dependencies
- Create databases
- Get you ready to code!

## ✨ Quick Start (Manual)

```bash
# 1. Use correct Node version
nvm use

# 2. Setup environment and databases
pnpm setup

# 3. Start development server
pnpm dev
```

Visit **http://localhost:3000/documentation** for interactive API docs! 📚

## 📋 Prerequisites

- **Node.js** 24.13.0 (use `nvm`)
- **PostgreSQL** (running locally or via Docker)
- **pnpm** package manager

### PostgreSQL Setup

Default configuration uses `postgres` superuser. To create it:

```bash
# Check if exists
psql -U postgres -d postgres -c "SELECT 1;"

# Create if needed
psql -U $(whoami) -d postgres -c "CREATE USER postgres WITH SUPERUSER PASSWORD 'postgres';"
```

## 🔐 Authentication

### Option 1: Development Token (No OAuth Required)

Perfect for quick testing without OAuth setup:

```bash
curl -X POST http://localhost:3000/auth/dev/token \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","name":"Test User"}'
```

Use the returned token in subsequent requests:

```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Option 2: Google OAuth (Optional)

1. Get credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
3. Login via: `http://localhost:3000/auth/google`

**Note**: OAuth is optional - the API works perfectly without it using `/auth/dev/token`

## 🛠️ Available Commands

| Command                  | Description                         |
| ------------------------ | ----------------------------------- |
| `pnpm dev`               | Start dev server with hot reload    |
| `pnpm test`              | Run test suite                      |
| `pnpm test:coverage`     | Run tests with coverage             |
| `pnpm build`             | Build for production                |
| `pnpm start`             | Start production server             |
| `pnpm setup`             | Install deps + create databases     |
| `pnpm db:init`           | Create/verify databases             |
| `pnpm docker:up`         | Start with Docker                   |
| `./scripts/customize.sh` | Customize template for your project |

## 🐳 Docker

Quick start with Docker (no local PostgreSQL needed):

```bash
pnpm docker:up    # Start
pnpm docker:logs  # View logs
pnpm docker:down  # Stop
```

See [DOCKER.md](DOCKER.md) for CI/CD setup with GitHub Actions.

## 🌍 Internationalization

Built-in i18n support with translations for user-facing messages:

- **English** (en)
- **Spanish** (es)
- **French** (fr)

Language auto-detected from `Accept-Language` header.

## 📁 Project Structure

```
src/
├── config/         # Environment configuration
├── database/       # Database connection & setup
├── i18n/          # Translations
├── models/        # Sequelize models
├── plugins/       # Fastify plugins (auth, swagger)
├── routes/        # API route handlers
├── schemas/       # Shared JSON schemas
├── utils/         # Helper utilities
└── __tests__/     # Test files
```

## 🔧 Customizing This Template

Run the customize script to make it yours:

```bash
./scripts/customize.sh
```

This will:

- Update project name and description
- Rename database
- Simplify README
- Prepare for your own git repo

## ⚙️ Environment Variables

Key variables in `.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (postgres user recommended for consistency)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=api_starter_db
DB_USER=postgres
DB_PASSWORD=postgres

# Auth
JWT_SECRET=change-this-in-production  # Generate: openssl rand -base64 32
APP_URL=http://localhost:3000

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
```

**🔒 Security Note**: Always change `JWT_SECRET` in production!

## 🧪 Testing

Tests use a separate `api_starter_db_test` database.

```bash
pnpm test              # Run once
pnpm test:coverage     # With coverage report
```

Default test credentials: `postgres`/`postgres` (configurable in [vitest.config.ts](vitest.config.ts))

## 📚 API Documentation

**Interactive Swagger UI**: http://localhost:3000/documentation

Features:

- All endpoints with examples
- Request/response schemas
- Try-it-out functionality
- JWT authentication
- Multi-language error messages

## 🏗️ Tech Stack

- **Framework**: Fastify 5.x
- **Language**: TypeScript + ES2022 modules
- **Database**: PostgreSQL + Sequelize ORM
- **Auth**: JWT + OAuth2 (Google)
- **Testing**: Vitest + Coverage
- **API Docs**: OpenAPI 3.0 / Swagger UI
- **Code Quality**: Prettier + Husky

## 📖 Additional Documentation

- [DOCKER.md](DOCKER.md) - Docker & GitHub Actions CI/CD
- [GITHUB_SETUP.md](GITHUB_SETUP.md) - GitHub container registry setup
- [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) - AWS deployment with migrations

## 🤝 Contributing

This is a starter template - fork it and make it your own!

---

## 📝 Appendix: Google OAuth Setup (Optional)

<details>
<summary>Click to expand detailed OAuth setup instructions</summary>

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

### 3. Add to .env

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 4. Test OAuth

Visit `http://localhost:3000/auth/google` to login

</details>

---

## 🐛 Troubleshooting

<details>
<summary>Click to expand troubleshooting tips</summary>

### PostgreSQL Connection Issues

```bash
# Verify postgres user exists
psql -U postgres -d postgres -c "SELECT 1;"

# Create if needed
psql -U $(whoami) -d postgres -c "CREATE USER postgres WITH SUPERUSER PASSWORD 'postgres';"

# Manually create databases
psql -U postgres -d postgres -c "CREATE DATABASE api_starter_db;"
psql -U postgres -d postgres -c "CREATE DATABASE api_starter_db_test;"
```

### Port Already in Use

Change `PORT` in `.env` to use a different port.

### OAuth Not Working

1. Check `/auth/status` endpoint
2. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
3. Use `/auth/dev/token` as alternative for testing

### Docker Issues

```bash
# View logs
docker-compose logs -f api

# Rebuild from scratch
pnpm docker:down
docker-compose build --no-cache
pnpm docker:up
```

</details>
```

Run tests with coverage:

```bash
pnpm test:coverage
```

## License

ISC
