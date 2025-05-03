// js/models/chord.js
class Chord {
  constructor(name, notes, fullName, description, functions = {}) {
      this.name = name;             // Название аккорда (C, Am, G7, и т.д.)
      this.notes = notes;           // Массив нот (["C4", "E4", "G4"])
      this.fullName = fullName;     // Полное название (До мажор)
      this.description = description; // Описание (Мажорное трезвучие)
      this.functions = functions;   // Функции в разных тональностях
  }
  
  // Получить корневую ноту аккорда
  getRootNote() {
      // Извлекаем корневую ноту из названия аккорда
      if (this.name.match(/^([A-G][#b]?)m7b5$/)) {
          return this.name.match(/^([A-G][#b]?)m7b5$/)[1];
      } else if (this.name.match(/^([A-G][#b]?)m7$/)) {
          return this.name.match(/^([A-G][#b]?)m7$/)[1];
      } else if (this.name.match(/^([A-G][#b]?)maj7$/)) {
          return this.name.match(/^([A-G][#b]?)maj7$/)[1];
      } else if (this.name.match(/^([A-G][#b]?)7$/)) {
          return this.name.match(/^([A-G][#b]?)7$/)[1];
      } else if (this.name.match(/^([A-G][#b]?)dim$/)) {
          return this.name.match(/^([A-G][#b]?)dim$/)[1];
      } else if (this.name.match(/^([A-G][#b]?)m$/)) {
          return this.name.match(/^([A-G][#b]?)m$/)[1];
      } else {
          return this.name;
      }
  }
  
  // Получить функцию аккорда в конкретной тональности
  getFunctionInTonality(tonality) {
      return this.functions[tonality] || null;
  }
  
  // Проверить, минорный ли аккорд
  isMinor() {
      return this.name.includes('m') && !this.name.includes('maj');
  }
  
  // Проверить, мажорный ли аккорд
  isMajor() {
      return !this.isMinor() && !this.isDiminished();
  }
  
  // Проверить, уменьшенный ли аккорд
  isDiminished() {
      return this.name.includes('dim');
  }
  
  // Проверить, септаккорд ли это
  isSeventh() {
      return this.name.includes('7');
  }
  
  // Получить названия нот без октавы
  getNoteNames() {
      return this.notes.map(note => note.replace(/[0-9]/g, ''));
  }
}

// Коллекция аккордов
class ChordCollection {
  constructor() {
      this.chords = new Map();
  }
  
  // Добавить аккорд в коллекцию
  addChord(chord) {
      this.chords.set(chord.name, chord);
  }
  
  // Получить аккорд по названию
  getChord(name) {
      return this.chords.get(name);
  }
  
  // Получить все аккорды
  getAllChords() {
      return Array.from(this.chords.values());
  }
  
  // Получить аккорды по тональности
  getChordsByTonality(tonality) {
      return this.getAllChords().filter(chord => 
          chord.functions && chord.functions[tonality]
      );
  }
  
  // Получить аккорды по функции в тональности
  getChordsByFunction(tonality, functionName) {
      return this.getChordsByTonality(tonality).filter(chord => 
          chord.functions[tonality] && 
          chord.functions[tonality].function === functionName
      );
  }
  
  // Инициализация из глобальных данных
  initializeDefaultChords() {
      // Проверяем наличие глобальных данных
      if (!window.CHORD_DATA) {
          console.warn('Глобальные данные об аккордах не найдены');
          return;
      }
      
      // Конвертируем глобальные данные в объекты Chord
      Object.entries(window.CHORD_DATA).forEach(([name, data]) => {
          const chord = new Chord(
              name,
              data.notes,
              data.fullName,
              data.description,
              data.functions
          );
          
          this.addChord(chord);
      });
      
      console.log(`Инициализировано ${this.chords.size} аккордов`);
  }
}

// Создаем и экспортируем синглтон коллекцию аккордов
const chordCollection = new ChordCollection();

export { Chord, chordCollection };