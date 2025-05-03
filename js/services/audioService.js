// js/services/audioService.js
import store from '../core/store.js';
import eventBus from '../core/eventBus.js';

class AudioService {
    constructor() {
        // Основные инструменты
        this.instruments = {
            synth: null,
            metronomeSynth: null,
            weakBeatSynth: null
        };
        
        // Состояние секвенсора
        this.sequencer = {
            isPlaying: false,
            currentIndex: -1,
            intervalId: null,
            customSequence: null,
            loopCustomSequence: false
        };
        
        // Состояние метронома
        this.metronome = {
            isPlaying: false,
            intervalId: null,
            count: 0
        };
        
        // Состояние арпеджиатора
        this.arpeggiator = {
            sequence: null,
            isPlaying: false,
            settings: this.loadArpeggiatorSettings()
        };
        
        // Флаг инициализации
        this.initialized = false;
        
        // Подписка на изменения в store
        store.subscribe(this.handleStoreChanges.bind(this), 
            ['isPlaying', 'arpeggiatorEnabled', 'metronomeEnabled', 'tempo']);
    }
    
    /**
     * Инициализация аудио движка и инструментов
     */
    async initialize() {
        // Проверка на повторную инициализацию
        if (this.initialized) {
            return Promise.resolve(true);
        }
        
        console.log('Инициализация аудио сервиса...');
        
        // Проверка наличия Tone.js
        if (typeof Tone === 'undefined') {
            console.error('Tone.js не загружен');
            return Promise.reject(new Error('Tone.js не загружен'));
        }
        
        try {
            // Создание инструментов
            this.createInstruments();
            
            // Устанавливаем флаг инициализации
            this.initialized = true;
            console.log('Аудио сервис инициализирован');
            
            // Публикуем событие
            eventBus.publish('audioInitialized', {
                timestamp: Date.now()
            });
            
            return Promise.resolve(true);
        } catch (error) {
            console.error('Ошибка инициализации аудио сервиса:', error);
            return Promise.reject(error);
        }
    }
    
    /**
     * Создание аудио инструментов
     */
    createInstruments() {
        try {
            // Создаем основной полифонический синтезатор для аккордов
            this.instruments.synth = new Tone.PolySynth(Tone.Synth, {
              oscillator: {
                  type: "triangle"
              },
              envelope: {
                  attack: 0.02,
                  decay: 0.1,
                  sustain: 0.3,
                  release: 1
              }
          }).toDestination();
          
          // Создаем синтезатор для сильной доли метронома
          this.instruments.metronomeSynth = new Tone.MembraneSynth({
              pitchDecay: 0.05,
              octaves: 4,
              oscillator: { type: "sine" },
              envelope: {
                  attack: 0.001,
                  decay: 0.2,
                  sustain: 0.01,
                  release: 0.5,
              }
          }).toDestination();
          this.instruments.metronomeSynth.volume.value = -10; // Уменьшаем громкость
          
          // Создаем синтезатор для слабой доли метронома
          this.instruments.weakBeatSynth = new Tone.MetalSynth({
              frequency: 200,
              envelope: {
                  attack: 0.001,
                  decay: 0.1,
                  release: 0.1
              },
              harmonicity: 5.1,
              modulationIndex: 32,
              resonance: 4000,
              octaves: 1.5
          }).toDestination();
          this.instruments.weakBeatSynth.volume.value = -20; // Еще сильнее уменьшаем громкость
          
          console.log('Аудио инструменты созданы');
      } catch (error) {
          console.error('Ошибка создания инструментов:', error);
          throw error;
      }
  }
  
  /**
   * Запуск аудио контекста (должен вызываться после взаимодействия с пользователем)
   */
  async startAudioContext() {
      try {
          await Tone.start();
          console.log('Аудио контекст запущен');
          
          // Публикуем событие
          eventBus.publish('audioContextStarted', {
              timestamp: Date.now()
          });
          
          return true;
      } catch (error) {
          console.error('Не удалось запустить аудио контекст:', error);
          return false;
      }
  }
  
