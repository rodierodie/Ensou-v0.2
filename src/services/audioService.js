/**
 * Сервис для управления аудио и воспроизведения аккордов
 * с использованием библиотеки Tone.js
 */
export class AudioService {
    constructor() {
        this.initialized = false;
        this.isPlaying = false;
        this.tempo = 120; // BPM по умолчанию
        this.synth = null;
        this.currentSequence = null;
        this.currentNoteIndex = 0;
        this.arpeggiatorEnabled = false;
        this.metronomeEnabled = false;
        this.metronome = null;
        
        // Интервал арпеджиатора в миллисекундах
        this.arpeggiatorInterval = 100;
        
        // Привязка методов к контексту
        this.initialize = this.initialize.bind(this);
        this.playChord = this.playChord.bind(this);
        this.playArpeggio = this.playArpeggio.bind(this);
        this.playSequence = this.playSequence.bind(this);
        this.stopPlayback = this.stopPlayback.bind(this);
        this.setTempo = this.setTempo.bind(this);
        this.toggleArpeggiator = this.toggleArpeggiator.bind(this);
        this.toggleMetronome = this.toggleMetronome.bind(this);
    }

    /**
     * Инициализация аудио контекста и синтезатора
     * @returns {Promise} - Промис, который разрешается после инициализации
     */
    async initialize() {
        if (this.initialized) {
            return Promise.resolve();
        }

        try {
            // Создаем синтезатор с подходящими настройками
            this.synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: {
                    type: 'triangle'
                },
                envelope: {
                    attack: 0.02,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 1
                }
            }).toDestination();
            
