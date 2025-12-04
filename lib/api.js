// API Client for Marv Manager

const DEFAULT_SERVER_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';

// Make browser requests go directly to the backend (no proxy).
// Allow overriding the backend URL via `localStorage.marv_base_url` for testing.
const BASE_URL = typeof window !== 'undefined'
  ? (localStorage.getItem('marv_base_url') || DEFAULT_SERVER_BASE)
  : DEFAULT_SERVER_BASE;

class APIClient {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('marv_token');
    }
    return null;
  }

  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('marv_token', token);
    }
  }

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('marv_token');
    }
  }

  setBaseUrl(url) {
    this.baseUrl = url;
    if (typeof window !== 'undefined') {
      localStorage.setItem('marv_base_url', url);
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

      const headers = {
        ...(options.headers || {}),
      };

      // Only set JSON content type when sending a body to avoid unnecessary CORS preflight
      if (options.body && !('Content-Type' in headers)) {
        headers['Content-Type'] = 'application/json';
      }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('نشست شما منقضی شده است');
      }

      const data = response.status !== 204 ? await response.json() : null;

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || 'خطا در ارتباط با سرور');
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError') {
        throw new Error('خطا در اتصال به سرور');
      }
      throw error;
    }
  }

  // Auth
  async login(username, password) {
    const data = await this.request('/accounts/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (data?.access_token) {
      this.setToken(data.access_token);
    }

    return data;
  }

  async register(username, password, role = 'viewer') {
    return this.request('/accounts/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    });
  }

  async me() {
    return this.request('/accounts/me');
  }

  async logout() {
    try {
      await this.request('/accounts/logout', { method: 'GET' });
    } catch (e) {
      // ignore errors during logout request, still clear local token
    }
    this.clearToken();
  }

  async clearSessions() {
    // OpenAPI indicates this endpoint uses DELETE to clear sessions
    return this.request('/accounts/clearsessions', { method: 'DELETE' });
  }

  // Persons
  async getPersons(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/persons${query ? `?${query}` : ''}`);
  }

  async getPerson(id) {
    return this.request(`/persons/${id}`);
  }

  async createPerson(data) {
    return this.request('/persons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePerson(id, data) {
    return this.request(`/persons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePerson(id) {
    return this.request(`/persons/${id}`, { method: 'DELETE' });
  }

  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async createProduct(data) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id, data) {
    return this.request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Devices
  async getDevices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/devices${query ? `?${query}` : ''}`);
  }

  async getDevice(id) {
    return this.request(`/devices/${id}`);
  }

  async getDeviceBySerial(serial) {
    return this.request(`/devices/serial/${encodeURIComponent(serial)}`);
  }

  async createDevice(data) {
    return this.request('/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDevice(id, data) {
    return this.request(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDevice(id) {
    return this.request(`/devices/${id}`, { method: 'DELETE' });
  }

  // Repairs
  async getRepairs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/repairs${query ? `?${query}` : ''}`);
  }

  async getRepair(id) {
    return this.request(`/repairs/${id}`);
  }

  async createRepair(data) {
    return this.request('/repairs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRepair(id, data) {
    return this.request(`/repairs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteRepair(id) {
    return this.request(`/repairs/${id}`, { method: 'DELETE' });
  }

  // Tests
  async getTests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/tests${query ? `?${query}` : ''}`);
  }

  async getTest(id) {
    return this.request(`/tests/${id}`);
  }

  async createTest(data) {
    return this.request('/tests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTest(id, data) {
    return this.request(`/tests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTest(id) {
    return this.request(`/tests/${id}`, { method: 'DELETE' });
  }

  // Warranty Check (Public)
  async checkWarranty(serial) {
    return this.request(`/warranty/check/${encodeURIComponent(serial)}`);
  }
}

export const api = new APIClient();
export default api;
