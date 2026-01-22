/**
 * AWS Management Routes
 *
 * Handles AWS resource management operations.
 * All routes are protected by authentication middleware.
 *
 * Endpoints:
 * - GET /api/aws/:clientId/ec2/instances - List EC2 instances
 * - POST /api/aws/:clientId/ec2/instances/:instanceId/start - Start an EC2 instance
 * - POST /api/aws/:clientId/ec2/instances/:instanceId/stop - Stop an EC2 instance
 * - GET /api/aws/:clientId/s3/buckets - List S3 buckets
 * - GET /api/aws/:clientId/rds/instances - List RDS instances
 * - GET /api/aws/:clientId/costs - Get cost and usage data
 */

import express, { Response } from 'express';
import {
  listEC2Instances,
  startEC2Instance,
  stopEC2Instance,
  listS3Buckets,
  listRDSInstances,
  getCostAndUsage,
} from '../services/aws.service';
import { createActivityLog } from '../models/ActivityLog';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { getClientById } from '../models/Client';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/aws/:clientId/ec2/instances
 * List all EC2 instances for a client
 */
router.get('/:clientId/ec2/instances', async (req: AuthRequest, res: Response, next) => {
  try {
    const clientId = parseInt(req.params.clientId);

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID',
      });
    }

    // Verify client exists
    const client = await getClientById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    const instances = await listEC2Instances(clientId);

    // Log the activity
    await createActivityLog({
      user_id: req.user?.id,
      client_id: clientId,
      action: 'LIST_EC2_INSTANCES',
      details: {
        instance_count: instances.length,
      },
    });

    res.json({
      success: true,
      data: { instances },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/aws/:clientId/ec2/instances/:instanceId/start
 * Start an EC2 instance
 */
router.post('/:clientId/ec2/instances/:instanceId/start', async (req: AuthRequest, res: Response, next) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const instanceId = req.params.instanceId;

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID',
      });
    }

    // Verify client exists
    const client = await getClientById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    await startEC2Instance(clientId, instanceId);

    // Log the activity
    await createActivityLog({
      user_id: req.user?.id,
      client_id: clientId,
      action: 'START_EC2_INSTANCE',
      details: {
        instance_id: instanceId,
      },
    });

    res.json({
      success: true,
      message: 'EC2 instance start initiated',
      data: { instanceId },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/aws/:clientId/ec2/instances/:instanceId/stop
 * Stop an EC2 instance
 */
router.post('/:clientId/ec2/instances/:instanceId/stop', async (req: AuthRequest, res: Response, next) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const instanceId = req.params.instanceId;

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID',
      });
    }

    // Verify client exists
    const client = await getClientById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    await stopEC2Instance(clientId, instanceId);

    // Log the activity
    await createActivityLog({
      user_id: req.user?.id,
      client_id: clientId,
      action: 'STOP_EC2_INSTANCE',
      details: {
        instance_id: instanceId,
      },
    });

    res.json({
      success: true,
      message: 'EC2 instance stop initiated',
      data: { instanceId },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/aws/:clientId/s3/buckets
 * List all S3 buckets for a client
 */
router.get('/:clientId/s3/buckets', async (req: AuthRequest, res: Response, next) => {
  try {
    const clientId = parseInt(req.params.clientId);

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID',
      });
    }

    // Verify client exists
    const client = await getClientById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    const buckets = await listS3Buckets(clientId);

    // Log the activity
    await createActivityLog({
      user_id: req.user?.id,
      client_id: clientId,
      action: 'LIST_S3_BUCKETS',
      details: {
        bucket_count: buckets.length,
      },
    });

    res.json({
      success: true,
      data: { buckets },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/aws/:clientId/rds/instances
 * List all RDS instances for a client
 */
router.get('/:clientId/rds/instances', async (req: AuthRequest, res: Response, next) => {
  try {
    const clientId = parseInt(req.params.clientId);

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID',
      });
    }

    // Verify client exists
    const client = await getClientById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    const instances = await listRDSInstances(clientId);

    // Log the activity
    await createActivityLog({
      user_id: req.user?.id,
      client_id: clientId,
      action: 'LIST_RDS_INSTANCES',
      details: {
        instance_count: instances.length,
      },
    });

    res.json({
      success: true,
      data: { instances },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/aws/:clientId/costs
 * Get cost and usage data for a client
 * Query params: startDate, endDate (YYYY-MM-DD format)
 */
router.get('/:clientId/costs', async (req: AuthRequest, res: Response, next) => {
  try {
    const clientId = parseInt(req.params.clientId);

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID',
      });
    }

    // Verify client exists
    const client = await getClientById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Get date range from query params or default to last 30 days
    const endDate = (req.query.endDate as string) || new Date().toISOString().split('T')[0];
    const startDate =
      (req.query.startDate as string) ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const costs = await getCostAndUsage(clientId, startDate, endDate);

    // Log the activity
    await createActivityLog({
      user_id: req.user?.id,
      client_id: clientId,
      action: 'VIEW_COSTS',
      details: {
        start_date: startDate,
        end_date: endDate,
      },
    });

    res.json({
      success: true,
      data: { costs, startDate, endDate },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
