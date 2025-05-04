/**
 * app.js - Simplified starter version
 * Main entry point for the ChordPlayer application
 */

// Debug helper
function debug(message) {
  console.log(`[APP] ${message}`);
  if (window.debugLog) {
      window.debugLog(message);
  }
}

debug('Starting application initialization');

// Simple Store implementation for state management
class Store {
  constructor() {
      this.state = {
          currentTonality: 'C',
          currentChord: 'C',
          sequence: [],
          isPlaying: false,
          tempo: 120
      };
      this.subscribers = [];
      
      debug('Store initialized');
  }
  
  // Get current state
  getState() {
      return { ...this.state };
  }
  
  // Set part of state
  setState(updates) {
      const changedProps = Object.keys(updates);
      changedProps.forEach(prop => {
          if (this.state.hasOwnProperty(prop)) {
              this.state[prop] = updates[prop];
          }
      });
      
      // Notify subscribers
      this.notifySubscribers(changedProps);
  }
  
  // Subscribe to state changes
  subscribe(callback) {
      this.subscribers.push(callback);
      
      // Return unsubscribe function
      return () => {
          const index = this.subscribers.indexOf(callback);
          if (index !== -1) {
              this.subscribers.splice(index, 1);
          }
      };
  }
  
  // Notify subscribers of changes
  notifySubscribers(changedProps) {
      this.subscribers.forEach(callback => {
          try {
              callback(this.state, changedProps);
          } catch (e) {
              console.error('Error in store subscriber:', e);
          }
      });
  }
  
  // Getters
  getCurrentTonality() {
      return this.state.currentTonality;
  }
  
  getCurrentChord() {
      return this.state.currentChord;
  }
  
  getSequence() {
      return [...this.state.sequence];
  }
  
  getIsPlaying() {
      return this.state.isPlaying;
  }
  
  getTempo() {
      return this.state.tempo;
  }
  
  // Setters
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
  
  setIsPlaying(isPlaying) {
      this.setState({ isPlaying: isPlaying });
  }
  
  setTempo(tempo) {
      this.setState({ tempo: tempo });
  }
}

// Create store instance
const store = new Store();

// Simple AudioService implementation
class AudioService {
  constructor() {
      this.synth = null;
      this.initialized = false;
      
      debug('AudioService created');
  }
  
  // Initialize audio
  async initialize() {
      if (this.initialized) return;
      
      try {
          if (!window.Tone) {
              throw new Error('Tone.js not loaded');
          }
          
          // Create synth
          this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
          this.initialized = true;
          
          debug('AudioService initialized');
      } catch (e) {
          console.error('Error initializing AudioService:', e);
          debug('ERROR: AudioService initialization failed: ' + e.message);
      }
  }
  
  // Start audio context
  async startAudioContext() {
      try {
          await Tone.start();
          debug('Audio context started');
          return true;
      } catch (e) {
          console.error('Error starting audio context:', e);
          debug('ERROR: Starting audio context failed: ' + e.message);
          return false;
      }
  }
  
  // Play chord
  playChord(chordName) {
      if (!this.initialized) {
          this.initialize().then(() => this.playChordNow(chordName));
          return;
      }
      
      this.playChordNow(chordName);
  }
  
  // Play chord immediately (internal method)
  playChordNow(chordName) {
      try {
          if (!window.CHORD_DATA[chordName]) {
              debug('Warning: No chord data found for ' + chordName);
              // Fall back to playing a C chord
              this.synth.triggerAttackRelease(['C4', 'E4', 'G4'], '2n');
              return;
          }
          
          const notes = window.CHORD_DATA[chordName].notes;
          this.synth.triggerAttackRelease(notes, '2n');
          debug('Playing chord: ' + chordName + ' with notes: ' + notes.join(', '));
      } catch (e) {
          console.error('Error playing chord:', e);
          debug('ERROR: Playing chord failed: ' + e.message);
      }
  }
  
