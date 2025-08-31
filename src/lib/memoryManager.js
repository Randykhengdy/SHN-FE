// Memory Management Utility
// Helps monitor and optimize memory usage

class MemoryManager {
  constructor() {
    this.memoryThreshold = 0.8; // 80% threshold
    this.checkInterval = null;
    this.isMonitoring = false;
  }

  // Start memory monitoring
  startMonitoring() {
    if (this.isMonitoring || !('memory' in performance)) {
      return;
    }

    this.isMonitoring = true;
    this.checkInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds

    console.log('🔧 Memory monitoring started');
  }

  // Stop memory monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    console.log('🔧 Memory monitoring stopped');
  }

  // Check current memory usage
  checkMemoryUsage() {
    const memory = performance.memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
    const usagePercent = (usedMB / limitMB) * 100;

    console.log(`💾 Memory: ${usedMB}MB / ${limitMB}MB (${usagePercent.toFixed(1)}%)`);

    if (usagePercent > this.memoryThreshold * 100) {
      console.warn('⚠️ High memory usage detected!');
      this.optimizeMemory();
    }
  }

  // Get current memory info
  getMemoryInfo() {
    if (!('memory' in performance)) {
      return null;
    }

    const memory = performance.memory;
    return {
      usedMB: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      totalMB: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limitMB: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    };
  }

  // Optimize memory usage
  optimizeMemory() {
    console.log('🔧 Optimizing memory...');

    // Clear console logs if too many
    if (console.clear) {
      console.clear();
    }

    // Force garbage collection if available
    if (window.gc) {
      try {
        window.gc();
        console.log('✅ Garbage collection triggered');
      } catch (e) {
        console.warn('Failed to trigger garbage collection');
      }
    }

    // Clear localStorage if too large
    this.cleanupLocalStorage();

    // Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear sessionStorage');
    }
  }

  // Cleanup localStorage
  cleanupLocalStorage() {
    try {
      const keys = Object.keys(localStorage);
      const appKeys = keys.filter(key => key.startsWith('shn_app_'));
      
      // Keep only essential keys
      const essentialKeys = [
        'shn_app_token',
        'shn_app_refresh_token',
        'shn_app_user',
        'shn_app_is_logged_in'
      ];

      appKeys.forEach(key => {
        if (!essentialKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      console.log('✅ localStorage cleaned up');
    } catch (e) {
      console.warn('Failed to cleanup localStorage:', e);
    }
  }

  // Emergency memory cleanup
  emergencyCleanup() {
    console.log('🚨 Emergency memory cleanup...');
    
    // Stop monitoring
    this.stopMonitoring();
    
    // Clear all storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage');
    }
    
    // Clear console
    if (console.clear) {
      console.clear();
    }
    
    // Force garbage collection
    if (window.gc) {
      try {
        window.gc();
      } catch (e) {
        console.warn('Failed to trigger garbage collection');
      }
    }
    
    console.log('✅ Emergency cleanup completed');
  }
}

// Export singleton instance
const memoryManager = new MemoryManager();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  // Start monitoring after a delay
  setTimeout(() => {
    memoryManager.startMonitoring();
  }, 5000);
}

export default memoryManager;

// Convenience functions
export const startMemoryMonitoring = () => memoryManager.startMonitoring();
export const stopMemoryMonitoring = () => memoryManager.stopMonitoring();
export const getMemoryInfo = () => memoryManager.getMemoryInfo();
export const optimizeMemory = () => memoryManager.optimizeMemory();
export const emergencyCleanup = () => memoryManager.emergencyCleanup();
