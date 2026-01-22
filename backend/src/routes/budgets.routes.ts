/**
 * Budget Management Routes
 *
 * API endpoints for managing user budgets and spending limits.
 *
 * Endpoints:
 * - POST   /api/budgets                    - Create budget for user
 * - GET    /api/budgets/user/:userId       - Get user's budgets
 * - GET    /api/budgets/user/:userId/active - Get active budget
 * - GET    /api/budgets/user/:userId/status - Get budget status with spending
 * - PUT    /api/budgets/:id                - Update budget
 * - DELETE /api/budgets/:id                - Delete budget
 * - GET    /api/budgets/alerts              - Get users needing budget alerts
 */

import express, { Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import {
  createUserBudget,
  getActiveBudgetForUser,
  getUserBudgets,
  updateUserBudget,
  deleteUserBudget,
  getBudgetStatus,
  getUsersNeedingAlerts,
} from '../models/UserBudget';
import { createActivityLog } from '../models/ActivityLog';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * POST /api/budgets
 * Create a new budget for a user
 */
router.post(
  '/',
  [
    body('user_id').isInt().withMessage('User ID must be an integer'),
    body('monthly_limit')
      .isFloat({ min: 0 })
      .withMessage('Monthly limit must be a positive number'),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('alert_threshold')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Alert threshold must be between 0 and 1'),
    body('alerts_enabled').optional().isBoolean(),
    body('start_date').optional().isISO8601(),
    body('end_date').optional().isISO8601(),
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

      const {
        user_id,
        monthly_limit,
        currency,
        alert_threshold,
        alerts_enabled,
        start_date,
        end_date,
      } = req.body;

      const budget = await createUserBudget({
        user_id,
        monthly_limit,
        currency,
        alert_threshold,
        alerts_enabled,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        created_by: req.user?.id,
      });

      // Log activity
      await createActivityLog({
        user_id: req.user?.id,
        action: 'BUDGET_CREATED',
        details: {
          for_user: user_id,
          monthly_limit,
          currency: currency || 'USD',
        },
      });

      res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        data: { budget },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/budgets/user/:userId
 * Get all budgets for a user (including historical)
 */
router.get('/user/:userId', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const budgets = await getUserBudgets(userId);

    res.json({
      success: true,
      data: { budgets, count: budgets.length },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/budgets/user/:userId/active
 * Get active budget for a user
 */
router.get('/user/:userId/active', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const budget = await getActiveBudgetForUser(userId);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'No active budget found for this user',
      });
    }

    res.json({
      success: true,
      data: { budget },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/budgets/user/:userId/status
 * Get budget status with current spending
 */
router.get('/user/:userId/status', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const status = await getBudgetStatus(userId);

    res.json({
      success: true,
      data: { status },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/budgets/:id
 * Update a budget
 */
router.put(
  '/:id',
  [
    body('monthly_limit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Monthly limit must be a positive number'),
    body('alert_threshold')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Alert threshold must be between 0 and 1'),
    body('alerts_enabled').optional().isBoolean(),
    body('end_date').optional().isISO8601(),
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

      const budgetId = parseInt(req.params.id);

      if (isNaN(budgetId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid budget ID',
        });
      }

      const { monthly_limit, alert_threshold, alerts_enabled, end_date } = req.body;

      const updates: any = {};
      if (monthly_limit !== undefined) updates.monthly_limit = monthly_limit;
      if (alert_threshold !== undefined) updates.alert_threshold = alert_threshold;
      if (alerts_enabled !== undefined) updates.alerts_enabled = alerts_enabled;
      if (end_date !== undefined) updates.end_date = new Date(end_date);

      const updatedBudget = await updateUserBudget(budgetId, updates);

      if (!updatedBudget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found',
        });
      }

      // Log activity
      await createActivityLog({
        user_id: req.user?.id,
        action: 'BUDGET_UPDATED',
        details: {
          budget_id: budgetId,
          updated_fields: Object.keys(updates),
        },
      });

      res.json({
        success: true,
        message: 'Budget updated successfully',
        data: { budget: updatedBudget },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/budgets/:id
 * Delete a budget
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const budgetId = parseInt(req.params.id);

    if (isNaN(budgetId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid budget ID',
      });
    }

    const deleted = await deleteUserBudget(budgetId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    // Log activity
    await createActivityLog({
      user_id: req.user?.id,
      action: 'BUDGET_DELETED',
      details: { budget_id: budgetId },
    });

    res.json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/budgets/alerts
 * Get all users who need budget alerts (admin only)
 */
router.get('/alerts', async (req: AuthRequest, res: Response, next) => {
  try {
    const usersNeedingAlerts = await getUsersNeedingAlerts();

    res.json({
      success: true,
      data: {
        users: usersNeedingAlerts,
        count: usersNeedingAlerts.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
