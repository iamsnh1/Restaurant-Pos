# Alternative Hosting Options

Since DigitalOcean has account hold issues, here are better alternatives:

## Option 1: Railway (Recommended) ⭐

**Easiest deployment - just connect GitHub!**

### Steps:
1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `iamsnh1/Restaurant-Pos`
4. Railway will auto-detect the `Dockerfile` and `railway.json`
5. Add PostgreSQL database:
   - Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
6. Set environment variables:
   - `DATABASE_URL` - Auto-set from PostgreSQL service
   - `JWT_SECRET` - Generate: `openssl rand -base64 32`
   - `NODE_ENV` = `production`
   - `PORT` = `80`
   - `FRONTEND_URL` = Your Railway app URL (auto-set)
7. Deploy!

**That's it!** Railway handles everything automatically.

### Pricing:
- Free tier: $5 credit/month
- Paid: Pay-as-you-go

---

## Option 2: Render

**One-click deployment with Blueprint**

### Steps:
1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Blueprint"**
3. Connect GitHub repo: `iamsnh1/Restaurant-Pos`
4. Render will use `render.yaml` automatically
5. Review and deploy!

The `render.yaml` file already configures:
- Web service (Docker)
- PostgreSQL database
- Environment variables

### Pricing:
- Free tier: Limited hours/month
- Paid: $7/month for web service + database

---

## Option 3: Fly.io

**Global edge deployment**

### Steps:
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch` (from project root)
4. Follow prompts:
   - Select organization
   - App name: `voxxera-pos`
   - Region: Choose closest
   - PostgreSQL: Yes (creates managed DB)
5. Set secrets:
   ```bash
   fly secrets set JWT_SECRET=$(openssl rand -base64 32)
   fly secrets set DATABASE_URL=<from-postgres-service>
   ```
6. Deploy: `fly deploy`

### Pricing:
- Free tier: 3 shared VMs
- Paid: Pay-as-you-go

---

## Option 4: Vercel (Frontend) + Railway/Render (Backend)

**Split deployment**

### Frontend on Vercel:
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Root directory: `frontend`
4. Build command: `npm run build`
5. Output: `dist`
6. Environment: `VITE_API_URL` = Your backend URL

### Backend on Railway/Render:
- Deploy backend separately (see Option 1 or 2)
- Use backend URL in frontend env

---

## Recommended: Railway

**Why Railway?**
- ✅ Easiest setup (just connect GitHub)
- ✅ Auto-detects Dockerfile
- ✅ Managed PostgreSQL included
- ✅ Free tier available
- ✅ No account holds/issues
- ✅ Great developer experience

### Quick Start:
```bash
# 1. Push to GitHub (already done)
git push origin main

# 2. Go to railway.app
# 3. Connect repo
# 4. Add PostgreSQL
# 5. Set JWT_SECRET
# 6. Deploy!

# That's it! 🚀
```

---

## Files Created

- `Dockerfile` - Single-container deployment (frontend + backend)
- `railway.json` - Railway configuration
- `render.yaml` - Render Blueprint
- `nginx.prod.conf` - Nginx config for single container

All ready to deploy! 🎉
