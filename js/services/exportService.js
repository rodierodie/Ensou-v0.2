/**
 * exportService.js
 * Service for exporting chord sequences to MIDI and text
 */

import store from '../core/store.js';

class ExportService {
  constructor() {
    // Проверяем доступность библиотеки MidiWriter
    this.midiWriterAvailable = typeof MidiWriter !== 'undefined';
    
    if (!this.midiWriterAvailable) {
      console.warn('Библиотека MidiWriter не загружена. Экспорт MIDI будет недоступен.');
    }
  }
  
  /**
   * Экспорт текущей последовательности в MIDI
   * @param {boolean} exportFullTrack - Экспортировать весь трек вместо текущей последовательности
   */
  exportToMidi(exportFullTrack = false) {
    // Проверяем доступность MidiWriter
    if (!this.midiWriterAvailable) {
      alert('Библиотека MidiWriter не загружена. Экспорт MIDI недоступен.');
      return;
    }
    
    // Получаем данные для экспорта
    let sequence;
    if (exportFullTrack) {
      sequence = this.getFullTrackSequence();
    } else {
      sequence = store.getSequence();
    }
    
    // Проверяем, есть ли аккорды для экспорта
    if (!sequence || sequence.length === 0) {
      alert('Нет аккордов для экспорта');
      return;
    }
    
    // Получаем темп
    const tempo = store.getTempo();
    
    // Создаем MIDI-файл
    try {
      const midiData = this.createMidiFile(sequence, tempo);
      this.downloadMidiFile(midiData, exportFullTrack);
    } catch (error) {
      console.error('Ошибка создания MIDI-файла:', error);
      alert('Ошибка создания MIDI-файла');
    }
  }
  
  /**
   * Создание MIDI-файла из последовательности
   * @param {Array} sequence - Массив аккордов
   * @param {number} tempo - Темп в BPM
   * @returns {Uint8Array} Данные MIDI-файла
   */
  createMidiFile(sequence, tempo) {
    // Создаем дорожку
    const track = new MidiWriter.Track();
    
    // Устанавливаем темп
    track.setTempo(tempo);
    
    // Обрабатываем каждый аккорд в последовательности
    sequence.forEach(chordName => {
      // Обрабатываем специальные маркеры
      if (chordName === 'PAUSE') {
        // Добавляем паузу (половинная нота)
        track.addEvent(new MidiWriter.NoteEvent({
          wait: '0',
          duration: '2',
          sequential: true,
          rest: true
        }));
        return;
      }
      
      if (chordName === 'BLOCK_DIVIDER') {
        // Добавляем короткую паузу для разделителя блоков
        track.addEvent(new MidiWriter.NoteEvent({
          wait: '0',
          duration: '4',
          sequential: true,
          rest: true
        }));
        return;
      }
      
      // Получаем данные аккорда
      const chord = this.getChordData(chordName);
      if (!chord) {
        console.warn(`Данные аккорда не найдены для: ${chordName}`);
        return;
      }
      
      // Преобразуем ноты в MIDI-формат
      const midiNotes = this.convertNotesToMidi(chord.notes);
      
      // Создаем событие ноты
      const noteEvent = new MidiWriter.NoteEvent({
        pitch: midiNotes,
        duration: '2', // Половинная нота
        velocity: 80   // Громкость (0-100)
      });
      
      // Добавляем в дорожку
      track.addEvent(noteEvent);
    });
    
    // Создаем запись
    const writer = new MidiWriter.Writer(track);
    
    // Возвращаем двоичные данные
    return writer.buildFile();
  }
  
  /**
   * Преобразование нот в MIDI-формат
   * @param {Array} notes - Массив нот (например, ['C4', 'E4', 'G4'])
   * @returns {Array} Ноты в MIDI-формате
   */
  convertNotesToMidi(notes) {
    return notes.map(note => {
      // Просто возвращаем ноту как есть, т.к. MidiWriter ожидает этот формат
      return note;
    });
  }
  
