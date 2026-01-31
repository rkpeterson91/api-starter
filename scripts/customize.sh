#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   API Starter - Customize for Your Project${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}This script will help you customize this template for your project.${NC}\n"

# Get project details
read -p "Project name (e.g., my-api): " project_name
read -p "Project description: " project_desc
read -p "Database name (e.g., my_api_db): " db_name
read -p "Author name (optional): " author_name

echo -e "\n${BLUE}Updating project files...${NC}\n"

# Update package.json
if [ -f package.json ]; then
    sed -i.bak "s|\"name\": \"api-starter\"|\"name\": \"$project_name\"|" package.json
    sed -i.bak "s|\"description\": \".*\"|\"description\": \"$project_desc\"|" package.json
    if [ ! -z "$author_name" ]; then
        sed -i.bak "s|\"author\": \"\"|\"author\": \"$author_name\"|" package.json
    fi
    rm package.json.bak 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Updated package.json"
fi

# Update .env.example
if [ -f .env.example ]; then
    sed -i.bak "s|DB_NAME=api_starter_db|DB_NAME=$db_name|" .env.example
    rm .env.example.bak 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Updated .env.example"
fi

# Update .env if it exists
if [ -f .env ]; then
    sed -i.bak "s|DB_NAME=api_starter_db|DB_NAME=$db_name|" .env
    rm .env.bak 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Updated .env"
fi

# Update README
if [ -f README.md ]; then
    # Create a backup
    cp README.md README.md.backup
    
    # Create simplified README
    cat > README.md << EOF
# $project_name

$project_desc

## Quick Start

\`\`\`bash
# 1. Use correct Node version
nvm use

# 2. Run setup (copies .env, installs deps, creates databases)
./scripts/quickstart.sh

# 3. Start development server
pnpm dev
\`\`\`

Visit http://localhost:3000/documentation for API docs.

## Development

- **Start dev server**: \`pnpm dev\`
- **Run tests**: \`pnpm test\`
- **Build for production**: \`pnpm build\`
- **Start production**: \`pnpm start\`

## Environment Variables

Copy \`.env.example\` to \`.env\` and configure:

- **Database**: PostgreSQL connection settings
- **JWT_SECRET**: Secret for JWT tokens (change in production!)
- **Google OAuth** (optional): GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

## Testing Without OAuth

Use the development token endpoint:

\`\`\`bash
curl -X POST http://localhost:3000/auth/dev/token \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"test@example.com","name":"Test User"}'
\`\`\`

## Docker

\`\`\`bash
pnpm docker:up    # Start containers
pnpm docker:down  # Stop containers
\`\`\`

See [DOCKER.md](DOCKER.md) for CI/CD setup.

## Tech Stack

- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL + Sequelize ORM
- **Auth**: JWT + Google OAuth2 (optional)
- **Testing**: Vitest
- **API Docs**: OpenAPI/Swagger

---

*Original template documentation saved to README.md.backup*
EOF
    
    echo -e "${GREEN}✓${NC} Updated README.md (backup saved to README.md.backup)"
fi

# Clean up example test user references
echo -e "\n${BLUE}Cleanup complete!${NC}\n"
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo -e "  1. Update git remote: ${BLUE}git remote set-url origin <your-repo-url>${NC}"
echo -e "  2. Generate new JWT secret: ${BLUE}openssl rand -base64 32${NC}"
echo -e "  3. Configure Google OAuth if needed"
echo -e "  4. Remove this script: ${BLUE}rm scripts/customize.sh${NC}\n"

echo -e "${GREEN}Ready to start building! 🚀${NC}\n"
