# DigitalOcean deploy (single container)

The app runs as **one component**: frontend (nginx) + backend (Node) in a single Docker image, same idea as local `docker-compose` (one entrypoint, no separate front/back services).

## 1. Push your code (if not done)

From your machine:

```bash
cd /Users/iamsnh/Desktop/Restaurant-Pos
git push origin main
```

## 2. Set env vars (one component: **web**)

In **Apps → voxxera-pos → web** (the single service) → **Settings → Environment Variables**:

- **DATABASE_URL:** From **posdb** → copy the **Connection string**.
- **JWT_SECRET:** e.g. `openssl rand -base64 32` and paste.

No `FRONTEND_URL` or `VITE_API_URL` — the app uses same origin (`/api` on the same URL).

Save and redeploy.

## 3. Create first user

```bash
curl -X POST https://YOUR-APP-LIVE-URL/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

Then open the app URL and log in with **admin@restaurant.com** / **admin123**.

## Update app spec

```bash
doctl apps update 9a408f2e-dbda-42be-b87c-e84d1cdf9040 --spec .do/app-spec.yaml
```
