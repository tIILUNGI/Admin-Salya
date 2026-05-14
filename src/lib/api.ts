export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.salya.ilungi.digital/api';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('admin_token');

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if ((response.status === 401 || response.status === 403) && !endpoint.startsWith('/auth')) {
    // Token expired or invalid for protected endpoints
    localStorage.removeItem('admin_token');
    
    // Only redirect if not already on login page to avoid loops
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Authentication required');
  }

  return response;
};

export const apiGet = (endpoint: string) => apiRequest(endpoint);
export const apiPost = (endpoint: string, data: any) => apiRequest(endpoint, {
  method: 'POST',
  body: JSON.stringify(data),
});
export const apiPut = (endpoint: string, data: any) => apiRequest(endpoint, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const apiPatch = (endpoint: string, data: any) => apiRequest(endpoint, {
  method: 'PATCH',
  body: JSON.stringify(data),
});
export const apiDelete = (endpoint: string) => apiRequest(endpoint, {
  method: 'DELETE',
});