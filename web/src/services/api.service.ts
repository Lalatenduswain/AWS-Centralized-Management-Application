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

export default apiClient;
