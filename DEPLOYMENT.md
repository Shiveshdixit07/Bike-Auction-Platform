# Deployment Guide

## Free Deployment (Render + TiDB + Upstash)

### Overview

| Service | Platform | Tier |
|---------|----------|------|
| Frontend | Render.com Static Site | Free |
| Backend | Render.com Web Service | Free |
| MySQL | TiDB Cloud | Free (5GB) |
| Redis | Upstash | Free (10K cmds/day) |

### Step 1: TiDB Cloud (MySQL)

1. Sign up at [tidbcloud.com](https://tidbcloud.com)
2. Create a free Serverless cluster
3. Copy the connection parameters:
   - Host (e.g., `gateway01.us-west-2.prod.aws.tidbcloud.com`)
   - Port: `4000`
   - User: your cluster user
   - Password: your cluster password
4. Create database: `bike_auction`

### Step 2: Upstash (Redis)

1. Sign up at [upstash.com](https://upstash.com)
2. Create a free Redis database
3. Copy the Redis URL (e.g., `rediss://...`)

### Step 3: Push to GitHub

```bash
git add .
git commit -m "deployment config"
git push origin main
```

### Step 4: Deploy Backend on Render

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: `bike-auction-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=<your-tidb-host>
   DB_PORT=4000
   DB_USER=<your-tidb-user>
   DB_PASSWORD=<your-tidb-password>
   DB_NAME=bike_auction
   REDIS_URL=<your-upstash-url>
   JWT_ACCESS_SECRET=<generate-random-string>
   JWT_REFRESH_SECRET=<generate-random-string>
   FRONTEND_URL=<your-frontend-url>
   ```
5. Deploy and copy the backend URL (e.g., `https://bike-auction-backend.onrender.com`)

### Step 5: Deploy Frontend on Render

1. Go to [render.com](https://render.com) → New → Static Site
2. Connect your GitHub repository
3. Configure:
   - **Name**: `bike-auction-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variable:
   ```
   VITE_API_URL=https://bike-auction-backend.onrender.com
   ```
5. Deploy and copy the frontend URL

### Step 6: Update Backend CORS

1. Go to your backend service on Render
2. Update `FRONTEND_URL` env var to your frontend URL
3. Redeploy the backend

### Step 7: Seed Database

Connect to your TiDB cluster and run the seed script, or access:
```
https://your-backend-url.onrender.com/api/docs
```

### Generate JWT Secrets

```bash
# Run locally to generate secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this twice to get separate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

---

## Docker Deployment (Recommended for Local/Production)

### Prerequisites

1. Docker
2. Docker Compose

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd Bike-Auction-Platform

# Copy environment file
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d

# Seed demo data
docker-compose exec backend npm run seed

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:3000
# API Docs: http://localhost:3000/api/docs
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild containers
docker-compose build --no-cache

# Run seed script
docker-compose exec backend npm run seed

# Access MySQL
docker-compose exec mysql mysql -u root -p bike_auction

# Access Redis CLI
docker-compose exec redis redis-cli
```

## Local Development (without Docker)

### Prerequisites

1. Node.js v18+
2. MySQL (running locally on port 3306)
3. Redis (running locally on port 6379)

### Step-by-Step Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd Bike-Auction-Platform

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# 4. Create database
mysql -u root -p
CREATE DATABASE bike_auction;

# 5. Seed demo data
npm run seed

# 6. Start backend (Terminal 1)
npm run dev

# 7. Install frontend dependencies (Terminal 2)
cd ../frontend
npm install

# 8. Start frontend
npm run dev
```

## Environment Variables

### Required Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=4000
DB_USER=root
DB_PASSWORD=password
DB_NAME=bike_auction

# Redis
REDIS_URL=redis://localhost:6379

# JWT (generate secure random strings)
JWT_ACCESS_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>

# Frontend
FRONTEND_URL=https://yourdomain.com

# Node
NODE_ENV=production
PORT=3000
```

### Optional Variables

```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BID_RATE_LIMIT_WINDOW_MS=10000
BID_RATE_LIMIT_MAX_REQUESTS=5

# Anti-Sniping
ANTI_SNIPE_EXTENSION_SECONDS=30
```

## Monitoring

### Application Monitoring

- **Logs**: Structured JSON via pino (stdout)
- **Metrics**: Prometheus format at `/metrics`
- **Health**: `/health` and `/health/ready`

### External Services

- **Grafana**: Dashboard visualization
- **Loki**: Log aggregation
- **Prometheus**: Metrics collection
- **Sentry**: Error tracking

## Backup Strategy

### MySQL

```bash
# Backup
docker-compose exec mysql mysqldump -u root -p bike_auction > backup.sql

# Restore
docker-compose exec mysql mysql -u root -p bike_auction < backup.sql
```

### Redis

```bash
# Backup
docker-compose exec redis redis-cli BGSAVE

# Copy backup file
docker cp bike-auction-redis:/data/dump.rdb ./redis-backup.rdb
```

## SSL/TLS Setup

### With Docker (Nginx)

```bash
# Create nginx.conf with SSL
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### With Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```
