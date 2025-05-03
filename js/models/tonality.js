/**
 * tonality.js
 * Model classes for musical tonalities
 */

/**
 * Class representing a musical tonality
 */
class Tonality {
    /**
     * Create a new Tonality
     * @param {string} code - Tonality code (e.g., 'C', 'Am')
     * @param {string} name - Full name (e.g., 'До мажор', 'Ля минор')
     * @param {string} type - Type ('major' or 'minor')
     * @param {string} signature - Key signature (e.g., '0', '1#', '2b')
     * @param {Object} chords - Object with basic and seventh chords
     */
    constructor(code, name, type, signature, chords) {
      this.code = code;
      this.name = name;
      this.type = type;
      this.signature = signature;
      this.chords = chords || { basic: [], seventh: [] };
    }
    
    /**
     * Get the root note of the tonality
     * @returns {string} Root note
     */
    getRootNote() {
      // For minor tonalities, remove the 'm' suffix
      return this.isMinor() ? this.code.slice(0, -1) : this.code;
    }
    
    /**
     * Check if tonality is minor
     * @returns {boolean} True if minor
     */
    isMinor() {
      return this.type === 'minor';
    }
    
    /**
     * Get all chords in this tonality
     * @returns {Array} Array of chord codes
     */
    getAllChords() {
      return [...this.chords.basic, ...this.chords.seventh];
    }
    
    /**
     * Get chords by function
     * @param {string} functionName - Function name (tonic, subdominant, dominant)
     * @param {ChordCollection} chordCollection - Chord collection to look up functions
     * @returns {Array} Array of chord codes
     */
    getChordsByFunction(functionName, chordCollection) {
      if (!chordCollection) return [];
      
      // Filter chords by function in this tonality
      return this.getAllChords().filter(chordCode => {
        const chord = chordCollection.getChord(chordCode);
        if (!chord || !chord.functions || !chord.functions[this.code]) return false;
        
        return chord.functions[this.code].function === functionName;
      });
    }
    
    /**
     * Get the relative major/minor tonality
     * @param {TonalityCollection} tonalityCollection - Collection to find related tonality
     * @returns {Tonality|null} Related tonality
     */
    getRelativeTonality(tonalityCollection) {
      if (!tonalityCollection) return null;
      
      if (this.isMinor()) {
        // For minor, get relative major (up a minor third)
        const relativeRoot = this.getRelativeMajor(this.getRootNote());
        return tonalityCollection.getTonality(relativeRoot);
      } else {
        // For major, get relative minor (down a minor third)
        const relativeRoot = this.getRelativeMinor(this.getRootNote());
        return tonalityCollection.getTonality(relativeRoot + 'm');
      }
    }
    
    /**
     * Get relative minor for a major root note
     * @param {string} majorRoot - Major root note
     * @returns {string} Relative minor root note
     */
    getRelativeMinor(majorRoot) {
      const noteMap = {
        'C': 'A', 'G': 'E', 'D': 'B', 'A': 'F#',
        'E': 'C#', 'B': 'G#', 'F#': 'D#', 'C#': 'A#',
        'F': 'D', 'Bb': 'G', 'Eb': 'C', 'Ab': 'F',
        'Db': 'Bb', 'Gb': 'Eb'
      };
      
      return noteMap[majorRoot] || majorRoot;
    }
    
    /**
     * Get relative major for a minor root note
     * @param {string} minorRoot - Minor root note
     * @returns {string} Relative major root note
     */
    getRelativeMajor(minorRoot) {
      const noteMap = {
        'A': 'C', 'E': 'G', 'B': 'D', 'F#': 'A',
        'C#': 'E', 'G#': 'B', 'D#': 'F#', 'A#': 'C#',
        'D': 'F', 'G': 'Bb', 'C': 'Eb', 'F': 'Ab',
        'Bb': 'Db', 'Eb': 'Gb'
      };
      
      return noteMap[minorRoot] || minorRoot;
    }
    
    /**
     * Get the parallel major/minor tonality
     * @param {TonalityCollection} tonalityCollection - Collection to find parallel tonality
     * @returns {Tonality|null} Parallel tonality
     */
    getParallelTonality(tonalityCollection) {
      if (!tonalityCollection) return null;
      
      if (this.isMinor()) {
        // For minor, get parallel major (same root)
        return tonalityCollection.getTonality(this.getRootNote());
      } else {
        // For major, get parallel minor (same root)
        return tonalityCollection.getTonality(this.getRootNote() + 'm');
      }
    }
    
