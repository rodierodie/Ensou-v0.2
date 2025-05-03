/**
 * chordSelector.js
 * Component for displaying and selecting chords in the UI
 */

import store from '../../core/store.js';
import audioService from '../../services/audioService.js';

class ChordSelector {
  /**
   * Create a new ChordSelector component
   * @param {HTMLElement} basicChordsContainer - Container for basic chords
   * @param {HTMLElement} seventhChordsContainer - Container for seventh chords
   * @param {Object} options - Configuration options
   */
  constructor(basicChordsContainer, seventhChordsContainer, options = {}) {
    this.containers = {
      basic: basicChordsContainer,
      seventh: seventhChordsContainer
    };
    
    this.options = {
      onChordSelect: null, // Callback for chord selection
      ...options
    };
    
    // Track current state
    this.currentTonality = '';
    this.currentChord = '';
    
    // Chord suggestions
    this.suggestions = [];
    
    // Initialize component
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    // Subscribe to store changes
    store.subscribe(this.handleStateChange.bind(this), 
      ['currentTonality', 'currentChord', 'sequence']);
    
    // Initial sync with store
    this.syncWithStore();
  }
  
  /**
   * Sync component with store state
   */
  syncWithStore() {
    const tonality = store.getCurrentTonality();
    const chord = store.getCurrentChord();
    
    // Update chords if tonality changed
    if (this.currentTonality !== tonality) {
      this.currentTonality = tonality;
      this.updateChords(tonality, chord);
    }
    
    // Update active chord if changed
    if (this.currentChord !== chord) {
      this.currentChord = chord;
      this.updateActiveChord(chord);
    }
    
    // Update suggestions when sequence changes
    this.updateChordSuggestions();
  }
  
  /**
   * Update chords displayed in containers
   * @param {string} tonality - Current tonality
   * @param {string} activeChord - Currently active chord
   */
  updateChords(tonality, activeChord) {
    // Get tonality data from global object (will be updated to use the new data system)
    const tonalityData = window.TONALITY_DATA ? window.TONALITY_DATA[tonality] : null;
    
    if (!tonalityData) {
      console.error(`Tonality data not found for: ${tonality}`);
      return;
    }
    
    // Update basic chords
    this.updateChordButtons(
      this.containers.basic, 
      tonalityData.chords.basic, 
      activeChord,
      'basic'
    );
    
    // Update seventh chords
    this.updateChordButtons(
      this.containers.seventh, 
      tonalityData.chords.seventh, 
      activeChord,
      'seventh'
    );
    
    // Update chord suggestions after updating the chord buttons
    this.updateChordSuggestions();
  }
  
  /**
   * Update chord buttons in a container
   * @param {HTMLElement} container - Container element
   * @param {Array} chords - Array of chord names
   * @param {string} activeChord - Currently active chord
   * @param {string} type - Type of chords ('basic' or 'seventh')
   */
  updateChordButtons(container, chords, activeChord, type) {
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create buttons for each chord
    chords.forEach(chordName => {
      const button = document.createElement('div');
      button.className = 'chord-button';
      button.setAttribute('data-chord', chordName);
      button.textContent = chordName;
      
      // Check if this is the active chord
      if (chordName === activeChord) {
        button.classList.add('active');
      }
      
      // Add click handler
      button.addEventListener('click', () => {
        this.handleChordButtonClick(chordName);
      });
      
      // Add button to container
      container.appendChild(button);
    });
  }
  
  /**
   * Update the active chord in the UI
   * @param {string} chordName - Name of the active chord
   */
  updateActiveChord(chordName) {
    // Remove active class from all buttons
    const allButtons = document.querySelectorAll('.chord-button');
    allButtons.forEach(button => {
      button.classList.remove('active');
    });
    
    // Add active class to matching buttons
    const activeButtons = document.querySelectorAll(`.chord-button[data-chord="${chordName}"]`);
    activeButtons.forEach(button => {
      button.classList.add('active');
    });
  }
  
