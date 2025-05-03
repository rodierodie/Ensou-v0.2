/**
 * arpeggiator.js
 * Модуль для арпеджирования аккордов
 */

// Глобальный объект для хранения настроек арпеджиатора
const arpeggiatorSettings = {
    enabled: false,        // Включен ли арпеджиатор
    pattern: 'up',         // Паттерн арпеджио (up, down, updown, random)
    octaveRange: 1,        // Диапазон октав (1-3)
    octaveOffset: -1,      // Смещение октавы (-2, -1, 0, 1)
    noteLength: '8n',      // Длительность нот (8n = восьмые, 16n = шестнадцатые)
    velocity: 0.7,         // Громкость нот (0-1)
    accentFirst: true      // Акцентировать первую ноту в арпеджио
};

// Переменные для управления воспроизведением арпеджио
let arpSequence = null;    // Sequence из Tone.js для арпеджио
let isArpPlaying = false;  // Флаг, указывающий, воспроизводится ли арпеджио

/**
 * Инициализация арпеджиатора
 */
function initializeArpeggiator() {
    // Загружаем сохраненные настройки
    loadArpeggiatorSettings();
    
    // Создаем и добавляем элементы управления арпеджиатором
    createArpeggiatorControls();
    
    // Устанавливаем обработчики событий
    setupArpeggiatorEventListeners();
    
    console.log('Арпеджиатор инициализирован');
}

/**
 * Загрузка сохраненных настроек арпеджиатора
 */
function loadArpeggiatorSettings() {
    try {
        const savedSettings = localStorage.getItem('arpeggiatorSettings');
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            
            // Обновляем настройки из сохраненных значений
            arpeggiatorSettings.enabled = parsedSettings.enabled || false;
            arpeggiatorSettings.pattern = parsedSettings.pattern || 'up';
            arpeggiatorSettings.octaveRange = parsedSettings.octaveRange || 1;
            arpeggiatorSettings.octaveOffset = parsedSettings.octaveOffset !== undefined ? parsedSettings.octaveOffset : -1;
            arpeggiatorSettings.noteLength = parsedSettings.noteLength || '8n';
            arpeggiatorSettings.accentFirst = parsedSettings.accentFirst !== undefined ? parsedSettings.accentFirst : true;
            
            console.log('Загружены сохраненные настройки арпеджиатора:', arpeggiatorSettings);
        }
    } catch (e) {
        console.error('Ошибка при загрузке настроек арпеджиатора:', e);
    }
}

/**
 * Сохранение настроек арпеджиатора
 */
function saveArpeggiatorSettings() {
    try {
        localStorage.setItem('arpeggiatorSettings', JSON.stringify(arpeggiatorSettings));
        console.log('Настройки арпеджиатора сохранены:', arpeggiatorSettings);
    } catch (e) {
        console.error('Ошибка при сохранении настроек арпеджиатора:', e);
    }
}

/**
 * Создание элементов управления арпеджиатором
 */