  /**
   * Скачивание MIDI-файла
   * @param {Uint8Array} midiData - Двоичные данные MIDI-файла
   * @param {boolean} isFullTrack - Флаг полного трека
   */
  downloadMidiFile(midiData, isFullTrack) {
    // Получаем текущую тональность для имени файла
    const tonality = store.getCurrentTonality();
    
    // Создаем имя файла с текущей датой
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = isFullTrack ? 
      `track_${dateStr}.mid` : 
      `chord_sequence_${tonality}_${dateStr}.mid`;
    
    // Создаем Blob
    const blob = new Blob([midiData], { type: 'audio/midi' });
    
    // Создаем URL для скачивания
    const url = URL.createObjectURL(blob);
    
    // Создаем ссылку для скачивания
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    
    // Запускаем скачивание
    document.body.appendChild(a);
    a.click();
    
    // Очищаем ресурсы
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  /**
   * Экспорт текущей последовательности в текстовый формат
   * @param {boolean} exportFullTrack - Экспортировать весь трек вместо текущей последовательности
   */
  exportToText(exportFullTrack = false) {
    // Получаем данные для экспорта
    let content;
    if (exportFullTrack) {
      content = this.createFullTrackText();
    } else {
      content = this.createSequenceText();
    }
    
    // Показываем диалог с текстом
    this.showTextExportDialog(content);
  }
  
  /**
   * Создание текстового представления текущей последовательности
   * @returns {string} Текстовое представление
   */
  createSequenceText() {
    // Получаем текущую последовательность и тональность
    const sequence = store.getSequence();
    const tonality = store.getCurrentTonality();
    
    // Получаем информацию о тональности
    const tonalityInfo = window.TONALITY_DATA ? window.TONALITY_DATA[tonality] : null;
    const tonalityName = tonalityInfo ? tonalityInfo.name : tonality;
    
    // Создаем заголовок
    let text = `Аккордовая последовательность в тональности ${tonalityName}\n`;
    text += '─'.repeat(50) + '\n\n';
    
    // Добавляем аккорды (по 8 в строке)
    if (sequence && sequence.length > 0) {
      const chordsPerLine = 8;
      for (let i = 0; i < sequence.length; i += chordsPerLine) {
        const line = sequence.slice(i, i + chordsPerLine);
        text += line.map(chord => chord === 'PAUSE' ? '◊' : chord).join(' - ');
        text += '\n';
      }
    } else {
      text += 'Последовательность пуста\n';
    }
    
    // Добавляем информацию о функциях аккордов
    text += '\n' + '─'.repeat(50) + '\n';
    text += 'Функциональное значение аккордов:\n\n';
    
    if (sequence && sequence.length > 0) {
      // Создаем множество для избежания дубликатов
      const processedChords = new Set();
      
      sequence.forEach(chordName => {
        // Пропускаем паузы и уже обработанные аккорды
        if (chordName === 'PAUSE' || processedChords.has(chordName)) return;
        
        // Помечаем аккорд как обработанный
        processedChords.add(chordName);
        
        // Получаем данные аккорда
        const chord = this.getChordData(chordName);
        if (!chord) return;
        
        // Получаем функцию в текущей тональности
        const func = chord.functions && chord.functions[tonality];
        if (func) {
          text += `${chordName}: ${func.function} (ступень ${func.degree})\n`;
        }
      });
    }
    
    // Добавляем информацию о приложении
    text += '\n' + '─'.repeat(50) + '\n';
    text += 'Создано в приложении "Изучение музыкальной гармонии"\n';
    
    return text;
  }
  
  /**
   * Создание текстового представления всего трека
   * @returns {string} Текстовое представление
   */
  createFullTrackText() {
    // Получаем структуру трека
    const trackStructure = store.getTrackStructure();
    
    // Создаем заголовок
    let text = 'СТРУКТУРА ТРЕКА\n';
    text += '═'.repeat(50) + '\n\n';
    
    // Обрабатываем каждый блок
    trackStructure.forEach((block) => {
      // Заголовок блока
      text += `БЛОК ${block.name} (${block.tonality})\n`;
      text += '─'.repeat(30) + '\n';
      
      // Если блок пустой
      if (!block.chords || block.chords.length === 0) {
        text += 'Нет аккордов\n\n';
        return;
      }
      
      // Добавляем аккорды (по 8 в строке)
      const chordsPerLine = 8;
      for (let i = 0; i < block.chords.length; i += chordsPerLine) {
        const line = block.chords.slice(i, i + chordsPerLine);
        text += line.map(chord => chord === 'PAUSE' ? '◊' : chord).join(' - ');
        text += '\n';
      }
      
      // Добавляем разделитель между блоками
      text += '\n';
    });
    
    // Добавляем информацию о приложении
    text += '═'.repeat(50) + '\n';
    text += 'Создано в приложении "Изучение музыкальной гармонии"\n';
    
    return text;
  }
  
  /**
   * Показать диалог для экспорта текста
   * @param {string} text - Текстовое содержимое
   */
  showTextExportDialog(text) {
    // Создаем затемнение
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    // Создаем диалог
    const dialog = document.createElement('div');
    dialog.style.backgroundColor = 'white';
    dialog.style.borderRadius = '8px';
    dialog.style.padding = '20px';
    dialog.style.width = '90%';
    dialog.style.maxWidth = '600px';
    dialog.style.maxHeight = '80vh';
    dialog.style.overflow = 'auto';
    
    // Заголовок диалога
    const title = document.createElement('h3');
    title.textContent = 'Экспорт в текст';
    title.style.marginTop = '0';
    dialog.appendChild(title);
    
    // Текстовое поле с содержимым
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.width = '100%';
    textarea.style.height = '300px';
    textarea.style.marginBottom = '15px';
    textarea.style.padding = '10px';
    textarea.style.border = '1px solid #ddd';
    textarea.style.borderRadius = '4px';
    textarea.style.fontFamily = 'monospace';
    dialog.appendChild(textarea);
    
    // Контейнер для кнопок
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    
    // Кнопка копирования
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Копировать';
    copyButton.addEventListener('click', () => {
      textarea.select();
      document.execCommand('copy');
      alert('Текст скопирован в буфер обмена');
    });
    buttonContainer.appendChild(copyButton);
    
    // Кнопка закрытия
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Закрыть';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    buttonContainer.appendChild(closeButton);
    
    // Добавляем кнопки в диалог
    dialog.appendChild(buttonContainer);
    
    // Добавляем диалог в затемнение
    overlay.appendChild(dialog);
    
    // Добавляем затемнение на страницу
    document.body.appendChild(overlay);
    
    // Выделяем текст для удобства копирования
    textarea.select();
  }
  
  /**
   * Получение полной последовательности всего трека
   * @returns {Array} Комбинированная последовательность
   */
  getFullTrackSequence() {
    // Получаем структуру трека
    const trackStructure = store.getTrackStructure();
    
    // Комбинируем все блоки
    const fullSequence = [];
    
    trackStructure.forEach((block, index) => {
      // Добавляем разделитель блоков, если не первый блок
      if (index > 0) {
        fullSequence.push('BLOCK_DIVIDER');
      }
      
      // Добавляем аккорды блока
      if (block.chords && block.chords.length > 0) {
        fullSequence.push(...block.chords);
      }
    });
    
    return fullSequence;
  }
  
  /**
   * Получение данных аккорда
   * @param {string} chordName - Название аккорда
   * @returns {Object|null} Данные аккорда или null
   */
  getChordData(chordName) {
    return window.CHORD_DATA ? window.CHORD_DATA[chordName] : null;
  }
}

// Создаем синглтон
const exportService = new ExportService();

export default exportService;