# Deploying to Microsoft Azure ☁️

This guide explains how to host the Voxxera POS system on Azure for enterprise-grade performance.

## 1. Prerequisites
- An [Azure Account](https://azure.microsoft.com/free/)
- Your code pushed to **GitHub** (which we just did)

---

## 2. Deploy the Backend (Azure App Service)

1. **Create Resource**: Search for **"Web App"** and click Create.
2. **Basics**:
   - **Runtime Stack**: Node 20 LTS (Linux)
   - **Region**: Choose the one closest to your restaurant (e.g., Central India or US East).
   - **Pricing Plan**: "Basic B1" (or "Free F1" for testing, but Basic is faster).
3. **Deployment**: Select **GitHub** and authorize your account. Select your `Restaurant-Pos` repo and `main` branch.
4. **Configuration (Environment Variables)**:
   Once created, go to **Settings -> Configuration -> Application Settings**:
   - `DATABASE_URL`: (Your MongoDB Atlas Link)
   - `JWT_SECRET`: `your_secret_key_here`
   - `PORT`: `80` (Azure App Service uses port 80 by default)
5. **General Settings**:
   - **Startup Command**: `cd backend && npm install && npx prisma generate && node server.js`

---

## 3. Deploy the Frontend (Azure Static Web Apps)

1. **Create Resource**: Search for **"Static Web App"**.
2. **Basics**:
   - **Plan Type**: Free
   - **Deployment Details**: GitHub -> Select your Repo.
3. **Build Details**:
   - **Build Presets**: Vite
   - **App location**: `/frontend`
   - **Api location**: (Leave empty)
   - **Output location**: `dist`
4. **Environment Variables**:
   Once deployed, go to **Configuration**:
   - **Add Key**: `VITE_API_URL`
   - **Value**: `https://<your-azure-backend-url>/api` (Get this from the Web App you created in step 2).

---

## 4. Why Azure?
- **Global Speed**: Azure's network is much faster than Render.
- **Enterprise Grade**: Higher uptime for your restaurant orders.
- **Scaling**: If you open more restaurant branches, Azure handles it easily.
