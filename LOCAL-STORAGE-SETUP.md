# Local Storage Setup - SQLite + IndexedDB

## 🎯 Overview

The application now uses **local storage only** - no PostgreSQL or external databases required!

- **Backend:** SQLite (local file: `backend/prisma/data.db`)
- **Frontend:** IndexedDB (browser storage: 50MB-500MB+)
- **No Database Server:** Everything stored locally on the device

## 📁 Storage Locations

### Backend (SQLite)
- **File:** `backend/prisma/data.db`
- **Location:** Local file system
- **Size:** Grows with data (typically < 100MB for thousands of orders)
- **Backup:** Just copy the `.db` file!

### Frontend (IndexedDB)
- **Browser Storage:** IndexedDB API
- **Capacity:** 50MB-500MB+ per device
- **Stores:** Orders, Menu, Categories, Tables, Settings, etc.
- **Offline:** Works completely offline

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
npx prisma generate  # Generate Prisma client for SQLite
```

### 2. Initialize Database

```bash
cd backend
npx prisma db push    # Create SQLite database and tables
npx prisma db seed    # Seed initial data (admin user, sample menu)
```

### 3. Start Application

**Option A: Docker Compose**
```bash
docker-compose up --build
```

**Option B: Local Development**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📊 Database Schema

The SQLite database uses the same Prisma schema as before, just with SQLite provider:

- **User** - Staff members
- **Category** - Menu categories
- **MenuItem** - Menu items
- **Order** - Orders
- **OrderItem** - Order items
- **Transaction** - Payment transactions
- **Table** - Restaurant tables
- **Reservation** - Reservations
- **Settings** - System settings
- **Attendance** - Staff attendance
- **Shift** - Staff shifts

## 💾 Data Persistence

### SQLite Database File
- **Location:** `backend/prisma/data.db`
- **Backup:** Copy the `.db` file to backup
- **Restore:** Replace `.db` file to restore
- **Portable:** Database file can be moved between devices

### IndexedDB (Browser)
- **Automatic:** Managed by browser
- **Per Device:** Each device has its own storage
- **Offline:** Works without internet
- **Sync:** Frontend syncs with backend when online

## 🔧 Configuration

### Backend (.env)
```env
PORT=5001
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
# No DATABASE_URL needed - SQLite uses file path from schema.prisma
```

### Docker Compose
- **Volume:** SQLite database file is persisted via volume
- **No PostgreSQL:** Removed PostgreSQL service
- **Simpler:** Just backend + frontend

## 📱 Benefits

1. **No Database Server:** No PostgreSQL to manage
2. **Local Storage:** All data stored on device
3. **Fast:** SQLite is very fast for local operations
4. **Portable:** Database file can be moved/copied
5. **Offline:** Works completely offline
6. **Simple:** Easier setup and deployment

## 🔄 Migration from PostgreSQL

If you had PostgreSQL data:

1. **Export Data:**
   ```bash
   # Export from PostgreSQL
   pg_dump -d restaurant-pos > backup.sql
   ```

2. **Convert to SQLite:**
   - Use a migration tool or manual conversion
   - Or start fresh with seed data

3. **Start Fresh:**
   ```bash
   cd backend
   npx prisma db push
   npx prisma db seed
   ```

## 🗑️ Removed Dependencies

- ✅ `@prisma/adapter-pg` - PostgreSQL adapter
- ✅ `pg` - PostgreSQL client
- ✅ `@supabase/supabase-js` - Supabase client
- ✅ PostgreSQL Docker service

## ✅ What's Still There

- ✅ Prisma ORM (now with SQLite)
- ✅ All controllers and routes (work with SQLite)
- ✅ IndexedDB for frontend offline storage
- ✅ Docker Compose (simplified, no PostgreSQL)

## 🎉 Result

Your POS system now:
- ✅ Uses SQLite (local file storage)
- ✅ Uses IndexedDB (browser storage)
- ✅ Works completely offline
- ✅ No database server needed
- ✅ All data stored locally on device
- ✅ Simple to backup (just copy .db file)

Perfect for single-device or local network deployments! 🚀
