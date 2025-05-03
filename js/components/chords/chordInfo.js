/**
 * chordInfo.js
 * Component for displaying information about the current chord
 */

import store from '../../core/store.js';
import audioService from '../../services/audioService.js';

class ChordInfo {
  /**
   * Create a new ChordInfo component
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onAddChord: null, // Callback for adding chord to sequence
      ...options
    };
    
    // Track current state
    this.currentChord = '';
    this.currentTonality = '';
    this.isVisible = true;
    
    // Initialize component
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    // Subscribe to store changes
    store.subscribe(this.handleStateChange.bind(this), 
      ['currentChord', 'currentTonality']);
    
    // Initial sync with store
    this.syncWithStore();
    
    // Set up hide/show toggle
    this.setupToggle();
  }
  
  /**
   * Set up hide/show toggle functionality
   */
  setupToggle() {
    // Find or create hide button
    let hideButton = this.container.querySelector('.hide-info-button');
    
    if (!hideButton) {
      hideButton = document.createElement('button');
      hideButton.className = 'hide-info-button';
      hideButton.textContent = 'Скрыть информацию';
      this.container.appendChild(hideButton);
    }
    
    // Add click handler
    hideButton.addEventListener('click', () => {
      this.toggleVisibility();
    });
  }
  
  /**
   * Toggle visibility of chord information
   */
  toggleVisibility() {
    this.isVisible = !this.isVisible;
    
    // Get button and content elements
    const hideButton = this.container.querySelector('.hide-info-button');
    const contentElements = this.container.querySelectorAll('.chord-name, .chord-notes, .chord-functions');
    
    // Update button text
    if (hideButton) {
      hideButton.textContent = this.isVisible ? 'Скрыть информацию' : 'Показать информацию';
    }
    
    // Update content visibility
    contentElements.forEach(el => {
      el.style.display = this.isVisible ? 'block' : 'none';
    });
  }
  
  /**
   * Sync component with store state
   */
  syncWithStore() {
    this.currentChord = store.getCurrentChord();
    this.currentTonality = store.getCurrentTonality();
    
    this.updateChordInfo(this.currentChord, this.currentTonality);
  }
  
  /**
   * Update chord information display
   * @param {string} chordName - Name of the chord
   * @param {string} tonality - Current tonality
   */
  updateChordInfo(chordName, tonality) {
    // Get chord data (this will be updated to use the chord model)
    const chord = window.CHORD_DATA ? window.CHORD_DATA[chordName] : null;
    
    if (!chord) {
      this.displayNoChordInfo();
      return;
    }
    
    // Clear current content
    this.container.innerHTML = '';
    
    // Create chord name element
    const nameElement = document.createElement('div');
    nameElement.className = 'chord-name';
    nameElement.textContent = `${chordName} (${chord.fullName})`;
    this.container.appendChild(nameElement);
    
    // Create chord notes element
    const notesElement = document.createElement('div');
    notesElement.className = 'chord-notes';
    
    // Display notes without octave
    const noteNames = chord.notes.map(note => note.replace(/[0-9]/g, ''));
    notesElement.textContent = `Ноты: ${noteNames.join(', ')}`;
    
    this.container.appendChild(notesElement);
    
    // Create chord functions element
    const functionsElement = document.createElement('div');
    functionsElement.className = 'chord-functions';
    
    // Add title
    const functionsTitle = document.createElement('div');
    functionsTitle.className = 'functions-title';
    functionsTitle.textContent = 'Функциональное значение:';
    functionsElement.appendChild(functionsTitle);
    
    // Add functions
    let hasFunctions = false;
    
    if (chord.functions) {
      for (const funcTonality in chord.functions) {
        hasFunctions = true;
        const func = chord.functions[funcTonality];
        
        // Create function item
        const functionItem = document.createElement('div');
        functionItem.className = 'function';
        
        // Create function icon
        const iconElement = document.createElement('span');
        iconElement.className = `function-icon ${this.getFunctionClass(func.function)}`;
        iconElement.textContent = func.label;
        functionItem.appendChild(iconElement);
        
        // Create function label
        const labelElement = document.createElement('span');
        labelElement.className = 'function-label';
        labelElement.textContent = ` (${func.degree} ступень) в тональности ${funcTonality}`;
        functionItem.appendChild(labelElement);
        
        functionsElement.appendChild(functionItem);
      }
    }
    
    // If no functions found
    if (!hasFunctions) {
      const noFunctionsElement = document.createElement('div');
      noFunctionsElement.textContent = 'Функция не определена';
      functionsElement.appendChild(noFunctionsElement);
    }
    
    this.container.appendChild(functionsElement);
    
    // Add play button
    const playButton = document.createElement('button');
    playButton.className = 'play-chord-button';
    playButton.textContent = '▶ Проиграть';
    playButton.addEventListener('click', () => {
      audioService.playChord(chordName);
    });
    this.container.appendChild(playButton);
    
    // Add button to add chord to sequence
    const addButton = document.createElement('button');
    addButton.className = 'add-chord-button';
    addButton.textContent = '+ Добавить в последовательность';
    addButton.addEventListener('click', () => {
      store.addChordToSequence(chordName);
      
      // Call callback if provided
      if (this.options.onAddChord) {
        this.options.onAddChord(chordName);
      }
    });
    this.container.appendChild(addButton);
    
    // Re-add hide button
    this.setupToggle();
    
    // Dispatch event for other components
    const event = new CustomEvent('chordInfoUpdated', {
      detail: { chord: chordName }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Display message when no chord info is available
   */
  displayNoChordInfo() {
    this.container.innerHTML = '<div class="no-chord-info">Выберите аккорд для просмотра информации</div>';
  }
  
  /**
   * Get CSS class for chord function
   * @param {string} functionName - Function name
   * @returns {string} CSS class
   */
  getFunctionClass(functionName) {
    if (functionName.includes('tonic')) {
      return 'tonic';
    } else if (functionName.includes('dominant')) {
      return 'dominant';
    } else if (functionName.includes('subdominant')) {
      return 'subdominant';
    }
    return '';
  }
  
  /**
   * Handle state changes from the store
   * @param {Object} state - Store state
   * @param {string} changedProp - Changed property
   */
  handleStateChange(state, changedProp) {
    switch (changedProp) {
      case 'currentChord':
      case 'currentTonality':
        this.currentChord = state.currentChord;
        this.currentTonality = state.currentTonality;
        this.updateChordInfo(this.currentChord, this.currentTonality);
        break;
    }
  }
}

export default ChordInfo;