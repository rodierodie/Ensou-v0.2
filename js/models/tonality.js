// js/models/tonality.js
class Tonality {
  constructor(code, name, type, signature, chords) {
      this.code = code;         // Код тональности (C, G, Am, и т.д.)
      this.name = name;         // Полное название (До мажор, Ля минор)
      this.type = type;         // Тип (major/minor)
      this.signature = signature; // Ключевые знаки (0, 1#, 2b, и т.д.)
      this.chords = chords || { basic: [], seventh: [] }; // Аккорды
  }
  
  // Получить корневую ноту тональности
  getRootNote() {
      return this.isMinor() ? this.code.slice(0, -1) : this.code;
  }
  
  // Проверить, минорная ли тональность
  isMinor() {
      return this.type === 'minor';
  }
  
  // Получить все аккорды тональности
  getAllChords() {
      return [...this.chords.basic, ...this.chords.seventh];
  }
}

// Коллекция тональностей
class TonalityCollection {
  constructor() {
      this.tonalities = new Map();
  }
  
  // Добавить тональность в коллекцию
  addTonality(tonality) {
      this.tonalities.set(tonality.code, tonality);
  }
  
  // Получить тональность по коду
  getTonality(code) {
      return this.tonalities.get(code);
  }
  
  // Получить все тональности
  getAllTonalities() {
      return Array.from(this.tonalities.values());
  }
  
  // Получить мажорные тональности
  getMajorTonalities() {
      return this.getAllTonalities().filter(tonality => tonality.type === 'major');
  }
  
  // Получить минорные тональности
  getMinorTonalities() {
      return this.getAllTonalities().filter(tonality => tonality.type === 'minor');
  }
  
  // Инициализация стандартных тональностей из глобальных данных
  initializeDefaultTonalities() {
      // Проверяем наличие глобальных данных
      if (!window.TONALITY_DATA) {
          console.warn('Глобальные данные о тональностях не найдены');
          return;
      }
      
      // Конвертируем глобальные данные в объекты Tonality
      Object.entries(window.TONALITY_DATA).forEach(([code, data]) => {
          const tonality = new Tonality(
              code,
              data.name,
              data.type,
              data.signature,
              data.chords
          );
          
          this.addTonality(tonality);
      });
      
      console.log(`Инициализировано ${this.tonalities.size} тональностей`);
  }
}

// Создаем и экспортируем синглтон коллекцию тональностей
const tonalityCollection = new TonalityCollection();

export { Tonality, tonalityCollection };