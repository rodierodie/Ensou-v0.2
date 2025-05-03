/**
 * trackStructureManager.js
 * Компонент для управления структурой трека
 */

import Component from '../component.js';
import store from '../../core/store.js';
import eventBus from '../../core/eventBus.js';
import trackStructureService from '../../models/trackStructure.js';
import { TrackBlock } from '../../models/sequence.js';

class TrackStructureManager extends Component {
  /**
   * Создает новый компонент управления структурой трека
   * @param {HTMLElement} container - Контейнер для UI элементов
   * @param {Object} options - Настройки компонента
   */
  constructor(container, options = {}) {
    super(container, {
      ...options,
      autoRender: false
    });
    
    // Инициализируем состояние
    this.trackStructure = trackStructureService.getTrackStructure();
    this.currentBlockIndex = trackStructureService.getCurrentBlockIndex();
    
    // Подписываемся на изменения в store
    this.subscribeToStore(this.handleStateChange, ['trackStructure', 'currentBlockIndex']);
    
    // Подписываемся на события
    this.subscribeToEvent('blockAdded', this.handleBlockAdded.bind(this));
    this.subscribeToEvent('blockRemoved', this.handleBlockRemoved.bind(this));
    this.subscribeToEvent('blockRenamed', this.handleBlockRenamed.bind(this));
    this.subscribeToEvent('blockTonalityChanged', this.handleBlockTonalityChanged.bind(this));
    
    // Инициализируем UI
    this.init();
  }
  
  /**
   * Инициализация компонента
   */
  init() {
    console.log('Инициализация компонента управления структурой трека');
    
    // Отрисовываем UI
    this.render();
  }
  
  /**
   * Рендеринг UI компонента
   */
  render() {
    if (!this.container) return;
    
    this.clearContainer();
    
    // Создаем заголовок
    const title = this.createElement('div', {
      className: 'section-title',
      textContent: 'Структура трека'
    });
    this.container.appendChild(title);
    
    // Создаем панель инструментов
    const toolbar = this.createToolbar();
    this.container.appendChild(toolbar);
    
    // Создаем контейнер для блоков
    const blocksContainer = this.createElement('div', {
      className: 'blocks-container'
    });
    
    // Создаем и добавляем блоки
    const structure = this.trackStructure.getAllBlocks();
    structure.forEach((block, index) => {
      const blockElement = this.createBlockElement(block, index);
      blocksContainer.appendChild(blockElement);
    });
    
    this.container.appendChild(blocksContainer);
  }
  
  /**
   * Создание панели инструментов
   * @returns {HTMLElement} Панель инструментов
   */
  createToolbar() {
    const toolbar = this.createElement('div', {
      className: 'structure-toolbar'
    });
    
    // Кнопка добавления нового блока
    const addButton = this.createElement('button', {
      className: 'add-block-button',
      textContent: '+ Новый блок',
      onClick: this.handleAddBlock.bind(this)
    });
    toolbar.appendChild(addButton);
    
    // Кнопка воспроизведения всей структуры
    const playAllButton = this.createElement('button', {
      className: 'play-all-button',
      textContent: '▶ Воспроизвести весь трек',
      onClick: this.handlePlayFullTrack.bind(this)
    });
    
    // Проверяем, есть ли аккорды в блоках
    const hasChords = this.trackStructure.getAllBlocks().some(block => block.chords.length > 0);
    playAllButton.disabled = !hasChords;
    
    toolbar.appendChild(playAllButton);
    
    return toolbar;
  }
  