function createArpeggiatorControls() {
    // Находим контейнер для элементов управления
    const controlsContainer = document.querySelector('.controls');
    if (!controlsContainer) {
        console.error('Не найден контейнер для элементов управления');
        return;
    }
    
    // Создаем контейнер для элементов управления арпеджиатором
    const arpControlsContainer = document.createElement('div');
    arpControlsContainer.className = 'arpeggiator-controls';
    
    // Создаем заголовок
    const arpTitle = document.createElement('div');
    arpTitle.textContent = 'Арпеджиатор';
    arpTitle.style.fontWeight = 'bold';
    arpTitle.style.marginRight = '15px';
    arpControlsContainer.appendChild(arpTitle);
    
    // Создаем переключатель арпеджиатора
    const arpToggleContainer = document.createElement('div');
    arpToggleContainer.className = 'checkbox-container';
    
    const arpToggle = document.createElement('input');
    arpToggle.type = 'checkbox';
    arpToggle.id = 'arpeggiator-toggle';
    arpToggle.checked = arpeggiatorSettings.enabled;
    
    const arpToggleLabel = document.createElement('span');
    arpToggleLabel.className = 'checkbox-label';
    arpToggleLabel.textContent = 'Включить';
    
    arpToggleContainer.appendChild(arpToggle);
    arpToggleContainer.appendChild(arpToggleLabel);
    arpControlsContainer.appendChild(arpToggleContainer);
    
    // Создаем селектор паттерна
    const patternSelectorContainer = document.createElement('div');
    patternSelectorContainer.style.display = 'flex';
    patternSelectorContainer.style.alignItems = 'center';
    
    const patternLabel = document.createElement('label');
    patternLabel.textContent = 'Паттерн:';
    patternLabel.style.marginRight = '5px';
    patternSelectorContainer.appendChild(patternLabel);
    
    const patternSelector = document.createElement('select');
    patternSelector.id = 'arpeggiator-pattern';
    
    const patterns = [
        { value: 'up', label: 'Вверх' },
        { value: 'down', label: 'Вниз' },
        { value: 'updown', label: 'Вверх-вниз' },
        { value: 'downup', label: 'Вниз-вверх' },
        { value: 'random', label: 'Случайно' }
    ];
    
    patterns.forEach(pattern => {
        const option = document.createElement('option');
        option.value = pattern.value;
        option.textContent = pattern.label;
        if (pattern.value === arpeggiatorSettings.pattern) {
            option.selected = true;
        }
        patternSelector.appendChild(option);
    });
    
    patternSelectorContainer.appendChild(patternSelector);
    arpControlsContainer.appendChild(patternSelectorContainer);
    
    // Создаем селектор диапазона октав
    const octaveSelectorContainer = document.createElement('div');
    octaveSelectorContainer.style.display = 'flex';
    octaveSelectorContainer.style.alignItems = 'center';
    
    const octaveLabel = document.createElement('label');
    octaveLabel.textContent = 'Октавы:';
    octaveLabel.style.marginRight = '5px';
    octaveSelectorContainer.appendChild(octaveLabel);
    
    const octaveSelector = document.createElement('select');
    octaveSelector.id = 'arpeggiator-octave';
    
    for (let i = 1; i <= 3; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === arpeggiatorSettings.octaveRange) {
            option.selected = true;
        }
        octaveSelector.appendChild(option);
    }
    
    octaveSelectorContainer.appendChild(octaveSelector);
    arpControlsContainer.appendChild(octaveSelectorContainer);
    
    // Создаем селектор смещения октавы
    const octaveOffsetContainer = document.createElement('div');
    octaveOffsetContainer.style.display = 'flex';
    octaveOffsetContainer.style.alignItems = 'center';
    
    const octaveOffsetLabel = document.createElement('label');
    octaveOffsetLabel.textContent = 'Смещение:';
    octaveOffsetLabel.style.marginRight = '5px';
    octaveOffsetContainer.appendChild(octaveOffsetLabel);
    
    const octaveOffsetSelector = document.createElement('select');
    octaveOffsetSelector.id = 'arpeggiator-octave-offset';
    
    const offsets = [
        { value: -2, label: '-2' },
        { value: -1, label: '-1' },
        { value: 0, label: '0' },
        { value: 1, label: '+1' }
    ];
    
    offsets.forEach(offset => {
        const option = document.createElement('option');
        option.value = offset.value;
        option.textContent = offset.label;
        if (offset.value === arpeggiatorSettings.octaveOffset) {
            option.selected = true;
        }
        octaveOffsetSelector.appendChild(option);
    });
    
    octaveOffsetContainer.appendChild(octaveOffsetSelector);
    arpControlsContainer.appendChild(octaveOffsetContainer);
    
    // Создаем селектор длительности нот
    const noteLengthContainer = document.createElement('div');
    noteLengthContainer.style.display = 'flex';
    noteLengthContainer.style.alignItems = 'center';
    
    const noteLengthLabel = document.createElement('label');
    noteLengthLabel.textContent = 'Длительность:';
    noteLengthLabel.style.marginRight = '5px';
    noteLengthContainer.appendChild(noteLengthLabel);
    
    const noteLengthSelector = document.createElement('select');
    noteLengthSelector.id = 'arpeggiator-note-length';
    
    const noteLengths = [
        { value: '8n', label: '1/8' },
        { value: '16n', label: '1/16' },
        { value: '32n', label: '1/32' }
    ];
    
    noteLengths.forEach(length => {
        const option = document.createElement('option');
        option.value = length.value;
        option.textContent = length.label;
        if (length.value === arpeggiatorSettings.noteLength) {
            option.selected = true;
        }
        noteLengthSelector.appendChild(option);
    });
    
    noteLengthContainer.appendChild(noteLengthSelector);
    arpControlsContainer.appendChild(noteLengthContainer);
    
    // Создаем чекбокс для акцента первой ноты
    const accentContainer = document.createElement('div');
    accentContainer.className = 'checkbox-container';
    
    const accentToggle = document.createElement('input');
    accentToggle.type = 'checkbox';
    accentToggle.id = 'arpeggiator-accent';
    accentToggle.checked = arpeggiatorSettings.accentFirst;
    
    const accentLabel = document.createElement('span');
    accentLabel.className = 'checkbox-label';
    accentLabel.textContent = 'Акцент';
    
    accentContainer.appendChild(accentToggle);
    accentContainer.appendChild(accentLabel);
    arpControlsContainer.appendChild(accentContainer);
    
    // Добавляем контейнер с элементами управления на страницу
    controlsContainer.appendChild(arpControlsContainer);
}