  /**
   * Воспроизведение аккорда
   * @param {string} chordName - Название аккорда
   */
  playChord(chordName) {
      // Пытаемся инициализировать, если еще не инициализировано
      if (!this.initialized) {
          console.warn('AudioService не инициализирован, пытаемся инициализировать...');
          this.initialize()
              .then(() => this.startAudioContext())
              .then(() => this.playChordImplementation(chordName))
              .catch(error => console.error('Не удалось инициализировать аудио для воспроизведения:', error));
          return;
      }
      
      // Если инициализировано, но аудио контекст не запущен, пытаемся запустить его
      if (Tone.context.state !== 'running') {
          this.startAudioContext()
              .then(() => this.playChordImplementation(chordName))
              .catch(error => console.error('Не удалось запустить аудио контекст для воспроизведения:', error));
          return;
      }
      
      // Если все готово, воспроизводим аккорд
      this.playChordImplementation(chordName);
  }
  
  /**
   * Внутренняя реализация воспроизведения аккорда
   * @param {string} chordName - Название аккорда
   */
  playChordImplementation(chordName) {
      // Пропускаем, если название аккорда пустое или не строка
      if (!chordName || typeof chordName !== 'string') {
          console.warn('Некорректное название аккорда:', chordName);
          return;
      }
      
      // Останавливаем все звуки
      this.stopAllSounds();
      
      // Проверяем, включен ли арпеджиатор
      const arpeggiatorEnabled = store.getArpeggiatorEnabled();
      
      if (arpeggiatorEnabled) {
          this.playArpeggio(chordName);
      } else {
          this.playChordNormal(chordName);
      }
  }
  
  /**
   * Воспроизведение аккорда нормально (все ноты одновременно)
   * @param {string} chordName - Название аккорда
   */
  playChordNormal(chordName) {
      // Получаем данные аккорда
      const chord = this.getChordData(chordName);
      
      if (!chord) {
          console.error(`Данные об аккорде не найдены для: ${chordName}`);
          return;
      }
      
      // Проверяем наличие нот
      const notes = chord.notes;
      if (!notes || notes.length === 0) {
          console.error(`Нет нот для аккорда: ${chordName}`);
          return;
      }
      
      // Воспроизводим аккорд
      this.instruments.synth.triggerAttackRelease(notes, "2n");
  }
  
  /**
   * Воспроизведение аккорда как арпеджио
   * @param {string} chordName - Название аккорда
   */
  playArpeggio(chordName) {
      // Получаем данные аккорда
      const chord = this.getChordData(chordName);
      
      if (!chord) {
          console.error(`Данные об аккорде не найдены для: ${chordName}`);
          return;
      }
      
      // Проверяем наличие нот
      const notes = chord.notes;
      if (!notes || notes.length === 0) {
          console.error(`Нет нот для аккорда: ${chordName}`);
          return;
      }
      
      // Получаем настройки арпеджиатора
      const settings = this.arpeggiator.settings;
      
      // Генерируем ноты арпеджио на основе настроек
      const arpNotes = this.generateArpeggioNotes(
          notes, 
          settings.pattern || 'up', 
          settings.octaveRange || 1,
          settings.octaveOffset || 0
      );
      
      // Останавливаем существующее арпеджио
      this.stopArpeggio();
      
      // Устанавливаем флаг воспроизведения
      this.arpeggiator.isPlaying = true;
      
      // Получаем темп из store
      const tempo = store.getTempo();
      Tone.Transport.bpm.value = tempo;
      
      // Создаем последовательность арпеджио
      this.arpeggiator.sequence = new Tone.Sequence(
          (time, note) => {
              // Определяем громкость ноты
              let velocity = settings.velocity || 0.7;
              
              // Акцентируем первую ноту, если включено
              if (settings.accentFirst && note === arpNotes[0]) {
                  velocity = Math.min(1, velocity * 1.3);
              }
              
              // Воспроизводим ноту
              this.instruments.synth.triggerAttackRelease(
                  note, 
                  settings.noteLength || '8n', 
                  time, 
                  velocity
              );
          },
          arpNotes,
          settings.noteLength || '8n'
      ).start(0);
      
      // Запускаем транспорт Tone.js, если он еще не запущен
      if (Tone.Transport.state !== 'started') {
          Tone.Transport.start();
      }
  }
  
