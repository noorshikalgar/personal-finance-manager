#!/bin/bash

# Recurring Transactions Cron Job
# Runs daily to process recurring transactions

echo "==================================="
echo "Running recurring transactions cron"
echo "Date: $(date)"
echo "==================================="

# Replace with your actual app URL and cron secret
APP_URL="${APP_URL:-http://app:3000}"
CRON_SECRET="${CRON_SECRET:-change-me-in-production}"

# Make POST request to trigger recurring transactions
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

echo "==================================="
echo ""
