/**
 * sequencer.js
 * Управление секвенсором аккордовых прогрессий
 */

// Глобальные переменные секвенсора
let chordSequence = [];
let currentSequenceIndex = -1;
let isPlaying = false;
let sequenceLoop = null;
let sequenceTempo = 120; // BPM
let customSequencePlaying = false; // Флаг для отслеживания воспроизведения пользовательской последовательности
let temporarySequence = null; // Временная последовательность для воспроизведения

// Инициализация секвенсора
function initializeSequencer() {
    // Устанавливаем обработчики событий для секвенсора
    setupSequencerEventListeners();
    
    // Загружаем сохраненный темп, если есть
    const savedTempo = localStorage.getItem('sequenceTempo');
    if (savedTempo) {
        sequenceTempo = parseInt(savedTempo);
        const tempoInput = document.getElementById('tempo-input');
        if (tempoInput) {
            tempoInput.value = sequenceTempo;
        }
    }
    
    // Обновляем визуальное отображение
    updateSequenceDisplay();
}

// Настройка обработчиков событий для секвенсора
function setupSequencerEventListeners() {
    // Обработчик для кнопки добавления текущего аккорда
    const addChordButton = document.getElementById('add-current-chord');
    if (addChordButton) {
        addChordButton.addEventListener('click', function() {
            addChordToSequence(window.UI.getCurrentChord());
        });
    }
    
    // Обработчик для кнопки воспроизведения последовательности
    const playSequenceButton = document.getElementById('play-sequence');
    if (playSequenceButton) {
        playSequenceButton.addEventListener('click', function() {
            playSequence();
        });
    }
    
    // Обработчик для кнопки остановки воспроизведения
    const stopButton = document.getElementById('stop-sequence');
    if (stopButton) {
        stopButton.addEventListener('click', function() {
            stopSequence();
        });
    }
    
    // Обработчик для кнопки очистки последовательности
    const clearButton = document.getElementById('clear-sequence');
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            clearSequence();
        });
    }
    
    // Обработчик для изменения темпа
    const tempoInput = document.getElementById('tempo-input');
    if (tempoInput) {
        tempoInput.addEventListener('change', function() {
            sequenceTempo = parseInt(this.value);
            if (isNaN(sequenceTempo) || sequenceTempo < 1) {
                sequenceTempo = 1;
                this.value = 1;
            } else if (sequenceTempo > 200) {
                sequenceTempo = 200;
                this.value = 200;
            }
            
            // Сохраняем новое значение темпа
            localStorage.setItem('sequenceTempo', sequenceTempo);
            
            // Если последовательность проигрывается, обновляем темп
            if (isPlaying) {
                updatePlaybackTempo();
            }
        });
    }
}

/**
 * Обновление темпа воспроизведения во время проигрывания
 */
function updatePlaybackTempo() {
    // Останавливаем текущий интервал
    if (sequenceLoop) {
        clearInterval(sequenceLoop);
    }
    
    // Настраиваем новый интервал с обновленным темпом
    const interval = (60 / sequenceTempo) * 1000; // в миллисекундах
    
    sequenceLoop = setInterval(function() {
        // Переходим к следующему аккорду
        currentSequenceIndex++;
        
        // Получаем последовательность для воспроизведения (основную или временную)
        const sequence = customSequencePlaying && temporarySequence 
            ? temporarySequence 
            : chordSequence;
        
        // Если достигли конца последовательности, начинаем сначала
        if (currentSequenceIndex >= sequence.length) {
            currentSequenceIndex = 0;
            
            // Если играем временную последовательность и не зациклено, останавливаем
            if (customSequencePlaying && !window.Sequencer.loopCustomSequence) {
                stopSequence();
                return;
            }
        }
        
        // Проигрываем текущий аккорд
        playCurrentSequenceChord();
    }, interval);
}

/**
 * Добавление аккорда в последовательность
 * @param {string} chordName - Название аккорда
 */
function addChordToSequence(chordName) {
    // Проверяем наличие данных об аккорде (если это не пауза)
    if (chordName !== 'PAUSE' && !window.CHORD_DATA[chordName]) {
        console.error('Неизвестный аккорд:', chordName);
        return;
    }
    
    // Добавляем аккорд в массив последовательности
    chordSequence.push(chordName);
    
    // Обновляем визуальное отображение последовательности
    updateSequenceDisplay();
    
    // Генерируем событие об изменении последовательности
    dispatchSequenceChangedEvent();
}

