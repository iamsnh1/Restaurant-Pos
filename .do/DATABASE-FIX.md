# Database Component Build Error Fix

## Error
"Generic Internal Error" for `posdb` during build phase

## Changes Made
1. Updated PostgreSQL version from `15` to `16` (more stable/compatible)
2. Database configuration remains as dev database (`production: false`)

## Alternative Solutions if Error Persists

### Option 1: Create Database Separately
If the database component keeps failing, create it separately:

```bash
# Create database cluster
doctl databases create voxxera-pos-db \
  --engine pg \
  --version 16 \
  --region nyc1 \
  --size db-s-1vcpu-1gb

# Get connection string
doctl databases connection voxxera-pos-db
```

Then update app spec to reference existing database:
```yaml
databases:
  - name: posdb
    engine: PG
    version: "16"
    production: true
    cluster_name: voxxera-pos-db  # Reference existing cluster
```

### Option 2: Use Managed Database Outside App Platform
1. Create database in DigitalOcean Databases section
2. Get connection string
3. Add as environment variable directly:
```yaml
envs:
  - key: DATABASE_URL
    value: "postgresql://user:pass@host:port/db?sslmode=require"
    type: SECRET
```

### Option 3: Check Resource Limits
The error might be due to:
- Insufficient resources in the region
- Database provisioning quota limits
- Account billing/payment issues

Check:
- Account status
- Available resources in `nyc` region
- Database cluster limits

## Current Configuration
- **Database Name**: `posdb`
- **Engine**: PostgreSQL
- **Version**: 16
- **Type**: Development database (`production: false`)
- **Region**: `nyc`

## Next Steps
1. Monitor the new deployment with PostgreSQL 16
2. If still failing, try Option 1 (create database separately)
3. Check DigitalOcean dashboard for detailed error logs
4. Verify account has resources/quota available
