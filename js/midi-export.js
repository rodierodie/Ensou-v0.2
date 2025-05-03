/**
 * midi-export.js
 * Модуль для экспорта аккордов и последовательностей в формат MIDI
 */

// Глобальный объект для функций экспорта
window.MidiExport = {};

// Флаг, указывающий, загружена ли библиотека MidiWriter
let midiWriterLoaded = false;

/**
 * Инициализация модуля экспорта MIDI
 */
function initializeMidiExport() {
    // Проверяем наличие библиотеки MidiWriter
    midiWriterLoaded = typeof MidiWriter !== 'undefined';
    
    if (!midiWriterLoaded) {
        console.warn('MidiWriter не загружен. Пробуем загрузить динамически...');
        
        // Попробуем загрузить библиотеку динамически
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/midi-writer-js@3.1.1/browser/midiwriter.min.js';
        script.onload = function() {
            console.log('MidiWriter загружен динамически');
            midiWriterLoaded = true;
            addExportButtons();
        };
        script.onerror = function() {
            console.error('Не удалось загрузить MidiWriter динамически');
        };
        document.head.appendChild(script);
    } else {
        // Библиотека уже загружена, добавляем кнопки
        addExportButtons();
    }
}

/**
 * Добавление кнопок экспорта MIDI в интерфейс
 */
function addExportButtons() {
    // Добавляем кнопку экспорта MIDI в секвенсор
    addMidiExportButton();
    
    // Добавляем кнопку экспорта полной структуры трека в MIDI
    addTrackExportMidiButton();
}

/**
 * Добавление кнопки экспорта MIDI в интерфейс секвенсора
 */
function addMidiExportButton() {
    // Находим элемент с кнопками управления секвенсором
    const sequencerControlsElements = document.querySelectorAll('.sequencer-controls');
    if (sequencerControlsElements.length === 0) {
        console.error('Ошибка: не найдены элементы управления секвенсором');
        return;
    }
    
    // Берем последний элемент (третью группу кнопок)
    const lastControlsGroup = sequencerControlsElements[sequencerControlsElements.length - 1];
    
    // Проверяем, не добавлена ли уже кнопка
    if (document.getElementById('export-midi')) {
        return;
    }
    
    // Создаем кнопку экспорта MIDI
    const exportMidiButton = document.createElement('button');
    exportMidiButton.id = 'export-midi';
    exportMidiButton.className = 'secondary-button';
    exportMidiButton.textContent = 'Экспорт MIDI';
    exportMidiButton.title = 'Экспорт текущей последовательности в MIDI-файл';
    
    // Добавляем обработчик нажатия
    exportMidiButton.addEventListener('click', exportCurrentSequenceToMidi);
    
    // Добавляем кнопку в интерфейс
    lastControlsGroup.appendChild(exportMidiButton);
}

/**
 * Экспорт текущей последовательности аккордов в MIDI-файл
 */
function exportCurrentSequenceToMidi() {
    // Проверяем наличие библиотеки MidiWriter
    if (!midiWriterLoaded) {
        console.error('Ошибка: библиотека MidiWriter не загружена');
        // Показываем уведомление для пользователя
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification('Не удалось загрузить библиотеку MIDI', 'error');
        }
        return;
    }
    
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
    
    // Получаем темп из секвенсора
    const tempo = window.Sequencer.getTempo();
    
    try {
        // Создаем MIDI-файл
        const midiData = createMidiFile(sequence, tempo);
        
        // Скачиваем файл
        downloadMidiFile(midiData);
        
        // Показываем уведомление об успешном экспорте
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification('MIDI файл создан успешно', 'success');
        }
    } catch (error) {
        console.error('Ошибка при экспорте в MIDI:', error);
        
        // Показываем уведомление об ошибке
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification('Ошибка при создании MIDI файла', 'error');
        }
    }
}

/**
 * Создание MIDI-файла из последовательности аккордов
 * @param {Array} sequence - Массив аккордов
 * @param {number} tempo - Темп в BPM
 * @returns {Uint8Array} - Двоичные данные MIDI-файла
 */
