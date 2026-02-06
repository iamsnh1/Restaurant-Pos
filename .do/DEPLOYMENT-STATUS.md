# DigitalOcean Deployment Status

## App Configuration
- **App ID**: `9a408f2e-dbda-42be-b87c-e84d1cdf9040`
- **App Name**: `voxxera-pos`
- **Region**: `nyc`
- **Status**: Deployment in progress

## Services Configured

### Backend Service
- **Source**: GitHub repo `iamsnh1/Restaurant-Pos`, branch `main`
- **Dockerfile**: `backend/Dockerfile`
- **Port**: `5001`
- **Instance Size**: `basic-xs`
- **Routes**: `/api/*` → backend service
- **Environment Variables**:
  - `NODE_ENV`: production
  - `PORT`: 5001
  - `DATABASE_URL`: ${posdb.DATABASE_URL} (from database component)
  - `JWT_SECRET`: (set as secret)
  - `FRONTEND_URL`: ${frontend.PUBLIC_URL}

### Frontend Service
- **Source**: GitHub repo `iamsnh1/Restaurant-Pos`, branch `main`
- **Dockerfile**: `frontend/Dockerfile`
- **Port**: `80`
- **Instance Size**: `basic-xs`
- **Routes**: `/*` → frontend service
- **Environment Variables**:
  - `VITE_API_URL`: ${backend.PUBLIC_URL}/api

### Database
- **Name**: `posdb`
- **Engine**: PostgreSQL 15
- **Type**: Development database

## Ingress Configuration
- `/api/*` → Backend service
- `/*` → Frontend service

## Storage Setup (DigitalOcean Spaces)

To set up file storage for PDF receipts and other files:

1. **Create Spaces Bucket**:
   - Go to [DigitalOcean Control Panel](https://cloud.digitalocean.com/spaces)
   - Create a new Space named `voxxera-pos-files` in `nyc3` region
   - Set it to **Public** if you want public file access, or **Private** with CDN for secure access

2. **Generate Access Keys**:
   - Go to [API Tokens](https://cloud.digitalocean.com/account/api/tokens)
   - Generate Spaces access keys (Spaces keys are different from API tokens)

3. **Configure Backend Environment Variables**:
   Add these to the backend service in App Platform:
   - `SPACES_ENDPOINT`: `https://nyc3.digitaloceanspaces.com`
   - `SPACES_KEY`: (your Spaces access key)
   - `SPACES_SECRET`: (your Spaces secret key)
   - `SPACES_BUCKET`: `voxxera-pos-files`
   - `SPACES_REGION`: `nyc3`

4. **Optional: Set up CDN**:
   - After creating the Space, you can enable CDN from the Spaces dashboard
   - This provides a CDN URL for faster file delivery

## Deployment Commands

### Check Deployment Status
```bash
export DIGITALOCEAN_ACCESS_TOKEN="your-token"
doctl apps get 9a408f2e-dbda-42be-b87c-e84d1cdf9040
```

### View Deployment Logs
```bash
doctl apps logs 9a408f2e-dbda-42be-b87c-e84d1cdf9040 --type run
```

### Trigger New Deployment
```bash
doctl apps create-deployment 9a408f2e-dbda-42be-b87c-e84d1cdf9040 --force-rebuild
```

### Update App Spec
```bash
doctl apps update 9a408f2e-dbda-42be-b87c-e84d1cdf9040 --spec .do/app-spec.yaml
```

## Next Steps

1. Wait for deployment to complete (check status above)
2. Get the app URL from DigitalOcean dashboard or `doctl apps get`
3. Create first admin user:
   ```bash
   curl -X POST https://YOUR-APP-URL/api/auth/setup \
     -H "Content-Type: application/json" \
     -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
   ```
4. Set up Spaces bucket and configure environment variables
5. Test the application

## App URL
Once deployment completes, the app will be available at:
- Frontend: `https://voxxera-pos-xxxxx.ondigitalocean.app`
- Backend API: `https://voxxera-pos-xxxxx.ondigitalocean.app/api`

Check the DigitalOcean dashboard for the exact URL.
