/**
 * eventBus.js
 * Simple event bus for application-wide events
 */

/**
 * Event Bus class
 * Implements publish-subscribe pattern for loosely coupled communication
 */
class EventBus {
  constructor() {
    // Map of event names to arrays of subscriber callbacks
    this.subscribers = new Map();
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  subscribe(event, callback) {
    // If this is the first subscriber for this event, create a new array
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    
    // Add callback to subscribers for this event
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
    // If there are no subscribers for this event, do nothing
    if (!this.subscribers.has(event)) {
      return;
    }
    
    // Call all subscribers with the provided data
    const callbacks = this.subscribers.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event subscriber for ${event}:`, error);
      }
    });
  }
  
  /**
   * Subscribe to an event with automatic unsubscription after first trigger
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  subscribeOnce(event, callback) {
    // Create a wrapping function that unsubscribes itself after execution
    const wrappedCallback = (data) => {
      // Unsubscribe first
      unsubscribe();
      // Then call the callback
      callback(data);
    };
    
    // Subscribe with the wrapped callback
    const unsubscribe = this.subscribe(event, wrappedCallback);
    
    // Return unsubscribe function
    return unsubscribe;
  }
  
  /**
   * Unsubscribe all callbacks for an event
   * @param {string} event - Event name
   */
  unsubscribeAll(event) {
    if (this.subscribers.has(event)) {
      this.subscribers.delete(event);
    }
  }
  
  /**
   * Get count of subscribers for an event
   * @param {string} event - Event name
   * @returns {number} Number of subscribers
   */
  subscriberCount(event) {
    if (!this.subscribers.has(event)) {
      return 0;
    }
    return this.subscribers.get(event).length;
  }
  
  /**
   * Check if event has subscribers
   * @param {string} event - Event name
   * @returns {boolean} True if event has subscribers
   */
  hasSubscribers(event) {
    return this.subscriberCount(event) > 0;
  }
  
  /**
   * Get list of all events with subscribers
   * @returns {Array} Array of event names
   */
  getEvents() {
    return Array.from(this.subscribers.keys());
  }
}

// Create singleton instance
const eventBus = new EventBus();

export default eventBus;