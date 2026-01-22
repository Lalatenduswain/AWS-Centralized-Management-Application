/**
 * Budget Alerts Service
 *
 * Checks user budgets and sends alerts when thresholds are exceeded.
 * Runs periodically to monitor spending and notify users.
 */

import { getUsersNeedingAlerts } from '../models/UserBudget';
import { createBudgetAlert, shouldSendAlert } from '../models/BudgetAlert';
import { emailService } from './email.service';
import { findUserById } from '../models/User';

interface BudgetStatusWithUser {
  user_id: number;
  email: string;
  budget_id: number;
  monthly_limit: number;
  current_spending: number;
  percentage_used: number;
  alert_threshold: number;
  is_over_budget: boolean;
  remaining_budget: number;
  days_left_in_month: number;
  currency: string;
  last_alert_sent: Date | null;
}

/**
 * Check all budgets and send alerts where necessary
 */
export const checkBudgetsAndSendAlerts = async (): Promise<{
  checked: number;
  alertsSent: number;
  errors: number;
}> => {
  console.log('Starting budget alert check...');

  try {
    // Get all users who need budget alerts
    const usersNeedingAlerts = await getUsersNeedingAlerts();
    console.log(`Found ${usersNeedingAlerts.length} users needing alerts`);

    let alertsSent = 0;
    let errors = 0;

    // Process each user
    for (const userBudget of usersNeedingAlerts) {
      try {
        // Get user details
        const user = await findUserById(userBudget.user_id);
        if (!user) {
          console.warn(`User ${userBudget.user_id} not found, skipping alert`);
          continue;
        }

        const monthlyLimit = parseFloat(userBudget.monthly_limit.toString());
        const currentSpending = parseFloat(userBudget.current_spending.toString());
        const percentageUsed = parseFloat(userBudget.percentage_used.toString()) * 100;
        const isOverBudget = percentageUsed >= 100;
        const remainingBudget = monthlyLimit - currentSpending;

        // Calculate days left in month
        const now = new Date();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysLeftInMonth = Math.max(0, lastDayOfMonth.getDate() - now.getDate());

        const budgetData = {
          user_id: userBudget.user_id,
          email: userBudget.email,
          budget_id: userBudget.budget_id,
          monthly_limit: monthlyLimit,
          current_spending: currentSpending,
          percentage_used: percentageUsed,
          alert_threshold: parseFloat(userBudget.alert_threshold.toString()),
          is_over_budget: isOverBudget,
          remaining_budget: remainingBudget,
          days_left_in_month: daysLeftInMonth,
          currency: 'USD', // Default currency
          last_alert_sent: null,
        };

        // Determine alert type and send appropriate alert
        if (budgetData.is_over_budget) {
          await sendOverBudgetAlert(budgetData);
          alertsSent++;
        } else if (budgetData.percentage_used >= budgetData.alert_threshold * 100) {
          await sendThresholdAlert(budgetData);
          alertsSent++;
        }
      } catch (error) {
        console.error(`Error processing alert for user ${userBudget.user_id}:`, error);
        errors++;
      }
    }

    console.log(`Budget alert check complete. Alerts sent: ${alertsSent}, Errors: ${errors}`);

    return {
      checked: usersNeedingAlerts.length,
      alertsSent,
      errors,
    };
  } catch (error) {
    console.error('Error in budget alerts check:', error);
    throw error;
  }
};

/**
 * Send threshold alert (user approaching budget limit)
 */
