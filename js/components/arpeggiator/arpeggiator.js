/**
 * arpeggiator.js
 * Modernized component for chord arpeggiation
 */

import Component from '../component.js';
import store from '../../core/store.js';
import audioService from '../../services/audioService.js';
import eventBus from '../../core/eventBus.js';

class Arpeggiator extends Component {
  /**
   * Creates arpeggiator component
   * @param {HTMLElement} container - Container for UI elements
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    super(container, {
      ...options,
      autoRender: false
    });
    
    // Initialize default settings
    this.settings = {
      enabled: false,        // Arpeggiator enabled flag
      pattern: 'up',         // Arpeggio pattern (up, down, updown, downup, random)
      octaveRange: 1,        // Octave range (1-3)
      octaveOffset: 0,       // Octave offset (-2, -1, 0, 1)
      noteLength: '8n',      // Note length (8n = eighth, 16n = sixteenth, 32n = thirty-second)
      velocity: 0.7,         // Note velocity/volume (0-1)
      accentFirst: true      // Accent first note flag
    };
    
    // Load saved settings
    this.loadSettings();
    
    // Subscribe to store changes
    this.subscribeToStore(this.handleStateChange, ['arpeggiatorEnabled']);
    
    // Initialize UI
    this.init();
  }
  
  /**
   * Initialize component
   */
  init() {
    console.log('Initializing arpeggiator component');
    
    // Update audio service with settings
    this.updateAudioService();
    
    // Render UI
    this.render();
    
    // Publish initialization event
    eventBus.publish('arpeggiatorInitialized', {
      settings: this.settings
    });
  }
  
  /**
   * Render component UI
   */
  render() {
    if (!this.container) return;
    
    this.clearContainer();
    
    // Create title
    const title = this.createElement('div', {
      className: 'arpeggiator-title',
      textContent: 'Арпеджиатор',
      style: {
        fontWeight: 'bold',
        marginBottom: '10px'
      }
    });
    this.container.appendChild(title);
    
    // Create settings container
    const settingsContainer = this.createElement('div', {
      className: 'arpeggiator-settings'
    });
    
    // 1. Enable/disable toggle
    const toggleContainer = this.createSettingRow('Включить:');
    const toggle = this.createElement('input', {
      type: 'checkbox',
      id: 'arpeggiator-toggle',
      checked: this.settings.enabled,
      onChange: this.handleToggleChange.bind(this)
    });
    toggleContainer.appendChild(toggle);
    settingsContainer.appendChild(toggleContainer);
    
    // 2. Pattern selector
    const patternContainer = this.createSettingRow('Паттерн:');
    const patternSelector = this.createElement('select', {
      id: 'arpeggiator-pattern',
      onChange: this.handlePatternChange.bind(this)
    });
    
    // Add pattern options
    const patterns = [
      { value: 'up', label: 'Вверх' },
      { value: 'down', label: 'Вниз' },
      { value: 'updown', label: 'Вверх-вниз' },
      { value: 'downup', label: 'Вниз-вверх' },
      { value: 'random', label: 'Случайно' }
    ];
    
    patterns.forEach(pattern => {
      const option = this.createElement('option', {
        value: pattern.value,
        textContent: pattern.label,
        selected: this.settings.pattern === pattern.value
      });
      patternSelector.appendChild(option);
    });
    
    patternContainer.appendChild(patternSelector);
    settingsContainer.appendChild(patternContainer);
    
    // 3. Octave range selector
    const octaveContainer = this.createSettingRow('Октавы:');
    const octaveSelector = this.createElement('select', {
      id: 'arpeggiator-octave',
      onChange: this.handleOctaveChange.bind(this)
    });
    
    // Add octave options
    for (let i = 1; i <= 3; i++) {
      const option = this.createElement('option', {
        value: i,
        textContent: i,
        selected: this.settings.octaveRange === i
      });
      octaveSelector.appendChild(option);
    }
    
    octaveContainer.appendChild(octaveSelector);
    settingsContainer.appendChild(octaveContainer);
    
    // 4. Octave offset selector
    const offsetContainer = this.createSettingRow('Смещение:');
    const offsetSelector = this.createElement('select', {
      id: 'arpeggiator-offset',
      onChange: this.handleOffsetChange.bind(this)
    });
    
    // Add offset options
    const offsets = [
      { value: -2, label: '-2' },
      { value: -1, label: '-1' },
      { value: 0, label: '0' },
      { value: 1, label: '+1' }
    ];
    
    offsets.forEach(offset => {
      const option = this.createElement('option', {
        value: offset.value,
        textContent: offset.label,
        selected: this.settings.octaveOffset === offset.value
      });
      offsetSelector.appendChild(option);
    });
    
    offsetContainer.appendChild(offsetSelector);
    settingsContainer.appendChild(offsetContainer);
    
    // 5. Note length selector
    const lengthContainer = this.createSettingRow('Длительность:');
    const lengthSelector = this.createElement('select', {
      id: 'arpeggiator-note-length',
      onChange: this.handleNoteLengthChange.bind(this)
    });
    
    // Add note length options
    const lengths = [
      { value: '8n', label: '1/8' },
      { value: '16n', label: '1/16' },
      { value: '32n', label: '1/32' }
    ];
    
    lengths.forEach(length => {
      const option = this.createElement('option', {
        value: length.value,
        textContent: length.label,
        selected: this.settings.noteLength === length.value
      });
      lengthSelector.appendChild(option);
    });
    
    lengthContainer.appendChild(lengthSelector);
    settingsContainer.appendChild(lengthContainer);
    
    // 6. Accent checkbox
    const accentContainer = this.createSettingRow('Акцент первой ноты:');
    const accentToggle = this.createElement('input', {
      type: 'checkbox',
      id: 'arpeggiator-accent',
      checked: this.settings.accentFirst,
      onChange: this.handleAccentChange.bind(this)
    });
    accentContainer.appendChild(accentToggle);
    settingsContainer.appendChild(accentContainer);
    
    // Add settings container to main container
    this.container.appendChild(settingsContainer);
  }
  
