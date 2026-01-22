/**
 * Resource Assignment Routes
 *
 * API endpoints for assigning AWS resources to users for cost tracking.
 *
 * Endpoints:
 * - POST   /api/resource-assignments           - Assign resource to user
 * - GET    /api/resource-assignments/user/:userId - Get user's assignments
 * - GET    /api/resource-assignments/client/:clientId - Get client's assignments
 * - PUT    /api/resource-assignments/:id       - Update assignment
 * - DELETE /api/resource-assignments/:id       - Delete assignment
 * - POST   /api/resource-assignments/bulk      - Bulk assign resources
 */

import express, { Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import {
  createResourceAssignment,
  getUserResourceAssignments,
  getClientResourceAssignments,
  updateResourceAssignment,
  deleteResourceAssignment,
  bulkAssignResources,
  getAssignmentsByUserForClient,
} from '../models/ResourceAssignment';
import { createActivityLog } from '../models/ActivityLog';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * POST /api/resource-assignments
 * Assign an AWS resource to a user
 */
router.post(
  '/',
  [
    body('user_id').isInt().withMessage('User ID must be an integer'),
    body('client_id').isInt().withMessage('Client ID must be an integer'),
    body('resource_type')
      .isIn(['ec2', 's3', 'rds', 'lambda', 'cloudfront', 'elb', 'other'])
      .withMessage('Invalid resource type'),
    body('resource_id').notEmpty().withMessage('Resource ID is required'),
    body('resource_name').optional().isString(),
    body('cost_center').optional().isString(),
    body('notes').optional().isString(),
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

      const { user_id, client_id, resource_type, resource_id, resource_name, cost_center, notes } =
        req.body;

      const assignment = await createResourceAssignment({
        user_id,
        client_id,
        resource_type,
        resource_id,
        resource_name,
        cost_center,
        notes,
        assigned_by: req.user?.id,
      });

      // Log activity
      await createActivityLog({
        user_id: req.user?.id,
        client_id,
        action: 'RESOURCE_ASSIGNED',
        details: {
          assigned_to_user: user_id,
          resource_type,
          resource_id,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Resource assigned successfully',
        data: { assignment },
      });
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: 'This resource is already assigned',
        });
      }
      next(error);
    }
  }
);

/**
 * GET /api/resource-assignments/user/:userId
 * Get all resources assigned to a user
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

    const assignments = await getUserResourceAssignments(userId);

    res.json({
      success: true,
      data: { assignments, count: assignments.length },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/resource-assignments/client/:clientId
 * Get all resource assignments for a client
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

    const assignments = await getClientResourceAssignments(clientId);

    res.json({
      success: true,
      data: { assignments, count: assignments.length },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/resource-assignments/client/:clientId/grouped
 * Get assignments grouped by user for a client
 */
router.get('/client/:clientId/grouped', async (req: AuthRequest, res: Response, next) => {
  try {
    const clientId = parseInt(req.params.clientId);

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID',
      });
    }

    const grouped = await getAssignmentsByUserForClient(clientId);

    res.json({
      success: true,
      data: { users: grouped },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/resource-assignments/:id
 * Update a resource assignment
 */
router.put(
  '/:id',
  [
    body('resource_name').optional().isString(),
    body('cost_center').optional().isString(),
    body('notes').optional().isString(),
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

      const assignmentId = parseInt(req.params.id);

      if (isNaN(assignmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assignment ID',
        });
      }

      const { resource_name, cost_center, notes } = req.body;

      const updatedAssignment = await updateResourceAssignment(assignmentId, {
        resource_name,
        cost_center,
        notes,
      });

      if (!updatedAssignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found',
        });
      }

      res.json({
        success: true,
        message: 'Assignment updated successfully',
        data: { assignment: updatedAssignment },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/resource-assignments/:id
 * Delete a resource assignment
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const assignmentId = parseInt(req.params.id);

    if (isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID',
      });
    }

    const deleted = await deleteResourceAssignment(assignmentId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    // Log activity
    await createActivityLog({
      user_id: req.user?.id,
      action: 'RESOURCE_ASSIGNMENT_DELETED',
      details: { assignment_id: assignmentId },
    });

    res.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resource-assignments/bulk
 * Bulk assign multiple resources to a user
 */
router.post(
  '/bulk',
  [
    body('user_id').isInt().withMessage('User ID must be an integer'),
    body('client_id').isInt().withMessage('Client ID must be an integer'),
    body('resources').isArray({ min: 1 }).withMessage('Resources array is required'),
    body('resources.*.resource_type').notEmpty().withMessage('Resource type is required'),
    body('resources.*.resource_id').notEmpty().withMessage('Resource ID is required'),
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

      const { user_id, client_id, resources } = req.body;

      const assignments = await bulkAssignResources(user_id, client_id, resources, req.user?.id);

      // Log activity
      await createActivityLog({
        user_id: req.user?.id,
        client_id,
        action: 'BULK_RESOURCE_ASSIGNMENT',
        details: {
          assigned_to_user: user_id,
          resource_count: assignments.length,
        },
      });

      res.status(201).json({
        success: true,
        message: `${assignments.length} resources assigned successfully`,
        data: { assignments, count: assignments.length },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
