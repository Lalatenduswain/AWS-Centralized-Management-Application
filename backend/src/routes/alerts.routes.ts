/**
 * Budget Alerts Routes
 *
 * API endpoints for managing budget alerts and alert history.
 *
 * Endpoints:
 * - GET  /api/alerts/user/:userId           - Get user's alert history
 * - GET  /api/alerts/budget/:budgetId       - Get alerts for specific budget
 * - GET  /api/alerts/statistics             - Get alert statistics
 * - POST /api/alerts/check                  - Manually trigger budget alerts check (admin)
 * - POST /api/alerts/test-email             - Test email configuration (admin)
 */

import express, { Response, NextFunction } from 'express';
import { getUserAlerts, getBudgetAlerts, getAlertStatistics } from '../models/BudgetAlert';
import { checkBudgetsAndSendAlerts } from '../services/budget-alerts.service';
import { emailService } from '../services/email.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * GET /api/alerts/user/:userId
 * Get alert history for a user
 */
router.get('/user/:userId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const alerts = await getUserAlerts(userId, limit);

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/budget/:budgetId
 * Get alerts for a specific budget
 */
router.get('/budget/:budgetId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const budgetId = parseInt(req.params.budgetId);

    if (isNaN(budgetId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid budget ID',
      });
    }

    const alerts = await getBudgetAlerts(budgetId);

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/statistics
 * Get alert statistics
 */
router.get('/statistics', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const statistics = await getAlertStatistics(userId, startDate, endDate);

    res.json({
      success: true,
      data: {
        statistics,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alerts/check
 * Manually trigger budget alerts check (for testing/admin)
 */
router.post('/check', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log(`Manual budget alert check triggered by user ${req.user?.id}`);

    const result = await checkBudgetsAndSendAlerts();

    res.json({
      success: true,
      message: 'Budget alerts check completed',
      data: {
        checked: result.checked,
        alerts_sent: result.alertsSent,
        errors: result.errors,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alerts/test-email
 * Test email configuration (send test email)
 */
router.post('/test-email', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email (to) is required',
      });
    }

    // Send a test budget alert email
    const sent = await emailService.sendBudgetAlert(to, 'Test User', {
      monthlyLimit: 1000,
      currentSpending: 850,
      percentageUsed: 85,
      remainingBudget: 150,
      daysLeftInMonth: 10,
      currency: 'USD',
    });

    if (sent) {
      res.json({
        success: true,
        message: `Test email sent successfully to ${to}`,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email. Check email configuration.',
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
