# Professional Restaurant POS System

A high-performance, mobile-optimized, and feature-rich Point of Sale system built with React, Node.js, and PostgreSQL.

## Features
- **PWA Support**: Install as a native app on iOS, Android, and Desktop.
- **Real-time Notifications**: Instant kitchen and waiter alerts via WebSockets and Browser Notifications.
- **Mobile First**: Fully responsive UI for tablets and smartphones.
- **Comprehensive Management**: Staff, Inventory, Tables, Reservations, and Analytics.
- **Dockerized**: Easy deployment with Docker Compose.

## Prerequisites
- Docker and Docker Compose
- Node.js (for local development)

## Getting Started with Docker

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd Restaurant-Pos
   ```

2. Start the application:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - **App**: http://localhost (frontend + API and WebSockets proxied via Nginx)
   - **Login**: admin@restaurant.com / admin123 (after the seed runs on first start)

## Local Development

### 1. Backend (PostgreSQL)

Create a PostgreSQL database that matches the `DATABASE_URL` in `backend/.env` (see `backend/.env.example`). Then:

```bash
cd backend
cp .env.example .env   # then edit .env and set DATABASE_URL, JWT_SECRET
npm install
npx prisma db push     # create tables
npx prisma db seed     # create admin user + sample data (optional)
npm run dev
```

**First-time login:** If you didn't run the seed, create the first admin with:

```bash
curl -X POST http://localhost:5001/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

Then log in with **admin@restaurant.com** / **admin123** (or the email/password you used in the request above).

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## License
ISC
