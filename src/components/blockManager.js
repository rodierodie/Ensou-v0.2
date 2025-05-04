import { BaseComponent } from './base.js';
import { EVENTS } from '../core/eventBus.js';
import { TrackBlock } from '../models/sequence.js';
import { Tonality } from '../models/tonality.js';

/**
 * Компонент управления блоками трека
 * Отвечает за отображение вкладок блоков и их переключение
 */
export class BlockManagerComponent extends BaseComponent {
    constructor(options) {
        super(options);
        
        // Инициализация состояния
        this.state = {
            blocks: {},
            currentBlockId: 'A1',
            ...this.state
        };
        
        // Привязка методов к контексту
        this.handleBlockClick = this.handleBlockClick.bind(this);
        this.handleAddBlockClick = this.handleAddBlockClick.bind(this);
        this.handleDuplicateBlock = this.handleDuplicateBlock.bind(this);
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
        }
        
        // Подписываемся на события управления блоками
        if (this.eventBus) {
            this.eventBus.subscribe(EVENTS.UI_BLOCK_SELECTED, this.handleBlockClick);
        }
    }
    
    /**
     * Обработчик клика по блоку
     * @param {Object} data - Данные события
     */
    handleBlockClick(data) {
        const blockId = data.blockId || data;
        
        // Проверяем, существует ли такой блок
        if (this.state.blocks && this.state.blocks[blockId]) {
            // Обновляем хранилище
            if (this.store) {
                this.store.set('currentBlockId', blockId);
            }
            
            // Обновляем состояние
            this.setState({ currentBlockId: blockId });
        }
    }
    
    /**
     * Обработчик клика по кнопке добавления блока
     */
    handleAddBlockClick() {
        // Генерируем ID для нового блока
        const blocks = this.state.blocks || {};
        const blockIds = Object.keys(blocks);
        
        let newBlockLetter = 'A';
        let newBlockNumber = 1;
        
        if (blockIds.length > 0) {
            // Находим последний блок
            const lastBlockId = blockIds[blockIds.length - 1];
            const match = lastBlockId.match(/^([A-Z])(\d+)$/);
            
            if (match) {
                const letter = match[1];
                const number = parseInt(match[2], 10);
                
                // Если это последняя буква, переходим к следующей букве
                if (number >= 9) {
                    newBlockLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
                    if (newBlockLetter > 'Z') {
                        newBlockLetter = 'A';
                    }
                    newBlockNumber = 1;
                } else {
                    newBlockLetter = letter;
                    newBlockNumber = number + 1;
                }
            }
        }
        
        const newBlockId = `${newBlockLetter}${newBlockNumber}`;
        
        // Создаем новый блок
        const newBlock = new TrackBlock({
            id: newBlockId,
            name: newBlockId,
            tonality: new Tonality('C', 'dur')
        });
        
        // Добавляем блок в хранилище
        if (this.store) {
            const updatedBlocks = { ...blocks };
            updatedBlocks[newBlockId] = newBlock;
            
            this.store.set('blocks', updatedBlocks);
            this.store.set('currentBlockId', newBlockId);
        }
        
        // Публикуем событие
        if (this.eventBus) {
            this.eventBus.publish(EVENTS.UI_BLOCK_SELECTED, { blockId: newBlockId });
        }
    }
    
    /**
     * Обработчик дублирования блока
     * @param {string} blockId - ID блока для дублирования
     */
    handleDuplicateBlock(blockId) {
        const blocks = this.state.blocks || {};
        const block = blocks[blockId];
        
        if (!block) {
            return;
        }
        
        // Генерируем ID для нового блока
        const letter = blockId.match(/^[A-Z]/)[0];
        const number = parseInt(blockId.match(/\d+/)[0], 10);
        
        let newBlockId = `${letter}${number + 1}`;
        let counter = 1;
        
        // Проверяем, что такого ID еще нет
        while (blocks[newBlockId]) {
            newBlockId = `${letter}${number}_copy${counter}`;
            counter++;
        }
        
        // Дублируем блок
        const newBlock = block.duplicate();
        newBlock.id = newBlockId;
        newBlock.name = `${block.name} (копия)`;
        
        // Добавляем блок в хранилище
        if (this.store) {
            const updatedBlocks = { ...blocks };
            updatedBlocks[newBlockId] = newBlock;
            
            this.store.set('blocks', updatedBlocks);
            this.store.set('currentBlockId', newBlockId);
        }
        
        // Публикуем событие
        if (this.eventBus) {
            this.eventBus.publish(EVENTS.UI_BLOCK_SELECTED, { blockId: newBlockId });
        }
    }
    
    /**
     * Отрисовка компонента
     */
    render() {
        const { blocks, currentBlockId } = this.state;
        
        // Создаем фрагмент для компонента
        const fragment = document.createDocumentFragment();
        
        // Создаем элемент менеджера блоков
        const blockManager = this.createElement('div', {
            className: 'block-manager'
        });
        
        // Создаем вкладки блоков
        const blockTabs = this.createElement('div', {
            className: 'block-tabs'
        });
        
        // Добавляем вкладки для каждого блока
        if (blocks) {
            Object.keys(blocks).forEach(blockId => {
                const block = blocks[blockId];
                
                const blockTab = this.createElement('div', {
                    className: `block-tab ${blockId === currentBlockId ? 'active' : ''}`,
                    attributes: {
                        'data-block': blockId
                    },
                    children: block.name || blockId,
                    events: {
                        click: () => this.handleBlockClick(blockId)
                    }
                });
                
                blockTabs.appendChild(blockTab);
            });
        }
        
        // Добавляем кнопку создания нового блока
        const addBlockButton = this.createElement('div', {
            className: 'block-tab add-block',
            children: '+',
            events: {
                click: this.handleAddBlockClick
            }
        });
        
        blockTabs.appendChild(addBlockButton);
        
        // Добавляем вкладки в менеджер блоков
        blockManager.appendChild(blockTabs);
        
        // Добавляем менеджер блоков во фрагмент
        fragment.appendChild(blockManager);
        
        return fragment;
    }
}

// Экспортируем компонент
export default BlockManagerComponent;