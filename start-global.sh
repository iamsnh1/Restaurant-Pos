#!/bin/bash
# Global Access Startup Script
# Starts the application and optionally sets up ngrok/cloudflare tunnel

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🌍 Global Access Startup${NC}"
echo ""

# Get public IP
get_public_ip() {
  curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "Unable to detect"
}

PUBLIC_IP=$(get_public_ip)

echo -e "${CYAN}📡 Your Public IP: ${PUBLIC_IP}${NC}"
echo ""

# Check if ngrok is available
if command -v ngrok &> /dev/null; then
  echo -e "${GREEN}✅ ngrok found${NC}"
  echo -e "${YELLOW}💡 Tip: Run 'ngrok http 80' in another terminal for public HTTPS URL${NC}"
  echo ""
fi

# Check if cloudflared is available
if command -v cloudflared &> /dev/null; then
  echo -e "${GREEN}✅ cloudflared found${NC}"
  echo -e "${YELLOW}💡 Tip: Run 'cloudflared tunnel --url http://localhost:80' for free public access${NC}"
  echo ""
fi

echo -e "${BLUE}🚀 Starting application...${NC}"
echo ""

# Start the application
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
  docker-compose up --build
else
  echo -e "${YELLOW}⚠️  Docker not found. Starting manually...${NC}"
  echo ""
  echo "Backend: cd backend && npm run dev"
  echo "Frontend: cd frontend && npm run dev"
fi
