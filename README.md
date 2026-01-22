# AWS Centralized Management Application

A comprehensive, full-stack application for managing multiple AWS client accounts with advanced billing tracking, budget alerts, cost forecasting, and automated reporting.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)

---

## 🚀 Features

### Core Functionality
- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- 🏢 **Multi-Client Management** - Manage multiple AWS accounts from one interface
- 🔒 **Credential Encryption** - AES-256-GCM encryption for AWS credentials at rest
- ☁️  **AWS Resource Management** - Control EC2, S3, RDS instances
- 💰 **Cost Tracking** - Daily cost tracking with AWS Cost Explorer integration

### Billing & Budgets (Phases 1-3)
- 📊 **Real-time Dashboards** - Interactive charts and visualizations
- 💳 **Budget Management** - Set monthly limits and track spending
- 📈 **Cost Analytics** - Breakdown by service, resource, and time period
- 🎯 **Resource Assignment** - Allocate AWS resources to specific users
- 📉 **Trend Analysis** - Historical cost trends and patterns

### Alerts & Notifications (Phase 4)
- 🔔 **Budget Alerts** - Automated threshold warnings via email
- 📧 **Professional Email Templates** - Beautiful HTML email notifications
- ⏰ **Scheduled Jobs** - Hourly budget checks, daily cost sync, weekly cleanup
- 📋 **Alert History** - Complete audit trail of all notifications
- 🚨 **Multi-level Alerts** - Info, warning, and critical alert levels

### Reports & Forecasting (Phase 5)
- 📄 **CSV Exports** - 8 types of data exports (billing, budgets, alerts, etc.)
- 🧾 **PDF Invoices** - Professional monthly invoices with service breakdowns
- 🔮 **Cost Forecasting** - 4 advanced algorithms:
  - Linear Extrapolation
  - 7-Day Moving Average
  - Exponential Smoothing
  - Historical Trend Analysis
- 📊 **Consensus Forecast** - Average of all methods for accuracy
- 🎨 **Visual Comparisons** - Charts comparing forecast methods

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Application                          │
│                   (React + TypeScript)                       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/REST API
                     │
┌────────────────────┴────────────────────────────────────────┐
│              Backend API Server                              │
│           (Node.js + Express + TypeScript)                   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │   Billing    │  │   Alerts     │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   AWS        │  │   Export     │  │   Forecast   │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │
┌────────────────────┴────────────────────────────────────────┐
│                 PostgreSQL Database                          │
│  - Users, Clients, Budgets, Billing Records, Alerts        │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Native pg library
- **Authentication**: JWT + bcrypt
- **Encryption**: AES-256-GCM (crypto)
- **AWS SDK**: AWS SDK for JavaScript v3
- **Email**: Nodemailer + Handlebars
- **Scheduling**: node-cron
- **Export**: Papaparse (CSV), PDFKit (PDF)

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Styling**: CSS3 with CSS Grid/Flexbox

### DevOps
- **Version Control**: Git
- **Package Manager**: npm
- **Build Tool**: TypeScript Compiler (tsc)
- **Code Quality**: ESLint, Prettier

---

## 📦 Project Structure

```
aws-centralized-management/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Database & environment config
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── templates/      # Email templates
│   │   └── server.ts       # Entry point
│   ├── migrations/         # Database migrations
│   ├── schema.sql          # Database schema
│   └── package.json
│
├── web/                    # React web application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API calls
│   │   └── App.tsx        # Root component
│   └── package.json
│
├── mobile/                 # React Native app (future)
│   └── ...
│
└── docs/                   # Documentation
    ├── README.md
    ├── INSTALLATION.md
    ├── API.md
    └── ...
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- PostgreSQL 14 or higher
- Git
- AWS account with IAM credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/Lalatenduswain/AWS-Centralized-Management-Application.git
cd AWS-Centralized-Management-Application

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration

# Create database and run migrations
createdb aws_central_mgmt
psql -d aws_central_mgmt -f schema.sql
psql -d aws_central_mgmt -f migrations/002_add_billing_tables.sql
psql -d aws_central_mgmt -f migrations/003_add_budget_alerts_table.sql

# Start backend
npm run dev

# Frontend setup (new terminal)
cd ../web
npm install
cp .env.example .env
# Edit .env with API URL

# Start frontend
npm start
```

Visit `http://localhost:3001` in your browser.

For detailed installation instructions, see [INSTALLATION.md](INSTALLATION.md).

---

## 📖 Documentation

- [Installation Guide](INSTALLATION.md) - Detailed setup instructions
- [API Reference](API.md) - Complete API documentation
- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [Testing Guide](TESTING.md) - Testing strategies
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [Contributing](CONTRIBUTING.md) - How to contribute
- [Security Policy](SECURITY.md) - Security guidelines
- [Changelog](CHANGELOG.md) - Version history

---

## 🔒 Security

- **Encryption**: AWS credentials encrypted at rest with AES-256-GCM
- **Authentication**: JWT tokens with secure password hashing (bcrypt)
- **HTTPS**: All API calls over HTTPS in production
- **Input Validation**: Server-side validation for all inputs
- **Audit Logging**: Complete activity logs for compliance
- **Least Privilege**: Minimal IAM permissions for AWS operations

See [SECURITY.md](SECURITY.md) for security policy and vulnerability reporting.

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and receive JWT

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Billing
- `GET /api/billing/user/:userId/summary` - Cost summary
- `GET /api/billing/user/:userId/breakdown` - Cost by service
- `GET /api/billing/user/:userId/trend` - Daily cost trend
- `GET /api/billing/user/:userId/forecast` - Cost forecast

### Exports (Phase 5)
- `GET /api/exports/billing-records/csv` - Export billing CSV
- `GET /api/exports/monthly-invoice/pdf` - Generate PDF invoice
- `GET /api/exports/forecast/comprehensive` - All forecasts

For complete API documentation, see [API.md](API.md).

---

## 🎨 Screenshots

*(Add screenshots here once deployed)*

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for details.

---

## 🙏 Acknowledgments

- Built with assistance from Claude Sonnet 4.5 (Anthropic)
- AWS SDK for cloud integration
- React and Node.js communities
- Open source contributors

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/Lalatenduswain/AWS-Centralized-Management-Application/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Lalatenduswain/AWS-Centralized-Management-Application/discussions)
- **Email**: [Your contact email]

---

## 🗺️ Roadmap

- [x] Phase 1: Database Schema
- [x] Phase 2: Backend API
- [x] Phase 3: Frontend Dashboard
- [x] Phase 4: Budget Alerts
- [x] Phase 5: Reports & Forecasting
- [ ] Phase 6: Mobile App
- [ ] Phase 7: Advanced AWS Services
- [ ] Phase 8: RBAC & Multi-tenant

See [TODO.md](TODO.md) for complete roadmap.

---

**Star ⭐ this repository if you find it helpful!**

---

Made with ❤️ using TypeScript, React, and Node.js