            // Создаем метроном
            this.metronome = new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 4,
                oscillator: {
                    type: 'sine'
                },
                envelope: {
                    attack: 0.001,
                    decay: 0.4,
                    sustain: 0.01,
                    release: 1.4,
                    attackCurve: 'exponential'
                }
            }).toDestination();
            this.metronome.volume.value = -10; // Уменьшаем громкость метронома
            
            // Запускаем аудио контекст при взаимодействии пользователя
            await Tone.start();
            
            // Устанавливаем темп
            Tone.Transport.bpm.value = this.tempo;
            
            this.initialized = true;
            return Promise.resolve();
        } catch (error) {
            console.error('Ошибка при инициализации аудио сервиса:', error);
            return Promise.reject(error);
        }
    }

    /**
     * Конвертация ноты в частоту
     * @param {string} note - Нота в формате с октавой (например, 'C4')
     * @returns {number} - Частота ноты в герцах
     */
    noteToFrequency(note) {
        return Tone.Frequency(note).toFrequency();
    }

    /**
     * Преобразование нот аккорда в формат Tone.js с октавами
     * @param {Array<string>} notes - Ноты аккорда (без октав)
     * @param {number} [octave=4] - Базовая октава
     * @returns {Array<string>} - Ноты с октавами
     */
    formatChordNotes(notes, octave = 4) {
        // Базовые ноты для сравнения
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Находим индекс первой ноты
        const rootIndex = chromaticScale.indexOf(notes[0]);
        if (rootIndex === -1) return notes.map(note => `${note}${octave}`);
        
        // Преобразуем ноты с октавами, учитывая их расположение
        return notes.map((note, index) => {
            const noteIndex = chromaticScale.indexOf(note);
            
            // Если нота не найдена, возвращаем её с базовой октавой
            if (noteIndex === -1) return `${note}${octave}`;
            
            // Вычисляем относительную позицию ноты
            let currentOctave = octave;
            
            // Если текущая нота "ниже" первой ноты в хроматической гамме,
            // значит она находится в следующей октаве
            if (index > 0 && noteIndex < rootIndex) {
                currentOctave += 1;
            }
            
            return `${note}${currentOctave}`;
        });
    }

    /**
     * Воспроизведение аккорда
     * @param {Array<string>} notes - Ноты аккорда (без октав)
     * @param {number} [duration=1] - Длительность в секундах
     * @param {number} [octave=4] - Базовая октава
     * @returns {Promise} - Промис, который разрешается после окончания воспроизведения
     */
    async playChord(notes, duration = 1, octave = 4) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        return new Promise(resolve => {
            // Если включен арпеджиатор, играем арпеджио
            if (this.arpeggiatorEnabled) {
                this.playArpeggio(notes, duration, octave).then(resolve);
                return;
            }
            
            // Иначе играем аккорд целиком
            const formattedNotes = this.formatChordNotes(notes, octave);
            
            // Используем Tone.js для воспроизведения аккорда
            this.synth.triggerAttackRelease(formattedNotes, duration);
            
            // Разрешаем промис после окончания воспроизведения
            setTimeout(resolve, duration * 1000);
        });
    }

    /**
     * Воспроизведение арпеджио (нот аккорда последовательно)
     * @param {Array<string>} notes - Ноты аккорда (без октав)
     * @param {number} [totalDuration=1] - Общая длительность в секундах
     * @param {number} [octave=4] - Базовая октава
     * @returns {Promise} - Промис, который разрешается после окончания воспроизведения
     */
    async playArpeggio(notes, totalDuration = 1, octave = 4) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        return new Promise(resolve => {
            const formattedNotes = this.formatChordNotes(notes, octave);
            const noteDuration = totalDuration / formattedNotes.length;
            
            // Играем каждую ноту последовательно
            formattedNotes.forEach((note, index) => {
                setTimeout(() => {
                    this.synth.triggerAttackRelease(note, noteDuration);
                    
                    // Разрешаем промис после последней ноты
                    if (index === formattedNotes.length - 1) {
                        setTimeout(resolve, noteDuration * 1000);
                    }
                }, index * noteDuration * 1000);
            });
        });
    }

    /**
     * Воспроизведение последовательности аккордов
     * @param {Array<Object>} sequence - Массив объектов с нотами и длительностью
     * @param {number} [startIndex=0] - Индекс начального элемента
     * @returns {Promise} - Промис, который разрешается после окончания воспроизведения
     */
    async playSequence(sequence, startIndex = 0) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        // Останавливаем текущее воспроизведение
        this.stopPlayback();
        
        this.isPlaying = true;
        this.currentSequence = sequence;
        this.currentNoteIndex = startIndex;
        
        // Запускаем метроном, если он включен
        if (this.metronomeEnabled) {
            this.startMetronome();
        }
        
        return this.playNextChord();
    }

    /**
     * Воспроизведение следующего аккорда в последовательности
     * @returns {Promise} - Промис, который разрешается после окончания воспроизведения всей последовательности
     */
    async playNextChord() {
        if (!this.isPlaying || !this.currentSequence || this.currentNoteIndex >= this.currentSequence.length) {
            this.stopPlayback();
            return Promise.resolve();
        }
        
        const item = this.currentSequence[this.currentNoteIndex];
        this.currentNoteIndex++;
        
        // Вычисляем длительность в секундах на основе темпа
        const beatDuration = 60 / this.tempo; // длительность четвертной ноты в секундах
        const durationInSeconds = item.duration * 4 * beatDuration; // умножаем на 4 для целой ноты
        
        // Если это пауза, просто ждем
        if (item.isPause || !item.chord) {
            return new Promise(resolve => {
                setTimeout(() => {
                    if (this.isPlaying) {
                        this.playNextChord().then(resolve);
                    } else {
                        resolve();
                    }
                }, durationInSeconds * 1000);
            });
        }
        
        // Иначе воспроизводим аккорд
        return this.playChord(item.chord.getNotes(), durationInSeconds).then(() => {
            if (this.isPlaying) {
                return this.playNextChord();
            }
            return Promise.resolve();
        });
    }

    /**
     * Остановка воспроизведения
     */
    stopPlayback() {
        this.isPlaying = false;
        this.currentSequence = null;
        this.currentNoteIndex = 0;
        
        // Останавливаем синтезатор
        if (this.synth) {
            this.synth.releaseAll();
        }
        
        // Останавливаем метроном
        this.stopMetronome();
    }

    /**
     * Установка темпа
     * @param {number} bpm - Темп в ударах в минуту
     */
    setTempo(bpm) {
        this.tempo = bpm;
        if (this.initialized) {
            Tone.Transport.bpm.value = bpm;
        }
    }

    /**
     * Включение/выключение арпеджиатора
     * @param {boolean} enabled - Статус арпеджиатора
     */
    toggleArpeggiator(enabled) {
        this.arpeggiatorEnabled = enabled;
    }

    /**
     * Включение/выключение метронома
     * @param {boolean} enabled - Статус метронома
     */
    toggleMetronome(enabled) {
        this.metronomeEnabled = enabled;
        
        if (enabled && this.isPlaying) {
            this.startMetronome();
        } else {
            this.stopMetronome();
        }
    }

    /**
     * Запуск метронома
     */
    startMetronome() {
        if (!this.initialized || !this.metronomeEnabled) {
            return;
        }
        
        // Запускаем метроном используя Tone.js Transport
        Tone.Transport.scheduleRepeat(time => {
            // Играем более высокий звук на первой доле такта
            if (Tone.Transport.position.split(':')[1] === '0') {
                this.metronome.triggerAttackRelease('C3', '16n', time);
            } else {
                this.metronome.triggerAttackRelease('C2', '16n', time);
            }
        }, '4n'); // Четвертная нота
        
        Tone.Transport.start();
    }

    /**
     * Остановка метронома
     */
    stopMetronome() {
        Tone.Transport.stop();
        Tone.Transport.cancel(); // Отменяем все запланированные события
    }
}

// Создаем экземпляр сервиса
const audioService = new AudioService();

// Экспортируем по умолчанию
export default audioService;