  /**
   * Handle chord button click
   * @param {string} chordName - Name of the clicked chord
   */
  handleChordButtonClick(chordName) {
    // Update current chord
    this.currentChord = chordName;
    
    // Update store
    store.setCurrentChord(chordName);
    
    // Play the chord
    audioService.playChord(chordName);
    
    // Call callback if provided
    if (this.options.onChordSelect) {
      this.options.onChordSelect(chordName);
    }
  }
  
  /**
   * Update chord suggestions based on the current sequence
   */
  updateChordSuggestions() {
    // Get the current sequence
    const sequence = store.getSequence();
    
    // If sequence is empty, clear suggestions
    if (sequence.length === 0) {
      this.clearSuggestions();
      return;
    }
    
    // Get the last chord in the sequence (skip PAUSE)
    let lastChord = null;
    for (let i = sequence.length - 1; i >= 0; i--) {
      if (sequence[i] !== 'PAUSE') {
        lastChord = sequence[i];
        break;
      }
    }
    
    // If no valid chord found, clear suggestions
    if (!lastChord) {
      this.clearSuggestions();
      return;
    }
    
    // Get suggested chords
    const suggestions = this.getSuggestedChords(lastChord, this.currentTonality);
    
    // Update UI with suggestions
    this.highlightSuggestedChords(suggestions);
    
    // Store suggestions
    this.suggestions = suggestions;
  }
  
  /**
   * Get suggested chords based on the last chord and current tonality
   * @param {string} lastChordName - Last chord in the sequence
   * @param {string} tonality - Current tonality
   * @returns {Array} Array of suggested chords with their confidence
   */
  getSuggestedChords(lastChordName, tonality) {
    // This will be updated to use the chord model system
    // For now, use a simplified version based on harmonic function
    
    // Basic transitions based on harmonic functions
    const harmonicTransitions = {
      "tonic": { 
        "subdominant": 0.4, 
        "dominant": 0.35, 
        "tonic": 0.25 
      },
      "subdominant": { 
        "dominant": 0.5, 
        "tonic": 0.3, 
        "subdominant": 0.2 
      },
      "dominant": { 
        "tonic": 0.7, 
        "subdominant": 0.2, 
        "dominant": 0.1 
      }
    };
    
    // Get last chord data
    const lastChord = window.CHORD_DATA ? window.CHORD_DATA[lastChordName] : null;
    
    if (!lastChord || !lastChord.functions || !lastChord.functions[tonality]) {
      return [];
    }
    
    // Get the function of the last chord
    const lastFunction = lastChord.functions[tonality].function;
    
    // Get transitions for this function
    const transitions = harmonicTransitions[lastFunction];
    if (!transitions) {
      return [];
    }
    
    // Sort functions by transition probability
    const sortedFunctions = Object.keys(transitions).sort(
      (a, b) => transitions[b] - transitions[a]
    );
    
    // Get all chords in tonality
    const tonalityData = window.TONALITY_DATA ? window.TONALITY_DATA[tonality] : null;
    if (!tonalityData) {
      return [];
    }
    
    const allChords = [
      ...tonalityData.chords.basic,
      ...tonalityData.chords.seventh
    ];
    
    // Collect suggested chords
    const suggestedChords = [];
    
    // For each target function, find matching chords
    sortedFunctions.forEach(targetFunction => {
      const confidence = transitions[targetFunction];
      
      // Find chords with the target function
      allChords.forEach(chordName => {
        // Skip the current chord
        if (chordName === lastChordName) return;
        
        // Get chord data
        const chord = window.CHORD_DATA ? window.CHORD_DATA[chordName] : null;
        
        if (chord && 
            chord.functions && 
            chord.functions[tonality] && 
            chord.functions[tonality].function === targetFunction) {
          
          // Add chord to suggestions
          suggestedChords.push({
            name: chordName,
            function: targetFunction,
            confidence: confidence
          });
        }
      });
    });
    
    return suggestedChords;
  }
  
