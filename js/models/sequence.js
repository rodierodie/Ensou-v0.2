// js/models/sequence.js
class ChordSequence {
  constructor(chords = [], tonality = 'C') {
      this.chords = [...chords];
      this.tonality = tonality;
  }
  
  // Добавить аккорд в последовательность
  addChord(chord) {
      this.chords.push(chord);
  }
  
  // Удалить аккорд из последовательности
  removeChord(index) {
      if (index < 0 || index >= this.chords.length) {
          return null;
      }
      
      return this.chords.splice(index, 1)[0];
  }
  
  // Получить все аккорды
  getAllChords() {
      return [...this.chords];
  }
  
  // Получить аккорд по индексу
  getChordAt(index) {
      if (index < 0 || index >= this.chords.length) {
          return null;
      }
      
      return this.chords[index];
  }
  
  // Заменить аккорд по индексу
  setChordAt(index, chord) {
      if (index < 0 || index >= this.chords.length) {
          return false;
      }
      
      this.chords[index] = chord;
      return true;
  }
  
  // Вставить аккорд по индексу
  insertChord(index, chord) {
      this.chords.splice(index, 0, chord);
  }
  
  // Очистить последовательность
  clear() {
      this.chords = [];
  }
  
  // Установить тональность
  setTonality(tonality) {
      this.tonality = tonality;
  }
  
  // Получить тональность
  getTonality() {
      return this.tonality;
  }
  
  // Добавить паузу
  addPause() {
      this.addChord('PAUSE');
  }
  
  // Проверить, пуста ли последовательность
  isEmpty() {
      return this.chords.length === 0;
  }
  
  // Получить длину последовательности
  getLength() {
      return this.chords.length;
  }
  
  // Найти все вхождения аккорда
  findChord(chord) {
      const indices = [];
      
      this.chords.forEach((c, index) => {
          if (c === chord) {
              indices.push(index);
          }
      });
      
      return indices;
  }
  
  // Получить последний аккорд (не паузу)
  getLastChord() {
      for (let i = this.chords.length - 1; i >= 0; i--) {
          if (this.chords[i] !== 'PAUSE' && this.chords[i] !== 'BLOCK_DIVIDER') {
              return this.chords[i];
          }
      }
      
      return null;
  }
  
  // Клонировать последовательность
  clone() {
      return new ChordSequence([...this.chords], this.tonality);
  }
  
  // Строковое представление
  toString() {
      return this.chords.map(chord => {
          if (chord === 'PAUSE') return '◊';
          if (chord === 'BLOCK_DIVIDER') return '|';
          return chord;
      }).join(' - ');
  }
}

// Блок трека
class TrackBlock {
  constructor(id, name, tonality, chords = []) {
      this.id = id || 'block_' + Date.now();
      this.name = name;
      this.tonality = tonality;
      this.chords = [...chords];
  }
  
  // Получить последовательность блока
  getSequence() {
      return new ChordSequence(this.chords, this.tonality);
  }
  
  // Установить последовательность
  setSequence(sequence) {
      this.chords = sequence.getAllChords();
      this.tonality = sequence.getTonality();
  }
  
  // Проверить, пуст ли блок
  isEmpty() {
      return this.chords.length === 0;
  }
  
  // Клонировать блок
  clone(newName = null) {
      return new TrackBlock(
          'block_' + Date.now(),
          newName || this.name,
          this.tonality,
          [...this.chords]
      );
  }
}

// Структура трека
class TrackStructure {
  constructor(blocks = []) {
      this.blocks = [...blocks];
      this.currentBlockIndex = 0;
  }
  
  // Добавить блок
  addBlock(block) {
      this.blocks.push(block);
  }
  
  // Удалить блок
  removeBlock(index) {
      if (index < 0 || index >= this.blocks.length) {
          return null;
      }
      
      // Корректируем индекс текущего блока
      if (index === this.currentBlockIndex) {
          this.currentBlockIndex = Math.max(0, this.blocks.length - 2);
      } else if (index < this.currentBlockIndex) {
          this.currentBlockIndex--;
      }
      
      return this.blocks.splice(index, 1)[0];
  }
  
  // Получить все блоки
  getAllBlocks() {
      return [...this.blocks];
  }
  
  // Получить блок по индексу
  getBlockAt(index) {
      if (index < 0 || index >= this.blocks.length) {
          return null;
      }
      
      return this.blocks[index];
  }
  
