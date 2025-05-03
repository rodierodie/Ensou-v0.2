/**
 * metronomeControl.js
 * Компонент для управления метрономом
 */

import Component from '../component.js';
import store from '../../core/store.js';
import audioService from '../../services/audioService.js';
import eventBus from '../../core/eventBus.js';

class MetronomeControl extends Component {
  /**
   * Создает новый компонент управления метрономом
   * @param {HTMLElement} container - Контейнер для элементов управления
   * @param {Object} options - Настройки компонента
   */
  constructor(container, options = {}) {
    super(container, {
      ...options,
      autoRender: true
    });
    
    // Состояние метронома
    this.enabled = store.getMetronomeEnabled();
    
    // Подписываемся на изменения в store
    this.subscribeToStore(this.handleStateChange, ['metronomeEnabled']);
  }
  
  /**
   * Рендеринг компонента
   */
  render() {
    if (!this.container) return;
    
    this.clearContainer();
    
    // Создаем основной контейнер
    const metronomeContainer = this.createElement('div', {
      className: 'metronome-control'
    });
    
    // Создаем элемент для переключения метронома
    const toggleContainer = this.createElement('label', {
      className: 'checkbox-container'
    });
    
    // Создаем чекбокс
    const checkbox = this.createElement('input', {
      id: 'metronome-checkbox',
      type: 'checkbox',
      checked: this.enabled,
      onChange: this.handleMetronomeChange.bind(this)
    });
    toggleContainer.appendChild(checkbox);
    
    // Создаем метку
    const label = this.createElement('span', {
      className: 'checkbox-label',
      textContent: 'Метроном'
    });
    toggleContainer.appendChild(label);
    
    metronomeContainer.appendChild(toggleContainer);
    
    // Добавляем настройки метронома (если включен)
    if (this.enabled) {
      // Создаем контейнер для дополнительных настроек
      const settingsContainer = this.createElement('div', {
        className: 'metronome-settings'
      });
      
      // В будущем здесь могут быть дополнительные настройки метронома,
      // такие как акцент первой доли, выбор размера такта и т.д.
      
      metronomeContainer.appendChild(settingsContainer);
    }
    
    this.container.appendChild(metronomeContainer);
  }
  
  /**
   * Обработка изменения состояния метронома
   * @param {Event} event - Событие изменения
   */
  handleMetronomeChange(event) {
    const enabled = event.target.checked;
    store.setMetronomeEnabled(enabled);
    
    // Публикуем событие изменения состояния метронома
    eventBus.publish('metronomeStateChanged', {
      enabled: enabled
    });
  }
  
  /**
   * Обработка изменений в store
   * @param {Object} state - Состояние store
   * @param {string} changedProp - Измененное свойство
   */
  handleStateChange(state, changedProp) {
    if (changedProp === 'metronomeEnabled') {
      this.enabled = state.metronomeEnabled;
      
      // Обновляем чекбокс
      const checkbox = document.getElementById('metronome-checkbox');
      if (checkbox) {
        checkbox.checked = this.enabled;
      }
      
      // Перерисовываем компонент для отображения/скрытия дополнительных настроек
      this.render();
    }
  }
  
  /**
   * Включение/выключение метронома программно
   * @param {boolean} enabled - Флаг включения
   */
  setEnabled(enabled) {
    if (this.enabled !== enabled) {
      store.setMetronomeEnabled(enabled);
    }
  }
  
  /**
   * Получение текущего состояния метронома
   * @returns {boolean} Флаг включения
   */
  isEnabled() {
    return this.enabled;
  }
}

export default MetronomeControl;