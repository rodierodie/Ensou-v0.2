// js/app.js - дополненная версия
import store from './core/store.js';
import audioService from './services/audioService.js';
import exportService from './services/exportService.js';
import initializeDataModels from './models/initializeData.js';

// Import components
import TonalityCircle from './components/tonality/tonalityCircle.js';
import ChordSelector from './components/chords/chordSelector.js';
import ChordInfo from './components/chords/chordInfo.js';
import SequenceComponent from './components/sequencer/sequenceComponent.js';
import BlockSelector from './components/sequencer/blockSelector.js';

/**
 * Main Application class
 */
class ChordPlayerApp {
  constructor() {
    // Instances of components
    this.components = {
      tonalityCircle: null,
      chordSelector: null,
      chordInfo: null,
      sequenceComponent: null,
      blockSelector: null
    };
    
    // Flag indicating if app is initialized
    this.initialized = false;
    
    // Initialize the application
    this.init();
  }
  
  /**
   * Initialize the application
   */
  async init() {
    try {
      // Инициализируем модели данных из старых структур
      initializeDataModels();
      
      // Initialize audio engine first
      await this.initializeAudio();
      
      // Initialize UI components
      this.initializeComponents();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up export buttons
      this.setupExportButtons();
      
      // Mark initialization as complete
      this.initialized = true;
      console.log('ChordPlayer application initialized');
      
      // Start audio context on first user interaction
      this.setupAudioContextTrigger();
    } catch (error) {
      console.error('Error initializing application:', error);
    }
  }
  
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Create app instance
  window.chordPlayerApp = new ChordPlayerApp();
});

// Export for use in browser console debugging
export default ChordPlayerApp;