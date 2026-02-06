# Railway Deployment - Quick Setup

## ✅ What's Done

1. ✅ Railway project created: `voxxera-pos`
2. ✅ Environment variables set:
   - `PORT=5001`
   - `NODE_ENV=production`
   - `JWT_SECRET=xSYxk2NEmWWrvp1cyIK7m0fLM8kXmI6jAOwsiKZw1J8=`
3. ✅ Build started (checking Dockerfile)

## 🔧 Next Steps (Do This Now)

### 1. Add PostgreSQL Database

**Go to Railway Dashboard:** https://railway.com/project/db21f84f-5457-4a22-b7fa-91aa9c14e58d

1. Click **"+ New"** button
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will create the database and **automatically set `DATABASE_URL`** environment variable

### 2. Generate Public Domain

1. In Railway dashboard, click on your **service** (the one building)
2. Go to **Settings** tab
3. Scroll to **Networking** section
4. Click **"Generate Domain"**
5. Copy the domain (e.g., `https://voxxera-pos-production.up.railway.app`)

### 3. Wait for Build to Complete

- Check build logs: https://railway.com/project/db21f84f-5457-4a22-b7fa-91aa9c14e58d/service/0b078194-19b7-453e-85fa-c3359f35017e
- Build usually takes 3-5 minutes
- Railway will:
  - Build Docker image (frontend + backend)
  - Run `prisma db push` (migrations)
  - Run `prisma db seed` (create admin user)
  - Start the app

### 4. Create First Admin User

After deployment completes and you have your domain:

```bash
curl -X POST https://YOUR-RAILWAY-DOMAIN/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

Replace `YOUR-RAILWAY-DOMAIN` with your actual Railway URL.

### 5. Login

Visit your Railway domain and log in with:
- **Email:** admin@restaurant.com
- **Password:** admin123

---

## 🚀 CLI Commands (Optional)

If you prefer CLI:

```bash
# Check status
railway status

# View logs
railway logs

# Generate domain
railway domain

# Check variables
railway variables
```

---

## 📋 Project Info

- **Project ID:** `db21f84f-5457-4a22-b7fa-91aa9c14e58d`
- **Project URL:** https://railway.com/project/db21f84f-5457-4a22-b7fa-91aa9c14e58d
- **Service ID:** `0b078194-19b7-453e-85fa-c3359f35017e`

---

## ⚠️ Important

1. **Add PostgreSQL database** - This is required! Do it in the Railway dashboard.
2. **Generate domain** - Your app won't be accessible without a public domain.
3. **Wait for build** - First build takes 3-5 minutes.

---

## 🎉 That's It!

Once PostgreSQL is added and build completes, your app will be live!
