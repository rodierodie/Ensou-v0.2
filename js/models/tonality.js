/**
 * tonality.js
 * Module for working with musical tonalities in the ChordPlayer application
 * Provides classes for tonality representation and management
 */

import { eventBus } from '../core/eventBus.js';
import { chordCollection } from './chord.js';

/**
 * Class representing a musical tonality
 */
class Tonality {
  /**
   * Create a new Tonality
   * @param {string} code - Tonality code (e.g., "C", "Am")
   * @param {string} name - Full name (e.g., "До мажор", "Ля минор")
   * @param {string} type - Tonality type ("major" or "minor")
   * @param {string} signature - Key signature (e.g., "0", "1#", "2b")
   * @param {Object} chords - Available chords in this tonality
   * @param {Array} chords.basic - Basic triads
   * @param {Array} chords.seventh - Seventh chords
   */
  constructor(code, name, type, signature, chords) {
    this.code = code;             // Code (C, G, Am, etc.)
    this.name = name;             // Full name (До мажор, Ля минор)
    this.type = type;             // Type (major/minor)
    this.signature = signature;   // Key signature (0, 1#, 2b, etc.)
    this.chords = chords || {     // Chords in this tonality
      basic: [],                  // Basic triads
      seventh: []                 // Seventh chords
    };
    
    // Circle of fifths position (calculated on demand)
    this._circlePosition = null;
  }
  
  /**
   * Get the root note of the tonality
   * @returns {string} Root note
   */
  getRootNote() {
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
   * Check if tonality is major
   * @returns {boolean} True if major
   */
  isMajor() {
    return this.type === 'major';
  }
  
  /**
   * Get all chords in this tonality
   * @returns {Array} Combined array of all chords
   */
  getAllChords() {
    return [...this.chords.basic, ...this.chords.seventh];
  }
  
  /**
   * Get basic triads in this tonality
   * @returns {Array} Array of basic chord names
   */
  getBasicChords() {
    return [...this.chords.basic];
  }
  
  /**
   * Get seventh chords in this tonality
   * @returns {Array} Array of seventh chord names
   */
  getSeventhChords() {
    return [...this.chords.seventh];
  }
  
  /**
   * Get chords by function in this tonality
   * @param {string} functionName - Function name (tonic, subdominant, dominant)
   * @returns {Array} Array of chord objects with the specified function
   */
  getChordsByFunction(functionName) {
    if (!chordCollection) return [];
    
    return chordCollection.getAllChords().filter(chord => {
      const func = chord.getFunctionInTonality(this.code);
      return func && func.function === functionName;
    });
  }
  
  /**
   * Get relative tonality (major->minor or minor->major)
   * @returns {string|null} Code of relative tonality or null if not found
   */
  getRelativeTonality() {
    if (this.isMajor()) {
      // Major to relative minor (down 3 semitones)
      const relativeMinorNotes = {
        'C': 'A', 'G': 'E', 'D': 'B', 'A': 'F#',
        'E': 'C#', 'B': 'G#', 'F#': 'D#', 'C#': 'A#',
        'F': 'D', 'Bb': 'G', 'Eb': 'C', 'Ab': 'F',
        'Db': 'Bb', 'Gb': 'Eb', 'Cb': 'Ab'
      };
      
      return relativeMinorNotes[this.code] ? `${relativeMinorNotes[this.code]}m` : null;
    } else {
      // Minor to relative major (up 3 semitones)
      const relativeMajorNotes = {
        'Am': 'C', 'Em': 'G', 'Bm': 'D', 'F#m': 'A',
        'C#m': 'E', 'G#m': 'B', 'D#m': 'F#', 'A#m': 'C#',
        'Dm': 'F', 'Gm': 'Bb', 'Cm': 'Eb', 'Fm': 'Ab',
        'Bbm': 'Db', 'Ebm': 'Gb', 'Abm': 'Cb'
      };
      
      return relativeMajorNotes[this.code] || null;
    }
  }
  
  /**
   * Get position in the circle of fifths (0-11, where 0 is C major)
   * @returns {number} Position in circle of fifths
   */
  getCircleOfFifthsPosition() {
    // Return cached value if already calculated
    if (this._circlePosition !== null) {
      return this._circlePosition;
    }
    
    // Circle of fifths order for major keys
    const majorOrder = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    
    // For major tonalities, find position directly
    if (this.isMajor()) {
      this._circlePosition = majorOrder.indexOf(this.code);
      return this._circlePosition;
    }
    
    // For minor tonalities, find position of relative major
    const relativeMajor = this.getRelativeTonality();
    if (relativeMajor) {
      this._circlePosition = majorOrder.indexOf(relativeMajor) + 12; // +12 to distinguish minor
      return this._circlePosition;
    }
    
    // Fallback if not found
    return -1;
  }
  
  /**
   * Get the degree of a chord in this tonality
   * @param {string} chordName - Chord name
   * @returns {string|null} Degree (I, ii, iii, etc.) or null if not found
   */
  getChordDegree(chordName) {
    if (!chordCollection) return null;
    
    const chord = chordCollection.getChord(chordName);
    if (!chord) return null;
    
    const func = chord.getFunctionInTonality(this.code);
    return func ? func.degree : null;
  }
  
  /**
   * Create a string representation of the tonality
   * @returns {string} String representation
   */
  toString() {
    return `${this.code} (${this.name})`;
  }
}

/**
 * Collection of tonalities for managing and retrieving tonality information
 */
class TonalityCollection {
  /**
   * Create a new TonalityCollection
   */
  constructor() {
    this.tonalities = new Map();
    this._loaded = false;
  }
  
