#!/bin/bash
# Get Public URL - Creates a link anyone in the world can use

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🌍 Creating Public URL for Global Access${NC}"
echo ""

# Check if application is running
check_app_running() {
  # Try multiple ports and methods
  if curl -s http://localhost:80 > /dev/null 2>&1; then
    return 0
  elif curl -s http://localhost:3000 > /dev/null 2>&1; then
    return 0
  elif curl -s http://127.0.0.1:80 > /dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Start application if not running
if ! check_app_running; then
  echo -e "${YELLOW}⚠️  Application not running. Starting it now...${NC}"
  echo ""
  
  # Check Docker
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
  fi
  
  if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
  fi
  
  # Start in background
  if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    echo -e "${CYAN}Building and starting containers...${NC}"
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
    echo -e "${GREEN}✅ Application starting...${NC}"
    echo -e "${CYAN}Waiting for application to be ready...${NC}"
    
    # Wait up to 60 seconds
    for i in {1..60}; do
      if check_app_running; then
        echo -e "${GREEN}✅ Application is ready!${NC}"
        echo ""
        break
      fi
      if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Application failed to start. Check logs: docker-compose logs${NC}"
        exit 1
      fi
      echo -n "."
      sleep 1
    done
    echo ""
  else
    echo -e "${RED}❌ Docker not found. Please start the application manually first.${NC}"
    echo "Run: ./start.sh"
    exit 1
  fi
fi

# Wait for app to be ready
echo -e "${CYAN}⏳ Waiting for application to be ready...${NC}"
for i in {1..30}; do
  if check_app_running; then
    echo -e "${GREEN}✅ Application is ready!${NC}"
    echo ""
    break
  fi
  sleep 1
done

if ! check_app_running; then
  echo -e "${RED}❌ Application failed to start. Please check manually.${NC}"
  exit 1
fi

# Method 1: Try Cloudflare Tunnel (Best - Free & Permanent)
if command -v cloudflared &> /dev/null; then
  echo -e "${GREEN}✅ Cloudflare Tunnel available${NC}"
  echo ""
  echo -e "${CYAN}🚀 Starting Cloudflare Tunnel...${NC}"
  echo -e "${YELLOW}Your public URL will appear below:${NC}"
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  🌍 PUBLIC URL (Share this with anyone!):${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  # Start cloudflare tunnel
  cloudflared tunnel --url http://localhost:80 2>&1 | while IFS= read -r line; do
    if [[ $line == *"https://"* ]]; then
      URL=$(echo "$line" | grep -oP 'https://[^\s]+' | head -1)
      if [ ! -z "$URL" ]; then
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}  ✅ YOUR PUBLIC URL:${NC}"
        echo -e "${CYAN}  $URL${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${YELLOW}📋 Copy this URL and share it with anyone!${NC}"
        echo -e "${YELLOW}🔐 Login: admin@restaurant.com / admin123${NC}"
        echo ""
        echo -e "${BLUE}Press Ctrl+C to stop the tunnel${NC}"
        echo ""
      fi
    fi
    echo "$line"
  done
  exit 0
fi

# Method 2: Try ngrok (Quick but URL changes)
if command -v ngrok &> /dev/null; then
  echo -e "${GREEN}✅ ngrok available${NC}"
  echo ""
  echo -e "${CYAN}🚀 Starting ngrok tunnel...${NC}"
  echo ""
  
  # Start ngrok in background and capture URL
  ngrok http 80 --log=stdout > /tmp/ngrok.log 2>&1 &
  NGROK_PID=$!
  
  sleep 3
  
  # Try to get URL from ngrok API
  for i in {1..10}; do
    URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -oP 'https://[^"]+' | head -1)
    if [ ! -z "$URL" ]; then
      echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo -e "${GREEN}  ✅ YOUR PUBLIC URL:${NC}"
      echo -e "${CYAN}  $URL${NC}"
      echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo ""
      echo -e "${YELLOW}📋 Copy this URL and share it with anyone!${NC}"
      echo -e "${YELLOW}🔐 Login: admin@restaurant.com / admin123${NC}"
      echo ""
      echo -e "${BLUE}Press Ctrl+C to stop${NC}"
      echo ""
      
      # Keep ngrok running
      wait $NGROK_PID
      exit 0
    fi
    sleep 1
  done
  
  echo -e "${YELLOW}⚠️  ngrok started but URL not detected. Check: http://localhost:4040${NC}"
  wait $NGROK_PID
  exit 0
fi

# Method 3: Instructions for manual setup
echo -e "${RED}❌ No tunneling service found${NC}"
echo ""
echo -e "${YELLOW}📦 Installing Cloudflare Tunnel (Recommended - Free & Permanent)...${NC}"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
  if command -v brew &> /dev/null; then
    echo "Installing cloudflared..."
    brew install cloudflare/cloudflare/cloudflared
    echo ""
    echo -e "${GREEN}✅ Installed! Run this script again.${NC}"
  else
    echo -e "${YELLOW}Please install Homebrew first:${NC}"
    echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo ""
    echo "Then run: brew install cloudflare/cloudflare/cloudflared"
  fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "Downloading cloudflared..."
  wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /tmp/cloudflared
  chmod +x /tmp/cloudflared
  sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
  echo -e "${GREEN}✅ Installed! Run this script again.${NC}"
else
  echo -e "${YELLOW}Please install cloudflared manually:${NC}"
  echo "  Visit: https://github.com/cloudflare/cloudflared/releases"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Alternative: Router Port Forwarding${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. Find your public IP:"
echo "   curl ifconfig.me"
echo ""
echo "2. Configure router port forwarding (port 80)"
echo ""
echo "3. Access via: http://YOUR_PUBLIC_IP:80"
echo ""
echo "See GLOBAL-ACCESS-SETUP.md for details"
