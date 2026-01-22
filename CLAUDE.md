# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated**: 2026-01-22 (Phases 1-5 Complete)

## Current Sprint

- **Goal**: AWS Centralized Management Application - Complete billing system with alerts and forecasting
- **Progress**: 100% ✅ Phases 1-5 COMPLETE

## This Session (2026-01-22) - Phases 4 & 5 Implementation

✅ **Completed**:

### Phase 4: Budget Alerts System
- ✅ Email notification service with Nodemailer + Handlebars templates
- ✅ 3 professional HTML email templates (budget alert, over-budget, daily summary)
- ✅ Budget alerts database migration (003_add_budget_alerts_table.sql)
- ✅ BudgetAlert model with CRUD operations and duplicate prevention
- ✅ Budget alerts orchestration service (threshold detection, email triggering)
- ✅ Cron jobs service (hourly alerts, daily cost sync, weekly cleanup)
- ✅ Budget alerts API routes (5 endpoints)
- ✅ Email service integration with SMTP verification

### Phase 5: Reports & Export with Cost Forecasting
- ✅ CSV export service with 8 export functions (papaparse)
  - Billing records, cost breakdowns, daily costs, top drivers
  - Budgets, resource assignments, alerts, monthly reports
- ✅ PDF export service with professional invoice generation (PDFKit)
  - Monthly invoices with service breakdown tables
  - Cost summary reports with budget comparison
- ✅ Advanced forecasting service with 4 algorithms:
  - Linear extrapolation (simple daily average)
  - 7-day moving average (smoothed)
  - Exponential smoothing (alpha=0.3, weighted recent data)
  - Historical trend analysis (growth rate calculation)
  - Comprehensive forecast with consensus averaging
  - Automatic trend detection and confidence scoring
- ✅ Export routes with 12 new API endpoints
- ✅ Fixed TypeScript compilation errors (is_active property, PDFKit fillColor)
- ✅ Git repository created and pushed to GitHub

### Git Repository
- **Repository**: https://github.com/Lalatenduswain/AWS-Centralized-Management-Application
- **Latest Commit**: 6856ae4 - Add Phase 5: Reports & Export with Cost Forecasting
- **Status**: All changes committed and pushed

📦 **Files Created/Modified in Phases 4-5**: 16 files
- **Phase 4 Backend**:
  - `backend/src/services/email.service.ts` (270 lines)
  - `backend/src/services/budget-alerts.service.ts` (210 lines)
  - `backend/src/services/cron-jobs.service.ts` (200 lines)
  - `backend/src/models/BudgetAlert.ts` (180 lines)
  - `backend/src/routes/alerts.routes.ts` (170 lines)
  - `backend/migrations/003_add_budget_alerts_table.sql`
  - `backend/src/templates/emails/budget-alert.hbs`
  - `backend/src/templates/emails/over-budget-alert.hbs`
  - `backend/src/templates/emails/daily-cost-summary.hbs`

- **Phase 5 Backend**:
  - `backend/src/services/csv-export.service.ts` (234 lines)
  - `backend/src/services/pdf-export.service.ts` (216 lines)
  - `backend/src/services/forecasting.service.ts` (252 lines)
  - `backend/src/routes/exports.routes.ts` (384 lines)

- **Modified**:
  - `backend/src/server.ts` (integrated cron jobs, email service, export routes)
  - `backend/.env.example` (added email configuration)
  - `backend/package.json` (added nodemailer, handlebars, node-cron, papaparse, pdfkit)

🚧 **Current State**:
- Backend fully implemented with all Phase 1-5 features
- TypeScript compilation successful (0 errors)
- Code pushed to GitHub
- Dependencies installed for Phases 4-5
- Email service configured but requires SMTP credentials
- All API endpoints documented in server startup logs

⏭️ **Immediate Next Steps**:

### Option 1: Frontend Integration (Recommended)
1. Add export buttons to billing dashboard
   - CSV export buttons for all data types
   - PDF download buttons for invoices and summaries
