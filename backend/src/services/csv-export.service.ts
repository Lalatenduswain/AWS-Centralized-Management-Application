/**
 * CSV Export Service
 *
 * Exports billing data, cost reports, and budget information to CSV format.
 * Uses papaparse for CSV generation with proper formatting.
 */

import papa from 'papaparse';
import { getUserBillingRecords, getUserCostByService, getUserDailyCosts, getTopCostDrivers } from '../models/BillingRecord';
import { getUserBudgets } from '../models/UserBudget';
import { getUserResourceAssignments } from '../models/ResourceAssignment';
import { getUserAlerts } from '../models/BudgetAlert';

/**
 * Export billing records to CSV
 */
export const exportBillingRecordsToCSV = async (
  userId: number,
  startDate?: Date,
  endDate?: Date
): Promise<string> => {
  const records = await getUserBillingRecords(userId, startDate, endDate);

  const data = records.map(record => ({
    'Date': new Date(record.billing_date).toISOString().split('T')[0],
    'Billing Period': record.billing_period,
    'Service': record.service_name,
    'Resource Type': record.resource_type,
    'Resource ID': record.resource_id,
    'Cost': parseFloat(record.cost.toString()).toFixed(2),
    'Currency': record.currency,
    'Usage Quantity': record.usage_quantity || '',
    'Usage Unit': record.usage_unit || '',
    'Data Source': record.data_source,
  }));

  return papa.unparse(data, {
    quotes: true,
    header: true,
  });
};

/**
 * Export cost breakdown by service to CSV
 */
export const exportCostBreakdownToCSV = async (
  userId: number,
  billingPeriod: string
): Promise<string> => {
  const breakdown = await getUserCostByService(userId, billingPeriod);

  const data = breakdown.map(item => ({
    'Service': item.service_name,
    'Total Cost': parseFloat(item.total_cost.toString()).toFixed(2),
    'Resource Count': item.resource_count,
    'Percentage': '', // Will be calculated
  }));

  // Calculate total for percentages
  const totalCost = breakdown.reduce((sum, item) => sum + parseFloat(item.total_cost.toString()), 0);

  data.forEach((item, index) => {
    const cost = parseFloat(item['Total Cost']);
    item['Percentage'] = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(2) + '%' : '0%';
  });

  return papa.unparse(data, {
    quotes: true,
    header: true,
  });
};

/**
 * Export daily costs to CSV
 */
