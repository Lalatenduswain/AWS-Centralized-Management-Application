/**
 * Billing Record Model
 *
 * Stores daily cost data per user and AWS resource.
 * This is the core table for billing and cost tracking.
 */

import { query } from '../config/database';

export interface BillingRecord {
  id: number;
  user_id: number;
  client_id: number;
  resource_id: string;
  resource_type: string;
  service_name: string;
  cost: number;
  currency: string;
  usage_quantity: number | null;
  usage_unit: string | null;
  billing_period: string;
  billing_date: Date;
  recorded_at: Date;
  data_source: string;
}

export interface BillingRecordInput {
  user_id: number;
  client_id: number;
  resource_id: string;
  resource_type: string;
  service_name: string;
  cost: number;
  currency?: string;
  usage_quantity?: number;
  usage_unit?: string;
  billing_date: Date;
  data_source?: string;
}

/**
 * Create a new billing record
 */
export const createBillingRecord = async (data: BillingRecordInput): Promise<BillingRecord> => {
  const {
    user_id,
    client_id,
    resource_id,
    resource_type,
    service_name,
    cost,
    currency = 'USD',
    usage_quantity,
    usage_unit,
    billing_date,
    data_source = 'aws_cost_explorer',
  } = data;

  // Extract billing period from date (YYYY-MM)
  const billingPeriod = new Date(billing_date).toISOString().slice(0, 7);

  const result = await query(
    `INSERT INTO billing_records
    (user_id, client_id, resource_id, resource_type, service_name, cost, currency,
     usage_quantity, usage_unit, billing_period, billing_date, data_source)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (user_id, client_id, resource_id, billing_date)
    DO UPDATE SET
      cost = EXCLUDED.cost,
      usage_quantity = EXCLUDED.usage_quantity,
      recorded_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [
      user_id,
      client_id,
      resource_id,
      resource_type,
      service_name,
      cost,
      currency,
      usage_quantity,
      usage_unit,
      billingPeriod,
      billing_date,
      data_source,
    ]
  );

  return result.rows[0];
};

/**
 * Get billing records for a user
 */
export const getUserBillingRecords = async (
  userId: number,
  startDate?: Date,
  endDate?: Date
): Promise<BillingRecord[]> => {
  let queryText = 'SELECT * FROM billing_records WHERE user_id = $1';
  const params: any[] = [userId];

  if (startDate) {
    params.push(startDate);
    queryText += ` AND billing_date >= $${params.length}`;
  }

  if (endDate) {
    params.push(endDate);
    queryText += ` AND billing_date <= $${params.length}`;
  }

  queryText += ' ORDER BY billing_date DESC';

  const result = await query(queryText, params);
  return result.rows;
};

/**
 * Get total cost for a user in a billing period
 */
export const getUserCostForPeriod = async (userId: number, billingPeriod: string): Promise<number> => {
  const result = await query(
    `SELECT COALESCE(SUM(cost), 0) as total
    FROM billing_records
    WHERE user_id = $1 AND billing_period = $2`,
    [userId, billingPeriod]
  );

  return parseFloat(result.rows[0].total);
};

/**
 * Get cost breakdown by service for a user
 */
export const getUserCostByService = async (
  userId: number,
  billingPeriod: string
): Promise<Array<{ service_name: string; total_cost: number; resource_count: number }>> => {
  const result = await query(
    `SELECT
      service_name,
      SUM(cost) as total_cost,
      COUNT(DISTINCT resource_id) as resource_count
    FROM billing_records
    WHERE user_id = $1 AND billing_period = $2
    GROUP BY service_name
    ORDER BY total_cost DESC`,
    [userId, billingPeriod]
  );

  return result.rows;
};

/**
 * Get daily cost trend for a user
 */
export const getUserDailyCosts = async (
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<Array<{ billing_date: string; total_cost: number }>> => {
  const result = await query(
    `SELECT
      billing_date::date as billing_date,
      SUM(cost) as total_cost
    FROM billing_records
    WHERE user_id = $1
      AND billing_date >= $2
      AND billing_date <= $3
    GROUP BY billing_date::date
    ORDER BY billing_date`,
    [userId, startDate, endDate]
  );

  return result.rows;
};

/**
 * Get top cost drivers for a user
 */
export const getTopCostDrivers = async (
  userId: number,
  billingPeriod: string,
  limit: number = 10
): Promise<
  Array<{
    resource_id: string;
    resource_type: string;
    service_name: string;
    total_cost: number;
  }>
> => {
  const result = await query(
    `SELECT
      resource_id,
      resource_type,
      service_name,
      SUM(cost) as total_cost
    FROM billing_records
    WHERE user_id = $1 AND billing_period = $2
    GROUP BY resource_id, resource_type, service_name
    ORDER BY total_cost DESC
    LIMIT $3`,
    [userId, billingPeriod, limit]
  );

  return result.rows;
};

/**
 * Get billing summary for all users (admin view)
 */
export const getAllUsersBillingSummary = async (
  billingPeriod: string
): Promise<
  Array<{
    user_id: number;
    email: string;
    total_cost: number;
    resource_count: number;
  }>
> => {
  const result = await query(
    `SELECT
      br.user_id,
      u.email,
      SUM(br.cost) as total_cost,
      COUNT(DISTINCT br.resource_id) as resource_count
    FROM billing_records br
    JOIN users u ON br.user_id = u.id
    WHERE br.billing_period = $1
    GROUP BY br.user_id, u.email
    ORDER BY total_cost DESC`,
    [billingPeriod]
  );

  return result.rows;
};

/**
 * Bulk insert billing records
 * Useful for importing cost data from AWS Cost Explorer
 */
export const bulkCreateBillingRecords = async (records: BillingRecordInput[]): Promise<number> => {
  if (records.length === 0) return 0;

  const values: any[] = [];
  const placeholders: string[] = [];

  records.forEach((record, index) => {
    const offset = index * 12;
    const billingPeriod = new Date(record.billing_date).toISOString().slice(0, 7);

    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`
    );

    values.push(
      record.user_id,
      record.client_id,
      record.resource_id,
      record.resource_type,
      record.service_name,
      record.cost,
      record.currency || 'USD',
      record.usage_quantity || null,
      record.usage_unit || null,
      billingPeriod,
      record.billing_date,
      record.data_source || 'aws_cost_explorer'
    );
  });

  const result = await query(
    `INSERT INTO billing_records
    (user_id, client_id, resource_id, resource_type, service_name, cost, currency,
     usage_quantity, usage_unit, billing_period, billing_date, data_source)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (user_id, client_id, resource_id, billing_date) DO NOTHING
    RETURNING id`,
    values
  );

  return result.rowCount || 0;
};

