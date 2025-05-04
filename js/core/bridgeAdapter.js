/**
 * bridgeAdapter.js
 * Adapter for ensuring backward compatibility between
 * old global architecture and new modular system
 */

import store from './store.js';
import eventBus from './eventBus.js';
import audioService from '../services/audioService.js';
import { chordCollection } from '../models/chord.js';
import { tonalityCollection } from '../models/tonality.js';

/**
 * Initialize bridge adapter and create global proxies
 */
export function initializeBridgeAdapter() {
  console.log('Initializing bridge adapter...');
  
  // Create global proxies for store and services
  createGlobalProxies();
  
  // Create legacy compatibility objects
  createLegacyObjects();
  
  console.log('Bridge adapter initialized');
}

/**
 * Create global proxies for direct access to core modules
 */
export function createGlobalProxies() {
  if (typeof window === 'undefined') return;
  
  // Create proxy for store
  if (!window.store) {
    window.store = store;
  }
  
  // Create proxy for eventBus
  if (!window.eventBus) {
    window.eventBus = eventBus;
  }
  
  // Create proxy for audioService
  if (!window.audioService) {
    window.audioService = audioService;
  }
  
  // Create proxy for chord collection
  if (!window.chordCollection) {
    window.chordCollection = chordCollection;
  }
  
  // Create proxy for tonality collection
  if (!window.tonalityCollection) {
    window.tonalityCollection = tonalityCollection;
  }
  
  console.log('Global proxies created');
}

/**
 * Create legacy compatibility objects for backward compatibility
 */
function createLegacyObjects() {
  // Create old-style UI object if it doesn't exist
  if (!window.UI) {
    window.UI = createUIBridge();
  }
  
  // Create old-style Sequencer object
  if (!window.Sequencer) {
    window.Sequencer = createSequencerBridge();
  }
  
  // Create old-style Instrument object
  if (!window.Instrument) {
    window.Instrument = createInstrumentBridge();
  }
  
  // Create old-style ChordSuggestions object
  if (!window.ChordSuggestions) {
    window.ChordSuggestions = createChordSuggestionsBridge();
  }
  
  // Create old-style Arpeggiator object
  if (!window.Arpeggiator) {
    window.Arpeggiator = createArpeggiatorBridge();
  }
  
  console.log('Legacy objects created');
}

/**
 * Create bridge for UI
 * @returns {Object} UI bridge object
 */
function createUIBridge() {
  return {
    // Getters
    getCurrentChord: () => store.getCurrentChord(),
    getCurrentTonality: () => store.getCurrentTonality(),
    
    // Setters
    setCurrentChord: (chord) => store.setCurrentChord(chord),
    changeTonality: (tonality) => store.setCurrentTonality(tonality),
    
    // Methods for updating UI components
    updateChordInfo: (chordName) => {
      // Publish event for updating chord info
      eventBus.publish('updateChordInfo', { chordName });
    },
    
    // Methods for notifications
    showNotification: (message, type = 'info') => {
      // Publish event for showing notification
      eventBus.publish('showNotification', { message, type });
    },
    
    // Flag for preventing cyclic updates
    setInternalTonalityChange: (value) => {
      // Save flag in store
      store.setState({ internalTonalityChange: value });
    }
  };
}

/**
 * Create bridge for Sequencer
 * @returns {Object} Sequencer bridge object
 */
function createSequencerBridge() {
  return {
    // State flags
    isPlaying: false,
    loopCustomSequence: false,
    
    // Getters
    getSequence: () => store.getSequence(),
    getTempo: () => store.getTempo(),
    getIsPlaying: () => store.getIsPlaying(),
    
    // Sequencer methods
    addChordToSequence: (chord) => store.addChordToSequence(chord),
    addPauseToSequence: () => store.addChordToSequence('PAUSE'),
    playSequence: () => store.setIsPlaying(true),
    stopSequence: () => store.setIsPlaying(false),
    clearSequence: () => store.clearSequence(),
    
    // Methods for playing custom sequence
    playCustomSequence: (sequence, loop = false) => {
      // Save loop flag
      window.Sequencer.loopCustomSequence = loop;
      
      // Play sequence through audio service
      audioService.playSequence(sequence, loop);
    },
    
    // Set sequence
    setSequence: (sequence) => store.setSequence(sequence),
    
    // Initialize sequencer
    initializeSequencer: () => {
      // Subscribe to state changes
      store.subscribe((state, changedProp) => {
        if (changedProp === 'isPlaying') {
          window.Sequencer.isPlaying = state.isPlaying;
        }
      });
      
      // Load saved tempo
      const tempo = store.getTempo();
      const tempoInput = document.getElementById('tempo-input');
      if (tempoInput) {
        tempoInput.value = tempo;
      }
    }
  };
}

