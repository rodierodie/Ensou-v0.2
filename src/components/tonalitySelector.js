import { BaseComponent } from './base.js';
import { EVENTS } from '../core/eventBus.js';
import { Tonality, tonalityCollection } from '../models/tonality.js';

/**
 * Компонент выбора тональности
 * Отвечает за выбор тональности и отображение круга квинт
 */
export class TonalitySelectorComponent extends BaseComponent {
    constructor(options) {
        super(options);
        
        // Инициализация состояния
        this.state = {
            currentBlockId: 'A1',
            blocks: {},
            showTonalityCircle: true,
            ...this.state
        };
        
        // Привязка методов к контексту
        this.handleNoteChange = this.handleNoteChange.bind(this);
        this.handleTypeChange = this.handleTypeChange.bind(this);
        this.handleToggleCircle = this.handleToggleCircle.bind(this);
        this.handleTonalityClick = this.handleTonalityClick.bind(this);
        this.updateTonality = this.updateTonality.bind(this);
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
            
            this.subscribeToStore('showTonalityCircle', (showTonalityCircle) => {
                this.setState({ showTonalityCircle });
            });
        }
        
        // Подписываемся на события изменения тональности
        if (this.eventBus) {
            this.eventBus.subscribe(EVENTS.UI_TONALITY_CHANGED, this.updateTonality);
        }
    }
    
    /**
     * Получение текущей тональности
     * @returns {Tonality|null} - Текущая тональность или null
     */
    getCurrentTonality() {
        const { blocks, currentBlockId } = this.state;
        
        if (blocks && blocks[currentBlockId] && blocks[currentBlockId].tonality) {
            return blocks[currentBlockId].tonality;
        }
        
        return null;
    }
    
    /**
     * Обработчик изменения ноты тональности
     * @param {Event} event - Событие изменения
     */
    handleNoteChange(event) {
        const note = event.target.value;
        const tonality = this.getCurrentTonality();
        
        if (tonality) {
            this.updateTonality({
                note,
                type: tonality.type
            });
        }
    }
    
    /**
     * Обработчик изменения типа тональности
     * @param {Event} event - Событие изменения
     */
    handleTypeChange(event) {
        const type = event.target.value;
        const tonality = this.getCurrentTonality();
        
        if (tonality) {
            this.updateTonality({
                note: tonality.note,
                type
            });
        }
    }
    
    /**
     * Обработчик переключения отображения круга квинт
     */
    handleToggleCircle() {
        const showTonalityCircle = !this.state.showTonalityCircle;
        
        // Обновляем хранилище
        if (this.store) {
            this.store.set('showTonalityCircle', showTonalityCircle);
        }
        
        // Обновляем состояние
        this.setState({ showTonalityCircle });
    }
    
    /**
     * Обработчик клика по тональности в круге квинт
     * @param {string} note - Нота тональности
     * @param {string} type - Тип тональности
     */
    handleTonalityClick(note, type) {
        this.updateTonality({ note, type });
    }
    
    /**
     * Обновление тональности
     * @param {Object} tonalityData - Данные тональности
     */
    updateTonality(tonalityData) {
        const { note, type } = tonalityData;
        const { blocks, currentBlockId } = this.state;
        
        // Создаем новую тональность
        const newTonality = new Tonality(note, type);
        
        // Обновляем блок в хранилище
        if (this.store && blocks && blocks[currentBlockId]) {
            const updatedBlocks = { ...blocks };
            updatedBlocks[currentBlockId] = {
                ...updatedBlocks[currentBlockId],
                tonality: newTonality
            };
            
            this.store.set('blocks', updatedBlocks);
        }
        
        // Публикуем событие
        if (this.eventBus) {
            this.eventBus.publish(EVENTS.UI_TONALITY_CHANGED, {
                blockId: currentBlockId,
                tonality: newTonality
            });
        }
    }
    
    /**
     * Отрисовка круга квинт
     * @param {Tonality} currentTonality - Текущая тональность
     * @returns {HTMLElement} - DOM элемент круга квинт
     */
    renderTonalityCircle(currentTonality) {
        // Создаем элемент круга квинт
        const circleContainer = this.createElement('div', {
            className: 'tonality-circle'
        });
        
        // Определяем радиус и центр круга
        const radius = 140;
        const center = { x: 150, y: 150 };
        
        // Массив всех тональностей для круга
        const tonalities = [
            { note: 'C', x: center.x, y: center.y - radius }, // 12 часов
            { note: 'G', x: center.x + radius * 0.5, y: center.y - radius * 0.866 }, // 1 час
            { note: 'D', x: center.x + radius * 0.866, y: center.y - radius * 0.5 }, // 2 часа
            { note: 'A', x: center.x + radius, y: center.y }, // 3 часа
            { note: 'E', x: center.x + radius * 0.866, y: center.y + radius * 0.5 }, // 4 часа
            { note: 'B', x: center.x + radius * 0.5, y: center.y + radius * 0.866 }, // 5 часов
            { note: 'F#', x: center.x, y: center.y + radius }, // 6 часов
            { note: 'Db', x: center.x - radius * 0.5, y: center.y + radius * 0.866 }, // 7 часов
            { note: 'Ab', x: center.x - radius * 0.866, y: center.y + radius * 0.5 }, // 8 часов
            { note: 'Eb', x: center.x - radius, y: center.y }, // 9 часов
            { note: 'Bb', x: center.x - radius * 0.866, y: center.y - radius * 0.5 }, // 10 часов
            { note: 'F', x: center.x - radius * 0.5, y: center.y - radius * 0.866 } // 11 часов
        ];
        
        // Добавляем внутренний круг для минорных тональностей
        const innerRadius = radius * 0.7;
        const minorTonalities = tonalities.map(tonality => {
            return {
                note: tonality.note,
                x: center.x + (tonality.x - center.x) * (innerRadius / radius),
                y: center.y + (tonality.y - center.y) * (innerRadius / radius),
                isMinor: true
            };
        });
        
        // Создаем SVG элемент для круга
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '300');
        svg.setAttribute('height', '300');
        svg.setAttribute('viewBox', '0 0 300 300');
        
        // Добавляем внешний круг
        const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        outerCircle.setAttribute('cx', center.x);
        outerCircle.setAttribute('cy', center.y);
        outerCircle.setAttribute('r', radius);
        outerCircle.setAttribute('fill', 'none');
        outerCircle.setAttribute('stroke', '#eee');
        outerCircle.setAttribute('stroke-width', '1');
        svg.appendChild(outerCircle);
        
        // Добавляем внутренний круг
        const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        innerCircle.setAttribute('cx', center.x);
        innerCircle.setAttribute('cy', center.y);
        innerCircle.setAttribute('r', innerRadius);
        innerCircle.setAttribute('fill', 'none');
        innerCircle.setAttribute('stroke', '#eee');
        innerCircle.setAttribute('stroke-width', '1');
        svg.appendChild(innerCircle);
        
        // Функция для создания круга тональности
        const createTonalityCircle = (tonality, isActive) => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Создаем круг
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', tonality.x);
            circle.setAttribute('cy', tonality.y);
            circle.setAttribute('r', '20');
            circle.setAttribute('fill', isActive ? '#e6f7ff' : '#f9f9f9');
            circle.setAttribute('stroke', isActive ? '#1890ff' : '#eee');
            circle.setAttribute('stroke-width', isActive ? '2' : '1');
            
            // Создаем текст
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', tonality.x);
            text.setAttribute('y', tonality.y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', isActive ? '#1890ff' : '#666');
            text.textContent = tonality.note;
            
            // Добавляем элементы в группу
            group.appendChild(circle);
            group.appendChild(text);
            
            // Добавляем обработчик события
            group.addEventListener('click', () => {
                this.handleTonalityClick(tonality.note, tonality.isMinor ? 'moll' : 'dur');
            });
            
            return group;
        };
        
        // Добавляем мажорные тональности
        tonalities.forEach(tonality => {
            const isActive = currentTonality &&
                tonality.note === currentTonality.note &&
                currentTonality.type === 'dur';
            
            svg.appendChild(createTonalityCircle(tonality, isActive));
        });
        
        // Добавляем минорные тональности
        minorTonalities.forEach(tonality => {
            const isActive = currentTonality &&
                tonality.note === currentTonality.note &&
                currentTonality.type === 'moll';
            
            svg.appendChild(createTonalityCircle(tonality, isActive));
        });
        
        // Добавляем SVG в контейнер
        circleContainer.appendChild(svg);
        
        return circleContainer;
    }
    
    /**
     * Отрисовка компонента
     */
    render() {
        const { showTonalityCircle } = this.state;
        const currentTonality = this.getCurrentTonality() || new Tonality('C', 'dur');
        
        // Создаем фрагмент для компонента
        const fragment = document.createDocumentFragment();
        
        // Создаем элемент селектора тональности
        const tonalitySection = this.createElement('div', {
            className: 'tonality-section'
        });
        
        // Создаем селекторы тональности
        const tonalitySelectors = this.createElement('div', {
            className: 'tonality-selectors'
        });
        
        // Селектор ноты
        const noteSelector = this.createElement('select', {
            className: 'select',
            attributes: {
                id: 'tonality-note'
            },
            events: {
                change: this.handleNoteChange
            }
        });
        
        // Добавляем опции для нот
        ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach(note => {
            const option = this.createElement('option', {
                attributes: {
                    value: note,
                    selected: currentTonality.note === note ? 'selected' : null
                },
                children: `${note} (${this.getNoteLocalizedName(note)})`
            });
            
            noteSelector.appendChild(option);
        });
        
        // Селектор типа тональности
        const typeSelector = this.createElement('select', {
            className: 'select',
            attributes: {
                id: 'tonality-type'
            },
            events: {
                change: this.handleTypeChange
            }
        });
        
        // Добавляем опции для типов тональности
        [
            { value: 'dur', text: 'dur (Мажор)' },
            { value: 'moll', text: 'moll (Минор)' }
        ].forEach(type => {
            const option = this.createElement('option', {
                attributes: {
                    value: type.value,
                    selected: currentTonality.type === type.value ? 'selected' : null
                },
                children: type.text
            });
            
            typeSelector.appendChild(option);
        });
        
        // Кнопка переключения отображения круга квинт
        const toggleCircleButton = this.createElement('button', {
            className: 'button-link',
            attributes: {
                id: 'toggle-circle'
            },
            children: showTonalityCircle ? '× Скрыть круг тональностей' : '+ Показать круг тональностей',
            events: {
                click: this.handleToggleCircle
            }
        });
        
        // Добавляем селекторы
        tonalitySelectors.appendChild(noteSelector);
        tonalitySelectors.appendChild(typeSelector);
        tonalitySelectors.appendChild(toggleCircleButton);
        
        // Добавляем селекторы в секцию
        tonalitySection.appendChild(tonalitySelectors);
        
        // Добавляем круг квинт, если он включен
        if (showTonalityCircle) {
            tonalitySection.appendChild(this.renderTonalityCircle(currentTonality));
        }
        
        // Добавляем секцию тональности во фрагмент
        fragment.appendChild(tonalitySection);
        
        return fragment;
    }
    
    /**
     * Получение локализованного названия ноты
     * @param {string} note - Нота
     * @returns {string} - Локализованное название ноты
     */
    getNoteLocalizedName(note) {
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
        
        return noteNames[note] || note;
    }
}

// Экспортируем компонент
export default TonalitySelectorComponent;