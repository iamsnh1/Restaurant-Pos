# Supabase Setup Guide

## What is Supabase?

Supabase is an open-source Firebase alternative that provides:
- **PostgreSQL Database** (managed, with connection pooling)
- **Authentication** (optional - we're using our own JWT auth)
- **Storage** (for files/images)
- **Real-time subscriptions** (PostgreSQL changes)
- **Free tier** with generous limits

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login
3. Click **"New Project"**
4. Fill in:
   - **Name**: `voxxera-pos` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine to start
5. Click **"Create new project"**
6. Wait 2-3 minutes for project to be ready

## Step 2: Get Connection String

1. In your Supabase project dashboard
2. Go to **Settings** → **Database**
3. Scroll to **"Connection string"** section
4. Select **"URI"** tab
5. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password
7. Add `?sslmode=require` at the end:
   ```
   postgresql://postgres:yourpassword@xxxxx.supabase.co:5432/postgres?sslmode=require
   ```

## Step 3: Set Environment Variables

### For Local Development:

Create `backend/.env`:
```env
PORT=5001
DATABASE_URL="postgresql://postgres:yourpassword@xxxxx.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET=your_secure_random_string_here
FRONTEND_URL=http://localhost:5173
```

### For Docker Compose:

Update `docker-compose.yml` backend service:
```yaml
backend:
  environment:
    DATABASE_URL: "postgresql://postgres:yourpassword@xxxxx.supabase.co:5432/postgres?sslmode=require"
```

Or create `.env` file in project root:
```env
DATABASE_URL=postgresql://postgres:yourpassword@xxxxx.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=your_secure_random_string
```

Then reference in docker-compose.yml:
```yaml
backend:
  environment:
    DATABASE_URL: ${DATABASE_URL}
```

## Step 4: Run Migrations

### Option A: Using Prisma (Recommended)

```bash
cd backend
npx prisma db push
npx prisma db seed
```

### Option B: Using Supabase SQL Editor

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy schema from `backend/prisma/schema.prisma`
3. Convert to SQL (or use Prisma migrations)

## Step 5: Update Docker Compose (Optional)

If you want to keep local PostgreSQL for development:

```yaml
services:
  backend:
    environment:
      # Use Supabase in production, local PostgreSQL in development
      DATABASE_URL: ${DATABASE_URL:-postgresql://postgres:postgres@postgres:5432/restaurant-pos?schema=public}
```

## Step 6: Deploy

### Railway/Render:
Set `DATABASE_URL` environment variable to your Supabase connection string.

### Local:
1. Set `DATABASE_URL` in `backend/.env`
2. Run: `cd backend && npm run dev`

## Benefits of Supabase

✅ **Free tier**: 500MB database, 2GB bandwidth/month  
✅ **Managed**: No server maintenance  
✅ **Fast**: Connection pooling included  
✅ **Secure**: SSL/TLS by default  
✅ **Scalable**: Easy to upgrade  
✅ **PostgreSQL**: Full SQL support with Prisma  

## Connection Pooling (Optional)

Supabase provides connection pooling. For better performance:

1. Go to **Settings** → **Database** → **Connection Pooling**
2. Use the **"Session"** mode connection string for Prisma
3. Or use **"Transaction"** mode for better concurrency

## Storage (Optional - for file uploads)

If you want to use Supabase Storage for PDF receipts/images:

1. Go to **Storage** in Supabase dashboard
2. Create a bucket: `receipts` (public)
3. Install Supabase JS client (already in package.json)
4. Use Supabase Storage API for file uploads

## Troubleshooting

### Connection Errors:
- Check password is correct
- Ensure `?sslmode=require` is in connection string
- Verify project is active (not paused)

### SSL Errors:
- Supabase requires SSL
- Make sure connection string includes `?sslmode=require`
- Check `backend/config/db.js` handles Supabase correctly

### Migration Issues:
- Run `npx prisma db push` to sync schema
- Check Supabase dashboard → **Database** → **Tables** to verify

## Next Steps

1. Create Supabase project
2. Get connection string
3. Update `DATABASE_URL` in environment
4. Run migrations: `npx prisma db push`
5. Seed database: `npx prisma db seed`
6. Start app!

Your app will now use Supabase instead of local PostgreSQL! 🚀
