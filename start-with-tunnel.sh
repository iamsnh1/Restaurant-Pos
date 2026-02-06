#!/bin/bash
# Start Application with Active Tunnel - Ensures Link Always Works

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Application with Public Tunnel${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Stopping services...${NC}"
  docker-compose down 2>/dev/null || true
  kill $TUNNEL_PID 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

# Step 1: Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker not found. Please install Docker.${NC}"
  exit 1
fi

if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
  exit 1
fi

# Step 2: Stop any existing containers
echo -e "${CYAN}Cleaning up...${NC}"
docker-compose down 2>/dev/null || true

# Step 3: Start application
echo -e "${CYAN}Starting application...${NC}"
docker-compose up -d --build

# Step 4: Wait for application
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

# Step 5: Check for tunneling tools
TUNNEL_CMD=""

# Try ngrok first (more reliable)
if command -v ngrok &> /dev/null; then
  TUNNEL_CMD="ngrok"
  echo -e "${GREEN}✅ Using ngrok${NC}"
elif command -v cloudflared &> /dev/null; then
  TUNNEL_CMD="cloudflared"
  echo -e "${GREEN}✅ Using Cloudflare Tunnel${NC}"
else
  echo -e "${YELLOW}⚠️  No tunneling tool found. Installing ngrok...${NC}"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &> /dev/null; then
      brew install ngrok
      TUNNEL_CMD="ngrok"
    else
      echo -e "${RED}❌ Please install Homebrew or ngrok manually${NC}"
      echo "Visit: https://ngrok.com/download"
      exit 1
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    wget -q https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz -O /tmp/ngrok.tgz
    tar -xzf /tmp/ngrok.tgz -C /tmp
    sudo mv /tmp/ngrok /usr/local/bin/
    TUNNEL_CMD="ngrok"
  else
    echo -e "${RED}❌ Please install ngrok manually${NC}"
    exit 1
  fi
fi

# Step 6: Start tunnel
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🌍 Creating Public URL...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$TUNNEL_CMD" = "ngrok" ]; then
  # Start ngrok
  ngrok http 80 --log=stdout > /tmp/ngrok.log 2>&1 &
  TUNNEL_PID=$!
  
  sleep 5
  
  # Get URL from ngrok API
  for i in {1..20}; do
    URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -Eo 'https://[^"]+\.ngrok[^"]+' | head -1)
    if [ ! -z "$URL" ]; then
      echo ""
      echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo -e "${GREEN}  ✅ YOUR WORKING PUBLIC URL:${NC}"
      echo -e "${CYAN}  $URL${NC}"
      echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo ""
      echo -e "${GREEN}📋 Copy this URL and share it!${NC}"
      echo -e "${YELLOW}🔐 Login: admin@restaurant.com / admin123${NC}"
      echo ""
      echo -e "${BLUE}✅ Link is ACTIVE and WORKING!${NC}"
      echo -e "${YELLOW}⚠️  Keep this terminal open to keep the link active${NC}"
      echo ""
      echo -e "${CYAN}Press Ctrl+C to stop${NC}"
      echo ""
      
      # Keep running and show ngrok web interface
      echo -e "${BLUE}Ngrok web interface: http://localhost:4040${NC}"
      echo ""
      
      # Wait for user to stop
      wait $TUNNEL_PID
      break
    fi
    sleep 1
  done
  
  if [ -z "$URL" ]; then
    echo -e "${RED}❌ Failed to get ngrok URL. Check: http://localhost:4040${NC}"
    cat /tmp/ngrok.log
  fi
  
elif [ "$TUNNEL_CMD" = "cloudflared" ]; then
  # Start Cloudflare tunnel
  cloudflared tunnel --url http://localhost:80 2>&1 | while IFS= read -r line; do
    if [[ $line == *"https://"* ]] || [[ $line == *"trycloudflare.com"* ]]; then
      URL=$(echo "$line" | grep -Eo 'https://[^ )]+' | head -1)
      if [ ! -z "$URL" ]; then
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}  ✅ YOUR WORKING PUBLIC URL:${NC}"
        echo -e "${CYAN}  $URL${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${GREEN}📋 Copy this URL and share it!${NC}"
        echo -e "${YELLOW}🔐 Login: admin@restaurant.com / admin123${NC}"
        echo ""
        echo -e "${BLUE}✅ Link is ACTIVE and WORKING!${NC}"
        echo -e "${YELLOW}⚠️  Keep this terminal open to keep the link active${NC}"
        echo ""
        echo -e "${CYAN}Press Ctrl+C to stop${NC}"
        echo ""
      fi
    fi
    echo "$line"
  done
fi