const sendThresholdAlert = async (budgetData: BudgetStatusWithUser): Promise<void> => {
  // Check if we should send this alert (prevent duplicates)
  const shouldSend = await shouldSendAlert(budgetData.user_id, budgetData.budget_id, 'threshold');

  if (!shouldSend) {
    console.log(
      `Threshold alert already sent recently for user ${budgetData.user_id}, skipping`
    );
    return;
  }

  console.log(
    `Sending threshold alert to user ${budgetData.user_id} (${budgetData.percentage_used.toFixed(1)}% used)`
  );

  // Create alert record
  const alert = await createBudgetAlert({
    user_id: budgetData.user_id,
    budget_id: budgetData.budget_id,
    alert_type: 'threshold',
    alert_level: budgetData.percentage_used >= 90 ? 'warning' : 'info',
    percentage_used: budgetData.percentage_used,
    amount_spent: budgetData.current_spending,
    budget_limit: budgetData.monthly_limit,
    message: `Budget threshold alert: ${budgetData.percentage_used.toFixed(1)}% of monthly limit used`,
  });

  // Send email
  const emailSent = await emailService.sendBudgetAlert(
    budgetData.email,
    budgetData.email.split('@')[0], // Use email username as fallback for name
    {
      monthlyLimit: budgetData.monthly_limit,
      currentSpending: budgetData.current_spending,
      percentageUsed: budgetData.percentage_used,
      remainingBudget: budgetData.remaining_budget,
      daysLeftInMonth: budgetData.days_left_in_month,
      currency: budgetData.currency,
    }
  );

  if (emailSent) {
    // Mark alert as sent
    await createBudgetAlert({
      ...alert,
      email_sent: true,
    });
    console.log(`Threshold alert email sent successfully to ${budgetData.email}`);
  } else {
    console.error(`Failed to send threshold alert email to ${budgetData.email}`);
  }
};

/**
 * Send over-budget alert (user exceeded budget limit)
 */
const sendOverBudgetAlert = async (budgetData: BudgetStatusWithUser): Promise<void> => {
  // Check if we should send this alert (prevent duplicates)
  const shouldSend = await shouldSendAlert(
    budgetData.user_id,
    budgetData.budget_id,
    'over_budget'
  );

  if (!shouldSend) {
    console.log(`Over-budget alert already sent recently for user ${budgetData.user_id}, skipping`);
    return;
  }

  console.log(
    `Sending over-budget alert to user ${budgetData.user_id} (${budgetData.percentage_used.toFixed(1)}% used)`
  );

  const overageAmount = budgetData.current_spending - budgetData.monthly_limit;

  // Create alert record
  const alert = await createBudgetAlert({
    user_id: budgetData.user_id,
    budget_id: budgetData.budget_id,
    alert_type: 'over_budget',
    alert_level: 'critical',
    percentage_used: budgetData.percentage_used,
    amount_spent: budgetData.current_spending,
    budget_limit: budgetData.monthly_limit,
    message: `CRITICAL: Budget exceeded by ${overageAmount.toFixed(2)} ${budgetData.currency}`,
  });

  // Send email
  const emailSent = await emailService.sendOverBudgetAlert(
    budgetData.email,
    budgetData.email.split('@')[0], // Use email username as fallback for name
    {
      monthlyLimit: budgetData.monthly_limit,
      currentSpending: budgetData.current_spending,
      overageAmount,
      currency: budgetData.currency,
    }
  );

  if (emailSent) {
    // Mark alert as sent
    await createBudgetAlert({
      ...alert,
      email_sent: true,
    });
    console.log(`Over-budget alert email sent successfully to ${budgetData.email}`);
  } else {
    console.error(`Failed to send over-budget alert email to ${budgetData.email}`);
  }
};

/**
 * Send daily cost summary to a user
 */
export const sendDailyCostSummary = async (
  userId: number,
  userEmail: string,
  userName: string,
  costData: {
    yesterdayCost: number;
    monthToDateCost: number;
    averageDailyCost: number;
    topServices: Array<{ service_name: string; cost: number }>;
    currency: string;
  }
): Promise<boolean> => {
  console.log(`Sending daily cost summary to user ${userId}`);

  // Send email
  const emailSent = await emailService.sendDailyCostSummary(userEmail, userName, costData);

  if (emailSent) {
    console.log(`Daily cost summary sent successfully to ${userEmail}`);
  } else {
    console.error(`Failed to send daily cost summary to ${userEmail}`);
  }

  return emailSent;
};
