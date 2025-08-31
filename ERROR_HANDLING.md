# Global Error Handling & Logging System

## Overview
Sistem penanganan error global yang komprehensif untuk menangkap kondisi sebelum crash, termasuk error code `3221225477` (memory access violation di Windows). Sistem ini menyediakan monitoring real-time, logging, dan recovery mechanisms.

## Features

### 🔍 **Error Detection**
- **Global JavaScript Errors**: Menangkap semua error JavaScript
- **Unhandled Promise Rejections**: Menangkap promise yang tidak di-handle
- **React Error Boundaries**: Error handling untuk React components
- **Memory Monitoring**: Monitoring penggunaan memory real-time
- **Performance Monitoring**: Deteksi long tasks dan performance issues

### 📊 **Logging & Reporting**
- **Error Logging**: Semua error disimpan dengan timestamp dan context
- **Crash Reports**: Laporan detail saat terjadi crash
- **Memory Statistics**: Informasi penggunaan memory
- **Performance Metrics**: Metrics performa aplikasi
- **Storage Info**: Status localStorage dan sessionStorage

### 🛠️ **Recovery Mechanisms**
- **Automatic Recovery**: Attempt recovery untuk error tertentu
- **Memory Cleanup**: Garbage collection dan memory cleanup
- **Graceful Degradation**: Fallback mechanisms
- **User Notifications**: Dialog error yang user-friendly

## Error Code 3221225477

### What is it?
Error code `3221225477` adalah Windows-specific error yang biasanya menandakan:
- **Memory Access Violation**: Akses memory yang tidak valid
- **Stack Overflow**: Stack yang terlalu dalam
- **Heap Corruption**: Kerusakan pada heap memory
- **Buffer Overflow**: Buffer yang overflow

### How We Handle It
```javascript
// Detection patterns
const criticalPatterns = [
  /3221225477/, // Memory access violation
  /out of memory/i,
  /memory leak/i,
  /stack overflow/i,
  /maximum call stack size exceeded/i
];
```

## Implementation

### 1. **Global Error Handler** (`src/lib/errorHandler.js`)
```javascript
import errorHandler from '@/lib/errorHandler';

// Auto-initializes when imported
// Handles all global errors automatically
```

### 2. **React Error Boundary** (`src/components/ErrorBoundary.jsx`)
```javascript
import ErrorBoundary from '@/components/ErrorBoundary';

// Wrap your app or components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 3. **Integration in Main App** (`src/main.jsx`)
```javascript
import errorHandler from '@/lib/errorHandler';
// Automatically initializes global error handling
```

## Usage

### Basic Usage
```javascript
import { logError, getErrorStats, clearErrorLog } from '@/lib/errorHandler';

// Log custom error
logError({
  type: 'custom_error',
  message: 'Something went wrong',
  timestamp: new Date().toISOString()
});

// Get error statistics
const stats = getErrorStats();
console.log('Total errors:', stats.total);
console.log('Critical errors:', stats.critical);

// Clear error log
clearErrorLog();
```

### Error Boundary Usage
```javascript
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Monitoring & Debugging

### DevTools Integration
DevTools panel menampilkan:
- **Error Statistics**: Total errors, critical errors
- **Recent Errors**: 3 error terakhir
- **Memory Usage**: Penggunaan memory real-time
- **Storage Status**: Status localStorage/sessionStorage

### Console Logging
```javascript
// Error logged
📝 Error logged: { type: 'error', message: '...', timestamp: '...' }

// Critical error detected
🚨 CRITICAL ERROR DETECTED: { ... }

// Memory warning
⚠️ High memory usage: 150MB / 200MB

// Recovery attempt
🔄 Attempting recovery...
```

## Error Types

### 1. **JavaScript Errors**
- Syntax errors
- Runtime errors
- Reference errors
- Type errors

### 2. **Promise Rejections**
- Network errors
- API errors
- Async operation failures

### 3. **React Errors**
- Component errors
- Render errors
- State errors

### 4. **Memory Errors**
- Out of memory
- Memory leaks
- Heap corruption
- Stack overflow

### 5. **Performance Errors**
- Long tasks (>50ms)
- Memory warnings
- Performance degradation

## Recovery Strategies

### 1. **Memory Issues**
```javascript
// Trigger garbage collection
if (typeof global !== 'undefined' && global.gc) {
  global.gc();
}

// Clear error log if too large
if (this.errorLog.length > this.maxLogSize * 2) {
  this.errorLog = this.errorLog.slice(-this.maxLogSize);
}
```

### 2. **Critical Errors**
```javascript
// Show user dialog
this.showErrorDialog(error);

// Attempt page reload
if (error.type === 'memory_critical' || error.message?.includes('3221225477')) {
  setTimeout(() => {
    if (confirm('A critical error occurred. Would you like to reload the page?')) {
      window.location.reload();
    }
  }, 2000);
}
```

