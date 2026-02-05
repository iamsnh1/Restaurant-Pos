# Deployment Plan for Restaurant POS

To host this application globally and ensure the digital receipt links work on any phone, follow these steps:

## 1. Backend Hosting (Render.com)
1. Create an account on [Render.com](https://render.com).
2. Create a new **Web Service**.
3. Connect your GitHub repository.
4. Set the following environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random string.
   - `FRONTEND_URL`: The URL of your frontend (e.g., `https://your-pos.vercel.app`).
   - `PORT`: 5001 (Render will assign its own, but we handle it).

## 2. Frontend Hosting (Vercel or Netlify)
1. Create an account on [Vercel](https://vercel.com).
2. Import your GitHub repository.
3. In Project Settings, add these **Environment Variables**:
   - `VITE_API_URL`: The URL of your Render backend (e.g., `https://your-backend.onrender.com/api`).
4. Deploy the project.

## 3. Database (MongoDB Atlas)
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Allow access from "Anywhere" (0.0.0.0/0) so Render can connect.
3. Get your connection string and put it in the Backend environment variables.

## Why this works for Digital Receipts:
By hosting on a real domain (e.g., `myrestaurant.vercel.app`), the link shared in WhatsApp will automatically be `https://myrestaurant.vercel.app/receipt/ORDER_ID`. Since this is a public URL, any customer can open it on their mobile data/WiFi without being logged in to your POS.

---

### Immediate Testing (Global Link on Localhost)
If you want to test the global link **right now** without a full deployment:

#### Option A: Cloudflare Tunnel (Recommended - No Password)
1. Install cloudflared: `brew install cloudflared`
2. Run your POS and Backend locally.
3. Open two terminals:
   - Terminal 1: `cloudflared tunnel --url http://localhost:5173`
   - Terminal 2: `cloudflared tunnel --url http://localhost:5001`
4. Use the `trycloudflare.com` URLs provided. These don't require any password!

#### Option B: Localtunnel
1. Run `npm install -g localtunnel`
2. Run your POS locally.
3. Open a separate terminal and run: `lt --port 5173`
4. Use the custom URL it gives you (e.g., `https://cool-pos-link.loca.lt`).
5. Access your POS through THAT link. Now, when you share a receipt, the link will use that global tunnel URL!
