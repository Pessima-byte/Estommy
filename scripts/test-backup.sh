#!/bin/bash

# ESTOMMY Backup System Test Script
# This script tests the automatic backup functionality

echo "🔧 ESTOMMY Backup System Test"
echo "================================"
echo ""

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
    echo "⚠️  CRON_SECRET not set in environment"
    echo "Please set CRON_SECRET in your .env file"
    echo ""
    echo "Generate a secret with:"
    echo "  openssl rand -base64 32"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "✅ CRON_SECRET is configured"
echo ""

# Test backup endpoint
echo "📦 Testing automatic backup creation..."
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $CRON_SECRET" \
    -H "Content-Type: application/json" \
    http://localhost:3000/api/backup/auto)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ Backup created successfully!"
    echo ""
    
    # Check backup status
    echo "📊 Checking backup status..."
    echo ""
    
    status=$(curl -s -X GET \
        -H "Authorization: Bearer $CRON_SECRET" \
        http://localhost:3000/api/backup/auto)
    
    echo "$status" | jq '.' 2>/dev/null || echo "$status"
    echo ""
    
    # List backup files
    echo "📁 Backup files in /backups directory:"
    ls -lh backups/ | grep backup_
    echo ""
    
    echo "✅ Backup system is working correctly!"
else
    echo "❌ Backup failed with HTTP code: $http_code"
    exit 1
fi

echo ""
echo "================================"
echo "Next steps:"
echo "1. Configure your cron service (GitHub Actions, Vercel, etc.)"
echo "2. Set up monitoring and alerts"
echo "3. Test backup restoration"
echo ""
echo "See BACKUP_SETUP_GUIDE.md for detailed instructions"