/**
 * Настройка обработчиков событий для элементов управления арпеджиатором
 */
function setupArpeggiatorEventListeners() {
    // Обработчик включения/выключения арпеджиатора
    const arpToggle = document.getElementById('arpeggiator-toggle');
    if (arpToggle) {
        arpToggle.addEventListener('change', function() {
            arpeggiatorSettings.enabled = this.checked;
            console.log('Арпеджиатор', this.checked ? 'включен' : 'выключен');
            
            // Если арпеджиатор выключается во время воспроизведения, останавливаем его
            if (!this.checked && isArpPlaying) {
                stopArpeggio();
            }
            
            // Сохраняем настройки
            saveArpeggiatorSettings();
        });
    }
    
    // Обработчик изменения паттерна
    const patternSelector = document.getElementById('arpeggiator-pattern');
    if (patternSelector) {
        patternSelector.addEventListener('change', function() {
            arpeggiatorSettings.pattern = this.value;
            console.log('Паттерн арпеджио изменен на:', this.value);
            
            // Если арпеджио уже проигрывается, перезапускаем его с новым паттерном
            if (isArpPlaying) {
                const currentChord = window.UI.getCurrentChord();
                playArpeggio(currentChord);
            }
            
            // Сохраняем настройки
            saveArpeggiatorSettings();
        });
    }
    
    // Обработчик изменения диапазона октав
    const octaveSelector = document.getElementById('arpeggiator-octave');
    if (octaveSelector) {
        octaveSelector.addEventListener('change', function() {
            arpeggiatorSettings.octaveRange = parseInt(this.value);
            console.log('Диапазон октав изменен на:', this.value);
            
            // Если арпеджио уже проигрывается, перезапускаем его с новым диапазоном
            if (isArpPlaying) {
                const currentChord = window.UI.getCurrentChord();
                playArpeggio(currentChord);
            }
            
            // Сохраняем настройки
            saveArpeggiatorSettings();
        });
    }
    
    // Обработчик изменения смещения октавы
    const octaveOffsetSelector = document.getElementById('arpeggiator-octave-offset');
    if (octaveOffsetSelector) {
        octaveOffsetSelector.addEventListener('change', function() {
            arpeggiatorSettings.octaveOffset = parseInt(this.value);
            console.log('Смещение октавы изменено на:', this.value);
            
            // Если арпеджио уже проигрывается, перезапускаем его с новым смещением
            if (isArpPlaying) {
                const currentChord = window.UI.getCurrentChord();
                playArpeggio(currentChord);
            }
            
            // Сохраняем настройки
            saveArpeggiatorSettings();
        });
    }
    
    // Обработчик изменения длительности нот
    const noteLengthSelector = document.getElementById('arpeggiator-note-length');
    if (noteLengthSelector) {
        noteLengthSelector.addEventListener('change', function() {
            arpeggiatorSettings.noteLength = this.value;
            console.log('Длительность нот изменена на:', this.value);
            
            // Если арпеджио уже проигрывается, перезапускаем его с новой длительностью
            if (isArpPlaying) {
                const currentChord = window.UI.getCurrentChord();
                playArpeggio(currentChord);
            }
            
            // Сохраняем настройки
            saveArpeggiatorSettings();
        });
    }
    
    // Обработчик изменения акцента
    const accentToggle = document.getElementById('arpeggiator-accent');
    if (accentToggle) {
        accentToggle.addEventListener('change', function() {
            arpeggiatorSettings.accentFirst = this.checked;
            console.log('Акцент первой ноты', this.checked ? 'включен' : 'выключен');
            
            // Если арпеджио уже проигрывается, перезапускаем его с новой настройкой акцента
            if (isArpPlaying) {
                const currentChord = window.UI.getCurrentChord();
                playArpeggio(currentChord);
            }
            
            // Сохраняем настройки
            saveArpeggiatorSettings();
        });
    }
    
    // Заменяем обработчик проигрывания аккорда
    overridePlayChordFunction();
}

