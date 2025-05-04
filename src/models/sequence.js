import { Chord } from './chord.js';
import { Tonality } from './tonality.js';

/**
 * Класс, представляющий элемент последовательности
 * (может быть аккордом или паузой)
 */
export class SequenceItem {
    /**
     * @param {Object} options - Опции элемента последовательности
     * @param {Chord|null} options.chord - Аккорд или null для паузы
     * @param {number} options.duration - Длительность в долях такта (1 = целая нота)
     * @param {boolean} options.isPause - Является ли элемент паузой
     */
    constructor(options = {}) {
        this.chord = options.chord || null;
        this.duration = options.duration || 1;
        this.isPause = options.isPause || false;
    }

    /**
     * Проверка, является ли элемент паузой
     * @returns {boolean} - true, если элемент является паузой
     */
    isChord() {
        return !this.isPause && this.chord !== null;
    }

    /**
     * Получение длительности в миллисекундах на основе темпа
     * @param {number} tempo - Темп в ударах в минуту (BPM)
     * @returns {number} - Длительность в миллисекундах
     */
    getDurationMs(tempo) {
        // Предполагаем, что один "удар" - это четвертная нота
        // Целая нота = 4 четвертных
        const beatDurationMs = 60000 / tempo; // длительность одного удара в мс
        return beatDurationMs * 4 * this.duration; // умножаем на 4 для целой ноты
    }

    /**
     * Создание объекта для сериализации
     * @returns {Object} - Объект для JSON-сериализации
     */
    toJSON() {
        return {
            chord: this.chord ? this.chord.toJSON() : null,
            duration: this.duration,
            isPause: this.isPause
        };
    }

    /**
     * Создание элемента последовательности из объекта
     * @param {Object} obj - Объект с параметрами элемента
     * @returns {SequenceItem} - Новый экземпляр элемента
     */
    static fromJSON(obj) {
        return new SequenceItem({
            chord: obj.chord ? Chord.fromJSON(obj.chord) : null,
            duration: obj.duration,
            isPause: obj.isPause
        });
    }
}

/**
 * Класс, представляющий последовательность аккордов
 */
export class ChordSequence {
    /**
     * @param {Array<SequenceItem>} items - Массив элементов последовательности
     */
    constructor(items = []) {
        this.items = items;
    }

    /**
     * Добавление элемента в последовательность
     * @param {SequenceItem} item - Элемент для добавления
     * @returns {ChordSequence} - this для цепочки вызовов
     */
    addItem(item) {
        this.items.push(item);
        return this;
    }

    /**
     * Добавление аккорда в последовательность
     * @param {Chord} chord - Аккорд для добавления
     * @param {number} duration - Длительность в долях такта
     * @returns {ChordSequence} - this для цепочки вызовов
     */
    addChord(chord, duration = 1) {
        return this.addItem(new SequenceItem({
            chord,
            duration,
            isPause: false
        }));
    }

    /**
     * Добавление паузы в последовательность
     * @param {number} duration - Длительность паузы в долях такта
     * @returns {ChordSequence} - this для цепочки вызовов
     */
    addPause(duration = 1) {
        return this.addItem(new SequenceItem({
            chord: null,
            duration,
            isPause: true
        }));
    }

    /**
     * Удаление элемента по индексу
     * @param {number} index - Индекс элемента для удаления
     * @returns {SequenceItem|null} - Удаленный элемент или null
     */
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            return this.items.splice(index, 1)[0];
        }
        return null;
    }

    /**
     * Перемещение элемента на новую позицию
     * @param {number} fromIndex - Исходный индекс
     * @param {number} toIndex - Целевой индекс
     * @returns {boolean} - true, если перемещение успешно
     */
    moveItem(fromIndex, toIndex) {
        if (
            fromIndex >= 0 && fromIndex < this.items.length &&
            toIndex >= 0 && toIndex < this.items.length &&
            fromIndex !== toIndex
        ) {
            const item = this.items.splice(fromIndex, 1)[0];
            this.items.splice(toIndex, 0, item);
            return true;
        }
        return false;
    }

    /**
     * Получение всех элементов последовательности
     * @returns {Array<SequenceItem>} - Копия массива элементов
     */
    getItems() {
        return [...this.items];
    }

    /**
     * Получение элемента по индексу
     * @param {number} index - Индекс элемента
     * @returns {SequenceItem|null} - Элемент или null, если индекс вне диапазона
     */
    getItem(index) {
        return (index >= 0 && index < this.items.length) ? this.items[index] : null;
    }

    /**
     * Очистка последовательности
     * @returns {ChordSequence} - this для цепочки вызовов
     */
    clear() {
        this.items = [];
        return this;
    }

    /**
     * Получение общей длительности последовательности
     * @returns {number} - Общая длительность в долях такта
     */
    getTotalDuration() {
        return this.items.reduce((total, item) => total + item.duration, 0);
    }

    /**
     * Получение общей длительности в миллисекундах
     * @param {number} tempo - Темп в ударах в минуту (BPM)
     * @returns {number} - Общая длительность в миллисекундах
     */
    getTotalDurationMs(tempo) {
        return this.items.reduce((total, item) => total + item.getDurationMs(tempo), 0);
    }

    /**
     * Создание объекта для сериализации
     * @returns {Object} - Объект для JSON-сериализации
     */
    toJSON() {
        return {
            items: this.items.map(item => item.toJSON())
        };
    }

    /**
     * Создание последовательности из объекта
     * @param {Object} obj - Объект с параметрами последовательности
     * @returns {ChordSequence} - Новый экземпляр последовательности
     */
    static fromJSON(obj) {
        const items = obj.items.map(itemData => SequenceItem.fromJSON(itemData));
        return new ChordSequence(items);
    }
}

