# Price Tracker — Production Deployment Guide

## Prerequisites

- Ubuntu 22.04+ server with Docker and Docker Compose installed
- **Domain:** `price.vectobody.com` pointed to your server's IP address
- Git access to your repository

---

## Step 0: DNS Configuration

Before deploying, configure your DNS:

1. Log in to your domain registrar or DNS provider
2. Add an **A record** for the subdomain:
   - **Name/Host:** `price`
   - **Type:** `A`
   - **Value:** `<your-server-ip-address>`
   - **TTL:** 300 (5 minutes for testing; set to 3600+ after verified)
3. Wait for DNS propagation (can take 1-60 minutes):
   ```bash
   dig price.vectobody.com +short
   # Should return your server IP

---

## Step 1: Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# Clone the repository
git clone https://github.com/yourusername/price-tracker-saas.git
cd price-tracker-saas
```

---

## Step 2: Environment Configuration

Create a `.env.production` file in the project root:

```bash
cp .env.example .env.production
nano .env.production
```

Fill in every variable. See **Step 5** below for how to obtain each one.

**Required variables:**

| Variable | Status | How to Get |
|----------|--------|-----------|
| `DB_USER` | ✅ Set | Choose a username (e.g., `pricetracker`) |
| `DB_PASS` | ✅ Set | Generate a strong password: `openssl rand -base64 32` |
| `DB_NAME` | ✅ Set | Choose a name (e.g., `pricetracker`) |
| `DOMAIN` | ✅ Set | Your domain (e.g., `pricetracker.example.com`) |
| `AUTH_SECRET` | ✅ Set | Generate: `openssl rand -base64 32` |
| `AUTH_GITHUB_ID` | ❌ Needs setup | See Step 5.1 |
| `AUTH_GITHUB_SECRET` | ❌ Needs setup | See Step 5.1 |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | ✅ Already have | From your Paddle sandbox/live account |
| `PADDLE_API_KEY` | ✅ Already have | From your Paddle sandbox/live account |
| `PADDLE_PERSONAL_PRICE_ID` | ✅ Already have | From your Paddle sandbox/live account |
| `PADDLE_PRO_PRICE_ID` | ✅ Already have | From your Paddle sandbox/live account |
| `PADDLE_WEBHOOK_SECRET` | ✅ Already have | From your Paddle sandbox/live account |
| `RESEND_API_KEY` | ❌ Needs setup | See Step 5.2 |
| `INNGEST_APP_ID` | ❌ Needs setup | See Step 5.3 |
| `INNGEST_EVENT_KEY` | ❌ Needs setup | See Step 5.3 |
| `INNGEST_SIGNING_KEY` | ❌ Needs setup | See Step 5.3 |
| `EBAY_APP_ID` | ✅ Already have | From your eBay developer account |
| `EBAY_CERT_ID` | ✅ Already have | From your eBay developer account |
| `CRON_SECRET` | ✅ Set | Generate: `openssl rand -base64 32` |

---

## Step 3: SSL Certificate (Automatic with Caddy)

The `docker-compose.prod.yml` includes **Caddy** which automatically provisions and renews Let's Encrypt SSL certificates for `price.vectobody.com`. No manual SSL setup is needed.

Caddy will:
1. Detect the domain from the `Caddyfile`
2. Automatically obtain a Let's Encrypt certificate
3. Renew the certificate before it expires
4. Redirect HTTP → HTTPS automatically

The `Caddyfile` is pre-configured:

```
price.vectobody.com {
    reverse_proxy app:3000
    header {
        X-Frame-Options "DENY"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        X-XSS-Protection "1; mode=block"
        -Server
    }
    tls { protocols tls1.2 tls1.3 }
    rate_limit {
        zone dynamic {
            key {remote_host}
            events 100
            window 1m
        }
    }
}
```

---

## Step 4: Deploy

```bash
# Create .env.production file with all secrets
nano .env.production

# Build and start all services (Caddy + App + DB)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Run database migrations (one-time)
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm migrate

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Verify the app is responding
curl -I https://price.vectobody.com

---

## Step 5: Missing Service Setup Guides

### 5.1 GitHub OAuth

1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** `Price Tracker`
   - **Homepage URL:** `https://pricetracker.yourdomain.com`
   - **Authorization callback URL:** `https://price.vectobody.com/api/auth/callback/github`
4. Click **Register application**
5. Copy **Client ID** → set as `AUTH_GITHUB_ID`
6. Click **Generate a new client secret** → copy → set as `AUTH_GITHUB_SECRET`

### 5.2 Resend (Email)

