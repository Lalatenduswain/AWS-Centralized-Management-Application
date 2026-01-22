/**
 * User Budget Model
 *
 * Manages monthly spending limits and alert thresholds for users.
 * Tracks budget status and sends alerts when thresholds are exceeded.
 */

import { query } from '../config/database';

export interface UserBudget {
  id: number;
  user_id: number;
  monthly_limit: number;
  currency: string;
  alert_threshold: number;
  last_alert_sent: Date | null;
  alerts_enabled: boolean;
  start_date: Date;
  end_date: Date | null;
  created_at: Date;
  updated_at: Date;
  created_by: number | null;
}

export interface UserBudgetInput {
  user_id: number;
  monthly_limit: number;
  currency?: string;
  alert_threshold?: number;
  alerts_enabled?: boolean;
  start_date?: Date;
  end_date?: Date;
  created_by?: number;
}

/**
 * Create a new budget for a user
 */
export const createUserBudget = async (data: UserBudgetInput): Promise<UserBudget> => {
  const {
    user_id,
    monthly_limit,
    currency = 'USD',
    alert_threshold = 0.8,
    alerts_enabled = true,
    start_date = new Date(),
    end_date = null,
    created_by = null,
  } = data;

  const result = await query(
    `INSERT INTO user_budgets
    (user_id, monthly_limit, currency, alert_threshold, alerts_enabled, start_date, end_date, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [user_id, monthly_limit, currency, alert_threshold, alerts_enabled, start_date, end_date, created_by]
  );

  return result.rows[0];
};

/**
 * Get active budget for a user
 * Returns the most recent budget that is currently active
 */
export const getActiveBudgetForUser = async (userId: number): Promise<UserBudget | null> => {
  const result = await query(
    `SELECT * FROM user_budgets
    WHERE user_id = $1
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    ORDER BY created_at DESC
    LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
};

/**
 * Get all budgets for a user (including historical)
 */
export const getUserBudgets = async (userId: number): Promise<UserBudget[]> => {
  const result = await query(
    `SELECT * FROM user_budgets
    WHERE user_id = $1
    ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};

/**
 * Update a user budget
 */
export const updateUserBudget = async (
  id: number,
  updates: Partial<UserBudgetInput>
): Promise<UserBudget | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) {
    return null;
  }

  values.push(id);

  const result = await query(
    `UPDATE user_budgets
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Delete a budget
 */
export const deleteUserBudget = async (id: number): Promise<boolean> => {
  const result = await query('DELETE FROM user_budgets WHERE id = $1 RETURNING id', [id]);

  return result.rowCount ? result.rowCount > 0 : false;
};

/**
 * Check if user should receive a budget alert
 * Returns true if:
 * - User has an active budget
 * - Alerts are enabled
 * - Current spending exceeds alert threshold
 * - No alert sent in the last 24 hours
 */
export const shouldSendBudgetAlert = async (
  userId: number,
  currentSpending: number
): Promise<{ shouldAlert: boolean; budget: UserBudget | null; percentageUsed: number }> => {
  const budget = await getActiveBudgetForUser(userId);

  if (!budget || !budget.alerts_enabled) {
    return { shouldAlert: false, budget: null, percentageUsed: 0 };
  }

  const percentageUsed = currentSpending / budget.monthly_limit;

  // Don't send alert if below threshold
  if (percentageUsed < budget.alert_threshold) {
    return { shouldAlert: false, budget, percentageUsed };
  }

  // Don't send alert if one was sent in the last 24 hours
  if (budget.last_alert_sent) {
    const hoursSinceLastAlert =
      (Date.now() - new Date(budget.last_alert_sent).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastAlert < 24) {
      return { shouldAlert: false, budget, percentageUsed };
    }
  }

  return { shouldAlert: true, budget, percentageUsed };
};

/**
 * Mark that an alert was sent for a budget
 */
export const markAlertSent = async (budgetId: number): Promise<void> => {
  await query(
    `UPDATE user_budgets
    SET last_alert_sent = CURRENT_TIMESTAMP
    WHERE id = $1`,
    [budgetId]
  );
};

/**
 * Get all users who need budget alerts
 * Includes current spending calculation
 */
export const getUsersNeedingAlerts = async (): Promise<
  Array<{
    user_id: number;
    email: string;
    budget_id: number;
    monthly_limit: number;
    alert_threshold: number;
    current_spending: number;
    percentage_used: number;
  }>
> => {
  const result = await query(`
    SELECT
      b.user_id,
      u.email,
      b.id as budget_id,
      b.monthly_limit,
      b.alert_threshold,
      COALESCE(SUM(br.cost), 0) as current_spending,
      COALESCE(SUM(br.cost), 0) / b.monthly_limit as percentage_used
    FROM user_budgets b
    JOIN users u ON b.user_id = u.id
    LEFT JOIN billing_records br ON
      br.user_id = b.user_id AND
      br.billing_period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    WHERE
      b.alerts_enabled = true AND
      (b.end_date IS NULL OR b.end_date >= CURRENT_DATE) AND
      (b.last_alert_sent IS NULL OR b.last_alert_sent < CURRENT_TIMESTAMP - INTERVAL '24 hours')
    GROUP BY b.id, u.email
    HAVING COALESCE(SUM(br.cost), 0) / b.monthly_limit >= b.alert_threshold
    ORDER BY percentage_used DESC
  `);

  return result.rows;
};

/**
 * Get budget status for a user
 * Returns budget info with current spending
 */
export const getBudgetStatus = async (
  userId: number
): Promise<{
  budget: UserBudget | null;
  currentSpending: number;
  remainingBudget: number;
  percentageUsed: number;
  isOverBudget: boolean;
  daysLeftInMonth: number;
}> => {
  const budget = await getActiveBudgetForUser(userId);

  if (!budget) {
    return {
      budget: null,
      currentSpending: 0,
      remainingBudget: 0,
      percentageUsed: 0,
      isOverBudget: false,
      daysLeftInMonth: 0,
    };
  }

  // Get current spending for this month
  const spendingResult = await query(
    `SELECT COALESCE(SUM(cost), 0) as total
    FROM billing_records
    WHERE user_id = $1 AND billing_period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')`,
    [userId]
  );

  const currentSpending = parseFloat(spendingResult.rows[0].total);
  const remainingBudget = budget.monthly_limit - currentSpending;
  const percentageUsed = currentSpending / budget.monthly_limit;
  const isOverBudget = currentSpending > budget.monthly_limit;

  // Calculate days left in month
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeftInMonth = lastDay.getDate() - now.getDate();

  return {
    budget,
    currentSpending,
    remainingBudget,
    percentageUsed,
    isOverBudget,
    daysLeftInMonth,
  };
};
