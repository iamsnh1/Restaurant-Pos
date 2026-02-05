# Professional Restaurant POS System

A high-performance, mobile-optimized, and feature-rich Point of Sale system built with React, Node.js, and MongoDB.

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
   - **Frontend**: http://localhost (Production build via Nginx)
   - **Backend API**: http://localhost:5001/api
   - **MongoDB**: http://localhost:27017

## Local Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## GitHub Integration

To push this project to your GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## License
ISC
