#!/bin/bash

# Cron Jobs for Personal Finance Manager
# Runs daily to process recurring transactions and check notifications

echo "==================================="
echo "Running cron jobs"
echo "Date: $(date)"
echo "==================================="

# Replace with your actual app URL and cron secret
APP_URL="${APP_URL:-http://app:3000}"
CRON_SECRET="${CRON_SECRET:-change-me-in-production}"

# ===================================
# 1. Recurring Transactions
# ===================================
echo ""
echo "🔄 Processing recurring transactions..."

response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  "${APP_URL}/api/cron/recurring")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP Status: $http_code"
echo "Response: $body"

if [ "$http_code" -eq 200 ]; then
    echo "✅ SUCCESS: Recurring transactions processed"
else
    echo "❌ FAILED: Error processing recurring transactions"
fi

# ===================================
# 2. Notifications Check
# ===================================
echo ""
echo "🔔 Checking for overdue/upcoming reminders..."

response=$(curl -s -w "\n%{http_code}" -X GET \
  "${APP_URL}/api/cron/notifications")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP Status: $http_code"
echo "Response: $body"

if [ "$http_code" -eq 200 ]; then
    echo "✅ SUCCESS: Notifications processed"
else
    echo "❌ FAILED: Error processing notifications"
fi

echo ""
echo "==================================="
echo "All cron jobs completed"
echo "==================================="
echo ""
