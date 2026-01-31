# Setup Guide

Comprehensive setup instructions for different scenarios.

## 🚀 Quick Setup (Recommended)

```bash
# 1. Use correct Node version
nvm use

# 2. Run interactive setup
./scripts/quickstart.sh

# 3. Start development
pnpm dev
```

The quickstart script will guide you through configuration!

## 📋 Manual Setup

### 1. Node.js Installation

```bash
# Check if nvm is installed
nvm --version

# Install nvm if needed (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use project's Node version
nvm use

# If version not installed
nvm install
```

### 2. Package Manager

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### 3. PostgreSQL Setup

#### Option A: Local PostgreSQL

**macOS:**

```bash
# Install via Homebrew
brew install postgresql@15

# Start service
brew services start postgresql@15

# Check if running
brew services list | grep postgresql
```

**Linux (Ubuntu/Debian):**

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

**Windows:**

- Download installer from [PostgreSQL.org](https://www.postgresql.org/download/windows/)
- Run installer and follow wizard
- Add `C:\Program Files\PostgreSQL\15\bin` to PATH

#### Option B: Docker PostgreSQL

```bash
# Run PostgreSQL in container
docker run -d \
  --name postgres-dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine

# Verify running
docker ps | grep postgres-dev
```

### 4. Database User Setup

The project uses `postgres` superuser by default for consistency across dev/test/CI.

**Check if postgres user exists:**

```bash
psql -U postgres -d postgres -c "SELECT 1;"
```

**If user doesn't exist, create it:**

```bash
# Replace $(whoami) with your PostgreSQL username if different
psql -U $(whoami) -d postgres -c "CREATE USER postgres WITH SUPERUSER PASSWORD 'postgres';"

# Verify
psql -U postgres -d postgres -c "SELECT version();"
```

**Alternative: Use your own PostgreSQL user**

If you prefer not using `postgres` superuser:

1. Update `.env`:

   ```env
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

2. Create `.env.test`:

   ```env
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

3. Update [vitest.config.ts](vitest.config.ts) defaults to match

### 5. Environment Configuration

```bash
# Copy example file
cp .env.example .env

# Edit with your preferred editor
nano .env  # or: vim .env, code .env
```

**Minimal configuration (.env):**

```env
NODE_ENV=development
PORT=3000

# Database (defaults work with postgres user)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=api_starter_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=change-this-to-a-long-random-string

# App URL
APP_URL=http://localhost:3000

# OAuth (Optional - leave blank to skip)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**Generate secure JWT secret:**

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Add to .env
JWT_SECRET=<generated-string>
```

### 6. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Verify installation
pnpm list
```

### 7. Create Databases

```bash
# Automatic (creates both dev and test databases)
pnpm db:init

# Manual creation
psql -U postgres -d postgres -c "CREATE DATABASE api_starter_db;"
psql -U postgres -d postgres -c "CREATE DATABASE api_starter_db_test;"

# Verify databases exist
psql -U postgres -d postgres -c "\l" | grep api_starter
```

### 8. Start Development Server

```bash
# Start with hot reload
pnpm dev

# Server should start on http://localhost:3000
```

**Verify it works:**

```bash
# Test health endpoint
curl http://localhost:3000/health

# View API docs
open http://localhost:3000/documentation
```

## 🐳 Docker Setup

### Local Development with Docker

```bash
# Start PostgreSQL + API
pnpm docker:up

# View logs
pnpm docker:logs

# Stop containers
pnpm docker:down
```

**Using Docker only for PostgreSQL:**

```bash
# Start just PostgreSQL
docker-compose up -d postgres

# Run API locally
pnpm dev

# When done
docker-compose down
```

### Custom Docker Setup

**Edit docker-compose.yml:**

```yaml
services:
  postgres:
    environment:
      POSTGRES_DB: my_custom_db
      POSTGRES_USER: my_user
      POSTGRES_PASSWORD: my_password
```

**Update .env.docker accordingly**

## 🔐 Google OAuth Setup (Optional)

### Step 1: Create Google Cloud Project

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "My API")
4. Click "Create"

### Step 2: Enable APIs

1. Navigate to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (for testing) or "Internal" (for organization)
3. Fill in required fields:
   - App name
   - User support email
   - Developer contact email
4. Add scopes: `profile`, `email`
5. Add test users (for External apps)
6. Click "Save and Continue"

### Step 4: Create Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "My API Local Dev"
5. Authorized redirect URIs:
   - **Development**: `http://localhost:3000/auth/google/callback`
   - **Production**: `https://yourdomain.com/auth/google/callback`
6. Click "Create"
7. **Copy Client ID and Client Secret**

### Step 5: Add to .env

```env
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
```

### Step 6: Test OAuth

```bash
# Restart server
pnpm dev

# Check OAuth status
curl http://localhost:3000/auth/status

# Should return:
# {"googleOAuthConfigured":true,"loginUrl":"/auth/google"}

# Test in browser
open http://localhost:3000/auth/google
```

## 🧪 Testing Setup

### Basic Testing

```bash
# Run all tests
pnpm test

# Run once (CI mode)
pnpm test --run

# With coverage
pnpm test:coverage
```

### Test Database Configuration

Tests use separate database: `api_starter_db_test`

**Default credentials** (from vitest.config.ts):

- User: `postgres`
- Password: `postgres`
- Host: `localhost`
- Port: `5432`

**Custom test credentials:**

Create `.env.test` (gitignored):

```env
DB_USER=your_test_user
DB_PASSWORD=your_test_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=api_starter_db_test
```

**CI/CD Testing:**

GitHub Actions uses default `postgres`/`postgres` credentials.

## 🔧 Troubleshooting Common Issues

### PostgreSQL Connection Failed

**Error:** `ECONNREFUSED 127.0.0.1:5432`

**Solutions:**

```bash
# Check if PostgreSQL is running
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Start if not running
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Check if port is in use
lsof -i :5432
```

### Port 3000 Already in Use

**Error:** `EADDRINUSE :::3000`

**Solution:**

```bash
# Find process using port 3000
lsof -i :3000

# Kill process (replace PID)
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

### Database Does Not Exist

**Error:** `database "api_starter_db" does not exist`

**Solution:**

```bash
# Create manually
psql -U postgres -d postgres -c "CREATE DATABASE api_starter_db;"

# Or run init script
pnpm db:init
```

### Permission Denied for User

**Error:** `role "your_user" does not exist`

**Solution:**

```bash
# Create user with superuser privileges
psql -U postgres -d postgres -c "CREATE USER your_user WITH SUPERUSER PASSWORD 'password';"

# Or grant specific permissions
psql -U postgres -d postgres -c "CREATE USER your_user WITH CREATEDB PASSWORD 'password';"
```

### pnpm Not Found

**Solution:**

```bash
# Install pnpm globally
npm install -g pnpm

# Or use npx
npx pnpm install
```

### Node Version Mismatch

**Error:** `The engine "node" is incompatible`

**Solution:**

```bash
# Install correct version
nvm install 24.13.0

# Use it
nvm use 24.13.0

# Set as default (optional)
nvm alias default 24.13.0
```

### OAuth Not Working

**Error:** `Google OAuth not configured`

**Solutions:**

1. **Check environment variables:**

   ```bash
   echo $GOOGLE_CLIENT_ID
   echo $GOOGLE_CLIENT_SECRET
   ```

2. **Verify .env is loaded:**

   ```bash
   cat .env | grep GOOGLE
   ```

3. **Restart server after adding credentials:**

   ```bash
   # Stop (Ctrl+C) and restart
   pnpm dev
   ```

4. **Use dev token as alternative:**
   ```bash
   curl -X POST http://localhost:3000/auth/dev/token \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

### Tests Failing

**Check:**

1. **Test database exists:**

   ```bash
   psql -U postgres -d postgres -c "\l" | grep test
   ```

2. **Test credentials correct:**

   ```bash
   psql -U postgres -d api_starter_db_test -c "SELECT 1;"
   ```

3. **Clean test database:**
   ```bash
   psql -U postgres -d postgres -c "DROP DATABASE api_starter_db_test;"
   psql -U postgres -d postgres -c "CREATE DATABASE api_starter_db_test;"
   pnpm test
   ```

## 📱 Platform-Specific Notes

### macOS

- PostgreSQL installed via Homebrew starts automatically
- Use `brew services` to manage
- Default `postgres` user may need creation

### Linux

- PostgreSQL managed via systemd
- Default authentication may use `peer` method
- May need to edit `/etc/postgresql/*/main/pg_hba.conf`

### Windows

- Use PostgreSQL installer or Docker
- Add PostgreSQL bin to PATH
- Use Git Bash or WSL for shell scripts

## 🎯 Next Steps

After successful setup:

1. **Customize for your project:**

   ```bash
   ./scripts/customize.sh
   ```

2. **Explore API:**
   - Visit http://localhost:3000/documentation
   - Try example endpoints
   - Review [API_GUIDE.md](API_GUIDE.md)

3. **Start developing:**
   - Read [DEVELOPMENT.md](DEVELOPMENT.md)
   - Add your models and routes
   - Write tests

4. **Deploy:**
   - Review [DOCKER.md](DOCKER.md)
   - Set up CI/CD
   - Configure production environment
