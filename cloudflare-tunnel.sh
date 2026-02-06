#!/bin/bash
# Cloudflare Tunnel setup for free global access

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}☁️  Setting up Cloudflare Tunnel${NC}"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
  echo -e "${YELLOW}⚠️  cloudflared not found. Installing...${NC}"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if command -v brew &> /dev/null; then
      brew install cloudflare/cloudflare/cloudflared
    else
      echo "Please install Homebrew first: https://brew.sh"
      echo "Or download from: https://github.com/cloudflare/cloudflared/releases"
      exit 1
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "Downloading cloudflared for Linux..."
    wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
    chmod +x cloudflared-linux-amd64
    sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
  else
    echo "Please download from: https://github.com/cloudflare/cloudflared/releases"
    exit 1
  fi
fi

echo -e "${GREEN}✅ cloudflared installed${NC}"
echo ""

# Check if application is running
if ! curl -s http://localhost:80 > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Application not running on port 80${NC}"
  echo -e "${CYAN}Starting application in background...${NC}"
  ./start.sh &
  sleep 10
fi

echo -e "${BLUE}🌍 Starting Cloudflare Tunnel...${NC}"
echo ""
echo -e "${CYAN}Your public URL will be displayed below:${NC}"
echo -e "${GREEN}This URL is FREE and PERMANENT!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Start tunnel
cloudflared tunnel --url http://localhost:80
