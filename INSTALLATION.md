# Installation Guide

Complete setup instructions for the AWS Centralized Management Application.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Backend Setup](#backend-setup)
4. [Database Setup](#database-setup)
5. [Frontend Setup](#frontend-setup)
6. [Environment Configuration](#environment-configuration)
7. [Initial Data Setup](#initial-data-setup)
8. [Running the Application](#running-the-application)
9. [Verification](#verification)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   # Check version
   node --version
   
   # Install on Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install on macOS
   brew install node@18
   ```

2. **PostgreSQL** (v14 or higher)
   ```bash
   # Check version
   psql --version
   
   # Install on Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   
   # Install on macOS
   brew install postgresql@14
   brew services start postgresql@14
   ```

3. **Git**
   ```bash
   # Check version
   git --version
   
   # Install on Ubuntu/Debian
   sudo apt-get install git
   
   # Install on macOS
   brew install git
   ```

### Optional Tools

- **pgAdmin** - PostgreSQL GUI (recommended for beginners)
- **Postman** or **Insomnia** - API testing
- **VS Code** - Recommended code editor

---

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 10 GB free space
- **OS**: Linux, macOS, or Windows (with WSL2)

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Disk**: 20+ GB free space
- **OS**: Linux or macOS

---

## Backend Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/Lalatenduswain/AWS-Centralized-Management-Application.git
cd AWS-Centralized-Management-Application
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- Express.js
- TypeScript
- PostgreSQL client (pg)
- JWT & bcrypt
- AWS SDK v3
- Nodemailer
- And 300+ other packages

### Step 3: Build TypeScript

```bash
npm run build
```

Expected output:
```
> aws-central-management-backend@1.0.0 build
> tsc

✓ TypeScript compilation successful (0 errors)
```

---

## Database Setup

### Step 1: Create Database

```bash
# Create database
createdb aws_central_mgmt

# Or using psql
psql -U postgres
CREATE DATABASE aws_central_mgmt;
\q
```

### Step 2: Run Schema

```bash
# Run main schema
psql -U postgres -d aws_central_mgmt -f schema.sql

# Run migrations
psql -U postgres -d aws_central_mgmt -f migrations/002_add_billing_tables.sql
psql -U postgres -d aws_central_mgmt -f migrations/003_add_budget_alerts_table.sql
```

### Step 3: Verify Tables

```bash
psql -U postgres -d aws_central_mgmt
\dt
```

Expected tables:
```
 Schema |           Name               | Type  |  Owner   
--------+------------------------------+-------+----------
 public | activity_logs                | table | postgres
 public | billing_records              | table | postgres
 public | budget_alerts                | table | postgres
 public | clients                      | table | postgres
 public | user_budgets                 | table | postgres
 public | user_resource_assignments    | table | postgres
 public | users                        | table | postgres
```

---

## Frontend Setup

### Step 1: Install Frontend Dependencies

```bash
cd ../web
npm install
```

This will install:
- React
- React Router
- Axios
- Recharts
- And 200+ other packages

### Step 2: Build Frontend (Optional)

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

---

## Environment Configuration

### Backend Environment Variables

Create `backend/.env` from template:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aws_central_mgmt
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_min_32_characters_long_random_string
JWT_EXPIRES_IN=1h

# Encryption Configuration (MUST be exactly 32 characters)
ENCRYPTION_KEY=your32characterencryptionkey!!

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# Email Configuration (Optional - for alerts)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=AWS Centralized Management <your-email@gmail.com>

# Cron Jobs
ENABLE_CRON_JOBS=true
```

#### Important Notes:

1. **ENCRYPTION_KEY**: Must be exactly 32 characters
   ```bash
   # Generate random 32-char key
   openssl rand -base64 24
   ```

2. **JWT_SECRET**: At least 32 characters for security
   ```bash
   # Generate random secret
   openssl rand -hex 32
   ```

3. **EMAIL_PASS**: Use app-specific password, NOT your Gmail password
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail" app

### Frontend Environment Variables

Create `web/.env`:

```bash
cd ../web
cp .env.example .env
```

Edit `web/.env`:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:3000/api

# Optional: Enable debug mode
REACT_APP_DEBUG=true
```

---

## Initial Data Setup

### Step 1: Create Admin User

Option A: Using psql
```bash
psql -U postgres -d aws_central_mgmt

INSERT INTO users (email, password_hash)
VALUES (
  'admin@example.com',
  '$2b$10$YQNXg3rXndOXYVvKgJ2a1.K6f5vXZGJKhJ2xBZHZmQ3JZ0qJKvZ0m'
);
-- Default password: admin123
-- ⚠️ CHANGE THIS IN PRODUCTION!
```

Option B: Via API (after starting server)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourSecurePassword123!"
  }'
```

### Step 2: Create Test Client (Optional)

```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "client_name": "Test AWS Account",
    "access_key_id": "AKIAIOSFODNN7EXAMPLE",
    "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "us-east-1",
    "notes": "Test client for development"
  }'
```

---

## Running the Application

### Development Mode

#### Terminal 1: Start Backend
```bash
cd backend
npm run dev
```

Expected output:
```
✓ Database connection established

Initializing services...
✓ Scheduled job: budget-alerts-check (every hour at :00)
✓ Scheduled job: daily-cost-sync (daily at 1:00 AM)
✓ Scheduled job: data-cleanup (weekly on Sunday at 2:00 AM)
⚠ Email service not configured or unavailable

========================================
AWS Centralized Management - Backend API
========================================
Server running on port 3000
Environment: development
Health check: http://localhost:3000/health
========================================
```

#### Terminal 2: Start Frontend
```bash
cd web
npm start
```

Frontend will open automatically at `http://localhost:3001`

### Production Mode

#### Backend
```bash
cd backend
npm run build
npm start
```

#### Frontend
```bash
cd web
npm run build
# Serve build folder with nginx, Apache, or Node.js static server
```

---

## Verification

### 1. Backend Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

### 2. Database Connection

```bash
psql -U postgres -d aws_central_mgmt -c "SELECT COUNT(*) FROM users;"
```

Expected: At least 1 user

### 3. Frontend Access

Open browser: `http://localhost:3001`

You should see the login page.

### 4. API Test

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Expected: JWT token in response

### 5. Email Service Test (Optional)

```bash
curl -X POST http://localhost:3000/api/alerts/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test@example.com"
  }'
```

---

## Troubleshooting

### Database Connection Fails

**Error**: `ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -U postgres -l
```

### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

### TypeScript Compilation Errors

**Error**: Various TypeScript errors

**Solution**:
```bash
# Clean build
rm -rf dist/
npm run build

# If issues persist, check node_modules
rm -rf node_modules package-lock.json
npm install
```

### Email Service Not Working

**Error**: `Email service not configured`

**Solution**:
1. Check SMTP credentials in `.env`
2. Use app-specific password for Gmail
3. Test with:
   ```bash
   curl -X POST http://localhost:3000/api/alerts/test-email \
     -H "Authorization: Bearer TOKEN" \
     -d '{"email":"your@email.com"}'
   ```

### Frontend Can't Connect to Backend

**Error**: `Network Error` or CORS errors

**Solution**:
1. Check backend is running: `curl http://localhost:3000/health`
2. Verify `REACT_APP_API_URL` in `web/.env`
3. Check `ALLOWED_ORIGINS` in `backend/.env` includes frontend URL
4. Clear browser cache and restart

---

## Next Steps

After successful installation:

1. **Configure AWS Credentials** - Add real AWS client credentials
2. **Set Up Email** - Configure SMTP for budget alerts
3. **Create Budgets** - Set monthly spending limits
4. **Sync Costs** - Pull AWS billing data
5. **Explore Dashboard** - View billing analytics

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment.

---

## Additional Resources

- [API Documentation](API.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Security Best Practices](SECURITY.md)
- [Contributing Guide](CONTRIBUTING.md)

---

**Need help? [Open an issue](https://github.com/Lalatenduswain/AWS-Centralized-Management-Application/issues)**
