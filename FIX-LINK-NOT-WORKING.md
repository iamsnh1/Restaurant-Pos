# 🔧 Fix: Link Not Working (DNS Error)

## ⚡ Quick Fix - Run This:

```bash
./start-with-tunnel.sh
```

This will:
1. ✅ Start your application
2. ✅ Create a NEW working tunnel
3. ✅ Show you the ACTIVE URL
4. ✅ Keep it running

**⚠️ IMPORTANT:** Keep the terminal open! The link only works while the tunnel is running.

---

## 🐛 Why Your Link Stopped Working

The error `DNS_PROBE_FINISHED_NXDOMAIN` means:
- The Cloudflare tunnel stopped running
- The URL expired (temporary URLs can expire)
- The tunnel wasn't started properly

**Solution:** Start a fresh tunnel with the script above.

---

## 🔄 Two Ways to Keep Link Active

### Option 1: Keep Terminal Open (Simple)

```bash
./start-with-tunnel.sh
```

**Keep this terminal window open** - the link works as long as it's running.

### Option 2: Run in Background (Advanced)

```bash
# Start app
docker-compose up -d

# Start tunnel in background
nohup cloudflared tunnel --url http://localhost:80 > tunnel.log 2>&1 &

# Or with ngrok
nohup ngrok http 80 > ngrok.log 2>&1 &
```

---

## 🎯 Recommended: Use ngrok (More Reliable)

ngrok URLs are more stable. To use ngrok:

```bash
# Install ngrok (one time)
brew install ngrok  # macOS
# Or download from https://ngrok.com

# Start app
./start.sh

# Start ngrok tunnel
ngrok http 80

# Copy the HTTPS URL shown (e.g., https://abc123.ngrok-free.app)
```

**ngrok benefits:**
- ✅ More reliable URLs
- ✅ Web interface at http://localhost:4040
- ✅ Better for testing

---

## ✅ Step-by-Step Fix

1. **Stop everything:**
   ```bash
   docker-compose down
   pkill cloudflared 2>/dev/null || true
   pkill ngrok 2>/dev/null || true
   ```

2. **Start fresh:**
   ```bash
   ./start-with-tunnel.sh
   ```

3. **Copy the NEW URL shown**

4. **Test in browser** - should work now!

5. **Keep terminal open** - link stays active

---

## 🔍 Verify It's Working

After running the script, you should see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ YOUR WORKING PUBLIC URL:
  https://abc123.ngrok-free.app
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Test it:**
1. Copy the URL
2. Open in a new browser/incognito window
3. Should see login page
4. Login works!

---

## ⚠️ Important Notes

1. **Tunnel Must Stay Running:** The link only works while the tunnel process is active
2. **Terminal Must Stay Open:** Don't close the terminal running the tunnel
3. **URL May Change:** Each time you restart, you might get a new URL
4. **For Permanent URL:** Consider deploying to Vercel (see DEPLOY-VERCEL-POSTGRES.md)

---

## 🆘 Still Not Working?

1. **Check application is running:**
   ```bash
   curl http://localhost:80
   # Should return HTML, not error
   ```

2. **Check tunnel is running:**
   ```bash
   # For ngrok
   curl http://localhost:4040/api/tunnels
   
   # Should show tunnel info
   ```

3. **View logs:**
   ```bash
   docker-compose logs
   ```

4. **Try ngrok instead:**
   ```bash
   ngrok http 80
   ```

---

## ✅ Success Checklist

- [ ] Application running (`curl http://localhost:80` works)
- [ ] Tunnel started (`./start-with-tunnel.sh`)
- [ ] URL displayed in terminal
- [ ] URL works in browser (test in incognito)
- [ ] Terminal kept open (tunnel still running)

---

## 🎉 That's It!

Run `./start-with-tunnel.sh` and you'll get a **working link** that stays active as long as you keep the terminal open!
