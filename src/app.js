import store from './core/store.js';
import eventBus, { EVENTS } from './core/eventBus.js';
import errorHandler from './core/errorHandler.js';

import { Tonality } from './models/tonality.js';
import { TrackBlock } from './models/sequence.js';

import HeaderComponent from './components/header.js';
import BlockManagerComponent from './components/blockManager.js';
import TonalitySelectorComponent from './components/tonalitySelector.js';
import ChordGridComponent from './components/chordGrid.js';
import SequenceComponent from './components/sequenceComponent.js';

import audioService from './services/audioService.js';
import storageService from './services/storageService.js';
import exportService from './services/exportService.js';

/**
 * Главный класс приложения ChordPlayer
 * Инициализирует и координирует работу всех компонентов
 */
class ChordPlayerApp {
    constructor() {
        this.components = {};
        this.store = store;
        this.eventBus = eventBus;
        this.errorHandler = errorHandler;
        
        // Привязка методов к контексту
        this.init = this.init.bind(this);
        this.createInitialState = this.createInitialState.bind(this);
        this.loadState = this.loadState.bind(this);
        this.saveState = this.saveState.bind(this);
        this.handleExportMidi = this.handleExportMidi.bind(this);
        this.handleExportText = this.handleExportText.bind(this);
        this.handleExportProject = this.handleExportProject.bind(this);
        this.handleImportProject = this.handleImportProject.bind(this);
    }
    
    /**
     * Инициализация приложения
     */
    init() {
        console.log('Инициализация ChordPlayer...');
        
        // Регистрируем обработчик ошибок
        this.errorHandler.addErrorCallback((error) => {
            console.error('Перехваченная ошибка:', error);
        });
        
        // Пробуем загрузить сохраненное состояние или создаем начальное
        this.loadState() || this.createInitialState();
        
        // Инициализируем аудио сервис
        audioService.initialize().catch(error => {
            console.error('Ошибка инициализации аудио сервиса:', error);
        });
        
        // Инициализируем компоненты
        this.initComponents();
        
        // Подписываемся на события экспорта и импорта
        this.subscribeToEvents();
        
        // Настраиваем автосохранение
        this.setupAutoSave();
        
        console.log('ChordPlayer инициализирован');
    }
    
    /**
     * Создание начального состояния приложения
     */
    createInitialState() {
        console.log('Создание начального состояния...');
        
        // Создаем начальные блоки
        const blocks = {
            'A1': new TrackBlock({
                id: 'A1',
                name: 'A1',
                tonality: new Tonality('E', 'moll')
            }),
            'B1': new TrackBlock({
                id: 'B1',
                name: 'B1',
                tonality: new Tonality('G', 'dur')
            })
        };
        
        // Устанавливаем начальное состояние
        this.store.update({
            currentBlockId: 'A1',
            blocks: blocks,
            tempo: 120,
            arpeggiatorEnabled: false,
            metronomeEnabled: false,
            showTonalityCircle: true
        });
        
        return true;
    }
    
    /**
     * Загрузка сохраненного состояния
     * @returns {boolean} - Успешно ли загрузка
     */
    loadState() {
        console.log('Загрузка сохраненного состояния...');
        
        const savedState = storageService.loadState();
        
        if (savedState) {
            this.store.update(savedState);
            console.log('Состояние загружено');
            return true;
        }
        
        console.log('Нет сохраненного состояния');
        return false;
    }
    
    /**
     * Сохранение текущего состояния
     */
    saveState() {
        console.log('Сохранение состояния...');
        
        const state = this.store.getState();
        storageService.saveState(state);
    }
    
    /**
     * Инициализация компонентов приложения
     */
    initComponents() {
        // Настройки для компонентов
        const componentOptions = {
            store: this.store,
            eventBus: this.eventBus
        };
        
        // Инициализация заголовка
        this.components.header = new HeaderComponent({
            ...componentOptions,
            container: '.header'
        });
        
        // Инициализация менеджера блоков
        this.components.blockManager = new BlockManagerComponent({
            ...componentOptions,
            container: '.block-manager'
        });
        
        // Инициализация селектора тональности
        this.components.tonalitySelector = new TonalitySelectorComponent({
            ...componentOptions,
            container: '.tonality-section'
        });
        
        // Инициализация сетки аккордов
        this.components.chordGrid = new ChordGridComponent({
            ...componentOptions,
            container: '.chords-section'
        });
        
        // Инициализация последовательности
        this.components.sequence = new SequenceComponent({
            ...componentOptions,
            container: '.sequence-section'
        });
        
        // Монтируем компоненты
        Object.values(this.components).forEach(component => {
            try {
                component.mount();
            } catch (error) {
                console.error('Ошибка монтирования компонента:', error);
            }
        });
    }
    
