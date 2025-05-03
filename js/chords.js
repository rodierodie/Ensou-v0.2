/**
 * chords.js
 * База данных аккордов с нотами и функциями
 */

// База данных аккордов с нотами
const CHORD_DATA = {
    // До мажор (C)
    'C': {
        fullName: 'До мажор',
        notes: ['C4', 'E4', 'G4'],
        description: 'Мажорное трезвучие',
        functions: {
            'C': { function: 'tonic', degree: 'I', label: 'T' },
            'F': { function: 'dominant', degree: 'V', label: 'D' },
            'G': { function: 'subdominant', degree: 'IV', label: 'S' }
        }
    },
    'Dm': {
        fullName: 'Ре минор',
        notes: ['D4', 'F4', 'A4'],
        description: 'Минорное трезвучие',
        functions: {
            'C': { function: 'subdominant', degree: 'ii', label: 'S' },
            'Dm': { function: 'tonic', degree: 'i', label: 'T' }
        }
    },
    'Em': {
        fullName: 'Ми минор',
        notes: ['E4', 'G4', 'B4'],
        description: 'Минорное трезвучие',
        functions: {
            'C': { function: 'tonic', degree: 'iii', label: 'T' },
            'Em': { function: 'tonic', degree: 'i', label: 'T' }
        }
    },
    'F': {
        fullName: 'Фа мажор',
        notes: ['F4', 'A4', 'C5'],
        description: 'Мажорное трезвучие',
        functions: {
            'C': { function: 'subdominant', degree: 'IV', label: 'S' },
            'F': { function: 'tonic', degree: 'I', label: 'T' }
        }
    },
    'G': {
        fullName: 'Соль мажор',
        notes: ['G4', 'B4', 'D5'],
        description: 'Мажорное трезвучие',
        functions: {
            'C': { function: 'dominant', degree: 'V', label: 'D' },
            'G': { function: 'tonic', degree: 'I', label: 'T' }
        }
    },
    'Am': {
        fullName: 'Ля минор',
        notes: ['A4', 'C5', 'E5'],
        description: 'Минорное трезвучие',
        functions: {
            'C': { function: 'tonic', degree: 'vi', label: 'T' },
            'Am': { function: 'tonic', degree: 'i', label: 'T' },
            'F': { function: 'subdominant', degree: 'iii', label: 'S' }
        }
    },
    'Bdim': {
        fullName: 'Си уменьшенный',
        notes: ['B4', 'D5', 'F5'],
        description: 'Уменьшенное трезвучие',
        functions: {
            'C': { function: 'dominant', degree: 'vii°', label: 'D' }
        }
    },
    'C7': {
        fullName: 'До доминантсептаккорд',
        notes: ['C4', 'E4', 'G4', 'Bb4'],
        description: 'Доминантсептаккорд',
        functions: {
            'F': { function: 'dominant', degree: 'V7', label: 'D7' }
        }
    },
    'Dm7': {
        fullName: 'Ре минорный септаккорд',
        notes: ['D4', 'F4', 'A4', 'C5'],
        description: 'Минорный септаккорд',
        functions: {
            'C': { function: 'subdominant', degree: 'ii7', label: 'S7' }
        }
    },
    'Em7': {
        fullName: 'Ми минорный септаккорд',
        notes: ['E4', 'G4', 'B4', 'D5'],
        description: 'Минорный септаккорд',
        functions: {
            'C': { function: 'tonic', degree: 'iii7', label: 'T7' }
        }
    },
    'Fmaj7': {
        fullName: 'Фа мажорный септаккорд',
        notes: ['F4', 'A4', 'C5', 'E5'],
        description: 'Большой мажорный септаккорд',
        functions: {
            'C': { function: 'subdominant', degree: 'IVmaj7', label: 'S7' }
        }
    },
    'G7': {
        fullName: 'Соль доминантсептаккорд',
        notes: ['G4', 'B4', 'D5', 'F5'],
        description: 'Доминантсептаккорд',
        functions: {
            'C': { function: 'dominant', degree: 'V7', label: 'D7' }
        }
    },
    'Am7': {
        fullName: 'Ля минорный септаккорд',
        notes: ['A4', 'C5', 'E5', 'G5'],
        description: 'Минорный септаккорд',
        functions: {
            'C': { function: 'tonic', degree: 'vi7', label: 'T7' }
        }
    },
    'Bm7b5': {
        fullName: 'Си полууменьшенный септаккорд',
        notes: ['B4', 'D5', 'F5', 'A5'],
        description: 'Полууменьшенный септаккорд',
        functions: {
            'C': { function: 'dominant', degree: 'viiø7', label: 'D7' }
        }
    },
    
    // Соль мажор (G)
    'Bm': {
        fullName: 'Си минор',
        notes: ['B4', 'D5', 'F#5'],
        description: 'Минорное трезвучие',
        functions: {
            'G': { function: 'subdominant', degree: 'iii', label: 'S' }
        }
    },
    'D': {
        fullName: 'Ре мажор',
        notes: ['D4', 'F#4', 'A4'],
        description: 'Мажорное трезвучие',
        functions: {
            'G': { function: 'dominant', degree: 'V', label: 'D' },
            'D': { function: 'tonic', degree: 'I', label: 'T' }
        }
    },
    'F#dim': {
        fullName: 'Фа-диез уменьшенный',
        notes: ['F#4', 'A4', 'C5'],
        description: 'Уменьшенное трезвучие',
        functions: {
            'G': { function: 'dominant', degree: 'vii°', label: 'D' }
        }
    },
    
    // Ре мажор (D)
    'A': {
        fullName: 'Ля мажор',
        notes: ['A4', 'C#5', 'E5'],
        description: 'Мажорное трезвучие',
        functions: {
            'D': { function: 'dominant', degree: 'V', label: 'D' },
            'A': { function: 'tonic', degree: 'I', label: 'T' }
        }
    },
    'D7': {
        fullName: 'Ре доминантсептаккорд',
        notes: ['D4', 'F#4', 'A4', 'C5'],
        description: 'Доминантсептаккорд',
        functions: {
            'G': { function: 'dominant', degree: 'V7', label: 'D7' }
        }
    }
};

