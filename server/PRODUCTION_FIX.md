# Production Fix: Regenerate Prisma Client

## Issue
The database already has the correct `replicate_model_url` column, but the Prisma client on production still has the old schema with `hfRepo`.

## Solution
Just regenerate the Prisma client to match the existing database structure.

## Commands to run on production server:

```bash
# Navigate to server directory
cd /opt/render/project/src/server

# Regenerate Prisma client with updated schema
npx prisma generate

# Restart the application (Render will do this automatically after deployment)
```

## That's it!
No database migration needed since your database structure is already correct with `replicate_model_url`. 