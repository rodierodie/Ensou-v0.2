/**
 * modernSequencer.js
 * Модернизированный компонент для управления секвенсором аккордовых прогрессий
 */

import Component from '../component.js';
import store from '../../core/store.js';
import eventBus from '../../core/eventBus.js';
import audioService from '../../services/audioService.js';

class ModernSequencer extends Component {
  /**
   * Создает компонент секвенсора
   * @param {HTMLElement} container - Контейнер для элементов управления
   * @param {HTMLElement} sequenceContainer - Контейнер для отображения последовательности
   * @param {Object} options - Настройки компонента
   */
  constructor(container, sequenceContainer, options = {}) {
    super(container, {
      ...options,
      autoRender: true
    });
    
    // Сохраняем ссылку на контейнер последовательности
    this.sequenceContainer = sequenceContainer;
    
    // Инициализируем состояние
    this.sequence = store.getSequence();
    this.isPlaying = store.getIsPlaying();
    this.currentIndex = -1;
    this.tempo = store.getTempo();
    
    // Подписываемся на изменения в store
    this.subscribeToStore(this.handleStateChange, ['sequence', 'isPlaying', 'tempo']);
    
    // Подписываемся на события
    this.subscribeToEvent('chordPlaying', this.handleChordPlaying.bind(this));
  }
  
  /**
   * Рендеринг компонента элементов управления
   */
  render() {
    if (!this.container) return;
    
    this.clearContainer();
    
    // Создаем контейнер для элементов управления
    const controlsContainer = this.createElement('div', {
      className: 'sequence-controls'
    });
    
    // Создаем основные элементы управления
    const mainControls = this.createElement('div', {
      className: 'main-sequence-controls'
    });
    
    // Кнопка воспроизведения
    const playButton = this.createElement('button', {
      id: 'play-sequence',
      className: 'play-button',
      textContent: '▶ Проиграть',
      disabled: this.isPlaying || this.sequence.length === 0,
      onClick: this.handlePlayClick.bind(this)
    });
    mainControls.appendChild(playButton);
    
    // Кнопка остановки
    const stopButton = this.createElement('button', {
      id: 'stop-sequence',
      className: 'stop-button',
      textContent: '■ Стоп',
      disabled: !this.isPlaying,
      onClick: this.handleStopClick.bind(this)
    });
    mainControls.appendChild(stopButton);
    
    // Добавляем основные элементы управления
    controlsContainer.appendChild(mainControls);
    
    // Создаем элементы редактирования
    const editControls = this.createElement('div', {
      className: 'edit-sequence-controls'
    });
    
    // Кнопка добавления паузы
    const addPauseButton = this.createElement('button', {
      id: 'add-pause',
      className: 'add-pause-button',
      textContent: '+ Пауза',
      onClick: this.handleAddPauseClick.bind(this)
    });
    editControls.appendChild(addPauseButton);
    
    // Кнопка очистки последовательности
    const clearButton = this.createElement('button', {
      id: 'clear-sequence',
      className: 'clear-button',
      textContent: 'Очистить',
      disabled: this.sequence.length === 0,
      onClick: this.handleClearClick.bind(this)
    });
    editControls.appendChild(clearButton);
    
    // Добавляем элементы редактирования
    controlsContainer.appendChild(editControls);
    
    // Добавляем контейнер в основной контейнер
    this.container.appendChild(controlsContainer);
    
    // Рендерим последовательность
    this.renderSequence();
  }
  
  /**
   * Рендеринг последовательности аккордов
   */
  renderSequence() {
    if (!this.sequenceContainer) return;
    
    // Очищаем контейнер
    this.sequenceContainer.innerHTML = '';
    
    // Если последовательность пуста, показываем заглушку
    if (this.sequence.length === 0) {
      const placeholder = this.createElement('div', {
        className: 'timeline-placeholder',
        textContent: 'Добавьте аккорды в последовательность'
      });
      this.sequenceContainer.appendChild(placeholder);
      return;
    }
    
    // Создаем элементы для каждого аккорда в последовательности
    this.sequence.forEach((chordName, index) => {
      const slotElement = this.createElement('div', {
        className: 'sequence-slot',
        dataset: { index: index }
      });
      
      // Если это текущий проигрываемый аккорд, добавляем соответствующий класс
      if (index === this.currentIndex && this.isPlaying) {
        slotElement.classList.add('current-playing');
      }
      
      // Название аккорда
      const chordNameElement = this.createElement('div', {
        className: 'slot-chord'
      });
      
      // Если это пауза, отображаем соответствующий символ
      if (chordName === 'PAUSE') {
        chordNameElement.textContent = '𝄽'; // Символ паузы
        chordNameElement.classList.add('pause-symbol');
      } else if (chordName === 'BLOCK_DIVIDER') {
        chordNameElement.textContent = '|'; // Символ разделителя блоков
        chordNameElement.classList.add('block-divider-symbol');
      } else {
        chordNameElement.textContent = chordName;
      }
      
      slotElement.appendChild(chordNameElement);
      
      // Добавляем обработчик клика
      slotElement.addEventListener('click', () => {
        this.handleSlotClick(chordName, index);
      });
      
      // Кнопка удаления
      const removeButton = this.createElement('div', {
        className: 'slot-remove',
        textContent: '×',
        onClick: (e) => {
          e.stopPropagation(); // Предотвращаем проигрывание аккорда при клике на кнопку удаления
          this.handleRemoveClick(index);
        }
      });
      slotElement.appendChild(removeButton);
      
      // Добавляем слот в контейнер
      this.sequenceContainer.appendChild(slotElement);
    });
  }
  
