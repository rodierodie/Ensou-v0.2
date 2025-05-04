import { BaseComponent } from './base.js';
import { EVENTS } from '../core/eventBus.js';
import { Chord, ChordCollection } from '../models/chord.js';
import { Tonality } from '../models/tonality.js';
import audioService from '../services/audioService.js';

/**
 * Компонент сетки аккордов
 * Отвечает за отображение и выбор аккордов
 */
export class ChordGridComponent extends BaseComponent {
    constructor(options) {
        super(options);
        
        // Инициализация состояния
        this.state = {
            currentBlockId: 'A1',
            blocks: {},
            selectedChord: null,
            ...this.state
        };
        
        // Привязка методов к контексту
        this.handleChordClick = this.handleChordClick.bind(this);
        this.handleAddChord = this.handleAddChord.bind(this);
        this.handleAddPause = this.handleAddPause.bind(this);
        this.handleHideInfo = this.handleHideInfo.bind(this);
    }
    
    /**
     * Подписка на события и хранилище
     */
    afterMount() {
        // Подписываемся на изменения блоков и текущего блока в хранилище
        if (this.store) {
            this.subscribeToStore('blocks', (blocks) => {
                this.setState({ blocks });
            });
            
            this.subscribeToStore('currentBlockId', (currentBlockId) => {
                this.setState({ currentBlockId });
            });
            
            this.subscribeToStore('selectedChord', (selectedChord) => {
                this.setState({ selectedChord });
            });
        }
        
        // Подписываемся на события выбора аккорда
        if (this.eventBus) {
            this.eventBus.subscribe(EVENTS.UI_CHORD_SELECTED, this.handleChordClick);
        }
    }
    
    /**
     * Получение текущей тональности
     * @returns {Tonality|null} - Текущая тональность или null
     */
    getCurrentTonality() {
        const { blocks, currentBlockId } = this.state;
        
        if (blocks && blocks[currentBlockId] && blocks[currentBlockId].tonality) {
            return new Tonality(
                blocks[currentBlockId].tonality.note,
                blocks[currentBlockId].tonality.type
            );
        }
        
        return null;
    }
    
    /**
     * Получение коллекции аккордов для текущей тональности
     * @returns {ChordCollection|null} - Коллекция аккордов или null
     */
    getChordCollection() {
        const tonality = this.getCurrentTonality();
        
        if (tonality) {
            return new ChordCollection(tonality);
        }
        
        return null;
    }
    
    /**
     * Обработчик клика по аккорду
     * @param {Object} data - Данные события или объект аккорда
     */
    handleChordClick(data) {
        let chord;
        
        // Проверяем формат данных
        if (data instanceof Chord) {
            chord = data;
        } else if (data.chord) {
            chord = data.chord;
        } else if (data.root && data.type) {
            chord = new Chord(data.root, data.type);
        } else {
            return;
        }
        
        // Воспроизводим аккорд
        audioService.initialize().then(() => {
            audioService.playChord(chord.getNotes(), 1);
        });
        
        // Обновляем выбранный аккорд в хранилище
        if (this.store) {
            this.store.set('selectedChord', chord);
        }
        
        // Публикуем событие
        if (this.eventBus) {
            this.eventBus.publish(EVENTS.UI_CHORD_SELECTED, { chord });
        }
    }
    
    /**
     * Обработчик добавления аккорда в последовательность
     */
    handleAddChord() {
        const { selectedChord, blocks, currentBlockId } = this.state;
        
        if (!selectedChord || !blocks || !blocks[currentBlockId]) {
            return;
        }
        
        // Добавляем аккорд в последовательность текущего блока
        if (this.store) {
            const updatedBlocks = { ...blocks };
            const currentBlock = { ...updatedBlocks[currentBlockId] };
            
            // Если последовательность не определена, создаем ее
            if (!currentBlock.sequence) {
                currentBlock.sequence = [];
            }
            
            // Добавляем аккорд в последовательность
            currentBlock.sequence.push({
                chord: selectedChord,
                duration: 1,
                isPause: false
            });
            
            updatedBlocks[currentBlockId] = currentBlock;
            this.store.set('blocks', updatedBlocks);
        }
        
        // Публикуем событие
        if (this.eventBus) {
            this.eventBus.publish(EVENTS.UI_CHORD_ADDED, {
                blockId: currentBlockId,
                chord: selectedChord
            });
        }
    }
    
