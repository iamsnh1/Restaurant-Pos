---
description: Deploying the POS System to the Cloud (Always-On)
---
Follow these steps to host your POS system so it stays active even when your PC is turned off.

### Phase 1: Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Create a new project and a **Free Cluster**.
3. In **Network Access**, click "Add IP Address" and select **Allow Access from Anywhere** (0.0.0.0/0).
4. In **Database Access**, create a user with a username and password.
5. Click **Connect** -> **Drivers** -> **Node.js** and copy your `DATABASE_URL`. It will look like: 
   `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/restaurant-pos?retryWrites=true&w=majority`

### Phase 2: Backend (Render.com)
1. Sign up for [Render.com](https://render.com) using your GitHub account.
2. Click **New +** -> **Web Service**.
3. Connect your **Restaurant-Pos** GitHub repository.
4. Set the following details:
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install && npx prisma generate`
   - **Start Command**: `cd backend && node server.js`
5. Click **Advanced** -> **Add Environment Variable**:
   - `DATABASE_URL`: (Paste your MongoDB Atlas link from Phase 1)
   - `JWT_SECRET`: (Type something random like `my_pos_secret_123`)
   - `PORT`: `5001`
6. Click **Create Web Service**. Once it's live, copy the URL (e.g., `https://pos-backend.onrender.com`).

### Phase 3: Frontend (Vercel)
1. Sign up for [Vercel](https://vercel.com) using GitHub.
2. Click **Add New** -> **Project**.
3. Import your **Restaurant-Pos** GitHub repository.
4. Set the following details:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
5. Click **Environment Variables**:
   - `VITE_API_URL`: (Paste your Render Backend URL + `/api`, example: `https://pos-backend.onrender.com/api`)
6. Click **Deploy**.

### Final Step: Verification
- Open your new Vercel URL.
- Login with your admin credentials.
- Create a test order and share the PDF. The link in WhatsApp will now work forever!
