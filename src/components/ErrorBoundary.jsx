import React from 'react';
import errorHandler, { logError } from '@/lib/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to global error handler
    const errorData = {
      type: 'react_error_boundary',
      error: error,
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    logError(errorData);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Check if this is a critical error
    if (error.message?.includes('3221225477') || 
        error.message?.includes('out of memory') ||
        error.message?.includes('stack overflow')) {
      console.error('🚨 CRITICAL REACT ERROR:', error);
      errorHandler.handleCriticalError(errorData);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: 'Arial, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            {/* Error Icon */}
            <div style={{
              fontSize: '60px',
              marginBottom: '20px',
              color: '#e74c3c'
            }}>
              ⚠️
            </div>

            {/* Error Title */}
            <h1 style={{
              color: '#2c3e50',
              marginBottom: '15px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              Something went wrong
            </h1>

            {/* Error Message */}
            <p style={{
              color: '#7f8c8d',
              marginBottom: '30px',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              An unexpected error occurred. Our team has been notified and we're working to fix it.
            </p>

            {/* Error Details (Collapsible) */}
            {this.state.error && (
              <div style={{ marginBottom: '30px' }}>
                <button
                  onClick={this.toggleDetails}
                  style={{
                    background: 'none',
                    border: '2px solid #3498db',
                    color: '#3498db',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#3498db';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'none';
                    e.target.style.color = '#3498db';
                  }}
                >
                  {this.state.showDetails ? 'Hide Details' : 'Show Details'}
                </button>

                {this.state.showDetails && (
                  <div style={{
                    marginTop: '20px',
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    <h3 style={{
                      color: '#e74c3c',
                      marginBottom: '10px',
                      fontSize: '16px'
                    }}>
                      Error Details:
                    </h3>
                    <pre style={{
                      color: '#2c3e50',
                      fontSize: '12px',
                      lineHeight: '1.4',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {this.state.error.toString()}
                    </pre>
                    
                    {this.state.errorInfo && this.state.errorInfo.componentStack && (
                      <>
                        <h3 style={{
                          color: '#e74c3c',
                          marginTop: '20px',
                          marginBottom: '10px',
                          fontSize: '16px'
                        }}>
                          Component Stack:
                        </h3>
                        <pre style={{
                          color: '#2c3e50',
                          fontSize: '12px',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'background 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#2980b9'}
                onMouseOut={(e) => e.target.style.background = '#3498db'}
              >
                🔄 Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'background 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#7f8c8d'}
                onMouseOut={(e) => e.target.style.background = '#95a5a6'}
              >
                🏠 Go to Home
              </button>
            </div>

            {/* Additional Info */}
            <div style={{
              marginTop: '30px',
              padding: '15px',
              background: '#ecf0f1',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#7f8c8d'
            }}>
              <p style={{ margin: '0 0 10px 0' }}>
                <strong>Error ID:</strong> {Date.now()}
              </p>
              <p style={{ margin: '0 0 10px 0' }}>
                <strong>Time:</strong> {new Date().toLocaleString()}
              </p>
              <p style={{ margin: '0' }}>
                <strong>URL:</strong> {window.location.href}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
