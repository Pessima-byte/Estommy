# Automatic Daily Backup System - Setup Guide

## 🎯 Overview

The ESTOMMY application now includes a **robust automatic daily backup system** with the following features:

- ✅ **Automated Daily Backups** - Runs automatically every day at 2 AM UTC
- ✅ **File-Based Storage** - Backups saved to `/backups` directory
- ✅ **Retention Policy** - Keeps last 30 days of automatic backups
- ✅ **Manual Backups** - Create backups anytime from the admin panel
- ✅ **Backup Management** - List, download, and delete backups
- ✅ **Activity Logging** - All backup operations logged in Activity Log
- ✅ **Security** - Protected with secret key authentication
- ✅ **Restore Capability** - Restore from any backup file

## 📁 Backup Storage

Backups are stored in: `/backups/`

### Filename Format:
- **Automatic**: `backup_auto_YYYY-MM-DD_HH-MM-SS.json`
- **Manual**: `backup_manual_YYYY-MM-DD_HH-MM-SS.json`

### Backup Contents:
Each backup file contains:
```json
{
  "version": "1.2",
  "timestamp": "2026-02-15T02:00:00.000Z",
  "type": "automatic",
  "stats": {
    "products": 150,
    "customers": 320,
    "sales": 1250,
    "credits": 45,
    "profits": 890,
    "categories": 12,
    "activities": 1000,
    "users": 5
  },
  "data": {
    "products": [...],
    "customers": [...],
    "sales": [...],
    "credits": [...],
    "profits": [...],
    "categories": [...],
    "activities": [...],
    "users": [...]
  }
}
```

## 🔧 Setup Instructions

### Step 1: Configure Environment Variables

Add to your `.env` file:

```bash
# Backup Cron Secret (generate a strong random string)
CRON_SECRET=your-super-secret-key-here-change-this
```

**Generate a secure secret:**
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 2: Choose Your Backup Method

You have **three options** for running automatic backups:

#### Option A: Vercel Cron (Recommended for Vercel deployments)

The `vercel.json` file is already configured. Just deploy to Vercel:

```bash
vercel deploy --prod
```

Vercel will automatically run the backup daily at 2 AM UTC.

**Configure the secret in Vercel:**
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add `CRON_SECRET` with your generated secret
4. Redeploy

#### Option B: GitHub Actions (Recommended for GitHub-hosted projects)

The workflow file is already created at `.github/workflows/daily-backup.yml`

**Setup:**
1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add two secrets:
   - `CRON_SECRET`: Your backup secret key
   - `APP_URL`: Your production URL (e.g., `https://estommy.vercel.app`)
4. The workflow will run automatically daily at 2 AM UTC

**Manual trigger:**
- Go to "Actions" tab in GitHub
- Select "Daily Automatic Backup"
- Click "Run workflow"

#### Option C: External Cron Service (e.g., cron-job.org, EasyCron)

1. Sign up for a cron service
2. Create a new cron job with:
   - **URL**: `https://your-domain.com/api/backup/auto`
   - **Method**: POST
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`
   - **Schedule**: Daily at 2:00 AM UTC (`0 2 * * *`)

### Step 3: Create Backups Directory

The system will auto-create the directory, but you can create it manually:

```bash
mkdir -p backups
```

Add to `.gitignore`:
```
backups/
```

### Step 4: Test the Backup System

#### Test Automatic Backup:
```bash
curl -X POST http://localhost:3000/api/backup/auto \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

#### Check Backup Status:
```bash
curl http://localhost:3000/api/backup/auto \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📊 Backup Management API

### List All Backups
```bash
GET /api/backup?action=list
Authorization: Admin session required
```

### Download Specific Backup
```bash
GET /api/backup?action=download&filename=backup_auto_2026-02-15_02-00-00.json
Authorization: Admin session required
```

### Create Manual Backup
```bash
POST /api/backup
Authorization: Admin session required
Body: { "action": "create" }
```

### Restore from Backup
```bash
POST /api/backup
Authorization: Admin session required
Body: {
  "action": "restore",
  "filename": "backup_auto_2026-02-15_02-00-00.json"
}
```

### Delete Backup
```bash
DELETE /api/backup?filename=backup_manual_2026-02-15_10-30-00.json
Authorization: Admin session required
```

**Note**: Automatic backups less than 7 days old cannot be deleted.

## 🔒 Security Features

1. **Secret Key Authentication**: All automatic backup endpoints require `CRON_SECRET`
2. **Admin-Only Access**: Manual backup operations require admin role
3. **Protected Deletions**: Recent automatic backups cannot be deleted
4. **Activity Logging**: All backup operations are logged
5. **Secure File Storage**: Backups stored outside public directory

## 📈 Retention Policy

- **Automatic Backups**: Last 30 days retained
- **Manual Backups**: No automatic deletion
- **Old Backup Cleanup**: Runs after each automatic backup
- **Activity Logs**: Last 1000 activities per backup (to prevent huge files)

## 🚨 Monitoring & Alerts

### Check Last Backup:
```bash
curl http://localhost:3000/api/backup/auto \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Response:
```json
{
  "configured": true,
  "totalBackups": 15,
  "totalSize": 52428800,
  "lastBackup": {
    "filename": "backup_auto_2026-02-15_02-00-00.json",
    "size": 3500000,
    "created": "2026-02-15T02:00:00.000Z",
    "age": 43200000
  },
  "nextScheduled": "Daily at 2:00 AM UTC",
  "retentionDays": 30
}
```

### Activity Log:
All backup operations appear in the Activity Log screen:
- Backup creation (automatic and manual)
- Backup restoration
- Backup deletion
- Backup failures

## 🔄 Restore Process

### From Admin Panel:
1. Navigate to Settings → Backups
2. View list of available backups
3. Select backup to restore
4. Confirm restoration
5. System will restore all data

### Via API:
```bash
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "action": "restore",
    "filename": "backup_auto_2026-02-15_02-00-00.json"
  }'
```

## 🛠️ Troubleshooting

### Backup Not Running:
1. Check `CRON_SECRET` is set correctly
2. Verify cron service is configured
3. Check application logs
4. Test endpoint manually

### Backup Failed:
1. Check Activity Log for error details
2. Verify database connection
3. Check disk space
4. Review application logs

### Cannot Delete Backup:
- Automatic backups less than 7 days old are protected
- Only manual backups can be deleted immediately

### Large Backup Files:
- Activity logs limited to 1000 most recent
- Consider archiving old data
- Compress backups if needed

## 📝 Best Practices

1. **Test Regularly**: Periodically test backup restoration
2. **Monitor Storage**: Keep an eye on backup directory size
3. **Off-site Backups**: Consider copying backups to cloud storage
4. **Document Procedures**: Keep restoration procedures documented
5. **Alert on Failures**: Set up notifications for backup failures
6. **Verify Backups**: Occasionally verify backup file integrity

## 🎯 Next Steps

1. ✅ Set `CRON_SECRET` in environment variables
2. ✅ Choose and configure backup method (Vercel/GitHub/External)
3. ✅ Test backup creation
4. ✅ Test backup restoration
5. ✅ Set up monitoring/alerts
6. ✅ Document your backup procedures

## 📞 Support

For issues or questions:
- Check Activity Log for backup status
- Review application logs
- Test endpoints manually
- Verify environment configuration

---

**Your data is now protected with automatic daily backups! 🎉**