  /**
   * Обработка нажатия на кнопку воспроизведения
   */
  handlePlayClick() {
    store.setIsPlaying(true);
  }
  
  /**
   * Обработка нажатия на кнопку остановки
   */
  handleStopClick() {
    store.setIsPlaying(false);
  }
  
  /**
   * Обработка нажатия на кнопку добавления паузы
   */
  handleAddPauseClick() {
    store.addChordToSequence('PAUSE');
  }
  
  /**
   * Обработка нажатия на кнопку очистки последовательности
   */
  handleClearClick() {
    // Запрашиваем подтверждение
    if (confirm('Вы уверены, что хотите очистить текущую последовательность?')) {
      store.clearSequence();
    }
  }
  
  /**
   * Обработка клика по слоту последовательности
   * @param {string} chordName - Название аккорда
   * @param {number} index - Индекс в последовательности
   */
  handleSlotClick(chordName, index) {
    // Пропускаем для пауз и разделителей блоков
    if (chordName === 'PAUSE' || chordName === 'BLOCK_DIVIDER') {
      return;
    }
    
    // Устанавливаем текущий аккорд
    store.setCurrentChord(chordName);
    
    // Проигрываем аккорд
    audioService.playChord(chordName);
    
    // Публикуем событие
    eventBus.publish('sequenceChordClicked', {
      chordName,
      index
    });
  }
  
  /**
   * Обработка нажатия на кнопку удаления аккорда
   * @param {number} index - Индекс аккорда в последовательности
   */
  handleRemoveClick(index) {
    store.removeChordFromSequence(index);
  }
  
  /**
   * Обработка события проигрывания аккорда
   * @param {Object} data - Данные события
   */
  handleChordPlaying(data) {
    this.currentIndex = data.index;
    this.updateCurrentPlaying();
  }
  
  /**
   * Обновление подсветки текущего проигрываемого аккорда
   */
  updateCurrentPlaying() {
    // Удаляем класс у всех слотов
    document.querySelectorAll('.sequence-slot').forEach(slot => {
      slot.classList.remove('current-playing');
    });
    
    // Если есть текущий индекс и воспроизведение активно
    if (this.currentIndex >= 0 && this.isPlaying) {
      // Находим слот с текущим индексом
      const currentSlot = document.querySelector(`.sequence-slot[data-index="${this.currentIndex}"]`);
      if (currentSlot) {
        currentSlot.classList.add('current-playing');
        
        // Прокручиваем, чтобы слот был видимым
        this.scrollToCurrentSlot();
      }
    }
  }
  
  /**
   * Прокрутка к текущему проигрываемому слоту
   */
  scrollToCurrentSlot() {
    const currentSlot = document.querySelector('.sequence-slot.current-playing');
    if (!currentSlot || !this.sequenceContainer) return;
    
    // Проверяем, виден ли слот
    const containerRect = this.sequenceContainer.getBoundingClientRect();
    const slotRect = currentSlot.getBoundingClientRect();
    
    // Если слот выходит за пределы видимой области, прокручиваем
    if (slotRect.left < containerRect.left || slotRect.right > containerRect.right) {
      // Вычисляем позицию прокрутки
      const scrollLeft = currentSlot.offsetLeft - this.sequenceContainer.offsetWidth / 2 + currentSlot.offsetWidth / 2;
      this.sequenceContainer.scrollLeft = scrollLeft;
    }
  }
  
  /**
   * Обработка изменений в store
   * @param {Object} state - Состояние store
   * @param {string} changedProp - Измененное свойство
   */
  handleStateChange(state, changedProp) {
    let shouldRender = false;
    
    if (changedProp === 'sequence') {
      this.sequence = state.sequence;
      shouldRender = true;
    } else if (changedProp === 'isPlaying') {
      this.isPlaying = state.isPlaying;
      
      // Если воспроизведение остановлено, сбрасываем текущий индекс
      if (!this.isPlaying) {
        this.currentIndex = -1;
      }
      
      shouldRender = true;
    } else if (changedProp === 'tempo') {
      this.tempo = state.tempo;
    }
    
    // Перерисовываем компонент, если нужно
    if (shouldRender) {
      this.render();
    }
  }
}

export default ModernSequencer;