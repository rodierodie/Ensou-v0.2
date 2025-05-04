/**
 * errorHandler.js
 * Utility for handling errors and debugging in the application
 */

/**
 * ErrorHandler provides utilities for error handling, 
 * logging, and debugging throughout the application
 */
class ErrorHandler {
    constructor() {
      this.isDebugMode = this.detectDebugMode();
      this.errors = [];
      this.maxErrorsToStore = 50;
    }
    
    /**
     * Detect if debug mode should be enabled
     * @returns {boolean} True if debug mode is enabled
     */
    detectDebugMode() {
      return (
        // Check URL parameters for debug flag
        window.location.search.includes('debug=true') ||
        // Check localStorage for debug flag
        localStorage.getItem('debug') === 'true' ||
        // Check development environment
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      );
    }
    
    /**
     * Enable or disable debug mode
     * @param {boolean} enable - Enable or disable debug mode
     */
    setDebugMode(enable) {
      this.isDebugMode = !!enable;
      
      // Store in localStorage for persistence
      if (enable) {
        localStorage.setItem('debug', 'true');
      } else {
        localStorage.removeItem('debug');
      }
      
      console.log(`Debug mode ${enable ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Initialize error handling
     */
    initialize() {
      this.setupGlobalErrorHandlers();
      this.setupConsoleOverrides();
      
      // Log initialization
      this.log('info', 'ErrorHandler initialized', { debugMode: this.isDebugMode });
    }
    
    /**
     * Set up global error handlers
     */
    setupGlobalErrorHandlers() {
      // Handle global errors
      window.addEventListener('error', (event) => {
        this.handleError(event.error || new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
        
        // Display error in UI
        this.displayErrorInUI(event.error || new Error(event.message));
      });
      
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason || new Error('Unhandled Promise rejection'), {
          type: 'unhandledrejection'
        });
        
        // Display error in UI
        this.displayErrorInUI(event.reason || new Error('Unhandled Promise rejection'));
      });
    }
    
    /**
     * Set up console overrides for better logging
     */
    setupConsoleOverrides() {
      // Only in debug mode
      if (!this.isDebugMode) return;
      
      // Store original console methods
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error
      };
      
      // Override console.error
      console.error = (...args) => {
        // Call original method
        originalConsole.error.apply(console, args);
        
        // Log to our system if it's an Error object
        if (args[0] instanceof Error) {
          this.handleError(args[0], { source: 'console.error' });
        }
      };
      
      // Add timestamp to console.log in debug mode
      if (this.isDebugMode) {
        console.log = (...args) => {
          const timestamp = new Date().toISOString().substring(11, 23);
          originalConsole.log.apply(
            console, 
            [`[${timestamp}]`, ...args]
          );
        };
      }
    }
    
    /**
     * Handle error
     * @param {Error} error - Error object
     * @param {Object} context - Additional context information
     */
    handleError(error, context = {}) {
      // Add timestamp
      const timestamp = new Date();
      
      // Create structured error record
      const errorRecord = {
        timestamp,
        message: error.message || 'Unknown error',
        stack: error.stack,
        context: {
          ...context,
          location: window.location.href,
          userAgent: navigator.userAgent
        }
      };
      
      // Store error
      this.storeError(errorRecord);
      
      // Log error
      this.logError(errorRecord);
      
      // If in debug mode, display error
      if (this.isDebugMode) {
        this.displayErrorInUI(error, context);
      }
    }
    
    /**
     * Store error record
     * @param {Object} errorRecord - Error record to store
     */
    storeError(errorRecord) {
      // Add to errors array, limiting to max size
      this.errors.push(errorRecord);
      if (this.errors.length > this.maxErrorsToStore) {
        this.errors.shift();
      }
      
      // Optionally send to server or analytics service
      if (typeof window.reportErrorToServer === 'function') {
        try {
          window.reportErrorToServer(errorRecord);
        } catch (e) {
          console.error('Failed to report error to server:', e);
        }
      }
    }
    
    /**
     * Log error to console
     * @param {Object} errorRecord - Error record to log
     */
    logError(errorRecord) {
      const { timestamp, message, stack, context } = errorRecord;
      
      console.error(
        `[ERROR] ${timestamp.toISOString()} - ${message}`,
        '\nContext:', context,
        '\nStack:', stack
      );
    }
    
    /**
     * Display error message in UI
     * @param {Error} error - Error object
     * @param {Object} context - Additional context
     */
    displayErrorInUI(error, context = {}) {
      // Create error container if it doesn't exist
      let errorContainer = document.getElementById('error-container');
      if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.style.position = 'fixed';
        errorContainer.style.bottom = '20px';
        errorContainer.style.right = '20px';
        errorContainer.style.maxWidth = '400px';
        errorContainer.style.maxHeight = '300px';
        errorContainer.style.overflow = 'auto';
        errorContainer.style.backgroundColor = '#f8d7da';
        errorContainer.style.color = '#721c24';
        errorContainer.style.padding = '10px';
        errorContainer.style.borderRadius = '5px';
        errorContainer.style.border = '1px solid #f5c6cb';
        errorContainer.style.zIndex = '1000';
        document.body.appendChild(errorContainer);
      }
      
      // Create error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.style.marginBottom = '10px';
      errorMessage.style.borderBottom = '1px solid #f5c6cb';
      errorMessage.style.paddingBottom = '5px';
      
      // Format error message
      let messageHTML = error.message || 'Unknown error';
      
      // Add context if available
      if (context && Object.keys(context).length > 0) {
        // Only show filename and line number if available
        if (context.filename) {
          const shortFilename = context.filename.split('/').pop();
          messageHTML += `<br><small>${shortFilename}`;
          if (context.lineno) {
            messageHTML += `:${context.lineno}`;
            if (context.colno) {
              messageHTML += `:${context.colno}`;
            }
          }
          messageHTML += '</small>';
        }
      }
      
      // Add stack trace in debug mode
      if (this.isDebugMode && error.stack) {
        const stackLines = error.stack.split('\n').slice(0, 3);
        messageHTML += '<br><small>' + stackLines.join('<br>') + '</small>';
      }
      
      errorMessage.innerHTML = messageHTML;
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'x';
      closeButton.style.float = 'right';
      closeButton.style.backgroundColor = 'transparent';
      closeButton.style.border = 'none';
      closeButton.style.cursor = 'pointer';
      closeButton.onclick = () => errorMessage.remove();
      errorMessage.prepend(closeButton);
      
      // Add to container
      errorContainer.appendChild(errorMessage);
      
      // Auto-remove after 30 seconds unless in debug mode
      if (!this.isDebugMode) {
        setTimeout(() => {
          if (errorMessage.parentNode === errorContainer) {
            errorMessage.remove();
          }
        }, 30000);
      }
    }
    
    /**
     * Log message with level
     * @param {string} level - Log level (info, warn, error, debug)
     * @param {string} message - Message to log
     * @param {Object} data - Additional data
     */
    log(level, message, data = {}) {
      // Skip debug messages if not in debug mode
      if (level === 'debug' && !this.isDebugMode) {
        return;
      }
      
      const timestamp = new Date().toISOString();
      
      switch (level) {
        case 'error':
          console.error(`[${timestamp}] [ERROR] ${message}`, data);
          break;
        case 'warn':
          console.warn(`[${timestamp}] [WARN] ${message}`, data);
          break;
        case 'debug':
          console.debug(`[${timestamp}] [DEBUG] ${message}`, data);
          break;
        case 'info':
        default:
          console.log(`[${timestamp}] [INFO] ${message}`, data);
          break;
      }
    }
    
    /**
     * Get stored errors
     * @returns {Array} Array of error records
     */
    getErrors() {
      return [...this.errors];
    }
    
    /**
     * Clear stored errors
     */
    clearErrors() {
      this.errors = [];
    }
    
    /**
     * Get system information for diagnostics
     * @returns {Object} System information
     */
    getSystemInfo() {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenSize: {
          width: window.screen.width,
          height: window.screen.height
        },
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        memoryInfo: performance?.memory ? {
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          usedJSHeapSize: performance.memory.usedJSHeapSize
        } : null,
        debugging: this.isDebugMode
      };
    }
    
    /**
     * Create debug report
     * @returns {Object} Debug report
     */
    createDebugReport() {
      return {
        timestamp: new Date().toISOString(),
        errors: this.getErrors(),
        systemInfo: this.getSystemInfo(),
        localStorageSize: this.getLocalStorageSize(),
        modules: this.getLoadedModules()
      };
    }
    
    /**
     * Get size of localStorage
     * @returns {Object} Size information
     */
    getLocalStorageSize() {
      try {
        let total = 0;
        let items = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          total += (key.length + value.length) * 2; // UTF-16 uses 2 bytes per character
          items++;
        }
        
        return {
          bytes: total,
          kilobytes: Math.round(total / 1024 * 100) / 100,
          items: items
        };
      } catch (e) {
        return {
          error: e.message
        };
      }
    }
    
    /**
     * Get loaded modules
     * @returns {Array} Loaded modules
     */
    getLoadedModules() {
      // Try to get modules from window or global module cache
      if (window.__modules) {
        return window.__modules;
      }
      
      return ['Error: Module information not available'];
    }
    
    /**
     * Download debug report
     */
    downloadDebugReport() {
      try {
        const report = this.createDebugReport();
        const reportJSON = JSON.stringify(report, null, 2);
        
        // Create blob and link
        const blob = new Blob([reportJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
        const filename = `debug_report_${timestamp}.json`;
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        return true;
      } catch (error) {
        console.error('Failed to download debug report:', error);
        return false;
      }
    }
  }