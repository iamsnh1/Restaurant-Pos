# Deploy Voxxera POS on Netlify

## Overview

Netlify is perfect for hosting the **frontend**, but the **backend** (Node.js + Socket.io) needs to be hosted separately since Netlify Functions don't support persistent WebSocket connections.

**Recommended Setup:**
- **Frontend:** Netlify (this guide)
- **Backend:** Railway, Render, or Fly.io (see backend deployment guide)
- **Database:** PostgreSQL (managed by backend platform or separate service)

---

## Frontend Deployment on Netlify

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Netlify configuration"
   git push origin main
   ```

2. **Connect to Netlify:**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click **"Add new site"** → **"Import an existing project"**
   - Connect to GitHub and select `iamsnh1/Restaurant-Pos`
   - Configure build settings:
     - **Base directory:** `frontend`
     - **Build command:** `npm run build`
     - **Publish directory:** `frontend/dist`
     - **Node version:** `20`

3. **Set Environment Variables:**
   - Go to **Site settings** → **Environment variables**
   - Add:
     ```
     VITE_API_URL=https://your-backend-url.railway.app/api
     ```
     (Replace with your actual backend URL)

4. **Deploy:**
   - Click **"Deploy site"**
   - Wait for build to complete
   - Your site will be live at `https://your-site-name.netlify.app`

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Navigate to frontend directory
cd frontend

# Initialize and deploy
netlify init
# Follow prompts:
# - Create & configure a new site
# - Team: (select your team)
# - Site name: voxxera-pos (or your choice)
# - Build command: npm run build
# - Directory to deploy: dist

# Set environment variable
netlify env:set VITE_API_URL "https://your-backend-url.railway.app/api"

# Deploy
netlify deploy --prod
```

---

## Backend Deployment Options

Since Netlify doesn't support persistent Node.js servers, deploy the backend separately:

### Option A: Railway (Recommended - Easiest)

1. Go to [Railway](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Select `iamsnh1/Restaurant-Pos`
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `node server.js`
5. Add PostgreSQL database:
   - **New** → **Database** → **Add PostgreSQL**
6. Set environment variables:
   - `DATABASE_URL` (auto-set from PostgreSQL)
   - `JWT_SECRET` (generate: `openssl rand -base64 32`)
   - `PORT` = `5001`
   - `NODE_ENV` = `production`
7. Get your Railway URL (e.g., `https://voxxera-pos-backend.railway.app`)
8. Update Netlify env var: `VITE_API_URL=https://voxxera-pos-backend.railway.app/api`

### Option B: Render

1. Go to [Render](https://render.com)
2. **New** → **Web Service**
3. Connect GitHub repo: `iamsnh1/Restaurant-Pos`
4. Configure:
   - **Name:** voxxera-pos-backend
   - **Root Directory:** `backend`
   - **Environment:** Node
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `node server.js`
5. Add PostgreSQL database:
   - **New** → **PostgreSQL**
   - Link to your web service
6. Set environment variables (same as Railway)
7. Get Render URL and update Netlify

### Option C: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. In `backend/` directory:
   ```bash
   fly launch
   # Follow prompts, select PostgreSQL
   ```
4. Set environment variables via `fly secrets set`
5. Get Fly URL and update Netlify

---

## CORS Configuration

Make sure your backend allows requests from your Netlify domain:

**backend/server.js** (add this if not present):
```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'https://your-site-name.netlify.app',
    'http://localhost:5173' // for local dev
  ],
  credentials: true
}));
```

---

## First User Setup

After both frontend and backend are deployed:

```bash
curl -X POST https://your-backend-url.railway.app/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

Then log in at your Netlify URL with:
- **Email:** admin@restaurant.com
- **Password:** admin123

---

## Continuous Deployment

Netlify automatically deploys when you push to `main` branch. Make sure:
- ✅ `netlify.toml` is in `frontend/` directory
- ✅ `_redirects` is in `frontend/public/` directory
- ✅ Environment variables are set in Netlify dashboard
- ✅ Backend URL is correct in `VITE_API_URL`

---

## Troubleshooting

### Build fails
- Check Node version (should be 20)
- Verify `package.json` has correct build script
- Check Netlify build logs

### API calls fail (CORS errors)
- Verify `VITE_API_URL` is set correctly
- Check backend CORS configuration includes Netlify domain
- Ensure backend is running and accessible

### Socket.io not connecting
- Socket.io requires persistent connections (not supported by Netlify Functions)
- Backend must be on Railway/Render/Fly.io (not Netlify Functions)

---

## Files Created

- `frontend/netlify.toml` - Netlify build configuration
- `frontend/public/_redirects` - SPA routing fallback
- `docs/DEPLOY-NETLIFY.md` - This guide