  // Получить текущий блок
  getCurrentBlock() {
      return this.getBlockAt(this.currentBlockIndex);
  }
  
  // Установить индекс текущего блока
  setCurrentBlockIndex(index) {
      if (index < 0 || index >= this.blocks.length) {
          return false;
      }
      
      this.currentBlockIndex = index;
      return true;
  }
  
  // Вставить блок по индексу
  insertBlock(index, block) {
      // Корректируем индекс текущего блока
      if (index <= this.currentBlockIndex) {
          this.currentBlockIndex++;
      }
      
      this.blocks.splice(index, 0, block);
  }
  
  // Дублировать блок
  duplicateBlock(index) {
      const block = this.getBlockAt(index);
      if (!block) {
          return -1;
      }
      
      // Генерируем имя для дубликата
      const newName = this.generateNextBlockName(block.name);
      
      // Клонируем блок
      const newBlock = block.clone(newName);
      
      // Вставляем после оригинала
      this.insertBlock(index + 1, newBlock);
      
      return index + 1;
  }
  
  // Генерация имени для нового блока
  generateNextBlockName(baseName = null) {
      if (baseName) {
          // Для дублирования - используем ту же букву с новым номером
          const match = baseName.match(/^([A-Z])(\d+)$/);
          if (match) {
              const prefix = match[1];
              const number = parseInt(match[2], 10);
              
              // Находим максимальный номер с этим префиксом
              let maxNumber = number;
              this.blocks.forEach(block => {
                  const blockMatch = block.name.match(/^([A-Z])(\d+)$/);
                  if (blockMatch && blockMatch[1] === prefix) {
                      const blockNumber = parseInt(blockMatch[2], 10);
                      if (blockNumber > maxNumber) {
                          maxNumber = blockNumber;
                      }
                  }
              });
              
              // Возвращаем следующий номер с тем же префиксом
              return prefix + (maxNumber + 1);
          }
      }
      
      // Стандартная логика для новых блоков
      if (this.blocks.length === 0) {
          return 'A1';
      }
      
      // Находим последний использованный префикс и номер
      let lastPrefix = 'A';
      let lastNumber = 0;
      
      this.blocks.forEach(block => {
          const match = block.name.match(/^([A-Z])(\d+)$/);
          if (match) {
              const prefix = match[1];
              const number = parseInt(match[2], 10);
              
              if (prefix > lastPrefix) {
                  lastPrefix = prefix;
                  lastNumber = number;
              } else if (prefix === lastPrefix && number > lastNumber) {
                  lastNumber = number;
              }
          }
      });
      
      // Определяем следующий префикс/номер
      const nextNumber = lastNumber + 1;
      
      // Если номер > 9, переходим к следующей букве
      if (nextNumber > 9) {
          const nextPrefixCode = lastPrefix.charCodeAt(0) + 1;
          if (nextPrefixCode <= 'Z'.charCodeAt(0)) {
              return String.fromCharCode(nextPrefixCode) + '1';
          } else {
              // Если заканчиваются буквы, просто увеличиваем номер
              return lastPrefix + nextNumber;
          }
      } else {
          return lastPrefix + nextNumber;
      }
  }
  
  // Переименовать блок
  renameBlock(index, newName) {
      const block = this.getBlockAt(index);
      if (!block) {
          return false;
      }
      
      // Проверка формата имени
      if (!/^[A-Z][1-9](\d*)$/.test(newName)) {
          return false;
      }
      
      block.name = newName;
      return true;
  }
  
  // Изменить тональность блока
  changeBlockTonality(index, newTonality) {
      const block = this.getBlockAt(index);
      if (!block) {
          return false;
      }
      
      block.tonality = newTonality;
      return true;
  }
  
  // Получить все аккорды из всех блоков
  getAllChords() {
      const allChords = [];
      
      this.blocks.forEach((block, index) => {
          // Добавляем разделитель блоков, если не первый блок
          if (index > 0) {
              allChords.push('BLOCK_DIVIDER');
          }
          
          // Добавляем аккорды блока
          allChords.push(...block.chords);
      });
      
      return allChords;
  }
  
  // Создать стандартную структуру с одним пустым блоком
  static createDefault(tonality = 'C') {
      const defaultBlock = new TrackBlock(
          'block_' + Date.now(),
          'A1',
          tonality,
          []
      );
      
      return new TrackStructure([defaultBlock]);
  }
}

export { ChordSequence, TrackBlock, TrackStructure };