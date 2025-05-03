/**
 * tonalitySelector.js
 * Component for selecting tonality
 */

import Component from '../component.js';
import store from '../../core/store.js';
import { tonalityCollection } from '../../models/tonality.js';

class TonalitySelector extends Component {
  /**
   * Create a new TonalitySelector component
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    // Call super first, but disable auto-render until we're ready
    const combinedOptions = {
      ...options,
      autoRender: false // Temporarily disable auto-render
    };
    
    super(container, combinedOptions);
    
    // Initialize state after calling super
    this.currentTonality = store.getCurrentTonality() || 'C';
    
    // Default options
    this.options = {
      onChange: null, // Callback for tonality change
      showNames: true, // Show full names of tonalities
      ...options
    };
    
    // Subscribe to store changes
    this.subscribeToStore(this.handleStateChange, ['currentTonality']);
    
    // Now manually render since we disabled auto-render
    this.render();
  }
  
  /**
   * Render the component
   */
  render() {
    this.clearContainer();
    
    // Create container for dropdowns
    const dropdownsContainer = this.createElement('div', {
      className: 'tonality-dropdowns'
    });
    
    // Create root note dropdown
    const rootNoteContainer = this.createElement('div', {
      className: 'dropdown-container'
    });
    
    const rootNoteLabel = this.createElement('label', {
      textContent: 'Нота:',
      htmlFor: 'root-note-select'
    });
    rootNoteContainer.appendChild(rootNoteLabel);
    
    const rootNoteSelect = this.createElement('select', {
      id: 'root-note-select',
      onChange: (e) => this.handleRootNoteChange(e)
    });
    
    // Get available root notes
    const rootNotes = this.getAvailableRootNotes();
    
    // Add options
    rootNotes.forEach(note => {
      const option = this.createElement('option', {
        value: note,
        textContent: this.options.showNames ? `${note} (${this.getNoteFullName(note)})` : note
      });
      rootNoteSelect.appendChild(option);
    });
    
    rootNoteContainer.appendChild(rootNoteSelect);
    dropdownsContainer.appendChild(rootNoteContainer);
    
    // Create tonality type dropdown
    const typeContainer = this.createElement('div', {
      className: 'dropdown-container'
    });
    
    const typeLabel = this.createElement('label', {
      textContent: 'Тип:',
      htmlFor: 'tonality-type-select'
    });
    typeContainer.appendChild(typeLabel);
    
    const typeSelect = this.createElement('select', {
      id: 'tonality-type-select',
      onChange: (e) => this.handleTypeChange(e)
    });
    
    // Add options
    const typeOptions = [
      { value: 'major', text: 'Мажор' },
      { value: 'minor', text: 'Минор' }
    ];
    
    typeOptions.forEach(option => {
      const optionElement = this.createElement('option', {
        value: option.value,
        textContent: option.text
      });
      typeSelect.appendChild(optionElement);
    });
    
    typeContainer.appendChild(typeSelect);
    dropdownsContainer.appendChild(typeContainer);
    
    // Current tonality display
    const tonalityDisplay = this.createElement('div', {
      className: 'current-tonality'
    });
    
    const tonalityCode = this.createElement('span', {
      className: 'tonality-code',
      id: 'tonality-code',
      textContent: this.currentTonality || 'C'
    });
    tonalityDisplay.appendChild(tonalityCode);
    
    // Get tonality info if available
    try {
      const tonality = tonalityCollection.getTonality(this.currentTonality);
      if (tonality) {
        const tonalityName = this.createElement('span', {
          className: 'tonality-name',
          id: 'tonality-name',
          textContent: `(${tonality.name})`
        });
        tonalityDisplay.appendChild(tonalityName);
      }
    } catch (error) {
      console.warn('Error getting tonality info:', error);
    }
    
    dropdownsContainer.appendChild(tonalityDisplay);
    
    // Add dropdowns container to main container
    this.container.appendChild(dropdownsContainer);
    
    // Update selected values in dropdowns
    this.updateSelectedValues();
  }
  
