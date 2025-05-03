/**
 * chord-suggestions.js
 * Модуль для предложения вариантов следующего аккорда на основе музыкальной теории
 */

// База данных вероятностей переходов между функциями
const harmonicTransitions = {
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

// Глобальный объект для хранения текущих предложенных аккордов
let currentSuggestions = [];

/**
 * Получение предлагаемых аккордов на основе последнего аккорда и текущей тональности
 * @param {string} lastChordName - Название последнего аккорда
 * @param {string} tonality - Текущая тональность
 * @returns {Array} - Массив предлагаемых аккордов с информацией о вероятности
 */
function getSuggestedChords(lastChordName, tonality) {
  // Получаем данные о последнем аккорде
  const lastChord = window.CHORD_DATA[lastChordName];
  if (!lastChord || !lastChord.functions[tonality]) {
    console.warn('Нет данных о функции аккорда в текущей тональности');
    return [];
  }
  
  // Определяем функцию последнего аккорда
  const lastFunction = lastChord.functions[tonality].function;
  
  // Получаем вероятности переходов для этой функции
  const transitions = harmonicTransitions[lastFunction];
  if (!transitions) {
    console.warn('Нет данных о переходах для функции:', lastFunction);
    return [];
  }
  
  // Сортируем функции по вероятности перехода (от высокой к низкой)
  const sortedFunctions = Object.keys(transitions).sort(
    (a, b) => transitions[b] - transitions[a]
  );
  
  // Собираем подходящие аккорды для каждой функции
  const suggestedChords = [];
  const chordsInTonality = [
    ...window.TONALITY_DATA[tonality].chords.basic,
    ...window.TONALITY_DATA[tonality].chords.seventh
  ];
  
  // Для каждой функции находим соответствующие аккорды
  sortedFunctions.forEach(targetFunction => {
    const confidenceLevel = transitions[targetFunction];
    
    // Находим все аккорды с данной функцией в текущей тональности
    chordsInTonality.forEach(chordName => {
      // Пропускаем текущий аккорд
      if (chordName === lastChordName) return;
      
      const chord = window.CHORD_DATA[chordName];
      if (chord && chord.functions[tonality] && 
          chord.functions[tonality].function === targetFunction) {
        // Добавляем аккорд с информацией о вероятности
        suggestedChords.push({
          name: chordName,
          function: targetFunction,
          confidence: confidenceLevel
        });
      }
    });
  });
  
  return suggestedChords;
}

/**
 * Подсветка предлагаемых аккордов в интерфейсе
 * @param {Array} suggestedChords - Массив предлагаемых аккордов
 */
function highlightSuggestedChords(suggestedChords) {
  // Сначала сбрасываем все подсветки и удаляем иконки функций
  document.querySelectorAll('.chord-button').forEach(button => {
    button.classList.remove('suggested-high', 'suggested-medium', 'suggested-low');
    button.removeAttribute('title');
    
    // Удаляем иконку функции, если она есть
    const functionIcon = button.querySelector('.suggestion-function-icon');
    if (functionIcon) {
      functionIcon.remove();
    }
  });
  
  // Затем добавляем подсветку для предлагаемых аккордов
  suggestedChords.forEach(suggestion => {
    const buttons = document.querySelectorAll(`.chord-button[data-chord="${suggestion.name}"]`);
    
    // Определяем класс подсветки в зависимости от уверенности
    let highlightClass = '';
    
    if (suggestion.confidence > 0.5) {
      highlightClass = 'suggested-high';
    } else if (suggestion.confidence > 0.3) {
      highlightClass = 'suggested-medium';
    } else {
      highlightClass = 'suggested-low';
    }
    
    // Создаем иконку функции
    const iconClass = getFunctionIconClass(suggestion.function);
    const iconLabel = getFunctionIconLabel(suggestion.function);
    
    // Добавляем подсветку и иконку функции в кнопку
    buttons.forEach(button => {
      button.classList.add(highlightClass);
      
      // Создаем и добавляем иконку функции
      const functionIcon = document.createElement('span');
      functionIcon.className = `function-icon ${iconClass} suggestion-function-icon`;
      functionIcon.textContent = iconLabel;
      
      // Добавляем тултип с информацией о функции
      functionIcon.title = getFunctionLabel(suggestion.function);
      
      // Добавляем иконку в кнопку
      button.appendChild(functionIcon);
      
      // Добавляем подсказку при наведении на кнопку
      button.title = `${suggestion.name}`;
    });
  });
  
  // Обновляем иконки функций в секвенсоре
  updateSequencerFunctionIcons();
}

/**
 * Обновление иконок функций в секвенсоре
 */
function updateSequencerFunctionIcons() {
  // Получаем все слоты секвенсора
  const sequenceSlots = document.querySelectorAll('.sequence-slot');
  
  // Сначала удаляем все ранее добавленные иконки
  sequenceSlots.forEach(slot => {
    const functionIcon = slot.querySelector('.sequence-function-icon');
    if (functionIcon) {
      functionIcon.remove();
    }
  });
  
  // Для каждого слота добавляем иконку функции
  sequenceSlots.forEach(slot => {
    const chordName = slot.querySelector('.slot-chord')?.textContent;
    
    // Пропускаем паузы и пустые слоты
    if (!chordName || chordName === '𝄽') return;
    
    // Получаем текущую тональность
    const currentTonality = window.UI.getCurrentTonality();
    
    // Получаем информацию об аккорде
    const chord = window.CHORD_DATA[chordName];
    if (!chord || !chord.functions[currentTonality]) return;
    
    // Получаем функцию аккорда
    const chordFunction = chord.functions[currentTonality].function;
    
    // Создаем иконку функции
    const iconClass = getFunctionIconClass(chordFunction);
    const iconLabel = getFunctionIconLabel(chordFunction);
    
    const functionIcon = document.createElement('span');
    functionIcon.className = `function-icon ${iconClass} sequence-function-icon`;
    functionIcon.textContent = iconLabel;
    
    // Добавляем тултип с информацией о функции
    functionIcon.title = getFunctionLabel(chordFunction);
    
    // Добавляем иконку в слот
    slot.appendChild(functionIcon);
  });
}

/**
 * Получение класса для иконки функции
 * @param {string} functionName - Название функции
 * @returns {string} - CSS класс для иконки
 */
function getFunctionIconClass(functionName) {
  switch(functionName) {
    case 'tonic': return 'tonic';
    case 'dominant': return 'dominant';
    case 'subdominant': return 'subdominant';
    default: return '';
  }
}

/**
 * Получение метки для иконки функции
 * @param {string} functionName - Название функции
 * @returns {string} - Текст для иконки
 */
function getFunctionIconLabel(functionName) {
  switch(functionName) {
    case 'tonic': return 'T';
    case 'dominant': return 'D';
    case 'subdominant': return 'S';
    default: return '?';
  }
}

/**
 * Получение человекочитаемой метки для функции аккорда
 * @param {string} functionName - Название функции
 * @returns {string} - Метка для функции
 */
function getFunctionLabel(functionName) {
  switch(functionName) {
    case 'tonic': return 'Тоника';
    case 'dominant': return 'Доминанта';
    case 'subdominant': return 'Субдоминанта';
    default: return functionName;
  }
}

/**
 * Получение последнего аккорда из последовательности
 * @returns {string|null} - Название последнего аккорда или null
 */
function getLastChordFromSequence() {
  const sequence = window.Sequencer.getSequence();
  if (!sequence || sequence.length === 0) return null;
  
  // Пропускаем паузы в конце последовательности
  for (let i = sequence.length - 1; i >= 0; i--) {
    if (sequence[i] !== 'PAUSE') {
      return sequence[i];
    }
  }
  
  return null;
}

/**
 * Основная функция для обновления подсказок
 */
function updateChordSuggestions() {
  const lastChord = getLastChordFromSequence();
  if (!lastChord) {
    // Если последовательность пуста, сбрасываем подсветку и очищаем подсказку
    document.querySelectorAll('.chord-button').forEach(button => {
      button.classList.remove('suggested-high', 'suggested-medium', 'suggested-low');
      button.removeAttribute('title');
      
      // Удаляем иконку функции, если она есть
      const functionIcon = button.querySelector('.suggestion-function-icon');
      if (functionIcon) {
        functionIcon.remove();
      }
    });
    
    // Удаляем иконки функций в секвенсоре
    document.querySelectorAll('.sequence-function-icon').forEach(icon => {
      icon.remove();
    });
    
    currentSuggestions = [];
    return;
  }
  
  const currentTonality = window.UI.getCurrentTonality();
  const suggestedChords = getSuggestedChords(lastChord, currentTonality);
  
  highlightSuggestedChords(suggestedChords);
  
  // Сохраняем текущие предложения
  currentSuggestions = suggestedChords;
}

/**
 * Инициализация модуля подсказок аккордов
 */
function initChordSuggestions() {
  // Удаляем элемент для теоретической подсказки, если он есть
  const hintElement = document.getElementById('theory-hint');
  if (hintElement && hintElement.parentNode) {
    hintElement.parentNode.removeChild(hintElement);
  }
  
  // Обновление подсказок при изменении последовательности
  document.addEventListener('sequenceChanged', function() {
    updateChordSuggestions();
  });
  
  // Слушаем обновления UI для обновления иконок в секвенсоре
  const originalUpdateSequenceDisplay = window.Sequencer.updateSequenceDisplay;
  if (originalUpdateSequenceDisplay) {
    window.Sequencer.updateSequenceDisplay = function() {
      // Вызываем оригинальную функцию
      originalUpdateSequenceDisplay.apply(this, arguments);
      
      // После обновления секвенсора добавляем иконки функций
      setTimeout(() => {
        updateSequencerFunctionIcons();
      }, 50);
    };
  }
  
  // Сохраняем оригинальную функцию изменения тональности
  const originalChangeTonality = window.UI.changeTonality;
  
  // Переопределяем функцию изменения тональности
  window.UI.changeTonality = function(tonality) {
    // Вызываем оригинальную функцию
    originalChangeTonality.call(window.UI, tonality);
    // Обновляем подсказки
    updateChordSuggestions();
  };
  
  // Обновляем минимальный темп до 10 BPM
  const tempoInput = document.getElementById('tempo-input');
  if (tempoInput) {
    tempoInput.min = "10";
  }
  
  // Инициализируем подсказки
  updateChordSuggestions();
}

// Экспорт модуля
window.ChordSuggestions = {
  initChordSuggestions: initChordSuggestions,
  updateChordSuggestions: updateChordSuggestions,
  getSuggestedChords: getSuggestedChords,
  getCurrentSuggestions: function() { return currentSuggestions; }
};