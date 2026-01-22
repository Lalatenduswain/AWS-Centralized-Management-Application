/**
 * Billing Service
 *
 * Integrates with AWS Cost Explorer to fetch actual cost data.
 * Processes and stores billing records for users and resources.
 *
 * IMPORTANT: AWS Cost Explorer has a delay of 24-48 hours for cost data.
 * Data is updated once daily, typically around midnight UTC.
 */

import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostAndUsageCommandInput,
  GetCostForecastCommand,
  Granularity,
  Metric,
} from '@aws-sdk/client-cost-explorer';
import { getClientWithCredentials } from '../models/Client';
import { decryptAWSCredentials } from './encryption.service';
import {
  bulkCreateBillingRecords,
  BillingRecordInput,
} from '../models/BillingRecord';
import { getResourceAssignment } from '../models/ResourceAssignment';

/**
 * Create Cost Explorer client for a specific client
 */
const createCostExplorerClient = async (clientId: number): Promise<CostExplorerClient> => {
  const client = await getClientWithCredentials(clientId);

  if (!client) {
    throw new Error('Client not found');
  }

  const credentials = decryptAWSCredentials(
    client.access_key_id_encrypted,
    client.secret_access_key_encrypted,
    client.encryption_iv
  );

  return new CostExplorerClient({
    region: client.region || 'us-east-1',
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });
};

/**
 * Fetch cost data from AWS Cost Explorer
 * @param clientId - Client ID
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param granularity - DAILY or MONTHLY
 */
export const fetchCostData = async (
  clientId: number,
  startDate: string,
  endDate: string,
  granularity: Granularity = Granularity.DAILY
): Promise<any> => {
  try {
    const costExplorer = await createCostExplorerClient(clientId);

    const params: GetCostAndUsageCommandInput = {
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: granularity,
      Metrics: [Metric.UNBLENDED_COST, Metric.USAGE_QUANTITY],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE',
        },
      ],
    };

    const command = new GetCostAndUsageCommand(params);
    const response = await costExplorer.send(command);

    return response.ResultsByTime || [];
  } catch (error: any) {
    console.error('Error fetching cost data from AWS:', error);
    throw new Error(`Failed to fetch cost data: ${error.message}`);
  }
};

/**
 * Fetch cost data grouped by resource
 * Uses tags or resource IDs to identify specific resources
 */
export const fetchCostByResource = async (
  clientId: number,
  startDate: string,
  endDate: string
): Promise<any> => {
  try {
    const costExplorer = await createCostExplorerClient(clientId);

    const params: GetCostAndUsageCommandInput = {
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: Granularity.DAILY,
      Metrics: [Metric.UNBLENDED_COST],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'RESOURCE_ID',
        },
        {
          Type: 'DIMENSION',
          Key: 'SERVICE',
        },
      ],
    };

    const command = new GetCostAndUsageCommand(params);
    const response = await costExplorer.send(command);

    return response.ResultsByTime || [];
  } catch (error: any) {
    console.error('Error fetching cost by resource:', error);
    // Fallback to service-level data if resource-level fails
    return fetchCostData(clientId, startDate, endDate);
  }
};

/**
 * Get cost forecast for next month
 */
export const fetchCostForecast = async (
  clientId: number,
  startDate: string,
  endDate: string
): Promise<number> => {
  try {
    const costExplorer = await createCostExplorerClient(clientId);

    const command = new GetCostForecastCommand({
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Metric: Metric.UNBLENDED_COST,
      Granularity: Granularity.MONTHLY,
    });

    const response = await costExplorer.send(command);

    if (response.Total?.Amount) {
      return parseFloat(response.Total.Amount);
    }

    return 0;
  } catch (error: any) {
    console.error('Error fetching cost forecast:', error);
    return 0;
  }
};

/**
 * Sync cost data for a client
 * Fetches cost data from AWS and stores in billing_records
 * @param clientId - Client ID
 * @param userId - User ID to assign costs to
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 */
export const syncCostDataForClient = async (
  clientId: number,
  userId: number,
  startDate: string,
  endDate: string
): Promise<{ recordsCreated: number; totalCost: number }> => {
  try {
    // Fetch cost data from AWS
    const costData = await fetchCostData(clientId, startDate, endDate, Granularity.DAILY);

    const billingRecords: BillingRecordInput[] = [];
    let totalCost = 0;

    // Process each time period
    for (const timePeriod of costData) {
      const date = timePeriod.TimePeriod?.Start;
      if (!date) continue;

      // Process each service group
      for (const group of timePeriod.Groups || []) {
        const serviceName = group.Keys?.[0] || 'Unknown';
        const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
        const usageQuantity = parseFloat(group.Metrics?.UsageQuantity?.Amount || '0');

        if (cost > 0) {
          totalCost += cost;

          billingRecords.push({
            user_id: userId,
            client_id: clientId,
            resource_id: `${serviceName}-${date}`, // Temporary ID for service-level data
            resource_type: mapServiceToResourceType(serviceName),
            service_name: serviceName,
            cost,
            usage_quantity: usageQuantity,
            usage_unit: group.Metrics?.UsageQuantity?.Unit || null,
            billing_date: new Date(date),
          });
        }
      }
    }

    // Bulk insert records
    const recordsCreated = await bulkCreateBillingRecords(billingRecords);

    return { recordsCreated, totalCost };
  } catch (error: any) {
    console.error('Error syncing cost data:', error);
    throw new Error(`Failed to sync cost data: ${error.message}`);
  }
};

