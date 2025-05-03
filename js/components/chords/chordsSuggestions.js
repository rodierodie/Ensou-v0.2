// js/components/chords/chordSuggestions.js
import store from '../../core/store.js';
import { chordCollection } from '../../models/chord.js';

class ChordSuggestions {
  constructor() {
    // База данных вероятностей переходов между функциями
    this.harmonicTransitions = {
      "tonic": { 
        "subdominant": 0.4, 
        "dominant": 0.35, 
        "tonic": 0.25 
      },
      "subdominant": { 
        "dominant": 0.5, 
        "tonic": 0.3, 
        "subdominant": 0.2 
      },
      "dominant": { 
        "tonic": 0.7, 
        "subdominant": 0.2, 
        "dominant": 0.1 
      }
    };
    
    // Текущие предложения
    this.currentSuggestions = [];
    
    // Слушаем изменения в последовательности
    document.addEventListener('sequenceChanged', this.updateSuggestions.bind(this));
  }
  
  /**
   * Получение предлагаемых аккордов на основе последнего аккорда
   * @param {string} lastChordName - Название последнего аккорда
   * @param {string} tonality - Текущая тональность
   * @returns {Array} Предлагаемые аккорды с уровнем уверенности
   */
  getSuggestedChords(lastChordName, tonality) {
    // Получаем данные о последнем аккорде
    const lastChord = chordCollection.getChord(lastChordName);
    
    if (!lastChord || !lastChord.getFunctionInTonality(tonality)) {
      return [];
    }
    
    // Определяем функцию последнего аккорда
    const lastFunction = lastChord.getFunctionInTonality(tonality).function;
    
    // Получаем вероятности переходов для этой функции
    const transitions = this.harmonicTransitions[lastFunction];
    if (!transitions) {
      return [];
    }
    
    // Сортируем функции по вероятности
    const sortedFunctions = Object.keys(transitions).sort(
      (a, b) => transitions[b] - transitions[a]
    );
    
    // Собираем подходящие аккорды для каждой функции
    const suggestedChords = [];
    
    // Получаем все аккорды в текущей тональности
    const chordsInTonality = chordCollection.getChordsByTonality(tonality);
    
    // Для каждой функции находим соответствующие аккорды
    sortedFunctions.forEach(targetFunction => {
      const confidenceLevel = transitions[targetFunction];
      
      // Находим аккорды с нужной функцией
      const matchingChords = chordCollection.getChordsByFunction(tonality, targetFunction);
      
      matchingChords.forEach(chord => {
        // Пропускаем текущий аккорд
        if (chord.name === lastChordName) return;
        
        // Добавляем аккорд в предложения
        suggestedChords.push({
          name: chord.name,
          function: targetFunction,
          confidence: confidenceLevel
        });
      });
    });
    
    return suggestedChords;
  }
  
  /**
   * Обновление предложений аккордов
   */
  updateSuggestions() {
    // Получаем последовательность
    const sequence = store.getSequence();
    
    // Если последовательность пуста, очищаем предложения
    if (sequence.length === 0) {
      this.currentSuggestions = [];
      this.publishSuggestions();
      return;
    }
    
    // Находим последний аккорд (пропускаем паузы)
    let lastChord = null;
    for (let i = sequence.length - 1; i >= 0; i--) {
      if (sequence[i] !== 'PAUSE' && sequence[i] !== 'BLOCK_DIVIDER') {
        lastChord = sequence[i];
        break;
      }
    }
    
    // Если не найден аккорд, очищаем предложения
    if (!lastChord) {
      this.currentSuggestions = [];
      this.publishSuggestions();
      return;
    }
    
    // Получаем предложения
    const tonality = store.getCurrentTonality();
    const suggestions = this.getSuggestedChords(lastChord, tonality);
    
    // Обновляем текущие предложения
    this.currentSuggestions = suggestions;
    
    // Оповещаем о новых предложениях
    this.publishSuggestions();
  }
  
  /**
   * Публикация события с предложениями
   */
  publishSuggestions() {
    // Создаем событие с предложениями
    const event = new CustomEvent('chordSuggestionsUpdated', {
      detail: {
        suggestions: this.currentSuggestions
      }
    });
    
    // Публикуем событие
    document.dispatchEvent(event);
  }
  
  /**
   * Получение текущих предложений
   * @returns {Array} Текущие предложения
   */
  getCurrentSuggestions() {
    return this.currentSuggestions;
  }
}

// Создаем экземпляр сервиса
const chordSuggestions = new ChordSuggestions();

export default chordSuggestions;