function createMidiFile(sequence, tempo) {
    // Создаем дорожку
    const track = new MidiWriter.Track();
    
    // Добавляем информацию о темпе
    track.setTempo(tempo);
    
    // Проверяем, включен ли арпеджиатор
    const useArpeggio = window.Arpeggiator && window.Arpeggiator.getSettings && window.Arpeggiator.getSettings().enabled;
    
    // Получаем настройки арпеджиатора, если он включен
    let arpSettings = null;
    if (useArpeggio && window.Arpeggiator.getSettings) {
        arpSettings = window.Arpeggiator.getSettings();
    }
    
    // Обрабатываем последовательность аккордов
    sequence.forEach((chordName) => {
        // Если это пауза, добавляем паузу
        if (chordName === 'PAUSE') {
            // Добавляем паузу (Rest) на 2 доли (half note)
            track.addEvent(new MidiWriter.NoteEvent({
                wait: '0',
                duration: '2',
                sequential: true,
                rest: true
            }));
            return;
        }
        
        // Если это разделитель блоков, добавляем короткую паузу
        if (chordName === 'BLOCK_DIVIDER') {
            track.addEvent(new MidiWriter.NoteEvent({
                wait: '0',
                duration: '4',
                sequential: true,
                rest: true
            }));
            return;
        }
        
        // Получаем данные аккорда
        const chord = window.CHORD_DATA[chordName];
        if (!chord) {
            console.warn('Аккорд не найден в базе данных:', chordName);
            return;
        }
        
        // Если арпеджиатор включен, создаем арпеджио
        if (useArpeggio && arpSettings) {
            // Получаем ноты для арпеджио
            const baseNotes = chord.notes;
            const arpNotes = generateArpeggioNotesForMidi(baseNotes, arpSettings.pattern, arpSettings.octaveRange);
            
            // Определяем длительность ноты арпеджио
            let noteDuration = '8';  // По умолчанию восьмые
            if (arpSettings.noteLength === '16n') noteDuration = '16';
            if (arpSettings.noteLength === '32n') noteDuration = '32';
            
            // Добавляем ноты арпеджио
            arpNotes.forEach((note, index) => {
                // Если включен акцент на первой ноте и это первая нота
                const velocity = (arpSettings.accentFirst && index === 0) ? 100 : 80;
                
                const noteEvent = new MidiWriter.NoteEvent({
                    pitch: note,
                    duration: noteDuration,
                    velocity: velocity
                });
                
                track.addEvent(noteEvent);
            });
        } else {
            // Обычный аккорд без арпеджио
            // Получаем ноты аккорда и преобразуем их в формат для MidiWriter
            const midiNotes = convertNotesToMidi(chord.notes);
            
            // Создаем событие ноты (аккорд)
            const noteEvent = new MidiWriter.NoteEvent({
                pitch: midiNotes,
                duration: '2', // Half note (половинная нота)
                velocity: 80   // Громкость (от 1 до 100)
            });
            
            // Добавляем событие в дорожку
            track.addEvent(noteEvent);
        }
    });
    
    // Создаем запись (writer)
    const writer = new MidiWriter.Writer(track);
    
    // Получаем двоичные данные
    return writer.buildFile();
}

/**
 * Генерация нот для арпеджио в MIDI-формате
 * @param {Array} baseNotes - Базовые ноты аккорда
 * @param {string} pattern - Паттерн арпеджио (up, down, updown, random)
 * @param {number} octaveRange - Диапазон октав
 * @returns {Array} Массив нот для арпеджио в формате для MidiWriter
 */
