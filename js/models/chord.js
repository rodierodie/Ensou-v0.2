/**
 * chord.js
 * Model classes for musical chords
 */

/**
 * Class representing a musical chord
 */
class Chord {
    /**
     * Create a new Chord
     * @param {string} name - Chord name (e.g., 'C', 'Dm7')
     * @param {Array} notes - Array of notes (e.g., ['C4', 'E4', 'G4'])
     * @param {string} fullName - Full name (e.g., 'До мажор')
     * @param {string} description - Chord description
     * @param {Object} functions - Map of tonality codes to chord functions
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
      // Handle various chord types (e.g., C, Cm, C7, Cmaj7, Cm7b5)
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
     * Get the function of this chord in a specific tonality
     * @param {string} tonalityCode - Tonality code
     * @returns {Object|null} Chord function or null if not defined
     */
    getFunctionInTonality(tonalityCode) {
      return this.functions[tonalityCode] || null;
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
      return this.name.includes('dim') || this.name.includes('°');
    }
    
    /**
     * Check if chord is a seventh chord
     * @returns {boolean} True if seventh chord
     */
    isSeventh() {
      return this.name.includes('7') || this.name.includes('maj7');
    }
    
    /**
     * Get chord notes without octave
     * @returns {Array} Array of note names without octave
     */
    getNoteNames() {
      return this.notes.map(note => note.replace(/[0-9]/g, ''));
    }
    
    /**
     * Transpose chord by a number of semitones
     * @param {number} semitones - Number of semitones (positive or negative)
     * @param {ChordCollection} chordCollection - Collection to look up transposed chord
     * @returns {Chord|null} Transposed chord or null if not found
     */
    transpose(semitones, chordCollection) {
      if (!chordCollection) return null;
      
      // Get root note and transpose it
      const rootNote = this.getRootNote();
      const transposedRoot = this.transposeNote(rootNote, semitones);
      
      // Determine chord type from name
      const chordType = this.name.replace(rootNote, '');
      
      // Look up transposed chord in collection
      return chordCollection.getChord(transposedRoot + chordType);
    }
    
    /**
     * Transpose a note by a number of semitones
     * @param {string} note - Note name (without octave)
     * @param {number} semitones - Number of semitones (positive or negative)
     * @returns {string} Transposed note
     */
    transposeNote(note, semitones) {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      
      // Normalize flats to sharps
      let normalizedNote = note;
      if (note.includes('b')) {
        normalizedNote = normalizedNote.replace('Bb', 'A#')
          .replace('Eb', 'D#')
          .replace('Ab', 'G#')
          .replace('Db', 'C#')
          .replace('Gb', 'F#');
      }
      
      // Find index of note in array
      const index = notes.indexOf(normalizedNote);
      if (index === -1) return note; // Return original if not found
      
      // Calculate new index
      let newIndex = (index + semitones) % 12;
      if (newIndex < 0) newIndex += 12;
      
      return notes[newIndex];
    }
    
