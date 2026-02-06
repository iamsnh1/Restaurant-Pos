#!/bin/bash
# Fix Login Issue - Initialize Database Properly

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing Login Issue${NC}"
echo ""

# Stop backend
echo -e "${CYAN}Stopping backend...${NC}"
docker-compose stop backend

# Wait for it to stop
sleep 2

# Initialize database
echo -e "${CYAN}Initializing database...${NC}"
docker-compose exec -T backend sh -c "cd /app && npx prisma db push --accept-data-loss" || {
  echo -e "${YELLOW}Database push failed, trying alternative method...${NC}"
  docker-compose run --rm backend sh -c "cd /app && npx prisma db push --accept-data-loss"
}

# Seed database
echo -e "${CYAN}Seeding database...${NC}"
docker-compose exec -T backend sh -c "cd /app && node prisma/seed.js" || {
  echo -e "${YELLOW}Seed failed, will create admin via API...${NC}"
}

# Start backend
echo -e "${CYAN}Starting backend...${NC}"
docker-compose start backend

# Wait for backend
echo -e "${CYAN}Waiting for backend to be ready...${NC}"
sleep 5

# Create admin user if needed
echo -e "${CYAN}Creating admin user...${NC}"
curl -X POST http://localhost/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}' 2>&1 | grep -q "token" && \
  echo -e "${GREEN}✅ Admin user created${NC}" || \
  echo -e "${YELLOW}⚠️  Admin user may already exist${NC}"

# Test login
echo -e "${CYAN}Testing login...${NC}"
RESPONSE=$(curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"admin123"}')

if echo "$RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ LOGIN FIXED!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${GREEN}Login credentials:${NC}"
  echo -e "  Email:    ${CYAN}admin@restaurant.com${NC}"
  echo -e "  Password: ${CYAN}admin123${NC}"
  echo ""
  echo -e "${BLUE}✅ Login is now working!${NC}"
else
  echo -e "${RED}❌ Login still not working${NC}"
  echo "Response: $RESPONSE"
  echo ""
  echo "Check logs: docker-compose logs backend"
fi
