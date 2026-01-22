/**
 * Client Management Routes
 *
 * Handles CRUD operations for client accounts.
 * All routes are protected by authentication middleware.
 *
 * Endpoints:
 * - GET /api/clients - List all clients
 * - GET /api/clients/:id - Get single client
 * - POST /api/clients - Create new client
 * - PUT /api/clients/:id - Update client
 * - DELETE /api/clients/:id - Delete client
 */

import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
} from '../models/Client';
import { createActivityLog } from '../models/ActivityLog';
import { encryptAWSCredentials } from '../services/encryption.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/clients
 * List all clients (without credentials)
 */
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const clients = await getAllClients();

    res.json({
      success: true,
      data: { clients },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id
 * Get a single client by ID (without credentials)
 */
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const clientId = parseInt(req.params.id);

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID',
      });
    }

    const client = await getClientById(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    res.json({
      success: true,
      data: { client },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients
 * Create a new client with encrypted AWS credentials
 */
router.post(
  '/',
  [
    body('client_name').notEmpty().withMessage('Client name is required'),
    body('access_key_id').notEmpty().withMessage('AWS Access Key ID is required'),
    body('secret_access_key').notEmpty().withMessage('AWS Secret Access Key is required'),
    body('region').optional().isString(),
    body('aws_account_id').optional().isString(),
    body('notes').optional().isString(),
  ],
  async (req: AuthRequest, res: Response, next) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { client_name, access_key_id, secret_access_key, region, aws_account_id, notes } = req.body;

      // Encrypt AWS credentials
      const encryptedCredentials = encryptAWSCredentials(access_key_id, secret_access_key);

      // Create client with encrypted credentials
      const client = await createClient({
        client_name,
        aws_account_id,
        access_key_id_encrypted: encryptedCredentials.access_key_id_encrypted,
        secret_access_key_encrypted: encryptedCredentials.secret_access_key_encrypted,
        encryption_iv: encryptedCredentials.encryption_iv,
        region: region || 'us-east-1',
        notes,
      });

      // Log the activity
      await createActivityLog({
        user_id: req.user?.id,
        client_id: client.id,
        action: 'CLIENT_CREATED',
        details: {
          client_name,
          region: client.region,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Client created successfully',
        data: { client },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/clients/:id
 * Update a client (can update name, region, notes, or credentials)
 */
router.put(
  '/:id',
  [
    body('client_name').optional().notEmpty(),
    body('access_key_id').optional().notEmpty(),
    body('secret_access_key').optional().notEmpty(),
    body('region').optional().isString(),
    body('aws_account_id').optional().isString(),
    body('notes').optional().isString(),
  ],
  async (req: AuthRequest, res: Response, next) => {
    try {
      const clientId = parseInt(req.params.id);

      if (isNaN(clientId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid client ID',
        });
      }

      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { client_name, access_key_id, secret_access_key, region, aws_account_id, notes } = req.body;

      // Check if client exists
      const existingClient = await getClientById(clientId);
      if (!existingClient) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }

      // Prepare updates
      const updates: any = {};

      if (client_name) updates.client_name = client_name;
      if (region) updates.region = region;
      if (aws_account_id !== undefined) updates.aws_account_id = aws_account_id;
      if (notes !== undefined) updates.notes = notes;

      // If credentials are being updated, encrypt them
      if (access_key_id && secret_access_key) {
        const encryptedCredentials = encryptAWSCredentials(access_key_id, secret_access_key);
        updates.access_key_id_encrypted = encryptedCredentials.access_key_id_encrypted;
        updates.secret_access_key_encrypted = encryptedCredentials.secret_access_key_encrypted;
        updates.encryption_iv = encryptedCredentials.encryption_iv;
      }

      // Update client
      const updatedClient = await updateClient(clientId, updates);

      // Log the activity
      await createActivityLog({
        user_id: req.user?.id,
        client_id: clientId,
        action: 'CLIENT_UPDATED',
        details: {
          updated_fields: Object.keys(updates),
        },
      });

      res.json({
        success: true,
        message: 'Client updated successfully',
        data: { client: updatedClient },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/clients/:id
 * Delete a client
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const clientId = parseInt(req.params.id);

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID',
      });
    }

    // Check if client exists
    const existingClient = await getClientById(clientId);
    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Delete client
    await deleteClient(clientId);

    // Log the activity
    await createActivityLog({
      user_id: req.user?.id,
      client_id: clientId,
      action: 'CLIENT_DELETED',
      details: {
        client_name: existingClient.client_name,
      },
    });

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
