# Fixed: Prisma Generate Error During Build

## Problem
Build was failing with:
```
npm error command sh -c prisma generate
process "/bin/sh -c npm ci" did not complete successfully: exit code: 1
```

## Root Cause
The `backend/package.json` has a `postinstall` script that runs `prisma generate`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

When `npm ci` runs, it triggers `postinstall`, which tries to run `prisma generate`, but the Prisma schema file (`prisma/schema.prisma`) hasn't been copied to the Docker image yet!

## Solution
Copy the Prisma schema directory **before** running `npm ci`, so that when `postinstall` runs `prisma generate`, the schema file exists.

### Changes Made:
1. Copy `backend/prisma` directory before `npm ci`
2. This allows `postinstall` script to successfully run `prisma generate`
3. Then copy the rest of backend files
4. Verify Prisma client is generated (redundant but safe)

## Files Fixed
- ✅ `Dockerfile` - Copy Prisma schema before npm ci
- ✅ `deploy/Dockerfile` - Copy Prisma schema before npm ci

## Next Steps

1. **Commit and push:**
   ```bash
   git add .
   git commit -m "Fix Prisma generate error: copy schema before npm ci"
   git push origin main
   ```

2. **Build should now succeed!**

The build process now:
1. Copies `package.json` files
2. Copies `prisma/` directory (schema file)
3. Runs `npm ci` (which triggers `postinstall` → `prisma generate` ✅)
4. Copies rest of backend files
5. Verifies Prisma client is generated