  // Play sequence
  playSequence(sequence) {
      debug('Playing sequence: ' + sequence.join(' - '));
      // Not implemented yet
  }
}

// Create audio service instance
const audioService = new AudioService();

// Connect the new modules to the legacy global objects
function connectLegacyObjects() {
  // Update UI object
  window.UI.getCurrentChord = () => store.getCurrentChord();
  window.UI.getCurrentTonality = () => store.getCurrentTonality();
  window.UI.setCurrentChord = (chord) => {
      debug('UI.setCurrentChord: ' + chord);
      store.setCurrentChord(chord);
      updateChordInfo(chord);
  };
  window.UI.changeTonality = (tonality) => {
      debug('UI.changeTonality: ' + tonality);
      store.setCurrentTonality(tonality);
      updateTonalityUI(tonality);
  };
  
  // Update Sequencer object
  window.Sequencer.isPlaying = store.getIsPlaying();
  window.Sequencer.getSequence = () => store.getSequence();
  window.Sequencer.addChordToSequence = (chord) => {
      debug('Sequencer.addChordToSequence: ' + chord);
      store.addChordToSequence(chord);
      updateSequenceUI();
  };
  window.Sequencer.playSequence = () => {
      debug('Sequencer.playSequence');
      store.setIsPlaying(true);
      // Update UI
      document.getElementById('play-button').disabled = true;
      document.getElementById('stop-button').disabled = false;
  };
  window.Sequencer.stopSequence = () => {
      debug('Sequencer.stopSequence');
      store.setIsPlaying(false);
      // Update UI
      document.getElementById('play-button').disabled = false;
      document.getElementById('stop-button').disabled = true;
  };
  
  // Update Instrument object
  window.Instrument.playChord = (chordName) => {
      debug('Instrument.playChord: ' + chordName);
      audioService.playChord(chordName);
  };
  
  debug('Legacy objects connected to modern modules');
}

// UI update functions
function updateChordInfo(chordName) {
  const chordData = window.CHORD_DATA[chordName];
  if (!chordData) return;
  
  // Update chord info section
  const nameElement = document.querySelector('.chord-name');
  const descElement = document.querySelector('.chord-description');
  const notesElement = document.querySelector('.chord-notes');
  
  if (nameElement) {
      nameElement.textContent = `${chordName} (${chordData.fullName || chordName})`;
  }
  
  if (descElement) {
      descElement.textContent = chordData.description || '';
  }
  
  if (notesElement) {
      const noteNames = chordData.notes.map(note => note.replace(/\d+/, ''));
      notesElement.textContent = `Ноты: ${noteNames.join(', ')}`;
  }
  
  // Highlight active chord button
  document.querySelectorAll('.chord-button').forEach(button => {
      button.classList.toggle('active', button.getAttribute('data-chord') === chordName);
  });
}

function updateTonalityUI(tonality) {
  const tonalityData = window.TONALITY_DATA[tonality];
  if (!tonalityData) return;
  
  // Update tonality display
  const codeElement = document.getElementById('tonality-code');
  const nameElement = document.getElementById('tonality-name');
  
  if (codeElement) {
      codeElement.textContent = tonality;
  }
  
  if (nameElement) {
      nameElement.textContent = `(${tonalityData.name})`;
  }
  
  // Update root note and type selectors
  if (tonality.endsWith('m')) {
      // Minor
      const root = tonality.slice(0, -1);
      document.getElementById('root-note-select').value = root;
      document.getElementById('tonality-type-select').value = 'minor';
  } else {
      // Major
      document.getElementById('root-note-select').value = tonality;
      document.getElementById('tonality-type-select').value = 'major';
  }
}

