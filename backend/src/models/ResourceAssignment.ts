/**
 * Resource Assignment Model
 *
 * Links AWS resources to specific users for cost allocation and billing.
 * Allows tracking which user is responsible for which AWS resources.
 */

import { query } from '../config/database';

export interface ResourceAssignment {
  id: number;
  user_id: number;
  client_id: number;
  resource_type: string;
  resource_id: string;
  resource_name: string | null;
  cost_center: string | null;
  notes: string | null;
  assigned_by: number | null;
  assigned_at: Date;
  updated_at: Date;
}

export interface ResourceAssignmentInput {
  user_id: number;
  client_id: number;
  resource_type: string;
  resource_id: string;
  resource_name?: string;
  cost_center?: string;
  notes?: string;
  assigned_by?: number;
}

/**
 * Create a new resource assignment
 * Links a specific AWS resource to a user for cost tracking
 */
export const createResourceAssignment = async (
  data: ResourceAssignmentInput
): Promise<ResourceAssignment> => {
  const {
    user_id,
    client_id,
    resource_type,
    resource_id,
    resource_name,
    cost_center,
    notes,
    assigned_by,
  } = data;

  const result = await query(
    `INSERT INTO user_resource_assignments
    (user_id, client_id, resource_type, resource_id, resource_name, cost_center, notes, assigned_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [user_id, client_id, resource_type, resource_id, resource_name, cost_center, notes, assigned_by]
  );

  return result.rows[0];
};

/**
 * Get all resources assigned to a user
 */
export const getUserResourceAssignments = async (userId: number): Promise<ResourceAssignment[]> => {
  const result = await query(
    `SELECT * FROM user_resource_assignments
    WHERE user_id = $1
    ORDER BY assigned_at DESC`,
    [userId]
  );

  return result.rows;
};

/**
 * Get all assignments for a specific client
 */
export const getClientResourceAssignments = async (clientId: number): Promise<ResourceAssignment[]> => {
  const result = await query(
    `SELECT ura.*, u.email as user_email
    FROM user_resource_assignments ura
    LEFT JOIN users u ON ura.user_id = u.id
    WHERE ura.client_id = $1
    ORDER BY ura.assigned_at DESC`,
    [clientId]
  );

  return result.rows;
};

/**
 * Get assignment for a specific resource
 */
export const getResourceAssignment = async (
  clientId: number,
  resourceType: string,
  resourceId: string
): Promise<ResourceAssignment | null> => {
  const result = await query(
    `SELECT * FROM user_resource_assignments
    WHERE client_id = $1 AND resource_type = $2 AND resource_id = $3`,
    [clientId, resourceType, resourceId]
  );

  return result.rows[0] || null;
};

/**
 * Update a resource assignment
 */
export const updateResourceAssignment = async (
  id: number,
  updates: Partial<ResourceAssignmentInput>
): Promise<ResourceAssignment | null> => {
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
    `UPDATE user_resource_assignments
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Delete a resource assignment
 */
export const deleteResourceAssignment = async (id: number): Promise<boolean> => {
  const result = await query(
    'DELETE FROM user_resource_assignments WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount ? result.rowCount > 0 : false;
};

/**
 * Get resource assignments grouped by user for a client
 * Useful for seeing which users are responsible for which resources
 */
export const getAssignmentsByUserForClient = async (clientId: number): Promise<any[]> => {
  const result = await query(
    `SELECT
      u.id as user_id,
      u.email,
      COUNT(*) as resource_count,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'resource_type', ura.resource_type,
          'resource_id', ura.resource_id,
          'resource_name', ura.resource_name,
          'cost_center', ura.cost_center
        )
      ) as resources
    FROM user_resource_assignments ura
    JOIN users u ON ura.user_id = u.id
    WHERE ura.client_id = $1
    GROUP BY u.id, u.email
    ORDER BY u.email`,
    [clientId]
  );

  return result.rows;
};

/**
 * Bulk assign resources to a user
 * Useful for assigning multiple EC2 instances, S3 buckets, etc. at once
 */
export const bulkAssignResources = async (
  userId: number,
  clientId: number,
  resources: Array<{ resource_type: string; resource_id: string; resource_name?: string }>,
  assignedBy?: number
): Promise<ResourceAssignment[]> => {
  const assignments: ResourceAssignment[] = [];

  for (const resource of resources) {
    try {
      const assignment = await createResourceAssignment({
        user_id: userId,
        client_id: clientId,
        resource_type: resource.resource_type,
        resource_id: resource.resource_id,
        resource_name: resource.resource_name,
        assigned_by: assignedBy,
      });
      assignments.push(assignment);
    } catch (error: any) {
      // Skip duplicates (unique constraint violation)
      if (error.code !== '23505') {
        throw error;
      }
    }
  }

  return assignments;
};
