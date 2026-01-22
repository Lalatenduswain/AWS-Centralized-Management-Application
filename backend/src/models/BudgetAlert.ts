/**
 * Budget Alert Model
 *
 * Manages budget alert records and alert history tracking.
 */

import { query } from '../config/database';

export interface BudgetAlert {
  id: number;
  user_id: number;
  budget_id: number;
  alert_type: 'threshold' | 'over_budget' | 'daily_summary';
  alert_level: 'info' | 'warning' | 'critical';
  percentage_used: number | null;
  amount_spent: number | null;
  budget_limit: number | null;
  message: string | null;
  email_sent: boolean;
  email_sent_at: Date | null;
  created_at: Date;
}

export interface CreateBudgetAlertInput {
  user_id: number;
  budget_id: number;
  alert_type: 'threshold' | 'over_budget' | 'daily_summary';
  alert_level: 'info' | 'warning' | 'critical';
  percentage_used?: number;
  amount_spent?: number;
  budget_limit?: number;
  message?: string;
  email_sent?: boolean;
}

/**
 * Create a new budget alert record
 */
export const createBudgetAlert = async (data: CreateBudgetAlertInput): Promise<BudgetAlert> => {
  const {
    user_id,
    budget_id,
    alert_type,
    alert_level,
    percentage_used,
    amount_spent,
    budget_limit,
    message,
    email_sent = false,
  } = data;

  const result = await query(
    `INSERT INTO budget_alerts
    (user_id, budget_id, alert_type, alert_level, percentage_used, amount_spent,
     budget_limit, message, email_sent, email_sent_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      user_id,
      budget_id,
      alert_type,
      alert_level,
      percentage_used || null,
      amount_spent || null,
      budget_limit || null,
      message || null,
      email_sent,
      email_sent ? new Date() : null,
    ]
  );

  return result.rows[0];
};

/**
 * Get user's alert history
 */
export const getUserAlerts = async (
  userId: number,
  limit: number = 50
): Promise<BudgetAlert[]> => {
  const result = await query(
    `SELECT * FROM budget_alerts
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
};

/**
 * Get alerts for a specific budget
 */
export const getBudgetAlerts = async (budgetId: number): Promise<BudgetAlert[]> => {
  const result = await query(
    `SELECT * FROM budget_alerts
    WHERE budget_id = $1
    ORDER BY created_at DESC`,
    [budgetId]
  );

  return result.rows;
};

/**
 * Check if an alert should be sent (prevents duplicate alerts within 24 hours)
 */
export const shouldSendAlert = async (
  userId: number,
  budgetId: number,
  alertType: 'threshold' | 'over_budget' | 'daily_summary'
): Promise<boolean> => {
  const result = await query(
    `SELECT should_send_budget_alert($1, $2, $3) as should_send`,
    [userId, budgetId, alertType]
  );

  return result.rows[0].should_send;
};

/**
 * Mark alert as sent
 */
export const markAlertAsSent = async (alertId: number): Promise<void> => {
  await query(
    `UPDATE budget_alerts
    SET email_sent = TRUE,
        email_sent_at = CURRENT_TIMESTAMP
    WHERE id = $1`,
    [alertId]
  );
};

/**
 * Get alert statistics
 */
export const getAlertStatistics = async (
  userId?: number,
  startDate?: Date,
  endDate?: Date
): Promise<
  Array<{
    alert_type: string;
    alert_level: string;
    count: number;
  }>
> => {
  const result = await query(
    `SELECT * FROM get_alert_statistics($1, $2, $3)`,
    [userId || null, startDate || null, endDate || null]
  );

  return result.rows.map(row => ({
    alert_type: row.alert_type,
    alert_level: row.alert_level,
    count: parseInt(row.count),
  }));
};

/**
 * Get recent unsent alerts
 */
export const getUnsentAlerts = async (limit: number = 100): Promise<BudgetAlert[]> => {
  const result = await query(
    `SELECT * FROM budget_alerts
    WHERE email_sent = FALSE
      AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
    ORDER BY created_at DESC
    LIMIT $1`,
    [limit]
  );

  return result.rows;
};

/**
 * Delete old alerts (data retention)
 */
export const deleteOldAlerts = async (monthsToKeep: number = 12): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);

  const result = await query(
    `DELETE FROM budget_alerts
    WHERE created_at < $1
    RETURNING id`,
    [cutoffDate]
  );

  return result.rowCount || 0;
};
