/**
 * Шина событий для коммуникации между компонентами
 * Реализует паттерн Pub/Sub (издатель/подписчик)
 */
export class EventBus {
    constructor() {
        this.listeners = {};
    }

    /**
     * Подписка на событие
     * @param {string} event - Название события
     * @param {Function} callback - Функция обратного вызова
     * @returns {Function} - Функция для отписки
     */
    subscribe(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);

        // Возвращаем функцию для отписки
        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    /**
     * Публикация события
     * @param {string} event - Название события
     * @param {*} data - Данные для передачи подписчикам
     */
    publish(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Ошибка при обработке события ${event}:`, error);
                }
            });
        }
    }

    /**
     * Отписка от события
     * @param {string} event - Название события
     * @param {Function} callback - Функция, которую нужно отписать
     */
    unsubscribe(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Отписка от всех событий
     * @param {string} [event] - Опционально: название события для полной очистки
     */
    unsubscribeAll(event) {
        if (event) {
            this.listeners[event] = [];
        } else {
            this.listeners = {};
        }
    }
}

// Создаем экземпляр шины событий
const eventBus = new EventBus();

// Определяем константы для событий
export const EVENTS = {
    // События интерфейса
    UI_BLOCK_SELECTED: 'ui:block:selected',
    UI_CHORD_SELECTED: 'ui:chord:selected',
    UI_CHORD_ADDED: 'ui:chord:added',
    UI_PAUSE_ADDED: 'ui:pause:added',
    UI_TONALITY_CHANGED: 'ui:tonality:changed',
    UI_TEMPO_CHANGED: 'ui:tempo:changed',
    UI_ARPEGGIATOR_TOGGLED: 'ui:arpeggiator:toggled',
    UI_METRONOME_TOGGLED: 'ui:metronome:toggled',
    
    // События воспроизведения
    PLAYBACK_START: 'playback:start',
    PLAYBACK_STOP: 'playback:stop',
    PLAYBACK_CHORD: 'playback:chord',
    
    // События хранения
    STORAGE_SAVE: 'storage:save',
    STORAGE_LOAD: 'storage:load',
    
    // События экспорта и импорта
    EXPORT_MIDI: 'export:midi',
    EXPORT_TEXT: 'export:text',
    EXPORT_PROJECT: 'export:project',
    IMPORT_PROJECT: 'import:project'
};

export default eventBus;