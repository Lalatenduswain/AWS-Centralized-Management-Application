/**
 * User Billing Dashboard
 *
 * Comprehensive billing dashboard for displaying:
 * - Cost summary and budget status
 * - Cost breakdown by service (pie chart)
 * - Daily cost trend (line chart)
 * - Top cost drivers
 * - Cost forecast
 * - Resource assignments
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { billingAPI, budgetsAPI, resourceAssignmentsAPI } from '../services/api.service';
import './UserBilling.css';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

interface BudgetStatus {
  budget: {
    id: number;
    monthly_limit: number;
    alert_threshold: number;
    alerts_enabled: boolean;
    currency: string;
  } | null;
  currentSpending: number;
  remainingBudget: number;
  percentageUsed: number;
  isOverBudget: boolean;
  daysLeftInMonth: number;
}

interface CostSummary {
  billing_period: string;
  total_cost: number;
  currency: string;
}

interface ServiceBreakdown {
  service_name: string;
  total_cost: number;
  resource_count: number;
}

interface DailyCost {
  billing_date: string;
  total_cost: number;
}

interface CostDriver {
  resource_id: string;
  resource_type: string;
  service_name: string;
  total_cost: number;
}

interface Forecast {
  forecast_period: string;
  forecasted_cost: number;
  currency: string;
  method: string;
}

const UserBilling: React.FC = () => {
  const [userId] = useState<number>(1); // TODO: Get from auth context
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for billing data
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [topDrivers, setTopDrivers] = useState<CostDriver[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  useEffect(() => {
    fetchAllBillingData();
  }, [userId, selectedPeriod]);

  const fetchAllBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all billing data in parallel
      const [
        budgetRes,
        summaryRes,
        breakdownRes,
        trendRes,
        driversRes,
        forecastRes,
      ] = await Promise.all([
        budgetsAPI.getBudgetStatus(userId),
        billingAPI.getUserSummary(userId),
        billingAPI.getUserBreakdown(userId, selectedPeriod),
        billingAPI.getUserTrend(userId),
        billingAPI.getTopDrivers(userId, selectedPeriod, 10),
        billingAPI.getForecast(userId),
      ]);

      setBudgetStatus(budgetRes.data.data.status);
      setCostSummary(summaryRes.data.data);
      setServiceBreakdown(breakdownRes.data.data.breakdown);
      setDailyCosts(trendRes.data.data.trend);
      setTopDrivers(driversRes.data.data.top_drivers);
      setForecast(forecastRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch billing data');
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getBudgetStatusColor = (percentageUsed: number, isOverBudget: boolean) => {
    if (isOverBudget) return '#dc3545'; // Red
    if (percentageUsed >= 90) return '#ffc107'; // Yellow
    if (percentageUsed >= 75) return '#fd7e14'; // Orange
    return '#28a745'; // Green
  };

  if (loading) {
    return (
      <div className="billing-container">
        <div className="loading">Loading billing data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="billing-container">
        <div className="error">{error}</div>
        <button onClick={fetchAllBillingData} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="billing-container">
      <div className="billing-header">
        <h1>💰 Billing Dashboard</h1>
        <div className="period-selector">
          <label>Period:</label>
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-input"
          />
          <button onClick={fetchAllBillingData} className="btn-refresh">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        {/* Current Month Cost */}
        <div className="card">
          <h3>Current Month Cost</h3>
          <div className="card-value">
            {costSummary ? formatCurrency(costSummary.total_cost, costSummary.currency) : '$0.00'}
          </div>
          <div className="card-subtitle">{costSummary?.billing_period}</div>
        </div>

        {/* Budget Status */}
        {budgetStatus?.budget && (
          <div className="card">
            <h3>Budget Status</h3>
            <div className="card-value">
              {formatCurrency(budgetStatus.remainingBudget, budgetStatus.budget.currency)}
            </div>
            <div className="card-subtitle">
              {budgetStatus.percentageUsed.toFixed(1)}% used
            </div>
            <div
              className="budget-progress-bar"
              style={{
                background: `linear-gradient(to right, ${getBudgetStatusColor(
                  budgetStatus.percentageUsed,
                  budgetStatus.isOverBudget
                )} ${budgetStatus.percentageUsed}%, #e9ecef ${budgetStatus.percentageUsed}%)`,
              }}
            />
            {budgetStatus.isOverBudget && (
              <div className="budget-warning">⚠️ Over Budget!</div>
            )}
          </div>
        )}

        {/* Forecast */}
        {forecast && (
          <div className="card">
            <h3>Next Month Forecast</h3>
            <div className="card-value">
              {formatCurrency(forecast.forecasted_cost, forecast.currency)}
            </div>
            <div className="card-subtitle">{forecast.forecast_period}</div>
            <div className="card-meta">Method: {forecast.method}</div>
          </div>
        )}

        {/* Daily Average */}
        <div className="card">
          <h3>Daily Average</h3>
          <div className="card-value">
            {dailyCosts.length > 0
              ? formatCurrency(
                  dailyCosts.reduce((sum, day) => sum + day.total_cost, 0) / dailyCosts.length
                )
              : '$0.00'}
          </div>
          <div className="card-subtitle">Last {dailyCosts.length} days</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-row">
        {/* Cost Breakdown by Service */}
        <div className="chart-card">
          <h3>Cost Breakdown by Service</h3>
          {serviceBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceBreakdown}
                  dataKey="total_cost"
                  nameKey="service_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {serviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No service breakdown data available</div>
          )}
        </div>

        {/* Daily Cost Trend */}
        <div className="chart-card">
          <h3>Daily Cost Trend</h3>
          {dailyCosts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyCosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="billing_date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                  formatter={(value) => [formatCurrency(value as number), 'Cost']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_cost"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Daily Cost"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No daily cost data available</div>
          )}
        </div>
      </div>

      {/* Top Cost Drivers */}
      <div className="table-card">
        <h3>Top Cost Drivers</h3>
        {topDrivers.length > 0 ? (
          <table className="cost-drivers-table">
            <thead>
              <tr>
                <th>Resource ID</th>
                <th>Type</th>
                <th>Service</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {topDrivers.map((driver, index) => (
                <tr key={index}>
                  <td className="resource-id">{driver.resource_id}</td>
                  <td>
                    <span className="badge">{driver.resource_type}</span>
                  </td>
                  <td>{driver.service_name}</td>
                  <td className="cost-cell">{formatCurrency(driver.total_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">No cost drivers data available</div>
        )}
      </div>

      {/* Budget Management Section */}
      {budgetStatus?.budget && (
        <div className="budget-details">
          <h3>Budget Details</h3>
          <div className="budget-info">
            <div className="budget-row">
              <span>Monthly Limit:</span>
              <strong>{formatCurrency(budgetStatus.budget.monthly_limit, budgetStatus.budget.currency)}</strong>
            </div>
            <div className="budget-row">
              <span>Current Spending:</span>
              <strong>{formatCurrency(budgetStatus.currentSpending, budgetStatus.budget.currency)}</strong>
            </div>
            <div className="budget-row">
              <span>Remaining:</span>
              <strong style={{ color: budgetStatus.isOverBudget ? '#dc3545' : '#28a745' }}>
                {formatCurrency(budgetStatus.remainingBudget, budgetStatus.budget.currency)}
              </strong>
            </div>
            <div className="budget-row">
              <span>Alert Threshold:</span>
              <strong>{(budgetStatus.budget.alert_threshold * 100).toFixed(0)}%</strong>
            </div>
            <div className="budget-row">
              <span>Days Left in Month:</span>
              <strong>{budgetStatus.daysLeftInMonth} days</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBilling;
