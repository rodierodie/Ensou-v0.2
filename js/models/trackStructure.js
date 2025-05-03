// js/models/trackStructure.js
import store from '../core/store.js';
import eventBus from '../core/eventBus.js';
import { ChordSequence, TrackBlock, TrackStructure } from './sequence.js';

class TrackStructureService {
    constructor() {
        // Экземпляр модели TrackStructure
        this.trackStructure = null;
        
        // Флаги для предотвращения циклических обновлений
        this.isExporting = false;
        this.isLoading = false;
        
        // Инициализация с пустой структурой
        this.init();
        
        // Подписка на изменения в store
        store.subscribe(this.handleStoreChanges.bind(this), 
            ['trackStructure', 'currentBlockIndex', 'sequence']);
    }
    
    // Инициализация
    init() {
        // Проверка наличия структуры в store
        const storeStructure = store.getTrackStructure();
        
        if (storeStructure && storeStructure.length > 0) {
            // Импорт структуры из store
            this.importFromStore(storeStructure);
        } else {
            // Создание дефолтной структуры
            this.trackStructure = TrackStructure.createDefault();
            this.exportToStore();
        }
    }
    
    // Импорт структуры из store
    importFromStore(storeStructure) {
        // Создаем блоки из данных store
        const blocks = storeStructure.map(blockData => {
            return new TrackBlock(
                blockData.id || 'block_' + Date.now(),
                blockData.name,
                blockData.tonality,
                blockData.chords || []
            );
        });
        
        // Создаем новую структуру с блоками
        this.trackStructure = new TrackStructure(blocks);
        
        // Устанавливаем индекс текущего блока
        this.trackStructure.currentBlockIndex = store.getCurrentBlockIndex();
    }
    
    // Экспорт структуры в store
    exportToStore() {
        if (!this.trackStructure) return;
        
        // Устанавливаем флаг, чтобы избежать циклических обновлений
        this.isExporting = true;
        
        // Конвертируем модель в формат для store
        const storeStructure = this.trackStructure.getAllBlocks().map(block => {
            return {
                id: block.id,
                name: block.name,
                tonality: block.tonality,
                chords: block.chords
            };
        });
        
        // Обновляем store
        store.setTrackStructure(storeStructure);
        store.setCurrentBlockIndex(this.trackStructure.currentBlockIndex);
        
        // Сбрасываем флаг
        this.isExporting = false;
    }
    
    // Получение текущей структуры
    getTrackStructure() {
        return this.trackStructure;
    }
    
    // Получение индекса текущего блока
    getCurrentBlockIndex() {
        return this.trackStructure.currentBlockIndex;
    }
    
    // Добавление нового блока
    addNewBlock(tonality) {
        // Если тональность не указана, используем текущую
        const blockTonality = tonality || store.getCurrentTonality();
        
        // Генерируем имя для нового блока
        const blockName = this.trackStructure.generateNextBlockName();
        
        // Создаем новый блок
        const newBlock = new TrackBlock(
            'block_' + Date.now(),
            blockName,
            blockTonality,
            []
        );
        
        // Добавляем блок в структуру
        this.trackStructure.addBlock(newBlock);
        
        // Устанавливаем новый блок как текущий
        const newIndex = this.trackStructure.blocks.length - 1;
        this.trackStructure.setCurrentBlockIndex(newIndex);
        
        // Обновляем store
        this.exportToStore();
        
        // Очищаем последовательность
        store.clearSequence();
        
        // Публикуем событие
        eventBus.publish('blockAdded', {
            block: newBlock,
            index: newIndex
        });
        
        // Возвращаем индекс нового блока
        return newIndex;
    }
    
    // Удаление блока
    removeBlock(index) {
        // Проверка, что это не последний блок
        if (this.trackStructure.blocks.length <= 1) {
            console.warn('Невозможно удалить последний блок');
            return false;
        }
        
        // Сохраняем блок для события
        const removedBlock = this.trackStructure.getBlockAt(index);
        
        // Удаляем блок
        this.trackStructure.removeBlock(index);
        
        // Обновляем store
        this.exportToStore();
        
        // Загружаем аккорды текущего блока
        this.loadBlockSequence(this.trackStructure.currentBlockIndex);
        
        // Публикуем событие
        eventBus.publish('blockRemoved', {
            block: removedBlock,
            index: index
        });
        
        return true;
    }
    
    // Дублирование блока
    duplicateBlock(index) {
        // Дублируем блок
        const newIndex = this.trackStructure.duplicateBlock(index);
        
        // Проверяем успешность операции
        if (newIndex === -1) {
            return -1;
        }
        
        // Обновляем store
        this.exportToStore();
        
        // Загружаем аккорды нового блока
        this.loadBlockSequence(newIndex);
        
        // Публикуем событие
        eventBus.publish('blockDuplicated', {
            originalIndex: index,
            newIndex: newIndex,
            block: this.trackStructure.getBlockAt(newIndex)
        });
        
        return newIndex;
    }
    
