# Technology Stack - AWS Centralized Management Application

**Last Updated**: 2026-01-22

---

## 📦 Current Technology Stack (Already Implemented)

### Backend Stack

#### Core Framework
```
Node.js v18+              - JavaScript runtime
Express v4.18             - Web framework
TypeScript v5.3           - Type-safe JavaScript
```

#### Database
```
PostgreSQL v14+           - Relational database
pg v8.11                  - PostgreSQL client for Node.js
```

#### Authentication & Security
```
jsonwebtoken v9.0         - JWT token generation/verification
bcrypt v5.1               - Password hashing (10 rounds)
helmet v7.1               - Security HTTP headers
cors v2.8                 - Cross-Origin Resource Sharing
express-validator v7.0    - Input validation
Node.js crypto (built-in) - AES-256-GCM encryption
```

#### AWS Integration
```
@aws-sdk/client-ec2 v3.478           - EC2 instance management
@aws-sdk/client-s3 v3.478            - S3 bucket operations
@aws-sdk/client-rds v3.478           - RDS database management
@aws-sdk/client-cost-explorer v3.478 - Cost & usage data
```

#### Development Tools
```
nodemon v3.0              - Auto-restart on file changes
ts-node v10.9             - Run TypeScript directly
dotenv v16.3              - Environment variable loading
```

---

### Web Frontend Stack

#### Core Framework
```
React v18.2               - UI library
TypeScript v5.3           - Type safety
react-scripts v5.0        - Build tooling (Create React App)
```

#### Routing & State
```
react-router-dom v6.20    - Client-side routing
React Context API         - State management (built-in)
```

#### Data Fetching
```
axios v1.6                - HTTP client
@tanstack/react-query v5  - Server state management & caching
```

#### Styling
```
Custom CSS                - Plain CSS (no framework)
```

---

### Mobile Stack

#### Core Framework
```
React Native v0.72        - Mobile framework
TypeScript v5.3           - Type safety
```

#### Navigation & Storage
```
@react-navigation/native v6.1  - Navigation
@react-navigation/stack v6.3   - Stack navigator
@react-native-async-storage v1 - Local storage
react-native-keychain v8.1     - Secure credential storage
```

#### UI & Gestures
```
react-native-screens v3         - Native screen primitives
react-native-safe-area-context v4 - Safe area handling
react-native-gesture-handler v2    - Gesture system
```

---

## 🆕 New Technologies for Billing Feature

### Phase 1-2: Backend Additions

#### Cost Analytics & Processing
```
📦 aws-sdk/client-cost-explorer (already installed)
   - Fetch daily/monthly cost data
   - Query costs by service, resource, tag
   - Get cost forecasts from AWS

📦 node-cron v3.0 (NEW)
   - Schedule daily cost sync jobs
   - Run midnight cost calculations
   - Automated budget checks
   Why: Simple, reliable cron for Node.js

Alternative considered:
   - Bull/BullMQ (too heavy for basic scheduling)
```

#### Email Notifications
```
📦 nodemailer v6.9 (NEW)
   - Send budget alert emails
   - Send monthly invoice emails
   - SMTP or SendGrid integration
   Why: Most popular, well-maintained

Alternative options:
   - @sendgrid/mail - If using SendGrid specifically
   - AWS SES SDK - If using AWS Simple Email Service
```

#### Template Engine (for emails)
```
📦 handlebars v4.7 (NEW)
   - HTML email templates
   - Dynamic data insertion
   - Reusable email layouts
   Why: Simple, logic-less templates

Alternative:
   - ejs - Embedded JavaScript templates
   - pug - Minimal syntax templates
```

---

### Phase 3-4: Frontend Additions

#### Data Visualization
```
📦 recharts v2.10 (NEW) ⭐ RECOMMENDED
   - Cost breakdown pie charts
   - Daily spending line charts
   - Budget vs actual bar charts
   - React-native integration
   Why: Best React integration, responsive, TypeScript support

Alternative options:
   - chart.js + react-chartjs-2 - More features, larger bundle
   - victory-native - Better for React Native
   - nivo - Beautiful, but heavier
```

#### Date/Time Handling
```
📦 date-fns v2.30 (NEW)
   - Date range selection
   - Format dates for display
   - Calculate billing periods
   Why: Lightweight, tree-shakeable, TypeScript support

Alternative:
   - moment.js - Older, larger bundle (not recommended)
   - dayjs - Smaller than moment, similar API
```

#### Table & Data Grid
```
📦 react-table v8 (NEW) - Optional
   - Advanced billing data tables
   - Sorting, filtering, pagination
   - CSV export helper
   Why: Headless, flexible, powerful

Alternative:
   - ag-grid-react - Feature-rich but commercial license
   - Material-UI DataGrid - Tied to Material-UI
```

---

### Phase 5: Reports & Export

