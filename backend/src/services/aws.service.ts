/**
 * AWS Integration Service
 *
 * Handles all AWS API interactions.
 * Uses AWS SDK v3 to interact with EC2, S3, RDS, and Cost Explorer services.
 *
 * SECURITY NOTE:
 * - Credentials are decrypted only when needed for AWS API calls
 * - Never log or expose decrypted credentials
 */

import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  Instance,
} from '@aws-sdk/client-ec2';
import { S3Client, ListBucketsCommand, Bucket } from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand, DBInstance } from '@aws-sdk/client-rds';
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostAndUsageCommandInput,
} from '@aws-sdk/client-cost-explorer';
import { getClientWithCredentials } from '../models/Client';
import { decryptAWSCredentials } from './encryption.service';

/**
 * Get AWS credentials for a client
 * Decrypts stored credentials and returns them
 */
const getAWSCredentials = async (clientId: number) => {
  const client = await getClientWithCredentials(clientId);

  if (!client) {
    throw new Error('Client not found');
  }

  // Decrypt credentials
  const credentials = decryptAWSCredentials(
    client.access_key_id_encrypted,
    client.secret_access_key_encrypted,
    client.encryption_iv
  );

  return {
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    region: client.region,
  };
};

/**
 * Create an EC2 client for a specific customer
 */
const createEC2Client = async (clientId: number) => {
  const credentials = await getAWSCredentials(clientId);

  return new EC2Client({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });
};

/**
 * Create an S3 client for a specific customer
 */
const createS3Client = async (clientId: number) => {
  const credentials = await getAWSCredentials(clientId);

  return new S3Client({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });
};

/**
 * Create an RDS client for a specific customer
 */
const createRDSClient = async (clientId: number) => {
  const credentials = await getAWSCredentials(clientId);

  return new RDSClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });
};

/**
 * Create a Cost Explorer client for a specific customer
 */
const createCostExplorerClient = async (clientId: number) => {
  const credentials = await getAWSCredentials(clientId);

  return new CostExplorerClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });
};

/**
 * List all EC2 instances for a client
 */
export const listEC2Instances = async (clientId: number): Promise<Instance[]> => {
  try {
    const ec2Client = await createEC2Client(clientId);

    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);

    const instances: Instance[] = [];

    // Extract instances from reservations
    if (response.Reservations) {
      for (const reservation of response.Reservations) {
        if (reservation.Instances) {
          instances.push(...reservation.Instances);
        }
      }
    }

    return instances;
  } catch (error: any) {
    console.error('Error listing EC2 instances:', error);
    throw new Error(`Failed to list EC2 instances: ${error.message}`);
  }
};

/**
 * Start an EC2 instance
 */
export const startEC2Instance = async (clientId: number, instanceId: string): Promise<void> => {
  try {
    const ec2Client = await createEC2Client(clientId);

    const command = new StartInstancesCommand({
      InstanceIds: [instanceId],
    });

    await ec2Client.send(command);
  } catch (error: any) {
    console.error('Error starting EC2 instance:', error);
    throw new Error(`Failed to start EC2 instance: ${error.message}`);
  }
};

/**
 * Stop an EC2 instance
 */
export const stopEC2Instance = async (clientId: number, instanceId: string): Promise<void> => {
  try {
    const ec2Client = await createEC2Client(clientId);

    const command = new StopInstancesCommand({
      InstanceIds: [instanceId],
    });

    await ec2Client.send(command);
  } catch (error: any) {
    console.error('Error stopping EC2 instance:', error);
    throw new Error(`Failed to stop EC2 instance: ${error.message}`);
  }
};

/**
 * List all S3 buckets for a client
 */
export const listS3Buckets = async (clientId: number): Promise<Bucket[]> => {
  try {
    const s3Client = await createS3Client(clientId);

    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    return response.Buckets || [];
  } catch (error: any) {
    console.error('Error listing S3 buckets:', error);
    throw new Error(`Failed to list S3 buckets: ${error.message}`);
  }
};

/**
 * List all RDS instances for a client
 */
export const listRDSInstances = async (clientId: number): Promise<DBInstance[]> => {
  try {
    const rdsClient = await createRDSClient(clientId);

    const command = new DescribeDBInstancesCommand({});
    const response = await rdsClient.send(command);

    return response.DBInstances || [];
  } catch (error: any) {
    console.error('Error listing RDS instances:', error);
    throw new Error(`Failed to list RDS instances: ${error.message}`);
  }
};

/**
 * Get cost and usage data for a client
 * @param clientId - Client ID
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 */
export const getCostAndUsage = async (clientId: number, startDate: string, endDate: string): Promise<any> => {
  try {
    const costClient = await createCostExplorerClient(clientId);

    const params: GetCostAndUsageCommandInput = {
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: 'DAILY',
      Metrics: ['UnblendedCost', 'UsageQuantity'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE',
        },
      ],
    };

    const command = new GetCostAndUsageCommand(params);
    const response = await costClient.send(command);

    return response.ResultsByTime || [];
  } catch (error: any) {
    console.error('Error getting cost data:', error);
    throw new Error(`Failed to get cost data: ${error.message}`);
  }
};
