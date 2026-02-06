#!/bin/bash
# Quick ngrok setup for global access

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🚀 Setting up ngrok for Global Access${NC}"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
  echo -e "${YELLOW}⚠️  ngrok not found. Installing...${NC}"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if command -v brew &> /dev/null; then
      brew install ngrok
    else
      echo "Please install Homebrew first: https://brew.sh"
      echo "Or download ngrok from: https://ngrok.com/download"
      exit 1
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "Downloading ngrok for Linux..."
    wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
    tar -xzf ngrok-v3-stable-linux-amd64.tgz
    sudo mv ngrok /usr/local/bin/
    rm ngrok-v3-stable-linux-amd64.tgz
  else
    echo "Please download ngrok from: https://ngrok.com/download"
    exit 1
  fi
fi

echo -e "${GREEN}✅ ngrok installed${NC}"
echo ""

# Check if application is running
if ! curl -s http://localhost:80 > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Application not running on port 80${NC}"
  echo -e "${CYAN}Starting application in background...${NC}"
  ./start.sh &
  sleep 10
fi

echo -e "${BLUE}🌍 Starting ngrok tunnel...${NC}"
echo ""
echo -e "${CYAN}Your public URL will be displayed below:${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Start ngrok
ngrok http 80
