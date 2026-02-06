# 🔧 LINK NOT WORKING? READ THIS!

## ⚡ Quick Fix:

```bash
./start-with-tunnel.sh
```

**That's it!** This will:
- ✅ Start your application
- ✅ Create a NEW working public URL
- ✅ Show you the active link

**⚠️ IMPORTANT:** Keep the terminal open! The link only works while it's running.

---

## Why Links Stop Working

Cloudflare/ngrok tunnels are **temporary** - they stop when:
- You close the terminal
- Your computer goes to sleep
- The tunnel process stops

**Solution:** Run `./start-with-tunnel.sh` to get a fresh, active link.

---

## For Permanent Access

Deploy to Vercel for a permanent URL:
- See `DEPLOY-VERCEL-POSTGRES.md`
- Gets you a permanent `https://your-app.vercel.app` URL
- No need to keep terminal open!

---

## Quick Test

After running `./start-with-tunnel.sh`:
1. Copy the URL shown
2. Open in browser (try incognito mode)
3. Should see login page
4. Login: `admin@restaurant.com` / `admin123`

If it works, share that URL! 🎉
