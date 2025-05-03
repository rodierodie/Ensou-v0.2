// js/models/initializeData.js
import { tonalityCollection } from './tonality.js';
import { chordCollection } from './chord.js';

/**
 * Инициализация моделей данных из существующих глобальных данных
 */
function initializeDataModels() {
  console.log('Initializing data models from legacy data...');
  
  // Инициализация тональностей
  if (window.TONALITY_DATA) {
    initializeTonalities();
  } else {
    console.warn('Legacy TONALITY_DATA not found, cannot initialize tonalities');
  }
  
  // Инициализация аккордов
  if (window.CHORD_DATA) {
    initializeChords();
  } else {
    console.warn('Legacy CHORD_DATA not found, cannot initialize chords');
  }
  
  console.log('Data models initialization complete');
}

/**
 * Инициализация тональностей
 */
function initializeTonalities() {
  // Импортируем коллекцию тональностей
  tonalityCollection.initializeDefaultTonalities();
  
  console.log(`Initialized ${tonalityCollection.getAllTonalities().length} tonalities`);
}

/**
 * Инициализация аккордов
 */
function initializeChords() {
  // Импортируем коллекцию аккордов
  chordCollection.initializeDefaultChords();
  
  // Генерируем недостающие аккорды для всех тональностей
  Object.entries(window.TONALITY_DATA).forEach(([tonalityCode, tonalityData]) => {
    chordCollection.generateMissingChords(tonalityCode, tonalityData);
  });
  
  console.log(`Initialized ${chordCollection.getAllChords().length} chords`);
}

export default initializeDataModels;