/**
 * AWS Resources Page
 *
 * View and manage AWS resources for a specific client.
 * Tabs for EC2, S3, RDS, and Costs.
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { awsAPI, clientsAPI } from '../services/api.service';

type TabType = 'ec2' | 's3' | 'rds' | 'costs';

const AWSResources: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('ec2');
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState('');
  const [ec2Instances, setEc2Instances] = useState<any[]>([]);
  const [s3Buckets, setS3Buckets] = useState<any[]>([]);
  const [rdsInstances, setRdsInstances] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (clientId) {
      loadClientInfo();
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      loadTabData();
    }
  }, [clientId, activeTab]);

  const loadClientInfo = async () => {
    try {
      const response = await clientsAPI.getById(parseInt(clientId!));
      setClientName(response.data.data.client.client_name);
    } catch (error) {
      console.error('Failed to load client:', error);
    }
  };

  const loadTabData = async () => {
    setLoading(true);
    setError('');

    try {
      const id = parseInt(clientId!);

      switch (activeTab) {
        case 'ec2':
          const ec2Response = await awsAPI.listEC2Instances(id);
          setEc2Instances(ec2Response.data.data.instances);
          break;
        case 's3':
          const s3Response = await awsAPI.listS3Buckets(id);
          setS3Buckets(s3Response.data.data.buckets);
          break;
        case 'rds':
          const rdsResponse = await awsAPI.listRDSInstances(id);
          setRdsInstances(rdsResponse.data.data.instances);
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to load ${activeTab.toUpperCase()} data`);
    } finally {
      setLoading(false);
    }
  };

  const handleEC2Action = async (instanceId: string, action: 'start' | 'stop') => {
    setError('');
    setSuccess('');

    try {
      const id = parseInt(clientId!);
      if (action === 'start') {
        await awsAPI.startEC2Instance(id, instanceId);
        setSuccess(`Instance ${instanceId} start initiated`);
      } else {
        await awsAPI.stopEC2Instance(id, instanceId);
        setSuccess(`Instance ${instanceId} stop initiated`);
      }
      setTimeout(() => loadTabData(), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} instance`);
    }
  };

  const tabStyle = (tab: TabType) => ({
    padding: '10px 20px',
    border: 'none',
    background: activeTab === tab ? '#007bff' : '#f8f9fa',
    color: activeTab === tab ? 'white' : '#333',
    cursor: 'pointer',
    borderRadius: '4px 4px 0 0',
  });

  return (
    <div className="container">
      <h1>AWS Resources - {clientName}</h1>

      {error && <div className="error card">{error}</div>}
      {success && <div className="success card">{success}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '5px', padding: '10px 10px 0', background: '#f8f9fa' }}>
          <button onClick={() => setActiveTab('ec2')} style={tabStyle('ec2')}>
            EC2 Instances
          </button>
          <button onClick={() => setActiveTab('s3')} style={tabStyle('s3')}>
            S3 Buckets
          </button>
          <button onClick={() => setActiveTab('rds')} style={tabStyle('rds')}>
            RDS Instances
          </button>
          <button onClick={() => setActiveTab('costs')} style={tabStyle('costs')}>
            Costs
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {loading ? (
            <div className="loading">Loading {activeTab.toUpperCase()} data...</div>
          ) : (
            <>
              {activeTab === 'ec2' && (
                <div>
                  <h3>EC2 Instances</h3>
                  {ec2Instances.length === 0 ? (
                    <p>No EC2 instances found</p>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Instance ID</th>
                          <th>State</th>
                          <th>Type</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ec2Instances.map((instance) => (
                          <tr key={instance.InstanceId}>
                            <td>{instance.InstanceId}</td>
                            <td>{instance.State?.Name || 'unknown'}</td>
                            <td>{instance.InstanceType}</td>
                            <td>
                              <button
                                onClick={() => handleEC2Action(instance.InstanceId!, 'start')}
                                className="button button-success"
                                style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                                disabled={instance.State?.Name === 'running'}
                              >
                                Start
                              </button>
                              <button
                                onClick={() => handleEC2Action(instance.InstanceId!, 'stop')}
                                className="button button-danger"
                                style={{ fontSize: '12px', padding: '5px 10px' }}
                                disabled={instance.State?.Name === 'stopped'}
                              >
                                Stop
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 's3' && (
                <div>
                  <h3>S3 Buckets</h3>
                  {s3Buckets.length === 0 ? (
                    <p>No S3 buckets found</p>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Bucket Name</th>
                          <th>Creation Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s3Buckets.map((bucket) => (
                          <tr key={bucket.Name}>
                            <td>{bucket.Name}</td>
                            <td>{bucket.CreationDate ? new Date(bucket.CreationDate).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'rds' && (
                <div>
                  <h3>RDS Instances</h3>
                  {rdsInstances.length === 0 ? (
                    <p>No RDS instances found</p>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Identifier</th>
                          <th>Engine</th>
                          <th>Status</th>
                          <th>Instance Class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rdsInstances.map((instance) => (
                          <tr key={instance.DBInstanceIdentifier}>
                            <td>{instance.DBInstanceIdentifier}</td>
                            <td>{instance.Engine}</td>
                            <td>{instance.DBInstanceStatus}</td>
                            <td>{instance.DBInstanceClass}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'costs' && (
                <div>
                  <h3>Cost Data</h3>
                  <p>Cost Explorer integration coming soon...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AWSResources;
