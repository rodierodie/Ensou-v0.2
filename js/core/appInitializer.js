/**
 * appInitializer.js
 * Utility для инициализации приложения с модернизированными компонентами
 */

import store from './store.js';
import eventBus from './eventBus.js';
import { initializeBridgeAdapter, ensureGlobalData } from './bridgeAdapter.js';
import audioService from '../services/audioService.js';
import storageService from '../services/storageService.js';
import exportService from '../services/exportService.js';

// Импорт модернизированных компонентов
import AudioPlayer from '../components/audio/audioPlayer.js';
import MetronomeControl from '../components/audio/metronomeControl.js';
import TonalitySelector from '../components/tonality/tonalitySelector.js';
import TonalityCircle from '../components/tonality/tonalityCircle.js';
import ModernChordSelector from '../components/chords/modernChordSelector.js';
import ModernChordInfo from '../components/chords/modernChordInfo.js';
import ChordSuggestions from '../components/chords/chordSuggestions.js';
import ModernSequencer from '../components/sequencer/modernSequencer.js';
import TrackStructureManager from '../components/track/trackStructureManager.js';
import Arpeggiator from '../components/arpeggiator/arpeggiator.js';

class AppInitializer {
  /**
   * Инициализация приложения
   * @returns {Promise} Промис завершения инициализации
   */
  static async initialize() {
    try {
      console.log('Начало инициализации приложения...');
      
      // Инициализация моделей данных
      await this.initializeDataModels();
      
      // Обеспечиваем наличие глобальных данных для обратной совместимости
      ensureGlobalData();
      
      // Инициализация мостового адаптера
      initializeBridgeAdapter();
      
      // Инициализация аудио сервиса
      await audioService.initialize();
      
      // Загрузка сохраненных данных
      storageService.loadData();
      
      // Создание компонентов UI
      this.createComponents();
      
      // Настройка обработчиков событий
      this.setupEventListeners();
      
      console.log('Приложение успешно инициализировано');
      
      // Публикуем событие успешной инициализации
      eventBus.publish('appInitialized', {
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
      this.showErrorNotification('Ошибка инициализации приложения. Попробуйте перезагрузить страницу.');
      return false;
    }
  }
  
  /**
   * Инициализация моделей данных
   * @returns {Promise} Промис завершения инициализации моделей
   */
  static async initializeDataModels() {
    // Динамически импортируем и инициализируем модели
    try {
      const { default: initializeDataModels } = await import('../models/initializeData.js');
      await initializeDataModels();
    } catch (error) {
      console.error('Ошибка инициализации моделей данных:', error);
      throw error;
    }
    
    return true;
  }
  
  /**
   * Создание и инициализация UI компонентов
   */
  static createComponents() {
    // Компоненты аудио
    const audioControlsContainer = document.getElementById('audio-controls');
    if (audioControlsContainer) {
      new AudioPlayer(audioControlsContainer);
    }
    
    const metronomeContainer = document.getElementById('metronome-container');
    if (metronomeContainer) {
      new MetronomeControl(metronomeContainer);
    }
    
    // Компоненты тональности
    const tonalitySelectorContainer = document.getElementById('tonality-selector-container');
    const tonalityCircleContainer = document.getElementById('tonality-circle-container');
    
    if (tonalitySelectorContainer) {
      new TonalitySelector(tonalitySelectorContainer);
    }
    
    if (tonalityCircleContainer) {
      new TonalityCircle(tonalityCircleContainer);
    }
    
    // Компоненты аккордов
    const basicChordsContainer = document.getElementById('basic-chords');
    const seventhChordsContainer = document.getElementById('seventh-chords');
    const chordInfoContainer = document.getElementById('chord-info-section');
    
    if (basicChordsContainer && seventhChordsContainer) {
      new ModernChordSelector(basicChordsContainer, seventhChordsContainer);
    }
    
    if (chordInfoContainer) {
      new ModernChordInfo(chordInfoContainer);
    }
    
    // Компонент подсказок аккордов
    const suggestionsContainer = document.getElementById('chord-suggestions-container');
    if (suggestionsContainer) {
      new ChordSuggestions(suggestionsContainer);
    }
    
    // Компонент арпеджиатора
    const arpeggiatorContainer = document.getElementById('arpeggiator-container');
    if (arpeggiatorContainer) {
      new Arpeggiator(arpeggiatorContainer);
    }
    
    // Компоненты секвенсора
    const sequenceControlsContainer = document.getElementById('sequence-controls');
    const sequenceContainer = document.getElementById('sequence-container');
    
    if (sequenceControlsContainer && sequenceContainer) {
      new ModernSequencer(sequenceControlsContainer, sequenceContainer);
    }
    
    // Компонент структуры трека
    const trackStructureContainer = document.getElementById('track-structure-container');
    if (trackStructureContainer) {
      new TrackStructureManager(trackStructureContainer);
    }
    
    // Настройка элементов экспорта
    this.setupExportButtons();
  }
  
  /**
   * Настройка кнопок экспорта
   */
  static setupExportButtons() {
    // MIDI экспорт (текущая последовательность)
    const exportMidiButton = document.getElementById('export-midi');
    if (exportMidiButton) {
      exportMidiButton.addEventListener('click', () => {
        exportService.exportToMidi(false);
      });
    }
    
    // Text экспорт (текущая последовательность)
    const exportTextButton = document.getElementById('export-text');
    if (exportTextButton) {
      exportTextButton.addEventListener('click', () => {
        exportService.exportToText(false);
      });
    }
    
    // MIDI экспорт (полный трек)
    const exportTrackMidiButton = document.getElementById('export-track-midi');
    if (exportTrackMidiButton) {
      exportTrackMidiButton.addEventListener('click', () => {
        exportService.exportToMidi(true);
      });
    }
    
    // Text экспорт (полный трек)
    const exportTrackTextButton = document.getElementById('export-track-text');
    if (exportTrackTextButton) {
      exportTrackTextButton.addEventListener('click', () => {
        exportService.exportToText(true);
      });
    }
    
    // Экспорт проекта
    const exportProjectButton = document.getElementById('export-data');
    if (exportProjectButton) {
      exportProjectButton.addEventListener('click', () => {
        storageService.exportProjectToFile();
      });
    }
    
    // Импорт проекта
    const importProjectInput = document.getElementById('import-data');
    if (importProjectInput) {
      importProjectInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          storageService.importProjectFromFile(file)
            .then(() => this.showNotification('Проект успешно импортирован', 'success'))
            .catch(error => this.showNotification('Ошибка импорта проекта: ' + error.message, 'error'));
        }
      });
    }
  }
  
  /**
   * Настройка глобальных обработчиков событий
   */
  static setupEventListeners() {
    // Сохранение данных перед закрытием страницы
    window.addEventListener('beforeunload', () => {
      storageService.saveData();
    });
    
    // Обработка нажатий клавиш
    document.addEventListener('keydown', (event) => {
      // Если фокус в полях ввода - не обрабатываем
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA' || 
          document.activeElement.tagName === 'SELECT') {
        return;
      }
      
      // Пробел - воспроизведение/остановка
      if (event.code === 'Space') {
        event.preventDefault();
        store.setIsPlaying(!store.getIsPlaying());
      }
      
      // Escape - остановка
      if (event.code === 'Escape') {
        store.setIsPlaying(false);
      }
    });
    
    // Запуск аудио контекста по первому взаимодействию
    const startAudio = async () => {
      try {
        await audioService.startAudioContext();
        // Удаляем обработчики после успешного запуска
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
        document.removeEventListener('touchstart', startAudio);
      } catch (error) {
        console.error('Ошибка запуска аудио контекста:', error);
      }
    };
    
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
    document.addEventListener('touchstart', startAudio);
    
    // Обработчик для кнопки показа/скрытия квартоквинтового круга
    const toggleCircleButton = document.getElementById('toggle-circle');
    if (toggleCircleButton) {
      toggleCircleButton.addEventListener('click', () => {
        const circleContainer = document.getElementById('tonality-circle-container');
        if (circleContainer) {
          const isVisible = circleContainer.style.display !== 'none';
          circleContainer.style.display = isVisible ? 'none' : 'block';
          toggleCircleButton.textContent = isVisible ? 'Показать круг тональностей' : 'Скрыть круг тональностей';
        }
      });
    }
  }
  
  /**
   * Отображение уведомления
   * @param {string} message - Текст уведомления
   * @param {string} type - Тип уведомления (info, success, warning, error)
   */
  static showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Добавляем на страницу
    document.body.appendChild(notification);
    
    // Запускаем анимацию появления
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Автоматическое скрытие через 3 секунды
    setTimeout(() => {
      notification.classList.remove('show');
      
      // Удаляем элемент после окончания анимации
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  /**
   * Отображение уведомления об ошибке
   * @param {string} message - Текст уведомления
   */
  static showErrorNotification(message) {
    this.showNotification(message, 'error');
  }
}

export default AppInitializer;