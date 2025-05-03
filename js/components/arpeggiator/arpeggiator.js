/**
 * arpeggiator.js
 * Компонент для арпеджирования аккордов в современной архитектуре
 */

import Component from '../component.js';
import store from '../../core/store.js';
import audioService from '../../services/audioService.js';
import eventBus from '../../core/eventBus.js';

class Arpeggiator extends Component {
  /**
   * Создает новый компонент арпеджиатора
   * @param {HTMLElement} container - Контейнер для UI элементов
   * @param {Object} options - Настройки компонента
   */
  constructor(container, options = {}) {
    super(container, {
      ...options,
      autoRender: false
    });
    
    // Инициализируем настройки по умолчанию
    this.settings = {
      enabled: false,        // Включен ли арпеджиатор
      pattern: 'up',         // Паттерн арпеджио (up, down, updown, downup, random)
      octaveRange: 1,        // Диапазон октав (1-3)
      octaveOffset: 0,       // Смещение октавы (-2, -1, 0, 1)
      noteLength: '8n',      // Длительность нот (8n = восьмые, 16n = шестнадцатые, 32n = тридцать вторые)
      velocity: 0.7,         // Громкость нот (0-1)
      accentFirst: true      // Акцентировать первую ноту в арпеджио
    };
    
    // Загружаем сохраненные настройки
    this.loadSettings();
    
    // Подписываемся на изменения в store
    this.subscribeToStore(this.handleStateChange, ['arpeggiatorEnabled']);
    
    // Инициализируем UI
    this.init();
  }
  
  /**
   * Инициализация компонента
   */
  init() {
    console.log('Инициализация компонента арпеджиатора');
    
    // Публикуем настройки в аудио сервис
    this.updateAudioService();
    
    // Рендерим UI
    this.render();
    
    // Публикуем событие инициализации
    eventBus.publish('arpeggiatorInitialized', {
      settings: this.settings
    });
  }
  
  /**
   * Рендеринг UI компонента
   */
  render() {
    if (!this.container) return;
    
    this.clearContainer();
    
    // Создаем заголовок
    const title = this.createElement('div', {
      className: 'arpeggiator-title',
      textContent: 'Арпеджиатор',
      style: {
        fontWeight: 'bold',
        marginBottom: '10px'
      }
    });
    this.container.appendChild(title);
    
    // Создаем основной контейнер настроек
    const settingsContainer = this.createElement('div', {
      className: 'arpeggiator-settings'
    });
    
    // 1. Переключатель включения/выключения
    const toggleContainer = this.createSettingRow('Включить:');
    const toggle = this.createElement('input', {
      type: 'checkbox',
      id: 'arpeggiator-toggle',
      checked: this.settings.enabled,
      onChange: this.handleToggleChange.bind(this)
    });
    toggleContainer.appendChild(toggle);
    settingsContainer.appendChild(toggleContainer);
    
    // 2. Селектор паттерна
    const patternContainer = this.createSettingRow('Паттерн:');
    const patternSelector = this.createElement('select', {
      id: 'arpeggiator-pattern',
      onChange: this.handlePatternChange.bind(this)
    });
    
    // Добавляем опции паттернов
    const patterns = [
      { value: 'up', label: 'Вверх' },
      { value: 'down', label: 'Вниз' },
      { value: 'updown', label: 'Вверх-вниз' },
      { value: 'downup', label: 'Вниз-вверх' },
      { value: 'random', label: 'Случайно' }
    ];
    
    patterns.forEach(pattern => {
      const option = this.createElement('option', {
        value: pattern.value,
        textContent: pattern.label,
        selected: this.settings.pattern === pattern.value
      });
      patternSelector.appendChild(option);
    });
    
    patternContainer.appendChild(patternSelector);
    settingsContainer.appendChild(patternContainer);
    
    // 3. Селектор диапазона октав
    const octaveContainer = this.createSettingRow('Октавы:');
    const octaveSelector = this.createElement('select', {
      id: 'arpeggiator-octave',
      onChange: this.handleOctaveChange.bind(this)
    });
    
    // Добавляем опции октав
    for (let i = 1; i <= 3; i++) {
      const option = this.createElement('option', {
        value: i,
        textContent: i,
        selected: this.settings.octaveRange === i
      });
      octaveSelector.appendChild(option);
    }
    
    octaveContainer.appendChild(octaveSelector);
    settingsContainer.appendChild(octaveContainer);
    
    // 4. Селектор смещения октавы
    const offsetContainer = this.createSettingRow('Смещение:');
    const offsetSelector = this.createElement('select', {
      id: 'arpeggiator-offset',
      onChange: this.handleOffsetChange.bind(this)
    });
    
    // Добавляем опции смещения
    const offsets = [
      { value: -2, label: '-2' },
      { value: -1, label: '-1' },
      { value: 0, label: '0' },
      { value: 1, label: '+1' }
    ];
    
    offsets.forEach(offset => {
      const option = this.createElement('option', {
        value: offset.value,
        textContent: offset.label,
        selected: this.settings.octaveOffset === offset.value
      });
      offsetSelector.appendChild(option);
    });
    
    offsetContainer.appendChild(offsetSelector);
    settingsContainer.appendChild(offsetContainer);
    
    // 5. Селектор длительности нот
    const lengthContainer = this.createSettingRow('Длительность:');
    const lengthSelector = this.createElement('select', {
      id: 'arpeggiator-note-length',
      onChange: this.handleNoteLengthChange.bind(this)
    });
    
    // Добавляем опции длительности
    const lengths = [
      { value: '8n', label: '1/8' },
      { value: '16n', label: '1/16' },
      { value: '32n', label: '1/32' }
    ];
    
    lengths.forEach(length => {
      const option = this.createElement('option', {
        value: length.value,
        textContent: length.label,
        selected: this.settings.noteLength === length.value
      });
      lengthSelector.appendChild(option);
    });
    
    lengthContainer.appendChild(lengthSelector);
    settingsContainer.appendChild(lengthContainer);
    
    // 6. Чекбокс акцента
    const accentContainer = this.createSettingRow('Акцент первой ноты:');
    const accentToggle = this.createElement('input', {
      type: 'checkbox',
      id: 'arpeggiator-accent',
      checked: this.settings.accentFirst,
      onChange: this.handleAccentChange.bind(this)
    });
    accentContainer.appendChild(accentToggle);
    settingsContainer.appendChild(accentContainer);
    
    // Добавляем контейнер настроек в основной контейнер
    this.container.appendChild(settingsContainer);
  }
  
