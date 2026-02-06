# 🌍 Global Access Setup - Port Forwarding for Worldwide Access

## 🎯 Goal: Make Your POS Accessible from Anywhere in the World

This guide will help you set up port forwarding so anyone can access your Restaurant POS system from anywhere in the world.

## 🚀 Quick Options

### Option 1: ngrok (Easiest - 5 minutes) ⭐ RECOMMENDED FOR TESTING

**Best for:** Quick testing, demos, temporary access

```bash
# Install ngrok
# macOS
brew install ngrok

# Or download from https://ngrok.com/download

# Start your application first
./start.sh

# In another terminal, expose port 80
ngrok http 80

# You'll get a public URL like:
# https://abc123.ngrok-free.app
# Share this URL with anyone!
```

**Pros:**
- ✅ Works in 2 minutes
- ✅ Automatic HTTPS
- ✅ No router configuration needed
- ✅ Free tier available

**Cons:**
- ⚠️ Free tier has session limits
- ⚠️ URL changes each time (unless paid plan)

### Option 2: Cloudflare Tunnel (Free & Permanent) ⭐ BEST FOR PRODUCTION

**Best for:** Permanent public access, free HTTPS

```bash
# Install cloudflared
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Create tunnel
cloudflared tunnel create restaurant-pos

# Run tunnel (exposes localhost:80 to internet)
cloudflared tunnel --url http://localhost:80

# You'll get a permanent URL like:
# https://restaurant-pos.your-domain.trycloudflare.com
```

**Pros:**
- ✅ Free forever
- ✅ Permanent URL (with custom domain option)
- ✅ Automatic HTTPS
- ✅ No router config needed

**Cons:**
- ⚠️ Requires cloudflared running

### Option 3: Router Port Forwarding (Traditional Method)

**Best for:** Direct access, full control, no third-party services

## 📡 Router Port Forwarding - Step by Step

### Step 1: Find Your Public IP Address

```bash
# Get your public IP
curl ifconfig.me
# Or visit: https://whatismyipaddress.com
```

**Save this IP** - you'll share it with users: `http://YOUR_PUBLIC_IP:80`

### Step 2: Configure Your Router

1. **Access Router Admin Panel:**
   - Usually: `http://192.168.1.1` or `http://192.168.0.1`
   - Check router label for default IP
   - Login with admin credentials

2. **Find Port Forwarding Section:**
   - Look for: "Port Forwarding", "Virtual Server", "NAT", or "Firewall"
   - Common locations:
     - Advanced → Port Forwarding
     - Network → NAT → Port Forwarding
     - Security → Port Forwarding

3. **Add Port Forwarding Rules:**

   **Rule 1: Frontend (HTTP)**
   - **Service Name:** Restaurant POS Frontend
   - **External Port:** 80
   - **Internal IP:** Your computer's local IP (see Step 3)
   - **Internal Port:** 80
   - **Protocol:** TCP
   - **Status:** Enabled

   **Rule 2: Backend API (Optional but Recommended)**
   - **Service Name:** Restaurant POS API
   - **External Port:** 5001
   - **Internal IP:** Your computer's local IP
   - **Internal Port:** 5001
   - **Protocol:** TCP
   - **Status:** Enabled

4. **Save and Apply Changes**

### Step 3: Find Your Computer's Local IP

