# Docker Cron Setup for Recurring Transactions & Backups

This setup runs a lightweight Alpine Linux container with cron for two jobs:
triggering recurring transactions daily, and backing up the database on a
weekly/monthly schedule.

## Files Created

- `cron/Dockerfile` - Docker image with cron + `pg_dump` installed
- `cron/run-cron.sh` - Script that calls the recurring-transactions API endpoint
- `cron/backup.sh` - Script that dumps the database and prunes old dumps
- Updated `docker-compose.yml` - Added cron service, backup env vars, and a
  bind-mounted `/backups` volume

## How It Works

**Recurring transactions:**
1. Runs daily at midnight (00:00)
2. Calls `POST /api/cron/recurring` on your app
3. Processes all recurring transactions due today
4. Logs results to `/var/log/cron.log` inside container

**Database backups:**
1. Runs `pg_dump` directly against the `postgres` service (no app involved)
2. Weekly: every Sunday 02:00, keeps the newest 8 dumps
3. Monthly: 1st of the month 03:00, keeps the newest 12 dumps
4. Dumps are gzip'd SQL files named `personal_finance_<weekly|monthly>_<timestamp>.sql.gz`
5. Written to `/backups` inside the container, which is a **bind mount** to a
   real path on the host (`./backups` by default) — this is the key part for
   disaster recovery: point that host path at wherever you already back up to
   (an external HDD, Time Machine, an rsync cron, a NAS sync), and the app
   never needs to know that destination exists.
6. Logs to `/var/log/backup.log` inside the container

## Setup Instructions

### 1. Set CRON_SECRET Environment Variable

Add to your `.env` file:
```bash
CRON_SECRET=your-super-secret-key-here-change-this
```

### 1b. Point backups at your actual backup destination

By default backups land in `./backups` next to the compose file, which is
fine for testing but is *not* itself a backup destination — it's still on
the same disk as everything else. Set this in your `.env` to a path that's
actually synced elsewhere (an external drive mount, a NAS mount, a folder
watched by Time Machine or an rsync job):

```bash
BACKUP_HOST_DIR=/Volumes/MyExternalDrive/finance-backups
# Optional, defaults shown:
BACKUP_RETENTION_WEEKLY=8
BACKUP_RETENTION_MONTHLY=12
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

Trigger the recurring-transactions job manually:
```bash
docker exec finance-tracker-cron /app/run-cron.sh
```

Trigger a backup manually (either kind, any time):
```bash
docker exec finance-tracker-cron /app/backup.sh weekly
docker exec finance-tracker-cron /app/backup.sh monthly
```

List backups on the host:
```bash
ls -lh ./backups
# or wherever BACKUP_HOST_DIR points
```

## Restoring from a Backup

```bash
gunzip -c ./backups/personal_finance_weekly_20260911_020000.sql.gz | \
  docker exec -i finance-tracker-db psql -U financeuser -d financedb
```

Restoring onto a fresh/empty database is safest. Restoring onto a database
that already has data will conflict with existing rows.

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
