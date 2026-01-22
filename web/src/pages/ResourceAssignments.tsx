/**
 * Resource Assignments Page
 *
 * Allows managing AWS resource assignments to users for cost tracking.
 * Features:
 * - View all resource assignments
 * - Assign resources to users
 * - Filter by client or user
 * - Update and delete assignments
 */

import React, { useState, useEffect } from 'react';
import { resourceAssignmentsAPI, clientsAPI } from '../services/api.service';
import './ResourceAssignments.css';

interface ResourceAssignment {
  id: number;
  user_id: number;
  client_id: number;
  resource_type: string;
  resource_id: string;
  resource_name: string | null;
  cost_center: string | null;
  notes: string | null;
  assigned_at: string;
  assigned_by: number;
}

interface Client {
  id: number;
  client_name: string;
}

const RESOURCE_TYPES = ['ec2', 's3', 'rds', 'lambda', 'cloudfront', 'elb', 'other'];

const ResourceAssignments: React.FC = () => {
  const [userId] = useState<number>(1); // TODO: Get from auth context
  const [assignments, setAssignments] = useState<ResourceAssignment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ResourceAssignment | null>(null);
  const [filterClient, setFilterClient] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    user_id: userId.toString(),
    client_id: '',
    resource_type: 'ec2',
    resource_id: '',
    resource_name: '',
    cost_center: '',
    notes: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, [userId]);

  useEffect(() => {
    if (filterClient === 'all') {
      fetchUserAssignments();
    } else {
      fetchClientAssignments(parseInt(filterClient));
    }
  }, [filterClient]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assignmentsRes, clientsRes] = await Promise.all([
        resourceAssignmentsAPI.getUserAssignments(userId),
        clientsAPI.getAll(),
      ]);

      setAssignments(assignmentsRes.data.data.assignments);
      setClients(clientsRes.data.data.clients);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAssignments = async () => {
    try {
      const response = await resourceAssignmentsAPI.getUserAssignments(userId);
      setAssignments(response.data.data.assignments);
    } catch (err: any) {
      console.error('Error fetching user assignments:', err);
    }
  };

  const fetchClientAssignments = async (clientId: number) => {
    try {
      const response = await resourceAssignmentsAPI.getClientAssignments(clientId);
      setAssignments(response.data.data.assignments);
    } catch (err: any) {
      console.error('Error fetching client assignments:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      if (editingAssignment) {
        // Update existing assignment
        await resourceAssignmentsAPI.update(editingAssignment.id, {
          resource_name: formData.resource_name || undefined,
          cost_center: formData.cost_center || undefined,
          notes: formData.notes || undefined,
        });
      } else {
        // Create new assignment
        await resourceAssignmentsAPI.create({
          user_id: parseInt(formData.user_id),
          client_id: parseInt(formData.client_id),
          resource_type: formData.resource_type,
          resource_id: formData.resource_id,
          resource_name: formData.resource_name || undefined,
          cost_center: formData.cost_center || undefined,
          notes: formData.notes || undefined,
        });
      }

      // Reset form and refresh assignments
      resetForm();
      fetchUserAssignments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save assignment');
      console.error('Error saving assignment:', err);
    }
  };

  const handleEdit = (assignment: ResourceAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      user_id: assignment.user_id.toString(),
      client_id: assignment.client_id.toString(),
      resource_type: assignment.resource_type,
      resource_id: assignment.resource_id,
      resource_name: assignment.resource_name || '',
      cost_center: assignment.cost_center || '',
      notes: assignment.notes || '',
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (assignmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      setError(null);
      await resourceAssignmentsAPI.delete(assignmentId);
      fetchUserAssignments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete assignment');
      console.error('Error deleting assignment:', err);
    }
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setEditingAssignment(null);
    setFormData({
      user_id: userId.toString(),
      client_id: '',
      resource_type: 'ec2',
      resource_id: '',
      resource_name: '',
      cost_center: '',
      notes: '',
    });
  };

  const getResourceTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      ec2: '🖥️',
      s3: '📦',
      rds: '🗄️',
      lambda: 'λ',
      cloudfront: '🌐',
      elb: '⚖️',
      other: '📋',
    };
    return icons[type] || '📋';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="resource-assignments">
        <div className="loading">Loading resource assignments...</div>
      </div>
    );
  }

  return (
    <div className="resource-assignments">
      <div className="assignments-header">
        <h1>🔗 Resource Assignments</h1>
        <div className="header-actions">
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id.toString()}>
                {client.client_name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-create"
          >
            {showCreateForm ? '✕ Cancel' : '+ Assign Resource'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">
            ✕
          </button>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="assignment-form-card">
          <h2>{editingAssignment ? 'Edit Assignment' : 'Assign Resource'}</h2>
          <form onSubmit={handleSubmit} className="assignment-form">
            <div className="form-row">
              <div className="form-group">
                <label>Client *</label>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingAssignment}
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.client_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Resource Type *</label>
                <select
                  name="resource_type"
                  value={formData.resource_type}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingAssignment}
                >
                  {RESOURCE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {getResourceTypeIcon(type)} {type.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Resource ID *</label>
              <input
                type="text"
                name="resource_id"
                value={formData.resource_id}
                onChange={handleInputChange}
                required
                disabled={!!editingAssignment}
                placeholder="e.g., i-1234567890abcdef0"
              />
            </div>

            <div className="form-group">
              <label>Resource Name</label>
              <input
                type="text"
                name="resource_name"
                value={formData.resource_name}
                onChange={handleInputChange}
                placeholder="Friendly name for the resource"
              />
            </div>

            <div className="form-group">
              <label>Cost Center</label>
              <input
                type="text"
                name="cost_center"
                value={formData.cost_center}
                onChange={handleInputChange}
                placeholder="Department or project code"
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Additional notes about this assignment"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
              </button>
              <button type="button" onClick={resetForm} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignments List */}
      <div className="assignments-list">
        <h2>
          Assignments {filterClient !== 'all' && `for ${clients.find(c => c.id.toString() === filterClient)?.client_name}`}
        </h2>
        {assignments.length === 0 ? (
          <div className="no-assignments">
            <p>No resource assignments found.</p>
            <p>Click "Assign Resource" to create your first assignment.</p>
          </div>
        ) : (
          <div className="assignments-table-container">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Resource ID</th>
                  <th>Resource Name</th>
                  <th>Cost Center</th>
                  <th>Client</th>
                  <th>Assigned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>
                      <span className="resource-type-badge">
                        {getResourceTypeIcon(assignment.resource_type)} {assignment.resource_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="resource-id">{assignment.resource_id}</td>
                    <td>{assignment.resource_name || '-'}</td>
                    <td>{assignment.cost_center || '-'}</td>
                    <td>
                      {clients.find((c) => c.id === assignment.client_id)?.client_name || 'Unknown'}
                    </td>
                    <td className="date-cell">{formatDate(assignment.assigned_at)}</td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleEdit(assignment)}
                        className="btn-action btn-edit-small"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="btn-action btn-delete-small"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceAssignments;