function updateSequenceUI() {
  const sequence = store.getSequence();
  const container = document.getElementById('sequence-container');
  
  if (!container) return;
  
  // Clear container
  container.innerHTML = '';
  
  // If sequence is empty, show placeholder
  if (sequence.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'timeline-placeholder';
      placeholder.textContent = 'Добавьте аккорды в последовательность';
      container.appendChild(placeholder);
      return;
  }
  
  // Create card for each chord
  sequence.forEach((chord, index) => {
      const card = document.createElement('div');
      card.className = 'sequence-card';
      card.dataset.index = index;
      
      // Chord name
      const name = document.createElement('div');
      name.className = 'chord-name';
      
      if (chord === 'PAUSE') {
          name.textContent = '𝄽';
          name.classList.add('pause-symbol');
      } else {
          name.textContent = chord;
      }
      
      card.appendChild(name);
      
      // Remove button
      const removeBtn = document.createElement('div');
      removeBtn.className = 'card-remove';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeChordFromSequence(index);
      });
      
      card.appendChild(removeBtn);
      
      // Add click handler
      card.addEventListener('click', () => {
          if (chord !== 'PAUSE') {
              window.UI.setCurrentChord(chord);
              window.Instrument.playChord(chord);
          }
      });
      
      // Add to container
      container.appendChild(card);
  });
}

function removeChordFromSequence(index) {
  debug('Removing chord at index: ' + index);
  
  // Get current sequence
  const sequence = store.getSequence();
  
  // Remove chord
  sequence.splice(index, 1);
  
  // Update store
  store.setSequence(sequence);
  
  // Update UI
  updateSequenceUI();
}

// Function to handle root note change
function handleRootNoteChange() {
  const rootNote = document.getElementById('root-note-select').value;
  const type = document.getElementById('tonality-type-select').value;
  
  // Construct tonality code
  const tonality = type === 'minor' ? rootNote + 'm' : rootNote;
  
  // Update store
  window.UI.changeTonality(tonality);
}

// Function to handle tonality type change
function handleTonalityTypeChange() {
  const rootNote = document.getElementById('root-note-select').value;
  const type = document.getElementById('tonality-type-select').value;
  
  // Construct tonality code
  const tonality = type === 'minor' ? rootNote + 'm' : rootNote;
  
  // Update store
  window.UI.changeTonality(tonality);
}

// Setup tonality selector events
function setupTonalityEvents() {
  const rootSelect = document.getElementById('root-note-select');
  const typeSelect = document.getElementById('tonality-type-select');
  
  if (rootSelect) {
      rootSelect.addEventListener('change', handleRootNoteChange);
  }
  
  if (typeSelect) {
      typeSelect.addEventListener('change', handleTonalityTypeChange);
  }
}

// Initialize application
async function initializeApp() {
  debug('Initializing application...');
  
  try {
      // Initialize audio service
      await audioService.initialize();
      
      // Connect legacy objects
      connectLegacyObjects();
      
      // Setup event handlers
      setupTonalityEvents();
      
      // Subscribe to store changes
      store.subscribe((state, changedProps) => {
          if (changedProps.includes('currentChord')) {
              updateChordInfo(state.currentChord);
          }
          
          if (changedProps.includes('currentTonality')) {
              updateTonalityUI(state.currentTonality);
          }
          
          if (changedProps.includes('sequence')) {
              updateSequenceUI();
          }
      });
      
      // Start audio on first user interaction
      const startAudio = async () => {
          await audioService.startAudioContext();
          document.removeEventListener('click', startAudio);
      };
      document.addEventListener('click', startAudio);
      
      // Hide loading indicator
      const loadingIndicator = document.getElementById('loading-indicator');
      if (loadingIndicator) {
          loadingIndicator.style.display = 'none';
      }
      
      debug('Application initialized successfully');
      return true;
  } catch (e) {
      console.error('Error initializing application:', e);
      debug('ERROR: Application initialization failed: ' + e.message);
      return false;
  }
}

// Start the application
initializeApp().then(success => {
  if (success) {
      debug('Application started successfully');
  } else {
      debug('WARNING: Application encountered issues during startup');
  }
});