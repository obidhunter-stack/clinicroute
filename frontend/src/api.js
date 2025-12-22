// API Service - Connects frontend to backend
// Uses environment variable for API URL in production

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.setToken(null);
        window.location.href = '/';
        throw new Error('Unauthorized');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  // Auth
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.accessToken);
    return data;
  }

  async logout() {
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Cases
  async getCases(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/cases${query ? `?${query}` : ''}`);
  }

  async getCase(id) {
    return this.request(`/cases/${id}`);
  }

  async createCase(data) {
    return this.request('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCaseStatus(id, status, reason) {
    return this.request(`/cases/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async getCaseStats() {
    return this.request('/cases/stats');
  }

  // Reports
  async getDashboard() {
    return this.request('/reports/dashboard');
  }

  async getWeeklyTrend() {
    return this.request('/reports/weekly-trend');
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  // Audit
  async getAuditLogs(caseId) {
    return this.request(`/audit/case/${caseId}`);
  }
}

export const api = new ApiService();
export default api;
