/**
 * Authentication Middleware
 *
 * Protects routes by verifying JWT tokens.
 * Extracts user information from the token and attaches it to the request.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Extend Express Request type to include user information
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

/**
 * Middleware to verify JWT token
 * Expects token in Authorization header as "Bearer <token>"
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please authenticate.',
      });
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: number; email: string };

    // Attach user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please authenticate.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is valid, but doesn't fail if no token
 */
export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET;

      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as { id: number; email: string };
        req.user = {
          id: decoded.id,
          email: decoded.email,
        };
      }
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user info
    next();
  }
};
