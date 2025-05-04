/**
 * store.js
 * Core state management module for the chord application
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
    
    // Subscribers to state changes
    this.subscribers = [];
    
    // Load saved state from localStorage
    this.loadSavedState();
  }
  
  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback to handle state change
   * @param {Array} watchProps - Properties to watch for changes
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
   * Notify subscribers of state changes
   * @param {string} changedProp - Changed property
   */
  notifySubscribers(changedProp) {
    this.subscribers.forEach(subscriber => {
      // If subscriber watches specific properties, check if changed property is in the list
      if (subscriber.watchProps && !subscriber.watchProps.includes(changedProp)) {
        return;
      }
      
      // Call subscriber with current state and changed property
      try {
        subscriber.callback(this.state, changedProp);
      } catch (error) {
        console.error(`Error in subscriber when changing property '${changedProp}':`, error);
      }
    });
    
    // Save state to localStorage
    this.saveState();
  }
  
  /**
   * Update state and notify subscribers
   * @param {Object} changes - State changes
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
      // Save only certain parts of state
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
  
  /* Getter methods for state */
  
  /**
   * Get current tonality
   * @returns {string} Current tonality
   */
  getCurrentTonality() { 
    return this.state.currentTonality; 
  }
  
  /**
   * Get current chord
   * @returns {string} Current chord
   */
  getCurrentChord() { 
    return this.state.currentChord; 
  }
  
  /**
   * Get current sequence
   * @returns {Array} Sequence array
   */
  getSequence() { 
    return [...this.state.sequence]; 
  }
  
  /**
   * Get track structure
   * @returns {Array} Track structure array
   */
  getTrackStructure() { 
    return JSON.parse(JSON.stringify(this.state.trackStructure)); 
  }
  
  /**
   * Get current block index
   * @returns {number} Current block index
   */
  getCurrentBlockIndex() { 
    return this.state.currentBlockIndex; 
  }
  
  /**
   * Check if sequence is playing
   * @returns {boolean} Is playing flag
   */
  getIsPlaying() { 
    return this.state.isPlaying; 
  }
  
  /**
   * Check if arpeggiator is enabled
   * @returns {boolean} Arpeggiator enabled flag
   */
  getArpeggiatorEnabled() { 
    return this.state.arpeggiatorEnabled; 
  }
  
  /**
   * Check if metronome is enabled
   * @returns {boolean} Metronome enabled flag
   */
  getMetronomeEnabled() { 
    return this.state.metronomeEnabled; 
  }
  
  /**
   * Get current tempo
   * @returns {number} Tempo in BPM
   */
  getTempo() { 
    return this.state.tempo; 
  }
  
  /* Setter methods for state */
  
  /**
   * Set current tonality
   * @param {string} tonality - Tonality to set
   */
  setCurrentTonality(tonality) {
    if (!tonality) return;
    this.setState({ currentTonality: tonality });
  }
  
  /**
   * Set current chord
   * @param {string} chord - Chord to set
   */
  setCurrentChord(chord) {
    if (!chord) return;
    this.setState({ currentChord: chord });
  }
  
  /**
   * Set sequence
   * @param {Array} sequence - Sequence to set
   */
  setSequence(sequence) {
    if (!Array.isArray(sequence)) {
      console.warn('setSequence called with non-array:', sequence);
      sequence = [];
    }
    this.setState({ sequence: [...sequence] });
  }
  
  /**
   * Add chord to sequence
   * @param {string} chord - Chord to add
   */
  addChordToSequence(chord) {
    if (!chord) return;
    
    // Get current sequence
    const currentSequence = [...this.state.sequence];
    
    // Add chord
    const newSequence = [...currentSequence, chord];
    
    this.setState({ sequence: newSequence });
  }
  
  /**
   * Remove chord from sequence
   * @param {number} index - Index of chord to remove
   */
  removeChordFromSequence(index) {
    // Get current sequence
    const currentSequence = [...this.state.sequence];
    
    // Check if index is valid
    if (index < 0 || index >= currentSequence.length) {
      console.warn('removeChordFromSequence called with invalid index:', index);
      return;
    }
    
    // Remove chord
    const newSequence = [...currentSequence];
    newSequence.splice(index, 1);
    
    this.setState({ sequence: newSequence });
  }
  
  /**
   * Clear sequence
   */
  clearSequence() {
    this.setState({ sequence: [] });
  }
  
  /**
   * Set track structure
   * @param {Array} structure - Track structure to set
   */
  setTrackStructure(structure) {
    if (!Array.isArray(structure)) {
      console.warn('setTrackStructure called with non-array:', structure);
      structure = [];
    }
    
    this.setState({ trackStructure: JSON.parse(JSON.stringify(structure)) });
  }
  
  /**
   * Set current block index
   * @param {number} index - Current block index
   */
  setCurrentBlockIndex(index) {
    const trackStructure = this.state.trackStructure;
    if (!Array.isArray(trackStructure) || index < 0 || index >= trackStructure.length) {
      console.warn('setCurrentBlockIndex called with invalid index:', index);
      return;
    }
    
    this.setState({ currentBlockIndex: index });
  }
  
  /**
   * Set isPlaying flag
   * @param {boolean} isPlaying - Is playing flag
   */
  setIsPlaying(isPlaying) {
    this.setState({ isPlaying: !!isPlaying });
  }
  
  /**
   * Set arpeggiator enabled flag
   * @param {boolean} enabled - Arpeggiator enabled flag
   */
  setArpeggiatorEnabled(enabled) {
    this.setState({ arpeggiatorEnabled: !!enabled });
  }
  
  /**
   * Set metronome enabled flag
   * @param {boolean} enabled - Metronome enabled flag
   */
  setMetronomeEnabled(enabled) {
    this.setState({ metronomeEnabled: !!enabled });
  }
  
  /**
   * Set tempo
   * @param {number} tempo - Tempo in BPM
   */
  setTempo(tempo) {
    if (typeof tempo !== 'number' || tempo < 40 || tempo > 240) {
      console.warn('setTempo called with invalid value:', tempo);
      return;
    }
    
    this.setState({ tempo: tempo });
  }
}

// Create and export singleton store object
const store = new Store();
export default store;