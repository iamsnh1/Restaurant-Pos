# 🔧 Troubleshoot Link Issues

## Quick Fix

Run this command to fix and test everything:

```bash
./fix-and-test.sh
```

This will:
1. ✅ Check Docker is running
2. ✅ Clean up old containers
3. ✅ Build and start the application
4. ✅ Wait for app to be ready
5. ✅ Install cloudflared if needed
6. ✅ Create public URL
7. ✅ Display working URL

## Common Issues & Fixes

### Issue 1: Application Not Running

**Symptoms:** Link shows "connection refused" or timeout

**Fix:**
```bash
# Check if app is running
./test-link.sh

# If not running, start it:
./start.sh

# Wait for it to start, then create URL:
./fix-and-test.sh
```

### Issue 2: Docker Not Running

**Symptoms:** Script fails immediately

**Fix:**
1. **macOS:** Open Docker Desktop app
2. **Linux:** `sudo systemctl start docker`
3. Wait for Docker to start
4. Run `./fix-and-test.sh` again

### Issue 3: Port Already in Use

**Symptoms:** "Port 80 already in use" error

**Fix:**
```bash
# Stop everything
docker-compose down

# Check what's using port 80
lsof -i :80  # macOS/Linux
netstat -ano | findstr :80  # Windows

# Kill the process or change port in docker-compose.yml
```

### Issue 4: Cloudflare Tunnel Not Working

**Symptoms:** URL created but doesn't load

**Fix:**
```bash
# Make sure app is accessible locally first
curl http://localhost:80

# If that works, try tunnel again:
cloudflared tunnel --url http://localhost:80

# If still not working, try ngrok instead:
./ngrok-setup.sh
```

### Issue 5: Link Works But Shows Error Page

**Symptoms:** URL loads but shows error

**Check:**
1. Application logs: `docker-compose logs`
2. Frontend logs: `docker-compose logs frontend`
3. Backend logs: `docker-compose logs backend`

**Fix:**
```bash
# Restart everything
docker-compose down
docker-compose up --build

# Then create URL again
./fix-and-test.sh
```

## Step-by-Step Debugging

### Step 1: Verify Application is Running

```bash
# Test local access
curl http://localhost:80

# Should return HTML, not error
```

### Step 2: Check Docker Containers

```bash
docker-compose ps

# Should show:
# - backend (running)
# - frontend (running)
```

### Step 3: Check Logs

```bash
# View all logs
docker-compose logs

# View specific service
docker-compose logs frontend
docker-compose logs backend
```

### Step 4: Test API

```bash
# Test backend API
curl http://localhost:5001/api

# Should return: "API is running..."
```

### Step 5: Create Public URL

```bash
# Use the fix script
./fix-and-test.sh

# Or manually:
cloudflared tunnel --url http://localhost:80
```

## Alternative: Use ngrok Instead

If Cloudflare Tunnel doesn't work, use ngrok:

```bash
# Install ngrok
brew install ngrok  # macOS
# Or download from ngrok.com

# Start app
./start.sh

# Create ngrok tunnel
ngrok http 80

# Copy the HTTPS URL shown
```

## Still Not Working?

1. **Check firewall:**
   ```bash
   # macOS: System Preferences → Security → Firewall
   # Linux: sudo ufw allow 80
   ```

2. **Check router:**
   - Some routers block port 80
   - Try port 8080 instead (update docker-compose.yml)

3. **Check ISP:**
   - Some ISPs block incoming connections
   - Use Cloudflare Tunnel or ngrok (they bypass this)

4. **View detailed logs:**
   ```bash
   docker-compose logs -f
   ```

## Quick Test Commands

```bash
# Test 1: Is app running?
curl http://localhost:80

# Test 2: Is API working?
curl http://localhost:5001/api

# Test 3: Are containers running?
docker-compose ps

# Test 4: Full test
./test-link.sh
```

## ✅ Success Checklist

- [ ] Docker is running
- [ ] Application starts without errors
- [ ] `curl http://localhost:80` works
- [ ] `curl http://localhost:5001/api` works
- [ ] cloudflared is installed
- [ ] Public URL is created
- [ ] URL works in browser

## 🆘 Still Having Issues?

Run the comprehensive fix script:

```bash
./fix-and-test.sh
```

This will diagnose and fix most issues automatically!
