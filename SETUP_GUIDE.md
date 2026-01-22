# Quick Setup Guide

This is a step-by-step guide to get your AWS Centralized Management Application running in 15 minutes.

## Prerequisites Checklist

- [ ] Node.js installed (v18+)
- [ ] PostgreSQL installed
- [ ] Terminal/Command Prompt open
- [ ] Text editor ready (VS Code recommended)

## 5-Step Quick Start

### Step 1: Database (3 minutes)

```bash
# Start PostgreSQL (depends on your OS)
# Windows: Start from Services
# Mac: brew services start postgresql
# Linux: sudo service postgresql start

# Create database
psql -U postgres
CREATE DATABASE aws_central_mgmt;
\q

# Load schema
cd backend
psql -U postgres -d aws_central_mgmt -f schema.sql
```

### Step 2: Backend Setup (5 minutes)

```bash
# Install dependencies
cd backend
npm install

# Copy environment file
cp .env.example .env

# Generate encryption key
npm run setup generate-key
# Copy the generated key

# Edit .env file
# Replace ENCRYPTION_KEY with the key from above
# Update DB_PASSWORD with your PostgreSQL password

# Create admin user
npm run setup create-admin admin@example.com admin123

# Start backend
npm run dev
```

**✓ Backend running at http://localhost:3000**

### Step 3: Web App Setup (4 minutes)

Open a new terminal:

```bash
# Install dependencies
cd web
npm install

# Copy environment file
cp .env.example .env

# Start web app
npm start
```

**✓ Web app running at http://localhost:3001**

### Step 4: Login & Add Client (3 minutes)

1. Open browser to http://localhost:3001
2. Login with:
   - Email: `admin@example.com`
   - Password: `admin123`
3. Click "Manage Clients"
4. Click "Add Client"
5. Fill in form with your AWS credentials:
   - Client Name: "My First Client"
   - AWS Access Key ID: (your AWS key)
   - AWS Secret Access Key: (your AWS secret)
   - Region: us-east-1
6. Click "Add Client"

### Step 5: View AWS Resources (1 minute)

1. Go back to Dashboard
2. Click "View Resources" on your client
3. See your EC2 instances, S3 buckets, etc.
4. Try starting/stopping an EC2 instance

## Verification Checklist

- [ ] Backend responds at http://localhost:3000/health
- [ ] Web app loads at http://localhost:3001
- [ ] Can login successfully
- [ ] Can add a client
- [ ] Can view AWS resources
- [ ] Can start/stop EC2 instances

## Common Issues & Fixes

### "Cannot connect to database"
**Fix**: Check PostgreSQL is running and credentials in `.env` are correct

### "Port 3000 already in use"
**Fix**: Change PORT in backend `.env` to 3001, and update web `.env` accordingly

### "AWS credentials are invalid"
**Fix**: Double-check your AWS Access Key ID and Secret Access Key

### "Permission denied on AWS operation"
**Fix**: Ensure your AWS IAM user has the necessary permissions (EC2, S3, RDS read/write)

## Next Steps

1. **Add more clients**: Repeat Step 4 for each AWS account you manage
2. **Explore features**: Try different AWS services (EC2, S3, RDS)
3. **Mobile app**: Follow mobile setup in main README.md
4. **Security**: Change default admin password
5. **Production**: See deployment guide in README.md

## Need Help?

- Check the full README.md for detailed documentation
- Review error messages in terminal
- Check browser console for frontend errors
- Verify all environment variables are set correctly

## Pro Tips

1. **Keep terminals open**: Backend and frontend need to run simultaneously
2. **Use environment variables**: Never hardcode secrets
3. **Test with one client first**: Make sure everything works before adding more
4. **Check AWS permissions**: Ensure your IAM user has the right permissions
5. **Regular backups**: Backup your PostgreSQL database regularly

---

**You're all set! Start managing your AWS resources.**
