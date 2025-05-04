import { BaseComponent } from './base.js';
import { EVENTS } from '../core/eventBus.js';
import { ChordSequence, SequenceItem } from '../models/sequence.js';
import { Chord } from '../models/chord.js';
import audioService from '../services/audioService.js';

/**
 * Компонент последовательности аккордов
 * Отвечает за отображение и управление последовательностью аккордов
 */
export class SequenceComponent extends BaseComponent {
    constructor(options) {
        super(options);
        
        // Инициализация состояния
        this.state = {
            currentBlockId: 'A1',
            blocks: {},
            ...this.state
        };
        
        // Привязка методов к контексту
        this.handleChordClick = this.handleChordClick.bind(this);
        this.handleChordRemove = this.handleChordRemove.bind(this);
        this.handleExportMidi = this.handleExportMidi.bind(this);
        this.handleExportText = this.handleExportText.bind(this);
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
        
        // Подписываемся на события добавления аккорда и паузы
        if (this.eventBus) {
            this.eventBus.subscribe(EVENTS.UI_CHORD_ADDED, () => {
                this.update();
            });
            
            this.eventBus.subscribe(EVENTS.UI_PAUSE_ADDED, () => {
                this.update();
            });
        }
    }
    
    /**
     * Получение текущей последовательности
     * @returns {Array} - Массив элементов последовательности
     */
    getCurrentSequence() {
        const { blocks, currentBlockId } = this.state;
        
        if (blocks && blocks[currentBlockId] && blocks[currentBlockId].sequence) {
            return blocks[currentBlockId].sequence;
        }
        
        return [];
    }
    
    /**
     * Обработчик клика по аккорду в последовательности
     * @param {number} index - Индекс аккорда
     */
    handleChordClick(index) {
        const sequence = this.getCurrentSequence();
        
        if (index >= 0 && index < sequence.length) {
            const item = sequence[index];
            
            // Если это не пауза, воспроизводим аккорд
            if (!item.isPause && item.chord) {
                // Создаем объект аккорда из данных
                const chord = new Chord(
                    item.chord.root,
                    item.chord.type,
                    {
                        degree: item.chord.degree,
                        function: item.chord.function,
                        inTonality: item.chord.inTonality
                    }
                );
                
                // Воспроизводим аккорд
                audioService.initialize().then(() => {
                    audioService.playChord(chord.getNotes(), 1);
                }).catch(error => {
                    console.error("Ошибка при инициализации аудио:", error);
                });
                
                // Выбираем аккорд
                if (this.store) {
                    this.store.set('selectedChord', chord);
                }
                
                // Публикуем событие
                if (this.eventBus) {
                    this.eventBus.publish(EVENTS.UI_CHORD_SELECTED, { chord });
                }
            }
        }
    }
    
    /**
     * Обработчик удаления аккорда из последовательности
     * @param {number} index - Индекс аккорда
     */
    handleChordRemove(index) {
        const { blocks, currentBlockId } = this.state;
        
        if (!blocks || !blocks[currentBlockId]) {
            return;
        }
        
        const sequence = this.getCurrentSequence();
        
        if (index >= 0 && index < sequence.length) {
            // Удаляем элемент из последовательности
            if (this.store) {
                const updatedBlocks = { ...blocks };
                const currentBlock = { ...updatedBlocks[currentBlockId] };
                
                currentBlock.sequence = [
                    ...sequence.slice(0, index),
                    ...sequence.slice(index + 1)
                ];
                
                updatedBlocks[currentBlockId] = currentBlock;
                this.store.set('blocks', updatedBlocks);
            }
            
            // Обновляем компонент
            this.update();
        }
    }
    
    /**
     * Обработчик экспорта в MIDI
     */
    handleExportMidi() {
        const { blocks, currentBlockId } = this.state;
        
        if (!blocks || !blocks[currentBlockId]) {
            return;
        }
        
        const sequence = this.getCurrentSequence();
        
        if (sequence.length === 0) {
            alert('Последовательность пуста. Нечего экспортировать.');
            return;
        }
        
        // Публикуем событие экспорта
        if (this.eventBus) {
            this.eventBus.publish(EVENTS.EXPORT_MIDI, {
                blockId: currentBlockId,
                sequence
            });
        }
    }
    
