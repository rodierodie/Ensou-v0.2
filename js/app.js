/**
 * app.js
 * Main entry point for the ChordPlayer application
 */

import store from './core/store.js';
import eventBus from './core/eventBus.js';
import { tonalityCollection } from './models/tonality.js';
import { chordCollection } from './models/chord.js';
import { TrackStructure } from './models/sequence.js';
import initializeDataModels from './models/initializeData.js';

// Import services
import audioService from './services/audioService.js';
import storageService from './services/storageService.js';
import exportService from './services/exportService.js';
import trackStructureService from './models/trackStructure.js';

// Import UI components
import TonalitySelector from './components/tonality/tonalitySelector.js';
import TonalityCircle from './components/tonality/tonalityCircle.js';
import ChordSelector from './components/chords/chordSelector.js';
import ChordInfo from './components/chords/chordInfo.js';
import SequenceComponent from './components/sequencer/sequenceComponent.js';
import BlockSelector from './components/sequencer/blockSelector.js';

/**
 * Main Application class
 * Controls the initialization and lifecycle of the application
 */
class ChordPlayerApp {
  constructor() {
    // Components registry
    this.components = {};
    
    // Flags
    this.audioInitialized = false;
    this.dataInitialized = false;
    this.componentsInitialized = false;
    
    // Initialize the application
    this.init();
  }
  
