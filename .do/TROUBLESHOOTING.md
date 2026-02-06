# DigitalOcean Deployment Troubleshooting

## Error: "deploy cluster proxy not ready"

This error typically means:

1. **Deployment is still initializing** - The deployment cluster infrastructure is being provisioned
2. **No active deployment** - The app may need a fresh deployment triggered
3. **Infrastructure provisioning delay** - DigitalOcean is setting up the deployment environment

## Solutions

### Option 1: Wait and Retry
The deployment cluster may still be provisioning. Wait 2-3 minutes and try again.

### Option 2: Trigger a New Deployment
```bash
export DIGITALOCEAN_ACCESS_TOKEN="your-token"
doctl apps create-deployment 9a408f2e-dbda-42be-b87c-e84d1cdf9040 --force-rebuild
```

### Option 3: Check App Status
```bash
doctl apps get 9a408f2e-dbda-42be-b87c-e84d1cdf9040
```

### Option 4: Check via Dashboard
1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps/9a408f2e-dbda-42be-b87c-e84d1cdf9040)
2. Check the "Deployments" tab
3. Look for any error messages or warnings

## Common Deployment Issues

### 1. Database Not Ready
If the database component isn't ready, deployments may fail. Check database status:
```bash
doctl databases list
```

### 2. Build Errors
Check build logs in the DigitalOcean dashboard for:
- Dockerfile syntax errors
- Missing dependencies
- Build timeout issues

### 3. Environment Variables
Ensure all required environment variables are set:
- `DATABASE_URL` (from database component)
- `JWT_SECRET` (set as secret)
- `FRONTEND_URL` (from frontend component)
- `VITE_API_URL` (for frontend build)

### 4. GitHub Integration
Verify GitHub integration is connected:
- Go to [Integrations](https://cloud.digitalocean.com/account/integrations)
- Ensure GitHub is connected
- Verify repository access

## Checking Deployment Logs

### Via CLI (when proxy is ready):
```bash
# Get deployment ID
doctl apps list-deployments 9a408f2e-dbda-42be-b87c-e84d1cdf9040

# View logs
doctl apps logs 9a408f2e-dbda-42be-b87c-e84d1cdf9040 --type run
doctl apps logs 9a408f2e-dbda-42be-b87c-e84d1cdf9040 --type build
```

### Via Dashboard:
1. Go to app dashboard
2. Click on a deployment
3. View "Build Logs" and "Runtime Logs" tabs

## If Deployment Keeps Failing

1. **Check App Spec**: Verify `.do/app-spec.yaml` is valid
2. **Test Dockerfiles Locally**: Build images locally to catch errors early
3. **Check Resource Limits**: Ensure instance sizes are adequate
4. **Review Error Messages**: Look for specific error codes or messages

## Getting Help

If issues persist:
1. Check [DigitalOcean Status Page](https://status.digitalocean.com/)
2. Review [App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
3. Contact DigitalOcean Support
