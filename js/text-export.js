/**
 * text-export.js
 * Модуль для экспорта аккордов и последовательностей в текстовый формат
 */

// Глобальный объект для функций экспорта текста
window.TextExport = {};

/**
 * Инициализация модуля экспорта текста
 */
function initializeTextExport() {
    // Добавляем кнопку экспорта текста в интерфейс секвенсора
    addTextExportButton();
}

/**
 * Добавление кнопки экспорта текста в интерфейс
 */
function addTextExportButton() {
    // Находим элемент с кнопками управления секвенсором
    const sequencerControlsElements = document.querySelectorAll('.sequencer-controls');
    if (sequencerControlsElements.length === 0) {
        console.error('Ошибка: не найдены элементы управления секвенсором');
        return;
    }
    
    // Берем последний элемент (третью группу кнопок)
    const lastControlsGroup = sequencerControlsElements[sequencerControlsElements.length - 1];
    
    // Проверяем, не добавлена ли уже кнопка
    if (document.getElementById('export-text')) {
        return;
    }
    
    // Создаем кнопку экспорта текста
    const exportTextButton = document.createElement('button');
    exportTextButton.id = 'export-text';
    exportTextButton.className = 'secondary-button';
    exportTextButton.textContent = 'Экспорт в текст';
    exportTextButton.title = 'Экспорт текущей последовательности в текстовый формат';
    
    // Добавляем обработчик нажатия
    exportTextButton.addEventListener('click', exportCurrentSequenceToText);
    
    // Добавляем кнопку в интерфейс
    lastControlsGroup.appendChild(exportTextButton);
}

/**
 * Экспорт текущей последовательности аккордов в текстовый формат
 */
function exportCurrentSequenceToText() {
    // Получаем текущую последовательность аккордов из секвенсора
    const sequence = window.Sequencer.getSequence();
    
    // Проверяем, есть ли аккорды для экспорта
    if (!sequence || sequence.length === 0) {
        console.error('Ошибка: нет аккордов для экспорта');
        // Показываем уведомление для пользователя
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification('Нет аккордов для экспорта', 'warning');
        }
        return;
    }
    
    // Получаем текущую тональность
    const tonality = window.UI.getCurrentTonality();
    
    // Генерируем текстовое представление
    const textData = createTextRepresentation(sequence, tonality);
    
    // Показываем диалог для копирования текста
    showTextExportDialog(textData);
}

/**
 * Создание текстового представления последовательности аккордов
 * @param {Array} sequence - Массив аккордов
 * @param {string} tonality - Текущая тональность
 * @returns {string} - Текстовое представление
 */
function createTextRepresentation(sequence, tonality) {
    // Получаем информацию о тональности
    const tonalityInfo = window.TONALITY_DATA[tonality];
    const tonalityName = tonalityInfo ? tonalityInfo.name : tonality;
    
    // Формируем заголовок
    let text = `Аккордовая последовательность в тональности ${tonalityName}\n`;
    text += '─'.repeat(40) + '\n\n';
    
    // Добавляем аккорды (по 8 аккордов в строке)
    const chordsPerLine = 8;
    for (let i = 0; i < sequence.length; i += chordsPerLine) {
        const line = sequence.slice(i, i + chordsPerLine);
        text += line.map(chord => chord === 'PAUSE' ? '◊' : chord).join(' - ');
        text += '\n';
    }
    
    // Добавляем информацию о функциях аккордов
    text += '\n' + '─'.repeat(40) + '\n';
    text += 'Функциональное значение аккордов:\n\n';
    
    sequence.forEach((chordName) => {
        if (chordName === 'PAUSE') return; // Пропускаем паузы
        
        const chord = window.CHORD_DATA[chordName];
        if (!chord) return;
        
        // Получаем функцию аккорда в текущей тональности
        const func = chord.functions[tonality];
        if (func) {
            text += `${chordName}: ${func.function} (ступень ${func.degree})\n`;
        }
    });
    
    // Добавляем информацию о приложении
    text += '\n' + '─'.repeat(40) + '\n';
    text += 'Создано в приложении "Изучение музыкальной гармонии"\n';
    
    return text;
}

/**
 * Показать диалог для копирования текста
 * @param {string} text - Текст для отображения
 */
