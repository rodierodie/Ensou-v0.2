/**
 * chordSuggestions.js
 * Компонент для анализа аккордовых последовательностей и предложения вариантов
 * следующего аккорда на основе музыкальной теории
 */

import Component from '../component.js';
import store from '../../core/store.js';
import eventBus from '../../core/eventBus.js';
import { chordCollection } from '../../models/chord.js';
import { tonalityCollection } from '../../models/tonality.js';

class ChordSuggestions extends Component {
  /**
   * Создает новый компонент подсказок аккордов
   * @param {HTMLElement} container - Контейнер для визуального отображения подсказок (опционально)
   * @param {Object} options - Настройки компонента
   */
  constructor(container = null, options = {}) {
    super(container, {
      ...options,
      autoRender: false // Отключаем автоматический рендер до инициализации
    });
    
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
    
    // Текущие предложения аккордов
    this.currentSuggestions = [];
    
    // Подписываемся на изменения в store
    this.subscribeToStore(this.handleStateChange, ['sequence', 'currentTonality']);
    
    // Инициализация
    this.init();
  }
  
  /**
   * Инициализация компонента
   */
  init() {
    console.log('Инициализация компонента подсказок аккордов');
    
    // Получаем начальное состояние
    this.updateSuggestions();
    
    // Если есть контейнер, инициализируем UI
    if (this.container) {
      this.render();
    }
  }
  
  /**
   * Рендеринг компонента (если есть контейнер)
   */
  render() {
    if (!this.container) return;
    
    this.clearContainer();
    
    // Создаем заголовок
    const title = this.createElement('h3', {
      textContent: 'Рекомендуемые аккорды'
    });
    this.container.appendChild(title);
    
    // Если нет предложений, показываем сообщение
    if (this.currentSuggestions.length === 0) {
      const emptyMessage = this.createElement('p', {
        className: 'suggestion-empty',
        textContent: 'Добавьте аккорд в последовательность, чтобы получить рекомендации'
      });
      this.container.appendChild(emptyMessage);
      return;
    }
    
    // Создаем контейнер для предложений
    const suggestionsContainer = this.createElement('div', {
      className: 'suggestions-container'
    });
    
    // Группируем предложения по функции
    const groupedSuggestions = this.groupSuggestionsByFunction();
    
    // Создаем секции для каждой функции
    for (const functionName in groupedSuggestions) {
      const functionSuggestions = groupedSuggestions[functionName];
      
      // Создаем заголовок функции
      const functionHeader = this.createElement('div', {
        className: 'suggestion-function-header ' + this.getFunctionClass(functionName),
        textContent: this.getFunctionDisplayName(functionName)
      });
      
      // Создаем контейнер для аккордов этой функции
      const functionChords = this.createElement('div', {
        className: 'suggestion-function-chords'
      });
      
      // Добавляем кнопки аккордов
      functionSuggestions.forEach(suggestion => {
        const chordButton = this.createElement('button', {
          className: 'chord-suggestion-button',
          textContent: suggestion.name,
          onClick: () => this.handleSuggestionClick(suggestion.name)
        });
        
        // Устанавливаем уровень уверенности как атрибут data-
        chordButton.dataset.confidence = suggestion.confidence;
        
        // Добавляем класс на основе уверенности
        if (suggestion.confidence > 0.5) {
          chordButton.classList.add('high-confidence');
        } else if (suggestion.confidence > 0.3) {
          chordButton.classList.add('medium-confidence');
        } else {
          chordButton.classList.add('low-confidence');
        }
        
        functionChords.appendChild(chordButton);
      });
      
      // Добавляем секцию в контейнер
      suggestionsContainer.appendChild(functionHeader);
      suggestionsContainer.appendChild(functionChords);
    }
    
    this.container.appendChild(suggestionsContainer);
  }
  
  /**
   * Группировка предложений по функции
   * @returns {Object} Объект с группированными предложениями
   */
  groupSuggestionsByFunction() {
    const grouped = {};
    
    this.currentSuggestions.forEach(suggestion => {
      if (!grouped[suggestion.function]) {
        grouped[suggestion.function] = [];
      }
      
      grouped[suggestion.function].push(suggestion);
    });
    
    return grouped;
  }
  
