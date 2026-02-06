#!/bin/bash
# Get Working Public URL Right Now

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌍 Getting Working Public URL...${NC}"
echo ""

# Check if app is running
if ! curl -s http://localhost:80 > /dev/null 2>&1; then
  echo "Starting application..."
  docker-compose up -d
  sleep 10
fi

# Check for ngrok
if command -v ngrok &> /dev/null; then
  echo -e "${GREEN}✅ Using ngrok${NC}"
  echo ""
  
  # Kill existing ngrok
  pkill ngrok 2>/dev/null || true
  sleep 2
  
  # Start ngrok in background
  ngrok http 80 > /tmp/ngrok.log 2>&1 &
  sleep 5
  
  # Get URL from API
  URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('tunnels'):
        print(data['tunnels'][0]['public_url'])
except:
    pass
" 2>/dev/null)
  
  if [ -z "$URL" ]; then
    # Try alternative method
    URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)
  fi
  
  if [ ! -z "$URL" ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ YOUR WORKING PUBLIC URL:${NC}"
    echo -e "${CYAN}  $URL${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}📋 Copy this URL - it works NOW!${NC}"
    echo -e "${YELLOW}🔐 Login: admin@restaurant.com / admin123${NC}"
    echo ""
    echo -e "${BLUE}✅ This URL works from anywhere!${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Keep ngrok running to keep link active${NC}"
    echo -e "${CYAN}View tunnel: http://localhost:4040${NC}"
    echo ""
    echo -e "${YELLOW}To stop: pkill ngrok${NC}"
  else
    echo -e "${YELLOW}⚠️  ngrok started. Check: http://localhost:4040${NC}"
    echo "Or run: ngrok http 80"
  fi
  
elif command -v cloudflared &> /dev/null; then
  echo -e "${GREEN}✅ Using Cloudflare Tunnel${NC}"
  echo ""
  echo -e "${CYAN}Starting tunnel...${NC}"
  cloudflared tunnel --url http://localhost:80
  
else
  echo -e "${YELLOW}⚠️  No tunnel tool found. Installing ngrok...${NC}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &> /dev/null; then
      brew install ngrok
      echo "Run this script again!"
    else
      echo "Install ngrok: https://ngrok.com/download"
    fi
  fi
fi
