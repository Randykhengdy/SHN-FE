// Token Storage Utility - Multiple storage methods for better persistence

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
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Using storage method: ${this.storageMethod}`);
    }
  }

  // Set item with fallback
  setItem(key, value) {
    const fullKey = `${this.prefix}${key}`;
    
    try {
      switch (this.storageMethod) {
        case STORAGE_METHODS.LOCAL_STORAGE:
          localStorage.setItem(fullKey, value);
          break;
        case STORAGE_METHODS.SESSION_STORAGE:
          sessionStorage.setItem(fullKey, value);
          break;
        case STORAGE_METHODS.MEMORY:
          memoryStorage.set(fullKey, value);
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
      switch (this.storageMethod) {
        case STORAGE_METHODS.LOCAL_STORAGE:
          return localStorage.getItem(fullKey);
        case STORAGE_METHODS.SESSION_STORAGE:
          return sessionStorage.getItem(fullKey);
        case STORAGE_METHODS.MEMORY:
          return memoryStorage.get(fullKey);
      }
    } catch (error) {
      console.error(`❌ Failed to retrieve ${key}:`, error);
      // Fallback to memory
      return memoryStorage.get(fullKey);
    }
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
export const setUser = (user) => tokenStorage.setItem('user', JSON.stringify(user));
export const removeUser = () => tokenStorage.removeItem('user');

export const clearAllTokens = () => tokenStorage.clear();
export const getStorageInfo = () => tokenStorage.getStorageInfo();

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