  /**
   * Add a tonality to the collection
   * @param {Tonality} tonality - Tonality to add
   * @returns {Tonality} The added tonality
   */
  addTonality(tonality) {
    this.tonalities.set(tonality.code, tonality);
    return tonality;
  }
  
  /**
   * Get a tonality by code
   * @param {string} code - Tonality code
   * @returns {Tonality|undefined} Tonality object or undefined if not found
   */
  getTonality(code) {
    return this.tonalities.get(code);
  }
  
  /**
   * Check if collection contains a tonality
   * @param {string} code - Tonality code
   * @returns {boolean} True if collection contains the tonality
   */
  hasTonality(code) {
    return this.tonalities.has(code);
  }
  
  /**
   * Remove a tonality from the collection
   * @param {string} code - Tonality code
   * @returns {boolean} True if removal was successful
   */
  removeTonality(code) {
    return this.tonalities.delete(code);
  }
  
  /**
   * Get all tonalities
   * @returns {Array} Array of all Tonality objects
   */
  getAllTonalities() {
    return Array.from(this.tonalities.values());
  }
  
  /**
   * Get major tonalities
   * @returns {Array} Array of major Tonality objects
   */
  getMajorTonalities() {
    return this.getAllTonalities().filter(tonality => tonality.isMajor());
  }
  
  /**
   * Get minor tonalities
   * @returns {Array} Array of minor Tonality objects
   */
  getMinorTonalities() {
    return this.getAllTonalities().filter(tonality => tonality.isMinor());
  }
  
  /**
   * Get tonalities sorted by circle of fifths
   * @returns {Array} Array of Tonality objects sorted by circle of fifths
   */
  getTonalitiesByCircleOfFifths() {
    return this.getAllTonalities().sort((a, b) => {
      return a.getCircleOfFifthsPosition() - b.getCircleOfFifthsPosition();
    });
  }
  
  /**
   * Load default tonalities
   */
  loadDefaultTonalities() {
    // Clear existing tonalities
    this.tonalities.clear();
    
    // Create and add major tonalities
    [
      { code: 'C', name: 'До мажор', signature: '0' },
      { code: 'G', name: 'Соль мажор', signature: '1#' },
      { code: 'D', name: 'Ре мажор', signature: '2#' },
      { code: 'A', name: 'Ля мажор', signature: '3#' },
      { code: 'E', name: 'Ми мажор', signature: '4#' },
      { code: 'B', name: 'Си мажор', signature: '5#' },
      { code: 'F#', name: 'Фа-диез мажор', signature: '6#' },
      { code: 'F', name: 'Фа мажор', signature: '1b' },
      { code: 'Bb', name: 'Си-бемоль мажор', signature: '2b' },
      { code: 'Eb', name: 'Ми-бемоль мажор', signature: '3b' },
      { code: 'Ab', name: 'Ля-бемоль мажор', signature: '4b' },
      { code: 'Db', name: 'Ре-бемоль мажор', signature: '5b' }
    ].forEach(data => {
      this.addTonality(new Tonality(
        data.code,
        data.name,
        'major',
        data.signature,
        this._generateMajorChords(data.code)
      ));
    });
    
    // Create and add minor tonalities
    [
      { code: 'Am', name: 'Ля минор', signature: '0' },
      { code: 'Em', name: 'Ми минор', signature: '1#' },
      { code: 'Bm', name: 'Си минор', signature: '2#' },
      { code: 'F#m', name: 'Фа-диез минор', signature: '3#' },
      { code: 'C#m', name: 'До-диез минор', signature: '4#' },
      { code: 'G#m', name: 'Соль-диез минор', signature: '5#' },
      { code: 'Dm', name: 'Ре минор', signature: '1b' },
      { code: 'Gm', name: 'Соль минор', signature: '2b' },
      { code: 'Cm', name: 'До минор', signature: '3b' },
      { code: 'Fm', name: 'Фа минор', signature: '4b' },
      { code: 'Bbm', name: 'Си-бемоль минор', signature: '5b' },
      { code: 'Ebm', name: 'Ми-бемоль минор', signature: '6b' }
    ].forEach(data => {
      this.addTonality(new Tonality(
        data.code,
        data.name,
        'minor',
        data.signature,
        this._generateMinorChords(data.code)
      ));
    });
    
    this._loaded = true;
    
    // Publish event for data initialization
    if (eventBus) {
      eventBus.publish('tonalitiesLoaded', {
        count: this.tonalities.size
      });
    }
    
    console.log(`Initialized ${this.tonalities.size} tonalities`);
  }
  
