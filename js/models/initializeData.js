// js/models/initializeData.js
import { tonalityCollection } from './tonality.js';
import { chordCollection } from './chord.js';

export default function initializeDataModels() {
    console.log('Инициализация моделей данных...');
    
    // Проверка на наличие глобальных данных
    if (!window.TONALITY_DATA || !window.CHORD_DATA) {
        console.warn('Глобальные данные не найдены, инициализация с дефолтными данными');
        initializeWithDefaults();
        return;
    }
    
    // Инициализация тональностей
    tonalityCollection.initializeDefaultTonalities();
    
    // Инициализация аккордов
    chordCollection.initializeDefaultChords();
    
    console.log('Модели данных инициализированы');
}

// Инициализация минимальными дефолтными данными
function initializeWithDefaults() {
    // Создаем минимальные данные о тональностях
    window.TONALITY_DATA = {
        'C': {
            name: 'До мажор',
            type: 'major',
            signature: '0',
            chords: {
                basic: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
                seventh: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5']
            }
        },
        'Am': {
            name: 'Ля минор',
            type: 'minor',
            signature: '0',
            chords: {
                basic: ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'],
                seventh: ['Am7', 'Bm7b5', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7']
            }
        }
    };
    
    // Создаем минимальные данные об аккордах
    window.CHORD_DATA = {
        'C': {
            notes: ['C4', 'E4', 'G4'],
            fullName: 'До мажор',
            description: 'Мажорное трезвучие',
            functions: {
                'C': { function: 'tonic', degree: 'I', label: 'T' },
                'F': { function: 'dominant', degree: 'V', label: 'D' },
                'G': { function: 'subdominant', degree: 'IV', label: 'S' }
            }
        },
        'Am': {
            notes: ['A3', 'C4', 'E4'],
            fullName: 'Ля минор',
            description: 'Минорное трезвучие',
            functions: {
                'C': { function: 'tonic', degree: 'vi', label: 'T' },
                'Am': { function: 'tonic', degree: 'i', label: 'T' }
            }
        }
    };
    
    // Инициализация моделей с этими данными
    tonalityCollection.initializeDefaultTonalities();
    chordCollection.initializeDefaultChords();
}