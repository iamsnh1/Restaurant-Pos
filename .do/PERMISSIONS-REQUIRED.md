# DigitalOcean Permissions Required for End-to-End Deployment

## Current Status
- **Account**: ironmansnh@gmail.com
- **Account Status**: ⚠️ **LOCKED** - This may prevent deployments
- **Token**: Authenticated successfully

## Required API Token Scopes

To deploy end-to-end on DigitalOcean App Platform, your API token needs these scopes:

### Essential Scopes (Required)
1. **`app:read`** - View App Platform apps and deployments
2. **`app:create`** - Create new App Platform apps
3. **`app:update`** - Update app specifications and trigger deployments
4. **`app:delete`** - Delete apps (optional, but useful for cleanup)

### Database Scopes (Required for PostgreSQL)
5. **`dbaas:read`** - Read database cluster information
6. **`dbaas:write`** - Create and manage database clusters

### Additional Useful Scopes
7. **`read`** - Read-only access to account info
8. **`write`** - Write access for general resources (if needed)

## Spaces (File Storage) Permissions

**Important**: Spaces uses a **different authentication system** than the API token:

- Spaces requires **separate Access Keys** (not API tokens)
- These are S3-compatible credentials
- Created separately in the DigitalOcean Control Panel

### To Create Spaces Access Keys:
1. Go to [DigitalOcean API Tokens](https://cloud.digitalocean.com/account/api/tokens)
2. Click **"Generate New Token"** → **"Spaces Keys"**
3. Save both the **Access Key** and **Secret Key**

## How to Check Your Current Token Scopes

Unfortunately, DigitalOcean doesn't provide a direct way to view token scopes via `doctl`. However, you can:

1. **Check in Control Panel**:
   - Go to [API Tokens](https://cloud.digitalocean.com/account/api/tokens)
   - Find your token and view its scopes

2. **Test Permissions**:
   ```bash
   # Test App Platform access
   doctl apps list
   
   # Test database access
   doctl databases list
   
   # If these work, you have the required scopes
   ```

## If Your Token Doesn't Have Required Scopes

### Option 1: Create a New Token with Full Access
1. Go to [API Tokens](https://cloud.digitalocean.com/account/api/tokens)
2. Click **"Generate New Token"**
3. Name it: `voxxera-pos-deployment`
4. Select **"Write"** scope (includes all read/write permissions)
5. Copy the token and update your environment:
   ```bash
   export DIGITALOCEAN_ACCESS_TOKEN="your-new-token"
   doctl auth init -t "$DIGITALOCEAN_ACCESS_TOKEN"
   ```

### Option 2: Create a Token with Specific Scopes
Select only these scopes:
- ✅ `app:read`
- ✅ `app:create`
- ✅ `app:update`
- ✅ `app:delete`
- ✅ `dbaas:read`
- ✅ `dbaas:write`
- ✅ `read`
- ✅ `write` (optional, for full access)

## Account Status Issue

⚠️ **Your account shows as "locked"** - This may prevent deployments even with correct permissions.

### To Unlock Account:
1. Check your email for any DigitalOcean notifications
2. Contact DigitalOcean support if needed
3. Verify payment method is valid
4. Check for any outstanding invoices

## Verification Steps

Run these commands to verify permissions:

```bash
# Set your token (replace with your actual token)
export DIGITALOCEAN_ACCESS_TOKEN="your-token-here"

# Test App Platform access
doctl apps list

# Test database access
doctl databases list

# Try to get app details
doctl apps get 9a408f2e-dbda-42be-b87c-e84d1cdf9040

# Try to create a deployment
doctl apps create-deployment 9a408f2e-dbda-42be-b87c-e84d1cdf9040 --force-rebuild
```

If any of these fail with "forbidden" or "unauthorized", you need additional scopes.

## GitHub Integration Permissions

For auto-deploy on push, you also need:

1. **GitHub Repository Access**: 
   - DigitalOcean needs access to your GitHub repo
   - Connect GitHub account in [DigitalOcean Settings](https://cloud.digitalocean.com/account/integrations)
   - Grant access to `iamsnh1/Restaurant-Pos` repository

2. **Repository Permissions**:
   - Read access to repository
   - Read access to repository contents
   - Read access to metadata

## Summary

**Minimum Required for Deployment:**
- ✅ API Token with `app:read`, `app:create`, `app:update` scopes
- ✅ Database scopes: `dbaas:read`, `dbaas:write`
- ✅ GitHub integration connected
- ✅ Account unlocked/active
- ✅ Spaces Access Keys (for file storage - separate from API token)

**Current Status:**
- ✅ Token authenticated
- ⚠️ Account shows as "locked" - may need to resolve
- ❓ Token scopes unknown (check in Control Panel)
- ❓ GitHub integration status unknown

## Next Steps

1. **Check token scopes** in DigitalOcean Control Panel
2. **Unlock account** if needed (contact support)
3. **Connect GitHub** integration if not already done
4. **Create Spaces keys** for file storage
5. **Retry deployment** after resolving any issues
