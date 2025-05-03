/**
 * bridgeAdapter.js
 * Адаптер для обеспечения обратной совместимости между
 * старой глобальной архитектурой и новой модульной системой
 */

import store from './store.js';
import eventBus from './eventBus.js';
import audioService from '../services/audioService.js';
import chordSuggestions from '../components/chords/chordSuggestions.js';
import { chordCollection } from '../models/chord.js';
import { tonalityCollection } from '../models/tonality.js';
import trackStructureService from '../models/trackStructure.js';

/**
 * Инициализация мостового адаптера
 * Создает глобальные объекты, совместимые со старой архитектурой
 */
export function initializeBridgeAdapter() {
  console.log('Инициализация мостового адаптера...');
  
  // Создаем мостовой объект для UI
  window.UI = createUIBridge();
  
  // Создаем мостовой объект для Sequencer
  window.Sequencer = createSequencerBridge();
  
  // Создаем мостовой объект для Instrument
  window.Instrument = createInstrumentBridge();
  
  // Создаем мостовой объект для ChordSuggestions
  window.ChordSuggestions = createChordSuggestionsBridge();
  
  // Создаем мостовой объект для Arpeggiator
  window.Arpeggiator = createArpeggiatorBridge();
  
  // Создаем мостовой объект для TrackStructure
  window.TrackStructure = createTrackStructureBridge();
  
  console.log('Мостовой адаптер успешно инициализирован');
}

/**
 * Создание моста для UI
 */
function createUIBridge() {
  return {
    // Геттеры
    getCurrentChord: () => store.getCurrentChord(),
    getCurrentTonality: () => store.getCurrentTonality(),
    
    // Сеттеры
    setCurrentChord: (chord) => store.setCurrentChord(chord),
    changeTonality: (tonality) => store.setCurrentTonality(tonality),
    
    // Методы для обновления UI компонентов
    updateChordInfo: (chordName) => {
      // Публикуем событие для обновления информации об аккорде
      eventBus.publish('updateChordInfo', { chordName });
    },
    
    // Методы для уведомлений
    showNotification: (message, type = 'info') => {
      // Публикуем событие для показа уведомления
      eventBus.publish('showNotification', { message, type });
    },
    
    // Флаг для предотвращения циклических обновлений
    setInternalTonalityChange: (value) => {
      // Сохраняем флаг в store
      store.setState({ internalTonalityChange: value });
    }
  };
}

/**
 * Создание моста для Sequencer
 */
function createSequencerBridge() {
  return {
    // Флаги состояния
    isPlaying: false,
    loopCustomSequence: false,
    
    // Геттеры
    getSequence: () => store.getSequence(),
    getTempo: () => store.getTempo(),
    getIsPlaying: () => store.getIsPlaying(),
    
    // Методы управления секвенсором
    addChordToSequence: (chord) => store.addChordToSequence(chord),
    addPauseToSequence: () => store.addChordToSequence('PAUSE'),
    playSequence: () => store.setIsPlaying(true),
    stopSequence: () => store.setIsPlaying(false),
    clearSequence: () => store.clearSequence(),
    
    // Методы для воспроизведения пользовательской последовательности
    playCustomSequence: (sequence, loop = false) => {
      // Сохраняем флаг зацикливания
      window.Sequencer.loopCustomSequence = loop;
      
      // Воспроизводим последовательность через аудио сервис
      audioService.playSequence(sequence, loop);
    },
    
    // Установка последовательности
    setSequence: (sequence) => store.setSequence(sequence),
    
    // Инициализация секвенсора
    initializeSequencer: () => {
      // Подписываемся на события изменения состояния
      store.subscribe((state, changedProp) => {
        if (changedProp === 'isPlaying') {
          window.Sequencer.isPlaying = state.isPlaying;
        }
      });
      
      // Загружаем сохраненный темп
      const tempo = store.getTempo();
      const tempoInput = document.getElementById('tempo-input');
      if (tempoInput) {
        tempoInput.value = tempo;
      }
    }
  };
}

/**
 * Создание моста для Instrument
 */
function createInstrumentBridge() {
  return {
    // Ссылка на инструменты
    instruments: null,
    
    // Методы воспроизведения
    playChord: (chordName) => audioService.playChord(chordName),
    playChordNotes: (notes) => {
      // Если notes - массив строк, проигрываем через аудио сервис
      if (Array.isArray(notes) && notes.every(note => typeof note === 'string')) {
        audioService.instruments.synth.triggerAttackRelease(notes, "2n");
      }
    },
    
    // Методы для метронома
    toggleMetronome: (enabled) => store.setMetronomeEnabled(enabled),
    startMetronome: () => {
      if (store.getMetronomeEnabled()) {
        audioService.startMetronome();
      }
    },
    stopMetronome: () => audioService.stopMetronome(),
    
    // Инициализация инструментов
    createInstruments: () => {
      const instruments = audioService.instruments;
      window.Instrument.instruments = instruments;
      return instruments;
    },
    
    // Получение темпа
    getTempo: () => store.getTempo(),
    
    // Остановка всех звуков
    stopAllSounds: () => audioService.stopAllSounds(),
    
    // Получение текущего инструмента
    getCurrentInstrument: () => audioService.instruments.synth
  };
}

