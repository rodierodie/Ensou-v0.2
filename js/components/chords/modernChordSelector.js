/**
 * modernChordSelector.js
 * Модернизированный компонент для отображения и выбора аккордов в тональности
 */

import Component from '../component.js';
import store from '../../core/store.js';
import eventBus from '../../core/eventBus.js';
import audioService from '../../services/audioService.js';
import { tonalityCollection } from '../../models/tonality.js';
import { chordCollection } from '../../models/chord.js';
import chordSuggestions from './chordSuggestions.js';

class ModernChordSelector extends Component {
  /**
   * Создает компонент выбора аккордов
   * @param {HTMLElement} basicChordsContainer - Контейнер для основных аккордов
   * @param {HTMLElement} seventhChordsContainer - Контейнер для септаккордов
   * @param {Object} options - Настройки компонента
   */
  constructor(basicChordsContainer, seventhChordsContainer, options = {}) {
    // Сохраняем ссылки на контейнеры
    this.containers = {
      basic: basicChordsContainer,
      seventh: seventhChordsContainer
    };
    
    // Вызываем конструктор базового класса с первым контейнером
    super(basicChordsContainer, {
      ...options,
      autoRender: false
    });
    
    // Инициализируем состояние
    this.currentTonality = store.getCurrentTonality();
    this.currentChord = store.getCurrentChord();
    this.suggestions = [];
    
    // Подписываемся на изменения в store
    this.subscribeToStore(this.handleStateChange, ['currentTonality', 'currentChord', 'sequence']);
    
    // Подписываемся на события
    this.subscribeToEvent('chordSuggestionsUpdated', this.handleSuggestionsUpdated.bind(this));
    
    // Инициализируем UI
    this.init();
  }
  
  /**
   * Инициализация компонента
   */
  init() {
    console.log('Инициализация компонента выбора аккордов');
    
    // Получаем начальные данные
    this.updateChordButtons();
    
    // Публикуем событие инициализации
    eventBus.publish('chordSelectorInitialized', {
      tonality: this.currentTonality
    });
  }
  
  /**
   * Рендеринг компонента не используется напрямую,
   * вместо этого используется updateChordButtons для каждого контейнера
   */
  render() {
    this.updateChordButtons();
  }
  
  /**
   * Обновление кнопок аккордов на основе текущей тональности
   */
  updateChordButtons() {
    // Получаем данные о тональности
    const tonality = tonalityCollection.getTonality(this.currentTonality);
    
    if (!tonality) {
      console.error(`Тональность ${this.currentTonality} не найдена`);
      return;
    }
    
    // Обновляем основные аккорды
    this.updateChordSection(
      this.containers.basic,
      tonality.chords.basic,
      'basic'
    );
    
    // Обновляем септаккорды
    this.updateChordSection(
      this.containers.seventh,
      tonality.chords.seventh,
      'seventh'
    );
    
    // Обновляем подсветку аккорда
    this.updateActiveChord();
    
    // Обновляем подсветку предложений
    this.highlightSuggestions();
  }
  
  /**
   * Обновление секции аккордов (основные или септаккорды)
   * @param {HTMLElement} container - Контейнер для аккордов
   * @param {Array} chords - Массив аккордов
   * @param {string} type - Тип аккордов ('basic' или 'seventh')
   */
  updateChordSection(container, chords, type) {
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаем кнопки для каждого аккорда
    chords.forEach(chordName => {
      const button = document.createElement('div');
      button.className = 'chord-button';
      button.dataset.chord = chordName;
      button.textContent = chordName;
      
      // Устанавливаем активный класс, если это текущий аккорд
      if (chordName === this.currentChord) {
        button.classList.add('active');
      }
      
      // Добавляем обработчик клика
      button.addEventListener('click', () => {
        this.handleChordClick(chordName);
      });
      
      container.appendChild(button);
    });
  }
  
  /**
   * Обработка клика по аккорду
   * @param {string} chordName - Название аккорда
   */
  handleChordClick(chordName) {
    // Устанавливаем текущий аккорд
    store.setCurrentChord(chordName);
    
    // Проигрываем аккорд
    audioService.playChord(chordName);
    
    // Публикуем событие выбора аккорда
    eventBus.publish('chordSelected', {
      chordName: chordName,
      tonality: this.currentTonality
    });
  }
  