  /**
   * Initialize the application
   * This is the main entry point
   */
  async init() {
    try {
      console.log('Initializing ChordPlayer application...');
      
      // Initialize data models first
      await this.initializeData();
      
      // Initialize audio engine
      // Don't wait for this to complete as it needs user interaction
      this.initializeAudio();
      
      // Initialize UI components
      this.initializeComponents();
      
      // Set up global event listeners
      this.setupEventListeners();
      
      // Load saved data from localStorage
      this.loadSavedData();
      
      console.log('ChordPlayer application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.handleInitializationError(error);
    }
  }
  
  /**
   * Initialize data models
   * Converts legacy global data to new data models
   */
  async initializeData() {
    console.log('Initializing data models...');
    
    try {
      // Initialize data models from legacy global data
      initializeDataModels();
      
      // Verify initialization
      if (tonalityCollection.getAllTonalities().length === 0) {
        throw new Error('Failed to initialize tonalities');
      }
      
      if (chordCollection.getAllChords().length === 0) {
        throw new Error('Failed to initialize chords');
      }
      
      this.dataInitialized = true;
      console.log('Data models initialized successfully');
      
      // Publish event for other components
      eventBus.publish('dataInitialized', {
        tonalityCount: tonalityCollection.getAllTonalities().length,
        chordCount: chordCollection.getAllChords().length
      });
      
      return true;
    } catch (error) {
      console.error('Data initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize audio engine
   * Sets up Tone.js and audio components
   */
  async initializeAudio() {
    console.log('Initializing audio engine...');
    
    try {
      // Initialize audioService
      // Note: This won't start the audio context yet
      await audioService.initialize();
      
      // Set up audio context starter for user interaction
      this.setupAudioContextStarter();
      
      console.log('Audio engine initialized (context will start on user interaction)');
      return true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      // Don't throw - app can still work without audio
      return false;
    }
  }
  
  /**
   * Set up audio context starter
   * This will start the audio context on first user interaction
   */
  setupAudioContextStarter() {
    const startAudio = async () => {
      if (this.audioInitialized) return;
      
      try {
        // Start Tone.js audio context
        await Tone.start();
        console.log('Audio context started successfully');
        
        // Mark as initialized
        this.audioInitialized = true;
        
        // Publish event
        eventBus.publish('audioInitialized', {
          timestamp: Date.now()
        });
        
        // Remove event listeners
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
        document.removeEventListener('touchstart', startAudio);
      } catch (error) {
        console.error('Failed to start audio context:', error);
      }
    };
    
    // Add event listeners for common user interactions
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
    document.addEventListener('touchstart', startAudio);
    
    console.log('Audio context starter set up');
  }
  
  /**
   * Initialize UI components
   * Creates and mounts all UI components
   */
  initializeComponents() {
    console.log('Initializing UI components...');
    
    try {
      // Initialize components in correct order to avoid dependency issues
      
      // 1. Tonality components
      this.initializeTonalityComponents();
      
      // 2. Chord components
      this.initializeChordComponents();
      
      // 3. Sequence components
      this.initializeSequenceComponents();
      
      // 4. Control components
      this.initializeControlComponents();
      
      this.componentsInitialized = true;
      console.log('UI components initialized successfully');
      
      // Publish event
      eventBus.publish('componentsInitialized', {
        componentCount: Object.keys(this.components).length
      });
      
      return true;
    } catch (error) {
      console.error('Component initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize tonality components
   */
  initializeTonalityComponents() {
    // Get container elements
    const tonalitySelectorContainer = document.getElementById('tonality-selector-container');
    const tonalityCircleContainer = document.getElementById('tonality-circle-container');
    
    if (!tonalitySelectorContainer) {
      console.warn('Tonality selector container not found');
    } else {
      // Create tonality selector
      this.components.tonalitySelector = new TonalitySelector(tonalitySelectorContainer, {
        onChange: (note, type) => {
          // Update store
          const tonalityCode = type === 'minor' ? `${note}m` : note;
          store.setCurrentTonality(tonalityCode);
          
          // Update tonality circle if available
          if (this.components.tonalityCircle) {
            this.components.tonalityCircle.updateSelectedTonality(note, type);
          }
        }
      });
    }
    
    if (!tonalityCircleContainer) {
      console.warn('Tonality circle container not found');
    } else {
      // Create tonality circle
      this.components.tonalityCircle = new TonalityCircle(tonalityCircleContainer, {
        onSelect: (note, type) => {
          // Update store
          const tonalityCode = type === 'minor' ? `${note}m` : note;
          store.setCurrentTonality(tonalityCode);
          
          // Update tonality selector if available
          if (this.components.tonalitySelector) {
            this.components.tonalitySelector.updateSelectedTonality(tonalityCode);
          }
        }
      });
      
      // Set up circle toggle button
      const toggleCircleBtn = document.getElementById('toggle-circle');
      if (toggleCircleBtn) {
        toggleCircleBtn.addEventListener('click', this.toggleTonalityCircle.bind(this));
      }
    }
  }
  
  /**
   * Initialize chord components
   */
  initializeChordComponents() {
    // Get container elements
    const basicChordsContainer = document.getElementById('basic-chords');
    const seventhChordsContainer = document.getElementById('seventh-chords');
    const chordInfoContainer = document.getElementById('chord-info-section');
    
    if (!basicChordsContainer || !seventhChordsContainer) {
      console.warn('Chord grid containers not found');
    } else {
      // Create chord selector
      this.components.chordSelector = new ChordSelector(
        basicChordsContainer,
        seventhChordsContainer,
        {
          onChordSelect: (chordName) => {
            // Update current chord in store
            store.setCurrentChord(chordName);
            
            // Play the chord
            audioService.playChord(chordName);
          }
        }
      );
    }
    
    if (!chordInfoContainer) {
      console.warn('Chord info container not found');
    } else {
      // Create chord info component
      this.components.chordInfo = new ChordInfo(chordInfoContainer, {
        onAddChord: () => {
          const currentChord = store.getCurrentChord();
          if (currentChord) {
            store.addChordToSequence(currentChord);
            
            // Save sequence to current block
            trackStructureService.saveSequenceToBlock();
          }
        }
      });
    }
  }
  
  /**
   * Initialize sequence components
   */
  initializeSequenceComponents() {
    // Get container elements
    const sequenceContainer = document.getElementById('sequence-container');
    const blockTabsContainer = document.getElementById('block-tabs-container');
    
    if (!sequenceContainer) {
      console.warn('Sequence container not found');
    } else {
      // Create sequence component
      this.components.sequenceComponent = new SequenceComponent(sequenceContainer, {
        onChordClick: (chordName) => {
          // Update current chord
          store.setCurrentChord(chordName);
          
          // Play the chord
          audioService.playChord(chordName);
        },
        onChordRemove: (index) => {
          // Remove chord from sequence
          store.removeChordFromSequence(index);
          
          // Save sequence to current block
          trackStructureService.saveSequenceToBlock();
        }
      });
    }
    
    if (!blockTabsContainer) {
      console.warn('Block tabs container not found');
    } else {
      // Create block selector
      this.components.blockSelector = new BlockSelector(blockTabsContainer, {
        onBlockSelect: (index) => {
          // Load sequence from block
          trackStructureService.loadBlockSequence(index);
        },
        onBlockAdd: () => {
          // Add new block and use current tonality
          trackStructureService.addNewBlock();
        }
      });
      
      // Set up duplicate block button
      const duplicateBlockBtn = document.querySelector('.duplicate-block');
      if (duplicateBlockBtn) {
        duplicateBlockBtn.addEventListener('click', this.handleDuplicateBlock.bind(this));
      }
    }
  }
  
  /**
   * Initialize control components
   */
  initializeControlComponents() {
    // Set up playback controls
    this.setupPlaybackControls();
    
    // Set up sequence controls
    this.setupSequenceControls();
    
    // Set up export buttons
    this.setupExportButtons();
  }
  
  /**
   * Set up playback controls
   */
  setupPlaybackControls() {
    // Play button
    const playButton = document.getElementById('play-button');
    if (playButton) {
      playButton.addEventListener('click', () => {
        store.setIsPlaying(true);
      });
    }
    
    // Stop button
    const stopButton = document.getElementById('stop-button');
    if (stopButton) {
      stopButton.addEventListener('click', () => {
        store.setIsPlaying(false);
      });
    }
    
    // Tempo input
    const tempoInput = document.getElementById('tempo-input');
    if (tempoInput) {
      // Set initial value from store
      tempoInput.value = store.getTempo();
      
      // Add change handler
      tempoInput.addEventListener('change', () => {
        const tempo = parseInt(tempoInput.value, 10);
        // Validate range
        if (!isNaN(tempo) && tempo >= 40 && tempo <= 240) {
          store.setTempo(tempo);
        } else {
          // Reset to store value if invalid
          tempoInput.value = store.getTempo();
        }
      });
    }
    
    // Arpeggiator toggle
    const arpToggle = document.getElementById('arp-toggle');
    if (arpToggle) {
      // Set initial state
      arpToggle.textContent = store.getArpeggiatorEnabled() ? 'On' : 'Off';
      
      // Add click handler
      arpToggle.addEventListener('click', () => {
        const currentState = store.getArpeggiatorEnabled();
        const newState = !currentState;
        
        // Update store
        store.setArpeggiatorEnabled(newState);
        
        // Update button text
        arpToggle.textContent = newState ? 'On' : 'Off';
      });
    }
    
    // Metronome checkbox
    const metronomeCheckbox = document.getElementById('metronome-checkbox');
    if (metronomeCheckbox) {
      // Set initial state
      metronomeCheckbox.checked = store.getMetronomeEnabled();
      
      // Add change handler
      metronomeCheckbox.addEventListener('change', () => {
        store.setMetronomeEnabled(metronomeCheckbox.checked);
      });
    }
  }
  
  /**
   * Set up sequence controls
   */
  setupSequenceControls() {
    // Add chord button
    const addChordButton = document.getElementById('add-chord');
    if (addChordButton) {
      addChordButton.addEventListener('click', () => {
        const currentChord = store.getCurrentChord();
        if (currentChord) {
          store.addChordToSequence(currentChord);
          
          // Save sequence to current block
          trackStructureService.saveSequenceToBlock();
        }
      });
    }
    
    // Add pause button
    const addPauseButton = document.getElementById('add-pause');
    if (addPauseButton) {
      addPauseButton.addEventListener('click', () => {
        store.addChordToSequence('PAUSE');
        
        // Save sequence to current block
        trackStructureService.saveSequenceToBlock();
      });
    }
    
    // Clear sequence button
    const clearSequenceButton = document.getElementById('clear-sequence');
    if (clearSequenceButton) {
      clearSequenceButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the current sequence?')) {
          store.clearSequence();
          
          // Save empty sequence to current block
          trackStructureService.saveSequenceToBlock();
        }
      });
    }
  }
  
  /**
   * Set up export buttons
   */
  setupExportButtons() {
    // MIDI export (current sequence)
    const exportMidiButton = document.getElementById('export-midi');
    if (exportMidiButton) {
      exportMidiButton.addEventListener('click', () => {
        exportService.exportToMidi(false); // false = current sequence only
      });
    }
    
    // Text export (current sequence)
    const exportTextButton = document.getElementById('export-text');
    if (exportTextButton) {
      exportTextButton.addEventListener('click', () => {
        exportService.exportToText(false); // false = current sequence only
      });
    }
    
    // MIDI export (full track)
    const exportTrackMidiButton = document.getElementById('export-track-midi');
    if (exportTrackMidiButton) {
      exportTrackMidiButton.addEventListener('click', () => {
        exportService.exportToMidi(true); // true = full track
      });
    }
    
    // Text export (full track)
    const exportTrackTextButton = document.getElementById('export-track-text');
    if (exportTrackTextButton) {
      exportTrackTextButton.addEventListener('click', () => {
        exportService.exportToText(true); // true = full track
      });
    }
    
    // Project export
    const exportDataButton = document.getElementById('export-data');
    if (exportDataButton) {
      exportDataButton.addEventListener('click', () => {
        storageService.exportProjectToFile();
      });
    }
    
    // Project import
    const importDataInput = document.getElementById('import-data');
    if (importDataInput) {
      importDataInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          storageService.importProjectFromFile(file)
            .then(() => {
              alert('Project imported successfully');
            })
            .catch(error => {
              console.error('Import failed:', error);
              alert('Failed to import project: ' + error.message);
            });
        }
      });
    }
  }
  
  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Listen for store changes
    store.subscribe(this.handleStoreChanges.bind(this));
    
    // Listen for audio events
    eventBus.subscribe('chordPlaying', this.handleChordPlaying.bind(this));
    eventBus.subscribe('sequencePlayingStarted', this.handleSequencePlayingStarted.bind(this));
    eventBus.subscribe('sequencePlayingStopped', this.handleSequencePlayingStopped.bind(this));
    
    // Document-level event listeners
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Window beforeunload (save data)
    window.addEventListener('beforeunload', () => {
      storageService.saveData();
    });
  }
  