/**
 * Замена оригинальной функции проигрывания аккорда для поддержки арпеджио
 */
function overridePlayChordFunction() {
    // Сохраняем оригинальную функцию
    const originalPlayChord = window.Instrument.playChord;
    
    // Заменяем функцию на новую с поддержкой арпеджиатора
    window.Instrument.playChord = function(chordName) {
        // Если арпеджиатор включен, используем его
        if (arpeggiatorSettings.enabled) {
            playArpeggio(chordName);
        } else {
            // Иначе используем оригинальную функцию
            originalPlayChord(chordName);
        }
    };
}

/**
 * Проигрывание аккорда в виде арпеджио
 * @param {string} chordName - Название аккорда
 */
function playArpeggio(chordName) {
    // Проверка, что Tone.js загружен
    if (!window.Tone) {
        console.error('Tone.js не загружен, невозможно проиграть арпеджио');
        return;
    }
    
    // Проверка наличия данных об аккорде
    const chord = window.CHORD_DATA[chordName];
    if (!chord) {
        console.error('Аккорд не найден в базе данных:', chordName);
        return;
    }
    
    // Получаем ноты аккорда
    const baseNotes = chord.notes;
    
    // Если арпеджио уже проигрывается, останавливаем его
    stopArpeggio();
    
    // Устанавливаем флаг проигрывания
    isArpPlaying = true;
    
    // Генерируем последовательность нот для арпеджио с учетом октав
    const arpNotes = generateArpeggioNotes(baseNotes, arpeggiatorSettings.pattern, arpeggiatorSettings.octaveRange);
    
    // Получаем темп из секвенсора
    const bpm = window.Sequencer && window.Sequencer.getTempo ? window.Sequencer.getTempo() : 120;
    
    // Устанавливаем темп для Tone.js
    Tone.Transport.bpm.value = bpm;
    
    // Получаем инструмент для проигрывания
    const instrument = window.Instrument.getCurrentInstrument();
    if (!instrument) {
        console.error('Инструмент не инициализирован');
        return;
    }
    
    // Создаем последовательность нот для арпеджио
    arpSequence = new Tone.Sequence(
        (time, note) => {
            // Определяем громкость для ноты (акцент для первой ноты)
            let velocity = arpeggiatorSettings.velocity;
            if (arpeggiatorSettings.accentFirst && note === arpNotes[0]) {
                velocity = Math.min(1, velocity * 1.3); // Увеличиваем громкость для акцента
            }
            
            // Проигрываем ноту
            instrument.triggerAttackRelease(note, arpeggiatorSettings.noteLength, time, velocity);
        },
        arpNotes,
        arpeggiatorSettings.noteLength
    ).start(0);
    
    // Запускаем транспорт Tone.js, если он не запущен
    if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
    }
    
    console.log('Проигрывание арпеджио:', chordName, arpNotes);
}

/**
 * Остановка проигрывания арпеджио
 */
function stopArpeggio() {
    // Проверка, что Tone.js загружен
    if (!window.Tone) {
        return;
    }
    
    // Если последовательность существует, останавливаем и удаляем ее
    if (arpSequence) {
        arpSequence.stop();
        arpSequence.dispose();
        arpSequence = null;
    }
    
    // Сбрасываем флаг проигрывания
    isArpPlaying = false;
    
    console.log('Арпеджио остановлено');
}

/**
 * Генерация нот для арпеджио
 * @param {Array} baseNotes - Базовые ноты аккорда
 * @param {string} pattern - Паттерн арпеджио (up, down, updown, random)
 * @param {number} octaveRange - Диапазон октав
 * @returns {Array} Массив нот для арпеджио
 */
