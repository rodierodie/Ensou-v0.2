import { TrackStructure } from '../models/sequence.js';
import { Tonality } from '../models/tonality.js';
import { Chord } from '../models/chord.js';

/**
 * Сервис для сохранения и загрузки данных приложения
 */
export class StorageService {
    constructor() {
        this.storageKey = 'chordplayer_data';
        
        // Привязка методов к контексту
        this.saveState = this.saveState.bind(this);
        this.loadState = this.loadState.bind(this);
        this.exportState = this.exportState.bind(this);
        this.importState = this.importState.bind(this);
        this.clearState = this.clearState.bind(this);
    }
    
    /**
     * Сохранение состояния в localStorage
     * @param {Object} state - Состояние приложения
     * @returns {boolean} - Успешно ли сохранение
     */
    saveState(state) {
        try {
            const serializedState = JSON.stringify(state);
            localStorage.setItem(this.storageKey, serializedState);
            return true;
        } catch (error) {
            console.error('Ошибка при сохранении состояния:', error);
            return false;
        }
    }
    
    /**
     * Загрузка состояния из localStorage
     * @returns {Object|null} - Загруженное состояние или null при ошибке
     */
    loadState() {
        try {
            const serializedState = localStorage.getItem(this.storageKey);
            if (serializedState === null) {
                return null;
            }
            
            const state = JSON.parse(serializedState);
            
            // Преобразуем объекты обратно в экземпляры классов
            return this.deserializeState(state);
        } catch (error) {
            console.error('Ошибка при загрузке состояния:', error);
            return null;
        }
    }
    
    /**
     * Десериализация состояния
     * @param {Object} state - Сериализованное состояние
     * @returns {Object} - Десериализованное состояние
     */
    deserializeState(state) {
        try {
            // Клонируем состояние
            const deserializedState = { ...state };
            
            // Обрабатываем блоки
            if (state.blocks) {
                const blocks = {};
                
                Object.entries(state.blocks).forEach(([blockId, blockData]) => {
                    // Восстанавливаем тональность
                    const tonality = blockData.tonality
                        ? new Tonality(blockData.tonality.note, blockData.tonality.type)
                        : new Tonality('C', 'dur');
                    
                    // Восстанавливаем последовательность
                    const sequence = [];
                    
                    if (blockData.sequence && Array.isArray(blockData.sequence)) {
                        blockData.sequence.forEach(itemData => {
                            let chord = null;
                            
                            // Восстанавливаем аккорд
                            if (itemData.chord) {
                                chord = new Chord(
                                    itemData.chord.root,
                                    itemData.chord.type,
                                    {
                                        degree: itemData.chord.degree,
                                        function: itemData.chord.function,
                                        inTonality: itemData.chord.inTonality
                                    }
                                );
                            }
                            
                            // Добавляем элемент в последовательность
                            sequence.push({
                                chord,
                                duration: itemData.duration || 1,
                                isPause: itemData.isPause || false
                            });
                        });
                    }
                    
                    // Создаем блок
                    blocks[blockId] = {
                        id: blockId,
                        name: blockData.name || blockId,
                        tonality,
                        sequence
                    };
                });
                
                // Заменяем блоки в состоянии
                deserializedState.blocks = blocks;
            }
            
            return deserializedState;
        } catch (error) {
            console.error('Ошибка при десериализации состояния:', error);
            return state;
        }
    }
    
    /**
     * Экспорт состояния в файл
     * @param {Object} state - Состояние приложения
     * @returns {Promise} - Промис, который разрешается после экспорта
     */
    exportState(state) {
        return new Promise((resolve, reject) => {
            try {
                // Сериализуем состояние
                const serializedState = JSON.stringify(state, null, 2);
                
                // Создаем Blob
                const blob = new Blob([serializedState], { type: 'application/json' });
                
                // Создаем URL
                const url = URL.createObjectURL(blob);
                
                // Создаем временную ссылку для скачивания
                const link = document.createElement('a');
                link.href = url;
                link.download = 'chordplayer_project.json';
                link.style.display = 'none';
                
                // Добавляем ссылку в DOM и кликаем по ней
                document.body.appendChild(link);
                link.click();
                
                // Удаляем ссылку и освобождаем URL
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    resolve();
                }, 100);
            } catch (error) {
                console.error('Ошибка при экспорте состояния:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Импорт состояния из файла
     * @param {File} file - Файл с состоянием
     * @returns {Promise} - Промис, который разрешается загруженным состоянием
     */
    importState(file) {
        return new Promise((resolve, reject) => {
            try {
                // Создаем читатель файлов
                const reader = new FileReader();
                
                // Обработчик загрузки
                reader.onload = (event) => {
                    try {
                        // Парсим JSON
                        const state = JSON.parse(event.target.result);
                        
                        // Десериализуем состояние
                        const deserializedState = this.deserializeState(state);
                        
                        resolve(deserializedState);
                    } catch (error) {
                        console.error('Ошибка при парсинге файла:', error);
                        reject(error);
                    }
                };
                
                // Обработчик ошибки
                reader.onerror = (error) => {
                    console.error('Ошибка при чтении файла:', error);
                    reject(error);
                };
                
                // Читаем файл как текст
                reader.readAsText(file);
            } catch (error) {
                console.error('Ошибка при импорте состояния:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Очистка состояния в localStorage
     * @returns {boolean} - Успешно ли очистка
     */
    clearState() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Ошибка при очистке состояния:', error);
            return false;
        }
    }
}

// Создаем экземпляр сервиса
const storageService = new StorageService();

// Экспортируем по умолчанию
export default storageService;