#### PDF Generation
```
📦 jspdf v2.5 (NEW)
   - Generate PDF invoices
   - Client-side PDF creation
   - Add charts/tables to PDF
   Why: Works in browser and Node.js

Alternative:
   - pdfkit - Node.js only, more features
   - puppeteer - Heavyweight, renders HTML to PDF
   - @react-pdf/renderer - React components to PDF
```

#### CSV Export
```
📦 papaparse v5.4 (NEW)
   - CSV parsing and generation
   - Handle large datasets
   - Browser and Node.js compatible
   Why: Fast, reliable, well-tested

Alternative:
   - csv-writer - Node.js only
   - json2csv - Simple but limited
```

#### Excel Export (Optional)
```
📦 xlsx v0.18 (OPTIONAL)
   - Generate Excel files (.xlsx)
   - Multiple sheets support
   - Formatting and formulas
   Why: Most popular Excel library for JavaScript
```

---

## 🔮 Future Technologies (Priority 2+)

### Role-Based Access Control (RBAC)
```
📦 casl v6 (FUTURE)
   - Permission management
   - Role definitions
   - UI authorization
   Why: Isomorphic, TypeScript support

Alternative:
   - accesscontrol - Simpler but less flexible
   - Custom implementation - Full control
```

### Real-Time Features
```
📦 socket.io v4 (FUTURE)
   - Live resource updates
   - Real-time notifications
   - WebSocket connections
   Why: Easy to use, fallback support

Alternative:
   - ws - Lightweight WebSocket library
   - Server-Sent Events (SSE) - Simpler, one-way
```

### Advanced Monitoring
```
📦 @sentry/node v7 (FUTURE)
   - Error tracking
   - Performance monitoring
   - User session replay
   Why: Industry standard

📦 pino v8 (FUTURE)
   - Structured logging
   - High-performance logger
   - JSON output
   Why: Fastest Node.js logger
```

### Task Queue
```
📦 bullmq v5 (FUTURE)
   - Background job processing
   - Retry logic
   - Job scheduling
   Why: Redis-based, reliable, scalable

Alternative:
   - agenda - MongoDB-based
   - bee-queue - Simpler, faster
```

### API Documentation
```
📦 swagger-ui-express v5 (FUTURE)
   - Auto-generated API docs
   - Interactive API testing
   - OpenAPI specification
   Why: Industry standard

Alternative:
   - redoc - Better looking, no try-it
   - apiDoc - Comment-based docs
```

---

## 📊 Technology Comparison Matrix

### Chart Libraries Comparison

| Library | Bundle Size | React Native | TypeScript | Learning Curve |
|---------|-------------|--------------|------------|----------------|
| **Recharts** ⭐ | 96 KB | ✅ Yes | ✅ Excellent | Easy |
| Chart.js | 182 KB | ❌ No | ⚠️ Good | Easy |
| Victory | 156 KB | ✅ Yes | ✅ Excellent | Medium |
| Nivo | 340 KB | ❌ No | ✅ Excellent | Hard |

**Winner: Recharts** - Best balance of features, size, and React Native support

---

### Email Libraries Comparison

| Library | Ease of Use | Features | Community | Cost |
|---------|-------------|----------|-----------|------|
| **Nodemailer** ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Huge | Free |
| SendGrid SDK | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Large | $15-190/mo |
| AWS SES | ⭐⭐⭐ | ⭐⭐⭐⭐ | Large | $0.10/1000 |
| Mailgun | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Medium | $35+/mo |

**Winner: Nodemailer** - Free, flexible, works with any SMTP provider

---

### PDF Generation Comparison

| Library | Browser | Node.js | File Size | Complexity |
|---------|---------|---------|-----------|------------|
| **jsPDF** ⭐ | ✅ | ✅ | Small | Low |
| PDFKit | ❌ | ✅ | Medium | Medium |
| Puppeteer | ❌ | ✅ | Large | High |
| @react-pdf | ✅ | ✅ | Medium | Medium |

**Winner: jsPDF** - Works everywhere, simple API, small bundle

---

## 🎯 Installation Commands

### For Per-User Billing Feature (Phase 1-5)

```bash
# Backend dependencies
cd backend
npm install node-cron@3.0.3
npm install nodemailer@6.9.7
npm install handlebars@4.7.8
npm install date-fns@2.30.0
npm install papaparse@5.4.1
npm install jspdf@2.5.1

# Dev dependencies
npm install --save-dev @types/node-cron@3.0.11
npm install --save-dev @types/nodemailer@6.4.14
npm install --save-dev @types/papaparse@5.3.14

# Web frontend dependencies
cd ../web
npm install recharts@2.10.3
npm install date-fns@2.30.0
npm install papaparse@5.4.1
npm install jspdf@2.5.1

# Optional: Advanced table features
npm install @tanstack/react-table@8.11.3
```

### Total Additional Packages: 8-10 packages
### Total Bundle Size Increase: ~400-500 KB (minified)

---

## 🔧 Configuration Files Needed