/**
 * Get monthly cost trend (last N months)
 */
export const getMonthlyTrend = async (
  userId: number,
  months: number = 6
): Promise<Array<{ billing_period: string; total_cost: number }>> => {
  const result = await query(
    `SELECT
      billing_period,
      SUM(cost) as total_cost
    FROM billing_records
    WHERE user_id = $1
      AND billing_period >= TO_CHAR(CURRENT_DATE - INTERVAL '${months} months', 'YYYY-MM')
    GROUP BY billing_period
    ORDER BY billing_period`,
    [userId]
  );

  return result.rows;
};

/**
 * Forecast next month's cost based on current month's trend
 * Simple linear extrapolation based on daily average
 */
export const forecastNextMonthCost = async (userId: number): Promise<number> => {
  const currentPeriod = new Date().toISOString().slice(0, 7);

  const result = await query(
    `SELECT
      COUNT(DISTINCT billing_date) as days_with_data,
      SUM(cost) as total_cost
    FROM billing_records
    WHERE user_id = $1 AND billing_period = $2`,
    [userId, currentPeriod]
  );

  const { days_with_data, total_cost } = result.rows[0];

  if (!days_with_data || days_with_data === 0) {
    return 0;
  }

  const dailyAverage = total_cost / days_with_data;

  // Get days in next month
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();

  return dailyAverage * daysInNextMonth;
};

/**
 * Delete old billing records (for data retention)
 */
export const deleteOldBillingRecords = async (monthsToKeep: number = 24): Promise<number> => {
  const cutoffPeriod = new Date();
  cutoffPeriod.setMonth(cutoffPeriod.getMonth() - monthsToKeep);
  const cutoffString = cutoffPeriod.toISOString().slice(0, 7);

  const result = await query(
    `DELETE FROM billing_records
    WHERE billing_period < $1
    RETURNING id`,
    [cutoffString]
  );

  return result.rowCount || 0;
};
