import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/blockchain';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

export const walletAPI = {
  // Create new wallet
  createWallet: (data) => api.post('/wallet/create/', data),
  
  // Import existing wallet
  importWallet: (data) => api.post('/wallet/import/', data),
  
  // Get wallet details
  getWallet: (address) => api.get(`/wallet/${address}/`),
  
  // Get wallet with private key (requires password)
  getWalletWithPrivateKey: (address, password) => api.post(`/wallet/${address}/unlock/`, { password }),
  
  // Get wallet balance
  getBalance: (address) => api.get(`/wallet/${address}/balance/`),
  
  // Get wallet transactions
  getTransactions: (address, page = 1) => api.get(`/wallet/${address}/transactions/?page=${page}`),
};

export const transactionAPI = {
  // Send transaction
  send: (data) => api.post('/transaction/send/', data),
  sendTransaction: (data) => api.post('/transaction/send/', data),
  
  // Get transaction details
  getTransaction: (txId) => api.get(`/transaction/${txId}/`),
  
  // Get all transactions (for explorer)
  getTransactions: (page = 1, limit = 10) => api.get(`/transactions/?page=${page}&limit=${limit}`),
};

export const notificationAPI = {
  // Get notifications for an address
  getNotifications: (address, status = null) => {
    const url = status ? `/notifications/${address}/?status=${status}` : `/notifications/${address}/`;
    return api.get(url);
  },
  
  // Get specific notification details
  getNotification: (notificationId) => api.get(`/notification/${notificationId}/`),
  
  // Respond to notification (accept/reject)
  respondNotification: (data) => api.post('/notification/respond/', data),
};

export const blockAPI = {
  // Get all blocks
  getBlocks: (page = 1, limit = 20) => api.get(`/blocks/?page=${page}&limit=${limit}`),
  
  // Get block details
  getBlock: (blockId) => api.get(`/block/${blockId}/`),
  
  // Mine new block
  mineBlock: (data) => api.post('/mine/', data),
};

export const networkAPI = {
  // Get network statistics
  getStats: () => api.get('/stats/'),
  
  // Search blockchain
  search: (query) => api.get(`/search/?q=${encodeURIComponent(query)}`),
  
  // Get mining pools
  getMiningPools: () => api.get('/mining-pools/'),
  
  // Get staking pools
  getStakingPools: () => api.get('/staking-pools/'),
};

export default api;
