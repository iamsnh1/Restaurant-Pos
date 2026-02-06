# 🌍 Quick Global Access - 3 Easy Methods

## Method 1: ngrok (Fastest - 2 minutes) ⚡

```bash
# Install ngrok (one time)
brew install ngrok  # macOS
# Or download from https://ngrok.com

# Start your app
./start.sh

# In another terminal, run:
./ngrok-setup.sh

# You'll get a URL like: https://abc123.ngrok-free.app
# Share this URL with anyone in the world!
```

**✅ Pros:** Instant, free HTTPS, no setup  
**⚠️ Cons:** URL changes each time (free tier)

---

## Method 2: Cloudflare Tunnel (Best - Free Forever) ⭐

```bash
# Install cloudflared (one time)
brew install cloudflare/cloudflare/cloudflared  # macOS
# Or download from GitHub

# Start your app
./start.sh

# In another terminal, run:
./cloudflare-tunnel.sh

# You'll get a permanent URL like: https://restaurant-pos.trycloudflare.com
# Share this URL - it works forever!
```

**✅ Pros:** Free, permanent URL, automatic HTTPS  
**✅ Cons:** None!

---

## Method 3: Router Port Forwarding (Traditional)

1. **Find your public IP:**
   ```bash
   curl ifconfig.me
   ```

2. **Configure router:**
   - Access router admin (usually `192.168.1.1`)
   - Port Forwarding → Add rule:
     - Port 80 → Your computer's IP
   - Save

3. **Access from anywhere:**
   ```
   http://YOUR_PUBLIC_IP:80
   ```

**✅ Pros:** Direct access, full control  
**⚠️ Cons:** Requires router access, IP may change

---

## 🎯 Recommended: Use Cloudflare Tunnel

It's **free**, **permanent**, and **automatic HTTPS**!

```bash
./cloudflare-tunnel.sh
```

That's it! Share the URL with your team worldwide! 🌍
