import moment from 'moment';

// Format numbers
export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '0';
  return parseFloat(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Format currency
export const formatCurrency = (amount, currency = 'MYC') => {
  return `${formatNumber(amount, 8)} ${currency}`;
};

// Format address (short version)
export const formatAddress = (address, start = 6, end = 4) => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

// Format hash
export const formatHash = (hash, length = 8) => {
  if (!hash) return '';
  return hash.length > length ? `${hash.slice(0, length)}...` : hash;
};

// Format time
export const formatTime = (timestamp) => {
  return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

// Format time ago
export const formatTimeAgo = (timestamp) => {
  return moment(timestamp).fromNow();
};

// Format block time
export const formatBlockTime = (seconds) => {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
};

// Validate address format
export const isValidAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  // Basic validation for MyCoin address (starts with 1 or 3, length 26-35)
  return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
};

// Validate private key
export const isValidPrivateKey = (privateKey) => {
  if (!privateKey || typeof privateKey !== 'string') return false;
  // 64 character hex string
  return /^[a-fA-F0-9]{64}$/.test(privateKey);
};

// Validate amount
export const isValidAmount = (amount) => {
  if (!amount) return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 21000000; // Max supply
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

// Generate secure password
export const generateSecurePassword = (length = 16) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Calculate transaction fee
export const calculateFee = (amount, feeRate = 0.001) => {
  return parseFloat(amount) * feeRate;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate QR code data
export const generateQRCodeData = (address, amount = null, label = null) => {
  let data = `mycoin:${address}`;
  const params = [];
  
  if (amount) params.push(`amount=${amount}`);
  if (label) params.push(`label=${encodeURIComponent(label)}`);
  
  if (params.length > 0) {
    data += `?${params.join('&')}`;
  }
  
  return data;
};

// Color helpers
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return '#10b981'; // green
    case 'pending':
      return '#f59e0b'; // yellow
    case 'failed':
      return '#ef4444'; // red
    default:
      return '#64748b'; // gray
  }
};

export const getTransactionTypeColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'mining':
      return '#8b5cf6'; // purple
    case 'staking':
      return '#06b6d4'; // cyan
    case 'send':
      return '#ef4444'; // red
    case 'receive':
      return '#10b981'; // green
    default:
      return '#64748b'; // gray
  }
};
