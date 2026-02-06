# 🔌 Port Forwarding Instructions

## ✅ Application Status

**Application is RUNNING!**

- ✅ **Local Access:** http://localhost:80
- ✅ **Network Access:** http://192.168.1.2:80
- ✅ **Backend API:** http://192.168.1.2:5001/api

## 📋 Your Network Information

- **Local IP:** `192.168.1.2`
- **Router IP:** `192.168.1.1` (likely)
- **Port to Forward:** `80`

## 🔧 Router Port Forwarding Setup

### Step 1: Access Your Router

1. Open browser
2. Go to: `http://192.168.1.1` (or check router label)
3. Login with admin credentials

### Step 2: Find Port Forwarding Section

Look for one of these:
- **Port Forwarding**
- **Virtual Server**
- **NAT**
- **Firewall → Port Forwarding**
- **Advanced → Port Forwarding**

### Step 3: Add Port Forwarding Rule

Create a new rule with these settings:

```
Service Name:    Restaurant POS
External Port:   80
Internal IP:     192.168.1.2
Internal Port:   80
Protocol:        TCP
Status:          Enabled
```

### Step 4: Save and Apply

1. Click **Save** or **Apply**
2. Router may restart (wait 1-2 minutes)
3. Done!

## 🌍 Access from Internet

After port forwarding is configured:

**Your Public URL:**
```
http://YOUR_PUBLIC_IP:80
```

**To find your public IP:**
```bash
curl -4 ifconfig.me
```

## ⚡ Quick Alternative (No Router Config Needed!)

If you don't want to configure router, use this instead:

```bash
./start-with-tunnel.sh
```

This creates an instant public URL without router configuration!

## 🔐 Login Credentials

- **Email:** `admin@restaurant.com`
- **Password:** `admin123`

## ✅ Test Access

1. **Local Test:**
   ```bash
   curl http://localhost:80
   # Should return HTML
   ```

2. **Network Test:**
   - From another device on same network
   - Go to: `http://192.168.1.2:80`
   - Should see login page

3. **Public Test (after port forwarding):**
   - From mobile data (not WiFi)
   - Go to: `http://YOUR_PUBLIC_IP:80`
   - Should see login page

## 🐛 Troubleshooting

### Can't Access Router

- Try: `http://192.168.0.1`
- Check router label for default IP
- Reset router if needed

### Port Forwarding Not Working

1. **Check firewall:**
   ```bash
   # macOS: System Preferences → Security → Firewall
   # Allow incoming connections
   ```

2. **Verify static IP:**
   - Your computer needs static IP: `192.168.1.2`
   - Check network settings

3. **Test locally first:**
   ```bash
   curl http://192.168.1.2:80
   ```

### ISP Blocks Port 80

Some ISPs block port 80. Use alternative port:

1. Change docker-compose.yml:
   ```yaml
   ports:
     - "8080:80"  # Use 8080 instead
   ```

2. Forward port 8080 in router
3. Access via: `http://YOUR_PUBLIC_IP:8080`

## 🎉 Success!

Once port forwarding is configured, anyone can access:
```
http://YOUR_PUBLIC_IP:80
```

Share this URL with your team worldwide! 🌍
