/**
 * Activity Logs Routes
 *
 * Handles retrieval of activity logs for audit purposes.
 * All routes are protected by authentication middleware.
 *
 * Endpoints:
 * - GET /api/logs - Get all activity logs (paginated)
 * - GET /api/logs/user/:userId - Get logs for a specific user
 * - GET /api/logs/client/:clientId - Get logs for a specific client
 */

import express, { Response } from 'express';
import { getActivityLogs, getActivityLogsByUser, getActivityLogsByClient } from '../models/ActivityLog';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/logs
 * Get all activity logs with pagination
 * Query params: limit, offset
 */
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = await getActivityLogs(limit, offset);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/logs/user/:userId
 * Get activity logs for a specific user
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

    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await getActivityLogsByUser(userId, limit);

    res.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/logs/client/:clientId
 * Get activity logs for a specific client
 */
router.get('/client/:clientId', async (req: AuthRequest, res: Response, next) => {
  try {
    const clientId = parseInt(req.params.clientId);

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID',
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await getActivityLogsByClient(clientId, limit);

    res.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
