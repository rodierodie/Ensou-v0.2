/**
 * chordSelector.js
 * Component for displaying and selecting chords in the UI
 */

import Component from '../component.js';
import store from '../../core/store.js';
import audioService from '../../services/audioService.js';
import eventBus from '../../core/eventBus.js';

class ChordSelector extends Component {
  /**
   * Create a new ChordSelector component
   * @param {HTMLElement} basicChordsContainer - Container for basic chords
   * @param {HTMLElement} seventhChordsContainer - Container for seventh chords
   * @param {Object} options - Configuration options
   */
  constructor(basicChordsContainer, seventhChordsContainer, options = {}) {
    // Call super with autoRender disabled until we're ready
    super(basicChordsContainer, {
      ...options,
      autoRender: false
    });
    
    this.containers = {
      basic: basicChordsContainer,
      seventh: seventhChordsContainer
    };
    
    this.options = {
      onChordSelect: null, // Callback for chord selection
      ...options
    };
    
    // Track current state
    this.currentTonality = store.getCurrentTonality() || 'C';
    this.currentChord = store.getCurrentChord() || 'C';
    
    // Chord suggestions
    this.suggestions = [];
    
    // Initialize component
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    try {
      // Subscribe to store changes
      this.subscribeToStore(this.handleStateChange, 
        ['currentTonality', 'currentChord', 'sequence']);
      
      // Initial sync with store
      this.syncWithStore();
      
      // Now manually render
      this.render();
      
    } catch (error) {
      console.error('Error initializing ChordSelector:', error);
    }
  }
  
  /**
   * Render the component
   */
  render() {
    // Nothing to render directly - containers are managed by updateChords
    this.syncWithStore();
  }
  
  /**
   * Sync component with store state
   */
  syncWithStore() {
    try {
      const tonality = store.getCurrentTonality() || 'C';
      const chord = store.getCurrentChord() || 'C';
      
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
    } catch (error) {
      console.error('Error in syncWithStore:', error);
    }
  }
  
