import { Tonality } from './tonality.js';

/**
 * Класс, представляющий музыкальный аккорд
 */
export class Chord {
    /**
     * @param {string} root - Основная нота аккорда (C, C#, D и т.д.)
     * @param {string} type - Тип аккорда (maj, min, dim, aug, maj7, min7, 7, m7b5, и т.д.)
     * @param {Object} [options] - Дополнительные опции аккорда
     * @param {number} [options.degree] - Ступень аккорда в тональности
     * @param {string} [options.function] - Функция аккорда (T, S, D)
     * @param {string} [options.inTonality] - Тональность, в которой находится аккорд
     */
    constructor(root, type, options = {}) {
        this.root = root;
        this.type = type;
        this.degree = options.degree || null;
        this.function = options.function || null;
        this.inTonality = options.inTonality || null;
    }

    /**
     * Получение названия аккорда
     * @returns {string} - Название аккорда (например, "Cmaj7" или "Dmin")
     */
    getName() {
        // Преобразование типа аккорда в обозначение
        const typeAbbreviation = {
            'maj': '',
            'min': 'm',
            'dim': 'dim',
            'aug': 'aug',
            'maj7': 'maj7',
            'min7': 'm7',
            '7': '7',
            'm7b5': 'm7b5',
            'maj9': 'maj9',
            'min9': 'm9',
            '9': '9',
            'sus2': 'sus2',
            'sus4': 'sus4'
        };

        return `${this.root}${typeAbbreviation[this.type] || this.type}`;
    }

    /**
     * Получение локализованного названия аккорда
     * @returns {string} - Локализованное название аккорда (например, "До мажор" или "Ре минор")
     */
    getLocalizedName() {
        const noteNames = {
            'C': 'До',
            'C#': 'До диез',
            'Db': 'Ре бемоль',
            'D': 'Ре',
            'D#': 'Ре диез',
            'Eb': 'Ми бемоль',
            'E': 'Ми',
            'F': 'Фа',
            'F#': 'Фа диез',
            'Gb': 'Соль бемоль',
            'G': 'Соль',
            'G#': 'Соль диез',
            'Ab': 'Ля бемоль',
            'A': 'Ля',
            'A#': 'Ля диез',
            'Bb': 'Си бемоль',
            'B': 'Си'
        };

        const typeNames = {
            'maj': 'мажор',
            'min': 'минор',
            'dim': 'уменьшенный',
            'aug': 'увеличенный',
            'maj7': 'большой мажорный септаккорд',
            'min7': 'малый минорный септаккорд',
            '7': 'малый мажорный септаккорд',
            'm7b5': 'полууменьшенный септаккорд',
            'maj9': 'большой мажорный нонаккорд',
            'min9': 'малый минорный нонаккорд',
            '9': 'малый мажорный нонаккорд',
            'sus2': 'с секундой',
            'sus4': 'с квартой'
        };

        return `${noteNames[this.root] || this.root} ${typeNames[this.type] || this.type}`;
    }

    /**
     * Получение интервалов аккорда в полутонах от основной ноты
     * @returns {Array<number>} - Массив интервалов в полутонах
     */
    getIntervals() {
        // Определяем интервалы для разных типов аккордов
        const intervalPatterns = {
            'maj': [0, 4, 7],          // Мажорное трезвучие (1-3-5)
            'min': [0, 3, 7],          // Минорное трезвучие (1-b3-5)
            'dim': [0, 3, 6],          // Уменьшенное трезвучие (1-b3-b5)
            'aug': [0, 4, 8],          // Увеличенное трезвучие (1-3-#5)
            'maj7': [0, 4, 7, 11],     // Большой мажорный септаккорд (1-3-5-7)
            'min7': [0, 3, 7, 10],     // Малый минорный септаккорд (1-b3-5-b7)
            '7': [0, 4, 7, 10],        // Малый мажорный септаккорд (доминантсептаккорд) (1-3-5-b7)
            'm7b5': [0, 3, 6, 10],     // Полууменьшенный септаккорд (1-b3-b5-b7)
            'dim7': [0, 3, 6, 9],      // Уменьшенный септаккорд (1-b3-b5-bb7)
            'maj9': [0, 4, 7, 11, 14], // Большой мажорный нонаккорд (1-3-5-7-9)
            'min9': [0, 3, 7, 10, 14], // Малый минорный нонаккорд (1-b3-5-b7-9)
            '9': [0, 4, 7, 10, 14],    // Малый мажорный нонаккорд (1-3-5-b7-9)
            'sus2': [0, 2, 7],         // Трезвучие с секундой (1-2-5)
            'sus4': [0, 5, 7]          // Трезвучие с квартой (1-4-5)
        };

        return intervalPatterns[this.type] || intervalPatterns.maj;
    }