/**
 * Генерация события об изменении последовательности
 */
function dispatchSequenceChangedEvent() {
    const event = new CustomEvent('sequenceChanged', {
        detail: {
            sequence: chordSequence
        }
    });
    document.dispatchEvent(event);
}

/**
 * Установка последовательности аккордов
 * @param {Array} sequence - Массив аккордов для установки
 */
function setSequence(sequence) {
    if (!Array.isArray(sequence)) {
        console.error('Ошибка: sequence должен быть массивом');
        return;
    }
    
    // Останавливаем текущее воспроизведение, если оно активно
    if (isPlaying) {
        stopSequence();
    }
    
    // Устанавливаем новую последовательность
    chordSequence = [...sequence];
    
    // Обновляем визуальное отображение
    updateSequenceDisplay();
}

/**
 * Воспроизведение пользовательской последовательности аккордов
 * @param {Array} sequence - Массив аккордов для воспроизведения
 * @param {boolean} [loop=false] - Флаг зацикливания воспроизведения
 */
function playCustomSequence(sequence, loop = false) {
    // Проверяем, есть ли аккорды в последовательности
    if (!sequence || sequence.length === 0) {
        console.error('Ошибка: нет аккордов для воспроизведения');
        // Показываем уведомление для пользователя
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification('Нет аккордов для воспроизведения', 'warning');
        }
        return;
    }
    
    // Если уже воспроизводится, останавливаем
    if (isPlaying) {
        stopSequence();
    }
    
    // Сохраняем последовательность во временную переменную
    temporarySequence = [...sequence];
    
    // Устанавливаем флаг воспроизведения пользовательской последовательности
    customSequencePlaying = true;
    
    // Сохраняем настройку зацикливания
    window.Sequencer.loopCustomSequence = loop;
    
    // Настраиваем интервал между аккордами на основе темпа
    const interval = (60 / sequenceTempo) * 1000; // в миллисекундах
    
    // Устанавливаем флаг проигрывания
    isPlaying = true;
    
    // Обновляем состояние кнопок
    const playButton = document.getElementById('play-sequence');
    const stopButton = document.getElementById('stop-sequence');
    if (playButton) playButton.disabled = true;
    if (stopButton) stopButton.disabled = false;
    
    // Начинаем с первого аккорда
    currentSequenceIndex = 0;
    
    // Запускаем метроном, если он включен
    if (window.Instrument && window.Instrument.startMetronome) {
        window.Instrument.startMetronome();
    }
    
    // Проигрываем первый аккорд
    playCurrentSequenceChord();
    
    // Настраиваем интервал для проигрывания остальных аккордов
    sequenceLoop = setInterval(function() {
        // Переходим к следующему аккорду
        currentSequenceIndex++;
        
        // Если достигли конца последовательности
        if (currentSequenceIndex >= temporarySequence.length) {
            // Если зацикливание включено, начинаем сначала
            if (loop) {
                currentSequenceIndex = 0;
            } else {
                // Иначе останавливаем воспроизведение и выходим
                stopSequence();
                return;
            }
        }
        
        // Проигрываем текущий аккорд
        playCurrentSequenceChord();
    }, interval);
}

/**
 * Обновление визуального отображения последовательности
 */
