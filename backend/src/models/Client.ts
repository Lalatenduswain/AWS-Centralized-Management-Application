/**
 * Client Model
 *
 * Represents an AWS client account in the system.
 * Stores encrypted AWS credentials securely.
 */

import { query } from '../config/database';

export interface Client {
  id: number;
  client_name: string;
  aws_account_id: string | null;
  access_key_id_encrypted: string;
  secret_access_key_encrypted: string;
  encryption_iv: string;
  region: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ClientInput {
  client_name: string;
  aws_account_id?: string;
  access_key_id_encrypted: string;
  secret_access_key_encrypted: string;
  encryption_iv: string;
  region?: string;
  notes?: string;
}

export interface ClientSafeOutput {
  id: number;
  client_name: string;
  aws_account_id: string | null;
  region: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new client with encrypted AWS credentials
 * @param clientData - Client data
 * @returns Created client object (without credentials)
 */
export const createClient = async (clientData: ClientInput): Promise<ClientSafeOutput> => {
  const {
    client_name,
    aws_account_id,
    access_key_id_encrypted,
    secret_access_key_encrypted,
    encryption_iv,
    region = 'us-east-1',
    notes,
  } = clientData;

  const result = await query(
    `INSERT INTO clients
    (client_name, aws_account_id, access_key_id_encrypted, secret_access_key_encrypted, encryption_iv, region, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, client_name, aws_account_id, region, notes, created_at, updated_at`,
    [client_name, aws_account_id, access_key_id_encrypted, secret_access_key_encrypted, encryption_iv, region, notes]
  );

  return result.rows[0];
};

/**
 * Get all clients (without credentials for security)
 * @returns Array of client objects
 */
export const getAllClients = async (): Promise<ClientSafeOutput[]> => {
  const result = await query(
    `SELECT id, client_name, aws_account_id, region, notes, created_at, updated_at
    FROM clients
    ORDER BY created_at DESC`
  );

  return result.rows;
};

/**
 * Get a client by ID (without credentials)
 * @param id - Client's ID
 * @returns Client object or null if not found
 */
export const getClientById = async (id: number): Promise<ClientSafeOutput | null> => {
  const result = await query(
    `SELECT id, client_name, aws_account_id, region, notes, created_at, updated_at
    FROM clients
    WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

/**
 * Get a client with encrypted credentials (for AWS operations)
 * @param id - Client's ID
 * @returns Client object with encrypted credentials or null if not found
 */
export const getClientWithCredentials = async (id: number): Promise<Client | null> => {
  const result = await query('SELECT * FROM clients WHERE id = $1', [id]);

  return result.rows[0] || null;
};

/**
 * Update a client
 * @param id - Client's ID
 * @param updates - Fields to update
 * @returns Updated client object
 */
export const updateClient = async (
  id: number,
  updates: Partial<ClientInput>
): Promise<ClientSafeOutput | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Build dynamic UPDATE query based on provided fields
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) {
    return getClientById(id);
  }

  values.push(id);

  const result = await query(
    `UPDATE clients
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, client_name, aws_account_id, region, notes, created_at, updated_at`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Delete a client by ID
 * @param id - Client's ID
 * @returns True if deleted, false if not found
 */
export const deleteClient = async (id: number): Promise<boolean> => {
  const result = await query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);

  return result.rowCount ? result.rowCount > 0 : false;
};