    /**
     * Обработчик добавления паузы в последовательность
     */
    handleAddPause() {
        const { blocks, currentBlockId } = this.state;
        
        if (!blocks || !blocks[currentBlockId]) {
            return;
        }
        
        // Добавляем паузу в последовательность текущего блока
        if (this.store) {
            const updatedBlocks = { ...blocks };
            const currentBlock = { ...updatedBlocks[currentBlockId] };
            
            // Если последовательность не определена, создаем ее
            if (!currentBlock.sequence) {
                currentBlock.sequence = [];
            }
            
            // Добавляем паузу в последовательность
            currentBlock.sequence.push({
                chord: null,
                duration: 1,
                isPause: true
            });
            
            updatedBlocks[currentBlockId] = currentBlock;
            this.store.set('blocks', updatedBlocks);
        }
        
        // Публикуем событие
        if (this.eventBus) {
            this.eventBus.publish(EVENTS.UI_PAUSE_ADDED, {
                blockId: currentBlockId
            });
        }
    }
    
    /**
     * Обработчик скрытия информации об аккорде
     */
    handleHideInfo() {
        // Очищаем выбранный аккорд в хранилище
        if (this.store) {
            this.store.set('selectedChord', null);
        }
    }
    
    /**
     * Создание элемента аккорда
     * @param {Chord} chord - Аккорд
     * @param {string} functionColor - Цвет функции
     * @param {boolean} isSelected - Выбран ли аккорд
     * @returns {HTMLElement} - DOM элемент аккорда
     */
    createChordElement(chord, functionColor, isSelected) {
        // Определяем цвет границы на основе функции
        const borderColor = functionColor || '#ccc';
        
        // Создаем элемент аккорда
        const chordElement = this.createElement('div', {
            className: `chord-item ${isSelected ? 'selected' : ''}`,
            attributes: {
                style: `border-color: ${borderColor}; ${isSelected ? 'background-color: #f0f7ff;' : ''}`
            },
            children: chord.getName(),
            events: {
                click: () => this.handleChordClick(chord)
            }
        });
        
        // Добавляем значок функции, если она определена
        if (chord.function) {
            const badge = this.createElement('span', {
                className: `chord-badge ${chord.function.toLowerCase()}`,
                children: chord.function
            });
            
            chordElement.appendChild(badge);
        }
        
        return chordElement;
    }
    
    /**
     * Отрисовка информации об аккорде
     * @param {Chord} chord - Аккорд
     * @returns {HTMLElement} - DOM элемент с информацией об аккорде
     */
    renderChordInfo(chord) {
        // Если аккорд не выбран, возвращаем пустой элемент
        if (!chord) {
            return this.createElement('div', {
                className: 'chord-info',
                children: 'Выберите аккорд для отображения информации'
            });
        }
        
        // Получаем тональность
        const tonality = this.getCurrentTonality();
        
        // Находим функции аккорда в разных тональностях
        const chordFunctions = [];
        
        if (tonality) {
            // Добавляем функцию в текущей тональности
            const functionInfo = chord.getChordFunction(tonality);
            
            if (functionInfo.function) {
                chordFunctions.push({
                    function: functionInfo.function,
                    romanNumeral: functionInfo.romanNumeral,
                    degree: functionInfo.degree,
                    tonality: tonality.getName()
                });
            }
            
            // Добавляем функции в родственных тональностях
            const relatedTonalities = tonality.getRelatedTonalities();
            
            relatedTonalities.forEach(relatedInfo => {
                const relatedTonality = new Tonality(relatedInfo.note, relatedInfo.type);
                const relatedFunction = chord.getChordFunction(relatedTonality);
                
                if (relatedFunction.function) {
                    chordFunctions.push({
                        function: relatedFunction.function,
                        romanNumeral: relatedFunction.romanNumeral,
                        degree: relatedFunction.degree,
                        tonality: relatedTonality.getName()
                    });
                }
            });
        }
        
        // Создаем элемент информации об аккорде
        const infoElement = this.createElement('div', {
            className: 'chord-info'
        });
        
        // Добавляем заголовок
        const title = this.createElement('h3', {
            children: `${chord.getName()} (${chord.getLocalizedName()})`
        });
        
        // Добавляем ноты аккорда
        const notes = this.createElement('p', {
            children: chord.getNotes().join(', ')
        });
        
        // Добавляем функции аккорда
        const functionsContainer = this.createElement('div', {
            className: 'chord-functions'
        });
        
        chordFunctions.forEach(funcInfo => {
            const functionItem = this.createElement('div', {
                className: 'function-item'
            });
            
            const functionBadge = this.createElement('span', {
                className: `function-badge ${funcInfo.function.toLowerCase()}`,
                children: funcInfo.function
            });
            
            const functionDesc = this.createElement('span', {
                className: 'function-desc',
                children: `(${funcInfo.romanNumeral} ступень) в тональности ${funcInfo.tonality}`
            });
            
            functionItem.appendChild(functionBadge);
            functionItem.appendChild(functionDesc);
            
            functionsContainer.appendChild(functionItem);
        });
        
        // Добавляем кнопки действий
        const actionsContainer = this.createElement('div', {
            className: 'chord-actions'
        });
        
        const addChordButton = this.createElement('button', {
            className: 'button',
            children: '+ Добавить аккорд',
            events: {
                click: this.handleAddChord
            }
        });
        
        const addPauseButton = this.createElement('button', {
            className: 'button',
            children: 'II Добавить паузу',
            events: {
                click: this.handleAddPause
            }
        });
        
        const hideInfoButton = this.createElement('button', {
            className: 'button-link',
            children: 'Скрыть инфо',
            events: {
                click: this.handleHideInfo
            }
        });
        
        actionsContainer.appendChild(addChordButton);
        actionsContainer.appendChild(addPauseButton);
        actionsContainer.appendChild(hideInfoButton);
        
        // Собираем информацию об аккорде
        infoElement.appendChild(title);
        infoElement.appendChild(notes);
        infoElement.appendChild(functionsContainer);
        infoElement.appendChild(actionsContainer);
        
        return infoElement;
    }
    
