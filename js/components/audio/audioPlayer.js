/**
 * audioPlayer.js
 * Компонент для управления воспроизведением звука
 */

import Component from '../component.js';
import store from '../../core/store.js';
import audioService from '../../services/audioService.js';
import eventBus from '../../core/eventBus.js';

class AudioPlayer extends Component {
  /**
   * Создает новый компонент аудио плеера
   * @param {HTMLElement} container - Контейнер для элементов управления
   * @param {Object} options - Настройки компонента
   */
  constructor(container, options = {}) {
    super(container, {
      ...options,
      autoRender: true
    });
    
    // Состояние плеера
    this.isPlaying = false;
    this.tempo = store.getTempo();
    
    // Подписываемся на изменения в store
    this.subscribeToStore(this.handleStateChange, ['isPlaying', 'tempo']);
    
    // Подписываемся на события шины событий
    this.subscribeToEvent('playbackStarted', this.handlePlaybackStarted.bind(this));
    this.subscribeToEvent('playbackStopped', this.handlePlaybackStopped.bind(this));
  }
  
  /**
   * Рендеринг компонента
   */
  render() {
    if (!this.container) return;
    
    this.clearContainer();
    
    // Создаем основной контейнер элементов управления
    const controlsContainer = this.createElement('div', {
      className: 'audio-controls'
    });
    
    // Создаем элементы управления воспроизведением
    const playbackControls = this.createElement('div', {
      className: 'playback-controls'
    });
    
    // Кнопка воспроизведения
    const playButton = this.createElement('button', {
      id: 'play-button',
      className: 'play-button',
      disabled: this.isPlaying,
      textContent: '▶',
      title: 'Воспроизвести',
      onClick: this.handlePlayClick.bind(this)
    });
    playbackControls.appendChild(playButton);
    
    // Кнопка остановки
    const stopButton = this.createElement('button', {
      id: 'stop-button',
      className: 'stop-button',
      disabled: !this.isPlaying,
      textContent: '■',
      title: 'Остановить',
      onClick: this.handleStopClick.bind(this)
    });
    playbackControls.appendChild(stopButton);
    
    // Добавляем элементы управления воспроизведением в основной контейнер
    controlsContainer.appendChild(playbackControls);
    
    // Создаем элементы управления темпом
    const tempoControls = this.createElement('div', {
      className: 'tempo-control'
    });
    
    // Метка темпа
    const tempoLabel = this.createElement('label', {
      htmlFor: 'tempo-input',
      textContent: 'Темп:'
    });
    tempoControls.appendChild(tempoLabel);
    
    // Ввод темпа
    const tempoInput = this.createElement('input', {
      id: 'tempo-input',
      type: 'number',
      min: '40',
      max: '240',
      value: this.tempo,
      onChange: this.handleTempoChange.bind(this)
    });
    tempoControls.appendChild(tempoInput);
    
    // Единица измерения
    const tempoUnit = this.createElement('span', {
      textContent: 'BPM'
    });
    tempoControls.appendChild(tempoUnit);
    
    // Добавляем элементы управления темпом в основной контейнер
    controlsContainer.appendChild(tempoControls);
    
    // Добавляем контейнер в родительский контейнер
    this.container.appendChild(controlsContainer);
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
   * Обработка изменения темпа
   * @param {Event} event - Событие изменения
   */
  handleTempoChange(event) {
    const tempo = parseInt(event.target.value);
    if (!isNaN(tempo) && tempo >= 40 && tempo <= 240) {
      store.setTempo(tempo);
    } else {
      // Восстанавливаем предыдущее значение
      event.target.value = this.tempo;
    }
  }
  
  /**
   * Обработка начала воспроизведения
   * @param {Object} data - Данные события
   */
  handlePlaybackStarted(data) {
    this.isPlaying = true;
    this.updatePlaybackControls();
  }
  
  /**
   * Обработка остановки воспроизведения
   * @param {Object} data - Данные события
   */
  handlePlaybackStopped(data) {
    this.isPlaying = false;
    this.updatePlaybackControls();
  }
  
  /**
   * Обновление элементов управления воспроизведением
   */
  updatePlaybackControls() {
    const playButton = document.getElementById('play-button');
    const stopButton = document.getElementById('stop-button');
    
    if (playButton) {
      playButton.disabled = this.isPlaying;
    }
    
    if (stopButton) {
      stopButton.disabled = !this.isPlaying;
    }
  }
  
  /**
   * Обработка изменений в store
   * @param {Object} state - Состояние store
   * @param {string} changedProp - Измененное свойство
   */
  handleStateChange(state, changedProp) {
    if (changedProp === 'isPlaying') {
      this.isPlaying = state.isPlaying;
      this.updatePlaybackControls();
    } else if (changedProp === 'tempo') {
      this.tempo = state.tempo;
      
      // Обновляем элемент ввода темпа
      const tempoInput = document.getElementById('tempo-input');
      if (tempoInput) {
        tempoInput.value = this.tempo;
      }
    }
  }
}

export default AudioPlayer;