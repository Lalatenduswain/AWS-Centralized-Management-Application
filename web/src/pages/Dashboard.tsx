/**
 * Dashboard Page
 *
 * Main landing page after login.
 * Shows overview of clients and quick stats.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientsAPI } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';

interface Client {
  id: number;
  client_name: string;
  region: string;
  notes: string | null;
}

const Dashboard: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <p style={{ marginBottom: '30px' }}>Welcome back, {user?.email}!</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#007bff', fontSize: '36px' }}>{clients.length}</h3>
          <p>Total Clients</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Clients</h2>
          <Link to="/clients" className="button button-primary">
            Manage Clients
          </Link>
        </div>

        {clients.length === 0 ? (
          <p>No clients added yet. <Link to="/clients">Add your first client</Link></p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {clients.map((client) => (
              <div key={client.id} className="card" style={{ background: '#f8f9fa' }}>
                <h3>{client.client_name}</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>Region: {client.region}</p>
                {client.notes && (
                  <p style={{ fontSize: '14px', marginTop: '10px' }}>{client.notes}</p>
                )}
                <Link
                  to={`/aws/${client.id}`}
                  className="button button-primary"
                  style={{ marginTop: '10px', display: 'inline-block' }}
                >
                  View Resources
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