    // Переименование блока
    renameBlock(index, newName) {
        // Валидация формата имени
        if (!/^[A-Z][1-9](\d*)$/.test(newName)) {
            console.error('Некорректный формат имени блока. Должно быть буква+цифра (A1, B2)');
            return false;
        }
        
        // Сохраняем старое имя для события
        const oldName = this.trackStructure.getBlockAt(index)?.name;
        
        // Переименовываем блок
        const success = this.trackStructure.renameBlock(index, newName);
        
        if (success) {
            // Обновляем store
            this.exportToStore();
            
            // Публикуем событие
            eventBus.publish('blockRenamed', {
                index: index,
                oldName: oldName,
                newName: newName
            });
        }
        
        return success;
    }
    
    // Изменение тональности блока
    changeBlockTonality(index, newTonality, fromUI = false) {
        // Сохраняем старую тональность для события
        const oldTonality = this.trackStructure.getBlockAt(index)?.tonality;
        
        // Меняем тональность
        const success = this.trackStructure.changeBlockTonality(index, newTonality);
        
        if (success) {
            // Обновляем store
            this.exportToStore();
            
            // Если это текущий блок и изменение не пришло из UI,
            // обновляем тональность в приложении
            if (index === this.trackStructure.currentBlockIndex && !fromUI) {
                if (store.getCurrentTonality() !== newTonality) {
                    store.setCurrentTonality(newTonality);
                }
            }
            
            // Публикуем событие
            eventBus.publish('blockTonalityChanged', {
                index: index,
                oldTonality: oldTonality,
                newTonality: newTonality
            });
        }
        
        return success;
    }
    
    // Сохранение текущей последовательности в блок
    saveSequenceToBlock(index = null) {
        // Если индекс не указан, используем текущий
        const blockIndex = index !== null ? index : this.trackStructure.currentBlockIndex;
        
        // Получаем текущую последовательность
        const sequence = store.getSequence();
        
        // Получаем блок
        const block = this.trackStructure.getBlockAt(blockIndex);
        if (!block) {
            return false;
        }
        
        // Обновляем аккорды блока
        block.chords = [...sequence];
        
        // Обновляем store
        this.exportToStore();
        
        // Публикуем событие
        eventBus.publish('sequenceSavedToBlock', {
            index: blockIndex,
            sequence: sequence
        });
        
        return true;
    }
    
    // Загрузка последовательности из блока
    loadBlockSequence(index) {
        // Проверяем существование блока
        const block = this.trackStructure.getBlockAt(index);
        if (!block) {
            return false;
        }
        
        // Устанавливаем флаг загрузки
        this.isLoading = true;
        
        // Обновляем индекс текущего блока
        this.trackStructure.setCurrentBlockIndex(index);
        
        // Обновляем store
        store.setCurrentBlockIndex(index);
        store.setSequence(block.chords || []);
        
        // Если тональность отличается от текущей, обновляем её
        if (block.tonality !== store.getCurrentTonality()) {
            store.setCurrentTonality(block.tonality);
        }
        
        // Сбрасываем флаг загрузки
        this.isLoading = false;
        
        // Публикуем событие
        eventBus.publish('blockSequenceLoaded', {
            index: index,
            block: block
        });
        
        return true;
    }
    
    // Очистка текущего блока
    clearCurrentBlock() {
        const index = this.trackStructure.currentBlockIndex;
        
        // Получаем блок
        const block = this.trackStructure.getBlockAt(index);
        if (!block) {
            return false;
        }
        
        // Очищаем аккорды блока
        block.chords = [];
        
        // Обновляем store
        this.exportToStore();
        store.clearSequence();
        
        // Публикуем событие
        eventBus.publish('blockCleared', {
            index: index
        });
        
        return true;
    }
    
    // Обработка изменений в store
    handleStoreChanges(state, changedProp) {
        switch (changedProp) {
            // Изменение структуры в store
            case 'trackStructure':
                // Пропускаем, если изменение пришло из этого сервиса
                if (this.isExporting) break;
                
                // Импортируем новую структуру
                this.importFromStore(state.trackStructure);
                break;
                
            // Изменение индекса текущего блока
            case 'currentBlockIndex':
                // Обновляем модель
                if (this.trackStructure) {
                    this.trackStructure.currentBlockIndex = state.currentBlockIndex;
                }
                break;
                
            // Изменение последовательности (авто-сохранение в текущий блок)
            case 'sequence':
                // Пропускаем, если изменение пришло от загрузки блока
                if (this.isLoading) break;
                
                // Авто-сохранение в текущий блок
                this.saveSequenceToBlock();
                break;
        }
    }
}

// Создаем синглтон сервис
const trackStructureService = new TrackStructureService();

export default trackStructureService;