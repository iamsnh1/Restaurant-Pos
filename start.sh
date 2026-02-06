#!/bin/bash
# Startup script for Restaurant POS System
# Handles database initialization and first-time setup

set -e

echo "🚀 Starting Restaurant POS System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get local IP address
get_local_ip() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo "localhost"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    hostname -I | awk '{print $1}' || echo "localhost"
  else
    echo "localhost"
  fi
}

LOCAL_IP=$(get_local_ip)

# Check if database exists and has users
check_database() {
  cd backend
  
  if [ -f "prisma/data.db" ]; then
    echo -e "${BLUE}📊 Database file found${NC}"
    
    # Try to check if users exist (requires node)
    if command -v node &> /dev/null; then
      USER_COUNT=$(node -e "
        const { PrismaClient } = require('@prisma/client');
        const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
        const Database = require('better-sqlite3');
        const path = require('path');
        const dbPath = path.join(__dirname, 'prisma/data.db');
        if (require('fs').existsSync(dbPath)) {
          const sqlite = new Database(dbPath);
          const adapter = new PrismaBetterSqlite3({ url: \`file:\${dbPath}\`, database: sqlite });
          const prisma = new PrismaClient({ adapter });
          prisma.user.count().then(count => {
            console.log(count);
            prisma.\$disconnect();
          }).catch(() => console.log('0'));
        } else {
          console.log('0');
        }
      " 2>/dev/null || echo "0")
      
      if [ "$USER_COUNT" -gt "0" ]; then
        echo -e "${GREEN}✅ Database initialized with $USER_COUNT user(s)${NC}"
        return 0
      fi
    fi
  fi
  
  return 1
}

# Initialize database
init_database() {
  cd backend
  echo -e "${YELLOW}📦 Initializing database...${NC}"
  
  # Generate Prisma client
  npx prisma generate
  
  # Push schema
  npx prisma db push --accept-data-loss
  
  # Seed database
  echo -e "${YELLOW}🌱 Seeding database...${NC}"
  npx prisma db seed || true
  
  cd ..
}

# Main execution
if ! check_database; then
  echo -e "${YELLOW}⚠️  Database not initialized or empty${NC}"
  init_database
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}📡 Access Information:${NC}"
echo -e "   Local:    http://localhost:80"
echo -e "   Network:  http://${LOCAL_IP}:80"
echo -e "   API:      http://${LOCAL_IP}:5001/api"
echo ""
echo -e "${YELLOW}🔐 First-time Login:${NC}"
echo -e "   Email:    admin@restaurant.com"
echo -e "   Password: admin123"
echo ""
echo -e "${YELLOW}💡 To create first admin manually:${NC}"
echo -e "   curl -X POST http://${LOCAL_IP}:5001/api/auth/setup \\"
echo -e "     -H 'Content-Type: application/json' \\"
echo -e "     -d '{\"name\":\"Admin\",\"email\":\"admin@restaurant.com\",\"password\":\"admin123\"}'"
echo ""
echo -e "${GREEN}🚀 Starting services...${NC}"
echo ""

# Start with docker-compose if available, otherwise start manually
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
  echo "Starting with Docker Compose..."
  docker-compose up --build
else
  echo "Docker not found. Starting manually..."
  echo "Backend: cd backend && npm run dev"
  echo "Frontend: cd frontend && npm run dev"
fi