function updateSequenceDisplay() {
    const timelineElement = document.getElementById('sequence-timeline');
    if (!timelineElement) {
        console.error('Элемент timeline не найден');
        return;
    }
    
    // Очищаем текущее содержимое
    timelineElement.innerHTML = '';
    
    // Если последовательность пуста, показываем заглушку
    if (chordSequence.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'timeline-placeholder';
        placeholder.textContent = 'Добавьте аккорды в последовательность с помощью кнопки "Добавить текущий аккорд"';
        timelineElement.appendChild(placeholder);
        
        // Деактивируем кнопку воспроизведения
        const playButton = document.getElementById('play-sequence');
        if (playButton) playButton.disabled = true;
        
        return;
    }
    
    // Активируем кнопку воспроизведения
    const playButton = document.getElementById('play-sequence');
    if (playButton) playButton.disabled = false;
    
    // Создаем слоты для каждого аккорда
    chordSequence.forEach((chordName, index) => {
        const slotElement = document.createElement('div');
        slotElement.className = 'sequence-slot';
        slotElement.setAttribute('data-index', index);
        
        // Если это текущий проигрываемый аккорд, добавляем соответствующий класс
        if (index === currentSequenceIndex && isPlaying && !customSequencePlaying) {
            slotElement.classList.add('current-playing');
        }
        
        // Название аккорда
        const chordNameElement = document.createElement('div');
        chordNameElement.className = 'slot-chord';
        
        // Если это пауза, отображаем соответствующий символ
        if (chordName === 'PAUSE') {
            chordNameElement.textContent = '𝄽'; // Символ паузы
            chordNameElement.classList.add('pause-symbol');
        } else {
            chordNameElement.textContent = chordName;
        }
        
        slotElement.appendChild(chordNameElement);
        
        // Добавляем обработчик клика для проигрывания
        slotElement.addEventListener('click', function() {
            // Проигрываем аккорд при клике (кроме паузы)
            if (chordName !== 'PAUSE') {
                window.UI.setCurrentChord(chordName);
                window.Instrument.playChord(chordName);
            }
        });
        
        // Кнопка удаления
        const removeButton = document.createElement('div');
        removeButton.className = 'slot-remove';
        removeButton.textContent = '×';
        removeButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Предотвращаем проигрывание аккорда при клике на кнопку удаления
            removeChordFromSequence(index);
        });
        slotElement.appendChild(removeButton);
        
        timelineElement.appendChild(slotElement);
    });
}

/**
 * Удаление аккорда из последовательности
 * @param {number} index - Индекс аккорда для удаления
 */
function removeChordFromSequence(index) {
    // Проверяем корректность индекса
    if (index < 0 || index >= chordSequence.length) {
        console.error('Некорректный индекс для удаления аккорда:', index);
        return;
    }
    
    // Удаляем аккорд из массива
    chordSequence.splice(index, 1);
    
    // Если удаляем аккорд во время воспроизведения
    if (isPlaying && !customSequencePlaying) {
        // Если удаляемый аккорд был текущим или после него
        if (index <= currentSequenceIndex) {
            // Корректируем индекс текущего аккорда
            currentSequenceIndex = Math.min(currentSequenceIndex - 1, chordSequence.length - 1);
        }
        
        // Если последовательность стала пустой, останавливаем проигрывание
        if (chordSequence.length === 0) {
            stopSequence();
        }
    }
    
    // Обновляем визуальное отображение
    updateSequenceDisplay();
    
    // Генерируем событие об изменении последовательности
    dispatchSequenceChangedEvent();
}

/**
 * Очистка всей последовательности
 */
function clearSequence() {
    // Если последовательность пуста, ничего не делаем
    if (chordSequence.length === 0) return;
    
    // Если последовательность воспроизводится, останавливаем проигрывание
    if (isPlaying && !customSequencePlaying) {
        stopSequence();
    }
    
    // Очищаем массив последовательности
    chordSequence = [];
    
    // Обновляем визуальное отображение
    updateSequenceDisplay();
    
    // Генерируем событие об изменении последовательности
    dispatchSequenceChangedEvent();
}

/**
 * Воспроизведение последовательности аккордов
 */
function playSequence() {
    // Проверяем, есть ли аккорды в последовательности
    if (chordSequence.length === 0) {
        console.error('Ошибка: нет аккордов для воспроизведения');
        // Показываем уведомление для пользователя
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification('Нет аккордов для воспроизведения', 'warning');
        }
        return;
    }
    
    // Если уже воспроизводится, останавливаем
    if (isPlaying) {
        stopSequence();
    }
    
    // Настраиваем интервал между аккордами на основе темпа
    const interval = (60 / sequenceTempo) * 1000; // в миллисекундах
    
    // Устанавливаем флаг проигрывания
    isPlaying = true;
    customSequencePlaying = false; // Сбрасываем флаг пользовательской последовательности
    
    // Обновляем состояние кнопок
    const playButton = document.getElementById('play-sequence');
    const stopButton = document.getElementById('stop-sequence');
    if (playButton) playButton.disabled = true;
    if (stopButton) stopButton.disabled = false;
    
    // Начинаем с первого аккорда
    currentSequenceIndex = 0;
    
    // Запускаем метроном, если он включен
    if (window.Instrument && window.Instrument.startMetronome) {
        window.Instrument.startMetronome();
    }
    
    // Проигрываем первый аккорд
    playCurrentSequenceChord();
    
    // Настраиваем интервал для проигрывания остальных аккордов
    sequenceLoop = setInterval(function() {
        // Переходим к следующему аккорду
        currentSequenceIndex++;
        
        // Если достигли конца последовательности, начинаем сначала
        if (currentSequenceIndex >= chordSequence.length) {
            currentSequenceIndex = 0;
        }
        
        // Проигрываем текущий аккорд
        playCurrentSequenceChord();
    }, interval);
}

