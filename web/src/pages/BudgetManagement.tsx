/**
 * Budget Management Page
 *
 * Allows users to:
 * - View all budgets (current and historical)
 * - Create new budgets
 * - Update existing budgets
 * - Delete budgets
 * - Configure alert thresholds
 */

import React, { useState, useEffect } from 'react';
import { budgetsAPI } from '../services/api.service';
import './BudgetManagement.css';

interface Budget {
  id: number;
  user_id: number;
  monthly_limit: number;
  currency: string;
  alert_threshold: number;
  alerts_enabled: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  is_active: boolean;
}

const BudgetManagement: React.FC = () => {
  const [userId] = useState<number>(1); // TODO: Get from auth context
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    monthly_limit: '',
    currency: 'USD',
    alert_threshold: '0.8',
    alerts_enabled: true,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchBudgets();
  }, [userId]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await budgetsAPI.getUserBudgets(userId);
      setBudgets(response.data.data.budgets);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch budgets');
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      if (editingBudget) {
        // Update existing budget
        await budgetsAPI.update(editingBudget.id, {
          monthly_limit: parseFloat(formData.monthly_limit),
          alert_threshold: parseFloat(formData.alert_threshold),
          alerts_enabled: formData.alerts_enabled,
          end_date: formData.end_date || undefined,
        });
      } else {
        // Create new budget
        await budgetsAPI.create({
          user_id: userId,
          monthly_limit: parseFloat(formData.monthly_limit),
          currency: formData.currency,
          alert_threshold: parseFloat(formData.alert_threshold),
          alerts_enabled: formData.alerts_enabled,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
        });
      }

      // Reset form and refresh budgets
      setFormData({
        monthly_limit: '',
        currency: 'USD',
        alert_threshold: '0.8',
        alerts_enabled: true,
        start_date: '',
        end_date: '',
      });
      setShowCreateForm(false);
      setEditingBudget(null);
      fetchBudgets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save budget');
      console.error('Error saving budget:', err);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      monthly_limit: budget.monthly_limit.toString(),
      currency: budget.currency,
      alert_threshold: budget.alert_threshold.toString(),
      alerts_enabled: budget.alerts_enabled,
      start_date: budget.start_date || '',
      end_date: budget.end_date || '',
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (budgetId: number) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      setError(null);
      await budgetsAPI.delete(budgetId);
      fetchBudgets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete budget');
      console.error('Error deleting budget:', err);
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingBudget(null);
    setFormData({
      monthly_limit: '',
      currency: 'USD',
      alert_threshold: '0.8',
      alerts_enabled: true,
      start_date: '',
      end_date: '',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="budget-management">
        <div className="loading">Loading budgets...</div>
      </div>
    );
  }

  return (
    <div className="budget-management">
      <div className="budget-header">
        <h1>💳 Budget Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-create"
        >
          {showCreateForm ? '✕ Cancel' : '+ Create Budget'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">
            ✕
          </button>
        </div>
      )}

      {/* Create/Edit Budget Form */}
      {showCreateForm && (
        <div className="budget-form-card">
          <h2>{editingBudget ? 'Edit Budget' : 'Create New Budget'}</h2>
          <form onSubmit={handleSubmit} className="budget-form">
            <div className="form-row">
              <div className="form-group">
                <label>Monthly Limit *</label>
                <input
                  type="number"
                  name="monthly_limit"
                  value={formData.monthly_limit}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="1000.00"
                />
              </div>

              <div className="form-group">
                <label>Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  disabled={!!editingBudget}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Alert Threshold (0-1)</label>
                <input
                  type="number"
                  name="alert_threshold"
                  value={formData.alert_threshold}
                  onChange={handleInputChange}
                  min="0"
                  max="1"
                  step="0.05"
                  placeholder="0.8"
                />
                <small>Alert when {(parseFloat(formData.alert_threshold || '0') * 100).toFixed(0)}% of budget is used</small>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="alerts_enabled"
                    checked={formData.alerts_enabled}
                    onChange={handleInputChange}
                  />
                  Enable Budget Alerts
                </label>
              </div>
            </div>

            {!editingBudget && (
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date (optional)</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>End Date (optional)</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingBudget ? 'Update Budget' : 'Create Budget'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budgets List */}
      <div className="budgets-list">
        <h2>Your Budgets</h2>
        {budgets.length === 0 ? (
          <div className="no-budgets">
            <p>No budgets configured yet.</p>
            <p>Click "Create Budget" to set up your first budget.</p>
          </div>
        ) : (
          <div className="budgets-grid">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className={`budget-card ${budget.is_active ? 'active' : 'inactive'}`}
              >
                <div className="budget-card-header">
                  <h3>{formatCurrency(budget.monthly_limit, budget.currency)}</h3>
                  {budget.is_active && <span className="badge-active">Active</span>}
                </div>

                <div className="budget-card-body">
                  <div className="budget-info-row">
                    <span>Alert Threshold:</span>
                    <strong>{(budget.alert_threshold * 100).toFixed(0)}%</strong>
                  </div>
                  <div className="budget-info-row">
                    <span>Alerts:</span>
                    <strong className={budget.alerts_enabled ? 'text-success' : 'text-muted'}>
                      {budget.alerts_enabled ? 'Enabled' : 'Disabled'}
                    </strong>
                  </div>
                  <div className="budget-info-row">
                    <span>Start Date:</span>
                    <strong>{formatDate(budget.start_date)}</strong>
                  </div>
                  <div className="budget-info-row">
                    <span>End Date:</span>
                    <strong>{formatDate(budget.end_date)}</strong>
                  </div>
                  <div className="budget-info-row">
                    <span>Created:</span>
                    <strong>{formatDate(budget.created_at)}</strong>
                  </div>
                </div>

                <div className="budget-card-actions">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="btn-edit"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="btn-delete"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetManagement;
