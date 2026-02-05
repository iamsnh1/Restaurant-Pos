# Voxxera POS – DigitalOcean deploy (single container)

One component **web**: frontend + backend in one Docker image (like local docker-compose).  
Get your **Live URL** from **Dashboard → Apps → voxxera-pos**.

---

## 1. Set env vars (web component only)

**voxxera-pos → web → Settings → Environment Variables**

| Key | Value |
|-----|--------|
| **DATABASE_URL** | From **posdb** → copy **Connection string** |
| **JWT_SECRET** | `Leapylg6XXW3P1/Ox4mzyd4fYFo+eBLJxgIu9zVtI+o=` |

No FRONTEND_URL or VITE_API_URL needed. Save and **Redeploy**.

---

## 2. Create first user

```bash
curl -X POST https://YOUR-APP-LIVE-URL/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

Then open the app URL and log in with **admin@restaurant.com** / **admin123**.