/**
 * Create bridge for Instrument
 * @returns {Object} Instrument bridge object
 */
function createInstrumentBridge() {
  return {
    // Reference to instruments
    instruments: null,
    
    // Playback methods
    playChord: (chordName) => audioService.playChord(chordName),
    playChordNotes: (notes) => {
      // If notes is an array of strings, play through audio service
      if (Array.isArray(notes) && notes.every(note => typeof note === 'string')) {
        audioService.instruments.synth.triggerAttackRelease(notes, "2n");
      }
    },
    
    // Metronome methods
    toggleMetronome: (enabled) => store.setMetronomeEnabled(enabled),
    startMetronome: () => {
      if (store.getMetronomeEnabled()) {
        audioService.startMetronome();
      }
    },
    stopMetronome: () => audioService.stopMetronome(),
    
    // Initialize instruments
    createInstruments: () => {
      const instruments = audioService.instruments;
      window.Instrument.instruments = instruments;
      return instruments;
    },
    
    // Get tempo
    getTempo: () => store.getTempo(),
    
    // Stop all sounds
    stopAllSounds: () => audioService.stopAllSounds(),
    
    // Get current instrument
    getCurrentInstrument: () => audioService.instruments.synth
  };
}

/**
 * Create bridge for ChordSuggestions
 * @returns {Object} ChordSuggestions bridge object
 */
function createChordSuggestionsBridge() {
  // Import chordSuggestions module lazily
  let chordSuggestionsModule = null;
  
  const getModule = async () => {
    if (!chordSuggestionsModule) {
      chordSuggestionsModule = await import('../components/chords/chordSuggestions.js');
    }
    return chordSuggestionsModule.default;
  };
  
  return {
    // Initialize
    initChordSuggestions: async () => {
      const module = await getModule();
      console.log('ChordSuggestions initialized through bridge');
    },
    
    // Update suggestions
    updateChordSuggestions: async () => {
      const module = await getModule();
      
      // Use method from new component
      module.updateSuggestions();
      
      // Highlight chord buttons
      module.highlightTargets(['.chord-button']);
    },
    
    // Get suggested chords
    getSuggestedChords: async (lastChordName, tonality) => {
      const module = await getModule();
      return module.getSuggestedChords(lastChordName, tonality);
    },
    
    // Get current suggestions
    getCurrentSuggestions: async () => {
      const module = await getModule();
      return module.getCurrentSuggestions();
    }
  };
}

/**
 * Create bridge for Arpeggiator
 * @returns {Object} Arpeggiator bridge object
 */
function createArpeggiatorBridge() {
  return {
    // Initialize
    initializeArpeggiator: () => {
      // Already initialized in new architecture
      console.log('Arpeggiator initialized through bridge');
    },
    
    // Play arpeggio
    playArpeggio: (chordName) => {
      // Enable arpeggiator
      store.setArpeggiatorEnabled(true);
      
      // Play chord (with arpeggiator enabled)
      audioService.playChord(chordName);
    },
    
    // Stop arpeggio
    stopArpeggio: () => audioService.stopArpeggio(),
    
    // Save/load settings
    saveArpeggiatorSettings: (settings) => audioService.saveArpeggiatorSettings(settings),
    loadArpeggiatorSettings: () => audioService.getArpeggiatorSettings(),
    
    // Enable/disable
    setEnabled: (enabled) => store.setArpeggiatorEnabled(enabled),
    
    // Get settings
    getSettings: () => audioService.getArpeggiatorSettings()
  };
}