2. Create cost forecasting display component
   - Show all 4 forecasting methods
   - Display consensus average
   - Visualize forecast trends with charts
3. Add export history/download center page

### Option 2: Testing & Verification
1. Configure email service (SMTP credentials in .env)
2. Test all 12 export endpoints with sample data
3. Verify forecasting algorithms with real billing data
4. Test budget alerts end-to-end (manual trigger + cron)
5. Generate sample PDFs and verify formatting

### Option 3: Deployment
1. Set up production environment
2. Deploy backend to cloud (AWS EC2/ECS, Heroku, DigitalOcean)
3. Deploy web frontend (S3+CloudFront, Netlify, Vercel)
4. Configure production database (AWS RDS)
5. Set up SSL certificates and domain

### Option 4: Mobile App
1. Start React Native project
2. Port billing dashboard to mobile
3. Add export functionality to mobile app
4. Build Android APK and iOS IPA

⚠️ **Configuration Required**:
- Email service needs SMTP credentials in `.env`:
  ```
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASS=your-app-specific-password
  EMAIL_FROM=AWS Centralized Management <your-email@gmail.com>
  ENABLE_CRON_JOBS=true
  ```

## Project Overview

AWS Centralized Management Application - A cross-platform (Web, iOS, Android) application for managing multiple AWS client accounts with per-user billing, budget alerts, cost forecasting, and comprehensive reporting.

## Technology Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Web Frontend**: React, TypeScript, React Router, Axios
- **Mobile App**: React Native, React Navigation
- **Security**: JWT authentication, bcrypt password hashing, AES-256-GCM encryption
- **AWS Integration**: AWS SDK for JavaScript v3 (EC2, S3, RDS, Cost Explorer)
- **Email**: Nodemailer with Handlebars templates
- **Export**: Papaparse (CSV), PDFKit (PDF)
- **Scheduling**: node-cron for automated jobs

## Development Commands

### Backend
```bash
cd backend
npm install           # Install dependencies
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run setup        # Run setup utilities
```

### Web
```bash
cd web
npm install          # Install dependencies
npm start            # Start development server (port 3001)
npm run build        # Build for production
```

### Mobile
```bash
cd mobile
npm install          # Install dependencies
npm run android      # Run on Android
npm run ios          # Run on iOS
```

## API Endpoints

### Phase 1-3: Core Features
**Authentication**: POST /api/auth/register, POST /api/auth/login

**Clients**: GET/POST/PUT/DELETE /api/clients

**AWS Resources**: GET /api/aws/:clientId/{ec2,s3,rds,costs}

**Billing**: GET /api/billing/user/:userId/{costs,summary,breakdown,trend,forecast}

**Budgets**: GET/POST/PUT/DELETE /api/budgets

**Resource Assignments**: GET/POST/PUT/DELETE /api/resource-assignments

### Phase 4: Budget Alerts
- GET /api/alerts/user/:userId - Get user alerts
- GET /api/alerts/budget/:budgetId - Get alerts for budget
- GET /api/alerts/statistics - Alert statistics
- POST /api/alerts/check - Manual alert check (testing)
- POST /api/alerts/test-email - Test email configuration

### Phase 5: Reports & Export
**CSV Exports**:
- GET /api/exports/billing-records/csv
- GET /api/exports/cost-breakdown/csv
- GET /api/exports/daily-costs/csv
- GET /api/exports/top-drivers/csv
- GET /api/exports/budgets/csv
- GET /api/exports/assignments/csv
- GET /api/exports/alerts/csv
- GET /api/exports/monthly-report/csv

**PDF Generation**:
- GET /api/exports/monthly-invoice/pdf
- GET /api/exports/cost-summary/pdf

**Cost Forecasting**:
- GET /api/exports/forecast/comprehensive - All 4 methods + consensus
- GET /api/exports/forecast/:method - Specific method (linear|moving-average|exponential|historical)

## Database Schema

