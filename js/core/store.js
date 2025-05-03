/**
 * store.js
 * Central state management for the application
 */

/**
 * Store class
 * Implements a simple state management system
 */
class Store {
  constructor() {
    // Initial application state
    this.state = {
      currentTonality: 'C',
      currentChord: 'C',
      sequence: [],
      trackStructure: [],
      currentBlockIndex: 0,
      isPlaying: false,
      arpeggiatorEnabled: false,
      metronomeEnabled: false,
      tempo: 120
    };
    
    // State change subscribers
    this.subscribers = [];
    
    // Load saved state from localStorage if available
    this.loadSavedState();
  }
  
  /**
   * Subscribe to state changes
   * @param {Function} callback - Function to call when state changes
   * @param {Array} [watchProps] - Optional array of property names to watch
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback, watchProps = null) {
    const subscriber = { callback, watchProps };
    this.subscribers.push(subscriber);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(subscriber);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify subscribers about state changes
   * @param {String} changedProp - Name of the property that changed
   */
  notifySubscribers(changedProp) {
    this.subscribers.forEach(subscriber => {
      // If subscriber watches specific properties, check if the changed property is in the list
      if (subscriber.watchProps && !subscriber.watchProps.includes(changedProp)) {
        return;
      }
      
      // Call the subscriber with the current state and the changed property
      try {
        subscriber.callback(this.state, changedProp);
      } catch (error) {
        console.error(`Error in store subscriber for property '${changedProp}':`, error);
      }
    });
    
    // Save state to localStorage
    this.saveState();
  }
  
  /**
   * Update state and notify subscribers
   * @param {Object} changes - Object with state changes
   */
  setState(changes) {
    const changedProps = Object.keys(changes);
    
    // Update state
    changedProps.forEach(prop => {
      if (this.state.hasOwnProperty(prop)) {
        this.state[prop] = changes[prop];
      }
    });
    
    // Notify subscribers for each changed property
    changedProps.forEach(prop => {
      this.notifySubscribers(prop);
    });
  }
  
  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      // Only save specific parts of the state
      const savedState = {
        currentTonality: this.state.currentTonality,
        trackStructure: this.state.trackStructure,
        tempo: this.state.tempo,
        arpeggiatorEnabled: this.state.arpeggiatorEnabled,
        metronomeEnabled: this.state.metronomeEnabled
      };
      
