# Quick Start - Local Storage (SQLite + IndexedDB)

## 🚀 Setup in 3 Steps

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd ../frontend
npm install
```

### Step 2: Initialize Database

```bash
cd backend
npx prisma db push    # Creates SQLite database file
npx prisma db seed    # Seeds admin user and sample data
```

### Step 3: Start Application

**Option A: Docker**
```bash
docker-compose up --build
# Access at http://localhost
```

**Option B: Local Development**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
# Access at http://localhost:5173
```

## 📁 Storage Locations

- **Backend:** `backend/prisma/data.db` (SQLite file)
- **Frontend:** Browser IndexedDB (automatic)

## 🔑 Default Login

- **Email:** admin@restaurant.com
- **Password:** admin123

## ✅ That's It!

No PostgreSQL, no database server, no external dependencies!
All data stored locally on your device.
