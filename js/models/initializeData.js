// js/models/initializeData.js
import { tonalityCollection } from './tonality.js';
import { chordCollection } from './chord.js';

/**
 * Initialize data models from legacy global data
 */
export default function initializeDataModels() {
  console.log('Initializing data models...');
  
  // Handle case where legacy data isn't available
  if (!window.TONALITY_DATA || !window.CHORD_DATA) {
    console.warn('Legacy data not found, initializing with defaults');
    initializeWithDefaults();
    return;
  }
  
  // Initialize tonalities
  tonalityCollection.initializeDefaultTonalities();
  
  // Initialize chords
  chordCollection.initializeDefaultChords();
  
  console.log('Data models initialized');
}

/**
 * Initialize with default minimal data if legacy data isn't available
 */
function initializeWithDefaults() {
  // Create minimal tonality data
  window.TONALITY_DATA = {
    'C': {
      name: 'C major',
      type: 'major',
      signature: '0',
      chords: {
        basic: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
        seventh: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5']
      }
    },
    'Am': {
      name: 'A minor',
      type: 'minor',
      signature: '0',
      chords: {
        basic: ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'],
        seventh: ['Am7', 'Bm7b5', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7']
      }
    }
  };
  
  // Create minimal chord data
  window.CHORD_DATA = {
    'C': {
      notes: ['C4', 'E4', 'G4'],
      fullName: 'C major',
      description: 'Major triad',
      functions: {
        'C': { function: 'tonic', degree: 'I', label: 'T' },
        'F': { function: 'dominant', degree: 'V', label: 'D' },
        'G': { function: 'subdominant', degree: 'IV', label: 'S' }
      }
    },
    'Am': {
      notes: ['A3', 'C4', 'E4'],
      fullName: 'A minor',
      description: 'Minor triad',
      functions: {
        'C': { function: 'subdominant', degree: 'vi', label: 'S' },
        'Am': { function: 'tonic', degree: 'i', label: 'T' }
      }
    }
  };
  
  // Initialize models with this default data
  tonalityCollection.initializeDefaultTonalities();
  chordCollection.initializeDefaultChords();
}