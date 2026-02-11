# Environment Configuration Guide

This guide covers how to configure environment variables across different deployment environments.

## Table of Contents

- [Environment Types](#environment-types)
- [Required Variables by Environment](#required-variables-by-environment)
- [Platform-Specific Setup](#platform-specific-setup)
- [Security Best Practices](#security-best-practices)

## Environment Types

The API supports four environment modes via the `NODE_ENV` variable:

| Environment   | Purpose                     | Database SSL | Debug Logs |
| ------------- | --------------------------- | ------------ | ---------- |
| `development` | Local development           | No           | Yes        |
| `test`        | CI/CD and automated tests   | No           | Limited    |
| `staging`     | Pre-production testing      | Yes          | Limited    |
| `production`  | Live production environment | Yes          | No         |

## Required Variables by Environment

### Development (Local)

Copy `.env.example` to `.env` and configure:

```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=api_starter_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
JWT_SECRET=your-local-jwt-secret
APP_URL=http://localhost:3000
```

### Test (CI/CD)

Already configured in `.github/workflows/ci.yml`:

```yaml
env:
  NODE_ENV: test
  DB_HOST: localhost
  DB_PORT: 5432
  DB_USER: postgres
  DB_PASSWORD: postgres
  DB_NAME: api_starter_db
  JWT_SECRET: test-jwt-secret-for-ci
  APP_URL: http://localhost:3000
```

### Staging

**⚠️ Never commit `.env.staging` to version control**

Configure via your platform's environment variable settings:

```bash
NODE_ENV=staging
PORT=3000
DB_HOST=your-staging-db.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=api_starter_db_staging
DB_USER=app_user
DB_PASSWORD=<from-secrets-manager>
DB_SSL=true
JWT_SECRET=<from-secrets-manager>
APP_URL=https://staging.yourapp.com
```

Optional OAuth (if testing OAuth flows):

```bash
GOOGLE_CLIENT_ID=<staging-oauth-app-id>
GOOGLE_CLIENT_SECRET=<from-secrets-manager>
```

### Production

**⚠️ Never commit `.env.production` to version control**

Configure via your platform's environment variable settings:

```bash
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=api_starter_db
DB_USER=app_user
DB_PASSWORD=<from-secrets-manager>
DB_SSL=true
JWT_SECRET=<from-secrets-manager>
APP_URL=https://yourapp.com
```

OAuth providers (as needed):

```bash
GOOGLE_CLIENT_ID=<production-oauth-app-id>
GOOGLE_CLIENT_SECRET=<from-secrets-manager>
GITHUB_CLIENT_ID=<production-oauth-app-id>
GITHUB_CLIENT_SECRET=<from-secrets-manager>
MICROSOFT_CLIENT_ID=<production-oauth-app-id>
MICROSOFT_CLIENT_SECRET=<from-secrets-manager>
```

## Platform-Specific Setup

### AWS ECS/Fargate

Set environment variables in your task definition:

```json
{
  "containerDefinitions": [
    {
      "name": "api",
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3000" },
        { "name": "APP_URL", "value": "https://yourapp.com" }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:api/jwt-secret"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:api/db-password"
        }
      ]
    }
  ]
}
```

### AWS Elastic Beanstalk

Set via EB CLI or console:

```bash
eb setenv NODE_ENV=production \
  DB_HOST=your-db.region.rds.amazonaws.com \
  DB_SSL=true \
  APP_URL=https://yourapp.com
```

For secrets, use EB environment properties or AWS Secrets Manager.

### Heroku

Set via Heroku CLI:

```bash
heroku config:set NODE_ENV=production \
  DB_HOST=<heroku-postgres-host> \
  DB_SSL=true \
  JWT_SECRET=<generate-secure-secret> \
  APP_URL=https://yourapp.herokuapp.com
```

Heroku automatically provides `DATABASE_URL` - you may need to parse it.

### Vercel

In your project settings → Environment Variables:

| Variable     | Production   | Staging        |
| ------------ | ------------ | -------------- |
| `NODE_ENV`   | `production` | `staging`      |
| `JWT_SECRET` | `<secret>`   | `<secret>`     |
| `DB_HOST`    | `<prod-db>`  | `<staging-db>` |
| `DB_SSL`     | `true`       | `true`         |

### Docker / Docker Compose

For staging/production, use environment files or secrets:

```yaml
# docker-compose.prod.yml
services:
  api:
    environment:
      NODE_ENV: production
      DB_SSL: 'true'
      APP_URL: https://yourapp.com
    env_file:
      - .env.production # Keep this file outside version control
    secrets:
      - jwt_secret
      - db_password

secrets:
  jwt_secret:
    external: true
  db_password:
    external: true
```

### Kubernetes

Use ConfigMaps for non-sensitive values and Secrets for sensitive data:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  NODE_ENV: 'production'
  DB_HOST: 'postgres-service'
  DB_SSL: 'true'
  APP_URL: 'https://yourapp.com'
---
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
type: Opaque
stringData:
  JWT_SECRET: '<base64-encoded-secret>'
  DB_PASSWORD: '<base64-encoded-password>'
```

## Security Best Practices

### 1. Secrets Management

**Never commit secrets to version control**. Use dedicated secrets management:

- **AWS**: AWS Secrets Manager or Systems Manager Parameter Store
- **Google Cloud**: Secret Manager
- **Azure**: Key Vault
- **HashiCorp Vault**: For multi-cloud or on-premise
- **GitHub Actions**: Repository secrets for CI/CD

### 2. Generate Strong Secrets

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or using openssl
openssl rand -hex 64
```

### 3. Environment-Specific Values

| Variable     | Development      | Staging                | Production        |
| ------------ | ---------------- | ---------------------- | ----------------- |
| `DB_SSL`     | `false`          | `true`                 | `true`            |
| `NODE_ENV`   | `development`    | `staging`/`production` | `production`      |
| `JWT_SECRET` | Simple string    | Secure secret          | Secure secret     |
| `APP_URL`    | `localhost:3000` | Staging domain         | Production domain |

### 4. Rotate Secrets Regularly

- JWT secrets: Rotate every 90 days
- Database passwords: Rotate every 90 days
- OAuth client secrets: Rotate when compromised

### 5. Validate Configuration on Startup

The app automatically validates:

- ✅ `NODE_ENV` is one of: `development`, `test`, `staging`, `production`
- ⚠️ Warns if running `development` mode in cloud environments
- ✅ Required database configuration is present

### 6. Access Control

Limit who can access environment variables:

- Production: Only DevOps/SRE team
- Staging: DevOps + Senior developers
- Development: All developers (local only)

## Troubleshooting

### "Invalid NODE_ENV" error

Ensure `NODE_ENV` is one of: `development`, `test`, `staging`, or `production`.

### Database connection fails

Check:

1. `DB_SSL=true` is set for cloud databases
2. Database host allows connections from your server's IP
3. Database credentials are correct
4. Port 5432 is open in security groups/firewall

### OAuth not working

Verify:

1. OAuth redirect URLs match your `APP_URL`
2. OAuth app is configured for the correct environment
3. Client ID and secret are for the right environment (dev/staging/prod apps should be separate)

## Environment Variable Priority

Variables are loaded in this order (later overrides earlier):

1. Default values in code
2. `.env` file (local development only)
3. System environment variables
4. Platform-specific environment variables (AWS, Heroku, etc.)

## See Also

- [AWS Deployment Guide](AWS_DEPLOYMENT.md) - AWS-specific deployment instructions
- [Development Guide](DEVELOPMENT.md) - Local development setup
- [API Guide](API_GUIDE.md) - API documentation and examples
