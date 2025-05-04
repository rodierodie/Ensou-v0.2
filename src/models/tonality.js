/**
 * Класс, представляющий тональность в музыке
 */
export class Tonality {
    /**
     * @param {string} note - Нота тональности (C, C#, D, и т.д.)
     * @param {string} type - Тип тональности ('dur' для мажора, 'moll' для минора)
     */
    constructor(note, type) {
        this.note = note;
        this.type = type;
    }

    /**
     * Получение названия тональности
     * @returns {string} - Название тональности (например, "C dur" или "A moll")
     */
    getName() {
        return `${this.note} ${this.type}`;
    }

    /**
     * Получение локализованного названия тональности
     * @returns {string} - Локализованное название тональности (например, "До мажор" или "Ля минор")
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
            'dur': 'мажор',
            'moll': 'минор'
        };

        return `${noteNames[this.note] || this.note} ${typeNames[this.type] || this.type}`;
    }

    /**
     * Получение списка нот тональности
     * @returns {Array<string>} - Массив нот тональности
     */
    getNotes() {
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Шаблоны ступеней для мажора и минора (интервалы в полутонах)
        const patterns = {
            'dur': [0, 2, 4, 5, 7, 9, 11],  // Мажорная гамма (2-2-1-2-2-2-1)
            'moll': [0, 2, 3, 5, 7, 8, 10]  // Натуральная минорная гамма (2-1-2-2-1-2-2)
        };
        
        // Определяем индекс стартовой ноты в хроматической гамме
        let startIndex = chromaticScale.indexOf(this.note);
        if (startIndex === -1) {
            // Обработка альтернативных названий (бемолей)
            const enharmonics = {
                'Db': 'C#',
                'Eb': 'D#',
                'Gb': 'F#',
                'Ab': 'G#',
                'Bb': 'A#'
            };
            
            if (enharmonics[this.note]) {
                startIndex = chromaticScale.indexOf(enharmonics[this.note]);
            }
        }
        
        // Если тональность всё еще не найдена, возвращаем пустой массив
        if (startIndex === -1) {
            return [];
        }
        
        // Выбираем соответствующий шаблон
        const pattern = patterns[this.type] || patterns.dur;
        
        // Строим гамму
        return pattern.map(semitones => {
            const index = (startIndex + semitones) % 12;
            return chromaticScale[index];
        });
    }

    /**
     * Получение аккордов тональности
     * @returns {Array<Object>} - Массив аккордов тональности с информацией
     */
    getChordsInTonality() {
        const notes = this.getNotes();
        
        // Шаблоны аккордов для ступеней в мажоре и миноре
        const chordTemplates = {
            'dur': ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
            'moll': ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj']
        };
        
        // Шаблоны для септаккордов
        const seventhTemplates = {
            'dur': ['maj7', 'min7', 'min7', 'maj7', '7', 'min7', 'm7b5'],
            'moll': ['min7', 'm7b5', 'maj7', 'min7', 'min7', 'maj7', '7']
        };
        
        // Функции аккордов
        const functions = {
            'dur': ['T', 'SD', 'T', 'SD', 'D', 'T', 'D'],
            'moll': ['T', 'SD', 'TD', 'SD', 'D', 'TD', 'D']
        };
        
        // Выбираем соответствующие шаблоны
        const chordTypes = chordTemplates[this.type] || chordTemplates.dur;
        const seventhTypes = seventhTemplates[this.type] || seventhTemplates.dur;
        const chordFunctions = functions[this.type] || functions.dur;
        
        // Формируем аккорды
        const chords = notes.map((note, index) => {
            const degree = index + 1; // Ступень (от 1 до 7)
            const chordType = chordTypes[index];
            const seventhType = seventhTypes[index];
            const func = chordFunctions[index];
            const romanNumeral = this.getRomanNumeral(degree, chordType);
            
            // Создаем объект аккорда с информацией
            return {
                root: note,
                type: chordType,
                seventhType: seventhType,
                degree,
                function: func,
                romanNumeral,
                inTonality: this.getName()
            };
        });
        
        return chords;
    }

    /**
     * Преобразование ступени и типа аккорда в запись римскими цифрами
     * @param {number} degree - Ступень аккорда (1-7)
     * @param {string} chordType - Тип аккорда (maj, min, dim)
     * @returns {string} - Запись ступени римскими цифрами
     */
    getRomanNumeral(degree, chordType) {
        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
        let numeral = romanNumerals[degree - 1] || '';
        
        // Для минорных аккордов используем строчные буквы
        if (chordType === 'min' || chordType === 'dim') {
            numeral = numeral.toLowerCase();
        }
        
        // Добавляем обозначение уменьшенного аккорда
        if (chordType === 'dim') {
            numeral += '°';
        }
        
        return numeral;
    }

    /**
     * Получение индекса тональности в круге квинт
     * @returns {number} - Индекс в круге квинт (0-11)
     */
    getCircleOfFifthsIndex() {
        const noteOrder = {
            'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7,
            'Gb': 6, 'Db': 7, 'Ab': 8, 'Eb': 9, 'Bb': 10, 'F': 11
        };
        
        return noteOrder[this.note] !== undefined ? noteOrder[this.note] : 0;
    }