  /**
   * Создание элемента блока для отображения в UI
   * @param {Object} block - Объект блока
   * @param {number} index - Индекс блока
   * @returns {HTMLElement} Элемент блока
   */
  createBlockElement(block, index) {
    // Создаем контейнер блока
    const blockElement = this.createElement('div', {
      className: 'track-block',
      dataset: { index: index, blockId: block.id }
    });
    
    // Если это текущий активный блок, добавляем класс
    if (index === this.currentBlockIndex) {
      blockElement.classList.add('active-block');
    }
    
    // Заголовок блока с именем и тональностью
    const blockHeader = this.createElement('div', {
      className: 'block-header'
    });
    
    // Имя блока (с возможностью редактирования)
    const blockName = this.createElement('span', {
      className: 'block-name',
      textContent: block.name,
      title: 'Нажмите для редактирования',
      onClick: () => this.handleRenameBlock(index)
    });
    blockHeader.appendChild(blockName);
    
    // Тональность блока
    const blockTonality = this.createElement('span', {
      className: 'block-tonality',
      textContent: block.tonality,
      title: 'Нажмите для изменения тональности',
      onClick: () => this.handleChangeTonality(index)
    });
    blockHeader.appendChild(blockTonality);
    
    blockElement.appendChild(blockHeader);
    
    // Визуализация аккордов блока
    const chordsPreview = this.createElement('div', {
      className: 'block-chords-preview'
    });
    
    if (block.chords && block.chords.length > 0) {
      // Отображаем превью аккордов
      const maxPreviewChords = 8; // Максимальное количество аккордов для превью
      const displayChords = block.chords.slice(0, maxPreviewChords);
      
      displayChords.forEach((chord, chordIndex) => {
        const chordBadge = this.createElement('span', {
          className: 'chord-badge',
          textContent: chord === 'PAUSE' ? '𝄽' : chord
        });
        chordsPreview.appendChild(chordBadge);
        
        // Добавляем разделитель между аккордами
        if (chordIndex < displayChords.length - 1) {
          const separator = this.createElement('span', {
            className: 'chord-separator',
            textContent: '→'
          });
          chordsPreview.appendChild(separator);
        }
      });
      
      // Если в блоке больше аккордов, чем мы показываем, добавляем многоточие
      if (block.chords.length > maxPreviewChords) {
        const ellipsis = this.createElement('span', {
          className: 'chord-ellipsis',
          textContent: '...'
        });
        chordsPreview.appendChild(ellipsis);
      }
    } else {
      // Если блок пуст, показываем сообщение
      const emptyMessage = this.createElement('span', {
        className: 'empty-block-message',
        textContent: 'Нет аккордов'
      });
      chordsPreview.appendChild(emptyMessage);
    }
    
    blockElement.appendChild(chordsPreview);
    
    // Панель кнопок блока
    const buttonPanel = this.createElement('div', {
      className: 'block-buttons'
    });
    
    // Кнопка загрузки блока
    const loadButton = this.createElement('button', {
      className: 'block-load-button',
      textContent: 'Загрузить',
      onClick: (e) => {
        e.stopPropagation();
        this.handleLoadBlock(index);
      }
    });
    buttonPanel.appendChild(loadButton);
    
    // Кнопка воспроизведения блока
    const playButton = this.createElement('button', {
      className: 'block-play-button',
      textContent: '▶',
      disabled: !block.chords || block.chords.length === 0,
      onClick: (e) => {
        e.stopPropagation();
        this.handlePlayBlock(index);
      }
    });
    buttonPanel.appendChild(playButton);
    
    // Кнопка удаления блока
    const deleteButton = this.createElement('button', {
      className: 'block-delete-button',
      textContent: '×',
      // Если это последний блок, деактивируем кнопку удаления
      disabled: this.trackStructure.blocks.length <= 1,
      onClick: (e) => {
        e.stopPropagation();
        this.handleRemoveBlock(index);
      }
    });
    buttonPanel.appendChild(deleteButton);
    
    blockElement.appendChild(buttonPanel);
    
    // Добавляем обработчик клика для выбора блока
    blockElement.addEventListener('click', (e) => {
      // Проверяем, что клик не был по кнопке или редактируемому элементу
      if (!e.target.closest('button') && 
          !e.target.closest('.block-name') && 
          !e.target.closest('.block-tonality')) {
        this.handleLoadBlock(index);
      }
    });
    
    return blockElement;
  }
  
  /**
   * Обработка добавления нового блока
   */
  handleAddBlock() {
    trackStructureService.addNewBlock();
  }
  
