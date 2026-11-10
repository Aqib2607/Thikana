#!/bin/sh
set -e

# Default to 10000 if PORT is not set by Render
export PORT="${PORT:-10000}"

# Substitute PORT in nginx configuration template
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Normalize APP_KEY if generated as raw 256-bit base64 without prefix by Render
if [ -n "$APP_KEY" ]; then
    case "$APP_KEY" in
        base64:*) ;;
        *)
            if [ ${#APP_KEY} -eq 44 ]; then
                export APP_KEY="base64:${APP_KEY}"
            fi
            ;;
    esac
fi

# Ensure Laravel storage and bootstrap cache directories exist with correct permissions
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Clean any stale bootstrap cache files before warming discovery
rm -f /var/www/html/bootstrap/cache/*.php

# Warm up package discovery cache
php /var/www/html/artisan package:discover --ansi

# Execute supervisor or supplied CMD
exec "$@"