    /**
     * Нахождение родственных тональностей
     * @returns {Array<Object>} - Массив родственных тональностей
     */
    getRelatedTonalities() {
        const related = [];
        
        // Параллельная тональность
        const parallelType = this.type === 'dur' ? 'moll' : 'dur';
        let parallelNote = this.note;
        
        if (this.type === 'dur') {
            // Параллельный минор на малую терцию ниже
            const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const index = chromaticScale.indexOf(this.note);
            if (index !== -1) {
                const parallelIndex = (index + 9) % 12; // -3 полутона или +9 полутонов
                parallelNote = chromaticScale[parallelIndex];
            }
        } else if (this.type === 'moll') {
            // Параллельный мажор на малую терцию выше
            const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const index = chromaticScale.indexOf(this.note);
            if (index !== -1) {
                const parallelIndex = (index + 3) % 12; // +3 полутона
                parallelNote = chromaticScale[parallelIndex];
            }
        }
        
        related.push({
            note: parallelNote,
            type: parallelType,
            relationship: 'parallel'
        });
        
        // Доминантовая тональность (на квинту вверх)
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const index = chromaticScale.indexOf(this.note);
        if (index !== -1) {
            const dominantIndex = (index + 7) % 12; // +7 полутонов (чистая квинта)
            const dominantNote = chromaticScale[dominantIndex];
            related.push({
                note: dominantNote,
                type: this.type,
                relationship: 'dominant'
            });
        }
        
        // Субдоминантовая тональность (на квинту вниз или на кварту вверх)
        if (index !== -1) {
            const subdominantIndex = (index + 5) % 12; // +5 полутонов (чистая кварта)
            const subdominantNote = chromaticScale[subdominantIndex];
            related.push({
                note: subdominantNote,
                type: this.type,
                relationship: 'subdominant'
            });
        }
        
        return related;
    }

    /**
     * Получение количества знаков альтерации в тональности
     * @returns {Object} - Объект с информацией о знаках альтерации
     */
    getKeySignature() {
        // Количество знаков для мажорных тональностей
        const majorSharps = {
            'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7
        };
        
        const majorFlats = {
            'C': 0, 'F': 1, 'Bb': 2, 'Eb': 3, 'Ab': 4, 'Db': 5, 'Gb': 6, 'Cb': 7
        };
        
        // Для минорных тональностей используем их параллельные мажорные
        const minorToMajor = {
            'A': 'C', 'E': 'G', 'B': 'D', 'F#': 'A', 'C#': 'E', 'G#': 'B', 'D#': 'F#', 'A#': 'C#',
            'D': 'F', 'G': 'Bb', 'C': 'Eb', 'F': 'Ab', 'Bb': 'Db', 'Eb': 'Gb'
        };
        
        let count = 0;
        let type = 'none'; // 'sharp', 'flat' или 'none'
        
        if (this.type === 'dur') {
            if (majorSharps[this.note] !== undefined) {
                count = majorSharps[this.note];
                type = count > 0 ? 'sharp' : 'none';
            } else if (majorFlats[this.note] !== undefined) {
                count = majorFlats[this.note];
                type = count > 0 ? 'flat' : 'none';
            }
        } else if (this.type === 'moll') {
            const relatedMajor = minorToMajor[this.note];
            if (relatedMajor) {
                if (majorSharps[relatedMajor] !== undefined) {
                    count = majorSharps[relatedMajor];
                    type = count > 0 ? 'sharp' : 'none';
                } else if (majorFlats[relatedMajor] !== undefined) {
                    count = majorFlats[relatedMajor];
                    type = count > 0 ? 'flat' : 'none';
                }
            }
        }
        
        return {
            count,
            type
        };
    }

    /**
     * Сравнение с другой тональностью
     * @param {Tonality} other - Другая тональность для сравнения
     * @returns {boolean} - true, если тональности равны
     */
    equals(other) {
        return this.note === other.note && this.type === other.type;
    }

    /**
     * Преобразование тональности в строку
     * @returns {string} - Строковое представление тональности
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
            note: this.note,
            type: this.type
        };
    }

    /**
     * Создание тональности из объекта
     * @param {Object} obj - Объект с параметрами тональности
     * @returns {Tonality} - Новый экземпляр тональности
     */
    static fromJSON(obj) {
        return new Tonality(obj.note, obj.type);
    }
}

/**
 * Класс, представляющий коллекцию доступных тональностей
 */
export class TonalityCollection {
    constructor() {
        this.tonalities = [];
        this.initializeTonalities();
    }

    /**
     * Инициализация коллекции тональностей
     */
    initializeTonalities() {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const types = ['dur', 'moll'];
        
        // Создаем все возможные комбинации нот и типов
        notes.forEach(note => {
            types.forEach(type => {
                this.tonalities.push(new Tonality(note, type));
            });
        });
    }

    /**
     * Получение всех тональностей
     * @returns {Array<Tonality>} - Массив всех тональностей
     */
    getAll() {
        return [...this.tonalities];
    }

    /**
     * Получение тональности по ноте и типу
     * @param {string} note - Нота тональности
     * @param {string} type - Тип тональности
     * @returns {Tonality|null} - Найденная тональность или null
     */
    getTonality(note, type) {
        return this.tonalities.find(t => t.note === note && t.type === type) || null;
    }

    /**
     * Получение тональностей, отсортированных по кругу квинт
     * @returns {Array<Tonality>} - Отсортированные тональности
     */
    getSortedByCircleOfFifths() {
        return [...this.tonalities].sort((a, b) => {
            return a.getCircleOfFifthsIndex() - b.getCircleOfFifthsIndex();
        });
    }

    /**
     * Получение тональностей определенного типа
     * @param {string} type - Тип тональности ('dur' или 'moll')
     * @returns {Array<Tonality>} - Тональности указанного типа
     */
    getByType(type) {
        return this.tonalities.filter(t => t.type === type);
    }
}

// Создаем экземпляр коллекции тональностей для использования в приложении
export const tonalityCollection = new TonalityCollection();

// Экспортируем по умолчанию
export default tonalityCollection;