/**
 * store.js
 * Central state management system for the application
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
        subscriber.callback(this.state, changedProp);
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
    getSequence() { return [...this.state.sequence]; }
    getTrackStructure() { return JSON.parse(JSON.stringify(this.state.trackStructure)); }
    getCurrentBlockIndex() { return this.state.currentBlockIndex; }
    getIsPlaying() { return this.state.isPlaying; }
    getArpeggiatorEnabled() { return this.state.arpeggiatorEnabled; }
    getMetronomeEnabled() { return this.state.metronomeEnabled; }
    getTempo() { return this.state.tempo; }
    
    // Specific state setters
    setCurrentTonality(tonality) {
      this.setState({ currentTonality: tonality });
    }
    
    setCurrentChord(chord) {
      this.setState({ currentChord: chord });
    }
    
    setSequence(sequence) {
      this.setState({ sequence: [...sequence] });
    }
    
    addChordToSequence(chord) {
      const newSequence = [...this.state.sequence, chord];
      this.setState({ sequence: newSequence });
    }
    
    removeChordFromSequence(index) {
      const newSequence = [...this.state.sequence];
      newSequence.splice(index, 1);
      this.setState({ sequence: newSequence });
    }
    
    clearSequence() {
      this.setState({ sequence: [] });
    }
    
    setTrackStructure(structure) {
      this.setState({ trackStructure: JSON.parse(JSON.stringify(structure)) });
    }
    
    setCurrentBlockIndex(index) {
      this.setState({ currentBlockIndex: index });
    }
    
    setIsPlaying(isPlaying) {
      this.setState({ isPlaying: isPlaying });
    }
    
    setArpeggiatorEnabled(enabled) {
      this.setState({ arpeggiatorEnabled: enabled });
    }
    
    setMetronomeEnabled(enabled) {
      this.setState({ metronomeEnabled: enabled });
    }
    
    setTempo(tempo) {
      this.setState({ tempo: tempo });
    }
    
    // Update current block's chord sequence
    saveSequenceToCurrentBlock() {
      const { trackStructure, currentBlockIndex, sequence } = this.state;
      
      // Check if current block exists
      if (currentBlockIndex < 0 || currentBlockIndex >= trackStructure.length) {
        return false;
      }
      
      // Create a new track structure with updated chords
      const newStructure = [...trackStructure];
      newStructure[currentBlockIndex] = {
        ...newStructure[currentBlockIndex],
        chords: [...sequence]
      };
      
      this.setState({ trackStructure: newStructure });
      return true;
    }
    
    // Add a new block to track structure
    addNewBlock(name, tonality) {
      const { trackStructure } = this.state;
      
      const newBlock = {
        id: 'block_' + Date.now(),
        name: name || this.generateNextBlockName(trackStructure),
        tonality: tonality || this.state.currentTonality,
        chords: []
      };
      
      const newStructure = [...trackStructure, newBlock];
      
      this.setState({ 
        trackStructure: newStructure,
        currentBlockIndex: newStructure.length - 1,
        sequence: []
      });
      
      return newStructure.length - 1;
    }
    
    // Helper to generate next block name
    generateNextBlockName(trackStructure) {
      if (trackStructure.length === 0) {
        return 'A1';
      }
      
      // Find the last prefix and number
      let lastPrefix = 'A';
      let lastNumber = 0;
      
      trackStructure.forEach(block => {
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
  }
  
  // Create a singleton store instance
  const store = new Store();
  
  // Export the store
  export default store;