    /**
     * Подписка на события экспорта и импорта
     */
    subscribeToEvents() {
        // Подписываемся на экспорт в MIDI
        this.eventBus.subscribe(EVENTS.EXPORT_MIDI, this.handleExportMidi);
        
        // Подписываемся на экспорт в текст
        this.eventBus.subscribe(EVENTS.EXPORT_TEXT, this.handleExportText);
        
        // Подписываемся на экспорт проекта
        this.eventBus.subscribe(EVENTS.EXPORT_PROJECT, this.handleExportProject);
        
        // Подписываемся на импорт проекта
        this.eventBus.subscribe(EVENTS.IMPORT_PROJECT, this.handleImportProject);
        
        // Подписываемся на сохранение
        this.eventBus.subscribe(EVENTS.STORAGE_SAVE, this.saveState);
    }
    
    /**
     * Настройка автосохранения
     */
    setupAutoSave() {
        // Сохраняем состояние при изменении
        this.store.subscribe('*', () => {
            this.saveState();
        });
        
        // Сохраняем состояние при закрытии окна
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
    }
    
    /**
     * Обработчик экспорта в MIDI
     * @param {Object} data - Данные события
     */
    handleExportMidi(data) {
        const { blockId, sequence } = data;
        
        if (!sequence || sequence.length === 0) {
            console.warn('Нечего экспортировать в MIDI');
            return;
        }
        
        // Получаем темп из хранилища
        const tempo = this.store.get('tempo') || 120;
        
        // Экспортируем в MIDI
        exportService.exportToMidi(sequence, {
            filename: `chordplayer_${blockId}`,
            tempo,
            trackName: `ChordPlayer - ${blockId}`
        }).catch(error => {
            console.error('Ошибка экспорта в MIDI:', error);
        });
    }
    
    /**
     * Обработчик экспорта в текст
     * @param {Object} data - Данные события
     */
    handleExportText(data) {
        const { blockId, sequence } = data;
        
        if (!sequence || sequence.length === 0) {
            console.warn('Нечего экспортировать в текст');
            return;
        }
        
        // Получаем тональность из хранилища
        const blocks = this.store.get('blocks') || {};
        const block = blocks[blockId];
        
        if (!block) {
            console.warn('Блок не найден');
            return;
        }
        
        // Экспортируем в текст
        exportService.exportToText(sequence, {
            filename: `chordplayer_${blockId}`,
            tonality: block.tonality,
            blockId
        }).catch(error => {
            console.error('Ошибка экспорта в текст:', error);
        });
    }
    
    /**
     * Обработчик экспорта проекта
     */
    handleExportProject() {
        const state = this.store.getState();
        
        // Экспортируем проект
        exportService.exportState(state).catch(error => {
            console.error('Ошибка экспорта проекта:', error);
        });
    }
    
    /**
     * Обработчик импорта проекта
     * @param {Object} data - Данные события
     */
    handleImportProject(data) {
        const { file } = data;
        
        if (!file) {
            console.warn('Нет файла для импорта');
            return;
        }
        
        // Импортируем проект
        storageService.importState(file).then(state => {
            // Обновляем хранилище
            this.store.update(state);
            
            // Перезагружаем компоненты
            Object.values(this.components).forEach(component => {
                try {
                    component.update();
                } catch (error) {
                    console.error('Ошибка обновления компонента:', error);
                }
            });
            
            console.log('Проект импортирован');
        }).catch(error => {
            console.error('Ошибка импорта проекта:', error);
            alert('Ошибка при импорте проекта. Проверьте файл и попробуйте снова.');
        });
    }
}

// Создаем экземпляр приложения
const app = new ChordPlayerApp();

// Инициализируем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Добавляем обработчики для футера (импорт/экспорт)
document.addEventListener('DOMContentLoaded', () => {
    // Экспорт проекта
    const exportButton = document.getElementById('export-project');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            eventBus.publish(EVENTS.EXPORT_PROJECT, {});
        });
    }
    
    // Импорт проекта
    const importButton = document.getElementById('import-project');
    if (importButton) {
        importButton.addEventListener('click', () => {
            // Создаем скрытый input для выбора файла
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';
            
            // Добавляем обработчик выбора файла
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    eventBus.publish(EVENTS.IMPORT_PROJECT, { file });
                }
                // Удаляем input после использования
                document.body.removeChild(fileInput);
            });
            
            // Добавляем input в DOM и кликаем по нему
            document.body.appendChild(fileInput);
            fileInput.click();
        });
    }
});

// Экспортируем приложение по умолчанию
export default app;