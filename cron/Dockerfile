FROM alpine:latest

# Install curl, bash, and postgresql-client (for pg_dump)
RUN apk add --no-cache curl bash tzdata postgresql-client

# Set timezone (change to your timezone)
ENV TZ=Asia/Kolkata

# Copy cron scripts
COPY run-cron.sh /app/run-cron.sh
COPY backup.sh /app/backup.sh
RUN chmod +x /app/run-cron.sh /app/backup.sh

# Cron schedule:
#   - daily at midnight: recurring transactions + notifications
#   - weekly, Sunday 02:00: db backup (short retention)
#   - monthly, 1st at 03:00: db backup (long retention)
RUN { \
      echo "0 0 * * * /app/run-cron.sh >> /var/log/cron.log 2>&1"; \
      echo "0 2 * * 0 /app/backup.sh weekly >> /var/log/backup.log 2>&1"; \
      echo "0 3 1 * * /app/backup.sh monthly >> /var/log/backup.log 2>&1"; \
    } > /etc/crontabs/root

# Create log files
RUN touch /var/log/cron.log /var/log/backup.log

CMD crond -f -l 2
