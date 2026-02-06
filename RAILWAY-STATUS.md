# Railway Deployment Status

## ✅ Completed

1. ✅ Railway project created: **voxxera-pos**
2. ✅ PostgreSQL database added
3. ✅ Environment variables set:
   - `PORT=5001`
   - `NODE_ENV=production`
   - `JWT_SECRET=xSYxk2NEmWWrvp1cyIK7m0fLM8kXmI6jAOwsiKZw1J8=`
   - `DATABASE_URL` (auto-set by Railway from PostgreSQL)
4. ✅ Build triggered

## 🔗 Railway Dashboard

**Open Dashboard:** https://railway.com/project/db21f84f-5457-4a22-b7fa-91aa9c14e58d

## 📋 What to Check in Dashboard

### 1. Verify Services

You should see **2 services**:
- ✅ **Postgres** (database)
- ✅ **Web Service** (your app - should be building/deploying)

### 2. Generate Domain for Web Service

1. Click on your **Web Service** (not Postgres)
2. Go to **Settings** tab
3. Scroll to **Networking**
4. Click **"Generate Domain"**
5. Copy the domain (e.g., `https://voxxera-pos-production.up.railway.app`)

### 3. Check Build Status

- Click on **Web Service**
- Check **Deployments** tab
- Build should complete in 3-5 minutes
- If build fails, check **Logs** tab for errors

### 4. Verify Environment Variables

In **Web Service** → **Variables** tab, verify:
- ✅ `DATABASE_URL` (should be auto-set from Postgres)
- ✅ `PORT=5001`
- ✅ `NODE_ENV=production`
- ✅ `JWT_SECRET=xSYxk2NEmWWrvp1cyIK7m0fLM8kXmI6jAOwsiKZw1J8=`

## 🚀 After Build Completes

### Create First Admin

```bash
curl -X POST https://YOUR-WEB-SERVICE-DOMAIN/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

Replace `YOUR-WEB-SERVICE-DOMAIN` with your actual web service domain (not the Postgres domain).

### Login

Visit your web service domain and log in:
- **Email:** admin@restaurant.com
- **Password:** admin123

## 🐛 Troubleshooting

### Build Fails
- Check **Logs** tab in Railway dashboard
- Verify `Dockerfile` exists at repo root
- Check environment variables are set

### Database Connection Fails
- Verify `DATABASE_URL` is set in web service variables
- Check Postgres service is running
- Ensure Postgres is linked to web service

### Domain Not Working
- Make sure you generated domain for **Web Service**, not Postgres
- Check service is deployed (not just building)
- Wait a few minutes for DNS propagation

## 📞 Need Help?

Check Railway dashboard: https://railway.com/project/db21f84f-5457-4a22-b7fa-91aa9c14e58d
