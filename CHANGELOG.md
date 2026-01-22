# Changelog

All notable changes to the AWS Centralized Management Application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Mobile React Native application
- Advanced AWS service support (Lambda, CloudWatch, VPC)
- Role-based access control (RBAC)
- Automated testing suite
- CI/CD pipeline

---

## [0.5.0] - 2026-01-22

### Added - Phase 5: Reports & Export with Cost Forecasting

#### Backend
- **CSV Export Service** with 8 export functions
  - Billing records export
  - Cost breakdown export
  - Daily costs export
  - Top cost drivers export
  - Budgets export
  - Resource assignments export
  - Budget alerts export
  - Comprehensive monthly report
- **PDF Export Service** with professional styling
  - Monthly invoice generation
  - Cost summary reports
  - Service breakdown tables
  - Budget comparison sections
- **Advanced Forecasting Service** with 4 algorithms
  - Linear extrapolation
  - 7-day moving average
  - Exponential smoothing (alpha=0.3)
  - Historical trend analysis (6-month lookback)
- **Comprehensive Forecast API**
  - Consensus calculation (average of all methods)
  - Recommended method selection
  - Confidence scoring (low/medium/high)
  - Trend detection (increasing/decreasing/stable)
- **12 New API Endpoints** for exports and forecasting

#### Frontend
- **Export Dropdown Menu** with all export options
- **One-click file downloads** with automatic naming
- **Comprehensive Forecast Display** showing:
  - Consensus and recommended forecasts
  - All 4 forecasting method cards
  - Method details (confidence, trend, data points)
  - Forecast comparison bar chart
- **Export loading states** and error handling
- **Blob download implementation** for files
- **300+ lines of new CSS** for styling

#### Technical
- Added papaparse library for CSV generation
- Added PDFKit library for PDF creation
- Updated API service with exportsAPI and forecastingAPI
- Fixed TypeScript is_active property calculation
- Fixed PDFKit fillColor syntax error

---

## [0.4.0] - 2026-01-22

### Added - Phase 4: Budget Alerts System

#### Backend
- **Email Notification Service**
  - Nodemailer integration with SMTP support
  - Handlebars template engine
  - Template caching for performance
  - SMTP connection verification
- **3 Professional HTML Email Templates**
  - Budget threshold alert (warning)
  - Over budget alert (critical)
  - Daily cost summary
  - Responsive design with gradients
  - Color-coded progress bars
- **Budget Alerts Database**
  - budget_alerts table with alert history
  - 5 performance indexes
  - Duplicate prevention function (24-hour cooldown)
  - Helper functions for alert checking
- **Budget Alerts Service**
  - Automatic threshold detection
  - Email sending with error handling
  - Alert history tracking
  - Statistics endpoint
- **Cron Jobs Service**
  - Hourly budget alerts check (at :00)
  - Daily cost sync (1:00 AM)
  - Weekly data cleanup (Sunday 2:00 AM)
  - Graceful shutdown handling
  - Environment variable control
- **5 New API Endpoints** for alert management

#### Technical
- Fixed TypeScript interface mismatches
- Fixed node-cron import syntax
- Added email service graceful degradation
- Updated server.ts with service initialization
- Added email configuration to .env.example

---

## [0.3.0] - 2026-01-22

### Added - Phase 3: User Billing Dashboard UI

#### Frontend
- **Interactive Billing Dashboard**
  - Real-time cost summary cards
  - Pie chart for service breakdown (Recharts)
  - Line chart for daily cost trends
  - Top cost drivers table
  - Budget status with progress bar
  - Responsive grid layout
- **4 Summary Cards**
  - Current month cost
  - Budget status with percentage
  - Next month forecast
  - Daily average spending
- **Cost Visualization**
  - Interactive charts with tooltips
  - Color-coded budget indicators
  - Animated transitions
- **Budget Details Section**
  - Monthly limit display
  - Current spending
  - Remaining budget
  - Alert threshold
  - Days left in month

#### Technical
- React 18 with TypeScript
- Recharts for data visualization
- Custom CSS with animations
- Responsive breakpoints for mobile
- API integration with error handling

---

## [0.2.0] - 2026-01-22

### Added - Phase 2: Backend API for Billing

#### Backend
- **Billing API Endpoints** (9 endpoints)
  - Get user costs with date filtering
  - Get cost summary for current month
  - Get cost breakdown by service
  - Get daily cost trend
  - Get top cost drivers
  - Get monthly trend (6 months)
  - Get cost forecast
  - Sync costs from AWS Cost Explorer
  - Get all users billing summary (admin)
- **Budget Management API** (6 endpoints)
  - Create budget
  - Get user budgets
  - Get active budget
  - Get budget status with current spending
  - Update budget
  - Delete budget
- **Resource Assignment API** (6 endpoints)
  - Create assignment
  - Get user assignments
  - Get client assignments
  - Get grouped assignments
  - Update assignment
  - Delete assignment
  - Bulk create assignments
- **AWS Cost Explorer Integration**
  - Fetch daily costs
  - Aggregate by service
  - Store in billing_records table

#### Technical
- Node.js + Express + TypeScript
- PostgreSQL with pg library
- AWS SDK v3
- JWT authentication middleware
- Error handling middleware
- Input validation

---

## [0.1.0] - 2026-01-22

### Added - Phase 1: Database Schema

#### Database
- **Core Tables**
  - users (authentication)
  - clients (AWS accounts with encrypted credentials)
  - activity_logs (audit trail)
- **Billing Tables**
  - user_resource_assignments (link resources to users)
  - user_budgets (monthly spending limits)
  - billing_records (daily cost tracking)
- **15+ Performance Indexes**
- **3 Helper Functions**
  - get_current_billing_period()
  - get_user_cost_for_period()
  - is_user_over_budget()
- **Triggers**
  - Auto-update updated_at timestamps
- **Security**
  - AES-256-GCM encryption for AWS credentials
  - Unique IV per credential
  - Bcrypt password hashing

#### Technical
- PostgreSQL 14+
- Proper constraints and foreign keys
- Optimized query patterns
- JSONB for flexible data storage

---

## [0.0.1] - 2026-01-20

### Added - Initial Project Setup

- Project structure created
- Technology stack selected
- Development environment configured
- Git repository initialized
- Basic documentation created

---

## Version History Summary

- **v0.5.0** (2026-01-22): Reports & Export with Forecasting
- **v0.4.0** (2026-01-22): Budget Alerts System
- **v0.3.0** (2026-01-22): User Billing Dashboard UI
- **v0.2.0** (2026-01-22): Backend API for Billing
- **v0.1.0** (2026-01-22): Database Schema
- **v0.0.1** (2026-01-20): Initial Setup

---

**Repository**: https://github.com/Lalatenduswain/AWS-Centralized-Management-Application

**For upcoming changes, see**: [TODO.md](TODO.md)