  /**
   * Check if tonalities have been loaded
   * @returns {boolean} True if tonalities are loaded
   */
  isLoaded() {
    return this._loaded;
  }
  
  /**
   * Initialize default tonalities if collection is empty
   */
  initializeIfEmpty() {
    if (this.tonalities.size === 0) {
      this.loadDefaultTonalities();
    }
  }
  
  /**
   * Initialize from legacy global data
   * @returns {boolean} True if initialization was successful
   */
  initializeFromGlobalData() {
    // Check if global data exists
    if (typeof window === 'undefined' || !window.TONALITY_DATA) {
      return false;
    }
    
    // Clear existing data
    this.tonalities.clear();
    
    // Convert global data to Tonality objects
    try {
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
      
      this._loaded = true;
      
      // Publish event for data initialization
      if (eventBus) {
        eventBus.publish('tonalitiesLoaded', {
          count: this.tonalities.size,
          source: 'legacy'
        });
      }
      
      console.log(`Initialized ${this.tonalities.size} tonalities from global data`);
      return true;
    } catch (error) {
      console.error('Error initializing tonalities from global data:', error);
      return false;
    }
  }
  
  /**
   * Generate chord set for major tonality
   * @param {string} rootNote - Root note
   * @returns {Object} Chord set with basic and seventh chords
   * @private
   */
  _generateMajorChords(rootNote) {
    // Helper function to generate chords based on scale degrees
    const generateChords = (root, patterns) => {
      const notes = this._getMajorScaleNotes(root);
      return patterns.map((pattern, i) => {
        const note = notes[i];
        return pattern.replace('*', note);
      });
    };
    
    // Chord patterns for major key
    const basicPatterns = ['*', '*m', '*m', '*', '*', '*m', '*dim'];
    const seventhPatterns = ['*maj7', '*m7', '*m7', '*maj7', '*7', '*m7', '*m7b5'];
    
    return {
      basic: generateChords(rootNote, basicPatterns),
      seventh: generateChords(rootNote, seventhPatterns)
    };
  }
  
  /**
   * Generate chord set for minor tonality
   * @param {string} minorCode - Minor tonality code (e.g., "Am")
   * @returns {Object} Chord set with basic and seventh chords
   * @private
   */
  _generateMinorChords(minorCode) {
    // Helper function to generate chords based on scale degrees
    const generateChords = (minorRoot, patterns) => {
      // Extract root note from minor code (e.g., "Am" -> "A")
      const root = minorRoot.slice(0, -1);
      const notes = this._getMinorScaleNotes(root);
      return patterns.map((pattern, i) => {
        const note = notes[i];
        return pattern.replace('*', note);
      });
    };
    
    // Chord patterns for natural minor key
    const basicPatterns = ['*m', '*dim', '*', '*m', '*m', '*', '*'];
    const seventhPatterns = ['*m7', '*m7b5', '*maj7', '*m7', '*m7', '*maj7', '*7'];
    
    return {
      basic: generateChords(minorCode, basicPatterns),
      seventh: generateChords(minorCode, seventhPatterns)
    };
  }
  
  /**
   * Get major scale notes
   * @param {string} rootNote - Root note
   * @returns {Array} Array of 7 notes in the major scale
   * @private
   */
  _getMajorScaleNotes(rootNote) {
    // Simplified version - in a real implementation, this would calculate
    // based on actual music theory intervals, but for simplicity, we'll use mapping
    const majorScales = {
      'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
      'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
      'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
      'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
      'B': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
      'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
      
      'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
      'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
      'Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
      'Ab': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
      'Db': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C']
    };
    
    return majorScales[rootNote] || [];
  }
  
  /**
   * Get minor scale notes
   * @param {string} rootNote - Root note
   * @returns {Array} Array of 7 notes in the natural minor scale
   * @private
   */
  _getMinorScaleNotes(rootNote) {
    // Simplified version - in a real implementation, this would calculate
    // based on actual music theory intervals
    const minorScales = {
      'A': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      'E': ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
      'B': ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
      'F#': ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
      'C#': ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
      'G#': ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
      
      'D': ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
      'G': ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
      'C': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
      'F': ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
      'Bb': ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
      'Eb': ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db']
    };
    
    return minorScales[rootNote] || [];
  }
}

// Create and export singleton instance
const tonalityCollection = new TonalityCollection();

// Initialize if window is defined (browser environment)
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Try to initialize from global data first, fallback to defaults
      if (!tonalityCollection.initializeFromGlobalData()) {
        tonalityCollection.loadDefaultTonalities();
      }
    });
  } else {
    // Document already loaded, initialize now
    if (!tonalityCollection.initializeFromGlobalData()) {
      tonalityCollection.loadDefaultTonalities();
    }
  }
}

export { Tonality, tonalityCollection };