/**
 * Класс, представляющий блок трека
 */
export class TrackBlock {
    /**
     * @param {Object} options - Опции блока
     * @param {string} options.id - Идентификатор блока (например, "A1", "B1")
     * @param {string} options.name - Название блока (необязательно)
     * @param {Tonality} options.tonality - Тональность блока
     * @param {ChordSequence} options.sequence - Последовательность аккордов
     */
    constructor(options = {}) {
        this.id = options.id || `Block_${Date.now()}`;
        this.name = options.name || this.id;
        this.tonality = options.tonality || new Tonality('C', 'dur');
        this.sequence = options.sequence || new ChordSequence();
    }

    /**
     * Получение идентификатора блока
     * @returns {string} - Идентификатор блока
     */
    getId() {
        return this.id;
    }

    /**
     * Получение названия блока
     * @returns {string} - Название блока
     */
    getName() {
        return this.name;
    }

    /**
     * Установка нового названия блока
     * @param {string} name - Новое название
     */
    setName(name) {
        this.name = name;
    }

    /**
     * Получение тональности блока
     * @returns {Tonality} - Тональность блока
     */
    getTonality() {
        return this.tonality;
    }

    /**
     * Изменение тональности блока
     * @param {Tonality} tonality - Новая тональность
     */
    setTonality(tonality) {
        this.tonality = tonality;
    }

    /**
     * Получение последовательности аккордов
     * @returns {ChordSequence} - Последовательность аккордов
     */
    getSequence() {
        return this.sequence;
    }

    /**
     * Установка новой последовательности аккордов
     * @param {ChordSequence} sequence - Новая последовательность
     */
    setSequence(sequence) {
        this.sequence = sequence;
    }

    /**
     * Дублирование блока с новым ID
     * @param {string} [newId] - Новый ID для дубликата
     * @returns {TrackBlock} - Дубликат блока
     */
    duplicate(newId) {
        const newBlock = new TrackBlock({
            id: newId || `${this.id}_copy`,
            name: `${this.name} (copy)`,
            tonality: new Tonality(this.tonality.note, this.tonality.type),
            sequence: new ChordSequence(this.sequence.getItems())
        });
        return newBlock;
    }

    /**
     * Проверка наличия аккордов в блоке
     * @returns {boolean} - true, если блок содержит аккорды
     */
    hasChords() {
        return this.sequence.items.some(item => item.isChord());
    }

    /**
     * Создание объекта для сериализации
     * @returns {Object} - Объект для JSON-сериализации
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            tonality: this.tonality.toJSON(),
            sequence: this.sequence.toJSON()
        };
    }

    /**
     * Создание блока из объекта
     * @param {Object} obj - Объект с параметрами блока
     * @returns {TrackBlock} - Новый экземпляр блока
     */
    static fromJSON(obj) {
        return new TrackBlock({
            id: obj.id,
            name: obj.name,
            tonality: Tonality.fromJSON(obj.tonality),
            sequence: ChordSequence.fromJSON(obj.sequence)
        });
    }
}

/**
 * Класс, представляющий полную структуру трека
 */
export class TrackStructure {
    /**
     * @param {Array<TrackBlock>} blocks - Массив блоков трека
     * @param {string} [currentBlockId] - ID текущего активного блока
     */
    constructor(blocks = [], currentBlockId = null) {
        this.blocks = blocks;
        this.currentBlockId = currentBlockId || (blocks.length > 0 ? blocks[0].id : null);
    }

    /**
     * Добавление блока
     * @param {TrackBlock} block - Блок для добавления
     * @returns {TrackStructure} - this для цепочки вызовов
     */
    addBlock(block) {
        // Проверяем уникальность ID
        if (this.getBlockById(block.id)) {
            throw new Error(`Блок с ID ${block.id} уже существует`);
        }
        
        this.blocks.push(block);
        
        // Если это первый блок, делаем его текущим
        if (this.blocks.length === 1) {
            this.currentBlockId = block.id;
        }
        
        return this;
    }