  /**
   * Update selected values in dropdowns based on current tonality
   */
  updateSelectedValues() {
    const rootNoteSelect = document.getElementById('root-note-select');
    const typeSelect = document.getElementById('tonality-type-select');
    
    if (!rootNoteSelect || !typeSelect) return;
    
    // Ensure currentTonality is defined before using it
    if (!this.currentTonality) {
      this.currentTonality = 'C'; // Set default value
      return;
    }
    
    // Parse tonality code
    let rootNote, type;
    
    // Safely check if currentTonality is a string and ends with 'm'
    if (typeof this.currentTonality === 'string' && this.currentTonality.endsWith('m')) {
      rootNote = this.currentTonality.slice(0, -1);
      type = 'minor';
    } else {
      rootNote = this.currentTonality;
      type = 'major';
    }
    
    // Update selects if values are valid
    if (rootNote && this.getAvailableRootNotes().includes(rootNote)) {
      rootNoteSelect.value = rootNote;
    }
    
    if (type) {
      typeSelect.value = type;
    }
  }
  
  /**
   * Handle root note change
   * @param {Event} event - Change event
   */
  handleRootNoteChange(event) {
    const rootNote = event.target.value;
    const typeSelect = document.getElementById('tonality-type-select');
    
    if (!typeSelect) return;
    
    const type = typeSelect.value;
    
    // Construct tonality code
    const tonalityCode = type === 'minor' ? rootNote + 'm' : rootNote;
    
    // Update store
    store.setCurrentTonality(tonalityCode);
    
    // Call callback if provided
    if (this.options.onChange) {
      this.options.onChange(rootNote, type);
    }
  }
  
  /**
   * Handle type change
   * @param {Event} event - Change event
   */
  handleTypeChange(event) {
    const type = event.target.value;
    const rootNoteSelect = document.getElementById('root-note-select');
    
    if (!rootNoteSelect) return;
    
    const rootNote = rootNoteSelect.value;
    
    // Construct tonality code
    const tonalityCode = type === 'minor' ? rootNote + 'm' : rootNote;
    
    // Update store
    store.setCurrentTonality(tonalityCode);
    
    // Call callback if provided
    if (this.options.onChange) {
      this.options.onChange(rootNote, type);
    }
  }
  
  /**
   * Get available root notes
   * @returns {Array} Array of available root notes
   */
  getAvailableRootNotes() {
    // We could get this from tonalityCollection, but for now use a predefined list
    return ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'];
  }
  
  /**
   * Get full name of a note in Russian
   * @param {string} note - Note name
   * @returns {string} Full note name
   */
  getNoteFullName(note) {
    const noteNames = {
      'C': 'До', 'C#': 'До-диез', 'Db': 'Ре-бемоль',
      'D': 'Ре', 'D#': 'Ре-диез', 'Eb': 'Ми-бемоль',
      'E': 'Ми', 'F': 'Фа', 'F#': 'Фа-диез',
      'Gb': 'Соль-бемоль', 'G': 'Соль', 'G#': 'Соль-диез',
      'Ab': 'Ля-бемоль', 'A': 'Ля', 'A#': 'Ля-диез',
      'Bb': 'Си-бемоль', 'B': 'Си'
    };
    
    return noteNames[note] || note;
  }
  
  /**
   * Update selected tonality
   * @param {string} tonalityCode - Tonality code
   */
  updateSelectedTonality(tonalityCode) {
    if (!tonalityCode || this.currentTonality === tonalityCode) return;
    
    this.currentTonality = tonalityCode;
    this.updateSelectedValues();
    
    // Update display
    const tonalityCodeElement = document.getElementById('tonality-code');
    const tonalityNameElement = document.getElementById('tonality-name');
    
    if (tonalityCodeElement) {
      tonalityCodeElement.textContent = tonalityCode;
    }
    
    if (tonalityNameElement) {
      try {
        const tonality = tonalityCollection.getTonality(tonalityCode);
        if (tonality) {
          tonalityNameElement.textContent = `(${tonality.name})`;
        }
      } catch (error) {
        console.warn('Error updating tonality name:', error);
      }
    }
  }
  
  /**
   * Handle state changes from the store
   * @param {Object} state - Store state
   * @param {string} changedProp - Changed property
   */
  handleStateChange(state, changedProp) {
    if (changedProp === 'currentTonality') {
      this.updateSelectedTonality(state.currentTonality);
    }
  }
}

export default TonalitySelector;