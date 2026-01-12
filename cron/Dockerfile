FROM alpine:latest

# Install curl and bash
RUN apk add --no-cache curl bash tzdata

# Set timezone (change to your timezone)
ENV TZ=Asia/Kolkata

# Copy cron script
COPY run-cron.sh /app/run-cron.sh
RUN chmod +x /app/run-cron.sh

# Setup cron job to run daily at midnight
RUN echo "0 0 * * * /app/run-cron.sh >> /var/log/cron.log 2>&1" > /etc/crontabs/root

# Create log file
RUN touch /var/log/cron.log

CMD crond -f -l 2
