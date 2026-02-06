#!/bin/bash
# Create Working Public Link - Fixes Public IP Access Issue

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Creating Working Public Link${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: http://122.174.59.26:80 won't work without router port forwarding${NC}"
echo -e "${CYAN}Creating tunnel for instant public access...${NC}"
echo ""

# Check if app is running
if ! curl -s http://localhost:80 > /dev/null 2>&1; then
  echo -e "${RED}❌ Application not running. Starting it...${NC}"
  docker-compose up -d --build
  sleep 10
fi

# Check for tunneling tools
if command -v ngrok &> /dev/null; then
  echo -e "${GREEN}✅ Using ngrok${NC}"
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  🌍 Starting ngrok tunnel...${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  # Kill any existing ngrok
  pkill ngrok 2>/dev/null || true
  sleep 2
  
  # Start ngrok
  ngrok http 80 --log=stdout > /tmp/ngrok.log 2>&1 &
  NGROK_PID=$!
  
  sleep 5
  
  # Get URL
  for i in {1..20}; do
    URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)
    if [ ! -z "$URL" ]; then
      echo ""
      echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo -e "${GREEN}  ✅ YOUR WORKING PUBLIC URL:${NC}"
      echo -e "${CYAN}  $URL${NC}"
      echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo ""
      echo -e "${GREEN}📋 Copy this URL - it works NOW!${NC}"
      echo -e "${YELLOW}🔐 Login: admin@restaurant.com / admin123${NC}"
      echo ""
      echo -e "${BLUE}✅ This URL works from anywhere in the world!${NC}"
      echo -e "${YELLOW}⚠️  Keep this terminal open to keep link active${NC}"
      echo ""
      echo -e "${CYAN}Ngrok web interface: http://localhost:4040${NC}"
      echo ""
      echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
      echo ""
      
      wait $NGROK_PID
      exit 0
    fi
    sleep 1
  done
  
  echo -e "${YELLOW}⚠️  ngrok started. Check web interface: http://localhost:4040${NC}"
  wait $NGROK_PID
  
elif command -v cloudflared &> /dev/null; then
  echo -e "${GREEN}✅ Using Cloudflare Tunnel${NC}"
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  🌍 Starting Cloudflare Tunnel...${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  cloudflared tunnel --url http://localhost:80 2>&1 | while IFS= read -r line; do
    if [[ $line == *"https://"* ]] || [[ $line == *"trycloudflare.com"* ]]; then
      URL=$(echo "$line" | grep -oP 'https://[^\s\)]+' | head -1)
      if [ ! -z "$URL" ]; then
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}  ✅ YOUR WORKING PUBLIC URL:${NC}"
        echo -e "${CYAN}  $URL${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${GREEN}📋 Copy this URL - it works NOW!${NC}"
        echo -e "${YELLOW}🔐 Login: admin@restaurant.com / admin123${NC}"
        echo ""
        echo -e "${BLUE}✅ This URL works from anywhere in the world!${NC}"
        echo -e "${YELLOW}⚠️  Keep this terminal open to keep link active${NC}"
        echo ""
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
        echo ""
      fi
    fi
    echo "$line"
  done
  
else
  echo -e "${RED}❌ No tunneling tool found${NC}"
  echo ""
  echo -e "${YELLOW}Installing ngrok (recommended)...${NC}"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &> /dev/null; then
      brew install ngrok
      echo -e "${GREEN}✅ Installed! Run this script again.${NC}"
    else
      echo -e "${RED}❌ Please install Homebrew or ngrok manually${NC}"
      echo "Visit: https://ngrok.com/download"
      exit 1
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Downloading ngrok..."
    wget -q https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz -O /tmp/ngrok.tgz
    tar -xzf /tmp/ngrok.tgz -C /tmp
    sudo mv /tmp/ngrok /usr/local/bin/
    echo -e "${GREEN}✅ Installed! Run this script again.${NC}"
  else
    echo -e "${RED}❌ Please install ngrok manually${NC}"
    echo "Visit: https://ngrok.com/download"
    exit 1
  fi
fi
