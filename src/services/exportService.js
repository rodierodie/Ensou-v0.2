import { Chord } from '../models/chord.js';

/**
 * Сервис для экспорта последовательностей аккордов в разные форматы
 */
export class ExportService {
    constructor() {
        // Привязка методов к контексту
        this.exportToMidi = this.exportToMidi.bind(this);
        this.exportToText = this.exportToText.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
    }

    /**
     * Экспорт последовательности аккордов в MIDI формат
     * @param {Array} sequence - Последовательность аккордов
     * @param {Object} options - Опции экспорта
     * @param {string} options.filename - Имя файла
     * @param {number} options.tempo - Темп в BPM
     * @param {string} options.trackName - Название трека
     * @returns {Promise} - Промис, который разрешается после экспорта
     */
    exportToMidi(sequence, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                // Проверяем наличие библиотеки MidiWriter
                if (!window.MidiWriter) {
                    reject(new Error('MidiWriter не загружен. Невозможно создать MIDI файл.'));
                    return;
                }

                // Настройки по умолчанию
                const settings = {
                    filename: options.filename || 'chord_sequence',
                    tempo: options.tempo || 120,
                    trackName: options.trackName || 'ChordPlayer Sequence'
                };

                // Создаем трек
                const track = new window.MidiWriter.Track();

                // Добавляем название трека
                track.addEvent(new window.MidiWriter.MetaEvent({
                    data: settings.trackName,
                    type: window.MidiWriter.MetaEvent.TRACK_NAME
                }));

                // Добавляем темп
                track.setTempo(settings.tempo);

                // Перебираем элементы последовательности
                sequence.forEach(item => {
                    if (item.isPause) {
                        // Добавляем паузу
                        track.addEvent(new window.MidiWriter.NoteEvent({
                            pitch: ['Gn/0'], // Тихая нота для паузы
                            duration: '1', // Целая нота
                            velocity: 0, // Тихая нота для паузы
                            wait: 'd4'  // Добавляем задержку для паузы
                        }));
                    } else if (item.chord) {
                        // Создаем объект аккорда из данных
                        const chord = new Chord(
                            item.chord.root,
                            item.chord.type,
                            {
                                degree: item.chord.degree,
                                function: item.chord.function,
                                inTonality: item.chord.inTonality
                            }
                        );

                        // Преобразуем ноты аккорда в формат MIDI
                        const notes = this.formatChordNotesForMidi(chord.getNotes());

                        // Добавляем аккорд в трек
                        track.addEvent(new window.MidiWriter.NoteEvent({
                            pitch: notes,
                            duration: '1', // Целая нота
                            velocity: 100
                        }));
                    }
                });

                // Создаем объект записи MIDI
                const write = new window.MidiWriter.Writer([track]);

                // Получаем данные MIDI
                const midiData = write.dataUri();

                // Загружаем файл
                this.downloadFile(midiData, `${settings.filename}.mid`);

                resolve(midiData);
            } catch (error) {
                console.error('Ошибка при экспорте в MIDI:', error);
                reject(error);
            }
        });
    }

    /**
     * Форматирование нот аккорда для MIDI
     * @param {Array<string>} notes - Ноты аккорда
     * @param {number} [octave=4] - Базовая октава
     * @returns {Array<string>} - Ноты в формате MIDI
     */
    formatChordNotesForMidi(notes, octave = 4) {
        // Преобразуем ноты в формат, понятный MidiWriter
        return notes.map((note, index) => {
            // Определяем октаву для ноты (все ноты аккорда в одной октаве)
            const noteOctave = octave;
            
            // Преобразуем в формат MidiWriter: C4 -> Cn/4
            // Заменяем # на s (диез) и b на f (бемоль)
            let midiNote = note.replace('#', 's').replace('b', 'f');
            
            // Добавляем n (натуральная нота) если нет модификаторов
            if (!midiNote.includes('s') && !midiNote.includes('f')) {
                midiNote += 'n';
            }
            
            return `${midiNote}/${noteOctave}`;
        });
    }

    /**
     * Экспорт последовательности аккордов в текстовый формат
     * @param {Array} sequence - Последовательность аккордов
     * @param {Object} options - Опции экспорта
     * @param {string} options.filename - Имя файла
     * @param {Object} options.tonality - Тональность
     * @param {string} options.blockId - ID блока
     * @returns {Promise} - Промис, который разрешается после экспорта
     */
    exportToText(sequence, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                // Настройки по умолчанию
                const settings = {
                    filename: options.filename || 'chord_sequence',
                    tonality: options.tonality || { note: 'C', type: 'dur' },
                    blockId: options.blockId || 'Block'
                };

                // Создаем текстовое представление последовательности
                const chords = sequence.map(item => {
                    if (item.isPause) {
                        return '[Пауза]';
                    } else if (item.chord) {
                        return item.chord.getName();
                    }
                    return '';
                }).join(' | ');

                // Создаем текст с информацией
                const text = `# ChordPlayer Sequence\n\n` +
                             `Block: ${settings.blockId}\n` +
                             `Tonality: ${settings.tonality.note} ${settings.tonality.type}\n\n` +
                             `Sequence:\n${chords}`;

                // Создаем объект Blob для текста
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);

                // Загружаем файл
                this.downloadFile(url, `${settings.filename}.txt`);
                
                // Освобождаем URL объект
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 100);

                resolve(text);
            } catch (error) {
                console.error('Ошибка при экспорте в текст:', error);
                reject(error);
            }
        });
    }

    /**
     * Загрузка файла через браузер
     * @param {string} url - URL файла или Data URI
     * @param {string} filename - Имя файла
     */
    downloadFile(url, filename) {
        // Создаем временную ссылку
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // Добавляем ссылку в DOM
        document.body.appendChild(link);
        
        // Имитируем клик
        link.click();
        
        // Удаляем ссылку
        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);
    }
}

// Создаем экземпляр сервиса
const exportService = new ExportService();

// Экспортируем по умолчанию
export default exportService;