  /**
   * Update chords displayed in containers
   * @param {string} tonality - Current tonality
   * @param {string} activeChord - Currently active chord
   */
  updateChords(tonality, activeChord) {
    try {
      if (!tonality) {
        console.warn('Invalid tonality provided to updateChords');
        tonality = 'C'; // Default to C major
      }
      
      // Get tonality data from global object or collection
      let tonalityData = null;
      
      // First try to get from tonality collection if available
      if (window.tonalityCollection && 
          typeof window.tonalityCollection.getTonality === 'function') {
        tonalityData = window.tonalityCollection.getTonality(tonality);
      }
      
      // Fallback to global data
      if (!tonalityData && window.TONALITY_DATA) {
        tonalityData = window.TONALITY_DATA[tonality];
      }
      
      // If tonality not found, try to create a default tonality
      if (!tonalityData) {
        console.warn(`Tonality data not found for: ${tonality}`);
        tonalityData = this.createDefaultTonality(tonality);
      }
      
      if (!tonalityData || !tonalityData.chords) {
        console.error(`Unable to create or find tonality data for: ${tonality}`);
        this.clearChordButtons();
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
    } catch (error) {
      console.error('Error in updateChords:', error);
    }
  }
  
  /**
   * Create default tonality data when missing
   * @param {string} tonalityCode - Tonality code
   * @returns {Object} Default tonality data
   */
  createDefaultTonality(tonalityCode) {
    try {
      if (!tonalityCode) return null;
      
      // Default chords for major and minor
      const defaultMajorChords = {
        basic: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
        seventh: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5']
      };
      
      const defaultMinorChords = {
        basic: ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'],
        seventh: ['Am7', 'Bm7b5', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7']
      };
      
      // Determine if tonality is minor
      const isMinor = tonalityCode.endsWith('m');
      
      // Get root note
      const rootNote = isMinor ? tonalityCode.slice(0, -1) : tonalityCode;
      
      // Create basic tonality data
      const tonalityData = {
        name: rootNote + (isMinor ? ' minor' : ' major'),
        type: isMinor ? 'minor' : 'major',
        signature: '0', // Default signature
        chords: isMinor ? defaultMinorChords : defaultMajorChords
      };
      
      // If we have a tonality collection, try to add it
      if (window.tonalityCollection && 
          typeof window.tonalityCollection.addTonality === 'function') {
        try {
          const { Tonality } = require('../models/tonality.js');
          const tonality = new Tonality(
            tonalityCode,
            rootNote + (isMinor ? ' minor' : ' major'),
            isMinor ? 'minor' : 'major',
            '0',
            isMinor ? defaultMinorChords : defaultMajorChords
          );
          window.tonalityCollection.addTonality(tonality);
        } catch (error) {
          console.warn('Error adding tonality to collection:', error);
        }
      }
      
      // If we have global tonality data, add it there too
      if (window.TONALITY_DATA) {
        window.TONALITY_DATA[tonalityCode] = tonalityData;
      }
      
      return tonalityData;
    } catch (error) {
      console.error('Error creating default tonality:', error);
      return null;
    }
  }
  
  /**
   * Clear chord buttons when no tonality is available
   */
  clearChordButtons() {
    if (this.containers.basic) {
      this.containers.basic.innerHTML = '';
    }
    
    if (this.containers.seventh) {
      this.containers.seventh.innerHTML = '';
    }
  }
  
  /**
   * Update chord buttons in a container
   * @param {HTMLElement} container - Container element
   * @param {Array} chords - Array of chord names
   * @param {string} activeChord - Currently active chord
   * @param {string} type - Type of chords ('basic' or 'seventh')
   */
  updateChordButtons(container, chords, activeChord, type) {
    try {
      if (!container) return;
      
      // Ensure chords is an array
      if (!Array.isArray(chords)) {
        console.warn(`Invalid chords array for ${type} chords:`, chords);
        chords = [];
      }
      
      // Clear container
      container.innerHTML = '';
      
      // Create buttons for each chord
      chords.forEach(chordName => {
        if (!chordName) return;
        
        const button = this.createElement('div', {
          className: 'chord-button',
          dataset: { chord: chordName },
          textContent: chordName
        });
        
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
    } catch (error) {
      console.error('Error in updateChordButtons:', error);
    }
  }
  
  /**
   * Update the active chord in the UI
   * @param {string} chordName - Name of the active chord
   */
  updateActiveChord(chordName) {
    try {
      if (!chordName) return;
      
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
    } catch (error) {
      console.error('Error in updateActiveChord:', error);
    }
  }
  
  /**
   * Handle chord button click
   * @param {string} chordName - Name of the clicked chord
   */
  handleChordButtonClick(chordName) {
    try {
      if (!chordName) return;
      
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
      
      // Publish event
      eventBus.publish('chordSelected', {
        chordName: chordName
      });
    } catch (error) {
      console.error('Error in handleChordButtonClick:', error);
    }
  }
  
  /**
   * Update chord suggestions based on the current sequence
   */
  updateChordSuggestions() {
    try {
      // Get the current sequence
      const sequence = store.getSequence();
      
      // If sequence is empty, clear suggestions
      if (!Array.isArray(sequence) || sequence.length === 0) {
        this.clearSuggestions();
        return;
      }
      
      // Get the last chord in the sequence (skip PAUSE)
      let lastChord = null;
      for (let i = sequence.length - 1; i >= 0; i--) {
        if (sequence[i] !== 'PAUSE' && sequence[i] !== 'BLOCK_DIVIDER') {
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
      
      // Publish event
      eventBus.publish('chordSuggestionsUpdated', {
        suggestions: suggestions
      });
    } catch (error) {
      console.error('Error in updateChordSuggestions:', error);
    }
  }
  
  /**
   * Get suggested chords based on the last chord and current tonality
   * @param {string} lastChordName - Last chord in the sequence
   * @param {string} tonality - Current tonality
   * @returns {Array} Array of suggested chords with their confidence
   */
  getSuggestedChords(lastChordName, tonality) {
    try {
      if (!lastChordName || !tonality) return [];
      
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
      
      // Get last chord data (first try global, then collection)
      let lastChord = null;
      
      // Try global data
      if (window.CHORD_DATA && window.CHORD_DATA[lastChordName]) {
        lastChord = window.CHORD_DATA[lastChordName];
      }
      
      // Try collection
      if (!lastChord && window.chordCollection && 
          typeof window.chordCollection.getChord === 'function') {
        lastChord = window.chordCollection.getChord(lastChordName);
      }
      
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
      let allChords = [];
      
      // Try to get from global data
      if (window.TONALITY_DATA && window.TONALITY_DATA[tonality] && window.TONALITY_DATA[tonality].chords) {
        allChords = [
          ...window.TONALITY_DATA[tonality].chords.basic,
          ...window.TONALITY_DATA[tonality].chords.seventh
        ];
      }
      
      // Try to get from collection
      if (allChords.length === 0 && window.tonalityCollection && 
          typeof window.tonalityCollection.getTonality === 'function') {
        const tonalityObj = window.tonalityCollection.getTonality(tonality);
        if (tonalityObj && tonalityObj.chords) {
          allChords = tonalityObj.getAllChords();
        }
      }
      
      if (allChords.length === 0) {
        return [];
      }
      
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
          let chord = null;
          if (window.CHORD_DATA && window.CHORD_DATA[chordName]) {
            chord = window.CHORD_DATA[chordName];
          } else if (window.chordCollection && 
                    typeof window.chordCollection.getChord === 'function') {
            chord = window.chordCollection.getChord(chordName);
          }
          
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
    } catch (error) {
      console.error('Error in getSuggestedChords:', error);
      return [];
    }
  }
  
  /**
   * Highlight suggested chords in the UI
   * @param {Array} suggestedChords - Array of suggested chords
   */
  highlightSuggestedChords(suggestedChords) {
    try {
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
    } catch (error) {
      console.error('Error in highlightSuggestedChords:', error);
    }
  }
  
  /**
   * Add function icon to chord button
   * @param {HTMLElement} button - Chord button element
   * @param {string} functionName - Function name
   */
  addFunctionIcon(button, functionName) {
    try {
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
    } catch (error) {
      console.error('Error in addFunctionIcon:', error);
    }
  }
  
  /**
   * Clear chord suggestions
   */
  clearSuggestions() {
    try {
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
    } catch (error) {
      console.error('Error in clearSuggestions:', error);
    }
  }
  
  /**
   * Get CSS class for function icon
   * @param {string} functionName - Function name
   * @returns {string} CSS class
   */
  getFunctionIconClass(functionName) {
    if (!functionName) return '';
    
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
    if (!functionName) return '?';
    
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
    if (!functionName) return '';
    
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
    try {
      switch (changedProp) {
        case 'currentTonality':
          if (this.currentTonality !== state.currentTonality) {
            this.currentTonality = state.currentTonality;
            this.updateChords(state.currentTonality, state.currentChord);
          }
          break;
          
        case 'currentChord':
          if (this.currentChord !== state.currentChord) {
            this.currentChord = state.currentChord;
            this.updateActiveChord(state.currentChord);
          }
          break;
          
        case 'sequence':
          this.updateChordSuggestions();
          break;
      }
    } catch (error) {
      console.error('Error in handleStateChange:', error);
    }
  }
}

export default ChordSelector;