  /**
   * Обновление активного аккорда
   */
  updateActiveChord() {
    // Удаляем класс active у всех кнопок
    document.querySelectorAll('.chord-button').forEach(button => {
      button.classList.remove('active');
    });
    
    // Добавляем класс active текущему аккорду
    document.querySelectorAll(`.chord-button[data-chord="${this.currentChord}"]`).forEach(button => {
      button.classList.add('active');
    });
  }
  
  /**
   * Подсветка предлагаемых аккордов
   */
  highlightSuggestions() {
    // Сначала очищаем все подсветки
    document.querySelectorAll('.chord-button').forEach(button => {
      button.classList.remove('suggested-high', 'suggested-medium', 'suggested-low');
      
      // Удаляем иконку функции, если есть
      const icon = button.querySelector('.suggestion-function-icon');
      if (icon) {
        icon.remove();
      }
      
      // Очищаем всплывающую подсказку
      button.title = '';
    });
    
    // Подсвечиваем предложения
    this.suggestions.forEach(suggestion => {
      // Находим все кнопки для этого аккорда
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
      
      // Применяем подсветку
      buttons.forEach(button => {
        button.classList.add(highlightClass);
        
        // Добавляем иконку функции
        this.addFunctionIcon(button, suggestion.function);
        
        // Добавляем всплывающую подсказку
        button.title = `${suggestion.name}: ${this.getFunctionDisplayName(suggestion.function)}`;
      });
    });
  }
  
  /**
   * Добавление иконки функции к кнопке аккорда
   * @param {HTMLElement} button - Кнопка аккорда
   * @param {string} functionName - Название функции
   */
  addFunctionIcon(button, functionName) {
    // Удаляем предыдущую иконку, если есть
    const existingIcon = button.querySelector('.suggestion-function-icon');
    if (existingIcon) {
      existingIcon.remove();
    }
    
    // Создаем иконку
    const functionIcon = document.createElement('span');
    functionIcon.className = `function-icon ${this.getFunctionClass(functionName)} suggestion-function-icon`;
    functionIcon.textContent = this.getFunctionIconLabel(functionName);
    button.appendChild(functionIcon);
  }
  
  /**
   * Получение CSS класса для функции
   * @param {string} functionName - Название функции
   * @returns {string} CSS класс
   */
  getFunctionClass(functionName) {
    switch (functionName) {
      case 'tonic': return 'tonic';
      case 'dominant': return 'dominant';
      case 'subdominant': return 'subdominant';
      default: return '';
    }
  }
  
  /**
   * Получение метки для иконки функции
   * @param {string} functionName - Название функции
   * @returns {string} Метка для иконки
   */
  getFunctionIconLabel(functionName) {
    switch (functionName) {
      case 'tonic': return 'T';
      case 'dominant': return 'D';
      case 'subdominant': return 'S';
      default: return '?';
    }
  }
  
  /**
   * Получение отображаемого имени функции
   * @param {string} functionName - Название функции
   * @returns {string} Отображаемое имя
   */
  getFunctionDisplayName(functionName) {
    switch (functionName) {
      case 'tonic': return 'Тоника';
      case 'dominant': return 'Доминанта';
      case 'subdominant': return 'Субдоминанта';
      default: return functionName;
    }
  }
  
  /**
   * Обработка обновления предложений аккордов
   * @param {Object} data - Данные события
   */
  handleSuggestionsUpdated(data) {
    this.suggestions = data.suggestions || [];
    this.highlightSuggestions();
  }
  
  /**
   * Обработка изменений в store
   * @param {Object} state - Состояние store
   * @param {string} changedProp - Измененное свойство
   */
  handleStateChange(state, changedProp) {
    if (changedProp === 'currentTonality') {
      // Обновляем текущую тональность
      this.currentTonality = state.currentTonality;
      
      // Обновляем аккорды для новой тональности
      this.updateChordButtons();
    } else if (changedProp === 'currentChord') {
      // Обновляем текущий аккорд
      this.currentChord = state.currentChord;
      
      // Обновляем активный аккорд
      this.updateActiveChord();
    } else if (changedProp === 'sequence') {
      // При изменении последовательности могут измениться предложения,
      // но они обрабатываются через событие chordSuggestionsUpdated
    }
  }
}

export default ModernChordSelector;