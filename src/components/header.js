import { BaseComponent } from './base.js';
import { EVENTS } from '../core/eventBus.js';
import audioService from '../services/audioService.js';

/**
 * Компонент заголовка приложения
 * Отвечает за логотип и элементы управления воспроизведением
 */
export class HeaderComponent extends BaseComponent {
    constructor(options) {
        super(options);
        
        // Инициализация состояния
        this.state = {
            tempo: 120,
            arpeggiatorEnabled: false,
            metronomeEnabled: false,
            isPlaying: false,
            ...this.state
        };
        
        // Привязка методов к контексту
        this.handleTempoChange = this.handleTempoChange.bind(this);
        this.handleArpeggiatorToggle = this.handleArpeggiatorToggle.bind(this);
        this.handleMetronomeToggle = this.handleMetronomeToggle.bind(this);
        this.handlePlayClick = this.handlePlayClick.bind(this);
        this.handleStopClick = this.handleStopClick.bind(this);
    }
    
    /**
     * Подписка на события и хранилище
     */
    afterMount() {
        // Подписываемся на изменения темпа в хранилище
        if (this.store) {
            this.subscribeToStore('tempo', (tempo) => {
                this.setState({ tempo });
            });
            
            this.subscribeToStore('arpeggiatorEnabled', (arpeggiatorEnabled) => {
                this.setState({ arpeggiatorEnabled });
            });
            
            this.subscribeToStore('metronomeEnabled', (metronomeEnabled) => {
                this.setState({ metronomeEnabled });
            });
            
            this.subscribeToStore('isPlaying', (isPlaying) => {
                this.setState({ isPlaying });
            });
        }
        
        // Подписываемся на события воспроизведения
        if (this.eventBus) {
            this.subscribeToEvent(EVENTS.PLAYBACK_START, () => {
                this.setState({ isPlaying: true });
            });
            
            this.subscribeToEvent(EVENTS.PLAYBACK_STOP, () => {
                this.setState({ isPlaying: false });
            });
        }
    }
    
    /**
     * Обработчик изменения темпа
     * @param {Event} event - Событие изменения
     */
    handleTempoChange(event) {
        const tempo = parseInt(event.target.value, 10);
        
        // Ограничиваем диапазон от 40 до 240 BPM
        const validTempo = Math.max(40, Math.min(240, tempo));
        
        // Обновляем хранилище
        if (this.store) {
            this.store.set('tempo', validTempo);
        }
        
        // Обновляем аудио сервис
        audioService.setTempo(validTempo);
        
        // Публикуем событие
        if (this.eventBus) {
            this.eventBus.publish(EVENTS.UI_TEMPO_CHANGED, validTempo);
        }
    }
    
    /**
     * Обработчик переключения арпеджиатора
     */
    handleArpeggiatorToggle() {
        const newState = !this.state.arpeggiatorEnabled;
        
        // Обновляем хранилище
        if (this.store) {
            this.store.set('arpeggiatorEnabled', newState);
        }
        
        // Обновляем аудио сервис
        audioService.toggleArpeggiator(newState);
        
        // Публикуем событие
        if (this.eventBus) {
            this.eventBus.publish(EVENTS.UI_ARPEGGIATOR_TOGGLED, newState);
        }
    }
    
    /**
     * Обработчик переключения метронома
     */
    handleMetronomeToggle() {
        const newState = !this.state.metronomeEnabled;
        
        // Обновляем хранилище
        if (this.store) {
            this.store.set('metronomeEnabled', newState);
        }
        
        // Обновляем аудио сервис
        audioService.toggleMetronome(newState);
        
        // Публикуем событие
        if (this.eventBus) {
            this.eventBus.publish(EVENTS.UI_METRONOME_TOGGLED, newState);
        }
    }
    
    /**
     * Обработчик нажатия на кнопку воспроизведения
     */
    handlePlayClick() {
        // Инициализируем аудио сервис
        audioService.initialize().then(() => {
            // Получаем текущий блок и его последовательность
            const currentBlock = this.store ? this.store.get('currentBlock') : null;
            const blocks = this.store ? this.store.get('blocks') : {};
            
            if (currentBlock && blocks && blocks[currentBlock]) {
                const sequence = blocks[currentBlock].sequence || [];
                
                // Если последовательность не пуста, воспроизводим её
                if (sequence.length > 0) {
                    // Публикуем событие начала воспроизведения
                    if (this.eventBus) {
                        this.eventBus.publish(EVENTS.PLAYBACK_START, { blockId: currentBlock });
                    }
                    
                    // Воспроизводим последовательность
                    audioService.playSequence(sequence).then(() => {
                        // Публикуем событие окончания воспроизведения
                        if (this.eventBus) {
                            this.eventBus.publish(EVENTS.PLAYBACK_STOP, { blockId: currentBlock });
                        }
                    });
                }
            }
        });
    }
    
