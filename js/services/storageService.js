/**
 * storageService.js
 * Service for persistent storage of application data
 */

import store from '../core/store.js';
import { TrackStructure, TrackBlock } from '../models/sequence.js';

class StorageService {
  /**
   * Create a new StorageService
   * @param {Object} store - Application store
   */
  constructor(store) {
    this.store = store;
    this.storageKey = 'chordPlayerData';
  }
  
  /**
   * Save application data to localStorage
   * @returns {boolean} True if save was successful
   */
  saveData() {
    try {
      // Extract data to save from store
      const data = {
        currentTonality: this.store.state.currentTonality,
        currentChord: this.store.state.currentChord,
        trackStructure: this.store.state.trackStructure,
        tempo: this.store.state.tempo,
        arpeggiatorEnabled: this.store.state.arpeggiatorEnabled,
        metronomeEnabled: this.store.state.metronomeEnabled,
        // Don't save sequence - it's tied to the current block
        // Don't save isPlaying - it should be false on reload
      };
      
      // Convert to string
      const serialized = JSON.stringify(data);
      
      // Save to localStorage
      localStorage.setItem(this.storageKey, serialized);
      
      console.log('Data saved to localStorage');
      return true;
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
      return false;
    }
  }
  
  /**
   * Load application data from localStorage
   * @returns {boolean} True if load was successful
   */
  loadData() {
    try {
      // Get data from localStorage
      const serialized = localStorage.getItem(this.storageKey);
      
      if (!serialized) {
        console.log('No saved data found in localStorage');
        this.initializeDefaultData();
        return false;
      }
      
      // Parse data
      const data = JSON.parse(serialized);
      
      // Update store
      this.store.setState({
        currentTonality: data.currentTonality || 'C',
        currentChord: data.currentChord || 'C',
        trackStructure: data.trackStructure || [],
        tempo: data.tempo || 120,
        arpeggiatorEnabled: data.arpeggiatorEnabled || false,
        metronomeEnabled: data.metronomeEnabled || false
      });
      
      // Load sequence from current block
      this.loadSequenceFromCurrentBlock();
      
      console.log('Data loaded from localStorage');
      return true;
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      this.initializeDefaultData();
      return false;
    }
  }
  
  /**
   * Initialize default data if no saved data exists
   */
  initializeDefaultData() {
    console.log('Initializing default data');
    
    // Create default track structure
    const defaultStructure = [
      new TrackBlock('block_' + Date.now(), 'A1', 'C', [])
    ];
    
    // Update store
    this.store.setState({
      currentTonality: 'C',
      currentChord: 'C',
      trackStructure: defaultStructure,
      currentBlockIndex: 0,
      sequence: [],
      tempo: 120,
      arpeggiatorEnabled: false,
      metronomeEnabled: false
    });
  }
  
  /**
   * Load sequence from current block
   */
  loadSequenceFromCurrentBlock() {
    const { trackStructure, currentBlockIndex } = this.store.state;
    
    // Check if current block exists
    if (!trackStructure || 
        !Array.isArray(trackStructure) || 
        currentBlockIndex < 0 || 
        currentBlockIndex >= trackStructure.length) {
      return;
    }
    
    // Get current block
    const currentBlock = trackStructure[currentBlockIndex];
    
    // Load sequence
    this.store.setState({
      sequence: currentBlock.chords || []
    });
  }
  
  /**
   * Save sequence to current block
   * @returns {boolean} True if save was successful
   */
  saveSequenceToCurrentBlock() {
    const { trackStructure, currentBlockIndex, sequence } = this.store.state;
    
    // Check if current block exists
    if (!trackStructure || 
        !Array.isArray(trackStructure) || 
        currentBlockIndex < 0 || 
        currentBlockIndex >= trackStructure.length) {
      return false;
    }
    
    // Create updated structure
    const newStructure = [...trackStructure];
    newStructure[currentBlockIndex] = {
      ...newStructure[currentBlockIndex],
      chords: [...sequence]
    };
    
    // Update store
    this.store.setState({
      trackStructure: newStructure
    });
    
    // Save to localStorage
    this.saveData();
    
    return true;
  }
  
  /**
   * Clear all stored data
   * @returns {boolean} True if clear was successful
   */
  clearData() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('Data cleared from localStorage');
      
      // Initialize defaults
      this.initializeDefaultData();
      
      return true;
    } catch (error) {
      console.error('Error clearing data from localStorage:', error);
      return false;
    }
  }
  
  /**
   * Export data to file
   * @returns {boolean} True if export was successful
   */
  exportDataToFile() {
    try {
      // Extract data to export
      const data = {
        currentTonality: this.store.state.currentTonality,
        trackStructure: this.store.state.trackStructure,
        version: '1.0.0' // Add version for backwards compatibility
      };
      
      // Convert to string
      const serialized = JSON.stringify(data, null, 2);
      
      // Create blob
      const blob = new Blob([serialized], { type: 'application/json' });
      
      // Create download URL
      const url = URL.createObjectURL(blob);
      
      // Create filename with date
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `chord_player_${dateStr}.json`;
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Error exporting data to file:', error);
      return false;
    }
  }
  
  /**
   * Import data from file
   * @param {File} file - JSON file to import
   * @returns {Promise} Promise resolving to boolean indicating success
   */
  importDataFromFile(file) {
    return new Promise((resolve, reject) => {
      // Check file type
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        reject(new Error('Invalid file type. Only JSON files are supported.'));
        return;
      }
      
      // Create file reader
      const reader = new FileReader();
      
      // Handle file load
      reader.onload = (event) => {
        try {
          // Parse data
          const data = JSON.parse(event.target.result);
          
          // Validate data
          if (!data.trackStructure || !data.currentTonality) {
            reject(new Error('Invalid data format.'));
            return;
          }
          
          // Update store
          this.store.setState({
            currentTonality: data.currentTonality,
            trackStructure: data.trackStructure,
            currentBlockIndex: 0
          });
          
          // Load sequence from current block
          this.loadSequenceFromCurrentBlock();
          
          // Save to localStorage
          this.saveData();
          
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      
      // Handle errors
      reader.onerror = (error) => {
        reject(error);
      };
      
      // Read file
      reader.readAsText(file);
    });
  }
}

// Create singleton instance
const storageService = new StorageService(store);

export default storageService;