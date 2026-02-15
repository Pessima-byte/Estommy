# ESTOMMY Scripts

This directory contains utility scripts for the ESTOMMY application.

## Available Scripts

### `test-backup.sh`
Tests the automatic backup system functionality.

**Usage:**
```bash
./scripts/test-backup.sh
```

**Requirements:**
- `CRON_SECRET` must be set in `.env`
- Application must be running on `localhost:3000`
- `jq` (optional, for pretty JSON output)

**What it does:**
1. Checks if `CRON_SECRET` is configured
2. Triggers an automatic backup
3. Verifies backup creation
4. Displays backup status
5. Lists backup files

**Example output:**
```
🔧 ESTOMMY Backup System Test
================================

✅ CRON_SECRET is configured

📦 Testing automatic backup creation...

Response:
{
  "success": true,
  "message": "Automatic backup completed successfully",
  "backup": {
    "filename": "backup_auto_2026-02-15_02-00-00.json",
    "size": 3500000,
    "stats": {
      "products": 150,
      "customers": 320,
      "sales": 1250
    },
    "duration": 1234
  }
}

✅ Backup created successfully!

📊 Checking backup status...
📁 Backup files in /backups directory:
✅ Backup system is working correctly!
```

## Adding New Scripts

When adding new scripts to this directory:

1. Make them executable: `chmod +x scripts/your-script.sh`
2. Add documentation to this README
3. Include error handling and user feedback
4. Test thoroughly before committing

## Troubleshooting

### "CRON_SECRET not set"
Add `CRON_SECRET` to your `.env` file:
```bash
echo "CRON_SECRET=$(openssl rand -base64 32)" >> .env
```

### "Connection refused"
Make sure the application is running:
```bash
npm run dev
```

### "jq: command not found"
Install jq for pretty JSON output:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

The script will still work without jq, just with less formatted output.
