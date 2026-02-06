# Netlify Deployment - Quick Start Guide

Deploy Voxxera POS frontend on Netlify in 5 minutes!

---

## Prerequisites

- GitHub account with repo: `iamsnh1/Restaurant-Pos`
- Netlify account ([sign up free](https://app.netlify.com))
- Backend hosted on Railway/Render (see `docs/DEPLOY-BACKEND-RAILWAY.md`)

---

## Step 1: Deploy Frontend on Netlify

### Via Dashboard (Easiest)

1. **Go to Netlify:** https://app.netlify.com
2. **Add new site** → **Import an existing project**
3. **Connect to GitHub** → Select `iamsnh1/Restaurant-Pos`
4. **Configure build:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
5. **Add environment variable:**
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url.railway.app/api` (update after backend deploy)
6. **Deploy site**

### Via CLI

```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify init
# Follow prompts, then:
netlify env:set VITE_API_URL "https://your-backend-url.railway.app/api"
netlify deploy --prod
```

---

## Step 2: Deploy Backend on Railway

See detailed guide: `docs/DEPLOY-BACKEND-RAILWAY.md`

**Quick version:**
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select repo → Set Root Directory: `backend`
3. Add PostgreSQL database
4. Set env vars: `JWT_SECRET`, `PORT=5001`, `NODE_ENV=production`
5. Get Railway URL (e.g., `https://voxxera-pos.railway.app`)
6. Update Netlify `VITE_API_URL` to `https://your-railway-url.railway.app/api`

---

## Step 3: Create First Admin User

```bash
curl -X POST https://your-backend-url.railway.app/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

---

## Step 4: Login

Go to your Netlify URL and log in with:
- **Email:** admin@restaurant.com
- **Password:** admin123

---

## Files Created

- ✅ `frontend/netlify.toml` - Netlify configuration
- ✅ `frontend/public/_redirects` - SPA routing
- ✅ `docs/DEPLOY-NETLIFY.md` - Full deployment guide
- ✅ `docs/DEPLOY-BACKEND-RAILWAY.md` - Backend deployment guide

---

## Troubleshooting

**Build fails?**
- Check Node version (should be 20)
- Verify `frontend/package.json` exists
- Check Netlify build logs

**API calls fail?**
- Verify `VITE_API_URL` is correct
- Check backend is running on Railway
- Ensure CORS allows Netlify domain

**Need help?**
- See `docs/DEPLOY-NETLIFY.md` for detailed guide
- Check Railway logs in dashboard
- Check Netlify build logs

---

## Next Steps

- ✅ Frontend deployed on Netlify
- ✅ Backend deployed on Railway
- ✅ Database connected
- ✅ First user created
- 🎉 **You're live!**