    /**
     * Обработчик нажатия на кнопку остановки
     */
    handleStopClick() {
        // Останавливаем воспроизведение
        audioService.stopPlayback();
        
        // Публикуем событие
        if (this.eventBus) {
            this.eventBus.publish(EVENTS.PLAYBACK_STOP, {});
        }
    }
    
    /**
     * Отрисовка компонента
     */
    render() {
        const { tempo, arpeggiatorEnabled, isPlaying } = this.state;
        
        // Создаем фрагмент для компонента
        const fragment = document.createDocumentFragment();
        
        // Создаем элемент заголовка
        const header = this.createElement('header', {
            className: 'header'
        });
        
        // Добавляем логотип
        const logo = this.createElement('div', {
            className: 'logo'
        });
        
        const logoSquare = this.createElement('div', {
            className: 'logo-square'
        });
        
        const logoText = this.createElement('h1', {
            children: 'ChordPlayer'
        });
        
        logo.appendChild(logoSquare);
        logo.appendChild(logoText);
        
        // Добавляем элементы управления воспроизведением
        const playbackControls = this.createElement('div', {
            className: 'playback-controls'
        });
        
        // Элемент управления темпом
        const tempoControl = this.createElement('div', {
            className: 'tempo-control'
        });
        
        const tempoInput = this.createElement('input', {
            attributes: {
                type: 'number',
                id: 'tempo',
                min: '40',
                max: '240',
                value: tempo.toString()
            },
            events: {
                change: this.handleTempoChange,
                input: this.handleTempoChange
            }
        });
        
        const tempoLabel = this.createElement('span', {
            children: 'BPM'
        });
        
        tempoControl.appendChild(tempoInput);
        tempoControl.appendChild(tempoLabel);
        
        // Переключатель арпеджиатора
        const arpeggiatorToggle = this.createElement('div', {
            className: 'arpeggiator-toggle',
            events: {
                click: this.handleArpeggiatorToggle
            }
        });
        
        const arpeggiatorDot = this.createElement('span', {
            className: `dot ${arpeggiatorEnabled ? 'active' : ''}`
        });
        
        const arpeggiatorLabel = this.createElement('span', {
            children: `ARP: ${arpeggiatorEnabled ? 'On' : 'Off'}`
        });
        
        arpeggiatorToggle.appendChild(arpeggiatorDot);
        arpeggiatorToggle.appendChild(arpeggiatorLabel);
        
        // Кнопки воспроизведения
        const playbackButtons = this.createElement('div', {
            className: 'playback-buttons'
        });
        
        const playButton = this.createElement('button', {
            className: 'play-button',
            attributes: {
                id: 'play-button',
                disabled: isPlaying ? 'disabled' : null
            },
            events: {
                click: this.handlePlayClick
            }
        });
        
        const playIcon = this.createElement('span', {
            className: 'play-icon'
        });
        
        playButton.appendChild(playIcon);
        
        const stopButton = this.createElement('button', {
            className: 'stop-button',
            attributes: {
                id: 'stop-button',
                disabled: !isPlaying ? 'disabled' : null
            },
            events: {
                click: this.handleStopClick
            }
        });
        
        const stopIcon = this.createElement('span', {
            className: 'stop-icon'
        });
        
        stopButton.appendChild(stopIcon);
        
        playbackButtons.appendChild(playButton);
        playbackButtons.appendChild(stopButton);
        
        // Собираем элементы управления
        playbackControls.appendChild(tempoControl);
        playbackControls.appendChild(arpeggiatorToggle);
        playbackControls.appendChild(playbackButtons);
        
        // Собираем заголовок
        header.appendChild(logo);
        header.appendChild(playbackControls);
        
        // Добавляем заголовок во фрагмент
        fragment.appendChild(header);
        
        return fragment;
    }
}

// Экспортируем компонент
export default HeaderComponent;