1. Go to https://resend.com
2. Sign up for an account (free tier: 100 emails/day)
3. Go to **API Keys** → **Create API Key**
4. Copy the key → set as `RESEND_API_KEY`
5. Go to **Domains** → **Add Domain** → enter your domain
6. Add the DNS TXT record provided by Resend to your domain's DNS settings
7. Wait for verification (usually 5-10 minutes)
8. Update `FROM_EMAIL` in `src/lib/email/resend.ts` to match your verified domain

### 5.3 Inngest (Background Jobs)

1. Go to https://app.inngest.com
2. Sign up and create a new project
3. Go to **Settings** → **Environment Variables**
4. Copy the values:
   - **App ID** → set as `INNGEST_APP_ID`
   - **Event Key** → set as `INNGEST_EVENT_KEY`
   - **Signing Key** → set as `INNGEST_SIGNING_KEY`
5. In the Inngest dashboard, set your app URL to: `https://price.vectobody.com/api/inngest`
6. The cron functions (`check-product-prices`, `check-price-alerts`) will auto-discover

### 5.4 Paddle Webhook (Production)

1. Go to https://vendors.paddle.com (or sandbox-login.paddle.com for testing)
2. Navigate to **Developer Tools** → **Webhooks**
3. Click **Add Webhook**
4. **URL:** `https://price.vectobody.com/api/billing/webhook`
5. Select events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `payment.created`
6. Copy the **Webhook Secret Key** → set as `PADDLE_WEBHOOK_SECRET`
7. In Paddle **Checkout Settings**, set your **Default Payment Link** to `https://pricetracker.yourdomain.com`

### 5.5 PWA Icons

The placeholder icons at `public/images/icon-192.png` and `public/images/icon-512.png` need to be replaced with real app icons. Use a tool like:

- https://realfavicongenerator.net
- https://www.pwabuilder.com/imageGenerator

Upload a 512x512 logo, download the generated icons, and replace the files in `public/images/`.

---

## Step 6: Security Checklist

- [ ] **Database password**: Use a strong random password (`openssl rand -base64 32`)
- [ ] **AUTH_SECRET**: Use a strong random secret (`openssl rand -base64 32`)
- [ ] **CRON_SECRET**: Use a strong random secret (`openssl rand -base64 32`)
- [ ] **Postgres port**: Do NOT expose port 5432 to the internet. The `docker-compose.prod.yml` only exposes it internally via the `app-network`
- [ ] **HTTPS only**: Ensure your reverse proxy (Caddy/Nginx) enforces HTTPS and redirects HTTP
- [ ] **Rate limiting**: Add rate limiting to your reverse proxy to prevent abuse of `/api/scrape` and `/api/auth`
- [ ] **Docker secrets**: For production, consider using Docker secrets instead of environment variables for sensitive values:
  ```bash
  echo "your-db-password" | docker secret create db_pass -
  ```
- [ ] **Regular updates**: Keep the server updated:
  ```bash
  sudo apt update && sudo apt upgrade -y
  docker compose pull
  docker compose up -d --build
  ```
- [ ] **Monitoring**: Set up health checks:
  ```bash
  curl https://pricetracker.yourdomain.com/api/health
  ```
- [ ] **Backups**: Schedule regular PostgreSQL backups:
  ```bash
  docker exec price-tracker-db pg_dump -U pricetracker pricetracker > backup_$(date +%Y%m%d).sql
  ```

---

## Step 7: Post-Deployment Verification

```bash
# 1. Check all containers are running
docker compose -f docker-compose.prod.yml ps

# 2. Check app logs
docker compose -f docker-compose.prod.yml logs app

# 3. Test the homepage
curl -I https://price.vectobody.com

# 4. Test the health API
curl https://price.vectobody.com/api/health

# 5. Test auth pages
curl -I https://price.vectobody.com/login

# 6. Test PWA manifest
curl https://price.vectobody.com/manifest.json

# 7. Run migrations (if not done on first deploy)
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm migrate

# 8. Check SSL certificate
echo | openssl s_client -connect price.vectobody.com:443 -servername price.vectobody.com 2>/dev/null | openssl x509 -noout -dates

---

## Troubleshooting

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| Container exits immediately | Missing env vars | Check `.env.production` has all required values |
| Playwright fails | Missing Chromium | Ensure `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` is set |
| Database connection refused | DB not ready | The `depends_on: condition: service_healthy` handles this |
| 502 Bad Gateway | App not started yet | Wait 10-15s for the app to compile on first run |
| SSL certificate error | DNS not propagated | Verify your domain points to the server IP |
| Paddle checkout fails | Wrong domain in Paddle settings | Update Paddle Checkout Settings → Default Payment Link |
| Email not sending | Resend domain not verified | Check Resend dashboard for domain verification status |