### 1. Cron Job Configuration
```typescript
// backend/src/config/cron.ts
import cron from 'node-cron';

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  await syncDailyCosts();
  await checkBudgetAlerts();
});
```

### 2. Email Configuration
```typescript
// backend/src/config/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

### 3. Environment Variables (.env additions)
```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=AWS Manager <noreply@yourcompany.com>

# Cron Jobs
ENABLE_DAILY_COST_SYNC=true
COST_SYNC_TIME=00:00

# AWS Cost Explorer
AWS_COST_LOOKBACK_DAYS=90
AWS_COST_CACHE_HOURS=24
```

---

## 🏗️ Architecture Patterns

### Backend Architecture
```
Controllers (Routes)
      ↓
Services (Business Logic)
      ↓
Models (Database)
      ↓
PostgreSQL
```

### Frontend Architecture
```
Pages (Routes)
      ↓
Components (UI)
      ↓
Services (API Calls)
      ↓
React Query (Cache)
      ↓
Backend API
```

---

## 🔐 Security Considerations

### Dependencies Security Audit
```bash
# Run before installation
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

### License Compliance
All selected packages use permissive licenses:
- ✅ MIT License: recharts, nodemailer, jsPDF, papaparse
- ✅ Apache 2.0: date-fns
- ✅ ISC License: node-cron

**No GPL or restrictive licenses!** Safe for commercial use.

---

## 📈 Performance Considerations

### Bundle Size Impact
```
Current Web Bundle: ~500 KB (minified)

After Billing Feature:
  + Recharts: ~96 KB
  + date-fns: ~15 KB (tree-shaken)
  + jsPDF: ~180 KB
  + papaparse: ~45 KB
  + React Table: ~30 KB (optional)
  ─────────────────────
  New Total: ~866 KB (minified)
  Gzipped: ~280 KB
```

**Still very reasonable!** Average web app is 2-3 MB.

### Database Performance
```sql
-- Indexes to add
CREATE INDEX idx_billing_records_user_period
  ON billing_records(user_id, billing_period);

CREATE INDEX idx_billing_records_date
  ON billing_records(recorded_at DESC);

CREATE INDEX idx_user_budgets_user
  ON user_budgets(user_id);
```

### Caching Strategy
```
Cost Data: Cache for 24 hours
User Budgets: Cache for 1 hour
Charts Data: Cache for 15 minutes
Real-time alerts: No cache
```

---

## 🎯 Why These Technologies?

### Criteria for Selection:
1. ✅ **TypeScript Support** - Type safety is essential
2. ✅ **Active Maintenance** - Regular updates and security patches
3. ✅ **Small Bundle Size** - Fast load times
4. ✅ **Good Documentation** - Easy for beginners
5. ✅ **Large Community** - Easy to find help
6. ✅ **Permissive License** - Commercial use allowed
7. ✅ **React/Node.js Compatible** - Fits our stack
8. ✅ **Zero Breaking Changes** - Stable APIs

### What We Avoided:
- ❌ Heavy frameworks (Angular, Vue)
- ❌ Deprecated libraries (Moment.js)
- ❌ Beta/Experimental packages
- ❌ GPL-licensed packages
- ❌ Packages with known security issues
- ❌ Abandoned projects (last update >2 years)

---

## 🚀 Quick Start

### Install All Billing Dependencies
```bash
# Run from project root
./scripts/install-billing-deps.sh

# Or manually:
cd backend && npm install node-cron nodemailer handlebars date-fns papaparse jspdf
cd ../web && npm install recharts date-fns papaparse jspdf
```

### Verify Installation
```bash
cd backend && npm list | grep -E "node-cron|nodemailer|handlebars"
cd ../web && npm list | grep -E "recharts|jspdf"
```

---

## 📚 Learning Resources

### For Billing Feature Development:

**Recharts (Charts)**
- 📖 Docs: https://recharts.org/
- 🎓 Tutorial: React + Recharts in 15 minutes
- 📊 Examples: 50+ chart examples in docs

**Nodemailer (Email)**
- 📖 Docs: https://nodemailer.com/
- 🎓 Tutorial: Sending emails in Node.js
- ✉️ Templates: HTML email templates

**jsPDF (PDF)**
- 📖 Docs: https://github.com/parallax/jsPDF
- 🎓 Tutorial: Generate invoices with jsPDF
- 📄 Examples: Invoice templates

**AWS Cost Explorer**
- 📖 AWS Docs: Cost Explorer API Guide
- 🎓 Tutorial: AWS Billing & Cost Management
- 💰 Pricing: First 100 requests/month free

---

## 💡 Summary

### Total New Dependencies: ~10 packages
### Total Size Increase: ~400 KB (minified, ~130 KB gzipped)
### All Free & Open Source: Yes ✅
### TypeScript Support: Excellent ✅
### Learning Curve: Easy to Medium ✅
### Production Ready: Yes ✅

**Perfect balance of features, performance, and simplicity!** 🎉

---

Want me to create an installation script? I can make a one-command installer that sets up all dependencies! 🚀
