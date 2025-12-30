# 🚀 QAMS - Deployment Guide

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ or Bun installed
- Database (SQLite for development, PostgreSQL/MySQL for production)
- Domain name configured
- SSL/TLS certificate (HTTPS required)

## 📋 Pre-Deployment Checklist

- [ ] Update `JWT_SECRET` environment variable with a strong random string
- [ ] Update `DATABASE_URL` with production database connection string
- [ ] Change all default passwords in production database
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS settings if needed
- [ ] Set up monitoring and error tracking
- [ ] Configure email service for notifications
- [ ] Set up database backups

## 🔧 Environment Variables

Create a `.env.production` file with the following:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/qams"

# JWT Secret (generate a strong random string)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Application
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

### Generating JWT Secret

```bash
# Generate a secure random string
openssl rand -base64 32
```

## 🏗️ Building for Production

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Run database migrations
bun run db:push

# Build the application
bun run build
```

## 🗄️ Database Setup

### Development (SQLite)
Default configuration uses SQLite - good for development and small deployments.

### Production (PostgreSQL/MySQL)

1. **Create Database**:
```sql
CREATE DATABASE qams;
```

2. **Update .env**:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/qams"
```

3. **Run Migrations**:
```bash
bun run db:push
```

4. **Seed Data** (optional):
```bash
bun run seed
```

## 🚢 Deployment Options

### Option 1: Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
bun install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Environment Variables in Vercel**:
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Add all variables from `.env.production`

### Option 2: Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN corepack enable pnpm && pnpm install

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t qams .
docker run -p 3000:3000 --env-file .env.production qams
```

### Option 3: Traditional Server (VPS/Dedicated)

```bash
# Upload files to server
rsync -avz ./ user@server:/var/www/qams

# SSH into server
ssh user@server
cd /var/www/qams

# Install dependencies
bun install

# Build
bun run build

# Start with PM2 (recommended)
bun install -g pm2
pm2 start bun --name "qams" -- start
pm2 save
pm2 startup
```

## 🔒 Security Configuration

### 1. HTTPS/TLS

**Using Nginx**:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Using Let's Encrypt**:
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 2. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 3. Rate Limiting

Configure rate limiting at the reverse proxy level:

**Nginx**:
```nginx
# Add to http block
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# Add to location block
limit_req zone=api burst=20 nodelay;
```

## 📊 Monitoring & Logging

### Application Monitoring

```bash
# Install monitoring tools
bun add -D @sentry/nextjs

# Configure in next.config.ts
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig({
  // ... other config
})
```

### Database Backups

**Automated Backup Script** (PostgreSQL):

```bash
#!/bin/bash
# /path/to/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_NAME="qams"
DB_USER="your_user"

pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/qams_$DATE.sql

# Keep last 7 days
find $BACKUP_DIR -name "qams_*.sql" -mtime +7 -delete
```

Add to crontab:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test

      - name: Build
        run: bun run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🧪 Testing Production Deployment

### 1. Health Check

```bash
curl https://your-domain.com/api/health
```

### 2. Database Connection

Check that Prisma can connect:
```bash
bun run db:push
```

### 3. Authentication Flow

1. Visit `https://your-domain.com`
2. Try logging in with test credentials
3. Verify JWT token storage
4. Check dashboard access

### 4. Role-Based Access

1. Test all three roles
2. Verify RBAC restrictions
3. Check class isolation
4. Verify API protection

## 📈 Performance Optimization

### 1. Enable Caching

**Next.js**:
```javascript
// next.config.ts
module.exports = {
  experimental: {
    serverActions: {
      cache: 'force-cache',
    },
  },
}
```

### 2. Database Indexing

Ensure Prisma indexes are created:
```prisma
// schema.prisma
@@index([username])
@@index([role])
@@index([classId])
```

### 3. CDN Configuration

Serve static assets through CDN:
- Vercel handles this automatically
- For custom deployment, use Cloudflare or AWS CloudFront

## 🆘 Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
bun install
bun run build
```

### Database Connection Issues

```bash
# Test connection
psql postgresql://user:password@host:5432/qams

# Check Prisma client
bun run db:generate
```

### Runtime Errors

Check logs:
```bash
# PM2 logs
pm2 logs qams

# Docker logs
docker logs <container-id>

# Systemd logs
journalctl -u qams
```

## 📞 Post-Deployment

### Immediate Tasks
1. Change all default passwords
2. Set up email service
3. Configure backups
4. Enable monitoring
5. Test all features
6. Train users

### Ongoing Maintenance
- Weekly: Review audit logs
- Monthly: Update dependencies
- Quarterly: Review security settings
- Yearly: Security audit

---

**Deployment completed!** Your QAMS system is now live and ready to serve students, instructors, and administrators.

For support, refer to:
- Full README.md
- QUICKSTART.md
- PROJECT_SUMMARY.md
