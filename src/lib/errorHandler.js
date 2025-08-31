// Global Error Handler and Logging System
// Simplified version to reduce memory usage

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 50; // Reduced from 100
    this.isInitialized = false;
    this.memoryCheckInterval = null;
  }

  // Initialize error handlers
  init() {
    if (this.isInitialized) return;
    
    console.log('🔧 Initializing simplified error handler...');
    
    // Only essential error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    // Simple memory check (less frequent)
    this.startSimpleMemoryCheck();
    
    this.isInitialized = true;
    console.log('✅ Simplified error handler initialized');
  }

  // Handle global JavaScript errors
  handleGlobalError(event) {
    const error = {
      type: 'error',
      message: event.message,
      timestamp: new Date().toISOString(),
      stack: event.error?.stack?.substring(0, 500) // Limit stack trace
    };

    this.logError(error);
    
    // Only prevent default for critical errors
    if (this.isCriticalError(error)) {
      event.preventDefault();
    }
  }

  // Handle unhandled promise rejections
  handleUnhandledRejection(event) {
    const error = {
      type: 'unhandledrejection',
      reason: event.reason?.toString() || 'Unknown rejection',
      timestamp: new Date().toISOString()
    };

    this.logError(error);
    
    // Only prevent default for critical errors
    if (this.isCriticalError(error)) {
      event.preventDefault();
    }
  }

  // Simplified critical error check
  isCriticalError(error) {
    const criticalPatterns = [
      /3221225477/, // Memory access violation
      /out of memory/i,
      /stack overflow/i,
      /maximum call stack size exceeded/i
    ];

    return criticalPatterns.some(pattern => 
      pattern.test(error.message || error.reason || '')
    );
  }

  // Simple memory check (less frequent and lighter)
  startSimpleMemoryCheck() {
    if ('memory' in performance) {
      this.memoryCheckInterval = setInterval(() => {
        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        
        // Only warn if very high usage
        if (usedMB > limitMB * 0.85) {
          console.warn('⚠️ High memory usage:', `${usedMB}MB / ${limitMB}MB`);
          
          // Force garbage collection if possible
          if (window.gc) {
            window.gc();
          }
        }
      }, 60000); // Check every 60 seconds instead of 30
    }
  }

  // Log error (simplified)
  logError(error) {
    this.errorLog.push(error);
    
    // Keep log size small
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
    
    // Save to localStorage (limited)
    try {
      const logData = JSON.stringify(this.errorLog.slice(-10)); // Only last 10 errors
      localStorage.setItem('shn_app_error_log', logData);
    } catch (e) {
      console.warn('Failed to save error log:', e);
    }
  }

  // Get error statistics (simplified)
  getErrorStats() {
    return {
      totalErrors: this.errorLog.length,
      recentErrors: this.errorLog.slice(-5),
      lastError: this.errorLog[this.errorLog.length - 1]
    };
  }

  // Clear error log
  clearErrorLog() {
    this.errorLog = [];
    localStorage.removeItem('shn_app_error_log');
  }

  // Cleanup
  destroy() {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
const errorHandler = new ErrorHandler();

// Convenience functions
export const logError = (error) => errorHandler.logError(error);
export const getErrorStats = () => errorHandler.getErrorStats();
export const clearErrorLog = () => errorHandler.clearErrorLog();

export default errorHandler;
