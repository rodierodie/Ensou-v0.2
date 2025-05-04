/**
 * initializeData.js
 * Module for initializing application data models
 */

import { Chord, chordCollection } from './chord.js';
import { Tonality, tonalityCollection } from './tonality.js';
import eventBus from '../core/eventBus.js';

/**
 * Initialize data models
 * This replaces the global window.CHORD_DATA and window.TONALITY_DATA objects
 */
export default function initializeDataModels() {
  console.log('Initializing data models...');
  
  // Load chord and tonality data 
  // (could be loaded from local JSON files or an API in a more sophisticated implementation)
  
  // First check if we have data already in collections
  if (chordCollection.getAllChords().length > 0 && tonalityCollection.getAllTonalities().length > 0) {
    console.log('Data models already initialized');
    return;
  }
  
  // Load default chord and tonality data if no data exists
  loadDefaultData();
  
  // Log initialization complete
  console.log(`Initialized ${chordCollection.getAllChords().length} chords`);
  console.log(`Initialized ${tonalityCollection.getAllTonalities().length} tonalities`);
  
  // Publish event for data initialization complete
  eventBus.publish('dataModelsInitialized', {
    chordsCount: chordCollection.getAllChords().length,
    tonalitiesCount: tonalityCollection.getAllTonalities().length
  });
}

/**
 * Load default data into collections
 * This is the migration path from global objects to proper models
 */
function loadDefaultData() {
  // Try to load from global objects first (for backward compatibility during migration)
  if (typeof window !== 'undefined') {
    // Migrate from window.CHORD_DATA if it exists
    if (window.CHORD_DATA) {
      Object.entries(window.CHORD_DATA).forEach(([name, data]) => {
        const chord = new Chord(
          name,
          data.notes,
          data.fullName,
          data.description,
          data.functions
        );
        chordCollection.addChord(chord);
      });
      
      // Flag global object as deprecated (comment out if you want to keep it during migration)
      // window.CHORD_DATA = undefined;
      console.warn('window.CHORD_DATA is deprecated. Use chordCollection instead.');
    }
    
    // Migrate from window.TONALITY_DATA if it exists
    if (window.TONALITY_DATA) {
      Object.entries(window.TONALITY_DATA).forEach(([code, data]) => {
        const tonality = new Tonality(
          code,
          data.name,
          data.type,
          data.signature,
          data.chords
        );
        tonalityCollection.addTonality(tonality);
      });
      
      // Flag global object as deprecated (comment out if you want to keep it during migration)
      // window.TONALITY_DATA = undefined;
      console.warn('window.TONALITY_DATA is deprecated. Use tonalityCollection instead.');
    }
  }
  
  // If no data was loaded from global objects, initialize with default data
  if (chordCollection.getAllChords().length === 0) {
    initializeDefaultChords();
  }
  
  if (tonalityCollection.getAllTonalities().length === 0) {
    initializeDefaultTonalities();
  }
}

/**
 * Initialize default chords if no data is available
 */
function initializeDefaultChords() {
  // C Major chords
  const cMajor = new Chord(
    'C',
    ['C4', 'E4', 'G4'],
    'До мажор',
    'Мажорное трезвучие',
    {
      'C': { function: 'tonic', degree: 'I', label: 'T' },
      'F': { function: 'dominant', degree: 'V', label: 'D' },
      'G': { function: 'subdominant', degree: 'IV', label: 'S' }
    }
  );
  chordCollection.addChord(cMajor);
  
  const cMinor = new Chord(
    'Cm',
    ['C4', 'Eb4', 'G4'],
    'До минор',
    'Минорное трезвучие',
    {
      'Cm': { function: 'tonic', degree: 'i', label: 'T' },
      'Eb': { function: 'relative major', degree: 'III', label: 'R' }
    }
  );
  chordCollection.addChord(cMinor);
  
  // G Major chords
  const gMajor = new Chord(
    'G',
    ['G3', 'B3', 'D4'],
    'Соль мажор',
    'Мажорное трезвучие',
    {
      'G': { function: 'tonic', degree: 'I', label: 'T' },
      'C': { function: 'subdominant', degree: 'IV', label: 'S' },
      'D': { function: 'dominant', degree: 'V', label: 'D' }
    }
  );
  chordCollection.addChord(gMajor);
  
  // D Minor chords
  const dMinor = new Chord(
    'Dm',
    ['D4', 'F4', 'A4'],
    'Ре минор',
    'Минорное трезвучие',
    {
      'Dm': { function: 'tonic', degree: 'i', label: 'T' },
      'F': { function: 'relative major', degree: 'III', label: 'R' }
    }
  );
  chordCollection.addChord(dMinor);
  
  // Add more default chords as needed
  // ...
}

/**
 * Initialize default tonalities if no data is available
 */
function initializeDefaultTonalities() {
  // C Major
  const cMajor = new Tonality(
    'C',
    'До мажор',
    'major',
    '0',
    {
      basic: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
      seventh: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5']
    }
  );
  tonalityCollection.addTonality(cMajor);
  
  // A Minor
  const aMinor = new Tonality(
    'Am',
    'Ля минор',
    'minor',
    '0',
    {
      basic: ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'],
      seventh: ['Am7', 'Bm7b5', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7']
    }
  );
  tonalityCollection.addTonality(aMinor);
  
  // G Major
  const gMajor = new Tonality(
    'G',
    'Соль мажор',
    'major',
    '1#',
    {
      basic: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
      seventh: ['Gmaj7', 'Am7', 'Bm7', 'Cmaj7', 'D7', 'Em7', 'F#m7b5']
    }
  );
  tonalityCollection.addTonality(gMajor);
  
  // E Minor
  const eMinor = new Tonality(
    'Em',
    'Ми минор',
    'minor',
    '1#',
    {
      basic: ['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D'],
      seventh: ['Em7', 'F#m7b5', 'Gmaj7', 'Am7', 'Bm7', 'Cmaj7', 'D7']
    }
  );
  tonalityCollection.addTonality(eMinor);
  
  // Add more default tonalities as needed
  // ...
}

/**
 * Create proxy for global objects during transition
 * This maintains backward compatibility while migrating to model collections
 */
export function createGlobalProxies() {
  if (typeof window === 'undefined') return;
  
  // Create proxy for CHORD_DATA
  if (!window.CHORD_DATA) {
    Object.defineProperty(window, 'CHORD_DATA', {
      get: function() {
        // Convert collection to format expected by legacy code
        const chordData = {};
        chordCollection.getAllChords().forEach(chord => {
          chordData[chord.name] = {
            notes: chord.notes,
            fullName: chord.fullName,
            description: chord.description,
            functions: chord.functions
          };
        });
        
        // Log deprecation warning in development mode
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Access to deprecated window.CHORD_DATA detected');
        }
        
        return chordData;
      },
      configurable: true
    });
  }
  
  // Create proxy for TONALITY_DATA
  if (!window.TONALITY_DATA) {
    Object.defineProperty(window, 'TONALITY_DATA', {
      get: function() {
        // Convert collection to format expected by legacy code
        const tonalityData = {};
        tonalityCollection.getAllTonalities().forEach(tonality => {
          tonalityData[tonality.code] = {
            name: tonality.name,
            type: tonality.type,
            signature: tonality.signature,
            chords: tonality.chords
          };
        });
        
        // Log deprecation warning in development mode
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Access to deprecated window.TONALITY_DATA detected');
        }
        
        return tonalityData;
      },
      configurable: true
    });
  }
}