    /**
     * Отрисовка компонента
     */
    render() {
        const { selectedChord } = this.state;
        const chordCollection = this.getChordCollection();
        
        // Создаем фрагмент для компонента
        const fragment = document.createDocumentFragment();
        
        // Создаем элемент секции аккордов
        const chordsSection = this.createElement('div', {
            className: 'chords-section'
        });
        
        // Создаем секцию основных аккордов
        const basicChordsSection = this.createElement('div', {
            className: 'basic-chords'
        });
        
        const basicChordsTitle = this.createElement('h3', {
            children: 'Основные аккорды'
        });
        
        const basicChordsGrid = this.createElement('div', {
            className: 'chord-grid',
            attributes: {
                id: 'basic-chords-grid'
            }
        });
        
        basicChordsSection.appendChild(basicChordsTitle);
        basicChordsSection.appendChild(basicChordsGrid);
        
        // Создаем секцию септаккордов
        const seventhChordsSection = this.createElement('div', {
            className: 'seventh-chords'
        });
        
        const seventhChordsTitle = this.createElement('h3', {
            children: 'Септаккорды'
        });
        
        const seventhChordsGrid = this.createElement('div', {
            className: 'chord-grid',
            attributes: {
                id: 'seventh-chords-grid'
            }
        });
        
        seventhChordsSection.appendChild(seventhChordsTitle);
        seventhChordsSection.appendChild(seventhChordsGrid);
        
        // Заполняем сетки аккордов, если есть коллекция
        if (chordCollection) {
            // Получаем базовые аккорды
            const basicChords = chordCollection.getBasicChords();
            
            basicChords.forEach(chord => {
                const isSelected = selectedChord && 
                                  selectedChord.root === chord.root && 
                                  selectedChord.type === chord.type;
                
                const functionColor = chord.getFunctionColor();
                const chordElement = this.createChordElement(chord, functionColor, isSelected);
                
                basicChordsGrid.appendChild(chordElement);
            });
            
            // Получаем септаккорды
            const seventhChords = chordCollection.getSeventhChords();
            
            seventhChords.forEach(chord => {
                const isSelected = selectedChord && 
                                  selectedChord.root === chord.root && 
                                  selectedChord.type === chord.type;
                
                const functionColor = chord.getFunctionColor();
                const chordElement = this.createChordElement(chord, functionColor, isSelected);
                
                seventhChordsGrid.appendChild(chordElement);
            });
        }
        
        // Добавляем информацию об аккорде
        const chordInfo = this.renderChordInfo(selectedChord);
        
        // Собираем секцию аккордов
        chordsSection.appendChild(basicChordsSection);
        chordsSection.appendChild(seventhChordsSection);
        chordsSection.appendChild(chordInfo);
        
        // Добавляем секцию аккордов во фрагмент
        fragment.appendChild(chordsSection);
        
        return fragment;
    }
}

// Экспортируем компонент
export default ChordGridComponent;