/**
 * Sync cost data with resource assignments
 * Matches AWS resources to user assignments and creates billing records
 */
export const syncCostDataWithAssignments = async (
  clientId: number,
  startDate: string,
  endDate: string
): Promise<{ recordsCreated: number; totalCost: number }> => {
  try {
    // Fetch cost data grouped by resource
    const costData = await fetchCostByResource(clientId, startDate, endDate);

    const billingRecords: BillingRecordInput[] = [];
    let totalCost = 0;

    // Process each time period
    for (const timePeriod of costData) {
      const date = timePeriod.TimePeriod?.Start;
      if (!date) continue;

      // Process each resource group
      for (const group of timePeriod.Groups || []) {
        const resourceId = group.Keys?.[0] || '';
        const serviceName = group.Keys?.[1] || 'Unknown';
        const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');

        if (cost > 0 && resourceId) {
          totalCost += cost;

          // Try to find resource assignment
          const resourceType = mapServiceToResourceType(serviceName);
          const assignment = await getResourceAssignment(clientId, resourceType, resourceId);

          if (assignment) {
            // Resource is assigned to a user
            billingRecords.push({
              user_id: assignment.user_id,
              client_id: clientId,
              resource_id: resourceId,
              resource_type: resourceType,
              service_name: serviceName,
              cost,
              billing_date: new Date(date),
            });
          }
          // If no assignment found, skip or assign to default user
        }
      }
    }

    // Bulk insert records
    const recordsCreated = await bulkCreateBillingRecords(billingRecords);

    return { recordsCreated, totalCost };
  } catch (error: any) {
    console.error('Error syncing cost data with assignments:', error);
    throw new Error(`Failed to sync cost data: ${error.message}`);
  }
};

/**
 * Sync yesterday's cost data (for daily cron job)
 */
export const syncYesterdayCosts = async (
  clientId: number,
  userId: number
): Promise<{ recordsCreated: number; totalCost: number }> => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const today = new Date();

  const startDate = yesterday.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  return syncCostDataForClient(clientId, userId, startDate, endDate);
};

/**
 * Sync current month's cost data
 */
export const syncCurrentMonthCosts = async (
  clientId: number,
  userId: number
): Promise<{ recordsCreated: number; totalCost: number }> => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date();

  const startDate = firstDay.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  return syncCostDataForClient(clientId, userId, startDate, endDate);
};

/**
 * Map AWS service name to resource type
 */
const mapServiceToResourceType = (serviceName: string): string => {
  const serviceMap: { [key: string]: string } = {
    'Amazon Elastic Compute Cloud': 'ec2',
    'EC2': 'ec2',
    'Amazon Simple Storage Service': 's3',
    'S3': 's3',
    'Amazon Relational Database Service': 'rds',
    'RDS': 'rds',
    'AWS Lambda': 'lambda',
    'Lambda': 'lambda',
    'Amazon CloudFront': 'cloudfront',
    'Amazon Route 53': 'route53',
    'Amazon Virtual Private Cloud': 'vpc',
    'Amazon Elastic Load Balancing': 'elb',
    'Amazon CloudWatch': 'cloudwatch',
  };

  for (const [key, value] of Object.entries(serviceMap)) {
    if (serviceName.includes(key)) {
      return value;
    }
  }

  return 'other';
};

/**
 * Get cost summary for a period
 */
export const getCostSummary = async (
  clientId: number,
  startDate: string,
  endDate: string
): Promise<{
  totalCost: number;
  currency: string;
  breakdown: Array<{ service: string; cost: number }>;
}> => {
  try {
    const costData = await fetchCostData(clientId, startDate, endDate, Granularity.MONTHLY);

    let totalCost = 0;
    const breakdown: Array<{ service: string; cost: number }> = [];

    if (costData.length > 0) {
      const period = costData[0];

      for (const group of period.Groups || []) {
        const serviceName = group.Keys?.[0] || 'Unknown';
        const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');

        totalCost += cost;
        breakdown.push({ service: serviceName, cost });
      }
    }

    return {
      totalCost,
      currency: 'USD',
      breakdown: breakdown.sort((a, b) => b.cost - a.cost),
    };
  } catch (error: any) {
    console.error('Error getting cost summary:', error);
    throw new Error(`Failed to get cost summary: ${error.message}`);
  }
};
