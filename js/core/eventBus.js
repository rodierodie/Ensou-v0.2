/**
 * eventBus.js
 * Simple event bus for application-wide event handling
 */

class EventBus {
  constructor() {
    // Map to store subscribers (event name -> array of handlers)
    this.subscribers = new Map();
    
    // Debug mode for logging events
    this.debug = false;
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  subscribe(event, callback) {
    // If this event doesn't have subscribers yet, create array
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    
    // Add handler to subscribers for this event
    const callbacks = this.subscribers.get(event);
    callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * Publish an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  publish(event, data) {
    // Debug logging
    if (this.debug) {
      console.log(`[EventBus] Event '${event}' published:`, data);
    }
    
    // If no subscribers for this event, exit
    if (!this.subscribers.has(event)) {
      return;
    }
    
    // Call all subscribers with data
    const callbacks = this.subscribers.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for '${event}':`, error);
      }
    });
  }
  
  /**
   * Subscribe to an event with automatic unsubscribe after first trigger
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  subscribeOnce(event, callback) {
    // Create wrapper that unsubscribes after execution
    const wrappedCallback = (data) => {
      // First unsubscribe
      unsubscribe();
      // Then call handler
      callback(data);
    };
    
    // Subscribe with wrapped handler
    const unsubscribe = this.subscribe(event, wrappedCallback);
    
    // Return unsubscribe function
    return unsubscribe;
  }
  
  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Enable debug mode
   */
  setDebug(enabled) {
    this.debug = !!enabled;
    
    if (this.debug) {
      console.log('[EventBus] Debug mode enabled');
      
      // Log current subscribers
      console.log('[EventBus] Current subscribers:');
      this.subscribers.forEach((callbacks, event) => {
        console.log(`Event: ${event}, Handlers: ${callbacks.length}`);
      });
    }
  }
  
  /**
   * Clear all subscribers
   */
  clear() {
    this.subscribers.clear();
    
    if (this.debug) {
      console.log('[EventBus] All subscribers cleared');
    }
  }
  
  /**
   * Get number of subscribers for an event
   * @param {string} event - Event name
   * @returns {number} Number of subscribers
   */
  getSubscriberCount(event) {
    if (!this.subscribers.has(event)) {
      return 0;
    }
    
    return this.subscribers.get(event).length;
  }
  
  /**
   * Check if an event has subscribers
   * @param {string} event - Event name
   * @returns {boolean} True if event has subscribers
   */
  hasSubscribers(event) {
    return this.getSubscriberCount(event) > 0;
  }
  
  /**
   * Get all events with subscribers
   * @returns {Array} Array of event names
   */
  getEvents() {
    return Array.from(this.subscribers.keys());
  }
}

// Create and export singleton event bus object
const eventBus = new EventBus();
export default eventBus;