function showTextExportDialog(text) {
    // Создаем затемняющий фон
    const overlay = document.createElement('div');
    overlay.className = 'text-export-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    // Создаем контейнер диалога
    const dialog = document.createElement('div');
    dialog.className = 'text-export-dialog';
    dialog.style.backgroundColor = 'white';
    dialog.style.borderRadius = '8px';
    dialog.style.padding = '20px';
    dialog.style.maxWidth = '600px';
    dialog.style.width = '90%';
    dialog.style.maxHeight = '80vh';
    dialog.style.overflow = 'auto';
    dialog.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
    
    // Заголовок диалога
    const title = document.createElement('h3');
    title.textContent = 'Экспорт последовательности в текст';
    title.style.marginTop = '0';
    title.style.marginBottom = '15px';
    
    // Текстовое поле
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.width = '100%';
    textarea.style.minHeight = '200px';
    textarea.style.padding = '10px';
    textarea.style.border = '1px solid #ddd';
    textarea.style.borderRadius = '4px';
    textarea.style.marginBottom = '15px';
    textarea.style.fontFamily = 'monospace';
    textarea.style.fontSize = '14px';
    
    // Кнопки
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    
    // Кнопка копирования
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Скопировать';
    copyButton.className = 'primary-button';
    copyButton.addEventListener('click', async function() {
        try {
            // Используем современный Clipboard API вместо устаревшего document.execCommand
            await navigator.clipboard.writeText(textarea.value);
            
            // Показываем уведомление
            if (window.UI && window.UI.showNotification) {
                window.UI.showNotification('Текст скопирован в буфер обмена', 'success');
            }
        } catch (err) {
            console.error('Не удалось скопировать текст:', err);
            
            // Запасной вариант - используем старый метод
            textarea.select();
            document.execCommand('copy');
            
            if (window.UI && window.UI.showNotification) {
                window.UI.showNotification('Текст скопирован в буфер обмена', 'success');
            }
        }
    });
    
    // Кнопка закрытия
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Закрыть';
    closeButton.className = 'secondary-button';
    closeButton.addEventListener('click', function() {
        document.body.removeChild(overlay);
    });
    
    // Добавляем элементы в диалог
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);
    
    dialog.appendChild(title);
    dialog.appendChild(textarea);
    dialog.appendChild(buttonContainer);
    
    overlay.appendChild(dialog);
    
    // Добавляем диалог на страницу
    document.body.appendChild(overlay);
    
    // Выделяем текст для удобства копирования
    textarea.select();
}

/**
 * Экспорт полной структуры трека в текстовый формат
 */
function exportFullTrackToText() {
    // Проверяем наличие модуля структуры трека
    if (!window.TrackStructure || !window.TrackStructure.getTrackStructure) {
        console.error('Ошибка: модуль структуры трека не доступен');
        return;
    }
    
    // Получаем структуру трека
    const trackStructure = window.TrackStructure.getTrackStructure();
    
    // Проверяем, есть ли блоки для экспорта
    if (!trackStructure || trackStructure.length === 0) {
        console.error('Ошибка: нет блоков для экспорта');
        return;
    }
    
    // Генерируем полное текстовое представление трека
    let fullText = 'СТРУКТУРА ТРЕКА\n';
    fullText += '═'.repeat(50) + '\n\n';
    
    // Проходим по всем блокам
    trackStructure.forEach((block) => {
        // Заголовок блока
        fullText += `БЛОК ${block.name} (${block.tonality})\n`;
        fullText += '─'.repeat(30) + '\n';
        
        // Если блок пустой
        if (!block.chords || block.chords.length === 0) {
            fullText += 'Нет аккордов\n\n';
            return;
        }
        
        // Добавляем аккорды (по 8 аккордов в строке)
        const chordsPerLine = 8;
        for (let i = 0; i < block.chords.length; i += chordsPerLine) {
            const line = block.chords.slice(i, i + chordsPerLine);
            fullText += line.map(chord => chord === 'PAUSE' ? '◊' : chord).join(' - ');
            fullText += '\n';
        }
        
        // Добавляем разделитель между блоками
        fullText += '\n';
    });
    
    // Добавляем информацию о приложении
    fullText += '═'.repeat(50) + '\n';
    fullText += 'Создано в приложении "Изучение музыкальной гармонии"\n';
    
    // Показываем диалог для копирования текста
    showTextExportDialog(fullText);
}

/**
 * Добавление кнопки экспорта полной структуры трека в текст
 */
function addTrackExportTextButton() {
    // Находим контейнер структуры трека
    const structureContainer = document.getElementById('track-structure-container');
    if (!structureContainer) {
        return;
    }
    
    // Находим панель инструментов структуры
    const toolbarDiv = structureContainer.querySelector('.structure-toolbar');
    if (!toolbarDiv) {
        return;
    }
    
    // Проверяем, не добавлена ли уже кнопка
    if (document.getElementById('export-track-text')) {
        return;
    }
    
    // Создаем кнопку экспорта текста
    const exportTrackTextButton = document.createElement('button');
    exportTrackTextButton.id = 'export-track-text';
    exportTrackTextButton.className = 'secondary-button';
    exportTrackTextButton.textContent = 'Экспорт трека в текст';
    exportTrackTextButton.title = 'Экспорт всей структуры трека в текстовый формат';
    
    // Добавляем обработчик нажатия
    exportTrackTextButton.addEventListener('click', exportFullTrackToText);
    
    // Добавляем кнопку в интерфейс
    toolbarDiv.appendChild(exportTrackTextButton);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Слушаем загрузку модуля структуры трека
    document.addEventListener('trackStructureInitialized', function() {
        addTrackExportTextButton();
    });
    
    // Выдерживаем паузу для загрузки основных модулей
    setTimeout(initializeTextExport, 1000);
});

// Экспорт функций и переменных
window.TextExport = {
    exportCurrentSequenceToText: exportCurrentSequenceToText,
    exportFullTrackToText: exportFullTrackToText
};