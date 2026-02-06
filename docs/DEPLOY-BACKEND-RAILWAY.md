# Deploy Backend on Railway (for Netlify Frontend)

This guide helps you deploy the Voxxera POS backend on Railway to work with your Netlify-hosted frontend.

---

## Quick Start

### 1. Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign up with GitHub

### 2. Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `iamsnh1/Restaurant-Pos`
4. Railway will detect the repo

### 3. Configure Service
1. Railway will create a service - click on it
2. Go to **Settings** → **Service Settings**
3. Set **Root Directory:** `backend`
4. Set **Build Command:** `npm install && npx prisma generate`
5. Set **Start Command:** `node server.js`

### 4. Add PostgreSQL Database
1. In your project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will create a PostgreSQL database
4. The `DATABASE_URL` environment variable is automatically set

### 5. Set Environment Variables
Go to your service → **Variables** tab and add:

```
DATABASE_URL=<auto-set from PostgreSQL>
JWT_SECRET=<generate with: openssl rand -base64 32>
PORT=5001
NODE_ENV=production
FRONTEND_URL=https://your-site-name.netlify.app
```

**Generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

### 6. Deploy
1. Railway will automatically deploy when you save settings
2. Wait for deployment to complete (check **Deployments** tab)
3. Get your Railway URL from the service overview (e.g., `https://voxxera-pos-backend.railway.app`)

### 7. Update Netlify Environment Variable
1. Go to Netlify dashboard → Your site → **Site settings** → **Environment variables**
2. Update `VITE_API_URL` to:
   ```
   VITE_API_URL=https://your-railway-url.railway.app/api
   ```
3. Trigger a new Netlify deploy (or wait for auto-deploy)

---

## First User Setup

After both services are deployed:

```bash
curl -X POST https://your-railway-url.railway.app/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

Then log in at your Netlify URL.

---

## Database Migrations

Railway will run migrations automatically on deploy if you have:
- `prisma db push` in your build command, OR
- A custom entrypoint script

For manual migrations:
```bash
# Connect to Railway service shell
railway run npx prisma db push
railway run npx prisma db seed
```

---

## Monitoring

- **Logs:** View real-time logs in Railway dashboard
- **Metrics:** Check CPU, memory, and network usage
- **Deployments:** See deployment history and rollback if needed

---

## Troubleshooting

### Build fails
- Check Root Directory is set to `backend`
- Verify `package.json` exists in backend folder
- Check build logs for specific errors

### Database connection fails
- Verify `DATABASE_URL` is set (should be auto-set from PostgreSQL)
- Check PostgreSQL service is running
- Ensure database is linked to your service

### CORS errors
- Verify `FRONTEND_URL` matches your Netlify domain
- Check backend CORS configuration in `server.js`
- Ensure Netlify domain ends with `.netlify.app`

---

## Cost

Railway offers:
- **Free tier:** $5/month credit (usually enough for small apps)
- **Hobby plan:** $5/month + usage
- **Pro plan:** $20/month + usage

PostgreSQL database is included in your plan.

---

## Alternative: Render

If you prefer Render:

1. Go to [render.com](https://render.com)
2. **New** → **Web Service**
3. Connect GitHub repo
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `node server.js`
5. Add PostgreSQL database (separate service)
6. Set environment variables (same as Railway)
7. Get Render URL and update Netlify