// Функция для добавления недостающих аккордов в CHORD_DATA на основе тональности
function generateMissingChords(tonality) {
    const tonalityInfo = window.TONALITY_DATA[tonality];
    if (!tonalityInfo) return;
    
    // Обходим все аккорды тональности
    const allChords = [...tonalityInfo.chords.basic, ...tonalityInfo.chords.seventh];
    
    allChords.forEach(chordName => {
        // Если аккорд уже есть в базе, пропускаем
        if (CHORD_DATA[chordName]) {
            // Если у аккорда нет функции для текущей тональности, добавляем её
            if (!CHORD_DATA[chordName].functions[tonality]) {
                CHORD_DATA[chordName].functions[tonality] = getChordFunction(chordName, tonality);
            }
            return;
        }
        
        // Создаем базовую структуру для отсутствующего аккорда
        let notes = [];
        let description = '';
        let fullName = '';
        
        // Получаем корневую ноту без модификаторов
        let rootNote = '';
        
        // Используем регулярные выражения для более точного выделения корневой ноты
        if (chordName.match(/^([A-G][#b]?)m7b5$/)) {
            rootNote = chordName.match(/^([A-G][#b]?)m7b5$/)[1];
        } else if (chordName.match(/^([A-G][#b]?)m7$/)) {
            rootNote = chordName.match(/^([A-G][#b]?)m7$/)[1];
        } else if (chordName.match(/^([A-G][#b]?)maj7$/)) {
            rootNote = chordName.match(/^([A-G][#b]?)maj7$/)[1];
        } else if (chordName.match(/^([A-G][#b]?)7$/)) {
            rootNote = chordName.match(/^([A-G][#b]?)7$/)[1];
        } else if (chordName.match(/^([A-G][#b]?)dim$/)) {
            rootNote = chordName.match(/^([A-G][#b]?)dim$/)[1];
        } else if (chordName.match(/^([A-G][#b]?)m$/)) {
            rootNote = chordName.match(/^([A-G][#b]?)m$/)[1];
        } else {
            rootNote = chordName;
        }
        
        console.log('Определена корневая нота:', rootNote, 'для аккорда:', chordName);
        
        // Определяем тип аккорда и ноты на основе его названия
        if (chordName.endsWith('maj7')) {
            // Большой мажорный септаккорд
            description = 'Большой мажорный септаккорд';
            fullName = getNoteFullName(rootNote) + ' мажорный септаккорд';
            
            // Создаем ноты с указанием октавы
            notes = [
                rootNote + '4', 
                transposeNote(rootNote, 4) + '4', 
                transposeNote(rootNote, 7) + '4', 
                transposeNote(rootNote, 11) + '4'
            ];
        } else if (chordName.endsWith('m7b5')) {
            // Полууменьшенный септаккорд
            description = 'Полууменьшенный септаккорд';
            fullName = getNoteFullName(rootNote) + ' полууменьшенный септаккорд';
            
            // Создаем ноты с указанием октавы
            notes = [
                rootNote + '4', 
                transposeNote(rootNote, 3) + '4', 
                transposeNote(rootNote, 6) + '4', 
                transposeNote(rootNote, 10) + '4'
            ];
        } else if (chordName.endsWith('m7')) {
            // Минорный септаккорд
            description = 'Минорный септаккорд';
            fullName = getNoteFullName(rootNote) + ' минорный септаккорд';
            
            // Создаем ноты с указанием октавы
            notes = [
                rootNote + '4', 
                transposeNote(rootNote, 3) + '4', 
                transposeNote(rootNote, 7) + '4', 
                transposeNote(rootNote, 10) + '4'
            ];
        } else if (chordName.endsWith('7')) {
            // Доминантсептаккорд
            description = 'Доминантсептаккорд';
            fullName = getNoteFullName(rootNote) + ' доминантсептаккорд';
            
            // Создаем ноты с указанием октавы
            notes = [
                rootNote + '4', 
                transposeNote(rootNote, 4) + '4', 
                transposeNote(rootNote, 7) + '4', 
                transposeNote(rootNote, 10) + '4'
            ];
        } else if (chordName.endsWith('dim')) {
            // Уменьшенное трезвучие
            description = 'Уменьшенное трезвучие';
            fullName = getNoteFullName(rootNote) + ' уменьшенный';
            
            // Создаем ноты с указанием октавы
            notes = [
                rootNote + '4', 
                transposeNote(rootNote, 3) + '4', 
                transposeNote(rootNote, 6) + '4'
            ];
        } else if (chordName.endsWith('m')) {
            // Минорное трезвучие
            description = 'Минорное трезвучие';
            fullName = getNoteFullName(rootNote) + ' минор';
            
            // Создаем ноты с указанием октавы
            notes = [
                rootNote + '4', 
                transposeNote(rootNote, 3) + '4', 
                transposeNote(rootNote, 7) + '4'
            ];
        } else {
            // Мажорное трезвучие
            description = 'Мажорное трезвучие';
            fullName = getNoteFullName(rootNote) + ' мажор';
            
            // Создаем ноты с указанием октавы
            notes = [
                rootNote + '4', 
                transposeNote(rootNote, 4) + '4', 
                transposeNote(rootNote, 7) + '4'
            ];
        }
        
        // Создаем запись функции для аккорда в текущей тональности
        const functions = {};
        functions[tonality] = getChordFunction(chordName, tonality);
        
        // Добавляем аккорд в базу данных
        CHORD_DATA[chordName] = {
            fullName: fullName,
            notes: notes,
            description: description,
            functions: functions
        };
        
        console.log('Сгенерирован аккорд:', chordName, 'с нотами:', notes);
    });
}

// Функция для определения функции аккорда в тональности
function getChordFunction(chordName, tonality) {
    const tonalityInfo = window.TONALITY_DATA[tonality];
    if (!tonalityInfo) return { function: 'unknown', degree: '?', label: '?' };
    
    // Для maj7-аккордов сразу определяем особую логику
    if (chordName.endsWith('maj7')) {
        const rootNote = chordName.replace('maj7', '');
        
        // Определяем если это I, IV или V ступень (для мажора и минора)
        if (tonalityInfo.type === 'major') {
            if (rootNote === tonalityInfo.chords.basic[0]) {
                return { function: 'tonic', degree: 'Imaj7', label: 'T' };
            } else if (rootNote === tonalityInfo.chords.basic[3]) {
                return { function: 'subdominant', degree: 'IVmaj7', label: 'S' };
            }
        } else { // minor
            if (rootNote === tonalityInfo.chords.basic[2]) {
                return { function: 'tonic', degree: 'IIImaj7', label: 'T' };
            } else if (rootNote === tonalityInfo.chords.basic[5]) {
                return { function: 'subdominant', degree: 'VImaj7', label: 'S' };
            }
        }
    }
    
    // Извлекаем базовый аккорд и тип для остальных аккордов
    let baseChordName = '';
    let chordType = '';
    
    // Определяем тип аккорда и его базовое имя
    if (chordName.endsWith('m7b5')) {
        baseChordName = chordName.replace('m7b5', 'dim');
        chordType = 'm7b5';
    } else if (chordName.endsWith('m7')) {
        baseChordName = chordName.replace('m7', 'm');
        chordType = '7';
    } else if (chordName.endsWith('7')) {
        baseChordName = chordName.replace('7', '');
        chordType = '7';
    } else {
        baseChordName = chordName;
    }
    
    // Находим индекс базового аккорда в списке основных аккордов тональности
    let index = tonalityInfo.chords.basic.indexOf(baseChordName);
    
    // Если не нашли, и это септаккорд, пробуем найти его напрямую в списке септаккордов
    if (index === -1 && chordType) {
        index = tonalityInfo.chords.seventh.indexOf(chordName);
    }
    
    // Если аккорд не найден, возвращаем значение по умолчанию
    if (index === -1) {
        // Для maj7-аккордов используем предопределенную логику на основе тональности
        if (chordName.endsWith('maj7')) {
            const rootNote = chordName.replace('maj7', '');
            
            // В основных мажорных тональностях
            if (tonality === 'C' && rootNote === 'F') {
                return { function: 'subdominant', degree: 'IVmaj7', label: 'S' };
            } else if (tonality === 'G' && rootNote === 'C') {
                return { function: 'subdominant', degree: 'IVmaj7', label: 'S' };
            } else if (tonality === 'D' && rootNote === 'G') {
                return { function: 'subdominant', degree: 'IVmaj7', label: 'S' };
            } else if (tonality === 'A' && rootNote === 'D') {
                return { function: 'subdominant', degree: 'IVmaj7', label: 'S' };
            } else if (tonality === 'E' && rootNote === 'A') {
                return { function: 'subdominant', degree: 'IVmaj7', label: 'S' };
            } else if (tonality === 'F' && rootNote === 'Bb') {
                return { function: 'subdominant', degree: 'IVmaj7', label: 'S' };
            } else if (tonality === 'Bb' && rootNote === 'Eb') {
                return { function: 'subdominant', degree: 'IVmaj7', label: 'S' };
            } else if (tonality === 'Eb' && rootNote === 'Ab') {
                return { function: 'subdominant', degree: 'IVmaj7', label: 'S' };
            }
            
            // В минорных тональностях
            else if (tonality === 'Am' && rootNote === 'C') {
                return { function: 'tonic', degree: 'IIImaj7', label: 'T' };
            } else if (tonality === 'Em' && rootNote === 'G') {
                return { function: 'tonic', degree: 'IIImaj7', label: 'T' };
            } else if (tonality === 'Dm' && rootNote === 'F') {
                return { function: 'tonic', degree: 'IIImaj7', label: 'T' };
            }
        }
        
        console.warn('Не удалось найти функцию для аккорда', chordName, 'в тональности', tonality);
        return { function: 'unknown', degree: '?', label: '?' };
    }
    
    // Функции и ступени в зависимости от типа тональности
    if (tonalityInfo.type === 'major') {
        switch(index) {
            case 0: 
                return { 
                    function: 'tonic', 
                    degree: chordType ? 'I' + chordType : 'I', 
                    label: 'T' 
                };
            case 1: 
                return { 
                    function: 'subdominant', 
                    degree: chordType ? 'ii' + chordType : 'ii', 
                    label: 'S' 
                };
            case 2: 
                return { 
                    function: 'tonic', 
                    degree: chordType ? 'iii' + chordType : 'iii', 
                    label: 'T' 
                };
            case 3: 
                return { 
                    function: 'subdominant', 
                    degree: chordType ? 'IV' + chordType : 'IV', 
                    label: 'S' 
                };
            case 4: 
                return { 
                    function: 'dominant', 
                    degree: chordType ? 'V' + chordType : 'V', 
                    label: 'D' 
                };
            case 5: 
                return { 
                    function: 'tonic', 
                    degree: chordType ? 'vi' + chordType : 'vi', 
                    label: 'T' 
                };
            case 6: 
                return { 
                    function: 'dominant', 
                    degree: chordType === 'm7b5' ? 'viiø7' : (chordType ? 'vii°' + chordType : 'vii°'), 
                    label: 'D' 
                };
            default: 
                return { 
                    function: 'unknown', 
                    degree: '?', 
                    label: '?' 
                };
        }
    } else { // minor
        switch(index) {
            case 0: 
                return { 
                    function: 'tonic', 
                    degree: chordType ? 'i' + chordType : 'i', 
                    label: 'T' 
                };
            case 1: 
                return { 
                    function: 'dominant', 
                    degree: chordType === 'm7b5' ? 'iiø7' : (chordType ? 'ii°' + chordType : 'ii°'), 
                    label: 'D' 
                };
            case 2: 
                return { 
                    function: 'tonic', 
                    degree: chordType ? 'III' + chordType : 'III', 
                    label: 'T' 
                };
            case 3: 
                return { 
                    function: 'subdominant', 
                    degree: chordType ? 'iv' + chordType : 'iv', 
                    label: 'S' 
                };
            case 4: 
                return { 
                    function: 'dominant', 
                    degree: chordType ? 'v' + chordType : 'v', 
                    label: 'D' 
                };
            case 5: 
                return { 
                    function: 'subdominant', 
                    degree: chordType ? 'VI' + chordType : 'VI', 
                    label: 'S' 
                };
            case 6: 
                return { 
                    function: 'dominant', 
                    degree: chordType ? 'VII' + chordType : 'VII', 
                    label: 'D' 
                };
            default: 
                return { 
                    function: 'unknown', 
                    degree: '?', 
                    label: '?' 
                };
        }
    }
}

// Вспомогательная функция для транспонирования ноты на указанное количество полутонов
function transposeNote(noteStr, semitones) {
    // Удаляем номер октавы, если он есть
    const baseNote = noteStr.replace(/[0-9]/g, '');
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Обработка бемолей
    let normalizedNote = baseNote;
    if (baseNote.includes('b')) {
        normalizedNote = normalizedNote.replace('Bb', 'A#').replace('Eb', 'D#')
            .replace('Ab', 'G#').replace('Db', 'C#').replace('Gb', 'F#');
    }
    
    // Находим индекс ноты в массиве
    let noteIndex = -1;
    for (let i = 0; i < notes.length; i++) {
        if (normalizedNote === notes[i]) {
            noteIndex = i;
            break;
        }
    }
    
    if (noteIndex === -1) {
        console.warn('Не удалось определить индекс для ноты:', noteStr);
        return noteStr; // Если нота не найдена, возвращаем исходную
    }
    
    // Транспонируем ноту
    let newIndex = (noteIndex + semitones) % 12;
    if (newIndex < 0) newIndex += 12;
    
    // Возвращаем новую ноту без октавы (октава будет добавлена позже)
    return notes[newIndex];
}

// Вспомогательная функция для получения полного названия ноты на русском
function getNoteFullName(noteStr) {
    const noteNames = {
        'C': 'До', 'C#': 'До-диез', 'Db': 'Ре-бемоль',
        'D': 'Ре', 'D#': 'Ре-диез', 'Eb': 'Ми-бемоль',
        'E': 'Ми', 'F': 'Фа', 'F#': 'Фа-диез',
        'Gb': 'Соль-бемоль', 'G': 'Соль', 'G#': 'Соль-диез',
        'Ab': 'Ля-бемоль', 'A': 'Ля', 'A#': 'Ля-диез',
        'Bb': 'Си-бемоль', 'B': 'Си'
    };
    
    // Определяем базовую ноту (без суффиксов)
    let baseNote = noteStr;
    
    // Используем регулярное выражение для извлечения только буквы ноты и возможных # или b
    const noteMatch = noteStr.match(/^([A-G][#b]?)/);
    if (noteMatch) {
        baseNote = noteMatch[1];
    }
    
    return noteNames[baseNote] || baseNote;
}

// Исправляем некорректное описание для аккордов с maj7
function fixMaj7ChordDescriptions() {
    // Находим все аккорды типа maj7 в базе данных
    for (const chordName in CHORD_DATA) {
        if (chordName.endsWith('maj7')) {
            CHORD_DATA[chordName].description = 'Большой мажорный септаккорд';
            
            // Если название содержит "доминантсептаккорд", исправляем его
            const rootNote = chordName.replace('maj7', '');
            CHORD_DATA[chordName].fullName = getNoteFullName(rootNote) + ' мажорный септаккорд';
        }
    }
}

// Запускаем исправление при инициализации
fixMaj7ChordDescriptions();

window.CHORD_DATA = CHORD_DATA;