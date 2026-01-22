# Troubleshooting Guide

Common issues and solutions for the AWS Centralized Management Application.

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Database Problems](#database-problems)
3. [Backend Issues](#backend-issues)
4. [Frontend Issues](#frontend-issues)
5. [Email Service Issues](#email-service-issues)
6. [AWS Integration Issues](#aws-integration-issues)
7. [Performance Issues](#performance-issues)
8. [Deployment Issues](#deployment-issues)

---

## Installation Issues

### Node.js Version Mismatch

**Problem**: `Error: The engine "node" is incompatible with this module`

**Solution**:
```bash
# Check current version
node --version

# Upgrade to Node 18+
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node@18
```

### npm Install Fails

**Problem**: `npm ERR! code EACCES`

**Solution**:
```bash
# Fix permissions
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config

# Or use npx
npx npm install

# Or use different directory
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### TypeScript Compilation Errors

**Problem**: Various TypeScript errors during `npm run build`

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Update TypeScript
npm install typescript@latest --save-dev

# Check tsconfig.json
# Ensure "strict": false for easier development
```

---

## Database Problems

### Can't Connect to PostgreSQL

**Problem**: `ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check PostgreSQL is listening
sudo netstat -tulpn | grep 5432

# Check pg_hba.conf allows local connections
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: local   all   all   trust
# Or: host    all   all   127.0.0.1/32   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Authentication Failed

**Problem**: `password authentication failed for user "postgres"`

**Solution**:
```bash
# Reset PostgreSQL password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'newpassword';
\q

# Update .env file
DB_PASSWORD=newpassword

# Or use peer authentication (Unix socket)
# Change pg_hba.conf to: local   all   all   peer
```

### Database Doesn't Exist

**Problem**: `database "aws_central_mgmt" does not exist`

**Solution**:
```bash
# Create database
createdb aws_central_mgmt

# Or via psql
psql -U postgres
CREATE DATABASE aws_central_mgmt;
\q

# Run schema
psql -U postgres -d aws_central_mgmt -f backend/schema.sql
```

### Migration Fails

**Problem**: Errors when running SQL migrations

**Solution**:
```bash
# Check current schema
psql -U postgres -d aws_central_mgmt
\dt

# Drop and recreate (CAUTION: deletes data)
dropdb aws_central_mgmt
createdb aws_central_mgmt
psql -U postgres -d aws_central_mgmt -f backend/schema.sql

# Or fix specific issue
# Check error message and fix SQL syntax
```

---

## Backend Issues

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000
# Or on Linux
sudo netstat -tulpn | grep :3000

# Kill the process
kill -9 <PID>

# Or use different port
# Edit .env
PORT=3001
```

### JWT Token Invalid

**Problem**: `Invalid or expired token`

**Solution**:
```bash
# Check JWT_SECRET is set in .env
cat backend/.env | grep JWT_SECRET

# Generate new secret if missing
openssl rand -hex 32

# Ensure token is being sent correctly
# In API requests: Authorization: Bearer <token>

# Check token expiration
# Default is 1 hour, adjust JWT_EXPIRES_IN in .env
```

### Encryption Key Error

**Problem**: `Invalid key length` or encryption errors

**Solution**:
```bash
# ENCRYPTION_KEY must be exactly 32 characters
# Generate valid key
openssl rand -base64 24

# Or use string exactly 32 chars
# Example: your32characterencryptionkey!!

# Update .env
ENCRYPTION_KEY=your32characterencryptionkey!!
```

### Cron Jobs Not Running

**Problem**: Budget alerts not being sent

**Solution**:
```bash
# Check ENABLE_CRON_JOBS in .env
ENABLE_CRON_JOBS=true

# Check server logs
pm2 logs aws-mgmt-api
# Or
npm run dev

# Look for:
# ✓ Scheduled job: budget-alerts-check (every hour at :00)

# Manually trigger alert check
curl -X POST http://localhost:3000/api/alerts/check \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Frontend Issues

### Can't Connect to Backend

**Problem**: `Network Error` or CORS errors

**Solution**:
```bash
# Check backend is running
curl http://localhost:3000/health

# Verify REACT_APP_API_URL in web/.env
REACT_APP_API_URL=http://localhost:3000/api

# Check CORS settings in backend/.env
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# Clear browser cache
# Chrome: Ctrl+Shift+Delete
# Or use incognito mode

# Restart frontend
cd web
npm start
```

### Charts Not Rendering

**Problem**: Blank charts or "Cannot read property" errors

**Solution**:
```bash
# Check Recharts is installed
cd web
npm list recharts

# Reinstall if needed
npm install recharts

# Check data format
# Recharts expects array of objects
# Example: [{billing_date: "2026-01-01", total_cost: 123.45}]

# Check browser console for errors
# Open DevTools (F12) and look at Console tab
```

### Export Downloads Not Working

**Problem**: Export button doesn't download file

**Solution**:
```typescript
// Check responseType is set to 'blob'
export const exportsAPI = {
  exportBillingRecords: (userId: number) => {
    return apiClient.get('/exports/billing-records/csv', {
      responseType: 'blob', // Important!
    });
  },
};

// Check download handler
const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
```

---

## Email Service Issues

### Email Not Sending

**Problem**: Budget alert emails not being received

**Solution**:
```bash
# Check email configuration in backend/.env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-specific-password  # NOT your Gmail password!
EMAIL_FROM=AWS Mgmt <your-email@gmail.com>

# Test email configuration
curl -X POST http://localhost:3000/api/alerts/test-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check server logs for errors
pm2 logs aws-mgmt-api
# Look for: Email sent successfully or SMTP errors
```

### Gmail App Password

**Problem**: Gmail authentication failing

**Solution**:
```
1. Enable 2-Step Verification on Google Account
2. Go to: https://myaccount.google.com/apppasswords
3. Select "Mail" and your device
4. Generate password
5. Use generated password in EMAIL_PASS (not your Gmail password)
6. Update backend/.env
7. Restart backend
```

### Email Template Not Loading

**Problem**: Email shows plain text instead of HTML

**Solution**:
```bash
# Check template files exist
ls backend/src/templates/emails/
# Should see: budget-alert.hbs, over-budget-alert.hbs, daily-cost-summary.hbs

# Check Handlebars is installed
cd backend
npm list handlebars

# Reinstall if needed
npm install handlebars

# Check template path in email.service.ts
const templatePath = path.join(__dirname, '../templates/emails', template);
```

---

## AWS Integration Issues

### AWS Credentials Invalid

**Problem**: `The security token included in the request is invalid`

**Solution**:
```bash
# Verify AWS credentials format
# Access Key: AKIAIOSFODNN7EXAMPLE (starts with AKIA)
# Secret Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Test credentials with AWS CLI
aws configure
aws sts get-caller-identity

# Check IAM permissions
# Required: costexplorer:GetCostAndUsage
# Check in IAM Console

# Verify credentials are encrypted correctly in database
psql -U postgres -d aws_central_mgmt
SELECT client_name, region FROM clients;
# Should NOT see plain text credentials
```

### Cost Data Not Syncing

**Problem**: Billing records not being created

**Solution**:
```bash
# Manually trigger sync
curl -X POST http://localhost:3000/api/billing/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "user_id": 1,
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  }'

# Check AWS Cost Explorer is available
# May take 24-48 hours for new accounts

# Check date range
# AWS Cost Explorer has data from yesterday, not today

# Check IAM permissions
# Policy needs: costexplorer:GetCostAndUsage
```

---

## Performance Issues

### Slow API Responses

**Problem**: Requests taking 5+ seconds

**Solution**:
```bash
# Check database queries
# Enable query logging in PostgreSQL
psql -U postgres
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

# Check indexes exist
\d+ billing_records
# Should see multiple indexes

# Add missing indexes
CREATE INDEX idx_billing_records_user_period 
ON billing_records(user_id, billing_period);

# Enable query timing
\timing on

# Optimize slow queries
EXPLAIN ANALYZE SELECT ...;
```

### High Memory Usage

**Problem**: Backend using excessive memory

**Solution**:
```bash
# Check memory usage
pm2 monit

# Or
top -p $(pgrep -f "node.*server.js")

# Limit PM2 memory
pm2 start dist/server.js \
  --name aws-mgmt-api \
  --max-memory-restart 500M

# Check for memory leaks
# Use node --inspect for profiling
node --inspect dist/server.js
# Open chrome://inspect in Chrome
```

### Database Connection Pool Exhausted

**Problem**: `sorry, too many clients already`

**Solution**:
```typescript
// Increase pool size in backend/src/config/database.ts
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Increase from default (10)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Deployment Issues

### PM2 Won't Start

**Problem**: `Error: Cannot find module`

**Solution**:
```bash
# Ensure build completed
cd backend
npm run build

# Check dist/ folder exists
ls -la dist/

# Install production dependencies
npm install --production

# Start with full path
pm2 start /path/to/project/backend/dist/server.js

# Check PM2 logs
pm2 logs
```

### nginx 502 Bad Gateway

**Problem**: nginx can't connect to backend

**Solution**:
```bash
# Check backend is running
curl http://localhost:3000/health

# Check nginx configuration
sudo nginx -t

# Check proxy_pass URL matches backend port
# /etc/nginx/sites-available/aws-mgmt
location /api {
    proxy_pass http://localhost:3000;  # Must match backend port
}

# Restart nginx
sudo systemctl restart nginx

# Check nginx error log
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

**Problem**: HTTPS not working

**Solution**:
```bash
# Check certificate exists
sudo ls -la /etc/letsencrypt/live/yourdomain.com/

# Renew certificate
sudo certbot renew

# Check nginx SSL configuration
sudo nano /etc/nginx/sites-available/aws-mgmt
# Ensure:
listen 443 ssl;
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

# Test SSL
curl -I https://yourdomain.com
```

---

## Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Search [GitHub Issues](https://github.com/Lalatenduswain/AWS-Centralized-Management-Application/issues)
3. ✅ Check server logs (`pm2 logs` or `npm run dev`)
4. ✅ Check browser console (F12)
5. ✅ Try the latest version

### Creating a Bug Report

Include:
- OS and version
- Node.js version
- PostgreSQL version
- Steps to reproduce
- Error messages (full text)
- Screenshots if applicable

### Useful Commands for Debugging

```bash
# Check all versions
node --version
npm --version
psql --version
git --version

# Check running processes
ps aux | grep node
ps aux | grep postgres

# Check ports
sudo netstat -tulpn | grep LISTEN

# Check disk space
df -h

# Check memory
free -h

# Check logs
pm2 logs
tail -f backend/logs/error.log
sudo tail -f /var/log/nginx/error.log
```

---

**Still stuck? [Open an issue](https://github.com/Lalatenduswain/AWS-Centralized-Management-Application/issues)**
