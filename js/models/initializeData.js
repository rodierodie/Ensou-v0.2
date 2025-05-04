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
 * @returns {Promise} Promise that resolves when initialization is complete
 */
export default async function initializeDataModels() {
  console.log('Initializing data models...');
  
  // First check if we have data already in collections
  if (chordCollection.getAllChords().length > 0 && tonalityCollection.getAllTonalities().length > 0) {
    console.log('Data models already initialized');
    return;
  }
  
  try {
    // Load default chord and tonality data if no data exists
    await loadDefaultData();
    
    // Log initialization complete
    console.log(`Initialized ${chordCollection.getAllChords().length} chords`);
    console.log(`Initialized ${tonalityCollection.getAllTonalities().length} tonalities`);
    
    // Publish event for data initialization complete
    eventBus.publish('dataModelsInitialized', {
      chordsCount: chordCollection.getAllChords().length,
      tonalitiesCount: tonalityCollection.getAllTonalities().length
    });
    
    return true;
  } catch (error) {
    console.error('Error initializing data models:', error);
    throw error;
  }
}

/**
 * Load default data into collections
 * This is the migration path from global objects to proper models
 * @returns {Promise} Promise that resolves when data is loaded
 */
async function loadDefaultData() {
  try {
    // Try to load from global objects first (for backward compatibility during migration)
    let dataLoaded = false;
    
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
        
        console.log(`Migrated ${chordCollection.getAllChords().length} chords from global CHORD_DATA`);
        dataLoaded = true;
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
        
        console.log(`Migrated ${tonalityCollection.getAllTonalities().length} tonalities from global TONALITY_DATA`);
        dataLoaded = true;
      }
    }
    
    // If no data was loaded from global objects, initialize with default data
    if (!dataLoaded) {
      console.log('Initializing with default data');
      await initializeDefaultData();
    }
    
    return true;
  } catch (error) {
    console.error('Error loading default data:', error);
    throw error;
  }
}

/**
 * Initialize default data if no data is available
 * @returns {Promise} Promise that resolves when default data is initialized
 */
async function initializeDefaultData() {
  try {
    // Initialize chords and tonalities
    initializeDefaultChords();
    initializeDefaultTonalities();
    
    return true;
  } catch (error) {
    console.error('Error initializing default data:', error);
    throw error;
  }
}

/**
 * Initialize default chords if no data is available
 */
