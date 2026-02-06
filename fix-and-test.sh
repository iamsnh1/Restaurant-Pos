#!/bin/bash
# Fix and Test Public URL - Troubleshooting Script

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing and Testing Public URL${NC}"
echo ""

# Step 1: Check if Docker is running
echo -e "${CYAN}Step 1: Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
  exit 1
fi

if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Step 2: Stop any existing containers
echo -e "${CYAN}Step 2: Cleaning up existing containers...${NC}"
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✅ Cleaned up${NC}"
echo ""

# Step 3: Build and start application
echo -e "${CYAN}Step 3: Building and starting application...${NC}"
docker-compose up -d --build
echo -e "${GREEN}✅ Application starting...${NC}"
echo ""

# Step 4: Wait for application to be ready
echo -e "${CYAN}Step 4: Waiting for application to be ready...${NC}"
for i in {1..60}; do
  if curl -s http://localhost:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is ready!${NC}"
    echo ""
    break
  fi
  if [ $i -eq 60 ]; then
    echo -e "${RED}❌ Application failed to start. Check logs:${NC}"
    echo "docker-compose logs"
    exit 1
  fi
  echo -n "."
  sleep 1
done
echo ""

# Step 5: Test local access
echo -e "${CYAN}Step 5: Testing local access...${NC}"
if curl -s http://localhost:80 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Local access working: http://localhost:80${NC}"
else
  echo -e "${RED}❌ Local access failed${NC}"
  echo "Check logs: docker-compose logs"
  exit 1
fi
echo ""

# Step 6: Install/Check Cloudflare Tunnel
echo -e "${CYAN}Step 6: Setting up Cloudflare Tunnel...${NC}"
if ! command -v cloudflared &> /dev/null; then
  echo -e "${YELLOW}⚠️  cloudflared not found. Installing...${NC}"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &> /dev/null; then
      brew install cloudflare/cloudflare/cloudflared
    else
      echo -e "${RED}❌ Homebrew not found. Please install manually:${NC}"
      echo "Visit: https://github.com/cloudflare/cloudflared/releases"
      exit 1
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Downloading cloudflared..."
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /tmp/cloudflared
    chmod +x /tmp/cloudflared
    sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
  else
    echo -e "${RED}❌ Please install cloudflared manually${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✅ cloudflared ready${NC}"
echo ""

# Step 7: Start Cloudflare Tunnel
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🌍 Starting Public URL...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Your public URL will appear below:${NC}"
echo -e "${YELLOW}This may take a few seconds...${NC}"
echo ""

# Start tunnel and capture URL
cloudflared tunnel --url http://localhost:80 2>&1 | while IFS= read -r line; do
  # Look for URL in output
  if [[ $line == *"https://"* ]] || [[ $line == *"trycloudflare.com"* ]]; then
    URL=$(echo "$line" | grep -oP 'https://[^\s\)]+' | head -1)
    if [ ! -z "$URL" ]; then
      echo ""
      echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo -e "${GREEN}  ✅ YOUR PUBLIC URL (WORKING!):${NC}"
      echo -e "${CYAN}  $URL${NC}"
      echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo ""
      echo -e "${GREEN}📋 Copy this URL and share it!${NC}"
      echo -e "${YELLOW}🔐 Login: admin@restaurant.com / admin123${NC}"
      echo ""
      echo -e "${BLUE}✅ Link is working! Test it in your browser.${NC}"
      echo ""
      echo -e "${YELLOW}Press Ctrl+C to stop the tunnel${NC}"
      echo ""
    fi
  fi
  echo "$line"
done