export const exportDailyCostsToCSV = async (
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<string> => {
  const dailyCosts = await getUserDailyCosts(userId, startDate, endDate);

  const data = dailyCosts.map(day => ({
    'Date': new Date(day.billing_date).toISOString().split('T')[0],
    'Total Cost': parseFloat(day.total_cost.toString()).toFixed(2),
  }));

  return papa.unparse(data, {
    quotes: true,
    header: true,
  });
};

/**
 * Export top cost drivers to CSV
 */
export const exportTopDriversToCSV = async (
  userId: number,
  billingPeriod: string,
  limit: number = 50
): Promise<string> => {
  const drivers = await getTopCostDrivers(userId, billingPeriod, limit);

  const data = drivers.map((driver, index) => ({
    'Rank': index + 1,
    'Resource ID': driver.resource_id,
    'Resource Type': driver.resource_type,
    'Service': driver.service_name,
    'Total Cost': parseFloat(driver.total_cost.toString()).toFixed(2),
  }));

  return papa.unparse(data, {
    quotes: true,
    header: true,
  });
};

/**
 * Export budgets to CSV
 */
export const exportBudgetsToCSV = async (userId: number): Promise<string> => {
  const budgets = await getUserBudgets(userId);

  const data = budgets.map(budget => {
    const isActive = !budget.end_date || new Date(budget.end_date) >= new Date();
    return {
      'Monthly Limit': parseFloat(budget.monthly_limit.toString()).toFixed(2),
      'Currency': budget.currency,
      'Alert Threshold': (budget.alert_threshold * 100).toFixed(0) + '%',
      'Alerts Enabled': budget.alerts_enabled ? 'Yes' : 'No',
      'Start Date': budget.start_date ? new Date(budget.start_date).toISOString().split('T')[0] : '',
      'End Date': budget.end_date ? new Date(budget.end_date).toISOString().split('T')[0] : '',
      'Status': isActive ? 'Active' : 'Inactive',
      'Created': new Date(budget.created_at).toISOString().split('T')[0],
    };
  });

  return papa.unparse(data, {
    quotes: true,
    header: true,
  });
};

/**
 * Export resource assignments to CSV
 */
export const exportResourceAssignmentsToCSV = async (userId: number): Promise<string> => {
  const assignments = await getUserResourceAssignments(userId);

  const data = assignments.map(assignment => ({
    'Resource Type': assignment.resource_type,
    'Resource ID': assignment.resource_id,
    'Resource Name': assignment.resource_name || '',
    'Cost Center': assignment.cost_center || '',
    'Notes': assignment.notes || '',
    'Assigned Date': new Date(assignment.assigned_at).toISOString().split('T')[0],
  }));

  return papa.unparse(data, {
    quotes: true,
    header: true,
  });
};

/**
 * Export budget alerts history to CSV
 */
export const exportAlertsToCSV = async (userId: number, limit: number = 100): Promise<string> => {
  const alerts = await getUserAlerts(userId, limit);

  const data = alerts.map(alert => ({
    'Date': new Date(alert.created_at).toISOString().split('T')[0],
    'Time': new Date(alert.created_at).toTimeString().split(' ')[0],
    'Alert Type': alert.alert_type,
    'Alert Level': alert.alert_level,
    'Percentage Used': alert.percentage_used ? alert.percentage_used.toFixed(2) + '%' : '',
    'Amount Spent': alert.amount_spent ? parseFloat(alert.amount_spent.toString()).toFixed(2) : '',
    'Budget Limit': alert.budget_limit ? parseFloat(alert.budget_limit.toString()).toFixed(2) : '',
    'Email Sent': alert.email_sent ? 'Yes' : 'No',
    'Message': alert.message || '',
  }));

  return papa.unparse(data, {
    quotes: true,
    header: true,
  });
};

/**
 * Export comprehensive monthly report to CSV
 */
export const exportMonthlyReportToCSV = async (
  userId: number,
  billingPeriod: string
): Promise<string> => {
  const [breakdown, budget] = await Promise.all([
    getUserCostByService(userId, billingPeriod),
    getUserBudgets(userId),
  ]);

  const totalCost = breakdown.reduce((sum, item) => sum + parseFloat(item.total_cost.toString()), 0);
  const activeBudget = budget.find(b => !b.end_date || new Date(b.end_date) >= new Date());

  // Summary section
  const summary = [
    ['MONTHLY BILLING REPORT'],
    ['Period', billingPeriod],
    ['Total Cost', totalCost.toFixed(2) + ' USD'],
    [''],
  ];

  if (activeBudget) {
    const monthlyLimit = parseFloat(activeBudget.monthly_limit.toString());
    const percentageUsed = totalCost > 0 ? ((totalCost / monthlyLimit) * 100).toFixed(2) : '0.00';
    summary.push(
      ['Budget Limit', monthlyLimit.toFixed(2) + ' ' + activeBudget.currency],
      ['Budget Used', percentageUsed + '%'],
      ['Remaining', (monthlyLimit - totalCost).toFixed(2) + ' ' + activeBudget.currency],
      ['']
    );
  }

  // Cost breakdown section
  summary.push(['COST BREAKDOWN BY SERVICE'], ['Service', 'Cost', 'Percentage']);

  breakdown.forEach(item => {
    const cost = parseFloat(item.total_cost.toString());
    const percentage = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(2) : '0.00';
    summary.push([item.service_name, cost.toFixed(2), percentage + '%']);
  });

  return papa.unparse(summary, {
    quotes: false,
    header: false,
  });
};