function initializeDefaultChords() {
  // Let's define a minimum set of chords for each tonality

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
  
  // D minor chord
  const dMinor = new Chord(
    'Dm',
    ['D4', 'F4', 'A4'],
    'Ре минор',
    'Минорное трезвучие',
    {
      'C': { function: 'subdominant', degree: 'II', label: 'S' },
      'Dm': { function: 'tonic', degree: 'i', label: 'T' }
    }
  );
  chordCollection.addChord(dMinor);
  
  // E minor chord
  const eMinor = new Chord(
    'Em',
    ['E4', 'G4', 'B4'],
    'Ми минор',
    'Минорное трезвучие',
    {
      'C': { function: 'mediant', degree: 'III', label: 'M' },
      'Em': { function: 'tonic', degree: 'i', label: 'T' }
    }
  );
  chordCollection.addChord(eMinor);
  
  // F Major chord
  const fMajor = new Chord(
    'F',
    ['F4', 'A4', 'C5'],
    'Фа мажор',
    'Мажорное трезвучие',
    {
      'C': { function: 'subdominant', degree: 'IV', label: 'S' },
      'F': { function: 'tonic', degree: 'I', label: 'T' }
    }
  );
  chordCollection.addChord(fMajor);
  
  // G Major chord
  const gMajor = new Chord(
    'G',
    ['G4', 'B4', 'D5'],
    'Соль мажор',
    'Мажорное трезвучие',
    {
      'C': { function: 'dominant', degree: 'V', label: 'D' },
      'G': { function: 'tonic', degree: 'I', label: 'T' }
    }
  );
  chordCollection.addChord(gMajor);
  
  // A minor chord
  const aMinor = new Chord(
    'Am',
    ['A4', 'C5', 'E5'],
    'Ля минор',
    'Минорное трезвучие',
    {
      'C': { function: 'submediant', degree: 'VI', label: 'Sm' },
      'Am': { function: 'tonic', degree: 'i', label: 'T' }
    }
  );
  chordCollection.addChord(aMinor);
  
  // B diminished chord
  const bDiminished = new Chord(
    'Bdim',
    ['B4', 'D5', 'F5'],
    'Си уменьшенный',
    'Уменьшенное трезвучие',
    {
      'C': { function: 'leading tone', degree: 'VII', label: 'L' }
    }
  );
  chordCollection.addChord(bDiminished);
  
  // Add seventh chords
  
  // C Major 7
  const cMaj7 = new Chord(
    'Cmaj7',
    ['C4', 'E4', 'G4', 'B4'],
    'До мажор септаккорд',
    'Большой мажорный септаккорд',
    {
      'C': { function: 'tonic', degree: 'Imaj7', label: 'Tmaj7' }
    }
  );
  chordCollection.addChord(cMaj7);
  
  // D minor 7
  const dMin7 = new Chord(
    'Dm7',
    ['D4', 'F4', 'A4', 'C5'],
    'Ре минор септаккорд',
    'Малый минорный септаккорд',
    {
      'C': { function: 'supertonic', degree: 'IIm7', label: 'IIm7' }
    }
  );
  chordCollection.addChord(dMin7);
  
  // G dominant 7
  const g7 = new Chord(
    'G7',
    ['G4', 'B4', 'D5', 'F5'],
    'Соль доминантсептаккорд',
    'Малый мажорный септаккорд',
    {
      'C': { function: 'dominant', degree: 'V7', label: 'D7' }
    }
  );
  chordCollection.addChord(g7);
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
  
  // F Major
  const fMajor = new Tonality(
    'F',
    'Фа мажор',
    'major',
    '1b',
    {
      basic: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
      seventh: ['Fmaj7', 'Gm7', 'Am7', 'Bbmaj7', 'C7', 'Dm7', 'Em7b5']
    }
  );
  tonalityCollection.addTonality(fMajor);
  
  // D Minor
  const dMinor = new Tonality(
    'Dm',
    'Ре минор',
    'minor',
    '1b',
    {
      basic: ['Dm', 'Edim', 'F', 'Gm', 'Am', 'Bb', 'C'],
      seventh: ['Dm7', 'Em7b5', 'Fmaj7', 'Gm7', 'Am7', 'Bbmaj7', 'C7']
    }
  );
  tonalityCollection.addTonality(dMinor);
}

/**
 * Create proxy objects for global access
 * This maintains backward compatibility while migrating to model collections
 */
export function createGlobalProxies() {
  if (typeof window === 'undefined') return;
  
  // Create proxy for CHORD_DATA
  if (!window.CHORD_DATA) {
    window.CHORD_DATA = createChordDataProxy();
  }
  
  // Create proxy for TONALITY_DATA
  if (!window.TONALITY_DATA) {
    window.TONALITY_DATA = createTonalityDataProxy();
  }
  
  console.log('Created global data proxies for backward compatibility');
}

/**
 * Create proxy for chord data
 * @returns {Object} Proxy object for chord data
 */
function createChordDataProxy() {
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
  
  return new Proxy(chordData, {
    get(target, property) {
      // Check if property exists in target
      if (property in target) {
        return target[property];
      }
      
      // Try to get from chord collection
      const chord = chordCollection.getChord(property);
      if (chord) {
        // Add to proxy target
        target[property] = {
          notes: chord.notes,
          fullName: chord.fullName,
          description: chord.description,
          functions: chord.functions
        };
        return target[property];
      }
      
      return undefined;
    }
  });
}

/**
 * Create proxy for tonality data
 * @returns {Object} Proxy object for tonality data
 */
function createTonalityDataProxy() {
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
  
  return new Proxy(tonalityData, {
    get(target, property) {
      // Check if property exists in target
      if (property in target) {
        return target[property];
      }
      
      // Try to get from tonality collection
      const tonality = tonalityCollection.getTonality(property);
      if (tonality) {
        // Add to proxy target
        target[property] = {
          name: tonality.name,
          type: tonality.type,
          signature: tonality.signature,
          chords: tonality.chords
        };
        return target[property];
      }
      
      return undefined;
    }
  });
}