# Deployment Guide

Production deployment guide for the AWS Centralized Management Application.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Deployment](#database-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup Strategy](#backup-strategy)
9. [Scaling Considerations](#scaling-considerations)

---

## Pre-Deployment Checklist

### Security
- [ ] Strong passwords configured
- [ ] Encryption keys generated (32 characters)
- [ ] JWT secret generated (32+ characters)
- [ ] HTTPS certificates obtained
- [ ] Firewall rules configured
- [ ] Database not publicly accessible
- [ ] CORS properly configured
- [ ] Security headers enabled

### Application
- [ ] Environment variables set
- [ ] Build successful (no errors)
- [ ] Database migrations run
- [ ] Initial admin user created
- [ ] Email service tested
- [ ] All tests passing (when available)

### Infrastructure
- [ ] Domain name configured
- [ ] DNS records set
- [ ] SSL certificate valid
- [ ] Backup system configured
- [ ] Monitoring tools set up

---

## Infrastructure Setup

### Option 1: AWS EC2 + RDS (Recommended)

#### 1. Create RDS PostgreSQL Instance

```bash
# Via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier aws-mgmt-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.7 \
  --master-username adminuser \
  --master-user-password STRONG_PASSWORD \
  --allocated-storage 20 \
  --backup-retention-period 7 \
  --no-publicly-accessible
```

#### 2. Create EC2 Instance

```bash
# Launch Ubuntu 22.04 LTS instance
# t3.small or larger recommended
# Attach security group allowing:
# - Port 22 (SSH) from your IP
# - Port 80 (HTTP) from anywhere
# - Port 443 (HTTPS) from anywhere
```

#### 3. Install Node.js and Dependencies

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install nginx
sudo apt install nginx -y
```

### Option 2: Heroku (Easiest)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create aws-mgmt-prod

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret
heroku config:set ENCRYPTION_KEY=your_32_char_key

# Deploy
git push heroku main

# Run migrations
heroku run psql $DATABASE_URL < backend/schema.sql
```

### Option 3: DigitalOcean App Platform

```bash
# Create app via DigitalOcean Console
# Connect GitHub repository
# Set environment variables in dashboard
# Deploy automatically on push
```

---

## Database Deployment

### 1. Create Production Database

```bash
# Connect to RDS
psql -h your-rds-endpoint.amazonaws.com \
     -U adminuser \
     -d postgres

# Create database
CREATE DATABASE aws_central_mgmt_prod;
\c aws_central_mgmt_prod
```

### 2. Run Migrations

```bash
# Run schema
\i backend/schema.sql

# Run migrations
\i backend/migrations/002_add_billing_tables.sql
\i backend/migrations/003_add_budget_alerts_table.sql
```

### 3. Create Initial Admin User

```bash
# Generate password hash
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('YOUR_SECURE_PASSWORD', 10));"

# Insert user
INSERT INTO users (email, password_hash)
VALUES ('admin@yourdomain.com', 'HASHED_PASSWORD');
```

### 4. Configure Database Backups

```bash
# For RDS (automatic)
# Set backup retention period to 7+ days

# For self-hosted PostgreSQL
# Add to crontab:
0 2 * * * pg_dump -h localhost -U postgres aws_central_mgmt_prod | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

---

## Backend Deployment

### Method 1: PM2 (EC2)

```bash
# Clone repository
git clone https://github.com/Lalatenduswain/AWS-Centralized-Management-Application.git
cd AWS-Centralized-Management-Application/backend

# Install dependencies
npm install --production

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Build
npm run build

# Start with PM2
pm2 start dist/server.js --name aws-mgmt-api

# Configure PM2 startup
pm2 startup
pm2 save

# Monitor
pm2 logs aws-mgmt-api
pm2 monit
```

### Method 2: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

```bash
# Build image
docker build -t aws-mgmt-backend .

# Run container
docker run -d \
  --name aws-mgmt-api \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  aws-mgmt-backend
```

### Method 3: Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aws-mgmt-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: aws-mgmt-backend
  template:
    metadata:
      labels:
        app: aws-mgmt-backend
    spec:
      containers:
      - name: backend
        image: your-registry/aws-mgmt-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: aws-mgmt-secrets
              key: database-url
```

---

## Frontend Deployment

### 1. Build Frontend

```bash
cd web
npm install
npm run build
```

### 2. Deploy to S3 + CloudFront

```bash
# Upload to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### 3. Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd web
netlify deploy --prod --dir=build
```

### 4. Deploy with nginx (EC2)

```nginx
# /etc/nginx/sites-available/aws-mgmt
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/aws-mgmt-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/aws-mgmt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL/TLS Configuration

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already configured by Certbot)
sudo certbot renew --dry-run
```

### Using AWS Certificate Manager

```bash
# Request certificate via AWS Console
# Add to CloudFront distribution
# Or attach to Load Balancer
```

---

## Monitoring & Logging

### Application Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# CloudWatch (AWS)
# Configure CloudWatch agent
# Send application logs to CloudWatch
```

### Database Monitoring

```bash
# RDS Monitoring (automatic)
# Enable Enhanced Monitoring
# Set up CloudWatch alarms for:
# - CPU usage > 80%
# - Free storage < 10GB
# - Connection count > 80% of max
```

### Application Logs

```bash
# View logs
pm2 logs aws-mgmt-api

# Or with Docker
docker logs -f aws-mgmt-api
```

---

## Backup Strategy

### Database Backups

```bash
# Automated daily backups
# Retention: 30 days
# Test restore quarterly
```

### Application Backups

```bash
# Git repository (code)
# Environment files (encrypted storage)
# Uploaded files (S3 versioning)
```

---

## Scaling Considerations

### Horizontal Scaling

```bash
# Add more backend instances
# Use load balancer (ALB/NLB)
# Session management (stateless JWT)
```

### Caching

```bash
# Add Redis for caching
# Cache database queries
# Cache API responses
```

### Database Scaling

```bash
# Read replicas for read-heavy workload
# Connection pooling
# Query optimization
```

---

## Post-Deployment

### Health Checks

```bash
# Backend
curl https://api.yourdomain.com/health

# Database
psql -h your-db-endpoint -U adminuser -d aws_central_mgmt_prod -c "SELECT 1;"
```

### Performance Testing

```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://api.yourdomain.com/api/health
```

### Security Audit

```bash
# SSL test
ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# Security headers
securityheaders.com/?q=yourdomain.com
```

---

## Rollback Plan

```bash
# PM2
pm2 stop aws-mgmt-api
git checkout previous-commit
npm install
npm run build
pm2 restart aws-mgmt-api

# Docker
docker stop aws-mgmt-api
docker rm aws-mgmt-api
docker run -d \
  --name aws-mgmt-api \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  aws-mgmt-backend:previous-tag
```

---

**For issues during deployment, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**
