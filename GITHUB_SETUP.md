# 🎯 Quick Start: GitHub CI/CD Setup

## What Was Added

✅ **Docker Configuration**
- `Dockerfile` - Multi-stage production-ready image
- `.dockerignore` - Optimized build context
- `docker-compose.yml` - Local development environment
- `.env.docker` - Docker environment template

✅ **GitHub Actions Workflows**
- `.github/workflows/ci.yml` - Automated testing
- `.github/workflows/docker.yml` - Docker image builds

✅ **Documentation**
- `DOCKER.md` - Complete Docker & CI/CD guide
- Updated `README.md` with Docker commands

## 🚀 Next Steps (5 minutes)

### 1. Test Docker Locally (Optional)

```bash
# Build and start everything
pnpm docker:up

# Check logs
pnpm docker:logs

# Test the API
curl http://localhost:3000/health

# Stop containers
pnpm docker:down
```

### 2. Enable GitHub Actions

```bash
# Commit all the new files
git add .
git commit -m "feat: add Docker support and CI/CD workflows"
git push origin main
```

### 3. Configure GitHub Container Registry

**Go to your GitHub repository and:**

1. Click **Settings** (top navigation)
2. Click **Actions** (left sidebar)
3. Click **General**
4. Scroll to **Workflow permissions**
5. Select: **"Read and write permissions"** ✅
6. Check: **"Allow GitHub Actions to create and approve pull requests"** ✅
7. Click **Save**

### 4. Verify Workflows

1. Go to **Actions** tab in your repository
2. You should see workflows running:
   - ✅ **CI** - Testing your code
   - ✅ **Docker Build & Publish** - Building Docker image

### 5. Access Your Docker Images

After workflows complete (~2-3 minutes), your images are available:

```bash
# View on GitHub
# Go to: https://github.com/YOUR_USERNAME/api-starter/pkgs/container/api-starter

# Pull your image
docker pull ghcr.io/YOUR_USERNAME/api-starter:latest

# Run it anywhere
docker run -p 3000:3000 \
  -e DB_HOST=your-db \
  -e JWT_SECRET=your-secret \
  ghcr.io/YOUR_USERNAME/api-starter:latest
```

## 📦 Making Your Image Public (Optional)

By default, GitHub Container Registry images are private. To make public:

1. Go to repository → **Packages** (right sidebar)
2. Click on **api-starter** package
3. Click **Package settings**
4. Change visibility to **Public**

## 🏷️ Creating Versioned Releases

```bash
# Tag a release
git tag v1.0.0
git push origin v1.0.0

# This creates images:
# - ghcr.io/username/api-starter:v1.0.0
# - ghcr.io/username/api-starter:1.0
# - ghcr.io/username/api-starter:latest
```

## 🌐 Deployment Options

### Option 1: DigitalOcean App Platform
1. Create new app from GitHub repo
2. Select Dockerfile deployment
3. Add environment variables
4. Deploy! ($5/month)

### Option 2: Railway
1. Connect GitHub repo
2. Select Dockerfile
3. Add PostgreSQL database
4. Deploy! (Free tier available)

### Option 3: AWS ECS/Fargate
1. Push image to ECR or use GHCR
2. Create ECS task definition
3. Create service
4. Configure RDS for database

### Option 4: Any VPS (DigitalOcean, Linode, etc.)
```bash
# On your server
docker pull ghcr.io/username/api-starter:latest
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  -e DB_USER=user \
  -e DB_PASSWORD=pass \
  -e JWT_SECRET=secret \
  ghcr.io/username/api-starter:latest
```

## 🔍 Monitoring Your Workflows

### Check Workflow Status
```bash
# Install GitHub CLI
brew install gh

# View workflow runs
gh run list

# Watch a specific run
gh run watch
```

### Workflow Badges
Add to your README.md:

```markdown
[![CI](https://github.com/USERNAME/api-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/USERNAME/api-starter/actions/workflows/ci.yml)
[![Docker](https://github.com/USERNAME/api-starter/actions/workflows/docker.yml/badge.svg)](https://github.com/USERNAME/api-starter/actions/workflows/docker.yml)
```

## 🐛 Troubleshooting

### ❌ "Permission denied" in GitHub Actions
**Fix:** Enable "Read and write permissions" in Settings → Actions → General

### ❌ Can't pull Docker image
**Fix:** Make package public OR authenticate:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### ❌ Tests fail in CI but pass locally
**Check:** Environment variables in `.github/workflows/ci.yml`

### ❌ Docker build fails
**Check:** 
- Ensure `pnpm build` works locally
- Check Node version in Dockerfile matches `.nvmrc`

### ❌ Docker container keeps restarting
**Check:**
- View logs: `docker logs api-starter-api`
- Verify database is healthy: `docker ps`
- Ensure environment variables are set in docker-compose.yml

**Note:** Container logs will show JSON format (not pretty-printed) because `pino-pretty` is a dev dependency. This is normal for production builds.

## 📚 Learn More

- Full details: See [DOCKER.md](DOCKER.md)
- GitHub Actions: https://docs.github.com/actions
- GHCR: https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry

## 🎉 You're Done!

Your repository now has:
- ✅ Automated testing on every push
- ✅ Docker images built automatically
- ✅ Production-ready containers
- ✅ Easy deployment to any platform

Happy coding! 🚀