  /**
   * Create a setting row with label
   * @param {string} labelText - Label text
   * @returns {HTMLElement} Setting row container
   */
  createSettingRow(labelText) {
    const container = this.createElement('div', {
      className: 'arpeggiator-setting-row'
    });
    
    const label = this.createElement('label', {
      className: 'arpeggiator-setting-label',
      textContent: labelText
    });
    
    container.appendChild(label);
    return container;
  }
  
  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('arpeggiatorSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        
        // Update settings with saved values
        this.settings = {
          ...this.settings,
          ...parsedSettings
        };
        
        console.log('Loaded arpeggiator settings:', this.settings);
      }
    } catch (e) {
      console.error('Error loading arpeggiator settings:', e);
    }
  }
  
  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('arpeggiatorSettings', JSON.stringify(this.settings));
      console.log('Saved arpeggiator settings');
      
      // Update audio service settings
      this.updateAudioService();
      
      // Publish settings changed event
      eventBus.publish('arpeggiatorSettingsChanged', {
        settings: this.settings
      });
    } catch (e) {
      console.error('Error saving arpeggiator settings:', e);
    }
  }
  
  /**
   * Update audio service with current settings
   */
  updateAudioService() {
    // Pass settings to audio service
    audioService.saveArpeggiatorSettings(this.settings);
    
    // Update store state
    store.setArpeggiatorEnabled(this.settings.enabled);
  }
  
  /**
   * Handle enable toggle change
   * @param {Event} event - Change event
   */
  handleToggleChange(event) {
    this.settings.enabled = event.target.checked;
    this.saveSettings();
  }
  
  /**
   * Handle pattern change
   * @param {Event} event - Change event
   */
  handlePatternChange(event) {
    this.settings.pattern = event.target.value;
    this.saveSettings();
  }
  
  /**
   * Handle octave range change
   * @param {Event} event - Change event
   */
  handleOctaveChange(event) {
    this.settings.octaveRange = parseInt(event.target.value);
    this.saveSettings();
  }
  
  /**
   * Handle octave offset change
   * @param {Event} event - Change event
   */
  handleOffsetChange(event) {
    this.settings.octaveOffset = parseInt(event.target.value);
    this.saveSettings();
  }
  
  /**
   * Handle note length change
   * @param {Event} event - Change event
   */
  handleNoteLengthChange(event) {
    this.settings.noteLength = event.target.value;
    this.saveSettings();
  }
  
  /**
   * Handle accent change
   * @param {Event} event - Change event
   */
  handleAccentChange(event) {
    this.settings.accentFirst = event.target.checked;
    this.saveSettings();
  }
  
  /**
   * Enable/disable arpeggiator
   * @param {boolean} enabled - Enabled flag
   */
  setEnabled(enabled) {
    this.settings.enabled = enabled;
    
    // Update UI
    const toggle = document.getElementById('arpeggiator-toggle');
    if (toggle) {
      toggle.checked = enabled;
    }
    
    this.saveSettings();
  }
  
  /**
   * Get current arpeggiator settings
   * @returns {Object} Current settings
   */
  getSettings() {
    return { ...this.settings };
  }
  
  /**
   * Handle state changes from store
   * @param {Object} state - Store state
   * @param {string} changedProp - Changed property
   */
  handleStateChange(state, changedProp) {
    if (changedProp === 'arpeggiatorEnabled') {
      // Update local settings if they differ from store state
      if (this.settings.enabled !== state.arpeggiatorEnabled) {
        this.settings.enabled = state.arpeggiatorEnabled;
        
        // Update UI
        const toggle = document.getElementById('arpeggiator-toggle');
        if (toggle) {
          toggle.checked = state.arpeggiatorEnabled;
        }
        
        // Save settings
        this.saveSettings();
      }
    }
  }
}

export default Arpeggiator;