**Core Tables** (Phase 1):
- `users` - User authentication
- `clients` - AWS client accounts with encrypted credentials
- `activity_logs` - Audit trail

**Billing Tables** (Phase 1):
- `user_resource_assignments` - Link resources to users
- `user_budgets` - Monthly spending limits and thresholds
- `billing_records` - Daily cost tracking per resource

**Alerts Table** (Phase 4):
- `budget_alerts` - Alert history with email tracking

## Cron Jobs

Automated scheduled tasks:
- **Budget alerts check**: Every hour at :00
- **Daily cost sync**: Daily at 1:00 AM
- **Data cleanup**: Weekly on Sunday at 2:00 AM

Managed by `backend/src/services/cron-jobs.service.ts`

## Forecasting Algorithms

1. **Linear Extrapolation**: Simple daily average projection
   - Uses current month's daily average
   - Projects to next month based on days in month

2. **Moving Average**: 7-day smoothed window
   - Averages last 7 days of costs
   - Reduces impact of daily fluctuations

3. **Exponential Smoothing**: Weighted recent data (alpha=0.3)
   - Gives more weight to recent costs
   - Adapts faster to trend changes

4. **Historical Trend**: Growth rate analysis
   - Analyzes last 6 months of data
   - Calculates month-over-month growth
   - Projects based on historical pattern

5. **Comprehensive Forecast**: Consensus + Recommendation
   - Runs all 4 methods in parallel
   - Calculates consensus average
   - Recommends method with highest confidence and most data

Each forecast includes:
- Forecasted cost for next month
- Confidence level (low/medium/high)
- Trend direction (increasing/decreasing/stable)
- Daily average
- Number of data points used

## Email Templates

Professional HTML templates with responsive design:
1. **Budget Alert** (threshold warning)
   - Purple gradient header
   - Progress bars with color coding
   - 4-card stats grid
   - Actionable recommendations

2. **Over Budget Alert** (critical warning)
   - Red gradient header
   - Large overage amount
   - Emergency action checklist

3. **Daily Cost Summary** (routine report)
   - Daily/MTD/Average metrics
   - Top services cost table
   - Professional branding

## Security Best Practices

1. **Never commit** `.env` files or encryption keys
2. **Rotate credentials** regularly
3. **Use strong passwords** for user accounts
4. **Keep dependencies updated** for security patches
5. **Validate input** on both frontend and backend
6. **Log sensitive operations** for audit purposes
7. **Email credentials** use app-specific passwords, not account passwords

## Troubleshooting

### Common Issues

1. **Email service unavailable**: Check SMTP credentials in .env
2. **Cron jobs not running**: Set ENABLE_CRON_JOBS=true in .env
3. **TypeScript errors**: Run `npm run build` to check compilation
4. **Database connection fails**: Check PostgreSQL is running
5. **JWT errors**: Verify JWT_SECRET is set in .env
6. **Export errors**: Ensure billing data exists for user/period

### Development Tips

- Use `POST /api/alerts/test-email` to verify email configuration
- Use `POST /api/alerts/check` to manually trigger budget checks
- Check cron job status in server startup logs
- Monitor console for scheduled job execution
- Test exports with different date ranges

## Git Workflow

Repository: https://github.com/Lalatenduswain/AWS-Centralized-Management-Application

Recent commits:
```
6856ae4 - Add Phase 5: Reports & Export with Cost Forecasting
1f3dd27 - Phase 4: Budget Alerts System - Complete
399d045 - Phase 3: User Billing Dashboard UI - Complete
e323140 - Phase 2: Backend API for Billing - Complete
e861768 - Phase 1 Complete: Billing database schema and models
```

## Next Development Phase

**Recommended: Frontend Integration for Phase 5**

Add to web dashboard:
1. Export buttons on billing pages
2. Cost forecasting visualization
3. Download center for reports
4. Export history/audit trail

See "Immediate Next Steps" section above for detailed tasks.

---

**For detailed setup instructions, see README.md and SETUP_GUIDE.md**
