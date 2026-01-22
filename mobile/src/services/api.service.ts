/**
 * API Service for Mobile App
 *
 * Handles all HTTP requests to the backend API.
 * Similar to the web version but uses AsyncStorage for token storage.
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the backend API - update this with your server URL
const API_BASE_URL = 'http://localhost:3000/api'; // For Android emulator: http://10.0.2.2:3000/api

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds auth token to every request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: (email: string, password: string) =>
    apiClient.post('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
};

// Clients API
export const clientsAPI = {
  getAll: () => apiClient.get('/clients'),
  getById: (id: number) => apiClient.get(`/clients/${id}`),
  create: (clientData: any) => apiClient.post('/clients', clientData),
  update: (id: number, updates: any) => apiClient.put(`/clients/${id}`, updates),
  delete: (id: number) => apiClient.delete(`/clients/${id}`),
};

// AWS Resources API
export const awsAPI = {
  listEC2Instances: (clientId: number) =>
    apiClient.get(`/aws/${clientId}/ec2/instances`),
  startEC2Instance: (clientId: number, instanceId: string) =>
    apiClient.post(`/aws/${clientId}/ec2/instances/${instanceId}/start`),
  stopEC2Instance: (clientId: number, instanceId: string) =>
    apiClient.post(`/aws/${clientId}/ec2/instances/${instanceId}/stop`),
  listS3Buckets: (clientId: number) =>
    apiClient.get(`/aws/${clientId}/s3/buckets`),
  listRDSInstances: (clientId: number) =>
    apiClient.get(`/aws/${clientId}/rds/instances`),
};

export default apiClient;
