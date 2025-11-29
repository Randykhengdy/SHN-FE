// Token Storage Utility - Multiple storage methods for better persistence
import CryptoJS from 'crypto-js';

// Storage methods priority
const STORAGE_METHODS = {
  LOCAL_STORAGE: 'localStorage',
  SESSION_STORAGE: 'sessionStorage',
  MEMORY: 'memory'
};

// In-memory fallback storage
const memoryStorage = new Map();

// Check if storage is available
const isStorageAvailable = (type) => {
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Get best available storage method
const getBestStorage = () => {
  if (isStorageAvailable('localStorage')) {
    return STORAGE_METHODS.LOCAL_STORAGE;
  }
  if (isStorageAvailable('sessionStorage')) {
    return STORAGE_METHODS.SESSION_STORAGE;
  }
  return STORAGE_METHODS.MEMORY;
};

// Storage wrapper class
class TokenStorage {
  constructor() {
    this.storageMethod = getBestStorage();
    this.prefix = 'shn_app_';
    this.encPrefix = '__aes__:';
    this.encryptedKeys = new Set(['role_permissions_data']);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Using storage method: ${this.storageMethod}`);
    }
  }

  // Get encryption key from env
  getEncryptionKey() {
    const key = (import.meta && import.meta.env && import.meta.env.VITE_STORAGE_ENCRYPTION_KEY) || '';
    return key && typeof key === 'string' ? key : '722862dd-2e80-42aa-adaa-80c0aee7eaea';
  }

  // Encrypt string value
  encryptValue(value) {
    try {
      const key = this.getEncryptionKey();
      const cipher = CryptoJS.AES.encrypt(String(value), key).toString();
      return `${this.encPrefix}${cipher}`;
    } catch (e) {
      return String(value);
    }
  }

  // Decrypt string value (if encrypted)
  decryptValue(value) {
    try {
      if (typeof value !== 'string') return value;
      if (!value.startsWith(this.encPrefix)) return value;
      const cipher = value.slice(this.encPrefix.length);
      const key = this.getEncryptionKey();
      const bytes = CryptoJS.AES.decrypt(cipher, key);
      const plain = bytes.toString(CryptoJS.enc.Utf8);
      return plain || '';
    } catch (e) {
      return value;
    }
  }

  // Set item with fallback
  setItem(key, value) {
    const fullKey = `${this.prefix}${key}`;
    
    try {
      const toStore = this.encryptedKeys.has(key) ? this.encryptValue(value) : value;
      switch (this.storageMethod) {
        case STORAGE_METHODS.LOCAL_STORAGE:
          localStorage.setItem(fullKey, toStore);
          break;
        case STORAGE_METHODS.SESSION_STORAGE:
          sessionStorage.setItem(fullKey, toStore);
          break;
        case STORAGE_METHODS.MEMORY:
          memoryStorage.set(fullKey, toStore);
          break;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Stored ${key} using ${this.storageMethod}`);
      }
    } catch (error) {
      console.error(`❌ Failed to store ${key}:`, error);
      // Fallback to memory
      memoryStorage.set(fullKey, value);
    }
  }

  // Get item with fallback
  getItem(key) {
    const fullKey = `${this.prefix}${key}`;
    
    try {
      let stored;
      switch (this.storageMethod) {
        case STORAGE_METHODS.LOCAL_STORAGE:
          stored = localStorage.getItem(fullKey);
          break;
        case STORAGE_METHODS.SESSION_STORAGE:
          stored = sessionStorage.getItem(fullKey);
          break;
        case STORAGE_METHODS.MEMORY:
          stored = memoryStorage.get(fullKey);
          break;
      }
      return this.encryptedKeys.has(key) ? this.decryptValue(stored) : stored;
    } catch (error) {
      console.error(`❌ Failed to retrieve ${key}:`, error);
      // Fallback to memory
      const stored = memoryStorage.get(fullKey);
      return this.encryptedKeys.has(key) ? this.decryptValue(stored) : stored;
    }
  }

  // Migrate old role_permissions from base64/plain to AES
  migrateRolePermissions() {
    try {
      const fullKey = `${this.prefix}role_permissions`;
      const raw = localStorage.getItem(fullKey);
      if (raw) {
        try { localStorage.removeItem(fullKey); } catch (_) {}
      }
    } catch (_) {}
  }

  // Remove item
  removeItem(key) {
    const fullKey = `${this.prefix}${key}`;
    
    try {
      switch (this.storageMethod) {
        case STORAGE_METHODS.LOCAL_STORAGE:
          localStorage.removeItem(fullKey);
          break;
        case STORAGE_METHODS.SESSION_STORAGE:
          sessionStorage.removeItem(fullKey);
          break;
        case STORAGE_METHODS.MEMORY:
          memoryStorage.delete(fullKey);
          break;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ Removed ${key} from ${this.storageMethod}`);
      }
    } catch (error) {
      console.error(`❌ Failed to remove ${key}:`, error);
      // Fallback to memory
      memoryStorage.delete(fullKey);
    }
  }

  // Clear all app data
  clear() {
    try {
      switch (this.storageMethod) {
        case STORAGE_METHODS.LOCAL_STORAGE:
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
              localStorage.removeItem(key);
            }
          });
          break;
        case STORAGE_METHODS.SESSION_STORAGE:
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
              sessionStorage.removeItem(key);
            }
          });
          break;
        case STORAGE_METHODS.MEMORY:
          memoryStorage.clear();
          break;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🧹 Cleared all app data from ${this.storageMethod}`);
      }
    } catch (error) {
      console.error('❌ Failed to clear storage:', error);
      // Fallback to memory
      memoryStorage.clear();
    }
  }

  // Get storage info for debugging
  getStorageInfo() {
    return {
      method: this.storageMethod,
      prefix: this.prefix,
      available: isStorageAvailable('localStorage'),
      sessionAvailable: isStorageAvailable('sessionStorage'),
      memorySize: memoryStorage.size
    };
  }

  // Migrate data from old storage (without prefix)
  migrateFromOldStorage() {
    const oldKeys = ['token', 'refresh_token', 'token_type', 'isLoggedIn', 'user'];
    
    oldKeys.forEach(key => {
      try {
        const oldValue = localStorage.getItem(key);
        if (oldValue) {
          this.setItem(key, oldValue);
          localStorage.removeItem(key);
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Migrated ${key} to new storage`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to migrate ${key}:`, error);
      }
    });
  }
}

