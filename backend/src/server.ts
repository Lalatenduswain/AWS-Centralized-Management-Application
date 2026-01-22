/**
 * AWS Centralized Management Application - Backend Server
 *
 * Main entry point for the backend API server.
 * This file sets up:
 * - Express application
 * - Database connection
 * - Middleware (CORS, JSON parsing, security headers)
 * - API routes
 * - Error handling
 *
 * For zero-coding beginners:
 * This is like the "main control center" of your backend.
 * It receives requests from the web/mobile apps and responds with data.
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { pool } from './config/database';
import authRoutes from './routes/auth.routes';
import clientsRoutes from './routes/clients.routes';
import awsRoutes from './routes/aws.routes';
import logsRoutes from './routes/logs.routes';
import billingRoutes from './routes/billing.routes';
import budgetsRoutes from './routes/budgets.routes';
import resourceAssignmentsRoutes from './routes/resource-assignments.routes';
import alertsRoutes from './routes/alerts.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Load environment variables from .env file
dotenv.config();

// Create Express application
const app: Application = express();

// Get port from environment variable or use default
const PORT = process.env.PORT || 3000;

/**
 * MIDDLEWARE SETUP
 * Middleware are functions that process requests before they reach your routes
 */

// Security headers - adds various HTTP headers to secure the app
app.use(helmet());

// CORS (Cross-Origin Resource Sharing) - allows web/mobile apps to make requests
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies (from forms)
app.use(express.urlencoded({ extended: true }));

// Request logging (simple version - can be enhanced with morgan)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * API ROUTES
 * These define the endpoints your app can call
 */

// Health check endpoint (to verify server is running)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Client management routes
app.use('/api/clients', clientsRoutes);

// AWS resource management routes
app.use('/api/aws', awsRoutes);

// Activity logs routes
app.use('/api/logs', logsRoutes);

// Billing & cost management routes
app.use('/api/billing', billingRoutes);

// Budget management routes
app.use('/api/budgets', budgetsRoutes);

// Resource assignment routes
app.use('/api/resource-assignments', resourceAssignmentsRoutes);

// Budget alerts routes
app.use('/api/alerts', alertsRoutes);

/**
 * ERROR HANDLING
 * These handle errors and 404s
 */

// 404 handler - catches routes that don't exist
app.use(notFoundHandler);

// Global error handler - catches all errors
app.use(errorHandler);

/**
 * START SERVER
 * Test database connection and start listening for requests
 */

const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection established');

    // Initialize cron jobs for budget alerts and cost tracking
    console.log('\nInitializing services...');
    const { cronJobsService } = await import('./services/cron-jobs.service');
    const { emailService } = await import('./services/email.service');

    // Verify email configuration (optional)
    await emailService.verifyConnection().catch(() => {
      console.warn('⚠ Email service not configured or unavailable');
    });

    // Start listening for requests
    app.listen(PORT, () => {
      console.log('========================================');
      console.log('AWS Centralized Management - Backend API');
      console.log('========================================');
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log('========================================');
      console.log('Available endpoints:');
      console.log('\n📝 Authentication:');
      console.log('  POST   /api/auth/register');
      console.log('  POST   /api/auth/login');
      console.log('\n👥 Client Management:');
      console.log('  GET    /api/clients');
      console.log('  POST   /api/clients');
      console.log('  GET    /api/clients/:id');
      console.log('  PUT    /api/clients/:id');
      console.log('  DELETE /api/clients/:id');
      console.log('\n☁️  AWS Resources:');
      console.log('  GET    /api/aws/:clientId/ec2/instances');
      console.log('  POST   /api/aws/:clientId/ec2/instances/:instanceId/start');
      console.log('  POST   /api/aws/:clientId/ec2/instances/:instanceId/stop');
      console.log('  GET    /api/aws/:clientId/s3/buckets');
      console.log('  GET    /api/aws/:clientId/rds/instances');
      console.log('  GET    /api/aws/:clientId/costs');
      console.log('\n💰 Billing & Cost Management:');
      console.log('  GET    /api/billing/user/:userId/costs');
      console.log('  GET    /api/billing/user/:userId/summary');
      console.log('  GET    /api/billing/user/:userId/breakdown');
      console.log('  GET    /api/billing/user/:userId/trend');
      console.log('  GET    /api/billing/user/:userId/top-drivers');
      console.log('  GET    /api/billing/user/:userId/forecast');
      console.log('  GET    /api/billing/client/:clientId/summary');
      console.log('  POST   /api/billing/sync');
      console.log('  GET    /api/billing/all-users');
      console.log('\n💳 Budget Management:');
      console.log('  POST   /api/budgets');
      console.log('  GET    /api/budgets/user/:userId');
      console.log('  GET    /api/budgets/user/:userId/active');
      console.log('  GET    /api/budgets/user/:userId/status');
      console.log('  PUT    /api/budgets/:id');
      console.log('  DELETE /api/budgets/:id');
      console.log('  GET    /api/budgets/alerts');
      console.log('\n🔗 Resource Assignments:');
      console.log('  POST   /api/resource-assignments');
      console.log('  GET    /api/resource-assignments/user/:userId');
      console.log('  GET    /api/resource-assignments/client/:clientId');
      console.log('  PUT    /api/resource-assignments/:id');
      console.log('  DELETE /api/resource-assignments/:id');
      console.log('  POST   /api/resource-assignments/bulk');
      console.log('\n📋 Activity Logs:');
      console.log('  GET    /api/logs');
      console.log('\n🔔 Budget Alerts:');
      console.log('  GET    /api/alerts/user/:userId');
      console.log('  GET    /api/alerts/budget/:budgetId');
      console.log('  GET    /api/alerts/statistics');
      console.log('  POST   /api/alerts/check (manual trigger)');
      console.log('  POST   /api/alerts/test-email');
      console.log('========================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing server');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();

export default app;
