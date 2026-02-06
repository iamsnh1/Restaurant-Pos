# 🌐 Public Access & Port Forwarding Setup

## ✅ What This Setup Provides

- **Public Access:** Anyone can access your POS system
- **Port Forwarding:** Works on local network (LAN)
- **Auto-Detection:** Frontend automatically finds backend API
- **First-Time Setup:** Automatic admin user creation

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Start the application
./start.sh

# Or manually:
docker-compose up --build
```

**Access URLs:**
- Local: `http://localhost:80`
- Network: `http://YOUR_IP:80`
- API: `http://YOUR_IP:5001/api`

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Access URLs:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001/api`

## 🔐 First-Time Login

### Automatic Setup (Recommended)

The database is automatically seeded with:
- **Email:** `admin@restaurant.com`
- **Password:** `admin123`

### Manual Setup

If you need to create the first admin manually:

```bash
curl -X POST http://YOUR_IP:5001/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@restaurant.com",
    "password": "admin123"
  }'
```

## 📡 Port Forwarding for Network Access

### Step 1: Find Your IP Address

**macOS/Linux:**
```bash
# Get local IP
ifconfig | grep "inet " | grep -v 127.0.0.1
# Or
hostname -I
```

**Windows:**
```cmd
ipconfig
# Look for IPv4 Address
```

### Step 2: Configure Router Port Forwarding

1. Access your router admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Go to **Port Forwarding** or **Virtual Server**
3. Add rules:
   - **Port 80** → Your computer's IP (for frontend)
   - **Port 5001** → Your computer's IP (for backend API)
4. Save and restart router

### Step 3: Access from Network

Once port forwarding is configured:
- **Local Network:** `http://YOUR_LOCAL_IP:80`
- **Public Internet:** `http://YOUR_PUBLIC_IP:80`

Find your public IP:
```bash
curl ifconfig.me
```

## 🌍 Public Internet Access

### Option 1: Vercel Deployment (Recommended)

Deploy to Vercel for automatic public access:

```bash
# Follow DEPLOY-VERCEL-POSTGRES.md
vercel --prod
```

### Option 2: Cloud Hosting

Deploy to any cloud provider:
- **DigitalOcean Droplet**
- **AWS EC2**
- **Google Cloud Compute**
- **Azure VM**

### Option 3: ngrok (Quick Testing)

For quick public access without deployment:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Expose local server
ngrok http 80

# You'll get a public URL like: https://abc123.ngrok.io
```

## 🔧 Configuration

### Backend Configuration

**Environment Variables** (`.env` or `docker-compose.yml`):

```env
PORT=5001
HOST=0.0.0.0  # Bind to all interfaces
JWT_SECRET=your-secure-secret
FRONTEND_URL=http://YOUR_IP:80
```

### Frontend Configuration

The frontend automatically detects the API URL:
- **Same origin:** Uses `/api` (relative path)
- **Localhost:** Uses `http://localhost:5001/api`
- **Network:** Uses `http://YOUR_IP:5001/api`

To override, set `VITE_API_URL` in `frontend/.env`:

```env
VITE_API_URL=http://YOUR_IP:5001/api
```

## 🔒 Security Considerations

### For Public Access:

1. **Change Default Password:**
   ```bash
   # Login and change password via UI
   # Or use API:
   curl -X POST http://YOUR_IP:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@restaurant.com","password":"admin123"}'
   ```

2. **Use Strong JWT Secret:**
   ```bash
   # Generate secure secret
   openssl rand -base64 32
   ```

3. **Enable HTTPS:**
   - Use reverse proxy (nginx) with SSL certificate
   - Or deploy to Vercel (automatic HTTPS)

4. **Firewall Rules:**
   - Only expose necessary ports (80, 443)
   - Restrict backend port (5001) to local network if possible

## 📱 Access from Mobile Devices

### On Same Network:

1. Find your computer's IP address
2. On mobile device, open browser
3. Navigate to: `http://YOUR_IP:80`
4. Login with credentials

### From Internet:

1. Set up port forwarding (see above)
2. Use public IP or domain name
3. Access from anywhere: `http://YOUR_PUBLIC_IP:80`

## 🐛 Troubleshooting

### Can't Access from Network

1. **Check Firewall:**
   ```bash
   # macOS
   sudo pfctl -d
   
   # Linux
   sudo ufw allow 80
   sudo ufw allow 5001
   ```

2. **Verify Server is Running:**
   ```bash
   # Check if ports are listening
   netstat -an | grep 80
   netstat -an | grep 5001
   ```

3. **Check IP Address:**
   ```bash
   # Make sure you're using the correct IP
   ifconfig
   ```

### API Not Found

1. **Check API URL:**
   - Open browser console (F12)
   - Check Network tab for API calls
   - Verify API URL is correct

2. **Check CORS:**
   - Backend allows all origins by default
   - If issues persist, check server logs

### Database Not Initialized

```bash
cd backend
npx prisma db push
npx prisma db seed
```

## ✅ Checklist

- [ ] Server running on `0.0.0.0` (all interfaces)
- [ ] Ports 80 and 5001 are open
- [ ] Firewall allows connections
- [ ] Database initialized with admin user
- [ ] Can access from `http://localhost:80`
- [ ] Can access from network `http://YOUR_IP:80`
- [ ] Login works with default credentials
- [ ] Port forwarding configured (if needed)

## 🎉 You're All Set!

Your Restaurant POS system is now accessible:
- ✅ **Locally:** `http://localhost:80`
- ✅ **Network:** `http://YOUR_IP:80`
- ✅ **Public:** After port forwarding or deployment

Everyone can now login and use the system! 🚀
