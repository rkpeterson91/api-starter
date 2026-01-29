# API Starter

A barebones Node.js backend API built with TypeScript, Fastify, PostgreSQL, Sequelize, and Vitest.

## Prerequisites

- Node.js 24.13.0 (managed via nvm)
- **PostgreSQL database** (must be installed and running)
- pnpm package manager

## Quick Start (For New Developers)

If you're pulling down this repo for the first time:

```bash
# 1. Use the correct Node version
nvm use

# 2. Copy environment variables
cp .env.example .env

# 3. Edit .env with your PostgreSQL credentials (if different from defaults)

# 4. Run setup (installs dependencies + creates databases)
pnpm setup

# 5. Start the server
pnpm dev
```

That's it! The API will be running on `http://localhost:3000`

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
setup` - Install dependencies and initialize databases (one command setup)
- `pnpm db:init` - Initialize/create databases (development and test)
- `pnpm 
The server will start on `http://localhost:3000`

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build the TypeScript code to JavaScript
- `pnpm start` - Start the production server (requires build first)
- `pnpm test` - Run tests with Vitest (uses separate test database)
- `pnpm test:coverage` - Run tests with coverage report

## API Endpoints

### Health Check
- `GET /health` - Check if the server is running

### Users (CRUD Operations)
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a user by ID
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

## Example API Usage

### Create a user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### Get all users
```bash
curl http://localhost:3000/api/users
```

### Get a user by ID
```bash
curl http://localhost:3000/api/users/1
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
api-starter/
├── src/
│   ├── __tests__/          # Test files
│   │   └── userRoutes.test.ts
│   ├── config/             # Configuration
│   │   └── index.ts
│   ├── database/           # Database connection
│   │   └── connection.ts
│   ├── models/             # Sequelize models
│   │   ├── User.ts
│   │   └── index.ts
│   ├── routes/             # API routes
│   │   └── userRoutes.ts
│   ├── index.ts            # Application entry point
│   └── server.ts           # Fastify server setup
├── .env.example            # Environment variables example
├── .nvmrc                  # Node version
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vitest.config.ts        # Vitest configuration
```

## Troubleshooting

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

## Technologies Used

- **TypeScript** - Type-safe JavaScript
- **Fastify** - Fast and low overhead web framework
- **PostgreSQL** - Relational database
- **Sequelize** - ORM for database operations
- **Vitest** - Fast unit testing framework
- **pnpm** - Fast, disk space efficient package manager
- **nvm** - Node version management

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
