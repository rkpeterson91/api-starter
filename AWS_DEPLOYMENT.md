# AWS Deployment Guide

This guide explains how to deploy the API to AWS cloud services.

## Key Differences: Local vs AWS

### Local Development

- Uses `sequelize.sync()` to automatically create/update tables
- Runs `pnpm db:init` to create PostgreSQL databases
- Simple setup with Docker Compose

### AWS Production

- Uses **migrations** for database schema management
- Database is provisioned separately (RDS)
- SSL connection to database
- Environment variables set through AWS services

## Prerequisites

1. **AWS RDS PostgreSQL** instance provisioned
2. Security groups configured to allow your service to connect
3. Database credentials stored securely (AWS Secrets Manager recommended)

## Environment Variables for AWS

Set these in your AWS service (ECS, Elastic Beanstalk, etc.):

```bash
NODE_ENV=production
PORT=3000

# Database (RDS)
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=api_starter_db
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_SSL=true

# JWT
JWT_SECRET=your-production-jwt-secret

# App
APP_URL=https://your-domain.com

# Optional: OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Deployment Steps

### 1. Build the Application

```bash
pnpm install
pnpm build
```

### 2. Run Migrations

Connect to your RDS database and run migrations:

```bash
pnpm migrate
```

### 3. Deploy to AWS

#### Option A: ECS (Elastic Container Service)

1. Build Docker image: `docker build -t api-starter .`
2. Push to ECR (Elastic Container Registry)
3. Create ECS task definition with environment variables
4. Deploy service

#### Option B: Elastic Beanstalk

1. Package application: `zip -r app.zip . -x "*.git*" "node_modules/*"`
2. Deploy through EB CLI or console
3. Configure environment variables in EB console

#### Option C: EC2

1. SSH into EC2 instance
2. Clone repository
3. Install Node.js and pnpm
4. Set environment variables
5. Run: `pnpm setup:cloud && pnpm start`

## Database Migrations

### Create a new migration

```bash
pnpm migrate:create add-user-profile
```

### Run migrations

```bash
pnpm migrate
```

### Check migration status

```bash
pnpm migrate:status
```

### Rollback last migration

```bash
pnpm migrate:undo
```

## Scripts Overview

| Script             | Local Use | AWS Use | Description                                            |
| ------------------ | --------- | ------- | ------------------------------------------------------ |
| `pnpm setup`       | ✅        | ❌      | Full local setup (creates DBs + runs migrations)       |
| `pnpm setup:cloud` | ❌        | ✅      | Cloud setup (installs deps + builds + runs migrations) |
| `pnpm db:init`     | ✅        | ❌      | Creates PostgreSQL databases (skipped in cloud)        |
| `pnpm migrate`     | ✅        | ✅      | Runs database migrations                               |
| `pnpm start`       | ✅        | ✅      | Starts the application                                 |

## Health Checks

The Dockerfile includes a health check endpoint at `/health`. Configure your AWS load balancer to use this endpoint.

## SSL/TLS Configuration

When `DB_SSL=true`, the application will connect to RDS using SSL. This is automatically configured for AWS RDS certificates.

## Troubleshooting

### "Unable to connect to database"

- Check security group allows inbound traffic on port 5432
- Verify RDS endpoint is correct
- Confirm credentials are accurate

### "Table doesn't exist"

- Run migrations: `pnpm migrate`
- Check migration status: `pnpm migrate:status`

### Cloud environment not detected

- Application auto-detects AWS by checking for `AWS_REGION`, `AWS_EXECUTION_ENV`, or `ECS_CONTAINER_METADATA_URI`
- Set `NODE_ENV=production` to force production mode
