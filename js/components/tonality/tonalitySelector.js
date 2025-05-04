/**
 * tonalitySelector.js
 * Modernized component for selecting tonality
 */

import Component from '../component.js';
import store from '../../core/store.js';
import { tonalityCollection } from '../../models/tonality.js';
import eventBus from '../../core/eventBus.js';

class TonalitySelector extends Component {
  /**
   * Creates a tonality selector component
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    // Call super with auto-render disabled until we're ready
    super(container, {
      ...options,
      autoRender: false
    });
    
    // Initialize state
    this.currentTonality = store.getCurrentTonality() || 'C';
    
    // Default options
    this.options = {
      onChange: null, // Callback for tonality change
      showNames: true, // Show full names of tonalities
      ...options
    };
    
    // Subscribe to store changes
    this.subscribeToStore(this.handleStateChange, ['currentTonality']);
    
    // Now manually render
    this.render();
  }
  
  /**
   * Render component
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
    
    // Get available root notes from tonality collection
    const availableNotes = this.getAvailableRootNotes();
    
    // Add options
    availableNotes.forEach(note => {
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
      textContent: this.currentTonality
    });
    tonalityDisplay.appendChild(tonalityCode);
    
    // Get tonality info from collection
    const tonality = tonalityCollection.getTonality(this.currentTonality);
    if (tonality) {
      const tonalityName = this.createElement('span', {
        className: 'tonality-name',
        id: 'tonality-name',
        textContent: `(${tonality.name})`
      });
      tonalityDisplay.appendChild(tonalityName);
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
    
    // Parse tonality code
    let rootNote, type;
    
    if (typeof this.currentTonality === 'string' && this.currentTonality.endsWith('m')) {
      rootNote = this.currentTonality.slice(0, -1);
      type = 'minor';
    } else {
      rootNote = this.currentTonality;
      type = 'major';
    }
    
    // Update selects
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
    
    // Publish event
    eventBus.publish('tonalityChanged', {
      tonality: tonalityCode,
      rootNote: rootNote,
      type: type
    });
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
    
    // Publish event
    eventBus.publish('tonalityChanged', {
      tonality: tonalityCode,
      rootNote: rootNote,
      type: type
    });
  }
  
  /**
   * Get available root notes from tonality collection
   * @returns {Array} Array of available root notes
   */
  getAvailableRootNotes() {
    // Get all tonalities from collection
    const allTonalities = tonalityCollection.getAllTonalities();
    
    // Extract unique root notes
    const rootNotes = new Set();
    
    allTonalities.forEach(tonality => {
      const rootNote = tonality.getRootNote();
      if (rootNote) {
        rootNotes.add(rootNote);
      }
    });
    
    // Convert to array and sort
    return Array.from(rootNotes).sort((a, b) => {
      // Custom sort order for music notes
      const noteOrder = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'];
      return noteOrder.indexOf(a) - noteOrder.indexOf(b);
    });
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
      const tonality = tonalityCollection.getTonality(tonalityCode);
      if (tonality) {
        tonalityNameElement.textContent = `(${tonality.name})`;
      }
    }
  }
  
  /**
   * Handle state changes from store
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