/**
 * Проигрывание текущего аккорда в последовательности
 */
function playCurrentSequenceChord() {
    // Определяем, какую последовательность использовать
    const sequence = customSequencePlaying ? temporarySequence : chordSequence;
    
    // Проверяем корректность индекса
    if (currentSequenceIndex < 0 || currentSequenceIndex >= sequence.length) {
        console.error('Некорректный индекс аккорда:', currentSequenceIndex);
        return;
    }
    
    // Получаем название текущего аккорда
    const chordName = sequence[currentSequenceIndex];
    
    // Проверяем, не является ли аккорд специальным маркером
    if (chordName === 'BLOCK_DIVIDER') {
        // Для разделителя блоков можно добавить паузу или визуальный эффект
        console.log('Разделитель блоков');
        return;
    }
    
    // Перед проигрыванием нового аккорда останавливаем все звуки
    if (window.Instrument && window.Instrument.stopAllSounds) {
        window.Instrument.stopAllSounds();
    }
    
    // Если это пауза, просто пропускаем воспроизведение
    if (chordName === 'PAUSE') {
        console.log('Пауза');
    } else {
        // Устанавливаем текущий аккорд и проигрываем его
        window.UI.setCurrentChord(chordName);
        window.Instrument.playChord(chordName);
    }
    
    // Обновляем визуальное отображение для подсветки текущего аккорда
    updateSequenceDisplay();
}

/**
 * Остановка воспроизведения последовательности
 */
function stopSequence() {
    // Проверяем, воспроизводится ли последовательность
    if (!isPlaying) return;
    
    // Останавливаем интервал
    if (sequenceLoop) {
        clearInterval(sequenceLoop);
        sequenceLoop = null;
    }
    
    // Останавливаем все звуки
    if (window.Instrument && window.Instrument.stopAllSounds) {
        window.Instrument.stopAllSounds();
    }
    
    // Сбрасываем флаги проигрывания
    isPlaying = false;
    customSequencePlaying = false;
    temporarySequence = null;
    
    // Сбрасываем индекс текущего аккорда
    currentSequenceIndex = -1;
    
    // Обновляем состояние кнопок
    const playButton = document.getElementById('play-sequence');
    const stopButton = document.getElementById('stop-sequence');
    if (playButton && chordSequence.length > 0) playButton.disabled = false;
    if (stopButton) stopButton.disabled = true;
    
    // Останавливаем метроном, если он был включен
    if (window.Instrument && window.Instrument.stopMetronome) {
        window.Instrument.stopMetronome();
    }
    
    // Обновляем визуальное отображение для снятия подсветки
    updateSequenceDisplay();
}

/**
 * Добавление паузы в последовательность
 */
function addPauseToSequence() {
    // Добавляем специальный маркер паузы в последовательность
    chordSequence.push('PAUSE');
    
    // Обновляем визуальное отображение
    updateSequenceDisplay();
    
    // Генерируем событие об изменении последовательности
    dispatchSequenceChangedEvent();
}

/**
 * Получение текущего темпа воспроизведения
 * @returns {number} Текущий темп в ударах в минуту
 */
function getTempo() {
    return sequenceTempo;
}

/**
 * Получение статуса воспроизведения
 * @returns {boolean} true, если последовательность воспроизводится
 */
function getIsPlaying() {
    return isPlaying;
}

// Экспорт функций и переменных
window.Sequencer = {
    initializeSequencer: initializeSequencer,
    addChordToSequence: addChordToSequence,
    addPauseToSequence: addPauseToSequence,
    playSequence: playSequence,
    playCustomSequence: playCustomSequence,
    stopSequence: stopSequence,
    clearSequence: clearSequence,
    setSequence: setSequence,
    getSequence: function() { return chordSequence; },
    getTempo: getTempo,
    getIsPlaying: getIsPlaying,
    loopCustomSequence: false, // Флаг для управления зацикливанием пользовательской последовательности
    get isPlaying() { return isPlaying; }
};