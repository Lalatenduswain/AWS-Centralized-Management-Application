/**
 * API Service
 *
 * Handles all HTTP requests to the backend API.
 * Uses axios for making HTTP requests.
 *
 * For beginners:
 * This file is like a "messenger" between your frontend and backend.
 * It sends requests and receives responses from the backend server.
 */

import axios, { AxiosInstance } from 'axios';

// Base URL for the backend API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API
 */
export const authAPI = {
  register: (email: string, password: string) =>
    apiClient.post('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
};

/**
 * Clients API
 */
export const clientsAPI = {
  getAll: () => apiClient.get('/clients'),

  getById: (id: number) => apiClient.get(`/clients/${id}`),

  create: (clientData: {
    client_name: string;
    access_key_id: string;
    secret_access_key: string;
    region?: string;
    aws_account_id?: string;
    notes?: string;
  }) => apiClient.post('/clients', clientData),

  update: (id: number, updates: any) => apiClient.put(`/clients/${id}`, updates),

  delete: (id: number) => apiClient.delete(`/clients/${id}`),
};

/**
 * AWS Resources API
 */
export const awsAPI = {
  // EC2
  listEC2Instances: (clientId: number) =>
    apiClient.get(`/aws/${clientId}/ec2/instances`),

  startEC2Instance: (clientId: number, instanceId: string) =>
    apiClient.post(`/aws/${clientId}/ec2/instances/${instanceId}/start`),

  stopEC2Instance: (clientId: number, instanceId: string) =>
    apiClient.post(`/aws/${clientId}/ec2/instances/${instanceId}/stop`),

  // S3
  listS3Buckets: (clientId: number) =>
    apiClient.get(`/aws/${clientId}/s3/buckets`),

  // RDS
  listRDSInstances: (clientId: number) =>
    apiClient.get(`/aws/${clientId}/rds/instances`),

  // Costs
  getCosts: (clientId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/aws/${clientId}/costs?${params.toString()}`);
  },
};

/**
 * Activity Logs API
 */
export const logsAPI = {
  getAll: (limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    return apiClient.get(`/logs?${params.toString()}`);
  },

  getByUser: (userId: number, limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    return apiClient.get(`/logs/user/${userId}?${params.toString()}`);
  },

  getByClient: (clientId: number, limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    return apiClient.get(`/logs/client/${clientId}?${params.toString()}`);
  },
};

/**
 * Billing & Cost Management API
 */
export const billingAPI = {
  // Get user's billing records with optional date filtering
  getUserCosts: (userId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/billing/user/${userId}/costs?${params.toString()}`);
  },

  // Get cost summary for current month
  getUserSummary: (userId: number) =>
    apiClient.get(`/billing/user/${userId}/summary`),

  // Get cost breakdown by service
  getUserBreakdown: (userId: number, period?: string) => {
    const params = period ? `?period=${period}` : '';
    return apiClient.get(`/billing/user/${userId}/breakdown${params}`);
  },

  // Get daily cost trend
  getUserTrend: (userId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/billing/user/${userId}/trend?${params.toString()}`);
  },

  // Get top cost drivers
  getTopDrivers: (userId: number, period?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (limit) params.append('limit', limit.toString());
    return apiClient.get(`/billing/user/${userId}/top-drivers?${params.toString()}`);
  },

  // Get monthly trend
  getMonthlyTrend: (userId: number, months?: number) => {
    const params = months ? `?months=${months}` : '';
    return apiClient.get(`/billing/user/${userId}/monthly-trend${params}`);
  },

  // Get cost forecast
  getForecast: (userId: number) =>
    apiClient.get(`/billing/user/${userId}/forecast`),

  // Get client cost summary from AWS
  getClientSummary: (clientId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/billing/client/${clientId}/summary?${params.toString()}`);
  },

  // Sync cost data from AWS
  syncCosts: (clientId: number, userId: number, startDate: string, endDate: string) =>
    apiClient.post('/billing/sync', { client_id: clientId, user_id: userId, startDate, endDate }),

  // Sync yesterday's costs
  syncYesterday: (clientId: number, userId: number) =>
    apiClient.post('/billing/sync/yesterday', { client_id: clientId, user_id: userId }),

  // Get all users billing summary (admin)
  getAllUsers: (period?: string) => {
    const params = period ? `?period=${period}` : '';
    return apiClient.get(`/billing/all-users${params}`);
  },
};

/**
 * Budget Management API
 */
export const budgetsAPI = {
  // Create a new budget
  create: (budgetData: {
    user_id: number;
    monthly_limit: number;
    currency?: string;
    alert_threshold?: number;
    alerts_enabled?: boolean;
    start_date?: string;
    end_date?: string;
  }) => apiClient.post('/budgets', budgetData),

  // Get all budgets for a user
  getUserBudgets: (userId: number) =>
    apiClient.get(`/budgets/user/${userId}`),

  // Get active budget for a user
  getActiveBudget: (userId: number) =>
    apiClient.get(`/budgets/user/${userId}/active`),

  // Get budget status with current spending
  getBudgetStatus: (userId: number) =>
    apiClient.get(`/budgets/user/${userId}/status`),

  // Update a budget
  update: (budgetId: number, updates: {
    monthly_limit?: number;
    alert_threshold?: number;
    alerts_enabled?: boolean;
    end_date?: string;
  }) => apiClient.put(`/budgets/${budgetId}`, updates),

  // Delete a budget
  delete: (budgetId: number) =>
    apiClient.delete(`/budgets/${budgetId}`),

  // Get users needing budget alerts (admin)
  getAlerts: () =>
    apiClient.get('/budgets/alerts'),
};

