/**
 * appInitializer.js
 * Modernized utility for application initialization
 */

import store from './store.js';
import eventBus from './eventBus.js';
import audioService from '../services/audioService.js';
import storageService from '../services/storageService.js';
import exportService from '../services/exportService.js';
import initializeDataModels, { createGlobalProxies } from '../models/initializeData.js';

// Import modernized components
import AudioPlayer from '../components/audio/audioPlayer.js';
import MetronomeControl from '../components/audio/metronomeControl.js';
import TonalitySelector from '../components/tonality/tonalitySelector.js';
import TonalityCircle from '../components/tonality/tonalityCircle.js';
import ModernChordSelector from '../components/chords/modernChordSelector.js';
import ModernChordInfo from '../components/chords/modernChordInfo.js';
import ModernSequencer from '../components/sequencer/modernSequencer.js';
import TrackStructureManager from '../components/track/trackStructureManager.js';
import Arpeggiator from '../components/arpeggiator/arpeggiator.js';

class AppInitializer {
  /**
   * Initialize application
   * @returns {Promise} Promise resolving when initialization completes
   */
  static async initialize() {
    try {
      console.log('Starting application initialization...');
      
      // Initialize data models first
      await this.initializeDataModels();
      
      // Create global proxies for backward compatibility if needed
      // Comment this out once full migration is complete
      createGlobalProxies();
      
      // Initialize audio service
      await audioService.initialize();
      
      // Load saved data
      storageService.loadData();
      
      // Create UI components
      this.createComponents();
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('Application successfully initialized');
      
      // Publish initialization complete event
      eventBus.publish('appInitialized', {
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error initializing application:', error);
      this.showErrorNotification('Error initializing application. Please try reloading the page.');
      return false;
    }
  }
  
  /**
   * Initialize data models
   * @returns {Promise} Promise resolving when data models are initialized
   */
  static async initializeDataModels() {
    try {
      // Initialize data models
      await initializeDataModels();
      return true;
    } catch (error) {
      console.error('Error initializing data models:', error);
      throw error;
    }
  }
  
  /**
   * Create and initialize UI components
   */
  static createComponents() {
    // Audio components
    const audioControlsContainer = document.getElementById('audio-controls');
    if (audioControlsContainer) {
      new AudioPlayer(audioControlsContainer);
    }
    
    const metronomeContainer = document.querySelector('.metronome-toggle');
    if (metronomeContainer) {
      new MetronomeControl(metronomeContainer);
    }
    
    // Tonality components
    const tonalitySelectorContainer = document.getElementById('tonality-selector-container');
    if (tonalitySelectorContainer) {
      new TonalitySelector(tonalitySelectorContainer);
    }
    
    const tonalityCircleContainer = document.getElementById('tonality-circle-container');
    if (tonalityCircleContainer) {
      new TonalityCircle(tonalityCircleContainer);
    }
    
    // Chord components
    const basicChordsContainer = document.getElementById('basic-chords');
    const seventhChordsContainer = document.getElementById('seventh-chords');
    if (basicChordsContainer && seventhChordsContainer) {
      new ModernChordSelector(basicChordsContainer, seventhChordsContainer);
    }
    
    const chordInfoContainer = document.getElementById('chord-info-section');
    if (chordInfoContainer) {
      new ModernChordInfo(chordInfoContainer);
    }
    
    // Arpeggiator component
    const arpeggiatorContainer = document.querySelector('.arpeggiator-toggle');
    if (arpeggiatorContainer) {
      new Arpeggiator(arpeggiatorContainer);
    }
    
    // Sequencer components
    const sequenceControlsContainer = document.querySelector('.sequence-controls');
    const sequenceContainer = document.getElementById('sequence-container');
    if (sequenceControlsContainer && sequenceContainer) {
      new ModernSequencer(sequenceControlsContainer, sequenceContainer);
    }
    
    // Track structure components
    const blockTabsContainer = document.getElementById('block-tabs-container');
    if (blockTabsContainer) {
      new TrackStructureManager(blockTabsContainer);
    }
    
    // Set up export buttons
    this.setupExportButtons();
  }
  
  /**
   * Set up export buttons
   */
  static setupExportButtons() {
    // MIDI export (current sequence)
    const exportMidiButton = document.getElementById('export-midi');
    if (exportMidiButton) {
      exportMidiButton.addEventListener('click', () => {
        exportService.exportToMidi(false);
      });
    }
    
    // Text export (current sequence)
    const exportTextButton = document.getElementById('export-text');
    if (exportTextButton) {
      exportTextButton.addEventListener('click', () => {
        exportService.exportToText(false);
      });
    }
    
    // MIDI export (full track)
    const exportTrackMidiButton = document.getElementById('export-track-midi');
    if (exportTrackMidiButton) {
      exportTrackMidiButton.addEventListener('click', () => {
        exportService.exportToMidi(true);
      });
    }
    
    // Text export (full track)
    const exportTrackTextButton = document.getElementById('export-track-text');
    if (exportTrackTextButton) {
      exportTrackTextButton.addEventListener('click', () => {
        exportService.exportToText(true);
      });
    }
    
    // Export project
    const exportProjectButton = document.getElementById('export-data');
    if (exportProjectButton) {
      exportProjectButton.addEventListener('click', () => {
        storageService.exportProjectToFile();
      });
    }
    
    // Import project
    const importProjectInput = document.getElementById('import-data');
    if (importProjectInput) {
      importProjectInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          storageService.importProjectFromFile(file)
            .then(() => this.showNotification('Project successfully imported', 'success'))
            .catch(error => this.showNotification('Error importing project: ' + error.message, 'error'));
        }
      });
    }
  }
  
  /**
   * Set up global event listeners
   */
  static setupEventListeners() {
    // Save data before page unload
    window.addEventListener('beforeunload', () => {
      storageService.saveData();
    });
    
    // Handle key presses
    document.addEventListener('keydown', (event) => {
      // Skip if focus is in input fields
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA' || 
          document.activeElement.tagName === 'SELECT') {
        return;
      }
      
      // Space - toggle play/stop
      if (event.code === 'Space') {
        event.preventDefault();
        store.setIsPlaying(!store.getIsPlaying());
      }
      
      // Escape - stop playback
      if (event.code === 'Escape') {
        store.setIsPlaying(false);
      }
    });
    
    // Start audio context on first interaction
    const startAudio = async () => {
      try {
        await audioService.startAudioContext();
        // Remove listeners after successful start
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
        document.removeEventListener('touchstart', startAudio);
      } catch (error) {
        console.error('Error starting audio context:', error);
      }
    };
    
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
    document.addEventListener('touchstart', startAudio);
    
    // Circle visibility toggle
    const toggleCircleButton = document.getElementById('toggle-circle');
    if (toggleCircleButton) {
      toggleCircleButton.addEventListener('click', () => {
        const circleContainer = document.getElementById('tonality-circle-container');
        if (circleContainer) {
          const isVisible = circleContainer.style.display !== 'none';
          circleContainer.style.display = isVisible ? 'none' : 'block';
          toggleCircleButton.textContent = isVisible ? 'Show Tonality Circle' : 'Hide Tonality Circle';
        }
      });
    }
  }
  
  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, success, warning, error)
   */
  static showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Start show animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      
      // Remove element after animation completes
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  /**
   * Show error notification
   * @param {string} message - Error message
   */
  static showErrorNotification(message) {
    this.showNotification(message, 'error');
  }
}