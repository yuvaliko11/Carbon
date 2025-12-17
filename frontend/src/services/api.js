import axios from 'axios';

// Simple in-memory cache for API responses (reduces network requests on mobile)
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Export cache clearing function
export const clearCache = (pattern) => {
  if (pattern) {
    // Clear specific cache entries matching pattern
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear all cache
    cache.clear();
  }
};

const getCacheKey = (url, params) => {
  return `${url}?${JSON.stringify(params || {})}`;
};

const getCachedResponse = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedResponse = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// Determine API URL based on environment
// In development, try both common ports (5000 and 5001)
// In production, use the configured URL or default to Azure VM
const getApiUrl = () => {
  // If explicitly set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // In production, use the current origin + /api to avoid mixed content issues
  if (process.env.NODE_ENV === 'production') {
    // If we are on HTTPS, this will use HTTPS. If HTTP, it will use HTTP.
    // This prevents "Not Secure" warnings when accessing via IP address.
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api`;
    }
    return '/api';
  }

  // In development, default to port 5002 (Fiji Carbon Hub Backend)
  // User can override with REACT_APP_API_URL if backend is on 5000
  return 'http://localhost:5002/api';
};

const API_URL = getApiUrl();

// Log for debugging (always log in production to help debug mobile issues)
console.log('🔗 [API] API URL:', API_URL);
console.log('🔗 [API] NODE_ENV:', process.env.NODE_ENV);
console.log('🔗 [API] REACT_APP_API_URL:', process.env.REACT_APP_API_URL || 'not set (using default)');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 300 seconds (5 minutes) timeout - increased for OCR processing
  // Add retry configuration
  // CRITICAL: 401 errors should throw - they indicate authentication failure
  validateStatus: (status) => {
    // 401 should throw (authentication failure)
    if (status === 401) return false;
    // Other 4xx errors can be handled gracefully, but 5xx should throw
    return status < 500;
  },
});

// Safe localStorage access for mobile browsers
const safeLocalStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      // Ignore localStorage errors on mobile
    }
    return null;
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      // Ignore localStorage errors on mobile
    }
  },
};

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = safeLocalStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request for debugging (especially login)
    if (config.url?.includes('/auth/login')) {
      const requestStartTime = Date.now();
      config.requestStartTime = requestStartTime; // Store for response interceptor
      console.log('🔗 [API] Login request START:', {
        url: `${config.baseURL}${config.url}`,
        method: config.method,
        hasEmail: !!config.data?.email,
        timestamp: new Date().toISOString(),
      });
    }

    // Store cache key in config for later use in response interceptor
    if (config.method === 'get' && !config.skipCache && !config.url?.includes('/auth/')) {
      config.cacheKey = getCacheKey(config.url, config.params);
    }

    return config;
  },
  (error) => {
    console.error('❌ [API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle token expiration and connection errors, and cache responses
api.interceptors.response.use(
  (response) => {
    // Log login response timing
    if (response.config.url?.includes('/auth/login') && response.config.requestStartTime) {
      const duration = Date.now() - response.config.requestStartTime;
      console.log(`✅ [API] Login request SUCCESS in ${duration}ms:`, {
        status: response.status,
        hasToken: !!response.data?.data?.token,
      });
    }

    // Cache GET responses (skip cache for auth endpoints and if explicitly disabled)
    if (
      response.config.method === 'get' &&
      !response.config.skipCache &&
      !response.config.fromCache &&
      response.config.cacheKey &&
      !response.config.url?.includes('/auth/')
    ) {
      setCachedResponse(response.config.cacheKey, response.data);
    }

    return response;
  },
  (error) => {
    // Log error for debugging (especially login)
    if (error.config?.url?.includes('/auth/login')) {
      const duration = error.config.requestStartTime ? Date.now() - error.config.requestStartTime : 'unknown';
      console.error('❌ [API] Login request ERROR:', {
        code: error.code,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        duration: `${duration}ms`,
        responseData: error.response?.data,
      });
    }

    // For 401 errors, fail fast - don't wait for timeout
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/me');

      // For /auth/me endpoint, 401 is expected when token is invalid - don't log as error
      // This is normal during token verification
      if (isAuthEndpoint) {
        // Silently handle - this is expected when verifying an invalid token
        safeLocalStorage.removeItem('token');
        safeLocalStorage.removeItem('user');
        return Promise.reject(error);
      }

      // For other endpoints, log the error
      console.error('❌ [API] 401 Unauthorized - clearing auth data');
      // Clear auth data immediately
      safeLocalStorage.removeItem('token');
      safeLocalStorage.removeItem('user');

      // Only redirect if not already on login page and not during initial load
      if (!window.location.pathname.includes('/login') &&
        !error.config?.skipAuthRedirect) {
        // Use setTimeout to avoid blocking the error handling
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            console.log('🔄 [API] Redirecting to login due to 401');
            window.location.href = '/login';
          }
        }, 100);
      }

      // Reject immediately to avoid waiting for timeout
      return Promise.reject(error);
    }

    // Handle 503 Service Unavailable (database connection issues)
    if (error.response?.status === 503) {
      error.response = {
        ...error.response,
        data: {
          success: false,
          message: error.response.data?.message || 'Service temporarily unavailable. The database may be connecting. Please try again in a moment.',
        },
        status: 503,
      };
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      error.response = {
        ...error.response,
        data: {
          success: false,
          message: 'Request timed out. The server may be slow or unavailable. Please try again.',
        },
        status: 504,
      };
    }

    // Handle network errors (connection refused, server not running, etc.)
    if (error.code === 'ERR_NETWORK' || !error.response) {
      const isLocalhost = API_URL.includes('localhost');
      const message = isLocalhost
        ? 'Unable to connect to server. Please ensure the backend server is running on port 5002.'
        : 'Unable to connect to server. Please check your internet connection and try again.';

      error.response = {
        ...error.response,
        data: {
          success: false,
          message,
        },
        status: 0,
      };
    }

    return Promise.reject(error);
  }
);

// Wrapper for GET requests with cache support
const cachedGet = (url, config = {}) => {
  const cacheKey = getCacheKey(url, config.params);

  // Check cache first (skip for auth endpoints)
  if (!config.skipCache && !url.includes('/auth/')) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return Promise.resolve({
        data: cached,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { ...config, url, fromCache: true },
      });
    }
  }

  // Set cacheKey in config so response interceptor can cache it
  return api.get(url, { ...config, cacheKey });
};

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'), // Auth endpoints don't use cache
};

// Land Rights API (Sprint 2)
export const landUnitsAPI = {
  getAll: () => cachedGet('/land-units'),
  getById: (id) => cachedGet(`/land-units/${id}`),
  create: (data) => api.post('/land-units', data),
  update: (id, data) => api.put(`/land-units/${id}`, data),
  delete: (id) => api.delete(`/land-units/${id}`),
};

export const parcelsAPI = {
  getAll: () => cachedGet('/parcels'),
  getById: (id) => cachedGet(`/parcels/${id}`),
  create: (data) => api.post('/parcels', data),
  update: (id, data) => api.put(`/parcels/${id}`, data),
  delete: (id) => api.delete(`/parcels/${id}`),
};

export const organizationsAPI = {
  getAll: () => cachedGet('/organizations'),
  create: (data) => api.post('/organizations', data),
};

export const leasesAPI = {
  getAll: () => cachedGet('/leases'),
  getById: (id) => cachedGet(`/leases/${id}`),
  create: (data) => {
    console.log('leasesAPI.create payload:', data);
    return api.post('/leases', data).then(response => {
      clearCache('/leases');
      clearCache('/reports/geojson');
      clearCache('/carbon-contracts');
      return response;
    });
  },
  update: (id, data) => api.put(`/leases/${id}`, data).then(response => {
    clearCache('/leases');
    clearCache('/reports/geojson');
    clearCache('/carbon-contracts');
    return response;
  }),
  delete: (id) => api.delete(`/leases/${id}`).then(response => {
    clearCache('/leases');
    clearCache('/reports/geojson');
    clearCache('/carbon-contracts');
    return response;
  }),
  calculateTransferFee: (id, data) => api.post(`/leases/${id}/calculate-transfer-fee`, data),
  cleanupOrphans: () => api.delete('/leases/cleanup/orphans').then(response => {
    clearCache('/parcels');
    clearCache('/reports/geojson');
    return response;
  }),
};

// Legacy APIs (kept for compatibility if needed, but should migrate)
export const sitesAPI = {
  getAll: (params) => cachedGet('/sites', { params }),
  getById: (id) => cachedGet(`/sites/${id}`),
  create: (data) => api.post('/sites', data),
  update: (id, data) => api.put(`/sites/${id}`, data),
  delete: (id) => api.delete(`/sites/${id}`),
  getProperties: (id) => cachedGet(`/sites/${id}/properties`),
};

export const assetsAPI = {
  getAll: (params) => cachedGet('/assets', { params }),
  getById: (id) => cachedGet(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
};

export const propertiesAPI = assetsAPI;

export const carbonContractsAPI = {
  getAll: (params) => cachedGet('/carbon-contracts', { params }),
  getById: (id) => cachedGet(`/carbon-contracts/${id}`),
  create: (data) => api.post('/carbon-contracts', data).then(response => {
    clearCache('/carbon-contracts');
    clearCache('/leases');
    clearCache('/reports/geojson');
    clearCache('/parcels');
    clearCache('/land-units');
    return response;
  }),
  update: (id, data) => api.put(`/carbon-contracts/${id}`, data).then(response => {
    clearCache('/carbon-contracts');
    clearCache('/leases');
    clearCache('/reports/geojson');
    clearCache('/parcels');
    clearCache('/land-units');
    return response;
  }),
  delete: (id) => api.delete(`/carbon-contracts/${id}`).then(response => {
    clearCache('/carbon-contracts');
    clearCache('/leases');
    clearCache('/reports/geojson');
    clearCache('/parcels');
    clearCache('/land-units');
    return response;
  }),
  chat: (message, context) => api.post('/carbon-contracts/chat', { message, context }),
  upload: (formData, onUploadProgress) => api.post('/carbon-contracts/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onUploadProgress || (() => { }),
  }).then(response => {
    clearCache('/carbon-contracts');
    clearCache('/leases');
    clearCache('/reports/geojson');
    clearCache('/parcels');
    clearCache('/land-units');
    return response;
  }),
};

export const reportsAPI = {
  getSitesSummary: () => cachedGet('/reports/sites-summary'),
  getPropertiesSummary: () => cachedGet('/reports/properties-summary'),
  getGeoJSON: (params) => cachedGet('/reports/geojson', { params }),
};

export const usersAPI = {
  getAll: () => cachedGet('/users'),
  getById: (id) => cachedGet(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updatePassword: (id, password) => api.put(`/users/${id}/password`, { password }),
  delete: (id) => api.delete(`/users/${id}`),
  getMe: () => api.get('/users/me'), // User profile - don't cache
};

export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadReport: (file) => {
    const formData = new FormData();
    formData.append('report', file);
    return api.post('/upload/report', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const earthquakesAPI = {
  upload: (files, name, description) => {
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach(file => {
      formData.append('geojson', file);
    });
    if (fileArray.length > 1 && name) {
      fileArray.forEach((file, index) => {
        formData.append('name', `${name}_${file.name.replace(/\.(geojson|json)$/i, '')}`);
      });
    } else if (name) {
      formData.append('name', name);
    }
    if (fileArray.length > 1 && description) {
      fileArray.forEach(() => {
        formData.append('description', description);
      });
    } else if (description) {
      formData.append('description', description);
    }
    return api.post('/earthquakes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(response => {
      clearCache('/earthquakes');
      return response;
    });
  },
  getAll: (params, skipCache = false) => cachedGet('/earthquakes', { params, skipCache }),
  getById: (id) => cachedGet(`/earthquakes/${id}`),
  delete: (id) => api.delete(`/earthquakes/${id}`).then(response => {
    clearCache('/earthquakes');
    return response;
  }),
  getGeoJSON: (id) => cachedGet(`/earthquakes/${id}/geojson`),
  generate: (prompt, name, description) => api.post('/earthquakes/generate', {
    prompt,
    name,
    description,
  }).then(response => {
    clearCache('/earthquakes');
    return response;
  }),
};

export const dangerMapsAPI = {
  upload: (files, name, description) => {
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach(file => {
      formData.append('file', file);
    });
    if (fileArray.length > 1 && name) {
      fileArray.forEach((file, index) => {
        formData.append('name', `${name}_${file.name.replace(/\.(geojson|json|kmz|kml)$/i, '')}`);
      });
    } else if (name) {
      formData.append('name', name);
    }
    if (fileArray.length > 1 && description) {
      fileArray.forEach(() => {
        formData.append('description', description);
      });
    } else if (description) {
      formData.append('description', description);
    }
    return api.post('/danger-maps/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(response => {
      clearCache('/danger-maps');
      return response;
    });
  },
  getAll: (params, skipCache = false) => cachedGet('/danger-maps', { params, skipCache }),
  getById: (id) => cachedGet(`/danger-maps/${id}`),
  delete: (id) => api.delete(`/danger-maps/${id}`).then(response => {
    clearCache('/danger-maps');
    return response;
  }),
  getGeoJSON: (id) => cachedGet(`/danger-maps/${id}/geojson`),
  generate: (prompt, name, description) => api.post('/danger-maps/generate', {
    prompt,
    name,
    description,
  }).then(response => {
    clearCache('/danger-maps');
    return response;
  }),
};

export const uploadsAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
};

export default api;

