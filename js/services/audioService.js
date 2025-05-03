/**
 * audioService.js
 * Central service for audio generation and playback
 */

import store from '../core/store.js';

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
      isPlaying: false
    };
    
    // Flag to track initialization
    this.initialized = false;
    
    // Subscribe to relevant store changes
    store.subscribe(this.handleStoreChanges.bind(this), 
      ['isPlaying', 'arpeggiatorEnabled', 'metronomeEnabled', 'tempo']);
  }
  
  /**
   * Initialize audio engine and instruments
   */
  async initialize() {
    if (this.initialized) return;
    
    // Check if Tone.js is available
    if (!window.Tone) {
      console.error('Tone.js is not loaded');
      return;
    }
    
    try {
      // Start audio context when initializing
      await Tone.start();
      console.log('Audio context started');
      
      // Create instruments
      this.createInstruments();
      
      this.initialized = true;
      console.log('AudioService initialized');
    } catch (error) {
      console.error('Error initializing AudioService:', error);
    }
  }
  
  /**
   * Create audio instruments
   */
  createInstruments() {
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
  }
  
  /**
   * Play a chord
   * @param {string} chordName - Name of the chord to play
   */
  playChord(chordName) {
    if (!this.initialized) {
      console.warn('AudioService not initialized');
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
    // Get chord data from the store system
    const chordData = this.getChordData(chordName);
    
    if (!chordData) {
      console.error(`Chord data not found for: ${chordName}`);
      return;
    }
    
    // Check for valid notes
    const notes = chordData.notes;
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
    const chordData = this.getChordData(chordName);
    
    if (!chordData) {
      console.error(`Chord data not found for: ${chordName}`);
      return;
    }
    
    // Get arpeggiator settings - these could come from the store 
    // or a dedicated arpeggiator settings module
    const settings = this.getArpeggiatorSettings();
    
    // Generate arpeggio notes based on settings
    const arpNotes = this.generateArpeggioNotes(
      chordData.notes, 
      settings.pattern, 
      settings.octaveRange,
      settings.octaveOffset
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
        let velocity = settings.velocity;
        
        // Accent first note if enabled
        if (settings.accentFirst && note === arpNotes[0]) {
          velocity = Math.min(1, velocity * 1.3);
        }
        
        // Play the note
        this.instruments.synth.triggerAttackRelease(
          note, 
          settings.noteLength, 
          time, 
          velocity
        );
      },
      arpNotes,
      settings.noteLength
    ).start(0);
    
    // Start Tone transport if not already running
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
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
   * Generate notes for arpeggio
   * @param {Array} baseNotes - Base notes of the chord
   * @param {string} pattern - Arpeggio pattern ('up', 'down', 'updown', 'random')
   * @param {number} octaveRange - Number of octaves to span
   * @param {number} octaveOffset - Octave offset (-2 to +1)
   * @returns {Array} Array of notes for arpeggio
   */
  generateArpeggioNotes(baseNotes, pattern, octaveRange, octaveOffset) {
    // Process base notes to extract note names and octaves
    const notes = baseNotes.map(note => {
      const noteName = note.replace(/[0-9]/g, '');
      const octave = parseInt(note.match(/[0-9]/)[0]) + octaveOffset;
      return { noteName, octave: Math.max(0, Math.min(8, octave)) };
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
    let result = [];
    
    switch (pattern) {
      case 'up':
        // Ascending pattern
        for (let octave = 0; octave < octaveRange; octave++) {
          notes.forEach(note => {
            result.push(`${note.noteName}${note.octave + octave}`);
          });
        }
        break;
        
      case 'down':
        // Descending pattern
        for (let octave = octaveRange - 1; octave >= 0; octave--) {
          [...notes].reverse().forEach(note => {
            result.push(`${note.noteName}${note.octave + octave}`);
          });
        }
        break;
        
      case 'updown':
        // Up and down pattern
        for (let octave = 0; octave < octaveRange; octave++) {
          notes.forEach(note => {
            result.push(`${note.noteName}${note.octave + octave}`);
          });
        }
        
        // Add descending part (without repeating top and bottom notes)
        for (let octave = octaveRange - 1; octave >= 0; octave--) {
          [...notes].reverse().forEach((note, index) => {
            // Skip first note of highest octave and last note of lowest octave
            if ((octave === octaveRange - 1 && index === 0) || 
                (octave === 0 && index === notes.length - 1)) {
              return;
            }
            result.push(`${note.noteName}${note.octave + octave}`);
          });
        }
        break;
        
      case 'random':
        // Random pattern - collect all possible notes
        const allNotes = [];
        for (let octave = 0; octave < octaveRange; octave++) {
          notes.forEach(note => {
            allNotes.push(`${note.noteName}${note.octave + octave}`);
          });
        }
        
        // Generate random sequence
        const noteCount = allNotes.length * 2; // Make sequence a bit longer
        for (let i = 0; i < noteCount; i++) {
          const randomIndex = Math.floor(Math.random() * allNotes.length);
          result.push(allNotes[randomIndex]);
        }
        break;
        
      default:
        // Default to simple arpeggio if pattern not recognized
        result = notes.map(note => `${note.noteName}${note.octave}`);
    }
    
    return result;
  }
  
  /**
   * Get arpeggiator settings
   * @returns {Object} Arpeggiator settings
   */
  getArpeggiatorSettings() {
    // These settings could be stored in the store or in a dedicated module
    // For now, we use default settings
    return {
      pattern: 'up',
      octaveRange: 1,
      octaveOffset: 0,
      noteLength: '8n', // Eighth notes
      velocity: 0.7,     // Volume level (0-1)
      accentFirst: true  // Accent first note of pattern
    };
  }
  
  /**
   * Play sequence of chords
   * @param {Array} sequence - Sequence of chord names
   * @param {boolean} loop - Whether to loop the sequence
   */
  playSequence(sequence = null, loop = true) {
    if (!this.initialized) {
      console.warn('AudioService not initialized');
      return;
    }
    
    // Stop any current playback
    this.stopSequence();
    
    // Use provided sequence or get from store
    const chordsToPlay = sequence || store.getSequence();
    
    // Check if sequence has chords
    if (!chordsToPlay || chordsToPlay.length === 0) {
      console.warn('No chords to play');
      return;
    }
    
    // Store custom sequence if provided
    if (sequence) {
      this.sequencer.customSequence = [...sequence];
      this.sequencer.loopCustomSequence = loop;
    } else {
      this.sequencer.customSequence = null;
    }
    
    // Set sequencer state
    this.sequencer.isPlaying = true;
    this.sequencer.currentIndex = 0;
    
    // Get current tempo
    const tempo = store.getTempo();
    const interval = (60 / tempo) * 1000; // in milliseconds
    
    // Start metronome if enabled
    if (store.getMetronomeEnabled()) {
      this.startMetronome();
    }
    
    // Play the first chord
    this.playCurrentSequenceChord();
    
    // Set up interval for playing the rest of the sequence
    this.sequencer.intervalId = setInterval(() => {
      // Move to the next chord
      this.sequencer.currentIndex++;
      
      // Get the active sequence
      const activeSequence = this.sequencer.customSequence || chordsToPlay;
      
      // Check if we reached the end of the sequence
      if (this.sequencer.currentIndex >= activeSequence.length) {
        // If looping, go back to the beginning
        if ((this.sequencer.customSequence && this.sequencer.loopCustomSequence) || 
            (!this.sequencer.customSequence && loop)) {
          this.sequencer.currentIndex = 0;
        } else {
          // Otherwise, stop playback
          this.stopSequence();
          return;
        }
      }
      
      // Play the current chord
      this.playCurrentSequenceChord();
    }, interval);
    
    // Update isPlaying state in store
    store.setIsPlaying(true);
  }
  
  /**
   * Play the current chord in the sequence
   */
  playCurrentSequenceChord() {
    if (!this.sequencer.isPlaying) return;
    
    // Get the active sequence
    const sequence = this.sequencer.customSequence || store.getSequence();
    
    // Check index validity
    if (this.sequencer.currentIndex < 0 || this.sequencer.currentIndex >= sequence.length) {
      console.error('Invalid sequence index:', this.sequencer.currentIndex);
      return;
    }
    
    // Get the current chord
    const chordName = sequence[this.sequencer.currentIndex];
    
    // Stop all sounds before playing new chord
    this.stopAllSounds(false); // Don't stop sequencer
    
    // Skip playing if it's a pause or block divider
    if (chordName === 'PAUSE' || chordName === 'BLOCK_DIVIDER') {
      return;
    }
    
    // Update current chord in store
    store.setCurrentChord(chordName);
    
    // Play the chord
    if (store.getArpeggiatorEnabled()) {
      this.playArpeggio(chordName);
    } else {
      this.playChordNormal(chordName);
    }
  }
  
  /**
   * Stop sequence playback
   */
  stopSequence() {
    // Clear interval
    if (this.sequencer.intervalId) {
      clearInterval(this.sequencer.intervalId);
      this.sequencer.intervalId = null;
    }
    
    // Reset sequencer state
    this.sequencer.isPlaying = false;
    this.sequencer.currentIndex = -1;
    this.sequencer.customSequence = null;
    
    // Stop sounds
    this.stopAllSounds();
    
    // Stop metronome
    this.stopMetronome();
    
    // Update isPlaying state in store
    store.setIsPlaying(false);
  }
  
  /**
   * Start metronome
   */
  startMetronome() {
    // Stop metronome if it's already playing
    this.stopMetronome();
    
    // Set metronome state
    this.metronome.isPlaying = true;
    this.metronome.count = 0;
    
    // Get tempo from store
    const tempo = store.getTempo();
    const interval = (60 / tempo) * 1000; // in milliseconds
    
    // Set up interval for metronome beats
    this.metronome.intervalId = setInterval(() => {
      // Get beat number (0-3 for 4/4 time)
      const beat = this.metronome.count % 4;
      
      // Play appropriate sound for beat
      if (beat === 0) {
        // Strong beat (first beat of bar)
        this.instruments.metronomeSynth.triggerAttackRelease("C2", "32n");
      } else {
        // Weak beat
        this.instruments.weakBeatSynth.triggerAttackRelease("C3", "32n");
      }
      
      // Increment count
      this.metronome.count++;
    }, interval);
  }
  
  /**
   * Stop metronome
   */
  stopMetronome() {
    // Clear interval
    if (this.metronome.intervalId) {
      clearInterval(this.metronome.intervalId);
      this.metronome.intervalId = null;
    }
    
    // Reset metronome state
    this.metronome.isPlaying = false;
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
   * Get chord data from the global ChordData
   * @param {string} chordName - Name of the chord
   * @returns {Object|null} Chord data or null if not found
   */
  getChordData(chordName) {
    // This should be updated to use the modernized chord data system
    // For now, access the global CHORD_DATA
    return window.CHORD_DATA ? window.CHORD_DATA[chordName] : null;
  }
  
  /**
   * Handle changes from the store
   * @param {Object} state - Store state
   * @param {string} changedProp - Name of the changed property
   */
  handleStoreChanges(state, changedProp) {
    switch (changedProp) {
      case 'isPlaying':
        // Start or stop sequence playback
        if (state.isPlaying && !this.sequencer.isPlaying) {
          this.playSequence();
        } else if (!state.isPlaying && this.sequencer.isPlaying) {
          this.stopSequence();
        }
        break;
        
      case 'metronomeEnabled':
        // Start or stop metronome
        if (state.metronomeEnabled && !this.metronome.isPlaying && this.sequencer.isPlaying) {
          this.startMetronome();
        } else if (!state.metronomeEnabled && this.metronome.isPlaying) {
          this.stopMetronome();
        }
        break;
        
      case 'tempo':
        // Update tempo for playback
        if (this.sequencer.isPlaying) {
          // Restart sequence with new tempo
          const wasPlaying = this.sequencer.isPlaying;
          const currentIndex = this.sequencer.currentIndex;
          const customSequence = this.sequencer.customSequence;
          const loopCustom = this.sequencer.loopCustomSequence;
          
          // Stop current playback
          this.stopSequence();
          
          // Restart if it was playing
          if (wasPlaying) {
            // Use custom sequence if it was being used
            if (customSequence) {
              this.playSequence(customSequence, loopCustom);
            } else {
              this.playSequence();
            }
            
            // Try to restore position
            if (currentIndex > 0) {
              this.sequencer.currentIndex = currentIndex - 1; // -1 because playSequence plays first chord
            }
          }
        }
        
        // Update metronome tempo if it's playing
        if (this.metronome.isPlaying) {
          this.stopMetronome();
          this.startMetronome();
        }
        break;
    }
  }
}

// Create singleton instance
const audioService = new AudioService();

export default audioService;