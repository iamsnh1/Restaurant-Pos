# Deploy Everything on Railway (Single Deployment)

**One click, everything deployed.** Frontend + Backend + Database all together.

---

## Why Railway?

- ✅ **Single deployment** - Frontend + Backend in one Docker container
- ✅ **Managed PostgreSQL** - Database included
- ✅ **Auto-deploy** - Push to GitHub, Railway deploys automatically
- ✅ **Free tier** - $5/month credit (usually enough for small apps)
- ✅ **No separate configs** - Uses your existing `Dockerfile`

---

## Deploy in 5 Minutes

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"**

### Step 2: Deploy from GitHub

1. Select **"Deploy from GitHub repo"**
2. Choose `iamsnh1/Restaurant-Pos`
3. Railway will detect the `Dockerfile` at root

### Step 3: Add PostgreSQL Database

1. In your project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway creates the database automatically
4. The `DATABASE_URL` is auto-set as an environment variable

### Step 4: Set Environment Variables

Go to your service → **Variables** tab and add:

```
DATABASE_URL=<auto-set from PostgreSQL - don't change>
JWT_SECRET=<generate: openssl rand -base64 32>
PORT=5001
NODE_ENV=production
```

**Generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

### Step 5: Deploy

Railway automatically:
- Builds your Docker image (frontend + backend)
- Runs database migrations (`prisma db push`)
- Seeds the database (`prisma db seed`)
- Starts the app

Wait 2-3 minutes for the build to complete.

### Step 6: Get Your URL

1. Click on your service
2. Go to **Settings** → **Networking**
3. Click **"Generate Domain"** (or use the default)
4. Your app is live at: `https://your-app.railway.app`

---

## First Login

After deployment completes:

```bash
curl -X POST https://your-app.railway.app/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

Then visit `https://your-app.railway.app` and log in with:
- **Email:** admin@restaurant.com
- **Password:** admin123

---

## How It Works

Your `Dockerfile` builds:
1. **Frontend** → React app built with Vite → served by Nginx
2. **Backend** → Node.js server running on port 5001
3. **Nginx** → Proxies `/api` and `/socket.io` to backend, serves frontend on `/`

Everything runs in **one container**. No separate deployments needed.

---

## Auto-Deploy

Every time you push to `main` branch:
1. Railway detects the push
2. Rebuilds the Docker image
3. Deploys the new version
4. Zero downtime (rolling updates)

---

## Monitoring

- **Logs:** Real-time logs in Railway dashboard
- **Metrics:** CPU, memory, network usage
- **Deployments:** History and rollback options

---

## Cost

- **Free tier:** $5/month credit (usually covers small apps)
- **Hobby:** $5/month + usage
- **Pro:** $20/month + usage

PostgreSQL database is included in your plan.

---

## Troubleshooting

### Build fails
- Check Railway logs for specific errors
- Verify `Dockerfile` is at repo root
- Ensure `package.json` files exist in `frontend/` and `backend/`

### Database connection fails
- Verify `DATABASE_URL` is set (should be auto-set)
- Check PostgreSQL service is running
- Ensure database is linked to your service

### App doesn't start
- Check logs for errors
- Verify `PORT=5001` is set
- Ensure `JWT_SECRET` is set

---

## That's It!

**One deployment, everything works.** No separate frontend/backend configs, no CORS issues, no URL management. Just push to GitHub and Railway handles the rest.