  /**
   * Генерация нот для арпеджио
   * @param {Array} baseNotes - Базовые ноты аккорда
   * @param {string} pattern - Паттерн арпеджио ('up', 'down', 'updown', 'random')
   * @param {number} octaveRange - Количество октав
   * @param {number} octaveOffset - Смещение октавы (-2 до +1)
   * @returns {Array} Массив нот для арпеджио
   */
  generateArpeggioNotes(baseNotes, pattern, octaveRange, octaveOffset) {
      try {
          // Значения по умолчанию
          pattern = pattern || 'up';
          octaveRange = octaveRange || 1;
          octaveOffset = octaveOffset || 0;
          
          // Обрабатываем базовые ноты
          const notes = baseNotes.map(note => {
              // Извлекаем название ноты и октаву
              const match = note.match(/([A-G][#b]?)(\d+)/);
              if (!match) return { noteName: note, octave: 4 };
              
              const noteName = match[1];
              const octave = parseInt(match[2]) + octaveOffset;
              
              return { 
                  noteName, 
                  octave: Math.max(0, Math.min(8, octave)) 
              };
          });
          
          // Стандартный порядок нот для сортировки
          const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
          
          // Сортируем ноты по высоте
          notes.sort((a, b) => {
              const aIndex = noteOrder.indexOf(a.noteName);
              const bIndex = noteOrder.indexOf(b.noteName);
              if (aIndex === bIndex) {
                  return a.octave - b.octave;
              }
              return aIndex - bIndex;
          });
          
          // Генерируем массив результата в зависимости от паттерна
          const result = [];
          
          // Простая реализация для паттерна 'up'
          for (let octave = 0; octave < octaveRange; octave++) {
              notes.forEach(note => {
                  result.push(`${note.noteName}${note.octave + octave}`);
              });
          }
          
          return result;
      } catch (error) {
          console.error('Ошибка генерации нот арпеджио:', error);
          // Возвращаем простой паттерн в случае ошибки
          return baseNotes;
      }
  }
  
  /**
   * Остановка воспроизведения арпеджио
   */
  stopArpeggio() {
      if (this.arpeggiator.sequence) {
          this.arpeggiator.sequence.stop();
          this.arpeggiator.sequence.dispose();
          this.arpeggiator.sequence = null;
      }
      
      this.arpeggiator.isPlaying = false;
  }
  
  /**
   * Остановка всех звуков
   * @param {boolean} stopSequencer - Остановить ли секвенсор (по умолчанию: true)
   */
  stopAllSounds(stopSequencer = true) {
      // Освобождаем все ноты в синтезаторе
      if (this.instruments.synth) {
          this.instruments.synth.releaseAll();
      }
      
      // Останавливаем арпеджиатор
      this.stopArpeggio();
      
      // Останавливаем секвенсор, если запрошено
      if (stopSequencer) {
          // Только очищаем интервал, не обновляем store
          if (this.sequencer.intervalId) {
              clearInterval(this.sequencer.intervalId);
              this.sequencer.intervalId = null;
          }
      }
      
      // Отменяем запланированные события в Tone.js
      if (Tone.Transport) {
          Tone.Transport.cancel();
      }
  }
  
  /**
   * Воспроизведение последовательности
   * @param {Array} sequence - Массив аккордов для воспроизведения
   * @param {boolean} loop - Зацикливать ли воспроизведение
   */
  playSequence(sequence, loop = true) {
      // Проверяем, есть ли аккорды для воспроизведения
      if (!sequence || sequence.length === 0) {
          console.warn('Нет аккордов для воспроизведения');
          return;
      }
      
      // Останавливаем текущее воспроизведение
      this.stopAllSounds();
      
      // Устанавливаем состояние секвенсора
      this.sequencer.isPlaying = true;
      this.sequencer.currentIndex = 0;
      this.sequencer.customSequence = [...sequence];
      this.sequencer.loopCustomSequence = loop;
      
      // Запускаем метроном, если он включен
      if (store.getMetronomeEnabled()) {
          this.startMetronome();
      }
      
      // Воспроизводим первый аккорд
      this.playCurrentSequenceChord();
      
      // Вычисляем интервал на основе темпа
      const tempo = store.getTempo();
      const interval = (60 / tempo) * 1000; // в миллисекундах
      
      // Настраиваем интервал для проигрывания остальных аккордов
      this.sequencer.intervalId = setInterval(() => {
          // Переходим к следующему аккорду
          this.sequencer.currentIndex++;
          
          // Если достигли конца последовательности
          if (this.sequencer.currentIndex >= this.sequencer.customSequence.length) {
              // Если зацикливание включено, начинаем сначала
              if (loop) {
                  this.sequencer.currentIndex = 0;
              } else {
                  // Иначе останавливаем воспроизведение
                  this.stopSequence();
                  return;
              }
          }
          
          // Воспроизводим текущий аккорд
          this.playCurrentSequenceChord();
      }, interval);
      
      // Публикуем событие
      eventBus.publish('sequencePlayingStarted', {
          sequenceLength: sequence.length,
          isLooped: loop
      });
  }
  
  /**
   * Остановка воспроизведения последовательности
   */
  stopSequence() {
      // Останавливаем интервал
      if (this.sequencer.intervalId) {
          clearInterval(this.sequencer.intervalId);
          this.sequencer.intervalId = null;
      }
      
      // Останавливаем все звуки
      this.stopAllSounds(false);
      
      // Останавливаем метроном
      this.stopMetronome();
      
      // Сбрасываем состояние секвенсора
      this.sequencer.isPlaying = false;
      this.sequencer.currentIndex = -1;
      
      // Обновляем состояние в store
      store.setIsPlaying(false);
      
      // Публикуем событие
      eventBus.publish('sequencePlayingStopped', {
          timestamp: Date.now()
      });
  }
  
  /**
   * Воспроизведение текущего аккорда в последовательности
   */
  playCurrentSequenceChord() {
      // Получаем текущий аккорд
      const index = this.sequencer.currentIndex;
      const sequence = this.sequencer.customSequence;
      
      // Проверяем корректность индекса
      if (index < 0 || index >= sequence.length) {
          console.error('Некорректный индекс аккорда:', index);
          return;
      }
      
      // Получаем название текущего аккорда
      const chordName = sequence[index];
      
      // Проверяем, не является ли аккорд специальным маркером
      if (chordName === 'BLOCK_DIVIDER') {
          console.log('Разделитель блоков');
          return;
      }
      
      // Останавливаем все звуки перед воспроизведением нового аккорда
      this.stopAllSounds(false);
      
      // Если это пауза, просто пропускаем воспроизведение
      if (chordName === 'PAUSE') {
          console.log('Пауза');
      } else {
          // Устанавливаем текущий аккорд в store
          store.setCurrentChord(chordName);
          
          // Воспроизводим аккорд
          this.playChordImplementation(chordName);
      }
      
      // Публикуем событие
      eventBus.publish('chordPlaying', {
          chordName: chordName,
          index: index
      });
  }
  
  /**
   * Запуск метронома
   */
  startMetronome() {
      // Уже запущен - ничего не делаем
      if (this.metronome.isPlaying) return;
      
      // Проверяем, включен ли метроном
      if (!store.getMetronomeEnabled()) return;
      
      // Получаем темп
      const tempo = store.getTempo();
      const interval = (60 / tempo) * 1000; // в миллисекундах
      
      // Запускаем метроном
      this.metronome.count = 0;
      this.metronome.isPlaying = true;
      
      // Создаем интервал
      this.metronome.intervalId = setInterval(() => {
          // Проверяем, все еще включен ли метроном
          if (!store.getMetronomeEnabled()) {
              this.stopMetronome();
              return;
          }
          
          // Воспроизводим звук метронома
          const beat = this.metronome.count % 4;
          
          if (beat === 0) {
              // Сильная доля
              Tone.context.resume().then(() => {
                  this.instruments.metronomeSynth.triggerAttackRelease("C2", "32n");
              });
          } else {
              // Слабая доля
              Tone.context.resume().then(() => {
                  this.instruments.weakBeatSynth.triggerAttackRelease("C3", "32n");
              });
          }
          
          // Увеличиваем счетчик
          this.metronome.count++;
      }, interval);
  }
  
  /**
   * Остановка метронома
   */
  stopMetronome() {
      if (!this.metronome.isPlaying) return;
      
      // Останавливаем интервал
      if (this.metronome.intervalId) {
          clearInterval(this.metronome.intervalId);
          this.metronome.intervalId = null;
      }
      
      this.metronome.isPlaying = false;
  }
  
  /**
   * Получение данных аккорда из локальной модели или глобальных данных
   * @param {string} chordName - Название аккорда
   * @returns {Object|null} Данные аккорда или null, если не найдено
   */
  getChordData(chordName) {
      // Сначала пытаемся получить из глобальных данных (для обратной совместимости)
      if (window.CHORD_DATA && window.CHORD_DATA[chordName]) {
          return window.CHORD_DATA[chordName];
      }
      
      // Если у нас есть коллекция аккордов, пробуем её
      if (window.chordCollection && 
          typeof window.chordCollection.getChord === 'function') {
          const chord = window.chordCollection.getChord(chordName);
          if (chord) return chord;
      }
      
      // Пытаемся импортировать коллекцию аккордов
      try {
          const { chordCollection } = require('../models/chord.js');
          if (chordCollection) {
              const chord = chordCollection.getChord(chordName);
              if (chord) return chord;
          }
      } catch (error) {
          // Игнорируем ошибки импорта
      }
      
      return null;
  }
  
  /**
   * Загрузка настроек арпеджиатора из localStorage
   * @returns {Object} Настройки арпеджиатора
   */
  loadArpeggiatorSettings() {
      // Настройки по умолчанию
      const defaultSettings = {
          enabled: false,
          pattern: 'up',
          octaveRange: 1,
          octaveOffset: 0,
          noteLength: '8n',
          velocity: 0.7,
          accentFirst: true
      };
      
      try {
          const savedSettings = localStorage.getItem('arpeggiatorSettings');
          if (savedSettings) {
              return { ...defaultSettings, ...JSON.parse(savedSettings) };
          }
      } catch (error) {
          console.warn('Ошибка загрузки настроек арпеджиатора:', error);
      }
      
      return defaultSettings;
  }
  
  /**
   * Сохранение настроек арпеджиатора в localStorage
   * @param {Object} settings - Настройки для сохранения
   */
  saveArpeggiatorSettings(settings) {
      // Обновляем локальные настройки
      this.arpeggiator.settings = {
          ...this.arpeggiator.settings,
          ...settings
      };
      
      try {
          localStorage.setItem('arpeggiatorSettings', JSON.stringify(this.arpeggiator.settings));
          console.log('Настройки арпеджиатора сохранены');
          
          // Публикуем событие
          eventBus.publish('arpeggiatorSettingsChanged', this.arpeggiator.settings);
      } catch (error) {
          console.error('Ошибка сохранения настроек арпеджиатора:', error);
      }
  }
  
  /**
   * Получение текущих настроек арпеджиатора
   * @returns {Object} Текущие настройки
   */
  getArpeggiatorSettings() {
      return { ...this.arpeggiator.settings };
  }
  
  /**
   * Обработка изменений из store
   * @param {Object} state - Состояние store
   * @param {string} changedProp - Имя измененного свойства
   */
  handleStoreChanges(state, changedProp) {
      switch (changedProp) {
          case 'isPlaying':
              // Запускаем или останавливаем воспроизведение
              if (state.isPlaying) {
                  if (!this.sequencer.isPlaying) {
                      this.playSequence(state.sequence);
                  }
              } else {
                  if (this.sequencer.isPlaying) {
                      this.stopSequence();
                  }
              }
              break;
              
          case 'arpeggiatorEnabled':
              // Обновляем настройки арпеджиатора
              this.saveArpeggiatorSettings({
                  enabled: state.arpeggiatorEnabled
              });
              break;
              
          case 'metronomeEnabled':
              // Запускаем или останавливаем метроном
              if (state.metronomeEnabled) {
                  if (this.sequencer.isPlaying) {
                      this.startMetronome();
                  }
              } else {
                  this.stopMetronome();
              }
              break;
              
          case 'tempo':
              // Обновляем темп
              if (this.sequencer.isPlaying) {
                  // Останавливаем текущие интервалы
                  clearInterval(this.sequencer.intervalId);
                  if (this.metronome.intervalId) {
                      clearInterval(this.metronome.intervalId);
                  }
                  
                  // Вычисляем новый интервал
                  const tempo = state.tempo;
                  const interval = (60 / tempo) * 1000; // в миллисекундах
                  
                  // Устанавливаем новый интервал для секвенсора
                  this.sequencer.intervalId = setInterval(() => {
                      // Переходим к следующему аккорду
                      this.sequencer.currentIndex++;
                      
                      // Если достигли конца последовательности
                      if (this.sequencer.currentIndex >= this.sequencer.customSequence.length) {
                          // Если зацикливание включено, начинаем сначала
                          if (this.sequencer.loopCustomSequence) {
                              this.sequencer.currentIndex = 0;
                          } else {
                              // Иначе останавливаем воспроизведение
                              this.stopSequence();
                              return;
                          }
                      }
                      
                      // Воспроизводим текущий аккорд
                      this.playCurrentSequenceChord();
                  }, interval);
                  
                  // Обновляем метроном, если он воспроизводится
                  if (this.metronome.isPlaying) {
                      this.stopMetronome();
                      this.startMetronome();
                  }
              }
              break;
      }
  }
}

// Создаем синглтон сервис
const audioService = new AudioService();

export default audioService;