  /**
   * Обработка клика по предложенному аккорду
   * @param {string} chordName - Название аккорда
   */
  handleSuggestionClick(chordName) {
    // Устанавливаем аккорд как текущий
    store.setCurrentChord(chordName);
    
    // Добавляем аккорд в последовательность
    store.addChordToSequence(chordName);
    
    // Публикуем событие
    eventBus.publish('suggestionSelected', {
      chordName: chordName
    });
  }
  
  /**
   * Получение предлагаемых аккордов на основе последнего аккорда
   * @param {string} lastChordName - Название последнего аккорда
   * @param {string} tonality - Текущая тональность
   * @returns {Array} Массив предлагаемых аккордов с уровнем уверенности
   */
  getSuggestedChords(lastChordName, tonality) {
    // Получаем данные о последнем аккорде
    const lastChord = chordCollection.getChord(lastChordName);
    
    if (!lastChord || !lastChord.getFunctionInTonality(tonality)) {
      console.warn(`Нет данных о функции аккорда ${lastChordName} в тональности ${tonality}`);
      return [];
    }
    
    // Определяем функцию последнего аккорда
    const lastFunction = lastChord.getFunctionInTonality(tonality).function;
    
    // Получаем вероятности переходов для этой функции
    const transitions = this.harmonicTransitions[lastFunction];
    if (!transitions) {
      console.warn(`Нет данных о переходах для функции: ${lastFunction}`);
      return [];
    }
    
    // Сортируем функции по вероятности перехода (от высокой к низкой)
    const sortedFunctions = Object.keys(transitions).sort(
      (a, b) => transitions[b] - transitions[a]
    );
    
    // Собираем подходящие аккорды для каждой функции
    const suggestedChords = [];
    
    // Для каждой функции находим соответствующие аккорды
    sortedFunctions.forEach(targetFunction => {
      const confidenceLevel = transitions[targetFunction];
      
      // Получаем аккорды для данной функции в текущей тональности
      const functionChords = chordCollection.getChordsByFunction(tonality, targetFunction);
      
      functionChords.forEach(chord => {
        // Пропускаем текущий аккорд
        if (chord.name === lastChordName) return;
        
        // Добавляем аккорд с информацией о вероятности
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
    // Получаем последовательность и тональность из store
    const sequence = store.getSequence();
    const tonality = store.getCurrentTonality();
    
    // Если последовательность пуста, очищаем предложения
    if (!sequence || sequence.length === 0) {
      this.clearSuggestions();
      return;
    }
    
    // Находим последний аккорд (пропускаем паузы и разделители блоков)
    let lastChord = null;
    for (let i = sequence.length - 1; i >= 0; i--) {
      if (sequence[i] !== 'PAUSE' && sequence[i] !== 'BLOCK_DIVIDER') {
        lastChord = sequence[i];
        break;
      }
    }
    
    // Если нет аккорда, очищаем предложения
    if (!lastChord) {
      this.clearSuggestions();
      return;
    }
    
    // Получаем предложения
    const suggestions = this.getSuggestedChords(lastChord, tonality);
    
    // Обновляем текущие предложения
    this.currentSuggestions = suggestions;
    
    // Публикуем событие
    eventBus.publish('chordSuggestionsUpdated', {
      suggestions: this.currentSuggestions
    });
    
    // Обновляем UI, если есть контейнер
    if (this.container) {
      this.render();
    }
    
    return this.currentSuggestions;
  }
  
  /**
   * Очистка предложений
   */
  clearSuggestions() {
    this.currentSuggestions = [];
    
    // Публикуем событие
    eventBus.publish('chordSuggestionsUpdated', {
      suggestions: []
    });
    
    // Обновляем UI, если есть контейнер
    if (this.container) {
      this.render();
    }
  }
  
  /**
   * Получение класса CSS для функции
   * @param {string} functionName - Название функции
   * @returns {string} Класс CSS
   */
  getFunctionClass(functionName) {
    switch (functionName) {
      case 'tonic': return 'tonic-function';
      case 'dominant': return 'dominant-function';
      case 'subdominant': return 'subdominant-function';
      default: return '';
    }
  }
  
  /**
   * Получение отображаемого имени функции
   * @param {string} functionName - Название функции
   * @returns {string} Отображаемое имя
   */
  getFunctionDisplayName(functionName) {
    switch (functionName) {
      case 'tonic': return 'Тоника (T)';
      case 'dominant': return 'Доминанта (D)';
      case 'subdominant': return 'Субдоминанта (S)';
      default: return functionName;
    }
  }
  
  /**
   * Обработка изменения состояния store
   * @param {Object} state - Состояние store
   * @param {string} changedProp - Измененное свойство
   */
  handleStateChange(state, changedProp) {
    // Обновляем предложения при изменении последовательности или тональности
    if (changedProp === 'sequence' || changedProp === 'currentTonality') {
      this.updateSuggestions();
    }
  }
  
  /**
   * Получение текущих предложений
   * @returns {Array} Массив текущих предложений
   */
  getCurrentSuggestions() {
    return [...this.currentSuggestions];
  }
  
  /**
   * Подсветка предлагаемых аккордов в интерфейсе
   * Используется для интеграции со старым кодом
   * @param {Array} targets - Селекторы или элементы для подсветки
   */
  highlightTargets(targets) {
    if (!targets || !Array.isArray(targets)) return;
    
    // Сначала сбрасываем все подсветки
    targets.forEach(target => {
      if (typeof target === 'string') {
        document.querySelectorAll(target).forEach(el => {
          el.classList.remove('suggested-high', 'suggested-medium', 'suggested-low');
        });
      } else if (target instanceof HTMLElement) {
        target.classList.remove('suggested-high', 'suggested-medium', 'suggested-low');
      }
    });
    
    // Получаем текущие предложения
    const suggestions = this.currentSuggestions;
    
    // Подсвечиваем предлагаемые аккорды
    suggestions.forEach(suggestion => {
      targets.forEach(target => {
        let elements = [];
        
        if (typeof target === 'string') {
          elements = Array.from(document.querySelectorAll(`${target}[data-chord="${suggestion.name}"]`));
        } else if (target instanceof HTMLElement && target.dataset.chord === suggestion.name) {
          elements = [target];
        }
        
        // Определяем класс подсветки
        let highlightClass = '';
        if (suggestion.confidence > 0.5) {
          highlightClass = 'suggested-high';
        } else if (suggestion.confidence > 0.3) {
          highlightClass = 'suggested-medium';
        } else {
          highlightClass = 'suggested-low';
        }
        
        // Подсвечиваем элементы
        elements.forEach(el => {
          el.classList.add(highlightClass);
          
          // Добавляем всплывающую подсказку
          el.title = `${suggestion.name}: ${this.getFunctionDisplayName(suggestion.function)}`;
          
          // Можно добавить иконку функции, если нужно
          this.addFunctionIcon(el, suggestion.function);
        });
      });
    });
  }
  
  /**
   * Добавление иконки функции к элементу
   * @param {HTMLElement} element - Элемент для добавления иконки
   * @param {string} functionName - Название функции
   */
  addFunctionIcon(element, functionName) {
    // Удаляем предыдущую иконку, если есть
    const existingIcon = element.querySelector('.suggestion-function-icon');
    if (existingIcon) {
      existingIcon.remove();
    }
    
    // Создаем иконку
    const functionIcon = document.createElement('span');
    functionIcon.className = `function-icon ${this.getFunctionClass(functionName)} suggestion-function-icon`;
    functionIcon.textContent = this.getFunctionIconText(functionName);
    element.appendChild(functionIcon);
  }
  
  /**
   * Получение текста для иконки функции
   * @param {string} functionName - Название функции
   * @returns {string} Текст для иконки
   */
  getFunctionIconText(functionName) {
    switch (functionName) {
      case 'tonic': return 'T';
      case 'dominant': return 'D';
      case 'subdominant': return 'S';
      default: return '?';
    }
  }
}

// Создаем и экспортируем экземпляр сервиса
const chordSuggestions = new ChordSuggestions();
export default chordSuggestions;