// Create singleton instance
const tokenStorage = new TokenStorage();

// Migrate old data on initialization
tokenStorage.migrateFromOldStorage();
// Migrate role_permissions to AES if needed
tokenStorage.migrateRolePermissions();

export default tokenStorage;

// Convenience functions for backward compatibility
export const getToken = () => tokenStorage.getItem('token');
export const setToken = (token) => tokenStorage.setItem('token', token);
export const removeToken = () => tokenStorage.removeItem('token');

export const getRefreshToken = () => tokenStorage.getItem('refresh_token');
export const setRefreshToken = (token) => tokenStorage.setItem('refresh_token', token);
export const removeRefreshToken = () => tokenStorage.removeItem('refresh_token');

export const getTokenType = () => tokenStorage.getItem('token_type');
export const setTokenType = (type) => tokenStorage.setItem('token_type', type);
export const removeTokenType = () => tokenStorage.removeItem('token_type');

export const getIsLoggedIn = () => tokenStorage.getItem('isLoggedIn');
export const setIsLoggedIn = (status) => tokenStorage.setItem('isLoggedIn', status);
export const removeIsLoggedIn = () => tokenStorage.removeItem('isLoggedIn');

export const getUser = () => {
  const user = tokenStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
export const setUser = (user) => {
  tokenStorage.setItem('user', JSON.stringify(user));
  try {
    window.dispatchEvent(new CustomEvent('user_updated', { detail: user }));
  } catch (_) {}
};
export const removeUser = () => tokenStorage.removeItem('user');

export const clearAllTokens = () => tokenStorage.clear();
export const getStorageInfo = () => tokenStorage.getStorageInfo();

// Role permissions mapping storage
export const removeRolePermissions = () => tokenStorage.removeItem('role_permissions');

export const getRolePermissionsData = () => {
  try {
    const v = tokenStorage.getItem('role_permissions_data');
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
};
export const setRolePermissionsData = (data) => {
  try {
    tokenStorage.setItem('role_permissions_data', JSON.stringify(data || null));
  } catch (e) {
    tokenStorage.setItem('role_permissions_data', 'null');
  }
  try {
    window.dispatchEvent(new CustomEvent('role_permissions_data_updated', { detail: data || null }));
  } catch (_) {}
};
export const removeRolePermissionsData = () => tokenStorage.removeItem('role_permissions_data');

export const getDecryptedStorageItem = (key) => tokenStorage.getItem(key);
export const getRawStorageItem = (key) => {
  try {
    const fullKey = `shn_app_${key}`;
    return localStorage.getItem(fullKey);
  } catch (e) {
    return null;
  }
};

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  try {
    window.__decryptStorage = (key) => tokenStorage.getItem(key);
    window.__getRawStorage = (key) => {
      const fullKey = `shn_app_${key}`;
      return localStorage.getItem(fullKey);
    };
  } catch (_) {}
}

// Get all data from storage
export const getAllData = () => {
  try {
    const data = {};
    const prefix = 'shn_app_';
    
    // Get from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        const cleanKey = key.replace(prefix, '');
        data[cleanKey] = localStorage.getItem(key);
      }
    });
    
    // Get from sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        const cleanKey = key.replace(prefix, '');
        data[cleanKey] = sessionStorage.getItem(key);
      }
    });
    
    // Get from memory storage
    memoryStorage.forEach((value, key) => {
      if (key.startsWith(prefix)) {
        const cleanKey = key.replace(prefix, '');
        data[cleanKey] = value;
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error getting all data:', error);
    return {};
  }
};

// Check and recover localStorage if needed
export const checkAndRecoverLocalStorage = () => {
  try {
    // Check if localStorage is available
    if (!isStorageAvailable('localStorage')) {
      console.warn('localStorage is not available');
      return false;
    }
    
    // Check if we have data in other storage methods
    const sessionData = {};
    const memoryData = {};
    
    // Get data from sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('shn_app_')) {
        sessionData[key] = sessionStorage.getItem(key);
      }
    });
    
    // Get data from memory storage
    memoryStorage.forEach((value, key) => {
      if (key.startsWith('shn_app_')) {
        memoryData[key] = value;
      }
    });
    
    // Try to recover data to localStorage
    let recovered = false;
    
    // Recover from sessionStorage
    Object.keys(sessionData).forEach(key => {
      try {
        localStorage.setItem(key, sessionData[key]);
        recovered = true;
        console.log(`Recovered ${key} from sessionStorage to localStorage`);
      } catch (error) {
        console.error(`Failed to recover ${key} from sessionStorage:`, error);
      }
    });
    
    // Recover from memory storage
    Object.keys(memoryData).forEach(key => {
      try {
        localStorage.setItem(key, memoryData[key]);
        recovered = true;
        console.log(`Recovered ${key} from memory to localStorage`);
      } catch (error) {
        console.error(`Failed to recover ${key} from memory:`, error);
      }
    });
    
    return recovered;
  } catch (error) {
    console.error('Error in checkAndRecoverLocalStorage:', error);
    return false;
  }
};

// Clean up old storage data (remove duplicates)
export const cleanupOldStorage = () => {
  try {
    const oldKeys = ['token', 'refresh_token', 'token_type', 'isLoggedIn', 'user'];
    let cleaned = 0;
    
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        cleaned++;
        console.log(`🧹 Cleaned up old storage key: ${key}`);
      }
    });
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old storage keys`);
    }
    
    return cleaned;
  } catch (error) {
    console.error('Error cleaning up old storage:', error);
    return 0;
  }
};