  /**
   * Обработка загрузки блока
   * @param {number} index - Индекс блока
   */
  handleLoadBlock(index) {
    trackStructureService.loadBlockSequence(index);
  }
  
  /**
   * Обработка воспроизведения блока
   * @param {number} index - Индекс блока
   */
  handlePlayBlock(index) {
    // Получаем блок
    const block = this.trackStructure.getBlockAt(index);
    if (!block || !block.chords || block.chords.length === 0) return;
    
    // Воспроизводим последовательность
    eventBus.publish('playCustomSequence', {
      sequence: block.chords,
      loop: true
    });
  }
  
  /**
   * Обработка воспроизведения всего трека
   */
  handlePlayFullTrack() {
    trackStructureService.trackStructure.playFullTrack();
  }
  
  /**
   * Обработка удаления блока
   * @param {number} index - Индекс блока
   */
  handleRemoveBlock(index) {
    // Запрашиваем подтверждение
    const block = this.trackStructure.getBlockAt(index);
    if (!block) return;
    
    if (confirm(`Вы уверены, что хотите удалить блок "${block.name}"?`)) {
      trackStructureService.removeBlock(index);
    }
  }
  
  /**
   * Обработка переименования блока
   * @param {number} index - Индекс блока
   */
  handleRenameBlock(index) {
    // Получаем блок
    const block = this.trackStructure.getBlockAt(index);
    if (!block) return;
    
    // Запрашиваем новое имя
    const newName = prompt('Введите новое имя блока (формат: буква+цифра, например A1, B2):', block.name);
    
    // Проверяем ввод
    if (newName && newName !== block.name && /^[A-Z][1-9](\d*)$/.test(newName)) {
      trackStructureService.renameBlock(index, newName);
    } else if (newName) {
      alert('Некорректный формат имени. Используйте формат буква+цифра, например A1, B2.');
    }
  }
  
  /**
   * Обработка изменения тональности блока
   * @param {number} index - Индекс блока
   */
  handleChangeTonality(index) {
    // Получаем блок
    const block = this.trackStructure.getBlockAt(index);
    if (!block) return;
    
    // Создаем список доступных тональностей
    let tonalityOptions = '';
    Object.entries(window.TONALITY_DATA).forEach(([key, value]) => {
      tonalityOptions += `${key} (${value.name})\n`;
    });
    
    // Запрашиваем новую тональность
    const newTonality = prompt(
      `Выберите тональность:\n${tonalityOptions}`, 
      block.tonality
    );
    
    // Проверяем ввод
    if (newTonality && window.TONALITY_DATA[newTonality]) {
      trackStructureService.changeBlockTonality(index, newTonality);
    } else if (newTonality) {
      alert('Выбрана несуществующая тональность.');
    }
  }
  
  /**
   * Обработка события добавления блока
   * @param {Object} data - Данные события
   */
  handleBlockAdded(data) {
    // Обновляем UI
    this.render();
  }
  
  /**
   * Обработка события удаления блока
   * @param {Object} data - Данные события
   */
  handleBlockRemoved(data) {
    // Обновляем UI
    this.render();
  }
  
  /**
   * Обработка события переименования блока
   * @param {Object} data - Данные события
   */
  handleBlockRenamed(data) {
    // Обновляем UI
    this.render();
  }
  
  /**
   * Обработка события изменения тональности блока
   * @param {Object} data - Данные события
   */
  handleBlockTonalityChanged(data) {
    // Обновляем UI
    this.render();
  }
  
  /**
   * Обработка изменений из store
   * @param {Object} state - Состояние store
   * @param {string} changedProp - Измененное свойство
   */
  handleStateChange(state, changedProp) {
    // Обновляем локальное состояние
    if (changedProp === 'trackStructure') {
      this.trackStructure = trackStructureService.getTrackStructure();
      this.render();
    } else if (changedProp === 'currentBlockIndex') {
      this.currentBlockIndex = state.currentBlockIndex;
      this.render();
    }
  }
}

export default TrackStructureManager;