  /**
   * Highlight suggested chords in the UI
   * @param {Array} suggestedChords - Array of suggested chords
   */
  highlightSuggestedChords(suggestedChords) {
    // Clear existing suggestions
    this.clearSuggestions();
    
    // Add highlighting to suggested chords
    suggestedChords.forEach(suggestion => {
      // Find all buttons for this chord
      const buttons = document.querySelectorAll(`.chord-button[data-chord="${suggestion.name}"]`);
      
      // Determine highlight class based on confidence
      let highlightClass = '';
      if (suggestion.confidence > 0.5) {
        highlightClass = 'suggested-high';
      } else if (suggestion.confidence > 0.3) {
        highlightClass = 'suggested-medium';
      } else {
        highlightClass = 'suggested-low';
      }
      
      // Add suggestion class to buttons
      buttons.forEach(button => {
        button.classList.add(highlightClass);
        
        // Add function icon
        this.addFunctionIcon(button, suggestion.function);
        
        // Add tooltip
        button.title = `${suggestion.name} (${this.getFunctionLabel(suggestion.function)})`;
      });
    });
  }
  
  /**
   * Add function icon to chord button
   * @param {HTMLElement} button - Chord button element
   * @param {string} functionName - Function name
   */
  addFunctionIcon(button, functionName) {
    // Remove existing icon if any
    const existingIcon = button.querySelector('.suggestion-function-icon');
    if (existingIcon) {
      existingIcon.remove();
    }
    
    // Create function icon
    const iconClass = this.getFunctionIconClass(functionName);
    const iconLabel = this.getFunctionIconLabel(functionName);
    
    const functionIcon = document.createElement('span');
    functionIcon.className = `function-icon ${iconClass} suggestion-function-icon`;
    functionIcon.textContent = iconLabel;
    
    // Add icon to button
    button.appendChild(functionIcon);
  }
  
  /**
   * Clear chord suggestions
   */
  clearSuggestions() {
    // Remove suggestion classes from all buttons
    const allButtons = document.querySelectorAll('.chord-button');
    allButtons.forEach(button => {
      button.classList.remove('suggested-high', 'suggested-medium', 'suggested-low');
      
      // Remove function icons
      const icon = button.querySelector('.suggestion-function-icon');
      if (icon) {
        icon.remove();
      }
      
      // Clear tooltip
      button.title = '';
    });
  }
  
  /**
   * Get CSS class for function icon
   * @param {string} functionName - Function name
   * @returns {string} CSS class
   */
  getFunctionIconClass(functionName) {
    switch(functionName) {
      case 'tonic': return 'tonic';
      case 'dominant': return 'dominant';
      case 'subdominant': return 'subdominant';
      default: return '';
    }
  }
  
  /**
   * Get label for function icon
   * @param {string} functionName - Function name
   * @returns {string} Label
   */
  getFunctionIconLabel(functionName) {
    switch(functionName) {
      case 'tonic': return 'T';
      case 'dominant': return 'D';
      case 'subdominant': return 'S';
      default: return '?';
    }
  }
  
  /**
   * Get human-readable label for function
   * @param {string} functionName - Function name
   * @returns {string} Label
   */
  getFunctionLabel(functionName) {
    switch(functionName) {
      case 'tonic': return 'Тоника';
      case 'dominant': return 'Доминанта';
      case 'subdominant': return 'Субдоминанта';
      default: return functionName;
    }
  }
  
  /**
   * Handle state changes from the store
   * @param {Object} state - Store state
   * @param {string} changedProp - Changed property
   */
  handleStateChange(state, changedProp) {
    switch (changedProp) {
      case 'currentTonality':
        this.currentTonality = state.currentTonality;
        this.updateChords(state.currentTonality, state.currentChord);
        break;
        
      case 'currentChord':
        this.currentChord = state.currentChord;
        this.updateActiveChord(state.currentChord);
        break;
        
      case 'sequence':
        this.updateChordSuggestions();
        break;
    }
  }
}

export default ChordSelector;