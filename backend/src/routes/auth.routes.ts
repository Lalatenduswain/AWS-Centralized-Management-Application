/**
 * Authentication Routes
 *
 * Handles user registration and login.
 * Endpoints:
 * - POST /api/auth/register - Create new user
 * - POST /api/auth/login - Login and get JWT token
 */

import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { createUser, findUserByEmail } from '../models/User';
import { createActivityLog } from '../models/ActivityLog';
import { createError } from '../middleware/error.middleware';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req: Request, res: Response, next) => {
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

      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Hash the password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await createUser({ email, password_hash });

      // Log the activity
      await createActivityLog({
        user_id: user.id,
        action: 'USER_REGISTERED',
        details: { email },
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Login and receive JWT token
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response, next) => {
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

      const { email, password } = req.body;

      // Find user by email
      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw createError('JWT_SECRET is not configured', 500);
      }

      const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      });

      // Log the activity
      await createActivityLog({
        user_id: user.id,
        action: 'USER_LOGIN',
        details: { email },
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