    /**
     * Convert chord to string
     * @returns {string} String representation
     */
    toString() {
      return `${this.name} (${this.fullName})`;
    }
  }
  
  /**
   * Collection of chords
   */
  class ChordCollection {
    constructor() {
      this.chords = new Map();
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
     * Get all chords
     * @returns {Array} Array of chords
     */
    getAllChords() {
      return Array.from(this.chords.values());
    }
    
    /**
     * Get chords by tonality
     * @param {string} tonalityCode - Tonality code
     * @returns {Array} Array of chords in the tonality
     */
    getChordsByTonality(tonalityCode) {
      return this.getAllChords().filter(chord => 
        chord.functions && chord.functions[tonalityCode]
      );
    }
    
    /**
     * Get chords by function in a specific tonality
     * @param {string} tonalityCode - Tonality code
     * @param {string} functionName - Function name
     * @returns {Array} Array of chords with the specified function
     */
    getChordsByFunction(tonalityCode, functionName) {
      return this.getChordsByTonality(tonalityCode).filter(chord => 
        chord.functions[tonalityCode] && 
        chord.functions[tonalityCode].function === functionName
      );
    }
    
    /**
     * Initialize with default chords based on the legacy CHORD_DATA
     */
    initializeDefaultChords() {
      // Check if legacy data exists
      if (!window.CHORD_DATA) {
        console.warn('Legacy CHORD_DATA not found, cannot initialize default chords');
        return;
      }
      
      // Convert legacy data to Chord objects
      Object.entries(window.CHORD_DATA).forEach(([name, data]) => {
        const chord = new Chord(
          name,
          data.notes,
          data.fullName,
          data.description,
          data.functions
        );
        
        this.addChord(chord);
      });
      
      console.log(`Initialized ${this.chords.size} chords`);
    }
    
    /**
     * Generate missing chords for a tonality
     * @param {string} tonalityCode - Tonality code
     * @param {Object} tonalityData - Tonality data
     */
    generateMissingChords(tonalityCode, tonalityData) {
      if (!tonalityData || !tonalityData.chords) return;
      
      // Get all chords in the tonality
      const allChords = [
        ...tonalityData.chords.basic,
        ...tonalityData.chords.seventh
      ];
      
      // Check each chord
      allChords.forEach(chordName => {
        // Skip if chord already exists
        if (this.getChord(chordName)) {
          // If chord exists but doesn't have a function for this tonality, add it
          const chord = this.getChord(chordName);
          if (!chord.functions[tonalityCode]) {
            chord.functions[tonalityCode] = this.getChordFunction(chordName, tonalityCode, tonalityData);
          }
          return;
        }
        
        // Create new chord
        const { notes, fullName, description } = this.generateChordData(chordName, tonalityCode);
        
        // Create function for this tonality
        const functions = {};
        functions[tonalityCode] = this.getChordFunction(chordName, tonalityCode, tonalityData);
        
        // Create and add chord
        const chord = new Chord(chordName, notes, fullName, description, functions);
        this.addChord(chord);
      });
    }
    
    /**
     * Generate chord data (notes, full name, description)
     * @param {string} chordName - Chord name
     * @param {string} tonalityCode - Tonality code
     * @returns {Object} Chord data
     */
    generateChordData(chordName, tonalityCode) {
      // Get root note
      let rootNote = '';
      
      // Use regex to extract root note based on chord type
      if (chordName.match(/^([A-G][#b]?)m7b5$/)) {
        rootNote = chordName.match(/^([A-G][#b]?)m7b5$/)[1];
      } else if (chordName.match(/^([A-G][#b]?)m7$/)) {
        rootNote = chordName.match(/^([A-G][#b]?)m7$/)[1];
      } else if (chordName.match(/^([A-G][#b]?)maj7$/)) {
        rootNote = chordName.match(/^([A-G][#b]?)maj7$/)[1];
      } else if (chordName.match(/^([A-G][#b]?)7$/)) {
        rootNote = chordName.match(/^([A-G][#b]?)7$/)[1];
      } else if (chordName.match(/^([A-G][#b]?)dim$/)) {
        rootNote = chordName.match(/^([A-G][#b]?)dim$/)[1];
      } else if (chordName.match(/^([A-G][#b]?)m$/)) {
        rootNote = chordName.match(/^([A-G][#b]?)m$/)[1];
      } else {
        rootNote = chordName;
      }
      
      // Generate notes based on chord type
      let notes = [];
      let description = '';
      let fullName = '';
      
      if (chordName.endsWith('maj7')) {
        // Major seventh chord
        description = 'Большой мажорный септаккорд';
        fullName = this.getNoteFullName(rootNote) + ' мажорный септаккорд';
        
        notes = [
          rootNote + '4',
          this.transposeNote(rootNote, 4) + '4',
          this.transposeNote(rootNote, 7) + '4',
          this.transposeNote(rootNote, 11) + '4'
        ];
      } else if (chordName.endsWith('m7b5')) {
        // Half-diminished seventh chord
        description = 'Полууменьшенный септаккорд';
        fullName = this.getNoteFullName(rootNote) + ' полууменьшенный септаккорд';
        
        notes = [
          rootNote + '4',
          this.transposeNote(rootNote, 3) + '4',
          this.transposeNote(rootNote, 6) + '4',
          this.transposeNote(rootNote, 10) + '4'
        ];
      } else if (chordName.endsWith('m7')) {
        // Minor seventh chord
        description = 'Минорный септаккорд';
        fullName = this.getNoteFullName(rootNote) + ' минорный септаккорд';
        
        notes = [
          rootNote + '4',
          this.transposeNote(rootNote, 3) + '4',
          this.transposeNote(rootNote, 7) + '4',
          this.transposeNote(rootNote, 10) + '4'
        ];
      } else if (chordName.endsWith('7')) {
        // Dominant seventh chord
        description = 'Доминантсептаккорд';
        fullName = this.getNoteFullName(rootNote) + ' доминантсептаккорд';
        
        notes = [
          rootNote + '4',
          this.transposeNote(rootNote, 4) + '4',
          this.transposeNote(rootNote, 7) + '4',
          this.transposeNote(rootNote, 10) + '4'
        ];
      } else if (chordName.endsWith('dim')) {
        // Diminished triad
        description = 'Уменьшенное трезвучие';
        fullName = this.getNoteFullName(rootNote) + ' уменьшенный';
        
        notes = [
          rootNote + '4',
          this.transposeNote(rootNote, 3) + '4',
          this.transposeNote(rootNote, 6) + '4'
        ];
      } else if (chordName.endsWith('m')) {
        // Minor triad
        description = 'Минорное трезвучие';
        fullName = this.getNoteFullName(rootNote) + ' минор';
        
        notes = [
          rootNote + '4',
          this.transposeNote(rootNote, 3) + '4',
          this.transposeNote(rootNote, 7) + '4'
        ];
      } else {
        // Major triad
        description = 'Мажорное трезвучие';
        fullName = this.getNoteFullName(rootNote) + ' мажор';
        
        notes = [
          rootNote + '4',
          this.transposeNote(rootNote, 4) + '4',
          this.transposeNote(rootNote, 7) + '4'
        ];
      }
      
      return { notes, fullName, description };
    }
    
    /**
     * Get chord function in a tonality
     * @param {string} chordName - Chord name
     * @param {string} tonalityCode - Tonality code
     * @param {Object} tonalityData - Tonality data
     * @returns {Object} Chord function
     */
    getChordFunction(chordName, tonalityCode, tonalityData) {
      // Extract base chord name and type for seventh chords
      let baseChordName = '';
      let chordType = '';
      
      if (chordName.endsWith('m7b5')) {
        baseChordName = chordName.replace('m7b5', 'dim');
        chordType = 'm7b5';
      } else if (chordName.endsWith('m7')) {
        baseChordName = chordName.replace('m7', 'm');
        chordType = '7';
      } else if (chordName.endsWith('maj7')) {
        baseChordName = chordName.replace('maj7', '');
        chordType = 'maj7';
      } else if (chordName.endsWith('7')) {
        baseChordName = chordName.replace('7', '');
        chordType = '7';
      } else {
        baseChordName = chordName;
      }
      
      // Find base chord index in tonality
      const basicChords = tonalityData.chords.basic;
      let index = basicChords.indexOf(baseChordName);
      
      // If not found, try to find the chord directly in seventh chords
      if (index === -1 && chordType) {
        index = tonalityData.chords.seventh.indexOf(chordName);
      }
      
      // Return default if chord not found in tonality
      if (index === -1) {
        return { function: 'unknown', degree: '?', label: '?' };
      }
      
      // Determine function based on tonality type and chord index
      if (tonalityData.type === 'major') {
        switch(index) {
          case 0: return { 
            function: 'tonic', 
            degree: chordType ? 'I' + chordType : 'I', 
            label: 'T' 
          };
          case 1: return { 
            function: 'subdominant', 
            degree: chordType ? 'ii' + chordType : 'ii', 
            label: 'S' 
          };
          case 2: return { 
            function: 'tonic', 
            degree: chordType ? 'iii' + chordType : 'iii', 
            label: 'T' 
          };
          case 3: return { 
            function: 'subdominant', 
            degree: chordType ? 'IV' + chordType : 'IV', 
            label: 'S' 
          };
          case 4: return { 
            function: 'dominant', 
            degree: chordType ? 'V' + chordType : 'V', 
            label: 'D' 
          };
          case 5: return { 
            function: 'tonic', 
            degree: chordType ? 'vi' + chordType : 'vi', 
            label: 'T' 
          };
          case 6: return { 
            function: 'dominant', 
            degree: chordType === 'm7b5' ? 'viiø7' : (chordType ? 'vii°' + chordType : 'vii°'), 
            label: 'D' 
          };
          default: return { 
            function: 'unknown', 
            degree: '?', 
            label: '?' 
          };
        }
      } else { // minor
        switch(index) {
          case 0: return { 
            function: 'tonic', 
            degree: chordType ? 'i' + chordType : 'i', 
            label: 'T' 
          };
          case 1: return { 
            function: 'dominant', 
            degree: chordType === 'm7b5' ? 'iiø7' : (chordType ? 'ii°' + chordType : 'ii°'), 
            label: 'D' 
          };
          case 2: return { 
            function: 'tonic', 
            degree: chordType ? 'III' + chordType : 'III', 
            label: 'T' 
          };
          case 3: return { 
            function: 'subdominant', 
            degree: chordType ? 'iv' + chordType : 'iv', 
            label: 'S' 
          };
          case 4: return { 
            function: 'dominant', 
            degree: chordType ? 'v' + chordType : 'v', 
            label: 'D' 
          };
          case 5: return { 
            function: 'subdominant', 
            degree: chordType ? 'VI' + chordType : 'VI', 
            label: 'S' 
          };
          case 6: return { 
            function: 'dominant', 
            degree: chordType ? 'VII' + chordType : 'VII', 
            label: 'D' 
          };
          default: return { 
            function: 'unknown', 
            degree: '?', 
            label: '?' 
          };
        }
      }
    }
    
    /**
     * Get full name of a note in Russian
     * @param {string} note - Note name
     * @returns {string} Full note name
     */
    getNoteFullName(note) {
      const noteNames = {
        'C': 'До', 'C#': 'До-диез', 'Db': 'Ре-бемоль',
        'D': 'Ре', 'D#': 'Ре-диез', 'Eb': 'Ми-бемоль',
        'E': 'Ми', 'F': 'Фа', 'F#': 'Фа-диез',
        'Gb': 'Соль-бемоль', 'G': 'Соль', 'G#': 'Соль-диез',
        'Ab': 'Ля-бемоль', 'A': 'Ля', 'A#': 'Ля-диез',
        'Bb': 'Си-бемоль', 'B': 'Си'
      };
      
      return noteNames[note] || note;
    }
    
    /**
     * Transpose a note by a number of semitones
     * @param {string} note - Note name
     * @param {number} semitones - Number of semitones
     * @returns {string} Transposed note
     */
    transposeNote(note, semitones) {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      
      // Normalize flats to sharps
      let normalizedNote = note;
      if (note.includes('b')) {
        normalizedNote = normalizedNote.replace('Bb', 'A#')
          .replace('Eb', 'D#')
          .replace('Ab', 'G#')
          .replace('Db', 'C#')
          .replace('Gb', 'F#');
      }
      
      // Find index of note in array
      const index = notes.indexOf(normalizedNote);
      if (index === -1) return note; // Return original if not found
      
      // Calculate new index
      let newIndex = (index + semitones) % 12;
      if (newIndex < 0) newIndex += 12;
      
      return notes[newIndex];
    }
  }
  
  // Create and export singleton instance
  const chordCollection = new ChordCollection();
  
  export { Chord, chordCollection };