/**
 * track-structure.js
 * Модуль для управления структурой трека и блоками последовательностей аккордов
 */

// Глобальная переменная для хранения структуры трека
let trackStructure = [];
let currentBlockIndex = 0;

/**
 * Класс для представления блока аккордов
 */
class TrackBlock {
    /**
     * Создает новый блок аккордов
     * @param {string} id - Уникальный идентификатор блока
     * @param {string} name - Название блока (например, A1, B1, и т.д.)
     * @param {string} tonality - Тональность блока
     * @param {Array} chords - Массив аккордов в блоке
     */
    constructor(id, name, tonality, chords = []) {
        this.id = id;
        this.name = name;
        this.tonality = tonality;
        this.chords = chords;
    }
}

/**
 * Инициализация структуры трека
 */
function initializeTrackStructure() {
    console.log('Инициализация структуры трека...');
    
    // Проверяем, есть ли сохраненная структура в localStorage
    const savedStructure = localStorage.getItem('trackStructure');
    
    if (savedStructure) {
        try {
            trackStructure = JSON.parse(savedStructure);
            console.log('Загружена сохраненная структура трека:', trackStructure);
        } catch (e) {
            console.error('Ошибка при загрузке сохраненной структуры:', e);
            createDefaultTrackStructure();
        }
    } else {
        // Если нет сохраненной структуры, создаем стандартную
        createDefaultTrackStructure();
    }
    
    // Инициализируем интерфейс
    updateTrackStructureUI();
    
    // Устанавливаем обработчики событий
    setupTrackStructureEventListeners();
}

/**
 * Создание стандартной структуры трека с одним блоком
 */
function createDefaultTrackStructure() {
    console.log('Создание стандартной структуры трека...');
    
    // Создаем один начальный блок
    const defaultBlock = new TrackBlock(
        generateUniqueId(),
        'A1',
        window.UI.getCurrentTonality(),
        []
    );
    
    trackStructure = [defaultBlock];
    currentBlockIndex = 0;
    
    // Сохраняем структуру
    saveTrackStructure();
    
    console.log('Создана стандартная структура с одним блоком:', trackStructure);
}

/**
 * Генерация уникального ID для блока
 * @returns {string} Уникальный ID
 */
