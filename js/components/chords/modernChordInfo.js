/**
 * modernChordInfo.js
 * Модернизированный компонент для отображения информации об аккорде
 */

import Component from '../component.js';
import store from '../../core/store.js';
import eventBus from '../../core/eventBus.js';
import audioService from '../../services/audioService.js';
import { chordCollection } from '../../models/chord.js';

class ModernChordInfo extends Component {
  /**
   * Создает компонент информации об аккорде
   * @param {HTMLElement} container - Контейнер для отображения информации
   * @param {Object} options - Настройки компонента
   */
  constructor(container, options = {}) {
    super(container, {
      ...options,
      autoRender: true
    });
    
    // Инициализируем состояние
    this.currentChord = store.getCurrentChord();
    this.currentTonality = store.getCurrentTonality();
    this.isVisible = true; // Флаг видимости детальной информации
    
    // Подписываемся на изменения в store
    this.subscribeToStore(this.handleStateChange, ['currentChord', 'currentTonality']);
    
    // Подписываемся на события
    this.subscribeToEvent('chordInfoToggle', this.handleInfoToggle.bind(this));
  }
  
  /**
   * Рендеринг компонента
   */
  render() {
    if (!this.container) return;
    
    this.clearContainer();
    
    // Получаем данные об аккорде
    const chord = chordCollection.getChord(this.currentChord);
    
    if (!chord) {
      this.renderNoChordInfo();
      return;
    }
    
    // Создаем контейнер информации
    const infoContainer = this.createElement('div', {
      className: 'chord-info-content'
    });
    
    // Название аккорда и основная информация
    const nameElement = this.createElement('div', {
      className: 'chord-name',
      textContent: `${this.currentChord} (${chord.fullName})`
    });
    
    // Описание аккорда
    const descriptionElement = this.createElement('p', {
      className: 'chord-description',
      textContent: chord.description
    });
    
    // Ноты аккорда
    const notesElement = this.createElement('p', {
      className: 'chord-notes',
      textContent: `Ноты: ${chord.getNoteNames().join(', ')}`
    });
    
    // Добавляем основные элементы
    infoContainer.appendChild(nameElement);
    infoContainer.appendChild(descriptionElement);
    infoContainer.appendChild(notesElement);
    
    // Функциональное значение (раздел скрывается при !isVisible)
    if (this.isVisible) {
      // Заголовок раздела
      const functionsTitle = this.createElement('p', {
        className: 'functions-title',
        textContent: 'Функциональное значение:'
      });
      infoContainer.appendChild(functionsTitle);
      
      // Информация о функциях в разных тональностях
      let hasFunction = false;
      
      for (const tonality in chord.functions) {
        hasFunction = true;
        const func = chord.functions[tonality];
        
        // Создаем строку для функции
        const functionItem = this.createElement('div', {
          className: 'function-item'
        });
        
        // Иконка функции
        const functionIcon = this.createElement('span', {
          className: `function-icon ${this.getFunctionClass(func.function)}`,
          textContent: func.label
        });
        functionItem.appendChild(functionIcon);
        
        // Описание функции
        const functionText = this.createElement('span', {
          textContent: ` ${func.function} (ступень ${func.degree}) в тональности ${tonality}`
        });
        functionItem.appendChild(functionText);
        
        infoContainer.appendChild(functionItem);
      }
      
      // Если у аккорда нет функций
      if (!hasFunction) {
        const noFunctionsElement = this.createElement('p', {
          textContent: 'Функция не определена'
        });
        infoContainer.appendChild(noFunctionsElement);
      }
    }
    
    // Добавляем контейнер с информацией в основной контейнер
    this.container.appendChild(infoContainer);
    
    // Создаем панель управления
    const controlsPanel = this.createElement('div', {
      className: 'chord-info-controls'
    });
    
    // Кнопка воспроизведения
    const playButton = this.createElement('button', {
      className: 'play-chord-button',
      textContent: '▶ Проиграть',
      onClick: this.handlePlayClick.bind(this)
    });
    controlsPanel.appendChild(playButton);
    
    // Кнопка добавления в последовательность
    const addButton = this.createElement('button', {
      className: 'add-chord-button',
      textContent: '+ Добавить в последовательность',
      onClick: this.handleAddClick.bind(this)
    });
    controlsPanel.appendChild(addButton);
    
    // Кнопка переключения видимости дополнительной информации
    const toggleButton = this.createElement('button', {
      className: 'hide-info-button',
      textContent: this.isVisible ? 'Скрыть информацию' : 'Показать информацию',
      onClick: this.handleToggleClick.bind(this)
    });
    controlsPanel.appendChild(toggleButton);
    
    // Добавляем панель управления в основной контейнер
    this.container.appendChild(controlsPanel);
  }
  
  /**
   * Отображение блока "Нет информации об аккорде"
   */
  renderNoChordInfo() {
    const noInfoElement = this.createElement('div', {
      className: 'no-chord-info',
      textContent: 'Выберите аккорд для просмотра информации'
    });
    this.container.appendChild(noInfoElement);
  }
  
  /**
   * Обработка нажатия на кнопку воспроизведения
   */
  handlePlayClick() {
    audioService.playChord(this.currentChord);
  }
  
  /**
   * Обработка нажатия на кнопку добавления в последовательность
   */
  handleAddClick() {
    store.addChordToSequence(this.currentChord);
    
    // Публикуем событие для информирования других компонентов
    eventBus.publish('chordAddedToSequence', {
      chordName: this.currentChord
    });
  }
  
  /**
   * Обработка нажатия на кнопку переключения видимости
   */
  handleToggleClick() {
    this.isVisible = !this.isVisible;
    
    // Перерисовываем компонент
    this.render();
    
    // Публикуем событие для информирования других компонентов
    eventBus.publish('chordInfoToggle', {
      visible: this.isVisible
    });
  }
  
  /**
   * Обработка события переключения видимости
   * @param {Object} data - Данные события
   */
  handleInfoToggle(data) {
    if (data.visible !== undefined && data.visible !== this.isVisible) {
      this.isVisible = data.visible;
      this.render();
    }
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
   * Обработка изменений в store
   * @param {Object} state - Состояние store
   * @param {string} changedProp - Измененное свойство
   */
  handleStateChange(state, changedProp) {
    let shouldRender = false;
    
    if (changedProp === 'currentChord') {
      this.currentChord = state.currentChord;
      shouldRender = true;
    } else if (changedProp === 'currentTonality') {
      this.currentTonality = state.currentTonality;
      shouldRender = true;
    }
    
    // Перерисовываем компонент, если нужно
    if (shouldRender) {
      this.render();
    }
  }
}

export default ModernChordInfo;