    /**
     * Получение нот аккорда
     * @returns {Array<string>} - Массив нот аккорда
     */
    getNotes() {
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const intervals = this.getIntervals();
        
        // Определяем индекс стартовой ноты в хроматической гамме
        let startIndex = chromaticScale.indexOf(this.root);
        if (startIndex === -1) {
            // Обработка альтернативных названий (бемолей)
            const enharmonics = {
                'Db': 'C#',
                'Eb': 'D#',
                'Gb': 'F#',
                'Ab': 'G#',
                'Bb': 'A#'
            };
            
            if (enharmonics[this.root]) {
                startIndex = chromaticScale.indexOf(enharmonics[this.root]);
            }
        }
        
        // Если нота всё еще не найдена, возвращаем пустой массив
        if (startIndex === -1) {
            return [];
        }
        
        // Строим ноты аккорда
        return intervals.map(interval => {
            const index = (startIndex + interval) % 12;
            return chromaticScale[index];
        });
    }

    /**
     * Получение функции аккорда в тональности
     * @param {Tonality} tonality - Тональность для анализа
     * @returns {Object} - Информация о функции аккорда
     */
    getChordFunction(tonality) {
        if (!tonality) {
            return { function: null, degree: null, romanNumeral: null };
        }
        
        const chordsInTonality = tonality.getChordsInTonality();
        
        // Ищем аккорд с той же основной нотой
        const matchingChord = chordsInTonality.find(chord => chord.root === this.root);
        
        if (!matchingChord) {
            return { function: null, degree: null, romanNumeral: null };
        }
        
        // Проверяем соответствие типа аккорда
        const basicTypeMatch = (this.type === 'maj' && matchingChord.type === 'maj') || 
                               (this.type === 'min' && matchingChord.type === 'min') ||
                               (this.type === 'dim' && matchingChord.type === 'dim') ||
                               (this.type === 'aug' && matchingChord.type === 'aug');
                               
        const seventhTypeMatch = (this.type === 'maj7' && matchingChord.seventhType === 'maj7') ||
                                 (this.type === 'min7' && matchingChord.seventhType === 'min7') ||
                                 (this.type === '7' && matchingChord.seventhType === '7') ||
                                 (this.type === 'm7b5' && matchingChord.seventhType === 'm7b5');
        
        if (basicTypeMatch || seventhTypeMatch) {
            return {
                function: matchingChord.function,
                degree: matchingChord.degree,
                romanNumeral: matchingChord.romanNumeral,
                inTonality: tonality.getName()
            };
        }
        
        // Если типы не совпадают, возвращаем только информацию о ступени
        return {
            function: null,
            degree: matchingChord.degree,
            romanNumeral: null,
            inTonality: tonality.getName()
        };
    }

    /**
     * Получение всех функций аккорда в разных тональностях
     * @param {Array<Tonality>} tonalities - Массив тональностей для анализа
     * @returns {Array<Object>} - Массив функций аккорда в разных тональностях
     */
    getAllFunctions(tonalities) {
        const functions = [];
        
        tonalities.forEach(tonality => {
            const functionInfo = this.getChordFunction(tonality);
            if (functionInfo.function) {
                functions.push({
                    ...functionInfo,
                    tonality: tonality.getName()
                });
            }
        });
        
        return functions;
    }

    /**
     * Проверка, является ли аккорд диатоническим в тональности
     * @param {Tonality} tonality - Тональность для проверки
     * @returns {boolean} - true, если аккорд диатонический
     */
    isDiatonicIn(tonality) {
        const chordsInTonality = tonality.getChordsInTonality();
        const basicMatch = chordsInTonality.some(chord => 
            chord.root === this.root && 
            ((this.type === 'maj' && chord.type === 'maj') ||
             (this.type === 'min' && chord.type === 'min') ||
             (this.type === 'dim' && chord.type === 'dim'))
        );
        
        const seventhMatch = chordsInTonality.some(chord => 
            chord.root === this.root && 
            ((this.type === 'maj7' && chord.seventhType === 'maj7') ||
             (this.type === 'min7' && chord.seventhType === 'min7') ||
             (this.type === '7' && chord.seventhType === '7') ||
             (this.type === 'm7b5' && chord.seventhType === 'm7b5'))
        );
        
        return basicMatch || seventhMatch;
    }

