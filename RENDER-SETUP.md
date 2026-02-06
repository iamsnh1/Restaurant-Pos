# Render Deployment Setup Guide

## Issue: DATABASE_URL Not Set

If you're getting "ERROR: DATABASE_URL is not set", the Blueprint might not be injecting the database connection string properly.

## Solution 1: Manual Environment Variable Setup (Recommended)

1. **Deploy the Blueprint** (creates database and service)
2. **Go to Render Dashboard** → Your service → **Environment**
3. **Get Database Connection String:**
   - Go to your database service (`voxxera-pos-db`)
   - Click **"Connections"** tab
   - Copy the **"Internal Database URL"** (for same region) or **"External Connection String"**
4. **Set in Web Service:**
   - Go to your web service (`voxxera-pos`)
   - **Environment** tab
   - Add/Edit `DATABASE_URL`:
     - Key: `DATABASE_URL`
     - Value: Paste the connection string from step 3
   - Click **"Save Changes"**
5. **Redeploy** the service

## Solution 2: Fix Blueprint Reference

The `render.yaml` should work, but if it doesn't, try this format:

```yaml
services:
  - type: web
    name: voxxera-pos
    env: docker
    dockerfilePath: ./Dockerfile
    dockerContext: .
    plan: starter
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 80
      - key: DATABASE_URL
        fromDatabase:
          name: voxxera-pos-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        sync: false

databases:
  - name: voxxera-pos-db
    databaseName: restaurant_pos
    user: pos_user
    plan: starter
    postgresMajorVersion: 16
```

## Solution 3: Use Internal Connection String

If services are in the same region, use the internal connection string for better performance:

1. Get internal connection string from database service
2. Format: `postgresql://user:password@internal-hostname:5432/database_name`
3. Set as `DATABASE_URL` in web service

## Required Environment Variables

Make sure these are set in Render dashboard:

- `DATABASE_URL` - PostgreSQL connection string (from database service)
- `JWT_SECRET` - Random secret (generate: `openssl rand -base64 32`)
- `NODE_ENV` - `production`
- `PORT` - `80`
- `FRONTEND_URL` - Your Render app URL (optional, auto-set)

## Troubleshooting

1. **Check Database Status:**
   - Database must be **"Available"** before service can connect
   - Wait for database to finish provisioning

2. **Check Service Logs:**
   - View logs in Render dashboard
   - Look for database connection errors

3. **Verify Connection String Format:**
   ```
   postgresql://user:password@host:port/database?sslmode=require
   ```

4. **Test Connection:**
   - Use Render's database connection info
   - Test with `psql` or database client

## Quick Fix Steps

1. Deploy Blueprint (creates resources)
2. Wait for database to be ready
3. Copy database connection string
4. Set `DATABASE_URL` manually in web service environment
5. Redeploy web service

This should resolve the "DATABASE_URL is not set" error.