    /**
     * Создание и добавление нового блока
     * @param {Object} options - Опции для нового блока
     * @returns {TrackBlock} - Созданный блок
     */
    createBlock(options = {}) {
        // Генерируем уникальный ID, если не предоставлен
        if (!options.id) {
            const letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[
                Math.min(25, this.blocks.length % 26)
            ];
            const number = Math.floor(this.blocks.length / 26) + 1;
            options.id = `${letter}${number}`;
        }
        
        const block = new TrackBlock(options);
        this.addBlock(block);
        return block;
    }

    /**
     * Удаление блока по ID
     * @param {string} blockId - ID блока для удаления
     * @returns {TrackBlock|null} - Удаленный блок или null
     */
    removeBlock(blockId) {
        const index = this.blocks.findIndex(block => block.id === blockId);
        if (index === -1) {
            return null;
        }
        
        const removedBlock = this.blocks.splice(index, 1)[0];
        
        // Если удаляем текущий блок, выбираем другой
        if (this.currentBlockId === blockId) {
            this.currentBlockId = this.blocks.length > 0 ? this.blocks[0].id : null;
        }
        
        return removedBlock;
    }

    /**
     * Получение блока по ID
     * @param {string} blockId - ID блока
     * @returns {TrackBlock|null} - Найденный блок или null
     */
    getBlockById(blockId) {
        return this.blocks.find(block => block.id === blockId) || null;
    }

    /**
     * Получение текущего активного блока
     * @returns {TrackBlock|null} - Текущий блок или null
     */
    getCurrentBlock() {
        return this.getBlockById(this.currentBlockId);
    }

    /**
     * Установка текущего активного блока
     * @param {string} blockId - ID блока
     * @returns {boolean} - true, если блок был найден и установлен
     */
    setCurrentBlock(blockId) {
        if (this.getBlockById(blockId)) {
            this.currentBlockId = blockId;
            return true;
        }
        return false;
    }

    /**
     * Получение всех блоков
     * @returns {Array<TrackBlock>} - Копия массива блоков
     */
    getAllBlocks() {
        return [...this.blocks];
    }

    /**
     * Дублирование блока
     * @param {string} blockId - ID блока для дублирования
     * @returns {TrackBlock|null} - Новый блок или null при ошибке
     */
    duplicateBlock(blockId) {
        const block = this.getBlockById(blockId);
        if (!block) {
            return null;
        }
        
        // Генерируем уникальный ID для нового блока
        const letter = block.id.match(/^[A-Z]/)[0];
        const number = parseInt(block.id.match(/\d+/)[0]);
        let newId = `${letter}${number + 1}`;
        
        // Проверяем, что такого ID еще нет
        let counter = 1;
        while (this.getBlockById(newId)) {
            newId = `${letter}${number}_copy${counter}`;
            counter++;
        }
        
        // Создаем дубликат и добавляем его
        const newBlock = block.duplicate(newId);
        this.addBlock(newBlock);
        
        return newBlock;
    }

    /**
     * Перемещение блока на новую позицию
     * @param {string} blockId - ID блока
     * @param {number} newIndex - Новая позиция
     * @returns {boolean} - true, если блок был перемещен
     */
    moveBlock(blockId, newIndex) {
        const currentIndex = this.blocks.findIndex(block => block.id === blockId);
        if (
            currentIndex === -1 ||
            newIndex < 0 ||
            newIndex >= this.blocks.length ||
            currentIndex === newIndex
        ) {
            return false;
        }
        
        const block = this.blocks.splice(currentIndex, 1)[0];
        this.blocks.splice(newIndex, 0, block);
        return true;
    }

    /**
     * Получение общего количества блоков
     * @returns {number} - Количество блоков
     */
    getBlockCount() {
        return this.blocks.length;
    }

    /**
     * Создание объекта для сериализации
     * @returns {Object} - Объект для JSON-сериализации
     */
    toJSON() {
        return {
            blocks: this.blocks.map(block => block.toJSON()),
            currentBlockId: this.currentBlockId
        };
    }

    /**
     * Создание структуры трека из объекта
     * @param {Object} obj - Объект с параметрами структуры
     * @returns {TrackStructure} - Новый экземпляр структуры
     */
    static fromJSON(obj) {
        const blocks = obj.blocks.map(blockData => TrackBlock.fromJSON(blockData));
        return new TrackStructure(blocks, obj.currentBlockId);
    }
}

// Экспортируем классы
export default { SequenceItem, ChordSequence, TrackBlock, TrackStructure };