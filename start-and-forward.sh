#!/bin/bash
# Start Application and Set Up Port Forwarding Info

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Restaurant POS with Port Forwarding${NC}"
echo ""

# Get network info
get_local_ip() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    hostname -I | awk '{print $1}'
  else
    echo "localhost"
  fi
}

get_public_ip() {
  curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "Unable to detect"
}

LOCAL_IP=$(get_local_ip)
PUBLIC_IP=$(get_public_ip)

# Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker not found. Please install Docker.${NC}"
  exit 1
fi

if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
  exit 1
fi

# Stop existing containers
echo -e "${CYAN}Cleaning up...${NC}"
docker-compose down 2>/dev/null || true

# Start application
echo -e "${CYAN}Starting application...${NC}"
docker-compose up -d --build

# Wait for application
echo -e "${CYAN}Waiting for application to be ready...${NC}"
for i in {1..60}; do
  if curl -s http://localhost:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is ready!${NC}"
    break
  fi
  if [ $i -eq 60 ]; then
    echo -e "${RED}❌ Application failed to start${NC}"
    docker-compose logs
    exit 1
  fi
  echo -n "."
  sleep 1
done
echo ""

# Display information
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  ✅ APPLICATION RUNNING${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📍 Access URLs:${NC}"
echo -e "   Local:    ${CYAN}http://localhost:80${NC}"
echo -e "   Network:  ${CYAN}http://${LOCAL_IP}:80${NC}"
echo -e "   Public:   ${CYAN}http://${PUBLIC_IP}:80${NC} (after port forwarding)"
echo ""
echo -e "${GREEN}🔌 Port Forwarding Setup:${NC}"
echo -e "   Local IP:  ${CYAN}${LOCAL_IP}${NC}"
echo -e "   Public IP: ${CYAN}${PUBLIC_IP}${NC}"
echo -e "   Port:      ${CYAN}80${NC}"
echo ""
echo -e "${YELLOW}📋 Router Configuration:${NC}"
echo "   1. Access router: http://192.168.1.1"
echo "   2. Go to: Port Forwarding"
echo "   3. Add rule: Port 80 → ${LOCAL_IP}:80"
echo "   4. Save"
echo ""
echo -e "${GREEN}🔐 Login Credentials:${NC}"
echo -e "   Email:    ${CYAN}admin@restaurant.com${NC}"
echo -e "   Password: ${CYAN}admin123${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 Quick Public Access (No Router Config):${NC}"
echo -e "   Run: ${CYAN}./start-with-tunnel.sh${NC}"
echo -e "   This creates instant public URL!"
echo ""
echo -e "${GREEN}✅ Application is running and ready!${NC}"
echo ""