    /**
     * Get the next tonality in the circle of fifths
     * @param {TonalityCollection} tonalityCollection - Collection to find next tonality
     * @returns {Tonality|null} Next tonality in circle of fifths
     */
    getNextInCircleOfFifths(tonalityCollection) {
      if (!tonalityCollection) return null;
      
      const root = this.getRootNote();
      const isMinor = this.isMinor();
      
      const nextRoot = this.getNextInCircle(root);
      return tonalityCollection.getTonality(nextRoot + (isMinor ? 'm' : ''));
    }
    
    /**
     * Get the previous tonality in the circle of fifths
     * @param {TonalityCollection} tonalityCollection - Collection to find previous tonality
     * @returns {Tonality|null} Previous tonality in circle of fifths
     */
    getPreviousInCircleOfFifths(tonalityCollection) {
      if (!tonalityCollection) return null;
      
      const root = this.getRootNote();
      const isMinor = this.isMinor();
      
      const prevRoot = this.getPreviousInCircle(root);
      return tonalityCollection.getTonality(prevRoot + (isMinor ? 'm' : ''));
    }
    
    /**
     * Get the next note in the circle of fifths
     * @param {string} note - Starting note
     * @returns {string} Next note in circle of fifths
     */
    getNextInCircle(note) {
      const circleOfFifths = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
      const index = circleOfFifths.indexOf(note);
      
      if (index === -1) return note;
      
      return circleOfFifths[(index + 1) % circleOfFifths.length];
    }
    
    /**
     * Get the previous note in the circle of fifths
     * @param {string} note - Starting note
     * @returns {string} Previous note in circle of fifths
     */
    getPreviousInCircle(note) {
      const circleOfFifths = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
      const index = circleOfFifths.indexOf(note);
      
      if (index === -1) return note;
      
      return circleOfFifths[(index - 1 + circleOfFifths.length) % circleOfFifths.length];
    }
    
    /**
     * Convert tonality to string
     * @returns {string} String representation
     */
    toString() {
      return `${this.code} (${this.name})`;
    }
  }
  
  /**
   * Collection of tonalities
   */
  class TonalityCollection {
    constructor() {
      this.tonalities = new Map();
    }
    
    /**
     * Add a tonality to the collection
     * @param {Tonality} tonality - Tonality to add
     */
    addTonality(tonality) {
      this.tonalities.set(tonality.code, tonality);
    }
    
    /**
     * Get a tonality by code
     * @param {string} code - Tonality code
     * @returns {Tonality|undefined} Tonality or undefined if not found
     */
    getTonality(code) {
      return this.tonalities.get(code);
    }
    
    /**
     * Get all tonalities
     * @returns {Array} Array of tonalities
     */
    getAllTonalities() {
      return Array.from(this.tonalities.values());
    }
    
    /**
     * Get all major tonalities
     * @returns {Array} Array of major tonalities
     */
    getMajorTonalities() {
      return this.getAllTonalities().filter(tonality => tonality.type === 'major');
    }
    
    /**
     * Get all minor tonalities
     * @returns {Array} Array of minor tonalities
     */
    getMinorTonalities() {
      return this.getAllTonalities().filter(tonality => tonality.type === 'minor');
    }
    
    /**
     * Initialize with default tonalities based on the legacy TONALITY_DATA
     */
    initializeDefaultTonalities() {
      // Check if legacy data exists
      if (!window.TONALITY_DATA) {
        console.warn('Legacy TONALITY_DATA not found, cannot initialize default tonalities');
        return;
      }
      
      // Convert legacy data to Tonality objects
      Object.entries(window.TONALITY_DATA).forEach(([code, data]) => {
        const tonality = new Tonality(
          code,
          data.name,
          data.type,
          data.signature,
          data.chords
        );
        
        this.addTonality(tonality);
      });
      
      console.log(`Initialized ${this.tonalities.size} tonalities`);
    }
  }
  
  // Create and export singleton instance
  const tonalityCollection = new TonalityCollection();
  
  export { Tonality, tonalityCollection };

  