    /**
     * Обработчик экспорта в текст
     */
    handleExportText() {
        const { blocks, currentBlockId } = this.state;
        
        if (!blocks || !blocks[currentBlockId]) {
            return;
        }
        
        const sequence = this.getCurrentSequence();
        
        if (sequence.length === 0) {
            alert('Последовательность пуста. Нечего экспортировать.');
            return;
        }
        
        // Создаем текстовое представление последовательности
        const text = sequence.map(item => {
            if (item.isPause) {
                return `[Пауза]`;
            } else if (item.chord) {
                return item.chord.getName();
            }
            return '';
        }).join(' | ');
        
        // Создаем блок информации
        const tonality = blocks[currentBlockId].tonality;
        const tonalityName = `${tonality.note} ${tonality.type}`;
        
        const info = `Блок: ${currentBlockId}\nТональность: ${tonalityName}\nПоследовательность: ${text}`;
        
        // Копируем в буфер обмена
        navigator.clipboard.writeText(info).then(() => {
            alert('Последовательность скопирована в буфер обмена.');
        }).catch(err => {
            console.error('Ошибка при копировании в буфер обмена:', err);
            alert('Не удалось скопировать в буфер обмена. Вот текст последовательности:\n\n' + info);
        });
        
        // Публикуем событие экспорта
        if (this.eventBus) {
            this.eventBus.publish(EVENTS.EXPORT_TEXT, {
                blockId: currentBlockId,
                sequence,
                text: info
            });
        }
    }
    
    /**
     * Создание элемента аккорда в последовательности
     * @param {Object} item - Элемент последовательности
     * @param {number} index - Индекс элемента
     * @returns {HTMLElement} - DOM элемент аккорда
     */
    createSequenceChordElement(item, index) {
        // Определяем, пауза это или аккорд
        const isPause = item.isPause || !item.chord;
        
        // Создаем элемент
        const chordElement = this.createElement('div', {
            className: `sequence-chord ${isPause ? 'pause' : ''}`,
        });
        
        // Добавляем содержимое
        if (isPause) {
            // Для паузы добавляем иконку
            const pauseIcon = this.createElement('div', {
                className: 'pause-icon'
            });
            
            chordElement.appendChild(pauseIcon);
            chordElement.appendChild(this.createElement('div', {
                children: 'ПАУЗА'
            }));
        } else if (item.chord) {
            // Для аккорда добавляем название и функцию
            chordElement.appendChild(this.createElement('div', {
                className: 'chord-name',
                children: item.chord.getName()
            }));
            
            // Добавляем функцию, если она определена
            if (item.chord.function) {
                const badge = this.createElement('span', {
                    className: `function-badge ${item.chord.function.toLowerCase()}`,
                    children: item.chord.function
                });
                
                chordElement.appendChild(badge);
            }
        }
        
        // Добавляем обработчики событий
        this.addEventListenerWithCleanup(chordElement, 'click', () => {
            this.handleChordClick(index);
        });
        
        // Добавляем кнопку удаления
        const removeButton = this.createElement('button', {
            className: 'remove-button',
            children: '×',
            events: {
                click: (e) => {
                    e.stopPropagation(); // Предотвращаем всплытие события
                    this.handleChordRemove(index);
                }
            }
        });
        
        chordElement.appendChild(removeButton);
        
        return chordElement;
    }
    
    /**
     * Отрисовка компонента
     */
    render() {
        const sequence = this.getCurrentSequence();
        
        // Создаем фрагмент для компонента
        const fragment = document.createDocumentFragment();
        
        // Создаем элемент секции последовательности
        const sequenceSection = this.createElement('div', {
            className: 'sequence-section'
        });
        
        // Добавляем заголовок
        const title = this.createElement('h3', {
            children: 'Секвенция'
        });
        
        // Создаем контейнер для последовательности
        const sequenceContainer = this.createElement('div', {
            className: 'chord-sequence',
            attributes: {
                id: 'chord-sequence'
            }
        });
        
        // Заполняем последовательность
        if (sequence && sequence.length > 0) {
            sequence.forEach((item, index) => {
                const chordElement = this.createSequenceChordElement(item, index);
                sequenceContainer.appendChild(chordElement);
            });
        } else {
            // Если последовательность пуста, добавляем сообщение
            sequenceContainer.appendChild(this.createElement('div', {
                className: 'empty-sequence',
                children: 'Последовательность пуста. Выберите аккорд и нажмите "Добавить аккорд".'
            }));
        }
        
        // Добавляем кнопки экспорта
        const exportActions = this.createElement('div', {
            className: 'export-actions'
        });
        
        const exportMidiButton = this.createElement('button', {
            className: 'button',
            children: 'Экспорт в MIDI',
            events: {
                click: this.handleExportMidi
            }
        });
        
        const exportTextButton = this.createElement('button', {
            className: 'button',
            children: 'Экспорт в текст',
            events: {
                click: this.handleExportText
            }
        });
        
        exportActions.appendChild(exportMidiButton);
        exportActions.appendChild(exportTextButton);
        
        // Собираем секцию последовательности
        sequenceSection.appendChild(title);
        sequenceSection.appendChild(sequenceContainer);
        sequenceSection.appendChild(exportActions);
        
        // Добавляем секцию последовательности во фрагмент
        fragment.appendChild(sequenceSection);
        
        return fragment;
    }
}