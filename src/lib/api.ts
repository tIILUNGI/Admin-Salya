// Detecta se está em desenvolvimento local
const isLocalDevelopment = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    import.meta.env?.MODE === 'development'
  );
};

// Define a URL base da API com fallback
const getApiBaseUrl = (): string => {
  // 1. Se tem variável de ambiente (Vite ou env), usa ela
  const envUrl = import.meta.env?.VITE_API_BASE_URL || (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL);
  if (envUrl) {
    return envUrl;
  }
  
  // 2. Se está em desenvolvimento local, usa caminho relativo para
  //    aproveitar o proxy do Vite (evita problemas de CORS)
  if (isLocalDevelopment()) {
    return '/api';
  }
  
  // 3. Caso contrário, usa produção
  return 'https://api.salya.ao/api';
};

export const API_BASE_URL = getApiBaseUrl();
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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Only handle 401 Unauthorized for primary protected endpoints (ignore 403 Forbidden and background polling like /notificacoes)
    if (response.status === 401 && !endpoint.startsWith('/auth') && !endpoint.includes('notificacoes')) {
      localStorage.removeItem('admin_token');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`, {
        endpoint,
        status: response.status,
        statusText: response.statusText
      });
    }

    return response;
  } catch (error) {
    console.error('API Request Error:', {
      endpoint,
      error: error instanceof Error ? error.message : String(error),
      apiUrl: API_BASE_URL
    });
    throw error;
  }
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