  /**
   * Load saved data from localStorage
   */
  loadSavedData() {
    // Load data from storage service
    storageService.loadData();
    
    // If no block exists, create one
    if (store.getTrackStructure().length === 0) {
      trackStructureService.addNewBlock();
    }
  }
  
  /**
   * Handle store changes
   * @param {Object} state - Store state
   * @param {string} changedProp - Property that changed
   */
  handleStoreChanges(state, changedProp) {
    // Handle specific state changes
    switch(changedProp) {
      case 'isPlaying':
        this.updatePlaybackButtons(state.isPlaying);
        break;
        
      case 'arpeggiatorEnabled':
        this.updateArpeggiatorToggle(state.arpeggiatorEnabled);
        break;
        
      case 'metronomeEnabled':
        this.updateMetronomeCheckbox(state.metronomeEnabled);
        break;
        
      case 'tempo':
        this.updateTempoInput(state.tempo);
        break;
    }
  }
  
  /**
   * Handle chord playing event
   * @param {Object} data - Event data
   */
  handleChordPlaying(data) {
    // Update current playing index in sequence component
    if (this.components.sequenceComponent) {
      this.components.sequenceComponent.updatePlayingIndex(data.index);
    }
  }
  
  /**
   * Handle sequence playing started event
   * @param {Object} data - Event data
   */
  handleSequencePlayingStarted(data) {
    // Update UI to show playback state
    this.updatePlaybackButtons(true);
  }
  