function generateArpeggioNotes(baseNotes, pattern, octaveRange) {
    // Преобразуем ноты, удаляя номер октавы для обработки
    const notes = baseNotes.map(note => {
        return {
            noteName: note.replace(/[0-9]/g, ''), // Название ноты без октавы
            octave: parseInt(note.match(/[0-9]/)[0]) // Номер октавы
        };
    });
    
    // Применяем смещение октавы
    const octaveOffset = arpeggiatorSettings.octaveOffset;
    notes.forEach(note => {
        note.octave += octaveOffset;
        // Убеждаемся, что октава не стала отрицательной
        if (note.octave < 0) note.octave = 0;
        // Ограничиваем максимальную октаву
        if (note.octave > 8) note.octave = 8;
    });
    
    // Сортируем ноты по высоте (для паттернов вверх/вниз)
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    notes.sort((a, b) => {
        const aIndex = noteOrder.indexOf(a.noteName);
        const bIndex = noteOrder.indexOf(b.noteName);
        if (aIndex === bIndex) {
            return a.octave - b.octave;
        }
        return aIndex - bIndex;
    });
    
    // Создаем массив для результата
    let result = [];
    
    // Генерируем ноты в зависимости от паттерна
    switch (pattern) {
        case 'up':
            // Восходящий паттерн
            for (let octave = 0; octave < octaveRange; octave++) {
                notes.forEach(note => {
                    result.push(`${note.noteName}${note.octave + octave}`);
                });
            }
            break;
            
        case 'down':
            // Нисходящий паттерн
            for (let octave = octaveRange - 1; octave >= 0; octave--) {
                [...notes].reverse().forEach(note => {
                    result.push(`${note.noteName}${note.octave + octave}`);
                });
            }
            break;
            
        case 'updown':
            // Восходяще-нисходящий паттерн
            for (let octave = 0; octave < octaveRange; octave++) {
                notes.forEach(note => {
                    result.push(`${note.noteName}${note.octave + octave}`);
                });
            }
            // Добавляем нисходящую часть (без повторения верхней ноты)
            for (let octave = octaveRange - 1; octave >= 0; octave--) {
                [...notes].reverse().forEach((note, index) => {
                    // Пропускаем первую ноту в верхнем октаве и последнюю в нижнем
                    if ((octave === octaveRange - 1 && index === 0) || 
                        (octave === 0 && index === notes.length - 1)) {
                        return;
                    }
                    result.push(`${note.noteName}${note.octave + octave}`);
                });
            }
            break;
            
        case 'downup':
            // Нисходяще-восходящий паттерн
            for (let octave = octaveRange - 1; octave >= 0; octave--) {
                [...notes].reverse().forEach(note => {
                    result.push(`${note.noteName}${note.octave + octave}`);
                });
            }
            // Добавляем восходящую часть (без повторения нижней ноты)
            for (let octave = 0; octave < octaveRange; octave++) {
                notes.forEach((note, index) => {
                    // Пропускаем первую ноту в нижнем октаве и последнюю в верхнем
                    if ((octave === 0 && index === 0) || 
                        (octave === octaveRange - 1 && index === notes.length - 1)) {
                        return;
                    }
                    result.push(`${note.noteName}${note.octave + octave}`);
                });
            }
            break;
            
        case 'random':
            // Случайный паттерн
            const allNotes = [];
            for (let octave = 0; octave < octaveRange; octave++) {
                notes.forEach(note => {
                    allNotes.push(`${note.noteName}${note.octave + octave}`);
                });
            }
            
            // Генерируем случайную последовательность из доступных нот
            const noteCount = allNotes.length * 2; // Длина случайной последовательности
            for (let i = 0; i < noteCount; i++) {
                const randomIndex = Math.floor(Math.random() * allNotes.length);
                result.push(allNotes[randomIndex]);
            }
            break;
            
        default:
            // По умолчанию - восходящий паттерн
            result = notes.map(note => `${note.noteName}${note.octave}`);
    }
    
    return result;
}

// Экспорт функций и переменных
window.Arpeggiator = {
    initializeArpeggiator: initializeArpeggiator,
    playArpeggio: playArpeggio,
    stopArpeggio: stopArpeggio,
    saveArpeggiatorSettings: saveArpeggiatorSettings,
    loadArpeggiatorSettings: loadArpeggiatorSettings,
    getSettings: function() { return arpeggiatorSettings; },
    setEnabled: function(enabled) {
        arpeggiatorSettings.enabled = enabled;
        const toggle = document.getElementById('arpeggiator-toggle');
        if (toggle) toggle.checked = enabled;
        saveArpeggiatorSettings();
    }
};