      localStorage.setItem('chordPlayerState', JSON.stringify(savedState));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }
  
  /**
   * Load saved state from localStorage
   */
  loadSavedState() {
    try {
      const savedState = localStorage.getItem('chordPlayerState');
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Merge saved state with current state
        this.state = {
          ...this.state,
          ...parsedState
        };
        
        console.log('Loaded saved state from localStorage');
      }
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
    }
  }
  
  // Specific state getters
  getCurrentTonality() { return this.state.currentTonality; }
  getCurrentChord() { return this.state.currentChord; }
  getSequence() { return Array.isArray(this.state.sequence) ? [...this.state.sequence] : []; }
  getTrackStructure() { return Array.isArray(this.state.trackStructure) ? JSON.parse(JSON.stringify(this.state.trackStructure)) : []; }
  getCurrentBlockIndex() { return this.state.currentBlockIndex; }
  getIsPlaying() { return this.state.isPlaying; }
  getArpeggiatorEnabled() { return this.state.arpeggiatorEnabled; }
  getMetronomeEnabled() { return this.state.metronomeEnabled; }
  getTempo() { return this.state.tempo; }
  
  // Specific state setters
  setCurrentTonality(tonality) {
    if (!tonality) return;
    this.setState({ currentTonality: tonality });
  }
  
  setCurrentChord(chord) {
    if (!chord) return;
    this.setState({ currentChord: chord });
  }
  
  setSequence(sequence) {
    if (!Array.isArray(sequence)) {
      console.warn('setSequence called with non-array value:', sequence);
      sequence = [];
    }
    this.setState({ sequence: [...sequence] });
  }
  
  addChordToSequence(chord) {
    if (!chord) return;
    
    // Get current sequence and ensure it's an array
    const currentSequence = Array.isArray(this.state.sequence) ? this.state.sequence : [];
    const newSequence = [...currentSequence, chord];
    
    this.setState({ sequence: newSequence });
  }
  
  removeChordFromSequence(index) {
    // Get current sequence and ensure it's an array
    const currentSequence = Array.isArray(this.state.sequence) ? this.state.sequence : [];
    
    // Check if index is valid
    if (index < 0 || index >= currentSequence.length) {
      console.warn('removeChordFromSequence called with invalid index:', index);
      return;
    }
    
    const newSequence = [...currentSequence];
    newSequence.splice(index, 1);
    
    this.setState({ sequence: newSequence });
  }
  
  clearSequence() {
    this.setState({ sequence: [] });
  }
  
  setTrackStructure(structure) {
    if (!Array.isArray(structure)) {
      console.warn('setTrackStructure called with non-array value:', structure);
      structure = [];
    }
    
    this.setState({ trackStructure: JSON.parse(JSON.stringify(structure)) });
  }
  
  setCurrentBlockIndex(index) {
    // Validate index
    const trackStructure = this.state.trackStructure;
    if (!Array.isArray(trackStructure) || index < 0 || index >= trackStructure.length) {
      console.warn('setCurrentBlockIndex called with invalid index:', index);
      return;
    }
    
    this.setState({ currentBlockIndex: index });
  }
  
  setIsPlaying(isPlaying) {
    this.setState({ isPlaying: !!isPlaying });
  }
  
  setArpeggiatorEnabled(enabled) {
    this.setState({ arpeggiatorEnabled: !!enabled });
  }
  
  setMetronomeEnabled(enabled) {
    this.setState({ metronomeEnabled: !!enabled });
  }
  
  setTempo(tempo) {
    // Validate tempo
    if (typeof tempo !== 'number' || tempo < 40 || tempo > 240) {
      console.warn('setTempo called with invalid value:', tempo);
      return;
    }
    
    this.setState({ tempo: tempo });
  }
  
  /**
   * Add a new block to the track structure
   * @param {string} [name] - Name for the new block (optional)
   * @param {string} [tonality] - Tonality for the new block (optional)
   * @returns {number} Index of the new block
   */
  addNewBlock(name, tonality) {
    // Use current tonality if not specified
    const currentTonality = tonality || this.state.currentTonality;
    
    // Get current track structure and ensure it's an array
    const trackStructure = Array.isArray(this.state.trackStructure) ? this.state.trackStructure : [];
    
    // Generate name if not provided
    const blockName = name || this.generateNextBlockName(trackStructure);
    
    // Create new block
    const newBlock = {
      id: 'block_' + Date.now(),
      name: blockName,
      tonality: currentTonality,
      chords: []
    };
    
    // Create new track structure with the new block
    const newStructure = [...trackStructure, newBlock];
    
    // Update state
    this.setState({
      trackStructure: newStructure,
      currentBlockIndex: newStructure.length - 1,
      sequence: []
    });
    
    // Return the index of the new block
    return newStructure.length - 1;
  }
  
  /**
   * Generate a name for a new block
   * @param {Array} trackStructure - Current track structure
   * @returns {string} Name for the new block
   */
  generateNextBlockName(trackStructure) {
    if (!Array.isArray(trackStructure) || trackStructure.length === 0) {
      return 'A1';
    }
    
    // Find the last prefix and number
    let lastPrefix = 'A';
    let lastNumber = 0;
    
    trackStructure.forEach(block => {
      if (!block || !block.name) return;
      
      const match = block.name.match(/^([A-Z])(\d+)$/);
      if (match) {
        const prefix = match[1];
        const number = parseInt(match[2], 10);
        
        if (prefix > lastPrefix) {
          lastPrefix = prefix;
          lastNumber = number;
        } else if (prefix === lastPrefix && number > lastNumber) {
          lastNumber = number;
        }
      }
    });
    
    // Determine the next number for the current prefix
    const nextNumber = lastNumber + 1;
    
    // If number > 9, move to the next letter
    if (nextNumber > 9) {
      const nextPrefixCode = lastPrefix.charCodeAt(0) + 1;
      if (nextPrefixCode <= 'Z'.charCodeAt(0)) {
        return String.fromCharCode(nextPrefixCode) + '1';
      } else {
        return 'A' + nextNumber;
      }
    } else {
      return lastPrefix + nextNumber;
    }
  }
  
  /**
   * Duplicate a block
   * @param {number} index - Index of the block to duplicate
   * @returns {number} Index of the new block
   */
  duplicateBlock(index) {
    // Get current track structure and ensure it's an array
    const trackStructure = Array.isArray(this.state.trackStructure) ? this.state.trackStructure : [];
    
    // Check if index is valid
    if (index < 0 || index >= trackStructure.length) {
      console.warn('duplicateBlock called with invalid index:', index);
      return -1;
    }
    
    // Get the block to duplicate
    const sourceBlock = trackStructure[index];
    
    // Generate name for the duplicate
    const blockName = this.generateNextBlockName(trackStructure);
    
    // Create the duplicate block
    const newBlock = {
      id: 'block_' + Date.now(),
      name: blockName,
      tonality: sourceBlock.tonality,
      chords: Array.isArray(sourceBlock.chords) ? [...sourceBlock.chords] : []
    };
    
    // Create new track structure with the duplicate block
    const newStructure = [...trackStructure];
    newStructure.splice(index + 1, 0, newBlock);
    
    // Update state
    this.setState({
      trackStructure: newStructure,
      currentBlockIndex: index + 1,
      sequence: Array.isArray(newBlock.chords) ? [...newBlock.chords] : []
    });
    
    // Return the index of the new block
    return index + 1;
  }
  
  /**
   * Remove a block
   * @param {number} index - Index of the block to remove
   * @returns {boolean} True if successful
   */
  removeBlock(index) {
    // Get current track structure and ensure it's an array
    const trackStructure = Array.isArray(this.state.trackStructure) ? this.state.trackStructure : [];
    
    // Check if index is valid
    if (index < 0 || index >= trackStructure.length) {
      console.warn('removeBlock called with invalid index:', index);
      return false;
    }
    
    // Don't allow removing the last block
    if (trackStructure.length <= 1) {
      console.warn('Cannot remove the last block');
      return false;
    }
    
    // Create new track structure without the removed block
    const newStructure = [...trackStructure];
    newStructure.splice(index, 1);
    
    // Determine new current block index
    let newCurrentIndex = this.state.currentBlockIndex;
    if (index === newCurrentIndex) {
      // If removing current block, move to previous or first block
      newCurrentIndex = Math.max(0, index - 1);
    } else if (index < newCurrentIndex) {
      // If removing block before current, adjust index
      newCurrentIndex--;
    }
    
    // Update state
    this.setState({
      trackStructure: newStructure,
      currentBlockIndex: newCurrentIndex,
      sequence: Array.isArray(newStructure[newCurrentIndex].chords) ? 
        [...newStructure[newCurrentIndex].chords] : []
    });
    
    return true;
  }
}

// Create a singleton store instance
const store = new Store();

// Export the store
export default store;