/**
 * Database Configuration
 *
 * This file sets up the PostgreSQL database connection using the 'pg' library.
 * It reads database credentials from environment variables for security.
 *
 * The Pool object manages multiple database connections efficiently,
 * allowing concurrent queries without creating a new connection each time.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a connection pool to the PostgreSQL database
// A pool manages multiple connections and reuses them for efficiency
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'aws_central_mgmt',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  // Maximum number of clients in the pool
  max: 20,
  // How long a client can stay idle before being closed (30 seconds)
  idleTimeoutMillis: 30000,
  // How long to wait for a connection before timing out (2 seconds)
  connectionTimeoutMillis: 2000,
});

// Test the database connection
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

/**
 * Helper function to execute a query
 * @param text - SQL query string
 * @param params - Parameters for the query (prevents SQL injection)
 * @returns Query result
 */
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

/**
 * Helper function to get a client from the pool
 * Useful for transactions where multiple queries need to run on the same connection
 */
export const getClient = () => {
  return pool.connect();
};

export default pool;
