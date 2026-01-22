/**
 * User Model
 *
 * Represents a user in the system (admin/operator).
 * Handles database operations for user management.
 */

import { query } from '../config/database';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserInput {
  email: string;
  password_hash: string;
}

/**
 * Create a new user
 * @param userData - User data (email and password_hash)
 * @returns Created user object (without password)
 */
export const createUser = async (userData: UserInput): Promise<Omit<User, 'password_hash'>> => {
  const { email, password_hash } = userData;

  const result = await query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at, updated_at',
    [email, password_hash]
  );

  return result.rows[0];
};

/**
 * Find a user by email
 * @param email - User's email address
 * @returns User object or null if not found
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);

  return result.rows[0] || null;
};

/**
 * Find a user by ID
 * @param id - User's ID
 * @returns User object (without password) or null if not found
 */
export const findUserById = async (id: number): Promise<Omit<User, 'password_hash'> | null> => {
  const result = await query('SELECT id, email, created_at, updated_at FROM users WHERE id = $1', [id]);

  return result.rows[0] || null;
};

/**
 * Get all users
 * @returns Array of user objects (without passwords)
 */
export const getAllUsers = async (): Promise<Omit<User, 'password_hash'>[]> => {
  const result = await query('SELECT id, email, created_at, updated_at FROM users ORDER BY created_at DESC');

  return result.rows;
};

/**
 * Delete a user by ID
 * @param id - User's ID
 * @returns True if deleted, false if not found
 */
export const deleteUser = async (id: number): Promise<boolean> => {
  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

  return result.rowCount ? result.rowCount > 0 : false;
};
