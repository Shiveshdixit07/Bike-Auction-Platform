const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/v1`;

class ApiClient {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

    const data = await response.json();

    if (response.status === 401 && data.message === 'Token expired') {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
        return retryResponse.json();
      }
      this.clearTokens();
      window.location.href = '/login';
      return data;
    }

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  async register(name, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    this.setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  }

  async registerAdmin(name, email, password, role = 'BUYER') {
    const data = await this.request('/auth/register-admin', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    return data.data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  }

  logout() {
    this.clearTokens();
  }

  async getMe() {
    const data = await this.request('/users/me');
    return data.data.user;
  }

  async getAuctions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const data = await this.request(`/auctions?${query}`);
    return data.data;
  }

  async getAuction(id) {
    const data = await this.request(`/auctions/${id}`);
    return data.data.auction;
  }

  async createAuction(auctionData) {
    const data = await this.request('/auctions', {
      method: 'POST',
      body: JSON.stringify(auctionData),
    });
    return data.data.auction;
  }

  async updateAuction(id, auctionData) {
    const data = await this.request(`/auctions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(auctionData),
    });
    return data.data.auction;
  }

  async publishAuction(id) {
    const data = await this.request(`/auctions/${id}/publish`, {
      method: 'POST',
    });
    return data.data.auction;
  }

  async cancelAuction(id) {
    const data = await this.request(`/auctions/${id}/cancel`, {
      method: 'POST',
    });
    return data.data.auction;
  }

  async settleAuction(id) {
    const data = await this.request(`/auctions/${id}/settle`, {
      method: 'POST',
    });
    return data.data.auction;
  }

  async placeBid(auctionId, amount) {
    const data = await this.request(`/auctions/${auctionId}/bids`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    return data.data.bid;
  }

  async getBids(auctionId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const data = await this.request(`/auctions/${auctionId}/bids?${query}`);
    return data.data;
  }

  async createBike(bikeData) {
    const data = await this.request('/bikes', {
      method: 'POST',
      body: JSON.stringify(bikeData),
    });
    return data.data.bike;
  }

  async getBikes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const data = await this.request(`/bikes?${query}`);
    return data.data;
  }

  async getAdminDashboard() {
    const data = await this.request('/admin/dashboard');
    return data.data.dashboard;
  }
}

export const api = new ApiClient();
export default api;
