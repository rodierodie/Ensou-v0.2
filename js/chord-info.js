/**
 * chord-info.js
 * Простой механизм отображения информации об аккорде по кнопке
 */

document.addEventListener('DOMContentLoaded', function() {
    // ВАЖНО: Сначала проверим, существует ли информация и отобразим/скроем её
    const chordInfo = document.getElementById('chord-info');
    if (chordInfo) {
        // По умолчанию скрываем блок с информацией
        chordInfo.style.display = 'none';
    }
    
    // Найдем кнопку по ID
    const infoButton = document.getElementById('show-chord-info-button');
    if (!infoButton) {
        console.error('Кнопка информации об аккорде не найдена');
        return;
    }
    
    // Убедимся, что текст кнопки соответствует скрытому состоянию
    infoButton.textContent = 'Показать информацию об аккорде';
    
    // Добавим обработчик нажатия на кнопку
    infoButton.addEventListener('click', function() {
        if (chordInfo) {
            if (chordInfo.style.display === 'none' || chordInfo.style.display === '') {
                chordInfo.style.display = 'block';
                infoButton.textContent = 'Скрыть информацию об аккорде';
            } else {
                chordInfo.style.display = 'none';
                infoButton.textContent = 'Показать информацию об аккорде';
            }
        }
    });
    
    // Слушаем событие обновления информации
    document.addEventListener('chordInfoUpdated', function() {
        // Обновление визуального стиля кнопки
        if (infoButton) {
            infoButton.classList.add('info-updated');
            setTimeout(() => {
                infoButton.classList.remove('info-updated');
            }, 500);
        }
    });
});