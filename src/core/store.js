/**
 * Хранилище данных приложения
 * Реализует паттерн наблюдатель для обновления компонентов
 */
export class Store {
    /**
     * @param {Object} initialState - Начальное состояние
     */
    constructor(initialState = {}) {
        this.state = initialState;
        this.listeners = {};
    }

    /**
     * Получение всего состояния
     * @returns {Object} - Текущее состояние
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Получение части состояния по ключу
     * @param {string} key - Ключ для получения части состояния
     * @returns {*} - Значение части состояния
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Обновление состояния
     * @param {Object} newState - Новое состояние для объединения с текущим
     */
    update(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    /**
     * Обновление части состояния по ключу
     * @param {string} key - Ключ для обновления
     * @param {*} value - Новое значение
     */
    set(key, value) {
        this.state[key] = value;
        this.notify(key);
    }

    /**
     * Подписка на изменения состояния
     * @param {string} key - Ключ для подписки (или '*' для всех изменений)
     * @param {Function} callback - Функция обратного вызова
     * @returns {Function} - Функция для отписки
     */
    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);

        // Возвращаем функцию для отписки
        return () => {
            this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
        };
    }

    /**
     * Уведомление подписчиков об изменениях
     * @param {string} [key] - Ключ изменившейся части (если не указан, уведомляются все)
     */
    notify(key) {
        // Уведомить слушателей конкретного ключа
        if (key && this.listeners[key]) {
            this.listeners[key].forEach(callback => callback(this.state[key]));
        }

        // Уведомить слушателей всех изменений
        if (this.listeners['*']) {
            this.listeners['*'].forEach(callback => callback(this.state));
        }
    }

    /**
     * Сохранение состояния в localStorage
     * @param {string} key - Ключ для сохранения
     */
    saveToLocalStorage(key = 'chordplayer_state') {
        try {
            localStorage.setItem(key, JSON.stringify(this.state));
        } catch (error) {
            console.error('Ошибка при сохранении состояния:', error);
        }
    }

    /**
     * Загрузка состояния из localStorage
     * @param {string} key - Ключ для загрузки
     * @returns {boolean} - Успешна ли загрузка
     */
    loadFromLocalStorage(key = 'chordplayer_state') {
        try {
            const savedState = localStorage.getItem(key);
            if (savedState) {
                this.state = JSON.parse(savedState);
                this.notify();
                return true;
            }
        } catch (error) {
            console.error('Ошибка при загрузке состояния:', error);
        }
        return false;
    }
}

// Создаем экземпляр хранилища
const store = new Store({
    currentBlock: 'A1',
    blocks: {
        A1: {
            tonality: { note: 'E', type: 'moll' },
            sequence: []
        },
        B1: {
            tonality: { note: 'G', type: 'dur' },
            sequence: []
        }
    },
    selectedChord: null,
    showTonalityCircle: true,
    tempo: 120,
    arpeggiatorEnabled: false,
    metronomeEnabled: false
});

export default store;