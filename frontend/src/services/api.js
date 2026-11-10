import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Accept': 'application/json',
  },
})

// Request interceptor to attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pneumo_access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('pneumo_refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          })
          const { access_token, refresh_token: new_refresh } = res.data
          localStorage.setItem('pneumo_access_token', access_token)
          localStorage.setItem('pneumo_refresh_token', new_refresh)
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch (refreshErr) {
          localStorage.removeItem('pneumo_access_token')
          localStorage.removeItem('pneumo_refresh_token')
          localStorage.removeItem('pneumo_user')
          window.dispatchEvent(new Event('auth:logout'))
        }
      }
    }

    if (error.code === 'ERR_NETWORK') {
      error.message = 'Unable to connect to the AI server. Please check your internet connection or try again later.'
    } else if (error.response?.data?.detail) {
      error.message = error.response.data.detail
    }
    return Promise.reject(error)
  }
)

// --- Authentication APIs ---
export const registerUser = async (data) => {
  const res = await api.post('/api/auth/register', data)
  return res.data
}

export const loginUser = async (data) => {
  const res = await api.post('/api/auth/login', data)
  return res.data
}

export const logoutUser = async (refreshToken) => {
  try {
    if (refreshToken) {
      await api.post('/api/auth/logout', { refresh_token: refreshToken })
    }
  } catch (e) {
    // ignore network errors on logout
  }
}

export const getCurrentUser = async () => {
  const res = await api.get('/api/auth/me')
  return res.data
}

export const forgotPassword = async (email) => {
  const res = await api.post('/api/auth/forgot-password', { email })
  return res.data
}

export const resetPassword = async (data) => {
  const res = await api.post('/api/auth/reset-password', data)
  return res.data
}

export const changePassword = async (data) => {
  const res = await api.post('/api/auth/change-password', data)
  return res.data
}

// --- Prediction & Batch APIs ---
export const predictImage = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/api/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const predictBatch = async (files) => {
  const formData = new FormData()
  files.forEach((f) => formData.append('files', f))
  const res = await api.post('/api/predict/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// --- History & Report APIs ---
export const getUserHistory = async (params = {}) => {
  const res = await api.get('/api/history', { params })
  return res.data
}

// Backward-compatible aliases
export const getHistory = getUserHistory
export const clearHistory = async () => {
  const res = await api.delete('/api/history')
  return res.data
}

export const getPredictionById = async (id) => {
  const res = await api.get(`/api/history/${id}`)
  return res.data
}

export const deletePrediction = async (id) => {
  const res = await api.delete(`/api/history/${id}`)
  return res.data
}

export const clearUserHistory = async () => {
  const res = await api.delete('/api/history')
  return res.data
}

export const downloadReportBlob = async (predictionId) => {
  const token = localStorage.getItem('pneumo_access_token')
  const res = await axios.get(`${API_BASE_URL}/api/reports/${predictionId}/pdf`, {
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return res.data
}

// --- Dashboard & System APIs ---
export const getDashboardStats = async () => {
  const res = await api.get('/api/dashboard/stats')
  return res.data
}

export const getSystemHealth = async () => {
  const res = await api.get('/api/system/health')
  return res.data
}

export const getMetrics = async () => {
  const res = await api.get('/metrics')
  return res.data
}

export const checkHealth = async () => {
  const res = await api.get('/health')
  return res.data
}

export const getSampleImages = async () => {
  const res = await api.get('/sample-images')
  return res.data
}

// --- Model Versioning & Comparison APIs ---
export const getActiveModelMetadata = async () => {
  const res = await api.get('/api/models/active')
  return res.data
}

export const getModelComparison = async () => {
  const res = await api.get('/api/models/comparison')
  return res.data
}

export const getUserActivities = async (page = 1, perPage = 20) => {
  const res = await api.get('/api/user/activities', {
    params: { page, per_page: perPage },
  })
  return res.data
}

// --- xAI Grok LLM Assistant APIs ---
export const grokChat = async (messages, language = 'en') => {
  const res = await api.post('/api/grok/chat', { messages, language })
  return res.data
}

export const explainWithGrok = async (data) => {
  const res = await api.post('/api/grok/explain-prediction', data)
  return res.data
}

export const getGrokReportSummary = async (data) => {
  const res = await api.post('/api/grok/report-summary', data)
  return res.data
}

export default api
