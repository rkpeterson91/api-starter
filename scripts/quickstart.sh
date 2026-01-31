#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}           API Starter - Quick Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if .env exists
if [ -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file already exists. Skipping setup.${NC}"
    echo -e "${YELLOW}   Delete .env if you want to run setup again.${NC}\n"
else
    echo -e "${GREEN}✓${NC} Copying .env.example to .env...\n"
    cp .env.example .env
    
    echo -e "${BLUE}📝 Quick Configuration${NC}\n"
    
    # Database setup
    echo -e "${GREEN}Database:${NC} Using default postgres/postgres"
    echo -e "   (Change DB_USER/DB_PASSWORD in .env if needed)\n"
    
    # JWT Secret
    echo -e "${YELLOW}⚠️  Security:${NC} Default JWT_SECRET is insecure!"
    echo -e "   Generate a strong secret:"
    echo -e "   ${BLUE}openssl rand -base64 32${NC}\n"
    
    # OAuth setup
    echo -e "${BLUE}Google OAuth (Optional):${NC}"
    read -p "   Do you want to set up Google OAuth now? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo
        read -p "   Google Client ID: " client_id
        read -p "   Google Client Secret: " client_secret
        
        # Update .env file
        sed -i.bak "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$client_id|" .env
        sed -i.bak "s|GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$client_secret|" .env
        rm .env.bak 2>/dev/null || true
        
        echo -e "\n${GREEN}✓${NC} OAuth credentials saved to .env"
    else
        echo -e "\n${BLUE}ℹ️  Skipping OAuth setup. You can configure it later in .env${NC}"
        echo -e "   The API will work without OAuth using /auth/dev/token"
    fi
fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Installing Dependencies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

pnpm install

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Creating Databases${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

pnpm db:init

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}Next steps:${NC}\n"
echo -e "  1. Review your .env file"
echo -e "  2. Start the server:    ${GREEN}pnpm dev${NC}"
echo -e "  3. View API docs:       ${BLUE}http://localhost:3000/documentation${NC}"
echo -e "  4. Run tests:           ${GREEN}pnpm test${NC}\n"

if ! grep -q "GOOGLE_CLIENT_ID=your-google-client-id" .env 2>/dev/null; then
    echo -e "${GREEN}OAuth Configured:${NC} Visit /auth/google to login"
else
    echo -e "${YELLOW}OAuth Not Configured:${NC} Use /auth/dev/token for testing"
    echo -e "   Example: curl -X POST http://localhost:3000/auth/dev/token \\"
    echo -e "            -H 'Content-Type: application/json' \\"
    echo -e "            -d '{\"email\":\"test@example.com\",\"name\":\"Test User\"}'"
fi

echo
