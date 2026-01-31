# Docker & CI/CD Setup Guide

This guide walks you through setting up Docker containers and GitHub Actions CI/CD for your API starter.

## 🐳 Local Docker Setup

### Quick Start

1. **Build and run with Docker Compose:**

   ```bash
   pnpm docker:up
   ```

   This starts both PostgreSQL and your API in containers.

2. **View logs:**

   ```bash
   pnpm docker:logs
   ```

3. **Stop containers:**
   ```bash
   pnpm docker:down
   ```

### Manual Docker Commands

```bash
# Build the image
pnpm docker:build

# Run with environment file
pnpm docker:run

# Or use docker-compose
docker-compose up -d
docker-compose logs -f
docker-compose down
```

## 🚀 GitHub Actions CI/CD Setup

### Step 1: Enable GitHub Actions

Your workflows are already configured in `.github/workflows/`. They will run automatically when you push to GitHub.

### Step 2: Configure GitHub Container Registry (GHCR)

**Enable write permissions for GitHub Actions:**

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Actions** → **General**
3. Scroll down to **Workflow permissions**
4. Select **"Read and write permissions"**
5. Click **Save**

**Note:** You do NOT need "Allow GitHub Actions to create and approve pull requests" - that permission is only required for workflows that automatically create PRs (like Dependabot). Our workflows only need write access to publish Docker images.

### Step 3: Push Your Changes

```bash
git add .
git commit -m "feat: add Docker and CI/CD support"
git push origin main
```

### Step 4: Monitor Workflows

1. Go to the **Actions** tab in your GitHub repository
2. You'll see two workflows:
   - **CI** - Runs tests on every push/PR
   - **Docker Build & Publish** - Builds and publishes Docker images

### Step 5: Access Your Docker Images

After successful build, your images will be available at:

```
ghcr.io/YOUR_USERNAME/api-starter:latest
ghcr.io/YOUR_USERNAME/api-starter:main
ghcr.io/YOUR_USERNAME/api-starter:v1.0.0  (for tagged releases)
```

**Pull your image:**

```bash
docker pull ghcr.io/YOUR_USERNAME/api-starter:latest
```

**Make image public (optional):**

1. Go to your repository page
2. Click **Packages** on the right sidebar
3. Click on your package
4. Click **Package settings**
5. Scroll to **Danger Zone** → **Change visibility** → **Public**

## 📦 Creating Releases

To create versioned Docker images:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This creates images tagged with:

- `v1.0.0`
- `1.0`
- `latest`

## 🔧 Docker Image Hosting Options

### Option 1: GitHub Container Registry (Current Setup)

- ✅ Free unlimited storage for public repos
- ✅ Integrated with GitHub
- ✅ No extra accounts needed
- Location: `ghcr.io/username/repo`

### Option 2: Docker Hub

**Setup:**

1. Create account at https://hub.docker.com
2. Create access token: Settings → Security → New Access Token
3. Add GitHub secrets:
   - `DOCKER_USERNAME` - your Docker Hub username
   - `DOCKER_TOKEN` - your access token
4. Update `.github/workflows/docker.yml`:
   ```yaml
   env:
     REGISTRY: docker.io
     IMAGE_NAME: your-dockerhub-username/api-starter
   ```

### Option 3: AWS ECR

**Setup:**

1. Create ECR repository in AWS Console
2. Add AWS credentials to GitHub secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
3. Update workflow to use AWS ECR action

## 🧪 Testing Workflows Locally

Install `act` to test GitHub Actions locally:

```bash
brew install act
act -l  # List workflows
act push  # Test push event
```

## 🔒 Security Best Practices

1. **Never commit .env files** - Use secrets in GitHub Actions
2. **Use specific image tags** in production, not `latest`
3. **Scan images** for vulnerabilities:
   ```bash
   docker scan ghcr.io/username/api-starter:latest
   ```
4. **Keep base images updated** - Node.js, PostgreSQL versions

## 🐛 Troubleshooting

### Workflow Fails: Permission Denied

- Check Settings → Actions → General → Workflow permissions
- Ensure "Read and write permissions" is selected

### Can't Pull Docker Image

- Make package public (see Step 5 above)
- Or authenticate: `echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin`

### Database Connection Issues in Docker

- Ensure `DB_HOST=postgres` (service name, not localhost)
- Check docker-compose.yml health checks

### Container Keeps Restarting

- Check logs: `docker logs api-starter-api`
- Verify all environment variables are set in docker-compose.yml
- Ensure database is healthy: `docker ps` should show "(healthy)" status

### Different Logging in Docker

**Note**: The production Docker image uses standard JSON logging instead of `pino-pretty` (which is a dev dependency). This is expected behavior - the server automatically detects when `pino-pretty` is unavailable and uses appropriate logging for the environment.

## 📊 Adding Code Coverage (Optional)

1. Sign up at https://codecov.io
2. Get your upload token
3. Add `CODECOV_TOKEN` to GitHub repository secrets
4. Coverage reports will upload automatically

## 🌐 Deployment Examples

### Deploy to any VM/Server

```bash
# Pull and run
docker pull ghcr.io/username/api-starter:latest
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  -e DB_USER=user \
  -e DB_PASSWORD=pass \
  -e JWT_SECRET=secret \
  ghcr.io/username/api-starter:latest
```

### Deploy with Docker Compose (Production)

```bash
# On your server
wget https://raw.githubusercontent.com/username/api-starter/main/docker-compose.yml
docker-compose up -d
```

## 📝 Next Steps

1. ✅ Push code to trigger first CI run
2. ✅ Verify workflows pass in Actions tab
3. ✅ Test Docker image locally
4. ✅ Deploy to your hosting platform
5. ✅ Set up monitoring and alerts