/**
 * Создание моста для ChordSuggestions
 */
function createChordSuggestionsBridge() {
  return {
    // Инициализация
    initChordSuggestions: () => {
      // Инициализация уже произведена в новой архитектуре
      console.log('ChordSuggestions инициализирован через мост');
    },
    
    // Обновление подсказок
    updateChordSuggestions: () => {
      // Используем метод из нового компонента
      chordSuggestions.updateSuggestions();
      
      // Подсвечиваем кнопки аккордов
      chordSuggestions.highlightTargets(['.chord-button']);
    },
    
    // Получение предлагаемых аккордов
    getSuggestedChords: (lastChordName, tonality) => {
      return chordSuggestions.getSuggestedChords(lastChordName, tonality);
    },
    
    // Получение текущих предложений
    getCurrentSuggestions: () => chordSuggestions.getCurrentSuggestions()
  };
}

/**
 * Создание моста для Arpeggiator
 */
function createArpeggiatorBridge() {
  return {
    // Инициализация
    initializeArpeggiator: () => {
      // Инициализация уже произведена в новой архитектуре
      console.log('Arpeggiator инициализирован через мост');
    },
    
    // Воспроизведение арпеджио
    playArpeggio: (chordName) => {
      // Включаем арпеджиатор
      store.setArpeggiatorEnabled(true);
      
      // Проигрываем аккорд (с включенным арпеджиатором)
      audioService.playChord(chordName);
    },
    
    // Остановка арпеджио
    stopArpeggio: () => audioService.stopArpeggio(),
    
    // Сохранение/загрузка настроек
    saveArpeggiatorSettings: (settings) => audioService.saveArpeggiatorSettings(settings),
    loadArpeggiatorSettings: () => audioService.getArpeggiatorSettings(),
    
    // Включение/выключение
    setEnabled: (enabled) => store.setArpeggiatorEnabled(enabled),
    
    // Получение настроек
    getSettings: () => audioService.getArpeggiatorSettings()
  };
}

/**
 * Создание моста для TrackStructure
 */
function createTrackStructureBridge() {
  return {
    // Инициализация
    initializeTrackStructure: () => {
      // Инициализация уже произведена в новой архитектуре
      console.log('TrackStructure инициализирован через мост');
    },
    
    // Методы для работы с блоками
    addNewBlock: (tonality) => trackStructureService.addNewBlock(tonality),
    loadBlockChords: (index) => trackStructureService.loadBlockSequence(index),
    clearCurrentBlock: () => trackStructureService.clearCurrentBlock(),
    changeBlockTonality: (index, tonality, fromUI = false) => {
      return trackStructureService.changeBlockTonality(index, tonality, fromUI);
    },
    
    // Воспроизведение
    playFullTrack: () => {
      const allChords = trackStructureService.trackStructure.getAllChords();
      if (allChords.length > 0) {
        window.Sequencer.playCustomSequence(allChords, true);
      }
    },
    
    // Геттеры
    getCurrentBlockIndex: () => trackStructureService.getCurrentBlockIndex(),
    getTrackStructure: () => trackStructureService.getTrackStructure()
  };
}

/**
 * Проверка наличия глобальных данных и создание заглушек при необходимости
 */
export function ensureGlobalData() {
  // Проверяем наличие CHORD_DATA
  if (!window.CHORD_DATA) {
    window.CHORD_DATA = {};
    
    // Заполняем из chordCollection
    chordCollection.getAllChords().forEach(chord => {
      window.CHORD_DATA[chord.name] = {
        notes: chord.notes,
        fullName: chord.fullName,
        description: chord.description,
        functions: chord.functions
      };
    });
  }
  
  // Проверяем наличие TONALITY_DATA
  if (!window.TONALITY_DATA) {
    window.TONALITY_DATA = {};
    
    // Заполняем из tonalityCollection
    tonalityCollection.getAllTonalities().forEach(tonality => {
      window.TONALITY_DATA[tonality.code] = {
        name: tonality.name,
        type: tonality.type,
        signature: tonality.signature,
        chords: tonality.chords
      };
    });
  }
}