  /**
   * Создание строки настройки с меткой
   * @param {string} labelText - Текст метки
   * @returns {HTMLElement} Контейнер строки настройки
   */
  createSettingRow(labelText) {
    const container = this.createElement('div', {
      className: 'arpeggiator-setting-row'
    });
    
    const label = this.createElement('label', {
      className: 'arpeggiator-setting-label',
      textContent: labelText
    });
    
    container.appendChild(label);
    return container;
  }
  
  /**
   * Загрузка настроек из localStorage
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('arpeggiatorSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        
        // Обновляем настройки из сохраненных значений
        this.settings = {
          ...this.settings,
          ...parsedSettings
        };
        
        console.log('Загружены настройки арпеджиатора:', this.settings);
      }
    } catch (e) {
      console.error('Ошибка при загрузке настроек арпеджиатора:', e);
    }
  }
  
  /**
   * Сохранение настроек в localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('arpeggiatorSettings', JSON.stringify(this.settings));
      console.log('Настройки арпеджиатора сохранены');
      
      // Обновляем настройки в аудио сервисе
      this.updateAudioService();
      
      // Публикуем событие изменения настроек
      eventBus.publish('arpeggiatorSettingsChanged', {
        settings: this.settings
      });
    } catch (e) {
      console.error('Ошибка при сохранении настроек арпеджиатора:', e);
    }
  }
  
  /**
   * Обновление настроек в аудио сервисе
   */
  updateAudioService() {
    // Передаем настройки в аудио сервис
    audioService.saveArpeggiatorSettings(this.settings);
    
    // Обновляем состояние в store
    store.setArpeggiatorEnabled(this.settings.enabled);
  }
  
  /**
   * Обработчик изменения переключателя
   * @param {Event} event - Событие изменения
   */
  handleToggleChange(event) {
    this.settings.enabled = event.target.checked;
    this.saveSettings();
  }
  
  /**
   * Обработчик изменения паттерна
   * @param {Event} event - Событие изменения
   */
  handlePatternChange(event) {
    this.settings.pattern = event.target.value;
    this.saveSettings();
  }
  
  /**
   * Обработчик изменения диапазона октав
   * @param {Event} event - Событие изменения
   */
  handleOctaveChange(event) {
    this.settings.octaveRange = parseInt(event.target.value);
    this.saveSettings();
  }
  
  /**
   * Обработчик изменения смещения октавы
   * @param {Event} event - Событие изменения
   */
  handleOffsetChange(event) {
    this.settings.octaveOffset = parseInt(event.target.value);
    this.saveSettings();
  }
  
  /**
   * Обработчик изменения длительности нот
   * @param {Event} event - Событие изменения
   */
  handleNoteLengthChange(event) {
    this.settings.noteLength = event.target.value;
    this.saveSettings();
  }
  
  /**
   * Обработчик изменения акцента
   * @param {Event} event - Событие изменения
   */
  handleAccentChange(event) {
    this.settings.accentFirst = event.target.checked;
    this.saveSettings();
  }
  
  /**
   * Включение/выключение арпеджиатора
   * @param {boolean} enabled - Флаг включения
   */
  setEnabled(enabled) {
    this.settings.enabled = enabled;
    
    // Обновляем UI
    const toggle = document.getElementById('arpeggiator-toggle');
    if (toggle) {
      toggle.checked = enabled;
    }
    
    this.saveSettings();
  }
  
  /**
   * Получение настроек арпеджиатора
   * @returns {Object} Текущие настройки
   */
  getSettings() {
    return { ...this.settings };
  }
  
  /**
   * Обработка изменений состояния store
   * @param {Object} state - Состояние store
   * @param {string} changedProp - Измененное свойство
   */
  handleStateChange(state, changedProp) {
    if (changedProp === 'arpeggiatorEnabled') {
      // Обновляем локальные настройки, если они отличаются от состояния в store
      if (this.settings.enabled !== state.arpeggiatorEnabled) {
        this.settings.enabled = state.arpeggiatorEnabled;
        
        // Обновляем UI
        const toggle = document.getElementById('arpeggiator-toggle');
        if (toggle) {
          toggle.checked = state.arpeggiatorEnabled;
        }
        
        // Сохраняем настройки
        this.saveSettings();
      }
    }
  }
}

// Экспортируем класс
export default Arpeggiator;