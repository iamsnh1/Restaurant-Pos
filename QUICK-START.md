# 🚀 Quick Start - Public Access

## Start the Application

```bash
./start.sh
```

Or with Docker:
```bash
docker-compose up --build
```

## Access URLs

After starting, you'll see:
- **Local:** `http://localhost:80`
- **Network:** `http://YOUR_IP:80`
- **API:** `http://YOUR_IP:5001/api`

## First-Time Login

**Default Credentials:**
- Email: `admin@restaurant.com`
- Password: `admin123`

## Port Forwarding

### Find Your IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

### Configure Router:
1. Access router admin (usually `192.168.1.1`)
2. Port Forwarding → Add:
   - Port 80 → Your IP
   - Port 5001 → Your IP

### Access from Internet:
- Use your public IP: `http://YOUR_PUBLIC_IP:80`
- Find public IP: `curl ifconfig.me`

## ✅ Everyone Can Now Access!

- ✅ Server binds to `0.0.0.0` (all network interfaces)
- ✅ CORS allows all origins
- ✅ Ports exposed: 80 (frontend), 5001 (backend)
- ✅ Auto-detects API URL
- ✅ Database auto-initializes with admin user

See `PUBLIC-ACCESS-SETUP.md` for detailed instructions.
