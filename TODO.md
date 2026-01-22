# TODO List - AWS Centralized Management Application

**Last Updated**: 2026-01-22

---

## 🚀 Current Sprint: Per-User Billing & Cost Management

**Goal**: Implement comprehensive billing tracking so each user can see their AWS costs
**Timeline**: 4 weeks (Weeks 1-4)
**Priority**: P1 🔥 High Value

---

## Phase 1: Database Schema for Billing (Week 1)

### 1.1 Create Database Tables
- [ ] **user_resource_assignments** table
  ```sql
  - Links AWS resources to specific users
  - Tracks resource_type (ec2, s3, rds)
  - Stores resource_id and cost_center
  ```
- [ ] **user_budgets** table
  ```sql
  - Monthly spending limit per user
  - Alert threshold (e.g., 80%)
  - Created/updated timestamps
  ```
- [ ] **billing_records** table
  ```sql
  - Daily cost tracking per user
  - Service breakdown (EC2, S3, RDS)
  - Usage quantities and costs
  - Billing period (YYYY-MM)
  ```

### 1.2 Database Migration
- [ ] Create migration script `002_add_billing_tables.sql`
- [ ] Test migration on development database
- [ ] Add indexes for performance
- [ ] Update schema documentation

**Estimated Time**: 2-3 days

---

## Phase 2: Backend API for Billing (Week 1-2)

### 2.1 Billing Service (`backend/src/services/billing.service.ts`)
- [ ] Integrate AWS Cost Explorer API
- [ ] Fetch daily costs by resource
- [ ] Aggregate costs by user
- [ ] Calculate cost breakdowns by service
- [ ] Cache cost data (refresh daily)

### 2.2 Resource Assignment API
- [ ] **POST** `/api/billing/assign-resource`
  - Assign resource to user
  - Validate resource exists
  - Log assignment
- [ ] **GET** `/api/billing/user/:userId/resources`
  - List all resources assigned to user
- [ ] **DELETE** `/api/billing/unassign/:assignmentId`
  - Remove resource assignment

### 2.3 Budget Management API
- [ ] **POST** `/api/billing/budgets`
  - Set monthly budget for user
  - Set alert threshold
- [ ] **GET** `/api/billing/budgets/:userId`
  - Get user's budget settings
- [ ] **PUT** `/api/billing/budgets/:budgetId`
  - Update budget limit

### 2.4 Billing Reports API
- [ ] **GET** `/api/billing/user/:userId/costs`
  - Query params: startDate, endDate
  - Return total costs
  - Breakdown by service
  - Daily trend data
- [ ] **GET** `/api/billing/user/:userId/summary`
  - Current month costs
  - Budget vs actual
  - Remaining budget
  - Top 5 cost drivers
- [ ] **GET** `/api/billing/all-users`
  - Admin endpoint
  - All users' costs summary
  - Total organization spend

### 2.5 Models
- [ ] Create `UserBudget` model
- [ ] Create `BillingRecord` model
- [ ] Create `ResourceAssignment` model

**Estimated Time**: 5-7 days

---

## Phase 3: User Billing Dashboard UI (Week 2-3)

### 3.1 Billing Dashboard Page (`web/src/pages/BillingDashboard.tsx`)
- [ ] Create billing dashboard route
- [ ] Add to navigation menu
- [ ] Layout with cards and charts

### 3.2 Dashboard Components
- [ ] **Cost Summary Card**
  ```
  Total This Month: $850.00
  Budget: $1,000.00
  Remaining: $150.00 (15%)
  Status: ✅ Under Budget
  ```
- [ ] **Cost Breakdown Chart**
  - Pie chart: Costs by service
  - EC2, S3, RDS, Lambda, etc.
  - Interactive tooltips
- [ ] **Daily Spending Trend**
  - Line chart: Daily costs
  - Last 30 days
  - Forecast line
- [ ] **Resource List**
  - Table of assigned resources
  - Resource type, ID, daily cost
  - Unassign button

### 3.3 Budget Management UI
- [ ] Budget settings modal
- [ ] Set monthly limit form
- [ ] Alert threshold slider (0-100%)
- [ ] Save budget settings

### 3.4 Cost Details View
- [ ] Detailed cost table
- [ ] Filter by service, date range
- [ ] Sort by cost (high to low)
- [ ] Search resources

### 3.5 Charts & Visualizations
- [ ] Install chart library (Chart.js or Recharts)
- [ ] Create reusable chart components
- [ ] Add loading states
- [ ] Add error handling

**Estimated Time**: 5-7 days