    /**
     * Получение цвета для функции аккорда
     * @returns {string} - Цвет для отображения функции
     */
    getFunctionColor() {
        const colorMap = {
            'T': 'blue',
            'S': 'green',
            'D': 'red',
            'TD': 'purple'
        };
        
        return colorMap[this.function] || 'gray';
    }

    /**
     * Сравнение с другим аккордом
     * @param {Chord} other - Другой аккорд для сравнения
     * @returns {boolean} - true, если аккорды равны
     */
    equals(other) {
        return this.root === other.root && this.type === other.type;
    }

    /**
     * Преобразование аккорда в строку
     * @returns {string} - Строковое представление аккорда
     */
    toString() {
        return this.getName();
    }

    /**
     * Создание объекта для сериализации
     * @returns {Object} - Объект для JSON-сериализации
     */
    toJSON() {
        return {
            root: this.root,
            type: this.type,
            degree: this.degree,
            function: this.function,
            inTonality: this.inTonality
        };
    }

    /**
     * Создание аккорда из объекта
     * @param {Object} obj - Объект с параметрами аккорда
     * @returns {Chord} - Новый экземпляр аккорда
     */
    static fromJSON(obj) {
        return new Chord(obj.root, obj.type, {
            degree: obj.degree,
            function: obj.function,
            inTonality: obj.inTonality
        });
    }
}

/**
 * Класс, представляющий коллекцию аккордов для тональности
 */
export class ChordCollection {
    /**
     * @param {Tonality} tonality - Тональность для создания коллекции аккордов
     */
    constructor(tonality) {
        this.tonality = tonality;
        this.basicChords = [];
        this.seventhChords = [];
        this.initializeChords();
    }

    /**
     * Инициализация коллекции аккордов для тональности
     */
    initializeChords() {
        const chordsInfo = this.tonality.getChordsInTonality();
        
        // Создаем трезвучия
        this.basicChords = chordsInfo.map(info => {
            return new Chord(info.root, info.type, {
                degree: info.degree,
                function: info.function,
                inTonality: this.tonality.getName()
            });
        });
        
        // Создаем септаккорды
        this.seventhChords = chordsInfo.map(info => {
            return new Chord(info.root, info.seventhType, {
                degree: info.degree,
                function: info.function,
                inTonality: this.tonality.getName()
            });
        });
    }

    /**
     * Получение основных трезвучий
     * @returns {Array<Chord>} - Массив трезвучий
     */
    getBasicChords() {
        return [...this.basicChords];
    }

    /**
     * Получение септаккордов
     * @returns {Array<Chord>} - Массив септаккордов
     */
    getSeventhChords() {
        return [...this.seventhChords];
    }

    /**
     * Получение всех аккордов
     * @returns {Array<Chord>} - Массив всех аккордов
     */
    getAllChords() {
        return [...this.basicChords, ...this.seventhChords];
    }

    /**
     * Получение аккорда по ноте и типу
     * @param {string} root - Основная нота аккорда
     * @param {string} type - Тип аккорда
     * @returns {Chord|null} - Найденный аккорд или null
     */
    getChord(root, type) {
        const allChords = this.getAllChords();
        return allChords.find(chord => chord.root === root && chord.type === type) || null;
    }

    /**
     * Получение аккорда по ступени
     * @param {number} degree - Ступень аккорда (1-7)
     * @param {boolean} [seventh=false] - true для септаккорда, false для трезвучия
     * @returns {Chord|null} - Найденный аккорд или null
     */
    getChordByDegree(degree, seventh = false) {
        const collection = seventh ? this.seventhChords : this.basicChords;
        return collection.find(chord => chord.degree === degree) || null;
    }

    /**
     * Получение аккордов по функции
     * @param {string} func - Функция аккорда (T, S, D)
     * @returns {Array<Chord>} - Массив аккордов с указанной функцией
     */
    getChordsByFunction(func) {
        const allChords = this.getAllChords();
        return allChords.filter(chord => chord.function === func);
    }

    /**
     * Обновление тональности и пересоздание коллекции
     * @param {Tonality} tonality - Новая тональность
     */
    updateTonality(tonality) {
        this.tonality = tonality;
        this.basicChords = [];
        this.seventhChords = [];
        this.initializeChords();
    }
}

// Экспортируем по умолчанию
export default Chord;