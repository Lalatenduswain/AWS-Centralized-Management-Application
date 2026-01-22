/**
 * Client Management Page
 *
 * CRUD operations for AWS client accounts.
 */

import React, { useEffect, useState } from 'react';
import { clientsAPI } from '../services/api.service';

interface Client {
  id: number;
  client_name: string;
  aws_account_id: string | null;
  region: string;
  notes: string | null;
}

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    access_key_id: '',
    secret_access_key: '',
    region: 'us-east-1',
    aws_account_id: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data.data.clients);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await clientsAPI.create(formData);
      setSuccess('Client added successfully!');
      setShowModal(false);
      setFormData({
        client_name: '',
        access_key_id: '',
        secret_access_key: '',
        region: 'us-east-1',
        aws_account_id: '',
        notes: '',
      });
      loadClients();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add client');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      await clientsAPI.delete(id);
      setSuccess('Client deleted successfully!');
      loadClients();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete client');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Client Management</h1>
        <button onClick={() => setShowModal(true)} className="button button-primary">
          Add Client
        </button>
      </div>

      {error && <div className="error card">{error}</div>}
      {success && <div className="success card">{success}</div>}

      <div className="card">
        {clients.length === 0 ? (
          <p>No clients added yet. Click "Add Client" to get started.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>AWS Account ID</th>
                <th>Region</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.client_name}</td>
                  <td>{client.aws_account_id || 'N/A'}</td>
                  <td>{client.region}</td>
                  <td>{client.notes || '-'}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="button button-danger"
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Client</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>AWS Access Key ID *</label>
                <input
                  type="text"
                  value={formData.access_key_id}
                  onChange={(e) => setFormData({ ...formData, access_key_id: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>AWS Secret Access Key *</label>
                <input
                  type="password"
                  value={formData.secret_access_key}
                  onChange={(e) => setFormData({ ...formData, secret_access_key: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Region</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
              </div>

              <div className="form-group">
                <label>AWS Account ID</label>
                <input
                  type="text"
                  value={formData.aws_account_id}
                  onChange={(e) => setFormData({ ...formData, aws_account_id: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="button button-secondary">
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
