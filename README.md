# AWS Centralized Management Application

A cross-platform application (Web, iOS, Android) for managing multiple AWS client accounts from a single interface. Built with JavaScript/TypeScript stack for ease of learning and development.

## Project Structure

```
aws-central-management/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── models/            # Data models (User, Client, ActivityLog)
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic (AWS, Encryption)
│   │   ├── middleware/        # Auth, error handling
│   │   ├── utils/             # Helper functions
│   │   └── server.ts          # Main server file
│   ├── schema.sql             # Database schema
│   └── package.json
├── web/                       # React web application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── contexts/          # Auth context
│   │   ├── services/          # API client
│   │   └── App.tsx            # Main app component
│   └── package.json
├── mobile/                    # React Native mobile app
│   ├── src/
│   │   ├── screens/           # Mobile screens
│   │   ├── services/          # API client
│   │   └── App.tsx            # Main app component
│   └── package.json
└── README.md                  # This file
```

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **AWS SDK v3** - AWS integration
- **Node.js crypto** - Credential encryption

### Web Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Query** - Data fetching

### Mobile App
- **React Native** - Mobile framework
- **React Navigation** - Mobile navigation
- **AsyncStorage** - Local storage
- **Axios** - HTTP client

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
3. **Git** - [Download](https://git-scm.com/downloads)

For mobile development (optional):
- **Android Studio** - For Android development
- **Xcode** - For iOS development (macOS only)

## Getting Started

### Step 1: Database Setup

1. Install and start PostgreSQL

2. Create a new database:
```bash
psql -U postgres
CREATE DATABASE aws_central_mgmt;
\q
```

3. Run the schema script:
```bash
cd backend
psql -U postgres -d aws_central_mgmt -f schema.sql
```

### Step 2: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Generate an encryption key:
```bash
npm run setup generate-key
```

5. Edit `.env` file with your configuration:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=aws_central_mgmt
DB_USER=postgres
DB_PASSWORD=your_database_password

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1h

ENCRYPTION_KEY=your_32_char_key_from_step_4

ALLOWED_ORIGINS=http://localhost:3001,http://localhost:19006
```

6. Create first admin user:
```bash
npm run setup create-admin admin@example.com yourpassword
```

7. Start the development server:
```bash
npm run dev
```

The backend should now be running at `http://localhost:3000`

Test the health endpoint:
```bash
curl http://localhost:3000/health
```

### Step 3: Web Application Setup

1. Open a new terminal and navigate to web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm start
```

The web app should open automatically at `http://localhost:3001`

### Step 4: Mobile Application Setup (Optional)

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Update API URL in `src/services/api.service.ts`:
```typescript
// For Android emulator:
const API_BASE_URL = 'http://10.0.2.2:3000/api';

// For iOS simulator:
const API_BASE_URL = 'http://localhost:3000/api';

// For physical device (use your computer's IP):
const API_BASE_URL = 'http://192.168.1.XXX:3000/api';
```

4. Run on Android:
```bash
npm run android
```

5. Run on iOS (macOS only):
```bash
npm run ios
```

## Usage Guide

### 1. Login/Register

- Open the web app at `http://localhost:3001`
- Use the credentials you created in Step 2.6, or register a new account
- After login, you'll be redirected to the dashboard

### 2. Add a Client

1. Go to "Clients" page
2. Click "Add Client" button
3. Fill in the form:
   - **Client Name**: Your client's name
   - **AWS Access Key ID**: AWS credentials
   - **AWS Secret Access Key**: AWS secret key
   - **Region**: AWS region (e.g., us-east-1)
   - **AWS Account ID** (optional)
   - **Notes** (optional)
4. Click "Add Client"

**IMPORTANT**: AWS credentials are encrypted before storage using AES-256-GCM encryption.

### 3. View AWS Resources

1. From the dashboard, click "View Resources" on a client card
2. Or go to Clients page and select a client
3. View tabs for:
   - **EC2 Instances**: Start/stop instances
   - **S3 Buckets**: List all buckets
   - **RDS Instances**: View database instances
   - **Costs**: View cost data (coming soon)

### 4. Manage EC2 Instances

- In the EC2 tab, you can:
  - View all instances with their current state
  - Start stopped instances
  - Stop running instances

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get single client
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### AWS Resources
- `GET /api/aws/:clientId/ec2/instances` - List EC2 instances
- `POST /api/aws/:clientId/ec2/instances/:instanceId/start` - Start instance
- `POST /api/aws/:clientId/ec2/instances/:instanceId/stop` - Stop instance
- `GET /api/aws/:clientId/s3/buckets` - List S3 buckets
- `GET /api/aws/:clientId/rds/instances` - List RDS instances
- `GET /api/aws/:clientId/costs` - Get cost data

### Activity Logs
- `GET /api/logs` - Get all activity logs
- `GET /api/logs/user/:userId` - Get logs for specific user
- `GET /api/logs/client/:clientId` - Get logs for specific client

## Security Features

### Credential Encryption
- AWS credentials are encrypted at rest using AES-256-GCM
- Each credential has a unique initialization vector (IV)
- Encryption key is stored as an environment variable
- Credentials are only decrypted when making AWS API calls

### Authentication
- JWT-based authentication
- Passwords hashed with bcrypt (10 salt rounds)
- Tokens expire after 1 hour (configurable)
- Protected routes require valid JWT token

### Security Headers
- Helmet.js adds various HTTP security headers
- CORS configured to allow only specific origins

### Best Practices
- Never commit `.env` files to version control
- Use strong encryption keys (32 characters)
- Rotate encryption keys periodically
- Use strong passwords for user accounts
- Keep dependencies updated

## Database Schema

### users table
- `id` - Primary key
- `email` - Unique user email
- `password_hash` - Bcrypt hashed password
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### clients table
- `id` - Primary key
- `client_name` - Client display name
- `aws_account_id` - AWS account ID (optional)
- `access_key_id_encrypted` - Encrypted AWS access key
- `secret_access_key_encrypted` - Encrypted AWS secret key
- `encryption_iv` - Initialization vector for encryption
- `region` - AWS region
- `notes` - Optional notes
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### activity_logs table
- `id` - Primary key
- `user_id` - Foreign key to users
- `client_id` - Foreign key to clients
- `action` - Action performed
- `details` - JSON details
- `timestamp` - Action timestamp

## Development Commands

### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run setup        # Run setup utilities
```

### Web
```bash
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
```

### Mobile
```bash
npm run android      # Run on Android
npm run ios          # Run on iOS
npm start            # Start Metro bundler
```

## Production Deployment

### Backend Deployment

1. **Build the application**:
```bash
cd backend
npm run build
```

2. **Set up PostgreSQL** on your production server

3. **Configure environment variables** on production server

4. **Deploy options**:
   - AWS EC2 + RDS
   - Heroku
   - DigitalOcean
   - Docker container

5. **Use a process manager** (PM2):
```bash
npm install -g pm2
pm2 start dist/server.js --name aws-mgmt
```

### Web Deployment

1. **Build the application**:
```bash
cd web
npm run build
```

2. **Deploy the `build` folder** to:
   - AWS S3 + CloudFront
   - Netlify
   - Vercel
   - Your own server

### Mobile Deployment

#### Android
1. Generate a signing key
2. Build release APK:
```bash
cd android
./gradlew assembleRelease
```
3. Upload to Google Play Store

#### iOS
1. Configure signing in Xcode
2. Build for release
3. Upload to App Store Connect
4. Submit for review

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure port 3000 is not in use
- Check logs for specific errors

### Web app can't connect to backend
- Verify backend is running at `http://localhost:3000`
- Check `REACT_APP_API_URL` in web `.env`
- Check CORS settings in backend

### AWS operations fail
- Verify AWS credentials are correct
- Check AWS IAM permissions
- Ensure encryption key is correct
- Check AWS region configuration

### Mobile app can't connect
- Update API URL in `api.service.ts`
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use your computer's IP address
- Ensure backend allows CORS from mobile app

## Future Enhancements

- [ ] Cost Explorer integration
- [ ] CloudWatch metrics
- [ ] Lambda function management
- [ ] IAM user management
- [ ] Resource tagging
- [ ] Notifications and alerts
- [ ] Multi-factor authentication
- [ ] Audit log export
- [ ] Dark mode
- [ ] Internationalization

## Learning Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues, questions, or contributions, please refer to the project's issue tracker or documentation.

## License

This project is for educational and personal use. Ensure you comply with AWS terms of service when managing client accounts.

---

**Built with ❤️ for zero-coding beginners**
