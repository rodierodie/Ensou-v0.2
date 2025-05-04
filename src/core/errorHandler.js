/**
 * Обработчик ошибок приложения
 */
export class ErrorHandler {
    constructor() {
        this.errors = [];
        this.errorCallbacks = [];
        
        // Глобальная обработка необработанных ошибок
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }
  
    /**
     * Регистрация ошибки
     * @param {Error|string} error - Объект ошибки или сообщение
     * @param {string} [source] - Источник ошибки
     * @param {Object} [details] - Дополнительные детали
     */
    registerError(error, source = 'unknown', details = {}) {
        const errorObject = {
            message: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : null,
            source,
            details,
            timestamp: new Date()
        };
        
        // Добавляем ошибку в журнал
        this.errors.push(errorObject);
        console.error(`[${source}] ${errorObject.message}`, details);
        
        // Уведомляем обработчики
        this.notifyErrorCallbacks(errorObject);
        
        return errorObject;
    }
  
    /**
     * Обработка глобальной ошибки
     * @param {ErrorEvent} event - Событие ошибки
     */
    handleGlobalError(event) {
        this.registerError(
            event.error || event.message,
            'global',
            {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            }
        );
    }
  
    /**
     * Обработка необработанного отклонения промиса
     * @param {PromiseRejectionEvent} event - Событие отклонения промиса
     */
    handlePromiseRejection(event) {
        this.registerError(
            event.reason || 'Unhandled Promise Rejection',
            'promise',
            { reason: event.reason }
        );
    }
  
    /**
     * Добавление обработчика ошибок
     * @param {Function} callback - Функция обратного вызова
     * @returns {Function} - Функция для удаления обработчика
     */
    addErrorCallback(callback) {
        this.errorCallbacks.push(callback);
        
        // Возвращаем функцию для удаления обработчика
        return () => {
            this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
        };
    }
  
    /**
     * Уведомление обработчиков об ошибке
     * @param {Object} errorObject - Объект ошибки
     */
    notifyErrorCallbacks(errorObject) {
        this.errorCallbacks.forEach(callback => {
            try {
                callback(errorObject);
            } catch (error) {
                console.error('Ошибка в обработчике ошибок:', error);
            }
        });
    }
  
    /**
     * Получение журнала ошибок
     * @returns {Array} - Массив зарегистрированных ошибок
     */
    getErrorLog() {
        return [...this.errors];
    }
  
    /**
     * Очистка журнала ошибок
     */
    clearErrorLog() {
        this.errors = [];
    }
  
    /**
     * Декоратор для защиты функции от ошибок
     * @param {Function} fn - Функция для защиты
     * @param {string} source - Источник ошибки
     * @returns {Function} - Защищенная функция
     */
    protect(fn, source = 'unknown') {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.registerError(error, source, { args });
                return null;
            }
        };
    }
  
    /**
     * Асинхронный декоратор для защиты промисов
     * @param {Function} asyncFn - Асинхронная функция
     * @param {string} source - Источник ошибки
     * @returns {Function} - Защищенная асинхронная функция
     */
    protectAsync(asyncFn, source = 'unknown') {
        return async (...args) => {
            try {
                return await asyncFn(...args);
            } catch (error) {
                this.registerError(error, source, { args });
                return null;
            }
        };
    }
  }
  
  // Создаем экземпляр обработчика ошибок
  const errorHandler = new ErrorHandler();
  
  // Экспортируем по умолчанию
  export default errorHandler;