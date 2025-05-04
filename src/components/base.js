/**
 * Базовый класс для всех компонентов UI
 * Реализует шаблон компонента с методами жизненного цикла
 */
export class BaseComponent {
    /**
     * @param {Object} options - Опции компонента
     * @param {HTMLElement|string} options.container - DOM-элемент или селектор для контейнера
     * @param {Object} options.store - Хранилище данных для состояния
     * @param {Object} options.eventBus - Шина событий для коммуникации
     * @param {Object} options.initialState - Начальное состояние компонента
     */
    constructor(options = {}) {
        this.container = typeof options.container === 'string'
            ? document.querySelector(options.container)
            : options.container;
            
        this.store = options.store || null;
        this.eventBus = options.eventBus || null;
        this.state = options.initialState || {};
        
        this.isMounted = false;
        this.eventListeners = [];
        this.storeSubscriptions = [];
        
        // Привязка методов к контексту
        this.render = this.render.bind(this);
        this.mount = this.mount.bind(this);
        this.unmount = this.unmount.bind(this);
        this.update = this.update.bind(this);
        this.setState = this.setState.bind(this);
    }

    /**
     * Отрисовка компонента
     * @returns {HTMLElement} - DOM элемент компонента
     */
    render() {
        throw new Error('Метод render должен быть переопределен в дочернем классе');
    }

    /**
     * Монтирование компонента в DOM
     * @returns {BaseComponent} - this для цепочки вызовов
     */
    mount() {
        if (!this.container) {
            throw new Error('Контейнер не определен');
        }

        if (this.isMounted) {
            return this;
        }

        // Вызываем событие перед монтированием
        this.beforeMount();

        // Отрисовываем компонент и добавляем в контейнер
        const element = this.render();
        if (element) {
            if (element instanceof DocumentFragment) {
                this.container.appendChild(element);
            } else if (element instanceof HTMLElement) {
                this.container.appendChild(element);
            } else if (typeof element === 'string') {
                this.container.innerHTML = element;
            }
        }

        this.isMounted = true;

        // Вызываем событие после монтирования
        this.afterMount();

        return this;
    }

    /**
     * Размонтирование компонента
     * @returns {BaseComponent} - this для цепочки вызовов
     */
    unmount() {
        if (!this.isMounted) {
            return this;
        }

        // Вызываем событие перед размонтированием
        this.beforeUnmount();

        // Удаляем DOM элементы
        if (this.container) {
            this.container.innerHTML = '';
        }

        // Удаляем обработчики событий
        this.removeAllEventListeners();

        // Отписываемся от хранилища
        this.unsubscribeFromStore();

        this.isMounted = false;

        // Вызываем событие после размонтирования
        this.afterUnmount();

        return this;
    }

    /**
     * Обновление компонента
     * @returns {BaseComponent} - this для цепочки вызовов
     */
    update() {
        if (!this.isMounted) {
            return this.mount();
        }

        // Вызываем событие перед обновлением
        this.beforeUpdate();

        // Сохраняем старый DOM элемент
        const oldElement = this.container.firstChild;

        // Отрисовываем новый элемент
        const newElement = this.render();

        // Заменяем старый элемент новым
        if (newElement) {
            if (newElement instanceof DocumentFragment || newElement instanceof HTMLElement) {
                this.container.replaceChild(newElement, oldElement);
            } else if (typeof newElement === 'string') {
                this.container.innerHTML = newElement;
            }
        }

        // Вызываем событие после обновления
        this.afterUpdate();

        return this;
    }

    /**
     * Обновление состояния компонента
     * @param {Object} newState - Новое состояние для объединения с текущим
     * @returns {BaseComponent} - this для цепочки вызовов
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        
        // Если компонент смонтирован, обновляем его
        if (this.isMounted) {
            this.update();
        }
        
        return this;
    }

    /**
     * Добавление обработчика события к DOM элементу
     * @param {HTMLElement} element - DOM элемент
     * @param {string} eventName - Название события
     * @param {Function} handler - Функция-обработчик
     * @param {boolean} [useCapture=false] - Использовать фазу перехвата
     */
    addEventListenerWithCleanup(element, eventName, handler, useCapture = false) {
        element.addEventListener(eventName, handler, useCapture);
        
        // Сохраняем информацию о слушателе для последующей очистки
        this.eventListeners.push({
            element,
            eventName,
            handler,
            useCapture
        });
    }

    /**
     * Удаление всех зарегистрированных обработчиков событий
     */
    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, eventName, handler, useCapture }) => {
            element.removeEventListener(eventName, handler, useCapture);
        });
        this.eventListeners = [];
    }

    /**
     * Подписка на изменение в хранилище
     * @param {string} key - Ключ для подписки
     * @param {Function} callback - Функция обратного вызова
     */
    subscribeToStore(key, callback) {
        if (!this.store) {
            return null;
        }
        
        const unsubscribe = this.store.subscribe(key, callback);
        this.storeSubscriptions.push(unsubscribe);
        
        return unsubscribe;
    }

    /**
     * Отписка от всех подписок на хранилище
     */
    unsubscribeFromStore() {
        this.storeSubscriptions.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.storeSubscriptions = [];
    }

    /**
     * Подписка на событие в шине событий
     * @param {string} event - Название события
     * @param {Function} callback - Функция обратного вызова
     */
    subscribeToEvent(event, callback) {
        if (!this.eventBus) {
            return null;
        }
        
        return this.eventBus.subscribe(event, callback);
    }

    /**
     * Создание элемента с классами и атрибутами
     * @param {string} tagName - Название тега
     * @param {Object} options - Опции элемента
     * @param {string|Array<string>} options.className - Класс или массив классов
     * @param {Object} options.attributes - Атрибуты элемента
     * @param {string|HTMLElement|Array<HTMLElement>} options.children - Дочерние элементы
     * @param {Object} options.events - События элемента
     * @returns {HTMLElement} - Созданный DOM элемент
     */
    createElement(tagName, options = {}) {
        const element = document.createElement(tagName);
        
        // Добавляем классы
        if (options.className) {
            if (Array.isArray(options.className)) {
                element.classList.add(...options.className);
            } else {
                element.classList.add(options.className);
            }
        }
        
        // Добавляем атрибуты
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        // Добавляем текстовое содержимое или дочерние элементы
        if (options.children) {
            if (Array.isArray(options.children)) {
                options.children.forEach(child => {
                    if (child instanceof HTMLElement) {
                        element.appendChild(child);
                    } else {
                        element.appendChild(document.createTextNode(String(child)));
                    }
                });
            } else if (options.children instanceof HTMLElement) {
                element.appendChild(options.children);
            } else {
                element.textContent = String(options.children);
            }
        }
        
        // Добавляем события
        if (options.events) {
            Object.entries(options.events).forEach(([eventName, handler]) => {
                this.addEventListenerWithCleanup(element, eventName, handler);
            });
        }
        
        return element;
    }

    // Методы жизненного цикла (хуки) для переопределения в дочерних классах
    
    /**
     * Вызывается перед монтированием компонента
     */
    beforeMount() {}
    
    /**
     * Вызывается после монтирования компонента
     */
    afterMount() {}
    
    /**
     * Вызывается перед обновлением компонента
     */
    beforeUpdate() {}
    
    /**
     * Вызывается после обновления компонента
     */
    afterUpdate() {}
    
    /**
     * Вызывается перед размонтированием компонента
     */
    beforeUnmount() {}
    
    /**
     * Вызывается после размонтирования компонента
     */
    afterUnmount() {}
}