### 3. **Graceful Degradation**
- Fallback to simpler UI
- Disable problematic features
- Show user-friendly error messages

## Error Dialog

### Features
- **User-friendly**: Pesan error yang mudah dipahami
- **Collapsible Details**: Detail error yang bisa di-expand
- **Action Buttons**: Reload page, go to home
- **Auto-dismiss**: Auto-hide setelah 10 detik
- **Error ID**: Unique identifier untuk tracking

### Styling
- Modern design dengan gradient background
- Responsive layout
- Smooth animations
- Professional appearance

## Storage

### Error Log Storage
```javascript
// Stored in localStorage
localStorage.setItem('shn_app_error_log', JSON.stringify({
  timestamp: '2024-01-01T00:00:00.000Z',
  errors: [...], // Last 20 errors
  totalErrors: 150
}));
```

### Crash Report Storage
```javascript
// Stored in localStorage
localStorage.setItem('shn_app_crash_report', JSON.stringify({
  timestamp: '2024-01-01T00:00:00.000Z',
  error: {...},
  memory: {...},
  performance: {...},
  errorLog: [...] // Last 10 errors
}));
```

## Server Integration

### Crash Report Endpoint
```javascript
// Send crash report to server
async sendCrashReport(crashData) {
  try {
    const response = await fetch('/api/errors/crash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crashData)
    });
    
    if (response.ok) {
      console.log('✅ Crash report sent to server');
    }
  } catch (error) {
    console.error('Failed to send crash report:', error);
  }
}
```

## Best Practices

### 1. **Error Prevention**
- Validate input data
- Handle async operations properly
- Use try-catch blocks
- Implement proper error boundaries

### 2. **Memory Management**
- Clean up event listeners
- Dispose of resources properly
- Avoid memory leaks
- Monitor memory usage

### 3. **Performance Optimization**
- Avoid long-running tasks
- Use debouncing/throttling
- Optimize rendering
- Monitor performance metrics

### 4. **User Experience**
- Show meaningful error messages
- Provide recovery options
- Maintain app stability
- Graceful degradation

## Troubleshooting

### Common Issues

#### 1. **Error Handler Not Initializing**
```javascript
// Check if errorHandler is imported
import errorHandler from '@/lib/errorHandler';

// Check console for initialization message
🔧 Initializing global error handler...
✅ Global error handler initialized
```

#### 2. **Memory Warnings**
```javascript
// Check memory usage in DevTools
// Look for memory warnings in console
⚠️ High memory usage: 150MB / 200MB
```

#### 3. **Error Log Not Saving**
```javascript
// Check localStorage availability
// Check for storage errors in console
❌ Failed to save error log: QuotaExceededError
```

### Debug Commands
```javascript
// Get error statistics
console.log(getErrorStats());

// Clear error log
clearErrorLog();

// Check memory info
console.log(performance.memory);

// Force garbage collection (if available)
if (global.gc) global.gc();
```

## Configuration

### Error Handler Settings
```javascript
class ErrorHandler {
  constructor() {
    this.maxLogSize = 100; // Maximum error log size
    this.memoryThreshold = 0.8; // Memory warning threshold (80%)
    this.criticalMemoryThreshold = 0.9; // Critical memory threshold (90%)
    this.longTaskThreshold = 50; // Long task threshold (50ms)
  }
}
```

### Customization
```javascript
// Custom error patterns
const customPatterns = [
  /your-custom-error-pattern/,
  /another-pattern/
];

// Custom recovery logic
const customRecovery = (error) => {
  // Your custom recovery logic
};
```

## Future Enhancements

### Planned Features
- **Real-time Error Dashboard**: WebSocket-based real-time monitoring
- **Error Analytics**: Advanced error analytics and reporting
- **Automated Recovery**: AI-powered automatic recovery
- **Performance Profiling**: Advanced performance profiling
- **Error Prediction**: Predictive error detection

### Integration Possibilities
- **Sentry Integration**: Send errors to Sentry
- **LogRocket Integration**: Session replay and error tracking
- **Custom Analytics**: Integration with custom analytics platforms
- **Slack Notifications**: Real-time error notifications

## Conclusion

Sistem error handling ini memberikan:
- ✅ **Comprehensive Error Detection**: Menangkap semua jenis error
- ✅ **Real-time Monitoring**: Monitoring real-time untuk memory dan performance
- ✅ **Automatic Recovery**: Attempt recovery untuk error tertentu
- ✅ **User-friendly Experience**: Error dialog yang user-friendly
- ✅ **Developer Tools**: DevTools integration untuk debugging
- ✅ **Crash Reporting**: Detailed crash reports
- ✅ **Memory Management**: Memory monitoring dan cleanup

Dengan sistem ini, aplikasi akan lebih stabil dan dapat menangani error dengan lebih baik, termasuk error code `3221225477` yang sering terjadi di Windows.
