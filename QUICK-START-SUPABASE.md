# Quick Start with Supabase

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → Sign up
2. Click **"New Project"**
3. Set:
   - Name: `voxxera-pos`
   - Database Password: (save this!)
   - Region: (choose closest)
4. Wait 2-3 minutes for setup

## Step 2: Get Connection String

1. Supabase Dashboard → **Settings** → **Database**
2. **Connection string** → **URI** tab
3. Copy connection string
4. Replace `[YOUR-PASSWORD]` with your actual password
5. Add `?sslmode=require` at the end

Example:
```
postgresql://postgres:yourpassword@xxxxx.supabase.co:5432/postgres?sslmode=require
```

## Step 3: Set Environment Variable

### Option A: Local Development

Create `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@xxxxx.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET=$(openssl rand -base64 32)
PORT=5001
FRONTEND_URL=http://localhost:5173
```

Then run:
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

### Option B: Docker with Supabase

Create `.env` file in project root:
```env
DATABASE_URL=postgresql://postgres:yourpassword@xxxxx.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=your_random_secret_here
```

Then run:
```bash
docker-compose -f docker-compose.supabase.yml up --build
```

### Option C: Keep Local PostgreSQL

Just use `docker-compose up` (uses local PostgreSQL)

## Step 4: Run Migrations

```bash
cd backend
npx prisma db push
npx prisma db seed
```

## Step 5: Start App

**Local:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev
```

**Docker:**
```bash
docker-compose -f docker-compose.supabase.yml up
```

## Access App

- Frontend: http://localhost (or http://localhost:5173 for local dev)
- Login: `admin@restaurant.com` / `admin123`

## Deploy to Railway/Render

Set `DATABASE_URL` environment variable to your Supabase connection string in the platform dashboard.

That's it! 🚀
