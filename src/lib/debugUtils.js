// Simple Debug Utilities for SHN React App
// Essential error tracking only

class DebugUtils {
  constructor() {
    this.isDebugMode = process.env.NODE_ENV === 'development';
    this.errorLog = [];
    this.maxLogSize = 50;
    this.init();
  }

  init() {
    if (this.isDebugMode) {
      this.setupGlobalErrorHandlers();
      console.log('🔧 Debug mode enabled');
    }
  }

  setupGlobalErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason
      });
    });
  }

  logError(type, data) {
    const errorEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: type,
      data: data,
      url: window.location.href
    };

    this.errorLog.push(errorEntry);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console in debug mode
    if (this.isDebugMode) {
      console.group(`🚨 ${type}`);
      console.error('Data:', data);
      console.error('URL:', errorEntry.url);
      console.groupEnd();
    }

    // Save to localStorage for persistence
    this.saveErrorLog();
  }

  saveErrorLog() {
    try {
      localStorage.setItem('debug_error_log', JSON.stringify(this.errorLog));
    } catch (e) {
      console.warn('Failed to save error log:', e);
    }
  }

  loadErrorLog() {
    try {
      const saved = localStorage.getItem('debug_error_log');
      if (saved) {
        this.errorLog = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load error log:', e);
    }
  }

  getErrorLog() {
    return this.errorLog;
  }

  clearErrorLog() {
    this.errorLog = [];
    localStorage.removeItem('debug_error_log');
  }

  exportErrorLog() {
    const dataStr = JSON.stringify(this.errorLog, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Create global instance
const debugUtils = new DebugUtils();

// Export for use in components
export default debugUtils;

// Global debug object for easy access
window.debugUtils = debugUtils;

// Auto-load saved error log
debugUtils.loadErrorLog();
