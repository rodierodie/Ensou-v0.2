/**
 * ui.js
 * Управление пользовательским интерфейсом
 */

// Глобальные переменные UI
let currentChord = "C";
let currentTonality = "C";
let previousTonality = null; // Для отслеживания изменений тональности
let internalTonalityChange = false; // Флаг для предотвращения циклических вызовов

// Инициализация элементов интерфейса
function initializeUI(instruments) {
    // Сохраняем инструменты в глобальном объекте
    if (window.Instrument) {
        window.Instrument.instruments = instruments;
    }
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Обновляем элементы интерфейса для текущей тональности
    updateTonalityUI(currentTonality);
    
    // Обновляем информацию о текущем аккорде
    updateChordInfo(currentChord);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчики табов тональностей
    const tonalityTabs = document.querySelectorAll('.tonality-tab');
    tonalityTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tonality = this.getAttribute('data-tonality');
            changeTonality(tonality);
        });
    });
}

// Смена тональности
function changeTonality(tonality) {
    if (!window.TONALITY_DATA[tonality]) {
        console.error('Неизвестная тональность:', tonality);
        return;
    }
    
    // Если это внутренний вызов из TrackStructure, не обновляем блок
    if (internalTonalityChange) {
        internalTonalityChange = false;
        
        // Сохраняем предыдущую тональность
        previousTonality = currentTonality;
        
        // Устанавливаем новую тональность
        currentTonality = tonality;
        
        // Обновляем элементы интерфейса для новой тональности
        updateTonalityUI(tonality);
        
        // Устанавливаем первый аккорд тональности как текущий
        const firstChord = window.TONALITY_DATA[tonality].chords.basic[0];
        setCurrentChord(firstChord);
        
        return;
    }
    
    // Сохраняем предыдущую тональность
    previousTonality = currentTonality;
    
    // Устанавливаем новую тональность
    currentTonality = tonality;
    
    // Обновляем элементы интерфейса для новой тональности
    updateTonalityUI(tonality);
    
    // Устанавливаем первый аккорд тональности как текущий
    const firstChord = window.TONALITY_DATA[tonality].chords.basic[0];
    setCurrentChord(firstChord);
    
    // Если это изменение происходит в контексте блока, обновляем тональность блока
    if (window.TrackStructure && typeof window.TrackStructure.getCurrentBlockIndex === 'function') {
        const currentBlockIndex = window.TrackStructure.getCurrentBlockIndex();
        
        // Автоматически обновляем тональность текущего блока без запроса
        if (window.TrackStructure.changeBlockTonality) {
            // Передаем флаг, чтобы избежать циклического вызова
            window.TrackStructure.changeBlockTonality(currentBlockIndex, tonality, true);
        }
    }
}