**macOS:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Look for something like: 192.168.1.100
```

**Linux:**
```bash
hostname -I
# Or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```cmd
ipconfig
# Look for IPv4 Address under your network adapter
```

### Step 4: Configure Static IP (Important!)

Your computer needs a **static IP** so port forwarding always works:

**macOS:**
1. System Preferences → Network
2. Select your connection → Advanced → TCP/IP
3. Configure IPv4: **Manually**
4. Set IP address (e.g., `192.168.1.100`)
5. Subnet: `255.255.255.0`
6. Router: Your router IP (e.g., `192.168.1.1`)

**Linux:**
Edit `/etc/netplan/01-netcfg.yaml`:
```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: no
      addresses: [192.168.1.100/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

**Windows:**
1. Network Settings → Change adapter options
2. Right-click your connection → Properties
3. Internet Protocol Version 4 → Properties
4. Use the following IP address:
   - IP: `192.168.1.100`
   - Subnet: `255.255.255.0`
   - Gateway: `192.168.1.1`

### Step 5: Configure Firewall

**macOS:**
```bash
# Allow incoming connections
sudo pfctl -d  # Disable firewall temporarily for testing
# Or configure in System Preferences → Security → Firewall
```

**Linux:**
```bash
# Allow ports 80 and 5001
sudo ufw allow 80/tcp
sudo ufw allow 5001/tcp
sudo ufw enable
```

**Windows:**
1. Windows Defender Firewall → Advanced Settings
2. Inbound Rules → New Rule
3. Port → TCP → Specific ports: `80, 5001`
4. Allow connection → Apply to all profiles

### Step 6: Start Your Application

```bash
./start.sh
# Or
docker-compose up --build
```

### Step 7: Test Public Access

1. **From another network** (use mobile data, not WiFi):
   - Open browser
   - Go to: `http://YOUR_PUBLIC_IP:80`
   - Should see login page

2. **Test API:**
   ```bash
   curl http://YOUR_PUBLIC_IP:5001/api/auth/setup \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
   ```

## 🔒 Security Considerations

### 1. Use HTTPS (Strongly Recommended)

**Option A: Use Cloudflare Tunnel** (Free HTTPS)
- Automatically provides HTTPS
- No certificate management

**Option B: Use Reverse Proxy with Let's Encrypt**
```bash
# Install nginx and certbot
sudo apt install nginx certbot python3-certbot-nginx

# Get free SSL certificate
sudo certbot --nginx -d your-domain.com
```

**Option C: Use ngrok** (Free HTTPS)
- Automatic HTTPS included

### 2. Change Default Password

```bash
# Login and change via UI, or:
curl -X POST http://YOUR_PUBLIC_IP:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"admin123"}'
# Then use the token to change password
```

### 3. Use Strong JWT Secret

```bash
# Generate secure secret
openssl rand -base64 32

# Set in .env or docker-compose.yml
JWT_SECRET=your-generated-secret
```

### 4. Consider VPN Access

Instead of exposing directly, use:
- **Tailscale** (Free, easy VPN)
- **WireGuard** (Self-hosted VPN)
- **OpenVPN** (Traditional VPN)

## 🌐 Domain Name Setup (Optional but Recommended)

Instead of using IP address, use a domain name:

1. **Buy a domain** (e.g., from Namecheap, GoDaddy)
2. **Set up DNS A Record:**
   - Type: A
   - Name: @ (or subdomain like `pos`)
   - Value: Your public IP
   - TTL: 3600

3. **Access via:** `http://your-domain.com:80`

## 📱 Share Access with Users

### For Public Access:

**Share this URL:**
```
http://YOUR_PUBLIC_IP:80
```

**Or with domain:**
```
http://your-domain.com:80
```

**Or with ngrok:**
```
https://abc123.ngrok-free.app
```

### Default Login Credentials:

- **Email:** `admin@restaurant.com`
- **Password:** `admin123`

**⚠️ IMPORTANT:** Change password after first login!

## 🐛 Troubleshooting

### Can't Access from Internet

1. **Check Port Forwarding:**
   - Verify rules are saved and enabled
   - Check internal IP is correct
   - Ensure computer has static IP

2. **Check Firewall:**
   ```bash
   # Test if port is open
   telnet YOUR_PUBLIC_IP 80
   # Or use online tool: https://www.yougetsignal.com/tools/open-ports/
   ```

3. **Check ISP:**
   - Some ISPs block port 80
   - Try port 8080 instead
   - Update docker-compose.yml: `"8080:80"`

4. **Check Router:**
   - Some routers have "DMZ" mode (exposes all ports)
   - Enable DMZ for your computer's IP (less secure)

### Port 80 Blocked by ISP

**Solution:** Use alternative port (8080, 3000, etc.)

```yaml
# docker-compose.yml
ports:
  - "8080:80"  # Use port 8080 instead
```

Then access via: `http://YOUR_PUBLIC_IP:8080`

### Dynamic IP Address

**Problem:** Public IP changes, breaking access

**Solutions:**
1. **Use Dynamic DNS (DDNS):**
   - Sign up for free DDNS (No-IP, DuckDNS)
   - Update IP automatically
   - Access via: `http://yourname.ddns.net:80`

2. **Use Cloudflare Tunnel:**
   - IP changes don't matter
   - Always accessible via tunnel URL

## ✅ Checklist

- [ ] Application running locally
- [ ] Found public IP address
- [ ] Found local IP address
- [ ] Set static local IP
- [ ] Configured router port forwarding
- [ ] Configured firewall
- [ ] Tested from another network
- [ ] Changed default password
- [ ] Set strong JWT_SECRET
- [ ] Considered HTTPS setup

## 🎉 Success!

Once configured, anyone in the world can access your POS system at:
- `http://YOUR_PUBLIC_IP:80`
- Or your domain/ngrok URL

**Share the URL and login credentials with your team!** 🚀