function generateArpeggioNotesForMidi(baseNotes, pattern, octaveRange) {
    // Преобразуем ноты, удаляя номер октавы для обработки
    const notes = baseNotes.map(note => {
        return {
            noteName: note.replace(/[0-9]/g, ''), // Название ноты без октавы
            octave: parseInt(note.match(/[0-9]/)[0]) // Номер октавы
        };
    });
    
    // Применяем смещение октавы
    const arpSettings = window.Arpeggiator.getSettings();
    const octaveOffset = arpSettings.octaveOffset || 0;
    
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

/**
 * Преобразование нот в формат для MidiWriter
 * @param {Array} notes - Массив нот в формате 'C4', 'E4', 'G4'
 * @returns {Array} - Массив нот в формате для MidiWriter
 */
function convertNotesToMidi(notes) {
    return notes.map(note => {
        // Разбиваем ноту на букву и октаву
        const noteName = note.replace(/[0-9]/g, '');
        const octave = parseInt(note.match(/[0-9]/)[0]);
        
        // Возвращаем ноту в формате для MidiWriter
        return noteName + octave;
    });
}

/**
 * Скачивание MIDI-файла
 * @param {Uint8Array} midiData - Двоичные данные MIDI-файла
 */
function downloadMidiFile(midiData) {
    // Получаем текущую тональность для именования файла
    const tonality = window.UI.getCurrentTonality();
    
    // Создаем имя файла с текущей датой
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `chord_sequence_${tonality}_${dateStr}.mid`;
    
    // Создаем Blob из двоичных данных
    const blob = new Blob([midiData], { type: 'audio/midi' });
    
    // Создаем URL для Blob
    const url = window.URL.createObjectURL(blob);
    
    // Создаем ссылку для скачивания
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    
    // Скачиваем файл
    document.body.appendChild(a);
    a.click();
    
    // Удаляем ссылку
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Экспорт полной структуры трека в MIDI-файл
 */
function exportFullTrackToMidi() {
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
    
    // Собираем все аккорды из всех блоков
    const allChords = [];
    for (const block of trackStructure) {
        // Добавляем разделитель блоков (если это не первый блок)
        if (allChords.length > 0) {
            allChords.push('BLOCK_DIVIDER');
        }
        
        // Добавляем аккорды текущего блока
        if (block.chords && block.chords.length > 0) {
            allChords.push(...block.chords);
        }
    }
    
    // Проверяем, есть ли аккорды для экспорта
    if (allChords.length === 0) {
        console.error('Ошибка: нет аккордов для экспорта');
        // Показываем уведомление для пользователя
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification('Нет аккордов для экспорта', 'warning');
        }
        return;
    }
    
    // Получаем темп из секвенсора
    const tempo = window.Sequencer.getTempo();
    
    try {
        // Создаем MIDI-файл
        const midiData = createMidiFile(allChords, tempo);
        
        // Скачиваем файл
        downloadMidiFile(midiData);
        
        // Показываем уведомление об успешном экспорте
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification('MIDI файл создан успешно', 'success');
        }
    } catch (error) {
        console.error('Ошибка при экспорте в MIDI:', error);
        
        // Показываем уведомление об ошибке
        if (window.UI && window.UI.showNotification) {
            window.UI.showNotification('Ошибка при создании MIDI файла', 'error');
        }
    }
}

/**
 * Добавление кнопки экспорта полной структуры трека в MIDI
 */
function addTrackExportMidiButton() {
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
    if (document.getElementById('export-track-midi')) {
        return;
    }
    
    // Создаем кнопку экспорта MIDI
    const exportTrackMidiButton = document.createElement('button');
    exportTrackMidiButton.id = 'export-track-midi';
    exportTrackMidiButton.className = 'secondary-button';
    exportTrackMidiButton.textContent = 'Экспорт трека в MIDI';
    exportTrackMidiButton.title = 'Экспорт всей структуры трека в MIDI-файл';
    
    // Добавляем обработчик нажатия
    exportTrackMidiButton.addEventListener('click', exportFullTrackToMidi);
    
    // Добавляем кнопку в интерфейс
    toolbarDiv.appendChild(exportTrackMidiButton);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Слушаем загрузку модуля структуры трека
    document.addEventListener('trackStructureInitialized', function() {
        // Если MidiWriter уже загружен, добавляем кнопку экспорта трека
        if (midiWriterLoaded) {
            addTrackExportMidiButton();
        }
    });
    
    // Выдерживаем паузу для загрузки основных модулей
    setTimeout(initializeMidiExport, 1000);
});

// Экспорт функций и переменных
window.MidiExport = {
    exportCurrentSequenceToMidi: exportCurrentSequenceToMidi,
    exportFullTrackToMidi: exportFullTrackToMidi
};