---

## Phase 4: Budget Alerts System (Week 3)

### 4.1 Email Notification Service
- [ ] Install nodemailer or SendGrid
- [ ] Create email templates
- [ ] Budget alert email template
- [ ] Daily digest email template

### 4.2 Alert Logic
- [ ] **Daily Cost Tracking Job**
  - Cron job runs daily at midnight
  - Fetch yesterday's costs from AWS
  - Update billing_records table
  - Check all user budgets
- [ ] **Budget Threshold Check**
  - Calculate % of budget used
  - If > threshold, send alert
  - Mark alert as sent (don't spam)
- [ ] **Budget Exceeded Alert**
  - Send urgent notification
  - Notify admin as well

### 4.3 Alert Settings
- [ ] User preferences for alerts
- [ ] Enable/disable email alerts
- [ ] Set custom threshold
- [ ] Alert frequency (daily, weekly)

### 4.4 In-App Notifications
- [ ] Notification bell icon in header
- [ ] Notification dropdown
- [ ] Mark as read/unread
- [ ] Store notifications in database

**Estimated Time**: 3-4 days

---

## Phase 5: Reports & Export (Week 4)

### 5.1 CSV Export
- [ ] Export user costs to CSV
- [ ] Export all users (admin only)
- [ ] Include metadata (date range, filters)
- [ ] Generate download link

### 5.2 PDF Invoice Generation
- [ ] Install PDF library (PDFKit or jsPDF)
- [ ] Create invoice template
- [ ] Company header/logo
- [ ] Itemized costs table
- [ ] Summary section
- [ ] Download/email PDF

### 5.3 Cost Forecasting
- [ ] **Forecasting Algorithm**
  - Linear regression on historical data
  - Predict next 30 days
  - Confidence intervals
- [ ] Display forecast on chart
- [ ] "At this rate, you'll spend $X this month"

### 5.4 Advanced Analytics
- [ ] Month-over-month comparison
- [ ] Cost anomaly detection
- [ ] Idle resource recommendations
- [ ] Cost optimization tips

**Estimated Time**: 4-5 days

---

## Testing & QA (Throughout)

### 5.1 Backend Testing
- [ ] Test AWS Cost Explorer integration
- [ ] Test resource assignment API
- [ ] Test budget calculations
- [ ] Test alert triggers

### 5.2 Frontend Testing
- [ ] Test dashboard rendering
- [ ] Test charts with various data
- [ ] Test budget settings
- [ ] Test export functions

### 5.3 Integration Testing
- [ ] End-to-end user flow
- [ ] Assign resource → View costs → Set budget → Receive alert
- [ ] Test with multiple users
- [ ] Test edge cases (no costs, zero budget)

---

## Documentation

- [ ] Update README.md with billing features
- [ ] Add billing API docs
- [ ] Create user guide for billing
- [ ] Add screenshots to documentation
- [ ] Update CLAUDE.md

---

## Future Enhancements (Post-MVP)

### Advanced Billing Features
- [ ] Cost allocation tags
- [ ] Shared resource cost splitting
- [ ] Department/team budgets
- [ ] Chargeback reports
- [ ] Reserved instance tracking
- [ ] Savings plan recommendations

### Enterprise Features
- [ ] Multi-currency support
- [ ] Custom billing periods
- [ ] Invoice templates
- [ ] Payment integration
- [ ] Tax calculations

---

## Priority 2: Role-Based Access Control (Next Sprint)

**Timeline**: Week 5-7

- [ ] Design roles schema
- [ ] Implement permission system
- [ ] Create role management UI
- [ ] Add role-based route protection
- [ ] Migrate existing users to roles

---

## Priority 3: Advanced AWS Services (Week 8-10)

- [ ] Lambda function management
- [ ] CloudWatch metrics integration
- [ ] VPC & networking viewer
- [ ] IAM user management

---

## Technical Debt & Improvements

- [ ] Add unit tests for critical functions
- [ ] Set up CI/CD pipeline
- [ ] Add API rate limiting
- [ ] Implement request caching
- [ ] Optimize database queries
- [ ] Add error tracking (Sentry)
- [ ] Set up application monitoring

---

## Notes

- **AWS Cost Explorer API**: Has daily data granularity, not real-time
- **Cost Data Delay**: AWS costs appear 24-48 hours after usage
- **Testing**: Use AWS Cost Explorer sandbox for testing
- **Budgets**: Consider grace period before sending alerts
- **Performance**: Cache cost data, update daily via cron

---

**Ready to start? Let's implement Phase 1! 🚀**
