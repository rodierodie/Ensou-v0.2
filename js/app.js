/**
 * app.js
 * Main application entry point for the modernized chord player
 */

// Import core modules
import store from './core/store.js';

// Import services
import audioService from './services/audioService.js';
import exportService from './services/exportService.js';

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
  
  /**
   * Initialize audio engine
   */
  async initializeAudio() {
    console.log('Initializing audio engine...');
    
    // Check if Tone.js is available
    if (!window.Tone) {
      throw new Error('Tone.js is not loaded');
    }
    
    // Initialize audio service
    await audioService.initialize();
  }
  
  /**
   * Initialize UI components
   */
  initializeComponents() {
    console.log('Initializing UI components...');
    
    // Initialize tonality circle
    const tonalityCircleContainer = document.getElementById('tonality-circle-container');
    if (tonalityCircleContainer) {
      this.components.tonalityCircle = new TonalityCircle(tonalityCircleContainer);
    }
    
    // Initialize chord selectors
    const basicChordsContainer = document.getElementById('basic-chords');
    const seventhChordsContainer = document.getElementById('seventh-chords');
    if (basicChordsContainer && seventhChordsContainer) {
      this.components.chordSelector = new ChordSelector(
        basicChordsContainer, 
        seventhChordsContainer
      );
    }
    
    // Initialize chord info
    const chordInfoContainer = document.getElementById('chord-info-section');
    if (chordInfoContainer) {
      this.components.chordInfo = new ChordInfo(chordInfoContainer);
    }
    
    // Initialize sequence component
    const sequenceContainer = document.getElementById('sequence-container');
    if (sequenceContainer) {
      this.components.sequenceComponent = new SequenceComponent(sequenceContainer);
    }
    
    // Initialize block selector
    const blockTabsContainer = document.getElementById('block-tabs-container');
    if (blockTabsContainer) {
      this.components.blockSelector = new BlockSelector(blockTabsContainer);
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Toggle circle button
    const toggleCircleButton = document.getElementById('toggle-circle');
    if (toggleCircleButton) {
      toggleCircleButton.addEventListener('click', () => {
        const circleContainer = document.getElementById('tonality-circle-container');
        if (circleContainer) {
          // Toggle visibility
          const isVisible = circleContainer.style.display !== 'none';
          circleContainer.style.display = isVisible ? 'none' : 'block';
          
          // Update button text
          toggleCircleButton.textContent = isVisible 
            ? 'Показать круг тональностей' 
            : 'Скрыть круг тональностей';
        }
      });
    }
    
    // Block duplication button
    const duplicateBlockButton = document.querySelector('.duplicate-block');
    if (duplicateBlockButton) {
      duplicateBlockButton.addEventListener('click', () => {
        this.duplicateCurrentBlock();
      });
    }
    
    // Add chord button (global)
    const addChordButton = document.getElementById('add-chord');
    if (addChordButton) {
      addChordButton.addEventListener('click', () => {
        const currentChord = store.getCurrentChord();
        if (currentChord) {
          store.addChordToSequence(currentChord);
        }
      });
    }
    
    // Add pause button (global)
    const addPauseButton = document.getElementById('add-pause');
    if (addPauseButton) {
      addPauseButton.addEventListener('click', () => {
        store.addChordToSequence('PAUSE');
      });
    }
  }
  
  /**
   * Set up export buttons
   */
  setupExportButtons() {
    // MIDI export button
    const exportMidiButton = document.getElementById('export-midi');
    if (exportMidiButton) {
      exportMidiButton.addEventListener('click', () => {
        exportService.exportToMidi(false); // Export current sequence
      });
    }
    
    // Track MIDI export button
    const exportTrackMidiButton = document.getElementById('export-track-midi');
    if (exportTrackMidiButton) {
      exportTrackMidiButton.addEventListener('click', () => {
        exportService.exportToMidi(true); // Export full track
      });
    }
    
    // Text export button
    const exportTextButton = document.getElementById('export-text');
    if (exportTextButton) {
      exportTextButton.addEventListener('click', () => {
        exportService.exportToText(false); // Export current sequence
      });
    }
    
    // Track text export button
    const exportTrackTextButton = document.getElementById('export-track-text');
    if (exportTrackTextButton) {
      exportTrackTextButton.addEventListener('click', () => {
        exportService.exportToText(true); // Export full track
      });
    }
  }
  
  /**
   * Set up audio context trigger on first user interaction
   */
  setupAudioContextTrigger() {
    // Start audio context on first user interaction
    const handleFirstInteraction = () => {
      // Resume audio context
      if (window.Tone && window.Tone.context && window.Tone.context.state !== 'running') {
        window.Tone.context.resume().then(() => {
          console.log('Audio context started on user interaction');
        });
      }
      
      // Remove event listeners
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
    
    // Add event listeners
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
  }
  
  /**
   * Duplicate the current block
   */
  duplicateCurrentBlock() {
    const currentIndex = store.getCurrentBlockIndex();
    const trackStructure = store.getTrackStructure();
    
    // Check if current block exists
    if (currentIndex < 0 || currentIndex >= trackStructure.length) {
      console.error('No current block to duplicate');
      return;
    }
    
    // Get current block
    const currentBlock = trackStructure[currentIndex];
    
    // Create a new name for the duplicate
    const newName = this.generateNextBlockName(trackStructure, currentBlock.name);
    
    // Create duplicate block
    const newBlock = {
      id: 'block_' + Date.now(),
      name: newName,
      tonality: currentBlock.tonality,
      chords: [...currentBlock.chords]
    };
    
    // Insert the new block after the current one
    const newStructure = [...trackStructure];
    newStructure.splice(currentIndex + 1, 0, newBlock);
    
    // Update store
    store.setTrackStructure(newStructure);
    
    // Select the new block
    store.setCurrentBlockIndex(currentIndex + 1);
  }
  
  /**
   * Generate name for the next block
   * @param {Array} trackStructure - Current track structure
   * @param {string} baseName - Base name for the new block
   * @returns {string} Generated name
   */
  generateNextBlockName(trackStructure, baseName) {
    // For duplicating blocks - use same letter with incremented number
    const match = baseName.match(/^([A-Z])(\d+)$/);
    if (match) {
      const prefix = match[1];
      const number = parseInt(match[2], 10);
      
      // Find highest number with this prefix
      let maxNumber = number;
      trackStructure.forEach(block => {
        const blockMatch = block.name.match(/^([A-Z])(\d+)$/);
        if (blockMatch && blockMatch[1] === prefix) {
          const blockNumber = parseInt(blockMatch[2], 10);
          if (blockNumber > maxNumber) {
            maxNumber = blockNumber;
          }
        }
      });
      
      // Generate next number
      return prefix + (maxNumber + 1);
    }
    
    // Default to A1 if no proper base name
    return 'A1';
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Create app instance
  window.chordPlayerApp = new ChordPlayerApp();
});

// Export for use in browser console debugging
export default ChordPlayerApp;