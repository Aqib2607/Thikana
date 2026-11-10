# -------------------------------------------------------------
# Stage 1: Vendor Dependencies Builder
# -------------------------------------------------------------
FROM composer:2.8 AS composer-builder

WORKDIR /app

# Copy Composer manifests first to leverage Docker layer caching
COPY composer.json composer.lock ./

# Install production dependencies without dev tools, optimizing autoloader
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

# -------------------------------------------------------------
# Stage 2: Production PHP-FPM 8.4 + Nginx Runtime
# -------------------------------------------------------------
FROM php:8.4-fpm-alpine

ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies, Nginx, gettext (for envsubst), and Supervisor
RUN apk update && apk add --no-cache \
    nginx \
    supervisor \
    gettext \
    curl \
    curl-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libzip-dev \
    oniguruma-dev \
    libxml2-dev

# Configure and compile required PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        bcmath \
        xml \
        curl \
        fileinfo \
        gd \
        zip \
        opcache

# Apply production PHP ini settings
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 20M/g' "$PHP_INI_DIR/php.ini" \
    && sed -i 's/post_max_size = 8M/post_max_size = 25M/g' "$PHP_INI_DIR/php.ini" \
    && sed -i 's/memory_limit = 128M/memory_limit = 256M/g' "$PHP_INI_DIR/php.ini"

WORKDIR /var/www/html

# Copy vendor dependencies from builder stage
COPY --from=composer-builder /app/vendor /var/www/html/vendor

# Copy application source code
COPY . /var/www/html

# Copy Docker configuration files
COPY docker/nginx.conf /etc/nginx/nginx.conf.template
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 10000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

