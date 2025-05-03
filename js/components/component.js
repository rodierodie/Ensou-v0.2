/**
 * component.js
 * Base class for all UI components
 */

import store from '../core/store.js';
import eventBus from '../core/eventBus.js';

/**
 * Abstract base component class
 * Provides common functionality for UI components
 */
class Component {
  /**
   * Create a new component
   * @param {HTMLElement} container - DOM container for the component
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    if (new.target === Component) {
      throw new Error('Component is an abstract class and cannot be instantiated directly');
    }
    
    this.container = container;
    this.options = {
      // Default options
      autoRender: true,  // Automatically render on instantiation
      ...options
    };
    
    // Set up event listeners and bindings
    this.eventListeners = [];
    this.storeSubscriptions = [];
    
    // Automatically render if enabled
    if (this.options.autoRender) {
      this.render();
    }
  }
  
  /**
   * Render the component (abstract method)
   * Should be overridden by subclasses
   */
  render() {
    throw new Error('render() method must be implemented by subclasses');
  }
  
  /**
   * Update the component with new data
   * @param {Object} data - New data for the component
   */
  update(data) {
    // Default implementation does nothing
    // Subclasses should override this
    console.warn('update() method not implemented for this component');
  }
  
  /**
   * Add an event listener to an element
   * @param {HTMLElement} element - Element to attach listener to
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  addEventListener(element, event, callback) {
    if (!element) return;
    
    // Create bound callback
    const boundCallback = callback.bind(this);
    
    // Add event listener
    element.addEventListener(event, boundCallback);
    
    // Track it for cleanup
    this.eventListeners.push({
      element,
      event,
      callback: boundCallback
    });
  }
  
  /**
   * Subscribe to store state changes
   * @param {Function} callback - Callback to handle state change
   * @param {Array} [watchProps] - Properties to watch for changes
   * @returns {Function} Unsubscribe function
   */
  subscribeToStore(callback, watchProps = null) {
    const subscription = store.subscribe(callback.bind(this), watchProps);
    this.storeSubscriptions.push(subscription);
    return subscription;
  }
  
  /**
   * Subscribe to an event on the event bus
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  subscribeToEvent(event, callback) {
    const subscription = eventBus.subscribe(event, callback.bind(this));
    return subscription;
  }
  
  /**
   * Publish an event to the event bus
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  publishEvent(event, data) {
    eventBus.publish(event, data);
  }
  
  /**
   * Create an element with attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} attrs - Attributes to set on the element
   * @param {string|HTMLElement|Array} [content] - Content to append to the element
   * @returns {HTMLElement} The created element
   */
  createElement(tag, attrs = {}, content = null) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        // Event handler
        const eventName = key.slice(2).toLowerCase();
        this.addEventListener(element, eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Add content
    if (content !== null) {
      if (Array.isArray(content)) {
        content.forEach(child => {
          if (child instanceof HTMLElement) {
            element.appendChild(child);
          } else if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
          }
        });
      } else if (content instanceof HTMLElement) {
        element.appendChild(content);
      } else if (typeof content === 'string') {
        element.textContent = content;
      }
    }
    
    return element;
  }
  
  /**
   * Clear the component's container
   */
  clearContainer() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
  
  /**
   * Clean up event listeners and subscriptions
   */
  destroy() {
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, callback }) => {
      element.removeEventListener(event, callback);
    });
    this.eventListeners = [];
    
    // Unsubscribe from store
    this.storeSubscriptions.forEach(unsubscribe => unsubscribe());
    this.storeSubscriptions = [];
  }
}

export default Component;