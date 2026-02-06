#!/bin/bash
# Quick Test - Check if everything is working

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Testing Application..."

# Check if app is running
if curl -s http://localhost:80 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Application is running${NC}"
else
  echo -e "${RED}❌ Application not running${NC}"
  echo "Start it with: ./start.sh"
  exit 1
fi

# Check Docker
if docker ps | grep -q restaurant-pos; then
  echo -e "${GREEN}✅ Docker containers running${NC}"
else
  echo -e "${YELLOW}⚠️  Docker containers not found${NC}"
fi

# Test API
if curl -s http://localhost:5001/api > /dev/null 2>&1; then
  echo -e "${GREEN}✅ API is accessible${NC}"
else
  echo -e "${YELLOW}⚠️  API not accessible on port 5001${NC}"
fi

echo ""
echo -e "${YELLOW}To create public URL, run:${NC}"
echo "  ./fix-and-test.sh"
