/**
 * Activity Log Model
 *
 * Tracks all actions performed in the system for audit and compliance purposes.
 * Stores information about who did what and when.
 */

import { query } from '../config/database';

export interface ActivityLog {
  id: number;
  user_id: number | null;
  client_id: number | null;
  action: string;
  details: any;
  timestamp: Date;
}

export interface ActivityLogInput {
  user_id?: number;
  client_id?: number;
  action: string;
  details?: any;
}

/**
 * Create a new activity log entry
 * @param logData - Activity log data
 * @returns Created log entry
 */
export const createActivityLog = async (logData: ActivityLogInput): Promise<ActivityLog> => {
  const { user_id, client_id, action, details } = logData;

  const result = await query(
    `INSERT INTO activity_logs (user_id, client_id, action, details)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [user_id || null, client_id || null, action, details ? JSON.stringify(details) : null]
  );

  return result.rows[0];
};

/**
 * Get all activity logs with pagination
 * @param limit - Number of logs to retrieve (default: 100)
 * @param offset - Offset for pagination (default: 0)
 * @returns Array of activity log entries
 */
export const getActivityLogs = async (limit: number = 100, offset: number = 0): Promise<ActivityLog[]> => {
  const result = await query(
    `SELECT al.*, u.email as user_email, c.client_name
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN clients c ON al.client_id = c.id
    ORDER BY al.timestamp DESC
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows;
};

/**
 * Get activity logs for a specific user
 * @param userId - User's ID
 * @param limit - Number of logs to retrieve (default: 50)
 * @returns Array of activity log entries
 */
export const getActivityLogsByUser = async (userId: number, limit: number = 50): Promise<ActivityLog[]> => {
  const result = await query(
    `SELECT al.*, c.client_name
    FROM activity_logs al
    LEFT JOIN clients c ON al.client_id = c.id
    WHERE al.user_id = $1
    ORDER BY al.timestamp DESC
    LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
};

/**
 * Get activity logs for a specific client
 * @param clientId - Client's ID
 * @param limit - Number of logs to retrieve (default: 50)
 * @returns Array of activity log entries
 */
export const getActivityLogsByClient = async (clientId: number, limit: number = 50): Promise<ActivityLog[]> => {
  const result = await query(
    `SELECT al.*, u.email as user_email
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.client_id = $1
    ORDER BY al.timestamp DESC
    LIMIT $2`,
    [clientId, limit]
  );

  return result.rows;
};

/**
 * Delete old activity logs (for data retention policies)
 * @param daysToKeep - Number of days to keep logs (default: 90)
 * @returns Number of deleted logs
 */
export const deleteOldActivityLogs = async (daysToKeep: number = 90): Promise<number> => {
  const result = await query(
    `DELETE FROM activity_logs
    WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
    RETURNING id`
  );

  return result.rowCount || 0;
};
