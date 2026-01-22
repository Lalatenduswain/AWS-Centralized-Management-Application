/**
 * Cron Jobs Service
 *
 * Schedules and manages recurring jobs:
 * - Budget alerts checking (every hour)
 * - Daily cost sync from AWS (daily at 1 AM)
 * - Weekly cost reports (weekly on Monday)
 * - Monthly reports (monthly on 1st)
 */

import * as cron from 'node-cron';
import { checkBudgetsAndSendAlerts } from './budget-alerts.service';
import { getAllClients } from '../models/Client';
import { syncYesterdayCosts } from './billing.service';
import { getAllUsers } from '../models/User';

class CronJobsService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.initializeJobs();
  }

  /**
   * Initialize all cron jobs
   */
  private initializeJobs() {
    console.log('Initializing cron jobs...');

    // Check if cron jobs are enabled
    if (process.env.ENABLE_CRON_JOBS === 'false') {
      console.log('Cron jobs are disabled via environment variable');
      return;
    }

    // Budget alerts check - every hour
    this.scheduleBudgetAlertsCheck();

    // Daily cost sync - every day at 1 AM
    this.scheduleDailyCostSync();

    // Cleanup old data - every Sunday at 2 AM
    this.scheduleDataCleanup();

    console.log(`✓ Initialized ${this.jobs.size} cron jobs`);
  }

  /**
   * Schedule budget alerts check (hourly)
   */
  private scheduleBudgetAlertsCheck() {
    const jobName = 'budget-alerts-check';

    // Run every hour at minute 0
    const job = cron.schedule('0 * * * *', async () => {
      console.log(`[${new Date().toISOString()}] Running budget alerts check...`);
      try {
        const result = await checkBudgetsAndSendAlerts();
        console.log(
          `Budget alerts check completed: ${result.alertsSent} alerts sent, ${result.errors} errors`
        );
      } catch (error) {
        console.error('Error in budget alerts check cron job:', error);
      }
    });

    this.jobs.set(jobName, job);
    console.log(`✓ Scheduled job: ${jobName} (every hour at :00)`);
  }

  /**
   * Schedule daily cost sync from AWS (daily at 1 AM)
   */
  private scheduleDailyCostSync() {
    const jobName = 'daily-cost-sync';

    // Run every day at 1:00 AM
    const job = cron.schedule('0 1 * * *', async () => {
      console.log(`[${new Date().toISOString()}] Running daily cost sync...`);
      try {
        // Get all clients
        const clients = await getAllClients();
        console.log(`Syncing costs for ${clients.length} clients...`);

        let successCount = 0;
        let errorCount = 0;

        // Sync costs for each client
        for (const client of clients) {
          try {
            // For now, sync to the first user (admin)
            // In production, you might want to sync to the client owner or all users
            const users = await getAllUsers();
            if (users.length > 0) {
              const result = await syncYesterdayCosts(client.id, users[0].id);
              console.log(
                `Synced ${result.recordsCreated} records for client ${client.client_name}`
              );
              successCount++;
            }
          } catch (error) {
            console.error(`Error syncing costs for client ${client.client_name}:`, error);
            errorCount++;
          }
        }

        console.log(
          `Daily cost sync completed: ${successCount} clients synced, ${errorCount} errors`
        );
      } catch (error) {
        console.error('Error in daily cost sync cron job:', error);
      }
    });

    this.jobs.set(jobName, job);
    console.log(`✓ Scheduled job: ${jobName} (daily at 1:00 AM)`);
  }

  /**
   * Schedule data cleanup (weekly on Sunday at 2 AM)
   */
  private scheduleDataCleanup() {
    const jobName = 'data-cleanup';

    // Run every Sunday at 2:00 AM
    const job = cron.schedule('0 2 * * 0', async () => {
      console.log(`[${new Date().toISOString()}] Running data cleanup...`);
      try {
        // Import cleanup functions
        const { deleteOldBillingRecords } = await import('../models/BillingRecord');
        const { deleteOldAlerts } = await import('../models/BudgetAlert');
        const { deleteOldActivityLogs } = await import('../models/ActivityLog');

        // Clean up old billing records (keep 24 months)
        const billingDeleted = await deleteOldBillingRecords(24);
        console.log(`Deleted ${billingDeleted} old billing records`);

        // Clean up old alerts (keep 12 months)
        const alertsDeleted = await deleteOldAlerts(12);
        console.log(`Deleted ${alertsDeleted} old alert records`);

        // Clean up old activity logs (keep 6 months)
        const logsDeleted = await deleteOldActivityLogs(6);
        console.log(`Deleted ${logsDeleted} old activity logs`);

        console.log('Data cleanup completed successfully');
      } catch (error) {
        console.error('Error in data cleanup cron job:', error);
      }
    });

    this.jobs.set(jobName, job);
    console.log(`✓ Scheduled job: ${jobName} (weekly on Sunday at 2:00 AM)`);
  }

  /**
   * Stop all cron jobs
   */
  stopAll() {
    console.log('Stopping all cron jobs...');
    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      console.log(`Stopped job: ${name}`);
    }
    this.jobs.clear();
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    const status: { [key: string]: string } = {};
    for (const [name, job] of this.jobs.entries()) {
      status[name] = 'running';
    }
    return status;
  }

  /**
   * Run a specific job manually (for testing)
   */
  async runJob(jobName: string): Promise<void> {
    console.log(`Manually running job: ${jobName}`);

    switch (jobName) {
      case 'budget-alerts-check':
        await checkBudgetsAndSendAlerts();
        break;
      case 'daily-cost-sync':
        // Implement manual sync logic
        console.log('Manual cost sync not yet implemented');
        break;
      case 'data-cleanup':
        // Implement manual cleanup logic
        console.log('Manual data cleanup not yet implemented');
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}

// Export singleton instance
export const cronJobsService = new CronJobsService();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping cron jobs...');
  cronJobsService.stopAll();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping cron jobs...');
  cronJobsService.stopAll();
});
