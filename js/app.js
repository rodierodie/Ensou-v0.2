/**
 * app.js
 * Main application entry point for ChordPlayer
 */

import AppInitializer from './core/appInitializer.js';

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Start initialization
    await AppInitializer.initialize();
    
    console.log('ChordPlayer application successfully started');
  } catch (error) {
    console.error('Error starting application:', error);
    
    // Show error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = 'Unable to start application. Please reload the page or check the developer console.';
    document.body.appendChild(errorMessage);
  }
});