/**
 * chord.js
 * Model for chord data and chord collection management
 */

// Debug helper
function debug(message) {
  console.log(`[CHORD] ${message}`);
  if (window.debugLog) {
      window.debugLog(message);
  }
}

/**
* Class representing a musical chord with notes and functions
*/
class Chord {
  /**
   * Create a new Chord
   * @param {string} name - The chord name (e.g., C, Am, G7)
   * @param {string[]} notes - Array of notes (e.g., ['C4', 'E4', 'G4'])
   * @param {string} fullName - Full name (e.g., 'До мажор')
   * @param {string} description - Chord description
   * @param {Object} functions - Functions of the chord in different tonalities
   */
  constructor(name, notes, fullName, description, functions = {}) {
      this.name = name;
      this.notes = notes;
      this.fullName = fullName;
      this.description = description;
      this.functions = functions;
  }
  
  /**
   * Get the root note of the chord
   * @returns {string} Root note
   */
  getRootNote() {
      // Extract root note from chord name
      if (this.name.match(/^([A-G][#b]?)m7b5$/)) {
          return this.name.match(/^([A-G][#b]?)m7b5$/)[1];
      } else if (this.name.match(/^([A-G][#b]?)m7$/)) {
          return this.name.match(/^([A-G][#b]?)m7$/)[1];
      } else if (this.name.match(/^([A-G][#b]?)maj7$/)) {
          return this.name.match(/^([A-G][#b]?)maj7$/)[1];
      } else if (this.name.match(/^([A-G][#b]?)7$/)) {
          return this.name.match(/^([A-G][#b]?)7$/)[1];
      } else if (this.name.match(/^([A-G][#b]?)dim$/)) {
          return this.name.match(/^([A-G][#b]?)dim$/)[1];
      } else if (this.name.match(/^([A-G][#b]?)m$/)) {
          return this.name.match(/^([A-G][#b]?)m$/)[1];
      } else {
          return this.name;
      }
  }
  
  /**
   * Get function in specific tonality
   * @param {string} tonality - Tonality code
   * @returns {Object|null} Function data or null
   */
  getFunctionInTonality(tonality) {
      return this.functions[tonality] || null;
  }
  
  /**
   * Check if chord is minor
   * @returns {boolean} True if minor
   */
  isMinor() {
      return this.name.includes('m') && !this.name.includes('maj');
  }
  
  /**
   * Check if chord is major
   * @returns {boolean} True if major
   */
  isMajor() {
      return !this.isMinor() && !this.isDiminished();
  }
  
  /**
   * Check if chord is diminished
   * @returns {boolean} True if diminished
   */
  isDiminished() {
      return this.name.includes('dim');
  }
  
  /**
   * Check if chord is a seventh chord
   * @returns {boolean} True if seventh
   */
  isSeventh() {
      return this.name.includes('7');
  }
  
  /**
   * Get note names without octave numbers
   * @returns {string[]} Note names
   */
  getNoteNames() {
      return this.notes.map(note => note.replace(/[0-9]/g, ''));
  }
}

/**
* Class for managing a collection of chords
*/
class ChordCollection {
  constructor() {
      this.chords = new Map();
      debug('ChordCollection created');
  }
  
  /**
   * Add a chord to the collection
   * @param {Chord} chord - Chord to add
   */
  addChord(chord) {
      this.chords.set(chord.name, chord);
  }
  
  /**
   * Get a chord by name
   * @param {string} name - Chord name
   * @returns {Chord|undefined} Chord or undefined if not found
   */
  getChord(name) {
      return this.chords.get(name);
  }
  
  /**
   * Get all chords in the collection
   * @returns {Chord[]} Array of all chords
   */
  getAllChords() {
      return Array.from(this.chords.values());
  }
  
  /**
   * Get chords by tonality
   * @param {string} tonality - Tonality code
   * @returns {Chord[]} Chords in the tonality
   */
  getChordsByTonality(tonality) {
      return this.getAllChords().filter(chord => 
          chord.functions && chord.functions[tonality]
      );
  }
  
  /**
   * Get chords by function in tonality
   * @param {string} tonality - Tonality code
   * @param {string} functionName - Function name
   * @returns {Chord[]} Matching chords
   */
  getChordsByFunction(tonality, functionName) {
      return this.getChordsByTonality(tonality).filter(chord => 
          chord.functions[tonality] && 
          chord.functions[tonality].function === functionName
      );
  }
  
  /**
   * Initialize chord collection from global data
   */
  initializeFromGlobal() {
      debug('Initializing chord collection from global data');
      
      // Check if global CHORD_DATA exists
      if (!window.CHORD_DATA) {
          debug('ERROR: Global CHORD_DATA not found');
          return;
      }
      
      // Convert global data to Chord objects
      Object.entries(window.CHORD_DATA).forEach(([name, data]) => {
          try {
              const chord = new Chord(
                  name,
                  data.notes || [],
                  data.fullName || name,
                  data.description || '',
                  data.functions || {}
              );
              
              this.addChord(chord);
          } catch (e) {
              console.error(`Error creating chord ${name}:`, e);
          }
      });
      
      debug(`Initialized ${this.chords.size} chords`);
  }
  
  /**
   * Get or create default chords if collection is empty
   */
  ensureDefaultChords() {
      // If collection already has chords, do nothing
      if (this.chords.size > 0) return;
      
      debug('Creating default chords');
      
      // Create some basic chords
      const defaultChords = [
          // C Major triad
          new Chord(
              'C',
              ['C4', 'E4', 'G4'],
              'До мажор',
              'Мажорное трезвучие',
              {
                  'C': { function: 'tonic', degree: 'I', label: 'T' },
                  'F': { function: 'dominant', degree: 'V', label: 'D' },
                  'G': { function: 'subdominant', degree: 'IV', label: 'S' }
              }
          ),
          
          // A Minor triad
          new Chord(
              'Am',
              ['A3', 'C4', 'E4'],
              'Ля минор',
              'Минорное трезвучие',
              {
                  'Am': { function: 'tonic', degree: 'i', label: 'T' },
                  'C': { function: 'relative major', degree: 'III', label: 'R' }
              }
          ),
          
          // G Major triad
          new Chord(
              'G',
              ['G3', 'B3', 'D4'],
              'Соль мажор',
              'Мажорное трезвучие',
              {
                  'G': { function: 'tonic', degree: 'I', label: 'T' },
                  'C': { function: 'subdominant', degree: 'IV', label: 'S' }
              }
          )
      ];
      
      // Add the default chords to the collection
      defaultChords.forEach(chord => this.addChord(chord));
      
      debug(`Added ${defaultChords.length} default chords`);
  }
  
  /**
   * Synchronize collection with global CHORD_DATA
   */
  syncWithGlobal() {
      debug('Synchronizing with global CHORD_DATA');
      
      // Create global object if it doesn't exist
      if (!window.CHORD_DATA) {
          window.CHORD_DATA = {};
      }
      
      // Add collection chords to global
      this.chords.forEach((chord, name) => {
          window.CHORD_DATA[name] = {
              notes: chord.notes,
              fullName: chord.fullName,
              description: chord.description,
              functions: chord.functions
          };
      });
      
      // Add global chords to collection
      Object.entries(window.CHORD_DATA).forEach(([name, data]) => {
          if (!this.chords.has(name)) {
              const chord = new Chord(
                  name,
                  data.notes || [],
                  data.fullName || name,
                  data.description || '',
                  data.functions || {}
              );
              
              this.addChord(chord);
          }
      });
      
      debug('Synchronization complete');
  }
}

// Create and export chord collection singleton
const chordCollection = new ChordCollection();

// Initialize collection
chordCollection.initializeFromGlobal();
chordCollection.ensureDefaultChords();
chordCollection.syncWithGlobal();

// Export classes and singleton
export { Chord, chordCollection };