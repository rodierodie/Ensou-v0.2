/**
 * audioService.js - Fixed version
 * Central service for audio generation and playback
 */

import store from '../core/store.js';
import eventBus from '../core/eventBus.js';

class AudioService {
  constructor() {
    // Main instruments
    this.instruments = {
      synth: null,
      metronomeSynth: null,
      weakBeatSynth: null
    };
    
    // Sequencer state
    this.sequencer = {
      isPlaying: false,
      currentIndex: -1,
      intervalId: null,
      customSequence: null,
      loopCustomSequence: false
    };
    
    // Metronome state
    this.metronome = {
      isPlaying: false,
      intervalId: null,
      count: 0
    };
    
    // Arpeggiator state
    this.arpeggiator = {
      sequence: null,
      isPlaying: false,
      settings: this.loadArpeggiatorSettings()
    };
    
    // Flag to track initialization
    this.initialized = false;
    
    // Subscribe to relevant store changes
    store.subscribe(this.handleStoreChanges.bind(this), 
      ['isPlaying', 'arpeggiatorEnabled', 'metronomeEnabled', 'tempo']);
  }
  
  /**
   * Initialize audio engine and instruments
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  async initialize() {
    // Check if already initialized
    if (this.initialized) {
      return Promise.resolve(true);
    }
    
    console.log('Initializing audio service...');
    
    // Check if Tone.js is available
    if (typeof Tone === 'undefined') {
      console.error('Tone.js is not loaded');
      return Promise.reject(new Error('Tone.js is not loaded'));
    }
    
    try {
      // Create instruments
      this.createInstruments();
      
      // Mark as initialized
      this.initialized = true;
      console.log('Audio service initialized');
      
      // Publish event
      eventBus.publish('audioInitialized', {
        timestamp: Date.now()
      });
      
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error initializing audio service:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Create audio instruments
   */
  createInstruments() {
    try {
      // Create main polyphonic synth for chords
      this.instruments.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "triangle"
        },
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 1
        }
      }).toDestination();
      
      // Create synth for metronome's strong beat
      this.instruments.metronomeSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.001,
          decay: 0.2,
          sustain: 0.01,
          release: 0.5,
        }
      }).toDestination();
      this.instruments.metronomeSynth.volume.value = -10; // Lower volume
      
      // Create synth for metronome's weak beat
      this.instruments.weakBeatSynth = new Tone.MetalSynth({
        frequency: 200,
        envelope: {
          attack: 0.001,
          decay: 0.1,
          release: 0.1
        },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).toDestination();
      this.instruments.weakBeatSynth.volume.value = -20; // Even lower volume
      
      console.log('Audio instruments created');
    } catch (error) {
      console.error('Error creating instruments:', error);
      throw error;
    }
  }
  
  /**
   * Start audio context (must be called after user interaction)
   * @returns {Promise} Promise that resolves when audio context is started
   */
  async startAudioContext() {
    try {
      await Tone.start();
      console.log('Audio context started');
      
      // Publish event
      eventBus.publish('audioContextStarted', {
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to start audio context:', error);
      return false;
    }
  }
  
  /**
   * Play a chord
   * @param {string} chordName - Name of the chord to play
   */
  playChord(chordName) {
    // Try to initialize if not already initialized
    if (!this.initialized) {
      console.warn('AudioService not initialized, attempting to initialize...');
      this.initialize()
        .then(() => this.startAudioContext())
        .then(() => this.playChordImplementation(chordName))
        .catch(error => console.error('Failed to initialize audio for playback:', error));
      return;
    }
    
    // If initialized but audio context not started, try to start it
    if (Tone.context.state !== 'running') {
      this.startAudioContext()
        .then(() => this.playChordImplementation(chordName))
        .catch(error => console.error('Failed to start audio context for playback:', error));
      return;
    }
    
    // If everything is ready, play the chord
    this.playChordImplementation(chordName);
  }
  
  /**
   * Internal implementation of chord playback
   * @param {string} chordName - Name of the chord to play
   */
  playChordImplementation(chordName) {
    // Skip if chord name is null or not a string
    if (!chordName || typeof chordName !== 'string') {
      console.warn('Invalid chord name:', chordName);
      return;
    }
    
    // Stop any current playback
    this.stopAllSounds();
    
    // Check if arpeggiator is enabled
    const arpeggiatorEnabled = store.getArpeggiatorEnabled();
    
    if (arpeggiatorEnabled) {
      this.playArpeggio(chordName);
    } else {
      this.playChordNormal(chordName);
    }
  }
  
  /**
   * Play a chord normally (all notes at once)
   * @param {string} chordName - Name of the chord to play
   */
  playChordNormal(chordName) {
    // Get chord data
    const chord = this.getChordData(chordName);
    
    if (!chord) {
      console.error(`Chord data not found for: ${chordName}`);
      return;
    }
    
    // Check for valid notes
    const notes = chord.notes;
    if (!notes || notes.length === 0) {
      console.error(`No notes found for chord: ${chordName}`);
      return;
    }
    
    // Play the chord
    this.instruments.synth.triggerAttackRelease(notes, "2n");
  }
  
  /**
   * Play a chord as an arpeggio
   * @param {string} chordName - Name of the chord to play
   */
  playArpeggio(chordName) {
    // Get chord data
    const chord = this.getChordData(chordName);
    
    if (!chord) {
      console.error(`Chord data not found for: ${chordName}`);
      return;
    }
    
    // Check for valid notes
    const notes = chord.notes;
    if (!notes || notes.length === 0) {
      console.error(`No notes found for chord: ${chordName}`);
      return;
    }
    
    // Get arpeggiator settings
    const settings = this.arpeggiator.settings;
    
    // Generate arpeggio notes based on settings
    const arpNotes = this.generateArpeggioNotes(
      notes, 
      settings.pattern || 'up', 
      settings.octaveRange || 1,
      settings.octaveOffset || 0
    );
    
    // Stop any existing arpeggio
    this.stopArpeggio();
    
    // Mark arpeggiator as playing
    this.arpeggiator.isPlaying = true;
    
    // Get tempo from store
    const tempo = store.getTempo();
    Tone.Transport.bpm.value = tempo;
    
    // Create arpeggio sequence
    this.arpeggiator.sequence = new Tone.Sequence(
      (time, note) => {
        // Determine velocity (volume) for the note
        let velocity = settings.velocity || 0.7;
        
        // Accent first note if enabled
        if (settings.accentFirst && note === arpNotes[0]) {
          velocity = Math.min(1, velocity * 1.3);
        }
        
        // Play the note
        this.instruments.synth.triggerAttackRelease(
          note, 
          settings.noteLength || '8n', 
          time, 
          velocity
        );
      },
      arpNotes,
      settings.noteLength || '8n'
    ).start(0);
    
    // Start Tone transport if not already running
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
  }
  
  /**
   * Generate notes for arpeggio
   * @param {Array} baseNotes - Base notes of the chord
   * @param {string} pattern - Arpeggio pattern ('up', 'down', 'updown', 'random')
   * @param {number} octaveRange - Number of octaves to span
   * @param {number} octaveOffset - Octave offset (-2 to +1)
   * @returns {Array} Array of notes for arpeggio
   */
  generateArpeggioNotes(baseNotes, pattern, octaveRange, octaveOffset) {
    try {
      // Default values if parameters are invalid
      pattern = pattern || 'up';
      octaveRange = octaveRange || 1;
      octaveOffset = octaveOffset || 0;
      
      // Process base notes to extract note names and octaves
      const notes = baseNotes.map(note => {
        // Extract note name and octave from the note
        const match = note.match(/([A-G][#b]?)(\d+)/);
        if (!match) return { noteName: note, octave: 4 };
        
        const noteName = match[1];
        const octave = parseInt(match[2]) + octaveOffset;
        
        return { 
          noteName, 
          octave: Math.max(0, Math.min(8, octave)) 
        };
      });
      
      // Standard note order for sorting
      const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      
      // Sort notes by pitch
      notes.sort((a, b) => {
        const aIndex = noteOrder.indexOf(a.noteName);
        const bIndex = noteOrder.indexOf(b.noteName);
        if (aIndex === bIndex) {
          return a.octave - b.octave;
        }
        return aIndex - bIndex;
      });
      
      // Generate result array based on pattern
      const result = [];
      
      // Simple implementation for 'up' pattern
      for (let octave = 0; octave < octaveRange; octave++) {
        notes.forEach(note => {
          result.push(`${note.noteName}${note.octave + octave}`);
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error generating arpeggio notes:', error);
      // Return simple pattern if error occurs
      return baseNotes;
    }
  }
  
  /**
   * Stop arpeggiator playback
   */
  stopArpeggio() {
    if (this.arpeggiator.sequence) {
      this.arpeggiator.sequence.stop();
      this.arpeggiator.sequence.dispose();
      this.arpeggiator.sequence = null;
    }
    
    this.arpeggiator.isPlaying = false;
  }
  
  /**
   * Stop all sounds
   * @param {boolean} stopSequencer - Whether to stop sequencer (default: true)
   */
  stopAllSounds(stopSequencer = true) {
    // Release all notes in the synth
    if (this.instruments.synth) {
      this.instruments.synth.releaseAll();
    }
    
    // Stop arpeggiator
    this.stopArpeggio();
    
    // Stop sequencer if requested
    if (stopSequencer) {
      // Only clear the interval, don't update the store
      if (this.sequencer.intervalId) {
        clearInterval(this.sequencer.intervalId);
        this.sequencer.intervalId = null;
      }
    }
    
    // Cancel scheduled events in Tone.js
    if (Tone.Transport) {
      Tone.Transport.cancel();
    }
  }
  
  /**
   * Get chord data from local model or global data
   * @param {string} chordName - Name of the chord
   * @returns {Object|null} Chord data or null if not found
   */
  getChordData(chordName) {
    // Try to get from global data first (legacy)
    // This ensures compatibility with older code
    if (window.CHORD_DATA && window.CHORD_DATA[chordName]) {
      return window.CHORD_DATA[chordName];
    }
    
    // If we have a chord collection, try that
    if (window.chordCollection && 
        typeof window.chordCollection.getChord === 'function') {
      const chord = window.chordCollection.getChord(chordName);
      if (chord) return chord;
    }
    
    // Try to import chord collection if available
    try {
      const { chordCollection } = require('../models/chord.js');
      if (chordCollection) {
        const chord = chordCollection.getChord(chordName);
        if (chord) return chord;
      }
    } catch (error) {
      // Ignore import errors
    }
    
    return null;
  }
  
  /**
   * Load arpeggiator settings from localStorage
   * @returns {Object} Arpeggiator settings
   */
  loadArpeggiatorSettings() {
    // Default settings
    const defaultSettings = {
      enabled: false,
      pattern: 'up',
      octaveRange: 1,
      octaveOffset: 0,
      noteLength: '8n',
      velocity: 0.7,
      accentFirst: true
    };
    
    try {
      const savedSettings = localStorage.getItem('arpeggiatorSettings');
      if (savedSettings) {
        return { ...defaultSettings, ...JSON.parse(savedSettings) };
      }
    } catch (e) {
      console.warn('Error loading arpeggiator settings:', e);
    }
    
    return defaultSettings;
  }
  
  /**
   * Save arpeggiator settings to localStorage
   * @param {Object} settings - Settings to save
   */
  saveArpeggiatorSettings(settings) {
    // Update local settings
    this.arpeggiator.settings = {
      ...this.arpeggiator.settings,
      ...settings
    };
    
    try {
      localStorage.setItem('arpeggiatorSettings', JSON.stringify(this.arpeggiator.settings));
      console.log('Arpeggiator settings saved');
      
      // Publish settings changed event
      eventBus.publish('arpeggiatorSettingsChanged', this.arpeggiator.settings);
    } catch (e) {
      console.error('Error saving arpeggiator settings:', e);
    }
  }
  
  /**
   * Get current arpeggiator settings
   * @returns {Object} Current settings
   */
  getArpeggiatorSettings() {
    return { ...this.arpeggiator.settings };
  }
  
  /**
   * Handle changes from the store
   * @param {Object} state - Store state
   * @param {string} changedProp - Name of the changed property
   */
  handleStoreChanges(state, changedProp) {
    // Handle state changes
  }
}

// Create singleton instance
const audioService = new AudioService();

export default audioService;