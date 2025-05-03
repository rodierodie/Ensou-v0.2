// js/components/arpeggiator/arpeggiatorSettings.js
import Component from '../component.js';
import store from '../../core/store.js';
import audioService from '../../services/audioService.js';

class ArpeggiatorSettings extends Component {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      autoRender: true
    });
    
    // Настройки по умолчанию
    this.settings = audioService.getArpeggiatorSettings();
    
    // Подписываемся на изменения состояния арпеджиатора
    this.subscribeToStore(this.handleStateChange, ['arpeggiatorEnabled']);
  }
  
  render() {
    this.clearContainer();
    
    // Создаем заголовок
    const title = this.createElement('div', {
      className: 'arpeggiator-title',
      textContent: 'Арпеджиатор',
      style: {
        fontWeight: 'bold',
        marginRight: '15px'
      }
    });
    
    // Создаем контейнер настроек
    const settingsContainer = this.createElement('div', {
      className: 'arpeggiator-settings'
    });
    
    // Создаем переключатель вкл/выкл
    const toggleContainer = this.createElement('div', {
      className: 'checkbox-container'
    });
    
    const toggleCheckbox = this.createElement('input', {
      type: 'checkbox',
      id: 'arpeggiator-toggle',
      checked: store.getArpeggiatorEnabled(),
      onChange: this.handleArpeggiatorToggle.bind(this)
    });
    
    const toggleLabel = this.createElement('span', {
      className: 'checkbox-label',
      textContent: 'Включить'
    });
    
    toggleContainer.appendChild(toggleCheckbox);
    toggleContainer.appendChild(toggleLabel);
    
    // Создаем селектор паттерна
    const patternContainer = this.createElement('div', {
      className: 'arpeggiator-control'
    });
    
    const patternLabel = this.createElement('label', {
      htmlFor: 'arpeggiator-pattern',
      textContent: 'Паттерн:'
    });
    
    const patternSelect = this.createElement('select', {
      id: 'arpeggiator-pattern',
      onChange: this.handlePatternChange.bind(this)
    });
    
    // Добавляем опции
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
      patternSelect.appendChild(option);
    });
    
    patternContainer.appendChild(patternLabel);
    patternContainer.appendChild(patternSelect);
    
    // Добавляем остальные селекторы по аналогии...
    
    // Собираем все элементы вместе
    settingsContainer.appendChild(toggleContainer);
    settingsContainer.appendChild(patternContainer);
    // ... добавляем остальные контролы
    
    this.container.appendChild(title);
    this.container.appendChild(settingsContainer);
  }
  
  handleArpeggiatorToggle(event) {
    const enabled = event.target.checked;
    store.setArpeggiatorEnabled(enabled);
    
    // Сохраняем настройку
    this.settings.enabled = enabled;
    audioService.saveArpeggiatorSettings(this.settings);
  }
  
  handlePatternChange(event) {
    const pattern = event.target.value;
    this.settings.pattern = pattern;
    audioService.saveArpeggiatorSettings(this.settings);
  }
  
  // Остальные обработчики для других настроек...
  
  handleStateChange(state) {
    // Обновляем переключатель при изменении состояния
    const toggle = document.getElementById('arpeggiator-toggle');
    if (toggle) {
      toggle.checked = state.arpeggiatorEnabled;
    }
  }
}

export default ArpeggiatorSettings;