function generateUniqueId() {
    return 'block_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

/**
 * Генерация следующего имени блока (A1, A2, B1, и т.д.)
 * @returns {string} Имя нового блока
 */
function generateNextBlockName() {
    // Если структура пуста, возвращаем A1
    if (trackStructure.length === 0) {
        return 'A1';
    }
    
    // Собираем все существующие имена блоков
    const existingNames = trackStructure.map(block => block.name);
    
    // Находим последний использованный префикс и номер
    let lastPrefix = 'A';
    let lastNumber = 0;
    
    for (const name of existingNames) {
        // Проверяем формат имени (буква + цифра)
        const match = name.match(/^([A-Z])(\d+)$/);
        if (match) {
            const prefix = match[1];
            const number = parseInt(match[2], 10);
            
            // Обновляем последний префикс, если текущий больше
            if (prefix > lastPrefix) {
                lastPrefix = prefix;
                lastNumber = number;
            } 
            // Если префикс тот же, проверяем номер
            else if (prefix === lastPrefix && number > lastNumber) {
                lastNumber = number;
            }
        }
    }
    
    // Определяем следующий номер для текущего префикса
    const nextNumber = lastNumber + 1;
    
    // Если номер > 9, увеличиваем префикс (переходим к следующей букве)
    if (nextNumber > 9) {
        const nextPrefixCode = lastPrefix.charCodeAt(0) + 1;
        // Проверяем, что мы не вышли за пределы латинского алфавита
        if (nextPrefixCode <= 'Z'.charCodeAt(0)) {
            return String.fromCharCode(nextPrefixCode) + '1';
        } else {
            // Если достигли конца алфавита, возвращаемся к A с большим номером
            return 'A' + nextNumber;
        }
    } else {
        return lastPrefix + nextNumber;
    }
}

/**
 * Сохранение структуры трека в localStorage
 */
function saveTrackStructure() {
    try {
        localStorage.setItem('trackStructure', JSON.stringify(trackStructure));
        console.log('Структура трека сохранена:', trackStructure);
    } catch (e) {
        console.error('Ошибка при сохранении структуры трека:', e);
    }
}

/**
 * Добавление нового блока в структуру
 * @param {string} [tonality] - Тональность нового блока (если не указана, используется текущая)
 */
function addNewBlock(tonality) {
    // Если тональность не указана, используем текущую
    const blockTonality = tonality || window.UI.getCurrentTonality();
    
    // Генерируем имя для нового блока
    const blockName = generateNextBlockName();
    
    // Создаем новый блок
    const newBlock = new TrackBlock(
        generateUniqueId(),
        blockName,
        blockTonality,
        []
    );
    
    // Добавляем блок в структуру
    trackStructure.push(newBlock);
    
    // Устанавливаем новый блок как текущий
    currentBlockIndex = trackStructure.length - 1;
    
    // Сохраняем обновленную структуру
    saveTrackStructure();
    
    // Обновляем интерфейс
    updateTrackStructureUI();
    
    // Очищаем текущую последовательность аккордов для нового блока
    window.Sequencer.clearSequence();
    
    console.log('Добавлен новый блок:', newBlock);
}

/**
 * Переименование блока
 * @param {number} index - Индекс блока в структуре
 * @param {string} newName - Новое имя блока
 */
function renameBlock(index, newName) {
    // Проверяем существование блока
    if (index < 0 || index >= trackStructure.length) {
        console.error('Ошибка: блок с индексом', index, 'не существует');
        return;
    }
    
    // Проверяем формат имени (буква + цифра)
    if (!/^[A-Z][1-9](\d*)$/.test(newName)) {
        console.error('Ошибка: неверный формат имени блока:', newName);
        return;
    }
    
    // Обновляем имя блока
    trackStructure[index].name = newName;
    
    // Сохраняем обновленную структуру
    saveTrackStructure();
    
    // Обновляем интерфейс
    updateTrackStructureUI();
    
    console.log('Блок переименован:', index, '->', newName);
}

/**
 * Удаление блока
 * @param {number} index - Индекс блока для удаления
 */
function removeBlock(index) {
    // Проверяем существование блока
    if (index < 0 || index >= trackStructure.length) {
        console.error('Ошибка: блок с индексом', index, 'не существует');
        return;
    }
    
    // Сохраняем информацию об удаляемом блоке для логирования
    const removedBlock = trackStructure[index];
    
    // Удаляем блок
    trackStructure.splice(index, 1);
    
    // Если удаляем текущий активный блок
    if (currentBlockIndex === index) {
        // Если это был последний блок, устанавливаем предыдущий как текущий
        if (index >= trackStructure.length) {
            currentBlockIndex = Math.max(0, trackStructure.length - 1);
        }
        // Иначе сохраняем текущий индекс (он уже указывает на следующий блок после удаления)
    } 
    // Если удаляем блок перед текущим, корректируем индекс
    else if (index < currentBlockIndex) {
        currentBlockIndex--;
    }
    
    // Если после удаления структура пуста, создаем один стандартный блок
    if (trackStructure.length === 0) {
        createDefaultTrackStructure();
    } else {
        // Сохраняем обновленную структуру
        saveTrackStructure();
    }
    
    // Обновляем интерфейс
    updateTrackStructureUI();
    
    // Загружаем аккорды текущего блока
    loadBlockChords(currentBlockIndex);
    
    console.log('Блок удален:', removedBlock);
}

/**
 * Изменение тональности блока
 * @param {number} index - Индекс блока
 * @param {string} newTonality - Новая тональность
 * @param {boolean} [fromUI=false] - Флаг указывающий, что вызов пришел из UI
 */
function changeBlockTonality(index, newTonality, fromUI = false) {
    // Проверяем существование блока
    if (index < 0 || index >= trackStructure.length) {
        console.error('Ошибка: блок с индексом', index, 'не существует');
        return;
    }
    
    // Проверяем существование тональности
    if (!window.TONALITY_DATA[newTonality]) {
        console.error('Ошибка: неизвестная тональность:', newTonality);
        return;
    }
    
    // Сохраняем старую тональность для логирования
    const oldTonality = trackStructure[index].tonality;
    
    // Обновляем тональность блока
    trackStructure[index].tonality = newTonality;
    
    // Сохраняем обновленную структуру
    saveTrackStructure();
    
    // Если это текущий блок и вызов не из UI, обновляем текущую тональность в UI
    if (index === currentBlockIndex && !fromUI) {
        // Меняем тональность в UI, но избегаем циклического вызова
        if (window.UI && window.UI.setInternalTonalityChange) {
            window.UI.setInternalTonalityChange(true);
            window.UI.changeTonality(newTonality);
        }
    }
    
    // Обновляем интерфейс структуры
    updateTrackStructureUI();
    
    console.log('Изменена тональность блока:', index, oldTonality, '->', newTonality);
}

/**
 * Сохранение последовательности аккордов в текущий блок
 */
function saveCurrentSequenceToBlock() {
    // Получаем текущую последовательность аккордов
    const currentSequence = window.Sequencer.getSequence();
    
    // Проверяем наличие активного блока
    if (currentBlockIndex < 0 || currentBlockIndex >= trackStructure.length) {
        console.error('Ошибка: нет активного блока для сохранения последовательности');
        return;
    }
    
    // Сохраняем последовательность в текущий блок
    trackStructure[currentBlockIndex].chords = [...currentSequence];
    
    // Сохраняем обновленную структуру
    saveTrackStructure();
    
    // Обновляем интерфейс
    updateTrackStructureUI();
    
    console.log('Последовательность сохранена в блок:', currentBlockIndex, currentSequence);
}

/**
 * Загрузка последовательности аккордов из блока
 * @param {number} index - Индекс блока для загрузки
 */
function loadBlockChords(index) {
    // Проверяем существование блока
    if (index < 0 || index >= trackStructure.length) {
        console.error('Ошибка: блок с индексом', index, 'не существует');
        return;
    }
    
    // Устанавливаем выбранный блок как текущий
    currentBlockIndex = index;
    
    // Получаем блок
    const block = trackStructure[index];
    
    // Меняем тональность в UI, если она отличается от текущей
    if (block.tonality !== window.UI.getCurrentTonality()) {
        // Используем новый механизм избегания циклических вызовов
        if (window.UI && window.UI.setInternalTonalityChange) {
            window.UI.setInternalTonalityChange(true);
            window.UI.changeTonality(block.tonality);
        }
    }
    
    // Загружаем последовательность аккордов в секвенсор
    window.Sequencer.setSequence(block.chords);
    
    // Обновляем интерфейс
    updateTrackStructureUI();
    
    // Показываем уведомление пользователю
    if (window.UI && window.UI.showNotification) {
        window.UI.showNotification(`Загружен блок ${block.name}`, 'info');
    }
    
    console.log('Загружена последовательность из блока:', index, block.chords);
}

/**
 * Очистка текущего блока (удаление всех аккордов)
 */
function clearCurrentBlock() {
    // Проверяем наличие активного блока
    if (currentBlockIndex < 0 || currentBlockIndex >= trackStructure.length) {
        console.error('Ошибка: нет активного блока для очистки');
        return;
    }
    
    // Очищаем аккорды в текущем блоке
    trackStructure[currentBlockIndex].chords = [];
    
    // Сохраняем обновленную структуру
    saveTrackStructure();
    
    // Очищаем секвенсор
    window.Sequencer.clearSequence();
    
    // Обновляем интерфейс
    updateTrackStructureUI();
    
    console.log('Очищен текущий блок:', currentBlockIndex);
}

/**
 * Воспроизведение всей структуры трека
 */
function playFullTrack() {
    // Проверяем, что есть блоки для воспроизведения
    if (trackStructure.length === 0) {
        console.error('Ошибка: нет блоков для воспроизведения');
        return;
    }
    
    // Собираем все аккорды из всех блоков
    const allChords = [];
    for (const block of trackStructure) {
        // Добавляем разделитель блоков (можно реализовать как паузу или специальный маркер)
        if (allChords.length > 0) {
            allChords.push('BLOCK_DIVIDER'); // Специальный маркер для разделения блоков
        }
        
        // Добавляем аккорды текущего блока
        allChords.push(...block.chords);
    }
    
    // Проверяем, что есть аккорды для воспроизведения
    if (allChords.length === 0) {
        console.error('Ошибка: нет аккордов для воспроизведения');
        return;
    }
    
    // Воспроизводим полную последовательность
    window.Sequencer.playCustomSequence(allChords);
    
    console.log('Воспроизведение полной структуры трека:', allChords);
}

/**
 * Обновление интерфейса структуры трека
 */
function updateTrackStructureUI() {
    // Находим контейнер для отображения структуры
    const structureContainer = document.getElementById('track-structure-container');
    if (!structureContainer) {
        console.error('Ошибка: не найден контейнер для отображения структуры трека');
        return;
    }
    
    // Очищаем контейнер
    structureContainer.innerHTML = '';
    
    // Заголовок секции
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = 'Структура трека';
    structureContainer.appendChild(sectionTitle);
    
    // Панель инструментов структуры
    const toolbarDiv = document.createElement('div');
    toolbarDiv.className = 'structure-toolbar';
    
    // Кнопка добавления нового блока
    const addButton = document.createElement('button');
    addButton.textContent = '+ Новый блок';
    addButton.className = 'add-block-button';
    addButton.addEventListener('click', () => addNewBlock());
    toolbarDiv.appendChild(addButton);
    
    // Кнопка воспроизведения всей структуры
    const playAllButton = document.createElement('button');
    playAllButton.textContent = '▶ Воспроизвести весь трек';
    playAllButton.className = 'play-all-button';
    playAllButton.addEventListener('click', playFullTrack);
    // Если нет блоков или все блоки пустые, деактивируем кнопку
    const hasChords = trackStructure.some(block => block.chords.length > 0);
    playAllButton.disabled = !hasChords;
    toolbarDiv.appendChild(playAllButton);
    
    structureContainer.appendChild(toolbarDiv);
    
    // Контейнер для блоков
    const blocksContainer = document.createElement('div');
    blocksContainer.className = 'blocks-container';
    
    // Добавляем блоки
    trackStructure.forEach((block, index) => {
        const blockElement = createBlockElement(block, index);
        blocksContainer.appendChild(blockElement);
    });
    
    structureContainer.appendChild(blocksContainer);
}

/**
 * Создание элемента блока для отображения в UI
 * @param {Object} block - Объект блока
 * @param {number} index - Индекс блока
 * @returns {HTMLElement} Элемент блока
 */
function createBlockElement(block, index) {
    // Создаем контейнер блока
    const blockElement = document.createElement('div');
    blockElement.className = 'track-block';
    blockElement.setAttribute('data-index', index);
    
    // Если это текущий активный блок, добавляем класс
    if (index === currentBlockIndex) {
        blockElement.classList.add('active-block');
    }
    
    // Заголовок блока с именем и тональностью
    const blockHeader = document.createElement('div');
    blockHeader.className = 'block-header';
    
    // Имя блока (с возможностью редактирования)
    const blockName = document.createElement('span');
    blockName.className = 'block-name';
    blockName.textContent = block.name;
    blockName.title = 'Нажмите для редактирования';
    blockName.addEventListener('click', () => {
        // Диалог для редактирования имени
        const newName = prompt('Введите новое имя блока (формат: буква+цифра, например A1, B2):', block.name);
        if (newName && newName !== block.name) {
            renameBlock(index, newName);
        }
    });
    blockHeader.appendChild(blockName);
    
    // Тональность блока
    const blockTonality = document.createElement('span');
    blockTonality.className = 'block-tonality';
    blockTonality.textContent = block.tonality;
    blockTonality.title = 'Нажмите для изменения тональности';
    blockTonality.addEventListener('click', () => {
        // Здесь можно реализовать диалог выбора тональности
        // Пока используем простой prompt
        const newTonality = prompt('Выберите тональность (C, G, D, A, E, F, Bb, Eb, Am, Em, Dm):', block.tonality);
        if (newTonality && window.TONALITY_DATA[newTonality]) {
            changeBlockTonality(index, newTonality);
        }
    });
    blockHeader.appendChild(blockTonality);
    
    blockElement.appendChild(blockHeader);
    
    // Визуализация аккордов блока
    const chordsPreview = document.createElement('div');
    chordsPreview.className = 'block-chords-preview';
    
    if (block.chords.length > 0) {
        // Отображаем краткое превью аккордов
        const maxPreviewChords = 8; // Максимальное количество аккордов для превью
        const displayChords = block.chords.slice(0, maxPreviewChords);
        
        displayChords.forEach((chord, chordIndex) => {
            const chordBadge = document.createElement('span');
            chordBadge.className = 'chord-badge';
            chordBadge.textContent = chord;
            chordsPreview.appendChild(chordBadge);
            
            // Добавляем разделитель между аккордами
            if (chordIndex < displayChords.length - 1) {
                const separator = document.createElement('span');
                separator.className = 'chord-separator';
                separator.textContent = '→';
                chordsPreview.appendChild(separator);
            }
        });
        
        // Если в блоке больше аккордов, чем мы показываем, добавляем многоточие
        if (block.chords.length > maxPreviewChords) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'chord-ellipsis';
            ellipsis.textContent = '...';
            chordsPreview.appendChild(ellipsis);
        }
    } else {
        // Если блок пуст, показываем сообщение
        const emptyMessage = document.createElement('span');
        emptyMessage.className = 'empty-block-message';
        emptyMessage.textContent = 'Нет аккордов';
        chordsPreview.appendChild(emptyMessage);
    }
    
    blockElement.appendChild(chordsPreview);
    
    // Панель кнопок блока
    const buttonPanel = document.createElement('div');
    buttonPanel.className = 'block-buttons';
    
    // Кнопка загрузки блока
    const loadButton = document.createElement('button');
    loadButton.className = 'block-load-button';
    loadButton.textContent = 'Загрузить';
    loadButton.addEventListener('click', () => loadBlockChords(index));
    buttonPanel.appendChild(loadButton);
    
    // Кнопка воспроизведения блока
    const playButton = document.createElement('button');
    playButton.className = 'block-play-button';
    playButton.textContent = '▶';
    playButton.disabled = block.chords.length === 0;
    playButton.addEventListener('click', () => {
        // Воспроизводим аккорды этого блока
        window.Sequencer.playCustomSequence(block.chords);
    });
    buttonPanel.appendChild(playButton);
    
    // Кнопка удаления блока
    const deleteButton = document.createElement('button');
    deleteButton.className = 'block-delete-button';
    deleteButton.textContent = '×';
    // Если это последний блок, деактивируем кнопку удаления
    deleteButton.disabled = trackStructure.length <= 1;
    deleteButton.addEventListener('click', () => {
        if (confirm(`Вы уверены, что хотите удалить блок "${block.name}"?`)) {
            removeBlock(index);
        }
    });
    buttonPanel.appendChild(deleteButton);
    
    blockElement.appendChild(buttonPanel);
    
    // Добавляем обработчик клика для выбора блока
    blockElement.addEventListener('click', (e) => {
        // Проверяем, что клик не был по кнопке или редактируемому элементу
        if (!e.target.closest('button') && 
            !e.target.closest('.block-name') && 
            !e.target.closest('.block-tonality')) {
            loadBlockChords(index);
        }
    });
    
    return blockElement;
}

/**
 * Настройка обработчиков событий для элементов интерфейса структуры
 */
function setupTrackStructureEventListeners() {
    // Находим кнопку сохранения последовательности в блок
    const saveSequenceButton = document.getElementById('save-sequence-to-block');
    if (saveSequenceButton) {
        saveSequenceButton.addEventListener('click', saveCurrentSequenceToBlock);
    }
    
    // Находим кнопку очистки текущего блока
    const clearBlockButton = document.getElementById('clear-current-block');
    if (clearBlockButton) {
        clearBlockButton.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите очистить текущий блок?')) {
                clearCurrentBlock();
            }
        });
    }
    
    // Добавляем автоматическое сохранение при изменении последовательности
    document.addEventListener('sequenceChanged', saveCurrentSequenceToBlock);
}

// Экспорт функций и переменных
window.TrackStructure = {
    initializeTrackStructure: initializeTrackStructure,
    addNewBlock: addNewBlock,
    loadBlockChords: loadBlockChords,
    clearCurrentBlock: clearCurrentBlock,
    changeBlockTonality: changeBlockTonality,
    playFullTrack: playFullTrack,
    getCurrentBlockIndex: function() { return currentBlockIndex; },
    getTrackStructure: function() { return trackStructure; }
};