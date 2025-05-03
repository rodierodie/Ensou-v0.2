/**
 * new-tonality-selector.js
 * Модуль для нового селектора тональностей с квартоквинтовым кругом
 */

// Объект для хранения функций нового селектора тональностей
const NewTonalitySelector = {
    // Флаг инициализации
    initialized: false,
  
    /**
     * Инициализация нового селектора тональностей
     */
    initialize: function() {
      if (this.initialized) return;
      
      // Создаем и внедряем новый селектор тональностей
      this.createVanillaTonalitySelector();
      
      // Устанавливаем флаг инициализации
      this.initialized = true;
      
      console.log('Новый селектор тональностей инициализирован');
    },
  
    /**
     * Создание нового селектора тональностей на чистом JavaScript
     */
    createVanillaTonalitySelector: function() {
      // Находим контейнер с текущими табами тональностей
      const oldTonalityTabs = document.getElementById('tonality-tabs');
      if (!oldTonalityTabs) {
        console.error('Не найден контейнер с табами тональностей');
        return;
      }
      
      // Создаем HTML для нового селектора тональностей
      const selectorHTML = `
        <div class="new-tonality-selector">
          <div class="tonality-dropdowns">
            <div class="dropdown-container">
              <label for="note-select">Нота:</label>
              <select id="note-select">
                <option value="C">C</option>
                <option value="G">G</option>
                <option value="D">D</option>
                <option value="A">A</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="Bb">Bb</option>
                <option value="Eb">Eb</option>
              </select>
            </div>
            
            <div class="dropdown-container">
              <label for="type-select">Тип:</label>
              <select id="type-select">
                <option value="major">Мажор</option>
                <option value="minor">Минор</option>
              </select>
            </div>
            
            <div class="current-tonality">
              <span class="tonality-code" id="tonality-code">C</span>
              <span class="tonality-name" id="tonality-name">(До мажор)</span>
            </div>
          </div>
          
          <div class="circle-controls">
            <button class="toggle-circle-button" id="toggle-circle-button">
              Скрыть круг тональностей
            </button>
          </div>
          
          <div class="circle-container" id="circle-container">
            <!-- SVG с квартоквинтовым кругом будет добавлен динамически -->
          </div>
        </div>
      `;
      
      // Создаем стили для нового селектора
      const selectorStyles = `
        <style>
          .new-tonality-selector {
            margin: 15px 0;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
          }
          
          .tonality-dropdowns {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .dropdown-container {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .dropdown-container label {
            font-weight: bold;
            margin-right: 5px;
          }
          
          .dropdown-container select {
            padding: 8px 10px;
            border-radius: 4px;
            border: 1px solid #ddd;
            background-color: #fff;
            font-size: 0.9rem;
            min-width: 80px;
          }
          
          .current-tonality {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .tonality-code {
            font-size: 1.2rem;
            font-weight: bold;
            color: #2c3e50;
          }
          
          .tonality-name {
            color: #666;
            font-style: italic;
          }
          
          .circle-controls {
            margin-bottom: 15px;
            display: flex;
            justify-content: center;
          }
          
          .toggle-circle-button {
            padding: 8px 15px;
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s ease;
          }
          
          .toggle-circle-button:hover {
            background-color: #e0e0e0;
          }
          
          .circle-container {
            max-width: 400px;
            margin: 0 auto;
          }
          
          .circle-of-fifths {
            width: 100%;
            height: auto;
          }
          
          .outer-circle, .inner-circle {
            fill: #f5f5f5;
            stroke: #ccc;
            stroke-width: 1;
          }
          
          .connection-line {
            stroke: #ddd;
            stroke-width: 1;
            stroke-dasharray: 4,4;
          }
          
          .note-group {
            cursor: pointer;
          }
          
          .note-circle {
            fill: #e3f2fd;
            stroke: #90caf9;
            stroke-width: 1;
            transition: all 0.2s ease;
          }
          
          .note-circle.minor {
            fill: #f3e5f5;
            stroke: #ce93d8;
          }
          
          .note-circle.selected {
            fill: #bbdefb;
            stroke: #2196f3;
            stroke-width: 2;
          }
          
          .note-circle.minor.selected {
            fill: #e1bee7;
            stroke: #9c27b0;
          }
          
          .note-group:hover .note-circle {
            fill: #bbdefb;
          }
          
          .note-group.minor:hover .note-circle {
            fill: #e1bee7;
          }
          
          .note-text {
            font-size: 14px;
            font-weight: bold;
            fill: #333;
            user-select: none;
          }
          
          .note-text.minor {
            font-size: 12px;
          }
          
          @media (max-width: 768px) {
            .tonality-dropdowns {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .current-tonality {
              margin-left: 0;
              margin-top: 10px;
            }
          }
        </style>
      `;
      
      // Создаем новый контейнер для селектора тональностей
      const newSelectorContainer = document.createElement('div');
      newSelectorContainer.id = 'new-tonality-selector';
      newSelectorContainer.innerHTML = selectorHTML + selectorStyles;
      
      // Заменяем старый селектор новым
      oldTonalityTabs.parentNode.replaceChild(newSelectorContainer, oldTonalityTabs);
      
      // Создаем и добавляем SVG с квартоквинтовым кругом
      this.createCircleOfFifthsSVG();
      
      // Настраиваем обработчики событий
      this.setupTonalitySelectorEvents();
      
      // Синхронизируем с текущей тональностью
      this.syncWithCurrentTonality();
    },
  
    /**
     * Создание SVG с квартоквинтовым кругом
     */
    createCircleOfFifthsSVG: function() {
      const circleContainer = document.getElementById('circle-container');
      if (!circleContainer) return;
      
      // Определяем ноты в квартоквинтовом круге
      const circleOfFifths = [
        { note: 'C', angle: 270, radius: 100 },
        { note: 'G', angle: 300, radius: 100 },
        { note: 'D', angle: 330, radius: 100 },
        { note: 'A', angle: 0, radius: 100 },
        { note: 'E', angle: 30, radius: 100 },
        { note: 'B', angle: 60, radius: 100 },
        { note: 'F#', angle: 90, radius: 100 },
        { note: 'F', angle: 240, radius: 100 },
        { note: 'Bb', angle: 210, radius: 100 },
        { note: 'Eb', angle: 180, radius: 100 },
        { note: 'Ab', angle: 150, radius: 100 },
        { note: 'Db', angle: 120, radius: 100 }
      ];
      
      // Создаем SVG элемент
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 300 300');
      svg.setAttribute('class', 'circle-of-fifths');
      
      // Добавляем внешний круг
      const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      outerCircle.setAttribute('cx', '150');
      outerCircle.setAttribute('cy', '150');
      outerCircle.setAttribute('r', '120');
      outerCircle.setAttribute('class', 'outer-circle');
      svg.appendChild(outerCircle);
      
      // Добавляем внутренний круг
      const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      innerCircle.setAttribute('cx', '150');
      innerCircle.setAttribute('cy', '150');
      innerCircle.setAttribute('r', '80');
      innerCircle.setAttribute('class', 'inner-circle');
      svg.appendChild(innerCircle);
      
      // Функция для расчета координат на окружности
      const getCoordinates = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
        return {
          x: centerX + radius * Math.cos(angleInRadians),
          y: centerY + radius * Math.sin(angleInRadians)
        };
      };
      
      // Добавляем линии между нотами
      for (let i = 0; i < circleOfFifths.length; i++) {
        const current = circleOfFifths[i];
        const next = circleOfFifths[(i + 1) % circleOfFifths.length];
        
        const start = getCoordinates(150, 150, current.radius, current.angle);
        const end = getCoordinates(150, 150, next.radius, next.angle);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', start.x);
        line.setAttribute('y1', start.y);
        line.setAttribute('x2', end.x);
        line.setAttribute('y2', end.y);
        line.setAttribute('class', 'connection-line');
        
        svg.appendChild(line);
      }
      
      // Добавляем ноты на круг
      const self = this;
      circleOfFifths.forEach((item) => {
        const coords = getCoordinates(150, 150, item.radius, item.angle);
        
        // Создаем группу для ноты
        const noteGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        noteGroup.setAttribute('class', 'note-group');
        noteGroup.setAttribute('data-note', item.note);
        noteGroup.setAttribute('data-type', 'major');
        
        // Добавляем круг
        const noteCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        noteCircle.setAttribute('cx', coords.x);
        noteCircle.setAttribute('cy', coords.y);
        noteCircle.setAttribute('r', '20');
        noteCircle.setAttribute('class', 'note-circle');
        
        // Добавляем текст
        const noteText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        noteText.setAttribute('x', coords.x);
        noteText.setAttribute('y', coords.y + 5);
        noteText.setAttribute('class', 'note-text');
        noteText.setAttribute('text-anchor', 'middle');
        noteText.setAttribute('dominant-baseline', 'middle');
        noteText.textContent = item.note;
        
        // Добавляем обработчик клика
        noteGroup.addEventListener('click', function() {
          self.changeTonality(item.note, 'major');
        });
        
        // Добавляем элементы в группу
        noteGroup.appendChild(noteCircle);
        noteGroup.appendChild(noteText);
        
        // Добавляем группу в SVG
        svg.appendChild(noteGroup);
        
        // Добавляем соответствующую минорную ноту (на внутреннем круге)
        const minorNote = this.getRelativeMinor(item.note);
        const minorCoords = getCoordinates(150, 150, 70, item.angle);
        
        // Создаем группу для минорной ноты
        const minorNoteGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        minorNoteGroup.setAttribute('class', 'note-group minor');
        minorNoteGroup.setAttribute('data-note', minorNote);
        minorNoteGroup.setAttribute('data-type', 'minor');
        
        // Добавляем круг
        const minorNoteCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        minorNoteCircle.setAttribute('cx', minorCoords.x);
        minorNoteCircle.setAttribute('cy', minorCoords.y);
        minorNoteCircle.setAttribute('r', '15');
        minorNoteCircle.setAttribute('class', 'note-circle minor');
        
        // Добавляем текст
        const minorNoteText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        minorNoteText.setAttribute('x', minorCoords.x);
        minorNoteText.setAttribute('y', minorCoords.y + 4);
        minorNoteText.setAttribute('class', 'note-text minor');
        minorNoteText.setAttribute('text-anchor', 'middle');
        minorNoteText.setAttribute('dominant-baseline', 'middle');
        minorNoteText.textContent = minorNote + 'm';
        
        // Добавляем обработчик клика
        minorNoteGroup.addEventListener('click', function() {
          self.changeTonality(minorNote, 'minor');
        });
        
        // Добавляем элементы в группу
        minorNoteGroup.appendChild(minorNoteCircle);
        minorNoteGroup.appendChild(minorNoteText);
        
        // Добавляем группу в SVG
        svg.appendChild(minorNoteGroup);
      });
      
      // Добавляем SVG в контейнер
      circleContainer.appendChild(svg);
    },
  
    /**
     * Настройка обработчиков событий для селектора тональностей
     */
    setupTonalitySelectorEvents: function() {
      const self = this;
      
      // Выпадающий список для ноты
      const noteSelect = document.getElementById('note-select');
      if (noteSelect) {
        noteSelect.addEventListener('change', function() {
          const note = this.value;
          const type = document.getElementById('type-select').value;
          self.changeTonality(note, type);
        });
      }
      
      // Выпадающий список для типа
      const typeSelect = document.getElementById('type-select');
      if (typeSelect) {
        typeSelect.addEventListener('change', function() {
          const note = document.getElementById('note-select').value;
          const type = this.value;
          self.changeTonality(note, type);
        });
      }
      
      // Кнопка показа/скрытия круга
      const toggleButton = document.getElementById('toggle-circle-button');
      const circleContainer = document.getElementById('circle-container');
      if (toggleButton && circleContainer) {
        toggleButton.addEventListener('click', function() {
          if (circleContainer.style.display === 'none') {
            circleContainer.style.display = 'block';
            this.textContent = 'Скрыть круг тональностей';
          } else {
            circleContainer.style.display = 'none';
            this.textContent = 'Показать круг тональностей';
          }
        });
      }
    },
  
    /**
     * Синхронизация с текущей тональностью приложения
     */
    syncWithCurrentTonality: function() {
      if (window.UI && window.UI.getCurrentTonality) {
        const appTonality = window.UI.getCurrentTonality();
        
        // Парсим код тональности (например, "Am" -> { note: "A", type: "minor" })
        let note, type;
        if (appTonality.endsWith('m')) {
          note = appTonality.slice(0, -1);
          type = 'minor';
        } else {
          note = appTonality;
          type = 'major';
        }
        
        // Обновляем UI селектора
        this.updateTonalitySelectorUI(note, type);
      }
    },
  
    /**
     * Обновление UI селектора тональностей
     * @param {string} note - Нота (C, G, D, и т.д.)
     * @param {string} type - Тип тональности (major или minor)
     */
    updateTonalitySelectorUI: function(note, type) {
      // Обновляем выпадающие списки
      const noteSelect = document.getElementById('note-select');
      const typeSelect = document.getElementById('type-select');
      
      if (noteSelect) {
        // Проверяем, есть ли такая опция в списке
        const option = noteSelect.querySelector(`option[value="${note}"]`);
        if (option) {
          noteSelect.value = note;
        } else {
          console.warn(`Нота ${note} отсутствует в списке опций`);
        }
      }
      
      if (typeSelect) typeSelect.value = type;
      
      // Обновляем текст с текущей тональностью
      const tonalityCode = document.getElementById('tonality-code');
      const tonalityName = document.getElementById('tonality-name');
      
      if (tonalityCode) {
        tonalityCode.textContent = type === 'minor' ? note + 'm' : note;
      }
      
      if (tonalityName) {
        const fullName = this.getFullTonalityName(note, type);
        tonalityName.textContent = `(${fullName})`;
      }
      
      // Обновляем выделение в круге
      this.updateCircleSelection(note, type);
    },
  
    /**
     * Обновление выделения в квартоквинтовом круге
     * @param {string} note - Нота (C, G, D, и т.д.)
     * @param {string} type - Тип тональности (major или minor)
     */
    updateCircleSelection: function(note, type) {
      // Снимаем выделение со всех нот
      const allNoteGroups = document.querySelectorAll('.note-group');
      allNoteGroups.forEach(group => {
        const circle = group.querySelector('circle');
        if (circle) {
          circle.classList.remove('selected');
        }
      });
      
      // Выделяем выбранную ноту
      const selector = `.note-group[data-note="${note}"][data-type="${type}"]`;
      const selectedGroup = document.querySelector(selector);
      
      if (selectedGroup) {
        const circle = selectedGroup.querySelector('circle');
        if (circle) {
          circle.classList.add('selected');
        }
      }
    },
  
    /**
     * Изменение тональности
     * @param {string} note - Нота (C, G, D, и т.д.)
     * @param {string} type - Тип тональности (major или minor)
     */
    changeTonality: function(note, type) {
      // Обновляем UI селектора
      this.updateTonalitySelectorUI(note, type);
      
      // Вычисляем код тональности для передачи в основное приложение
      const tonalityCode = type === 'minor' ? note + 'm' : note;
      
      // Проверяем, существует ли эта тональность в приложении
      if (window.TONALITY_DATA && window.TONALITY_DATA[tonalityCode]) {
        // Вызываем функцию изменения тональности из основного приложения
        if (window.UI && window.UI.changeTonality) {
          window.UI.changeTonality(tonalityCode);
        }
      } else {
        console.warn(`Тональность ${tonalityCode} отсутствует в базе данных приложения`);
      }
    },
  
    /**
     * Получение параллельной минорной тональности для мажорной
     * @param {string} majorNote - Мажорная нота
     * @returns {string} Минорная нота
     */
    getRelativeMinor: function(majorNote) {
      const noteMap = {
        'C': 'A', 'G': 'E', 'D': 'B', 'A': 'F#',
        'E': 'C#', 'B': 'G#', 'F#': 'D#', 'C#': 'A#',
        'F': 'D', 'Bb': 'G', 'Eb': 'C', 'Ab': 'F',
        'Db': 'Bb', 'Gb': 'Eb'
      };
      
      return noteMap[majorNote] || majorNote;
    },
  
    /**
     * Получение полного названия тональности
     * @param {string} note - Нота (C, G, D, и т.д.)
     * @param {string} type - Тип тональности (major или minor)
     * @returns {string} Полное название тональности
     */
    getFullTonalityName: function(note, type) {
      const noteNames = {
        'C': 'До', 'G': 'Соль', 'D': 'Ре', 'A': 'Ля', 'E': 'Ми', 'B': 'Си', 
        'F#': 'Фа-диез', 'C#': 'До-диез', 'F': 'Фа', 'Bb': 'Си-бемоль',
        'Eb': 'Ми-бемоль', 'Ab': 'Ля-бемоль', 'Db': 'Ре-бемоль', 'Gb': 'Соль-бемоль'
      };
      
      const typeNames = {
        'major': 'мажор',
        'minor': 'минор'
      };
      
      return `${noteNames[note] || note} ${typeNames[type] || type}`;
    }
  };
  
  // Экспортируем объект NewTonalitySelector для использования в других модулях
  window.NewTonalitySelector = NewTonalitySelector;
  
  // Инициализируем селектор при загрузке документа
  document.addEventListener('DOMContentLoaded', function() {
    // Ждем немного, чтобы убедиться, что основное приложение загружено
    setTimeout(function() {
      if (window.NewTonalitySelector) {
        window.NewTonalitySelector.initialize();
      }
    }, 500);
  });