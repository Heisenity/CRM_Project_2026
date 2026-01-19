# Database Migration Guide for Production

## Issue
The production database on Render is missing the `role` column in the `employees` table, causing 500 errors when trying to filter employees by role.

## Root Cause
The Prisma migrations haven't been applied to the production database. The schema includes the `role` column, but the actual database table doesn't have it.

## Solution

### Option 1: Run Migration Script (Recommended)
1. SSH into your Render instance or run this in the Render console:
```bash
cd backend
node scripts/migrate-production.js
```

### Option 2: Manual Prisma Commands
1. SSH into your Render instance
2. Navigate to the backend directory
3. Run the following commands:
```bash
# Generate Prisma client
npx prisma generate

# Apply all pending migrations
npx prisma migrate deploy

# Optional: Check database status
npx prisma migrate status
```

### Option 3: Reset Database (Nuclear Option)
⚠️ **WARNING: This will delete all data!**
```bash
# Only use if you want to start fresh
npx prisma migrate reset --force
```

## Verification
After running the migration, verify that the `role` column exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees' AND column_name = 'role';
```

## Environment Variables
Make sure these are set in your Render environment:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NODE_ENV`: Should be "production"

## Common Issues

### 1. Permission Denied
If you get permission errors, make sure the database user has the necessary privileges.

### 2. Connection Timeout
If the migration times out, try running it during low-traffic periods.

### 3. Migration Lock
If you see "Migration engine is locked", wait a few minutes and try again, or restart the service.

## Post-Migration
After successful migration:
1. Restart your Render service
2. Test the employee endpoints:
   - `GET /api/v1/employees?role=FIELD_ENGINEER`
   - `GET /api/v1/employees?role=IN_OFFICE`
3. Check the dashboard for real data display

## Rollback
If something goes wrong, you can rollback to a specific migration:
```bash
npx prisma migrate resolve --rolled-back "migration_name"
```