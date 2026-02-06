# Deploy Everything on Render (Single Deployment)

**One blueprint, everything deployed.** Frontend + Backend + Database all together.

---

## Why Render?

- ✅ **Single deployment** - Frontend + Backend in one Docker container
- ✅ **Managed PostgreSQL** - Database included
- ✅ **Auto-deploy** - Push to GitHub, Render deploys automatically
- ✅ **Free tier** - Free PostgreSQL + web service (with limitations)
- ✅ **Blueprint** - One YAML file configures everything

---

## Deploy in 5 Minutes

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Go to **Dashboard**

### Step 2: Create Blueprint

1. Click **"New +"** → **"Blueprint"**
2. Connect GitHub repo: `iamsnh1/Restaurant-Pos`
3. Render will detect `render.yaml` (we'll create it)

### Step 3: Create render.yaml

Create `render.yaml` at repo root:

```yaml
services:
  - type: web
    name: voxxera-pos
    runtime: docker
    dockerfilePath: ./Dockerfile
    dockerContext: .
    plan: free  # or starter ($7/month)
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: posdb
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: PORT
        value: 5001
      - key: NODE_ENV
        value: production

databases:
  - name: posdb
    plan: free  # or starter ($7/month)
    databaseName: restaurant_pos
    user: pos_user
```

### Step 4: Deploy

1. Render reads `render.yaml`
2. Creates PostgreSQL database
3. Builds Docker image (frontend + backend)
4. Deploys everything

Wait 3-5 minutes for the build.

### Step 5: Get Your URL

Render gives you a URL: `https://voxxera-pos.onrender.com`

---

## First Login

After deployment:

```bash
curl -X POST https://voxxera-pos.onrender.com/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

Then visit your Render URL and log in.

---

## Auto-Deploy

Every push to `main` triggers a new deployment.

---

## Cost

- **Free tier:** Free PostgreSQL + web service (sleeps after 15min inactivity)
- **Starter:** $7/month per service (no sleep)

---

## That's It!

One deployment, everything works. No separate configs needed.
