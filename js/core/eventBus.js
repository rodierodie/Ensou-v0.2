// js/core/eventBus.js
class EventBus {
  constructor() {
      // Карта для хранения подписчиков (имя события -> массив обработчиков)
      this.subscribers = new Map();
  }
  
  // Подписка на событие
  subscribe(event, callback) {
      // Если для этого события еще нет подписчиков, создаем массив
      if (!this.subscribers.has(event)) {
          this.subscribers.set(event, []);
      }
      
      // Добавляем обработчик к подписчикам на это событие
      const callbacks = this.subscribers.get(event);
      callbacks.push(callback);
      
      // Возвращаем функцию отписки
      return () => {
          const index = callbacks.indexOf(callback);
          if (index !== -1) {
              callbacks.splice(index, 1);
          }
      };
  }
  
  // Публикация события
  publish(event, data) {
      // Если на это событие нет подписчиков, просто выходим
      if (!this.subscribers.has(event)) {
          return;
      }
      
      // Вызываем всех подписчиков с переданными данными
      const callbacks = this.subscribers.get(event);
      callbacks.forEach(callback => {
          try {
              callback(data);
          } catch (error) {
              console.error(`Ошибка в обработчике события ${event}:`, error);
          }
      });
  }
  
  // Подписка на событие с автоматической отпиской после первого срабатывания
  subscribeOnce(event, callback) {
      // Создаем функцию-обертку, которая отписывается сама после выполнения
      const wrappedCallback = (data) => {
          // Сначала отписываемся
          unsubscribe();
          // Затем вызываем обработчик
          callback(data);
      };
      
      // Подписываемся с обернутым обработчиком
      const unsubscribe = this.subscribe(event, wrappedCallback);
      
      // Возвращаем функцию отписки
      return unsubscribe;
  }
}

// Создаем и экспортируем синглтон объект eventBus
const eventBus = new EventBus();
export default eventBus;