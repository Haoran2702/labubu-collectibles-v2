// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    auth: {
      login: `${API_BASE_URL}/api/auth/login`,
      register: `${API_BASE_URL}/api/auth/register`,
      profile: `${API_BASE_URL}/api/auth/profile`,
      verifyEmail: `${API_BASE_URL}/api/auth/verify-email`,
      resendVerification: `${API_BASE_URL}/api/auth/resend-verification`,
      changePassword: `${API_BASE_URL}/api/auth/change-password`,
      forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
      resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
    },
    products: `${API_BASE_URL}/api/products`,
    orders: `${API_BASE_URL}/api/orders`,
    payments: `${API_BASE_URL}/api/payments`,
    support: `${API_BASE_URL}/api/support`,
    reviews: `${API_BASE_URL}/api/reviews`,
    analytics: `${API_BASE_URL}/api/analytics`,
    users: `${API_BASE_URL}/api/users`,
    privacy: `${API_BASE_URL}/api/privacy`,
    marketing: `${API_BASE_URL}/api/marketing`,
    currency: `${API_BASE_URL}/api/currency`,
    forecasting: `${API_BASE_URL}/api/forecasting`,
    fraud: `${API_BASE_URL}/api/fraud`,
  }
};

// Helper function to make API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  return fetch(url, defaultOptions);
};
