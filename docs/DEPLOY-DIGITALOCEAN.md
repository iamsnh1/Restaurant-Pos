# Deploy Voxxera POS on DigitalOcean

Two options: **App Platform** (managed) or a **Droplet** (VPS) with docker-compose.

---

## Option A: App Platform

No server to manage. You add a PostgreSQL database and two Docker components (backend + frontend).

### 1. Create app and connect repo

1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com) → **Apps** → **Create App**.
2. Choose **GitHub** and authorize. Select repo **iamsnh1/Restaurant-Pos**, branch **main**.

### 2. Add PostgreSQL database

1. Click **Add Resource** → **Database**.
2. Choose **PostgreSQL**, e.g. **Dev Database**.
3. Create the database. In its overview you’ll see **Connection details** (host, port, user, password, database).
4. Build the connection string:  
   `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require`  
   (use the values from the connection details).

### 3. Add backend component

1. **Add Resource** → **Component** → **Web Service** (or **Container** if you see it).
2. **Source:** same GitHub repo, branch **main**.
3. Set **Source Directory** to `backend`.
4. **Dockerfile:** ensure it uses `Dockerfile` in the backend folder (path `Dockerfile` relative to source directory).
5. **HTTP Port:** `5001`.
6. **Environment variables:**

   | Name          | Value |
   |---------------|--------|
   | NODE_ENV      | production |
   | PORT          | 5001 |
   | DATABASE_URL  | *(the PostgreSQL connection string from step 2)* |
   | JWT_SECRET    | *(e.g. run `openssl rand -base64 32` and paste)* |
   | FRONTEND_URL  | *(leave empty for now)* |

7. Save and deploy. Wait for the backend to be live, then copy its **public URL** (e.g. `https://your-backend-xxxxx.ondigitalocean.app`).

### 4. Add frontend component

1. **Add Resource** → **Component** → **Web Service** (or **Container**).
2. **Source:** same repo, branch **main**. **Source Directory:** `frontend`.
3. **Dockerfile:** `Dockerfile` (in frontend folder).
4. **HTTP Port:** `80`.
5. **Build / Docker:**  
   If there is a **Docker build argument** or **Build environment variable**, add:  
   **Name:** `VITE_API_URL`  
   **Value:** `https://YOUR-BACKEND-URL/api`  
   (use the backend URL from step 3, e.g. `https://your-backend-xxxxx.ondigitalocean.app/api`).
6. Save and deploy. Copy the **frontend URL**.

### 5. Wire backend and frontend

1. Edit the **backend** component. Set **FRONTEND_URL** to the frontend URL (e.g. `https://your-frontend-xxxxx.ondigitalocean.app`). Save and redeploy.
2. If you couldn’t set `VITE_API_URL` when building the frontend, add it as a build env, then **redeploy the frontend** so the UI points to your backend.

### 6. First login

Open the frontend URL. If you see login but no user exists yet, create an admin:

```bash
curl -X POST https://YOUR-BACKEND-URL/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

Then log in with **admin@restaurant.com** / **admin123**.

---

## Option B: Droplet (VPS + docker-compose)

Full stack runs on one server with your existing `docker-compose.yml`.

### 1. Create Droplet

1. **Create** → **Droplets**.
2. Choose **Ubuntu 22.04**, a plan (e.g. Basic $6/mo), a region, and SSH key. Create.

### 2. Install Docker

SSH into the Droplet, then:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Log out and SSH back in, then:

```bash
sudo apt-get update && sudo apt-get install -y docker-compose-plugin
```

### 3. Deploy the app

```bash
git clone https://github.com/iamsnh1/Restaurant-Pos.git
cd Restaurant-Pos
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
docker compose up -d --build
```

### 4. Open the app

In the browser go to **http://YOUR_DROPLET_IP**.  
Default login after seed: **admin@restaurant.com** / **admin123**.

### 5. (Optional) HTTPS

- Use **Cloudflare** in front of the Droplet (proxy, SSL), or  
- Install **Caddy** or **Nginx** on the Droplet with Let’s Encrypt and proxy to `localhost:80`.

---

## Troubleshooting

- **Backend won’t start:** Check `DATABASE_URL` (correct host, user, password, `?sslmode=require` for managed DB).
- **Frontend “Cannot reach server”:** Ensure `VITE_API_URL` was set at **build** time and points to the backend URL (including `/api`). Redeploy frontend after changing it.
- **CORS errors:** Set backend `FRONTEND_URL` to the exact frontend URL (no trailing slash).
