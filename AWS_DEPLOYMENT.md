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
4. **For App Runner**: VPC Connector configured to access RDS in your VPC

## Environment Variables for AWS

Set these in your AWS service (App Runner, ECS, Elastic Beanstalk, etc.):

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

#### Option C: App Runner (Recommended for simplicity)

1. **Run migrations first** (one-time setup):
   - Option 1: Use AWS Cloud9 or EC2 in same VPC
   - Option 2: Connect from local via VPN/bastion host
   - Run: `pnpm migrate`

2. **Create App Runner service**:
   - Source: GitHub repository (automatic deployments) or ECR
   - Build settings: Use Dockerfile
   - VPC: Configure VPC Connector to access RDS
   - Environment variables: Add all variables from above
   - Port: 3000 (automatically detected from EXPOSE in Dockerfile)
   - Health check: `/health` endpoint

3. **Deploy**:
   - App Runner automatically builds and deploys
   - Get the App Runner URL from console
   - Update `APP_URL` environment variable if needed

#### Option D: EC2

1. SSH into EC2 instance
2. Clone repository
3. Install Node.js and pnpm
4. Set environment variables
5. Run: `pnpm setup:cloud && pnpm start`

## Database Migrations

Migrations are critical for production deployments. Unlike local development which uses `sequelize.sync()`, AWS deployments require explicit migration management.

### Migration Commands

#### Create a new migration

```bash
pnpm migrate:create add-user-profile
```

#### Run migrations

```bash
pnpm migrate
```

#### Check migration status

```bash
pnpm migrate:status
```

#### Rollback last migration

```bash
pnpm migrate:undo
```

### Running Migrations on AWS

The approach depends on your deployment method:

#### Method 1: AWS Cloud9 (Recommended for App Runner)

1. Launch Cloud9 environment in same VPC as RDS
2. Clone your repository
3. Install dependencies: `pnpm install`
4. Set environment variables:
   ```bash
   export DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
   export DB_PORT=5432
   export DB_NAME=api_starter_db
   export DB_USER=postgres
   export DB_PASSWORD=your-password
   export DB_SSL=true
   ```
5. Run migrations: `pnpm migrate`

#### Method 2: EC2 Bastion Host

1. Launch EC2 instance in same VPC as RDS
2. SSH into instance
3. Install Node.js and pnpm:
   ```bash
   curl -fsSL https://fnm.vercel.app/install | bash
   source ~/.bashrc
   fnm install 24
   npm install -g pnpm
   ```
4. Clone repository and run migrations as in Method 1

#### Method 3: Local Connection via Bastion/VPN

1. Set up SSH tunnel to bastion host:
   ```bash
   ssh -i your-key.pem -L 5433:your-rds-endpoint:5432 ec2-user@bastion-ip
   ```
2. Update connection to use localhost:
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5433
   ```
3. Run migrations: `pnpm migrate`

#### Method 4: ECS One-Off Task

For ECS deployments, create a one-off task:

1. Use same task definition as your service
2. Override command: `["sh", "-c", "pnpm migrate"]`
3. Run task in same VPC/subnet as your service
4. Check CloudWatch logs for migration output

#### Method 5: AWS Lambda (Advanced)

For automated migrations on deployment:

1. Create Lambda function with Node.js runtime
2. Package your app with migrations
3. Configure Lambda in same VPC as RDS
4. Trigger Lambda before App Runner/ECS deployment
5. Lambda runs `pnpm migrate` and exits

### Migration Best Practices

1. **Always backup before migrations**:

   ```bash
   aws rds create-db-snapshot \
     --db-instance-identifier your-db-instance \
     --db-snapshot-identifier pre-migration-$(date +%Y%m%d-%H%M%S)
   ```

2. **Test migrations on staging first**
   - Create staging RDS instance
   - Run migrations there first
   - Verify application works
   - Then apply to production

3. **Check migration status before deployment**:

   ```bash
   pnpm migrate:status
   ```

4. **Keep migrations reversible**:
   - Always include `down()` method
   - Test rollback procedure
   - Document breaking changes

5. **Monitor migration execution**:
   - Migrations run synchronously
   - Large migrations may time out
   - Consider breaking large migrations into smaller ones

### Automated Migration Workflow

For CI/CD pipelines with GitHub Actions:

```yaml
# .github/workflows/deploy.yml
- name: Run Migrations
  run: |
    export DB_HOST=${{ secrets.DB_HOST }}
    export DB_PORT=5432
    export DB_NAME=${{ secrets.DB_NAME }}
    export DB_USER=${{ secrets.DB_USER }}
    export DB_PASSWORD=${{ secrets.DB_PASSWORD }}
    export DB_SSL=true
    pnpm migrate
```

**Note**: This requires GitHub Actions runner to have network access to RDS (self-hosted runner in VPC or VPN connection).

## Scripts Overview

| Script             | Local Use | AWS Use | Description                                            |
| ------------------ | --------- | ------- | ------------------------------------------------------ |
| `pnpm setup`       | ✅        | ❌      | Full local setup (creates DBs + runs migrations)       |
| `pnpm setup:cloud` | ❌        | ✅      | Cloud setup (installs deps + builds + runs migrations) |
| `pnpm db:init`     | ✅        | ❌      | Creates PostgreSQL databases (skipped in cloud)        |
| `pnpm migrate`     | ✅        | ✅      | Runs database migrations                               |
| `pnpm start`       | ✅        | ✅      | Starts the application                                 |

## Health Checks

The application includes a health check endpoint at `/health`:

- **App Runner**: Configure health check path to `/health` in service settings
- **ECS/ALB**: Configure your load balancer target group to use this endpoint
- **Elastic Beanstalk**: Health check is auto-configured

## SSL/TLS Configuration

When `DB_SSL=true`, the application will connect to RDS using SSL. This is automatically configured for AWS RDS certificates.

## Troubleshooting

### "Unable to connect to database"

- Check security group allows inbound traffic on port 5432
- Verify RDS endpoint is correct
- Confirm credentials are accurate
- **App Runner**: Ensure VPC Connector is properly configured and associated with your service
- **App Runner**: Verify RDS security group allows inbound from VPC Connector's security group

### "Table doesn't exist"

- Run migrations: `pnpm migrate`
- Check migration status: `pnpm migrate:status`

### Cloud environment not detected

- Application auto-detects AWS by checking for `AWS_REGION`, `AWS_EXECUTION_ENV`, or `ECS_CONTAINER_METADATA_URI`
- Set `NODE_ENV=production` to force production mode

### App Runner: Migrations not running

- App Runner doesn't support pre-deployment tasks
- Run migrations manually before first deployment or after schema changes
- Use Cloud9, EC2, or local connection with proper VPC access
- Consider using AWS Lambda or ECS scheduled task for automated migration runs
