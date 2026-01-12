# Docker Cron Setup for Recurring Transactions

This setup runs a lightweight Alpine Linux container with cron to automatically trigger recurring transactions daily.

## Files Created

- `cron/Dockerfile` - Docker image with cron installed
- `cron/run-cron.sh` - Script that calls the API endpoint
- Updated `docker-compose.yml` - Added cron service

## How It Works

1. **Cron container** runs daily at midnight (00:00)
2. **Calls** `POST /api/cron/recurring` on your app
3. **Processes** all recurring transactions due today
4. **Logs** results to `/var/log/cron.log` inside container

## Setup Instructions

### 1. Set CRON_SECRET Environment Variable

Add to your `.env` file:
```bash
CRON_SECRET=your-super-secret-key-here-change-this
```

### 2. Update Timezone (Optional)

Edit `cron/Dockerfile` and change:
```dockerfile
ENV TZ=America/New_York
```

To your timezone (e.g., `Asia/Kolkata`, `Europe/London`, etc.)

Or set in docker-compose.yml environment.

### 3. Deploy with Portainer

**Option A: Using Portainer UI**
1. Go to Portainer
2. Stacks → Add Stack
3. Upload your `docker-compose.yml`
4. Set environment variable `CRON_SECRET`
5. Deploy

**Option B: Using Docker Compose**
```bash
cd /path/to/personal-finance-manager
docker-compose up -d --build
```

### 4. Verify It's Running

Check if cron container is running:
```bash
docker ps | grep finance-tracker-cron
```

View cron logs:
```bash
docker logs finance-tracker-cron
```

View detailed cron execution logs:
```bash
docker exec finance-tracker-cron cat /var/log/cron.log
```

## Customizing Schedule

To change when cron runs, edit `cron/Dockerfile`:

```dockerfile
# Current: Daily at midnight
RUN echo "0 0 * * * /app/run-cron.sh >> /var/log/cron.log 2>&1" > /etc/crontabs/root

# Examples:
# Every 6 hours: "0 */6 * * *"
# Every day at 2 AM: "0 2 * * *"
# Every Monday at 9 AM: "0 9 * * 1"
```

Cron format: `minute hour day month weekday`

## Testing Manually

Trigger the cron job manually:
```bash
docker exec finance-tracker-cron /app/run-cron.sh
```

## Monitoring

View real-time logs:
```bash
docker logs -f finance-tracker-cron
```

Check if transactions were created:
- Login to your app
- Go to Transactions page
- Look for transactions with "(Auto)" in the note

## Troubleshooting

**Cron not running?**
```bash
# Check if container is running
docker ps | grep cron

# Check logs
docker logs finance-tracker-cron

# Restart container
docker restart finance-tracker-cron
```

**Wrong timezone?**
Update `TZ` environment variable in docker-compose.yml and restart.

**API not reachable?**
Make sure `APP_URL` is correct (use service name `http://app:3000` in Docker network).

## Production Notes

- Change `CRON_SECRET` to a strong random value
- Keep logs size manageable (they're stored in Docker volume)
- Monitor container health in Portainer
- Set up alerts for failed cron jobs (optional)
