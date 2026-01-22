/**
 * Billing & Cost Reports Routes
 *
 * API endpoints for billing reports, cost analysis, and AWS cost data sync.
 *
 * Endpoints:
 * - GET  /api/billing/user/:userId/costs           - Get user's cost data
 * - GET  /api/billing/user/:userId/summary         - Get cost summary
 * - GET  /api/billing/user/:userId/breakdown       - Get cost breakdown by service
 * - GET  /api/billing/user/:userId/trend           - Get daily cost trend
 * - GET  /api/billing/user/:userId/top-drivers     - Get top cost drivers
 * - GET  /api/billing/user/:userId/forecast        - Get cost forecast
 * - GET  /api/billing/client/:clientId/summary     - Get client cost summary (from AWS)
 * - POST /api/billing/sync                         - Sync cost data from AWS
 * - GET  /api/billing/all-users                    - Get all users billing summary (admin)
 */

import express, { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import {
  getUserBillingRecords,
  getUserCostForPeriod,
  getUserCostByService,
  getUserDailyCosts,
  getTopCostDrivers,
  getAllUsersBillingSummary,
  getMonthlyTrend,
  forecastNextMonthCost,
} from '../models/BillingRecord';
import {
  syncCostDataForClient,
  syncYesterdayCosts,
  getCostSummary,
} from '../services/billing.service';
import { createActivityLog } from '../models/ActivityLog';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { body } from 'express-validator';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * GET /api/billing/user/:userId/costs
 * Get billing records for a user
 * Query params: startDate, endDate (YYYY-MM-DD)
 */
router.get('/user/:userId/costs', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const records = await getUserBillingRecords(userId, startDate, endDate);

    res.json({
      success: true,
      data: {
        records,
        count: records.length,
        filters: {
          startDate: startDate?.toISOString().split('T')[0],
          endDate: endDate?.toISOString().split('T')[0],
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billing/user/:userId/summary
 * Get cost summary for current month
 */
router.get('/user/:userId/summary', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
    const totalCost = await getUserCostForPeriod(userId, currentPeriod);

    res.json({
      success: true,
      data: {
        billing_period: currentPeriod,
        total_cost: totalCost,
        currency: 'USD',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billing/user/:userId/breakdown
 * Get cost breakdown by service
 * Query params: period (YYYY-MM, defaults to current month)
 */
router.get('/user/:userId/breakdown', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);

    const breakdown = await getUserCostByService(userId, period);

    const totalCost = breakdown.reduce((sum, service) => sum + parseFloat(service.total_cost.toString()), 0);

    res.json({
      success: true,
      data: {
        billing_period: period,
        breakdown,
        total_cost: totalCost,
        currency: 'USD',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billing/user/:userId/trend
 * Get daily cost trend
 * Query params: startDate, endDate (defaults to last 30 days)
 */
router.get('/user/:userId/trend', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const trend = await getUserDailyCosts(userId, startDate, endDate);

    res.json({
      success: true,
      data: {
        trend,
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billing/user/:userId/top-drivers
 * Get top cost drivers (most expensive resources)
 * Query params: period (YYYY-MM), limit (default 10)
 */
router.get('/user/:userId/top-drivers', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);
    const limit = parseInt(req.query.limit as string) || 10;

    const topDrivers = await getTopCostDrivers(userId, period, limit);

    res.json({
      success: true,
      data: {
        billing_period: period,
        top_drivers: topDrivers,
        count: topDrivers.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billing/user/:userId/monthly-trend
 * Get monthly cost trend for last N months
 * Query params: months (default 6)
 */
router.get('/user/:userId/monthly-trend', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const months = parseInt(req.query.months as string) || 6;

    const trend = await getMonthlyTrend(userId, months);

    res.json({
      success: true,
      data: { trend, months },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billing/user/:userId/forecast
 * Get cost forecast for next month
 */
router.get('/user/:userId/forecast', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const forecast = await forecastNextMonthCost(userId);

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const forecastPeriod = nextMonth.toISOString().slice(0, 7);

    res.json({
      success: true,
      data: {
        forecast_period: forecastPeriod,
        forecasted_cost: forecast,
        currency: 'USD',
        method: 'linear_extrapolation',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billing/client/:clientId/summary
 * Get AWS cost summary for a client (fetches from AWS Cost Explorer)
 * Query params: startDate, endDate (YYYY-MM-DD)
 */
router.get('/client/:clientId/summary', async (req: AuthRequest, res: Response, next) => {
  try {
    const clientId = parseInt(req.params.clientId);

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID',
      });
    }

    const endDate = (req.query.endDate as string) || new Date().toISOString().split('T')[0];
    const startDate =
      (req.query.startDate as string) ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const summary = await getCostSummary(clientId, startDate, endDate);

    // Log activity
    await createActivityLog({
      user_id: req.user?.id,
      client_id: clientId,
      action: 'VIEWED_AWS_COST_SUMMARY',
      details: { startDate, endDate },
    });

    res.json({
      success: true,
      data: {
        ...summary,
        period: { start: startDate, end: endDate },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/billing/sync
 * Sync cost data from AWS Cost Explorer
 * Body: { client_id, user_id, startDate, endDate }
 */
router.post(
  '/sync',
  [
    body('client_id').isInt().withMessage('Client ID is required'),
    body('user_id').isInt().withMessage('User ID is required'),
    body('startDate').isISO8601().withMessage('Start date must be YYYY-MM-DD'),
    body('endDate').isISO8601().withMessage('End date must be YYYY-MM-DD'),
  ],
  async (req: AuthRequest, res: Response, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { client_id, user_id, startDate, endDate } = req.body;

      const result = await syncCostDataForClient(client_id, user_id, startDate, endDate);

      // Log activity
      await createActivityLog({
        user_id: req.user?.id,
        client_id,
        action: 'SYNCED_AWS_COSTS',
        details: {
          startDate,
          endDate,
          records_created: result.recordsCreated,
          total_cost: result.totalCost,
        },
      });

      res.json({
        success: true,
        message: 'Cost data synced successfully',
        data: {
          records_created: result.recordsCreated,
          total_cost: result.totalCost,
          currency: 'USD',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/billing/sync/yesterday
 * Sync yesterday's cost data
 * Body: { client_id, user_id }
 */
router.post(
  '/sync/yesterday',
  [
    body('client_id').isInt().withMessage('Client ID is required'),
    body('user_id').isInt().withMessage('User ID is required'),
  ],
  async (req: AuthRequest, res: Response, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { client_id, user_id } = req.body;

      const result = await syncYesterdayCosts(client_id, user_id);

      res.json({
        success: true,
        message: "Yesterday's cost data synced successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/billing/all-users
 * Get billing summary for all users (admin only)
 * Query params: period (YYYY-MM, defaults to current month)
 */
router.get('/all-users', async (req: AuthRequest, res: Response, next) => {
  try {
    const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);

    const summary = await getAllUsersBillingSummary(period);

    const totalCost = summary.reduce((sum, user) => sum + parseFloat(user.total_cost.toString()), 0);

    res.json({
      success: true,
      data: {
        billing_period: period,
        users: summary,
        total_cost: totalCost,
        user_count: summary.length,
        currency: 'USD',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