/**
 * Resource Assignment API
 */
export const resourceAssignmentsAPI = {
  // Assign a resource to a user
  create: (assignmentData: {
    user_id: number;
    client_id: number;
    resource_type: string;
    resource_id: string;
    resource_name?: string;
    cost_center?: string;
    notes?: string;
  }) => apiClient.post('/resource-assignments', assignmentData),

  // Get user's resource assignments
  getUserAssignments: (userId: number) =>
    apiClient.get(`/resource-assignments/user/${userId}`),

  // Get client's resource assignments
  getClientAssignments: (clientId: number) =>
    apiClient.get(`/resource-assignments/client/${clientId}`),

  // Get assignments grouped by user for a client
  getClientAssignmentsGrouped: (clientId: number) =>
    apiClient.get(`/resource-assignments/client/${clientId}/grouped`),

  // Update a resource assignment
  update: (assignmentId: number, updates: {
    resource_name?: string;
    cost_center?: string;
    notes?: string;
  }) => apiClient.put(`/resource-assignments/${assignmentId}`, updates),

  // Delete a resource assignment
  delete: (assignmentId: number) =>
    apiClient.delete(`/resource-assignments/${assignmentId}`),

  // Bulk assign resources
  bulkCreate: (bulkData: {
    user_id: number;
    client_id: number;
    resources: Array<{
      resource_type: string;
      resource_id: string;
      resource_name?: string;
      cost_center?: string;
      notes?: string;
    }>;
  }) => apiClient.post('/resource-assignments/bulk', bulkData),
};

/**
 * Export & Reports API (Phase 5)
 */
export const exportsAPI = {
  // CSV Exports
  exportBillingRecords: (userId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/exports/billing-records/csv?${params.toString()}`, {
      responseType: 'blob',
    });
  },

  exportCostBreakdown: (userId: number, period?: string) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (period) params.append('period', period);
    return apiClient.get(`/exports/cost-breakdown/csv?${params.toString()}`, {
      responseType: 'blob',
    });
  },

  exportDailyCosts: (userId: number, startDate: string, endDate: string) => {
    const params = new URLSearchParams({
      userId: userId.toString(),
      startDate,
      endDate,
    });
    return apiClient.get(`/exports/daily-costs/csv?${params.toString()}`, {
      responseType: 'blob',
    });
  },

  exportTopDrivers: (userId: number, period?: string, limit?: number) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (period) params.append('period', period);
    if (limit) params.append('limit', limit.toString());
    return apiClient.get(`/exports/top-drivers/csv?${params.toString()}`, {
      responseType: 'blob',
    });
  },

  exportBudgets: (userId: number) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    return apiClient.get(`/exports/budgets/csv?${params.toString()}`, {
      responseType: 'blob',
    });
  },

  exportAssignments: (userId: number) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    return apiClient.get(`/exports/assignments/csv?${params.toString()}`, {
      responseType: 'blob',
    });
  },

  exportAlerts: (userId: number, limit?: number) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (limit) params.append('limit', limit.toString());
    return apiClient.get(`/exports/alerts/csv?${params.toString()}`, {
      responseType: 'blob',
    });
  },

  exportMonthlyReport: (userId: number, period?: string) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (period) params.append('period', period);
    return apiClient.get(`/exports/monthly-report/csv?${params.toString()}`, {
      responseType: 'blob',
    });
  },

  // PDF Exports
  exportMonthlyInvoice: (userId: number, period?: string) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (period) params.append('period', period);
    return apiClient.get(`/exports/monthly-invoice/pdf?${params.toString()}`, {
      responseType: 'blob',
    });
  },

  exportCostSummary: (userId: number, startDate: string, endDate: string) => {
    const params = new URLSearchParams({
      userId: userId.toString(),
      startDate,
      endDate,
    });
    return apiClient.get(`/exports/cost-summary/pdf?${params.toString()}`, {
      responseType: 'blob',
    });
  },
};

/**
 * Cost Forecasting API (Phase 5)
 */
export const forecastingAPI = {
  // Get comprehensive forecast (all methods + consensus)
  getComprehensiveForecast: (userId: number) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    return apiClient.get(`/exports/forecast/comprehensive?${params.toString()}`);
  },

  // Get forecast using specific method
  getForecastByMethod: (userId: number, method: 'linear' | 'moving-average' | 'exponential' | 'historical') => {
    const params = new URLSearchParams({ userId: userId.toString() });
    return apiClient.get(`/exports/forecast/${method}?${params.toString()}`);
  },
};

export default apiClient;