// Обновление интерфейса для выбранной тональности
function updateTonalityUI(tonality) {
    // Обновляем выделение таба тональности
    const tonalityTabs = document.querySelectorAll('.tonality-tab');
    tonalityTabs.forEach(tab => {
        if (tab.getAttribute('data-tonality') === tonality) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Обновляем селектор основных аккордов
    const basicChordsContainer = document.getElementById('basic-chords');
    if (basicChordsContainer && window.TONALITY_DATA[tonality]) {
        basicChordsContainer.innerHTML = '';
        
        window.TONALITY_DATA[tonality].chords.basic.forEach(chordName => {
            const button = document.createElement('div');
            button.className = 'chord-button';
            button.setAttribute('data-chord', chordName);
            button.textContent = chordName;
            
            // Если это текущий аккорд, добавляем класс active
            if (chordName === currentChord) {
                button.classList.add('active');
            }
            
            button.addEventListener('click', function() {
                const chord = this.getAttribute('data-chord');
                setCurrentChord(chord);
                window.Instrument.playChord(chord);
            });
            
            basicChordsContainer.appendChild(button);
        });
    }
    
    // Обновляем селектор септаккордов
    const seventhChordsContainer = document.getElementById('seventh-chords');
    if (seventhChordsContainer && window.TONALITY_DATA[tonality]) {
        seventhChordsContainer.innerHTML = '';
        
        window.TONALITY_DATA[tonality].chords.seventh.forEach(chordName => {
            const button = document.createElement('div');
            button.className = 'chord-button';
            button.setAttribute('data-chord', chordName);
            button.textContent = chordName;
            
            // Если это текущий аккорд, добавляем класс active
            if (chordName === currentChord) {
                button.classList.add('active');
            }
            
            button.addEventListener('click', function() {
                const chordName = this.getAttribute('data-chord');
                setCurrentChord(chordName);
                window.Instrument.playChord(chordName);
            });
            
            seventhChordsContainer.appendChild(button);
        });
    }
}

// Установка текущего аккорда
function setCurrentChord(chordName) {
    // Проверяем наличие аккорда в базе данных
    if (!window.CHORD_DATA[chordName]) {
        console.error('Неизвестный аккорд:', chordName);
        return;
    }
    
    // Запоминаем предыдущий аккорд для сравнения
    const prevChord = currentChord;
    
    // Останавливаем все звуки перед сменой аккорда
    if (window.Instrument && window.Instrument.stopAllSounds) {
        window.Instrument.stopAllSounds();
    }

    currentChord = chordName;

    
    
    // Обновляем отображение текущего аккорда
    const currentChordElement = document.querySelector('.current-chord');
    if (currentChordElement) {
        currentChordElement.textContent = chordName;
    }
    
    // Обновляем выделение кнопки аккорда
    const allChordButtons = document.querySelectorAll('.chord-button');
    allChordButtons.forEach(button => {
        if (button.getAttribute('data-chord') === chordName) {
            button.classList.add('active');
        } else if (button.getAttribute('data-chord') === prevChord) {
            button.classList.remove('active');
        }
    });
    
    // Обновляем информацию об аккорде
    updateChordInfo(chordName);
}

// Обновление информации об аккорде
/**
 * Обновление информации об аккорде с добавлением кнопки проигрывания
 * Эта функция должна заменить текущую updateChordInfo в ui.js
 */
function updateChordInfo(chordName) {
    const chordInfoElement = document.getElementById('chord-info');
    if (!chordInfoElement) return;
    
    const chord = window.CHORD_DATA[chordName];
    if (!chord) return;
    
    // Формируем HTML для информации об аккорде
    let infoHTML = `
        <p>${chordName} (${chord.fullName}) - ${chord.description}
            <button id="play-chord-button" class="inline-play-button">Проиграть</button>
        </p>
        <p>Ноты: ${chord.notes.map(note => note.replace(/[0-9]/g, '')).join(', ')}</p>
        <p>Функциональное значение:`;
    
    // Добавляем функции аккорда в разных тональностях
    let hasFunction = false;
    for (const tonality in chord.functions) {
        hasFunction = true;
        const func = chord.functions[tonality];
        let funcClass = 'tonic';
        
        // Определяем класс для функции
        if (func.function.includes('dominant')) {
            funcClass = 'dominant';
        } else if (func.function.includes('subdominant')) {
            funcClass = 'subdominant';
        }
        
        infoHTML += `
            <span class="function-icon ${funcClass}">${func.label}</span> 
            ${func.function} (ступень ${func.degree}) в тональности ${tonality}`;
    }
    
    // Если у аккорда нет функций, показываем сообщение
    if (!hasFunction) {
        infoHTML += ' функция не определена';
    }
    
    infoHTML += '</p>';
    
    // Обновляем содержимое элемента
    chordInfoElement.innerHTML = infoHTML;
    
    // Добавляем обработчик для кнопки проигрывания
    const playButton = document.getElementById('play-chord-button');
    if (playButton) {
        playButton.addEventListener('click', function(e) {
            e.preventDefault(); // Предотвращаем обработку события по умолчанию
            e.stopPropagation(); // Останавливаем всплытие события
            window.Instrument.playChord(chordName);
        });
    }
    
    // Удаляем основную кнопку проигрывания, если она есть
    const mainPlayButton = document.getElementById('play-button');
    if (mainPlayButton) {
        mainPlayButton.style.display = 'none';
    }
    
    // Генерируем событие обновления информации об аккорде
    document.dispatchEvent(new CustomEvent('chordInfoUpdated'));
}
/**
 * Создание модального окна с сообщением
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип сообщения (info, success, warning, error)
 */
function showNotification(message, type = 'info') {
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

// Установка флага внутреннего изменения тональности
function setInternalTonalityChange(value) {
    internalTonalityChange = value;
}

// Экспорт функций и переменных для использования в других модулях
window.UI = {
    initializeUI: initializeUI,
    setCurrentChord: setCurrentChord,
    changeTonality: changeTonality,
    updateChordInfo: updateChordInfo,
    showNotification: showNotification,
    setInternalTonalityChange: setInternalTonalityChange,
    getCurrentChord: function() { return currentChord; },
    getCurrentTonality: function() { return currentTonality; }
};