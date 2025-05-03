/**
 * app.js
 * Главный файл инициализации приложения ChordPlayer
 */

import AppInitializer from './core/appInitializer.js';

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Запускаем инициализацию через утилиту
    await AppInitializer.initialize();
    
    console.log('Приложение ChordPlayer успешно запущено');
  } catch (error) {
    console.error('Ошибка запуска приложения:', error);
    
    // Показываем сообщение об ошибке
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = 'Не удалось запустить приложение. Пожалуйста, перезагрузите страницу или проверьте консоль разработчика.';
    document.body.appendChild(errorMessage);
  }
});