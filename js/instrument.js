/**
 * instrument.js
 * Настройка синтезатора и воспроизведение звука
 */

// Глобальные переменные для доступа к инструменту из других модулей
let currentInstrument = null;
let metronomeEnabled = false;
let metronomeWorking = false;
let metronomeInterval = null;
let metronomeCount = 0;

// Создание инструмента
function createInstruments() {
    // Проверка, что Tone.js загружен
    if (!window.Tone) {
        console.error('Tone.js не загружен');
        return null;
    }
    
    // Создаем синтезатор для аккордов
    const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
    }).toDestination();
    
    // Создаем синтезатор для метронома
    const metronomeSynth = new Tone.MembraneSynth({
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
    metronomeSynth.volume.value = -10; // Уменьшаем громкость
    
    // Создаем синтезатор для слабых долей метронома
    const weakBeatSynth = new Tone.MetalSynth({
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
    weakBeatSynth.volume.value = -20; // Ещё сильнее уменьшаем громкость
    
    // Устанавливаем как текущий инструмент
    currentInstrument = synth;
    
    // Для обратной совместимости возвращаем объект с инструментами
    return { 
        synth: synth,
        metronomeSynth: metronomeSynth,
        weakBeatSynth: weakBeatSynth
    };
}

/**
 * Включение/выключение метронома
 * @param {boolean} enabled - Флаг включения метронома
 */
function toggleMetronome(enabled) {
    metronomeEnabled = enabled;
    console.log('Метроном', enabled ? 'включен' : 'выключен');
    
    // Если проигрывается последовательность, сразу обновляем состояние метронома
    if (window.Sequencer && window.Sequencer.isPlaying) {
        if (enabled) {
            startMetronome();
        } else {
            stopMetronome();
        }
    }
}

/**
 * Запуск метронома
 */
function startMetronome() {
    // Уже запущен - ничего не делаем
    if (metronomeWorking) return;
    
    // Проверяем, включен ли метроном
    if (!metronomeEnabled) return;
    
    // Получаем темп
    const tempo = window.Sequencer ? window.Sequencer.getTempo() : 120;
    const interval = (60 / tempo) * 1000; // в миллисекундах
    
    // Запускаем метроном
    metronomeCount = 0;
    metronomeWorking = true;
    
    // Создаем интервал
    metronomeInterval = setInterval(() => {
        // Проверяем, всё ещё включен ли метроном
        if (!metronomeEnabled) {
            stopMetronome();
            return;
        }
        
        // Проигрываем звук метронома
        const beat = metronomeCount % 4;
        
        if (beat === 0) {
            // Сильная доля
            Tone.context.resume().then(() => {
                if (window.Instrument && window.Instrument.instruments && window.Instrument.instruments.metronomeSynth) {
                    window.Instrument.instruments.metronomeSynth.triggerAttackRelease("C2", "32n");
                }
            });
        } else {
            // Слабая доля
            Tone.context.resume().then(() => {
                if (window.Instrument && window.Instrument.instruments && window.Instrument.instruments.weakBeatSynth) {
                    window.Instrument.instruments.weakBeatSynth.triggerAttackRelease("C3", "32n");
                }
            });
        }
        
        // Увеличиваем счетчик
        metronomeCount++;
    }, interval);
}

/**
 * Остановка метронома
 */
function stopMetronome() {
    if (!metronomeWorking) return;
    
    // Останавливаем интервал
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
        metronomeInterval = null;
    }
    
    metronomeWorking = false;
}

/**
 * Функция для проигрывания аккорда
 * @param {string} chordName - Название аккорда
 */
function playChord(chordName) {
    console.log('Проигрывание аккорда:', chordName);
    
    // Проверка, что инструмент инициализирован
    if (!currentInstrument) {
        console.error('Инструмент не инициализирован');
        return;
    }
    
    // Получаем данные аккорда
    const chord = window.CHORD_DATA[chordName];
    if (!chord) {
        console.error('Аккорд не найден в базе данных:', chordName);
        return;
    }
    
    // Используем ноты аккорда как есть
    const notes = chord.notes;
    console.log('Ноты аккорда:', notes);
    
    // Запускаем контекст, если он еще не запущен
    if (Tone.context.state !== 'running') {
        Tone.context.resume().then(() => {
            console.log('Аудио контекст запущен');
            playChordNotes(notes);
        });
    } else {
        playChordNotes(notes);
    }
}

/**
 * Воспроизведение нот аккорда
 * @param {Array<string>} notes - Массив нот для воспроизведения
 */
function playChordNotes(notes) {
    // Проверяем корректность нот перед воспроизведением
    const validNotes = notes.filter(note => /^[A-G][#b]?[0-9]$/.test(note));
    
    if (validNotes.length !== notes.length) {
        console.warn('Некоторые ноты были отфильтрованы:', notes, '->', validNotes);
    }
    
    if (validNotes.length > 0) {
        console.log('Воспроизведение нот:', validNotes);
        currentInstrument.triggerAttackRelease(validNotes, "2n");
    } else {
        console.error('Нет корректных нот для проигрывания');
    }
}

/**
 * Получение темпа для метронома
 * @returns {number} Темп в ударах в минуту
 */
function getTempo() {
    return window.Sequencer && window.Sequencer.getTempo ? window.Sequencer.getTempo() : 120;
}

// Экспорт функций и переменных
window.Instrument = {
    createInstruments: createInstruments,
    playChord: playChord,
    playChordNotes: playChordNotes,
    toggleMetronome: toggleMetronome,
    startMetronome: startMetronome,
    stopMetronome: stopMetronome,
    getTempo: getTempo,
    getCurrentInstrument: function() { return currentInstrument; },
    instruments: null // Будет заполнено после инициализации
};

/**
 * Функция для остановки всех звуков
 */
function stopAllSounds() {
    // Останавливаем текущий инструмент, если он есть
    if (currentInstrument) {
        currentInstrument.releaseAll();
    }
    
    // Если арпеджиатор инициализирован, останавливаем арпеджио
    if (window.Arpeggiator && window.Arpeggiator.stopArpeggio) {
        window.Arpeggiator.stopArpeggio();
    }
    
    // Если Tone.js загружен, проверяем и останавливаем все активные звуки
    if (window.Tone && window.Tone.Transport) {
        window.Tone.Transport.cancel();
    }
}

// Экспорт функций и переменных
window.Instrument = {
    createInstruments: createInstruments,
    playChord: playChord,
    playChordNotes: playChordNotes,
    toggleMetronome: toggleMetronome,
    startMetronome: startMetronome,
    stopMetronome: stopMetronome,
    getTempo: getTempo,
    stopAllSounds: stopAllSounds,
    getCurrentInstrument: function() { return currentInstrument; },
    instruments: null // Будет заполнено после инициализации
};