  /**
   * Handle sequence playing stopped event
   */
  handleSequencePlayingStopped() {
    // Update UI to show stopped state
    this.updatePlaybackButtons(false);
    
    // Reset current playing index in sequence component
    if (this.components.sequenceComponent) {
      this.components.sequenceComponent.updatePlayingIndex(-1);
    }
  }
  
  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    // Only if no input elements are focused
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' || 
        document.activeElement.tagName === 'SELECT') {
      return;
    }
    
    // Space - play/stop
    if (event.code === 'Space') {
      event.preventDefault();
      store.setIsPlaying(!store.getIsPlaying());
    }
    
    // Escape - stop
    if (event.code === 'Escape') {
      store.setIsPlaying(false);
    }
  }
  
  /**
   * Handle duplicate block button click
   */
  handleDuplicateBlock() {
    const currentIndex = store.getCurrentBlockIndex();
    trackStructureService.duplicateBlock(currentIndex);
  }
  
  /**
   * Toggle visibility of tonality circle
   */
  toggleTonalityCircle() {
    const circleContainer = document.getElementById('tonality-circle-container');
    const toggleButton = document.getElementById('toggle-circle');
    
    if (circleContainer && toggleButton) {
      const isVisible = circleContainer.style.display !== 'none';
      
      // Toggle visibility
      circleContainer.style.display = isVisible ? 'none' : 'block';
      toggleButton.textContent = isVisible ? 'Show Circle of Fifths' : 'Hide Circle of Fifths';
    }
  }
  
  /**
   * Update playback buttons state
   * @param {boolean} isPlaying - Is sequence playing
   */
  updatePlaybackButtons(isPlaying) {
    const playButton = document.getElementById('play-button');
    const stopButton = document.getElementById('stop-button');
    
    if (playButton && stopButton) {
      playButton.disabled = isPlaying;
      stopButton.disabled = !isPlaying;
    }
  }
  
  /**
   * Update arpeggiator toggle button
   * @param {boolean} enabled - Is arpeggiator enabled
   */
  updateArpeggiatorToggle(enabled) {
    const arpToggle = document.getElementById('arp-toggle');
    if (arpToggle) {
      arpToggle.textContent = enabled ? 'On' : 'Off';
    }
  }
  
  /**
   * Update metronome checkbox
   * @param {boolean} enabled - Is metronome enabled
   */
  updateMetronomeCheckbox(enabled) {
    const metronomeCheckbox = document.getElementById('metronome-checkbox');
    if (metronomeCheckbox) {
      metronomeCheckbox.checked = enabled;
    }
  }
  
  /**
   * Update tempo input
   * @param {number} tempo - Tempo value
   */
  updateTempoInput(tempo) {
    const tempoInput = document.getElementById('tempo-input');
    if (tempoInput && tempoInput.value !== tempo.toString()) {
      tempoInput.value = tempo;
    }
  }
  
  /**
   * Handle initialization error
   * @param {Error} error - Error object
   */
  handleInitializationError(error) {
    console.error('Initialization error:', error);
    
    // Show error message to user
    const container = document.querySelector('.container');
    if (container) {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.innerHTML = `
        <h2>Initialization Error</h2>
        <p>Failed to initialize the application: ${error.message}</p>
        <p>Please try refreshing the page. If the problem persists, check the console for more details.</p>
      `;
      
      container.innerHTML = '';
      container.appendChild(errorMessage);
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Create app instance
  window.chordPlayerApp = new ChordPlayerApp();
});

// Export for debugging
export default ChordPlayerApp;