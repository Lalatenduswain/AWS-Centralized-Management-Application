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
import { billingAPI, budgetsAPI, resourceAssignmentsAPI, exportsAPI, forecastingAPI } from '../services/api.service';
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
  confidence?: 'low' | 'medium' | 'high';
  trend?: 'increasing' | 'decreasing' | 'stable';
  daily_average?: number;
  data_points?: number;
}

interface ComprehensiveForecast {
  forecasts: Forecast[];
  recommended: Forecast;
  consensus: number;
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
  const [comprehensiveForecast, setComprehensiveForecast] = useState<ComprehensiveForecast | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
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

  const fetchComprehensiveForecast = async () => {
    try {
      const response = await forecastingAPI.getComprehensiveForecast(userId);
      setComprehensiveForecast(response.data.data);
    } catch (err) {
      console.error('Error fetching comprehensive forecast:', err);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (exportType: string) => {
    try {
      setExportLoading(true);
      let response;
      let filename;

      const startOfMonth = new Date(selectedPeriod + '-01').toISOString().split('T')[0];
      const endOfMonth = new Date(new Date(selectedPeriod).getFullYear(), new Date(selectedPeriod).getMonth() + 1, 0)
        .toISOString().split('T')[0];

      switch (exportType) {
        case 'billing-csv':
          response = await exportsAPI.exportBillingRecords(userId, startOfMonth, endOfMonth);
          filename = `billing-records-${selectedPeriod}.csv`;
          break;
        case 'breakdown-csv':
          response = await exportsAPI.exportCostBreakdown(userId, selectedPeriod);
          filename = `cost-breakdown-${selectedPeriod}.csv`;
          break;
        case 'daily-csv':
          response = await exportsAPI.exportDailyCosts(userId, startOfMonth, endOfMonth);
          filename = `daily-costs-${selectedPeriod}.csv`;
          break;
        case 'drivers-csv':
          response = await exportsAPI.exportTopDrivers(userId, selectedPeriod, 50);
          filename = `top-drivers-${selectedPeriod}.csv`;
          break;
        case 'budgets-csv':
          response = await exportsAPI.exportBudgets(userId);
          filename = `budgets-${userId}.csv`;
          break;
        case 'monthly-report-csv':
          response = await exportsAPI.exportMonthlyReport(userId, selectedPeriod);
          filename = `monthly-report-${selectedPeriod}.csv`;
          break;
        case 'invoice-pdf':
          response = await exportsAPI.exportMonthlyInvoice(userId, selectedPeriod);
          filename = `invoice-${selectedPeriod}.pdf`;
          break;
        case 'summary-pdf':
          response = await exportsAPI.exportCostSummary(userId, startOfMonth, endOfMonth);
          filename = `cost-summary-${selectedPeriod}.pdf`;
          break;
        default:
          throw new Error('Unknown export type');
      }

      downloadFile(response.data, filename);
      alert(`${filename} downloaded successfully!`);
      setShowExportMenu(false);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export: ' + (err.response?.data?.message || err.message));
    } finally {
      setExportLoading(false);
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
        <div className="header-actions">
          <div className="period-selector">
            <label>Period:</label>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="period-input"
            />
          </div>
          <button onClick={fetchAllBillingData} className="btn-refresh">
            🔄 Refresh
          </button>
          <button onClick={fetchComprehensiveForecast} className="btn-forecast">
            🔮 Detailed Forecast
          </button>
          <div className="export-dropdown">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-export"
              disabled={exportLoading}
            >
              📊 Export {exportLoading && '...'}
            </button>
            {showExportMenu && (
              <div className="export-menu">
                <div className="export-menu-section">
                  <h4>CSV Exports</h4>
                  <button onClick={() => handleExport('billing-csv')}>📄 Billing Records</button>
                  <button onClick={() => handleExport('breakdown-csv')}>📊 Cost Breakdown</button>
                  <button onClick={() => handleExport('daily-csv')}>📈 Daily Costs</button>
                  <button onClick={() => handleExport('drivers-csv')}>🔝 Top Drivers</button>
                  <button onClick={() => handleExport('budgets-csv')}>💳 Budgets</button>
                  <button onClick={() => handleExport('monthly-report-csv')}>📋 Monthly Report</button>
                </div>
                <div className="export-menu-section">
                  <h4>PDF Exports</h4>
                  <button onClick={() => handleExport('invoice-pdf')}>🧾 Monthly Invoice</button>
                  <button onClick={() => handleExport('summary-pdf')}>📑 Cost Summary</button>
                </div>
              </div>
            )}
          </div>
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

      {/* Comprehensive Forecast Section */}
      {comprehensiveForecast && (
        <div className="forecast-section">
          <h3>🔮 Comprehensive Cost Forecast</h3>

          {/* Consensus and Recommendation */}
          <div className="forecast-summary">
            <div className="forecast-card highlight">
              <h4>📊 Consensus Forecast</h4>
              <div className="forecast-value">
                {formatCurrency(comprehensiveForecast.consensus)}
              </div>
              <div className="forecast-subtitle">Average of all methods</div>
            </div>
            <div className="forecast-card highlight">
              <h4>⭐ Recommended</h4>
              <div className="forecast-value">
                {formatCurrency(comprehensiveForecast.recommended.forecasted_cost)}
              </div>
              <div className="forecast-subtitle">
                Method: {comprehensiveForecast.recommended.method.replace(/_/g, ' ')}
              </div>
              <div className="forecast-meta">
                <span className={`badge confidence-${comprehensiveForecast.recommended.confidence}`}>
                  {comprehensiveForecast.recommended.confidence} confidence
                </span>
                <span className={`badge trend-${comprehensiveForecast.recommended.trend}`}>
                  {comprehensiveForecast.recommended.trend}
                </span>
              </div>
            </div>
          </div>

          {/* All Forecasting Methods */}
          <div className="forecast-methods">
            <h4>All Forecasting Methods</h4>
            <div className="forecast-grid">
              {comprehensiveForecast.forecasts.map((f, index) => (
                <div key={index} className="forecast-method-card">
                  <div className="method-header">
                    <h5>{f.method.replace(/_/g, ' ').toUpperCase()}</h5>
                    <span className={`badge confidence-${f.confidence}`}>{f.confidence}</span>
                  </div>
                  <div className="method-forecast">
                    {formatCurrency(f.forecasted_cost)}
                  </div>
                  <div className="method-details">
                    <div className="detail-row">
                      <span>Period:</span>
                      <strong>{f.forecast_period}</strong>
                    </div>
                    {f.trend && (
                      <div className="detail-row">
                        <span>Trend:</span>
                        <span className={`trend-badge trend-${f.trend}`}>{f.trend}</span>
                      </div>
                    )}
                    {f.daily_average && (
                      <div className="detail-row">
                        <span>Daily Avg:</span>
                        <strong>{formatCurrency(f.daily_average)}</strong>
                      </div>
                    )}
                    {f.data_points && (
                      <div className="detail-row">
                        <span>Data Points:</span>
                        <strong>{f.data_points}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast Comparison Chart */}
          <div className="forecast-chart">
            <h4>Forecast Comparison</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comprehensiveForecast.forecasts.map(f => ({
                name: f.method.replace(/_/g, ' '),
                forecast: f.forecasted_cost,
                confidence: f.confidence,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="forecast" fill="#8884d8" name="Forecasted Cost">
                  {comprehensiveForecast.forecasts.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.confidence === 'high'
                          ? '#28a745'
                          : entry.confidence === 'medium'
                          ? '#ffc107'
                          : '#dc3545'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBilling;
