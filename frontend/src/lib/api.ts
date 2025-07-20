import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosRequestConfig, AxiosResponse } from 'axios';

// Define a type for our API response format
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

// Create an axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
});

// Add a request interceptor to include auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Create a new config object to avoid mutating the original
      const newConfig = { ...config };
      newConfig.headers = newConfig.headers || {};
      // Use type assertion to avoid TypeScript errors with headers
      (newConfig.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      return newConfig;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle common errors here (e.g., 401 Unauthorized)
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('authUser');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Helper function to make type-safe API calls
export const apiRequest = async <T = any>(
  config: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await apiClient.request<ApiResponse<T>>(config);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(error.response.data.message || 'An error occurred');
    }
    throw error;
  }
};

export default apiClient;
