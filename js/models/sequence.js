/**
 * sequence.js
 * Models for managing chord sequences and track structure
 */

/**
 * ChordSequence represents a sequence of chords in a specific tonality
 */
class ChordSequence {
  /**
   * Create a new ChordSequence
   * @param {Array} chords - Array of chord names
   * @param {string} tonality - Tonality code
   */
  constructor(chords = [], tonality = 'C') {
    this.chords = [...chords];
    this.tonality = tonality;
  }
  
  /**
   * Add chord to sequence
   * @param {string} chord - Chord name
   */
  addChord(chord) {
    this.chords.push(chord);
  }
  
  /**
   * Remove chord from sequence
   * @param {number} index - Index of chord to remove
   * @returns {string|null} Removed chord or null
   */
  removeChord(index) {
    if (index < 0 || index >= this.chords.length) {
      return null;
    }
    
    return this.chords.splice(index, 1)[0];
  }
  
  /**
   * Get all chords
   * @returns {Array} Array of chord names
   */
  getAllChords() {
    return [...this.chords];
  }
  
  /**
   * Get chord at index
   * @param {number} index - Index of chord
   * @returns {string|null} Chord name or null
   */
  getChordAt(index) {
    if (index < 0 || index >= this.chords.length) {
      return null;
    }
    
    return this.chords[index];
  }
  
  /**
   * Set chord at index
   * @param {number} index - Index of chord
   * @param {string} chord - Chord name
   * @returns {boolean} Success flag
   */
  setChordAt(index, chord) {
    if (index < 0 || index >= this.chords.length) {
      return false;
    }
    
    this.chords[index] = chord;
    return true;
  }
  
  /**
   * Insert chord at index
   * @param {number} index - Index to insert at
   * @param {string} chord - Chord name
   */
  insertChord(index, chord) {
    this.chords.splice(index, 0, chord);
  }
  
  /**
   * Clear sequence
   */
  clear() {
    this.chords = [];
  }
  
  /**
   * Set tonality
   * @param {string} tonality - Tonality code
   */
  setTonality(tonality) {
    this.tonality = tonality;
  }
  
  /**
   * Get tonality
   * @returns {string} Tonality code
   */
  getTonality() {
    return this.tonality;
  }
  
  /**
   * Add pause
   */
  addPause() {
    this.addChord('PAUSE');
  }
  
  /**
   * Check if sequence is empty
   * @returns {boolean} True if empty
   */
  isEmpty() {
    return this.chords.length === 0;
  }
  
  /**
   * Get sequence length
   * @returns {number} Number of chords
   */
  getLength() {
    return this.chords.length;
  }
  
  /**
   * Find all occurrences of chord
   * @param {string} chord - Chord name
   * @returns {Array} Array of indices
   */
  findChord(chord) {
    const indices = [];
    
    this.chords.forEach((c, index) => {
      if (c === chord) {
        indices.push(index);
      }
    });
    
    return indices;
  }
  
  /**
   * Get last chord (not pause)
   * @returns {string|null} Last chord or null
   */
  getLastChord() {
    for (let i = this.chords.length - 1; i >= 0; i--) {
      if (this.chords[i] !== 'PAUSE' && this.chords[i] !== 'BLOCK_DIVIDER') {
        return this.chords[i];
      }
    }
    
    return null;
  }
  
  /**
   * Clone sequence
   * @returns {ChordSequence} New sequence
   */
  clone() {
    return new ChordSequence([...this.chords], this.tonality);
  }
  
  /**
   * String representation
   * @returns {string} String representation
   */
  toString() {
    return this.chords.map(chord => {
      if (chord === 'PAUSE') return '◊';
      if (chord === 'BLOCK_DIVIDER') return '|';
      return chord;
    }).join(' - ');
  }
}

/**
 * TrackBlock represents a block of chords in track structure
 */
class TrackBlock {
  /**
   * Create a new TrackBlock
   * @param {string} id - Block ID
   * @param {string} name - Block name
   * @param {string} tonality - Block tonality
   * @param {Array} chords - Block chords
   */
  constructor(id, name, tonality, chords = []) {
    this.id = id || 'block_' + Date.now();
    this.name = name;
    this.tonality = tonality;
    this.chords = [...chords];
  }
  
  /**
   * Get block sequence
   * @returns {ChordSequence} Block sequence
   */
  getSequence() {
    return new ChordSequence(this.chords, this.tonality);
  }
  
  /**
   * Set block sequence
   * @param {ChordSequence} sequence - Sequence to set
   */
  setSequence(sequence) {
    this.chords = sequence.getAllChords();
    this.tonality = sequence.getTonality();
  }
  
  /**
   * Check if block is empty
   * @returns {boolean} True if empty
   */
  isEmpty() {
    return this.chords.length === 0;
  }
  
  /**
   * Clone block
   * @param {string} [newName] - New block name
   * @returns {TrackBlock} New block
   */
  clone(newName = null) {
    return new TrackBlock(
      'block_' + Date.now(),
      newName || this.name,
      this.tonality,
      [...this.chords]
    );
  }
}

/**
 * TrackStructure represents the structure of track blocks
 */
class TrackStructure {
  /**
   * Create a new TrackStructure
   * @param {Array} blocks - Array of TrackBlock objects
   */
  constructor(blocks = []) {
    this.blocks = [...blocks];
    this.currentBlockIndex = 0;
  }
  
  /**
   * Add block
   * @param {TrackBlock} block - Block to add
   */
  addBlock(block) {
    this.blocks.push(block);
  }
  
  /**
   * Remove block
   * @param {number} index - Block index
   * @returns {TrackBlock|null} Removed block or null
   */
  removeBlock(index) {
    if (index < 0 || index >= this.blocks.length) {
      return null;
    }
    
    // Adjust current block index
    if (index === this.currentBlockIndex) {
      this.currentBlockIndex = Math.max(0, this.blocks.length - 2);
    } else if (index < this.currentBlockIndex) {
      this.currentBlockIndex--;
    }
    
    return this.blocks.splice(index, 1)[0];
  }
  
  /**
   * Get all blocks
   * @returns {Array} Array of blocks
   */
  getAllBlocks() {
    return [...this.blocks];
  }
  
  /**
   * Get block at index
   * @param {number} index - Block index
   * @returns {TrackBlock|null} Block or null
   */
  getBlockAt(index) {
    if (index < 0 || index >= this.blocks.length) {
      return null;
    }
    
    return this.blocks[index];
  }
  
  /**
   * Get current block
   * @returns {TrackBlock|null} Current block or null
   */
  getCurrentBlock() {
    return this.getBlockAt(this.currentBlockIndex);
  }
  
  /**
   * Set current block index
   * @param {number} index - Block index
   * @returns {boolean} Success flag
   */
  setCurrentBlockIndex(index) {
    if (index < 0 || index >= this.blocks.length) {
      return false;
    }
    
    this.currentBlockIndex = index;
    return true;
  }
  
  /**
   * Insert block at index
   * @param {number} index - Index to insert at
   * @param {TrackBlock} block - Block to insert
   */
  insertBlock(index, block) {
    // Adjust current block index
    if (index <= this.currentBlockIndex) {
      this.currentBlockIndex++;
    }
    
    this.blocks.splice(index, 0, block);
  }
  
  /**
   * Duplicate block
   * @param {number} index - Block index
   * @returns {number} Index of new block
   */
  duplicateBlock(index) {
    const block = this.getBlockAt(index);
    if (!block) {
      return -1;
    }
    
    // Generate name for duplicate
    const newName = this.generateNextBlockName(block.name);
    
    // Clone block
    const newBlock = block.clone(newName);
    
    // Insert after original
    this.insertBlock(index + 1, newBlock);
    
    return index + 1;
  }
  
  /**
   * Generate next block name
   * @param {string} [baseName] - Base name for duplicating
   * @returns {string} New block name
   */
  generateNextBlockName(baseName = null) {
    if (baseName) {
      // For duplicating - use same letter with new number
      const match = baseName.match(/^([A-Z])(\d+)$/);
      if (match) {
        const prefix = match[1];
        const number = parseInt(match[2], 10);
        
        // Find highest number with this prefix
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
        
        // Return next number with same prefix
        return prefix + (maxNumber + 1);
      }
    }
    
    // Standard logic for new blocks
    if (this.blocks.length === 0) {
      return 'A1';
    }
    
    // Find the last used prefix and number
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
    
    // Determine next prefix/number
    const nextNumber = lastNumber + 1;
    
    // If number > 9, move to next letter
    if (nextNumber > 9) {
      const nextPrefixCode = lastPrefix.charCodeAt(0) + 1;
      if (nextPrefixCode <= 'Z'.charCodeAt(0)) {
        return String.fromCharCode(nextPrefixCode) + '1';
      } else {
        // If running out of letters, keep incrementing number
        return lastPrefix + nextNumber;
      }
    } else {
      return lastPrefix + nextNumber;
    }
  }
  
  /**
   * Rename block
   * @param {number} index - Block index
   * @param {string} newName - New block name
   * @returns {boolean} Success flag
   */
  renameBlock(index, newName) {
    const block = this.getBlockAt(index);
    if (!block) {
      return false;
    }
    
    // Check name format
    if (!/^[A-Z][1-9](\d*)$/.test(newName)) {
      return false;
    }
    
    block.name = newName;
    return true;
  }
  
  /**
   * Change block tonality
   * @param {number} index - Block index
   * @param {string} newTonality - New tonality
   * @returns {boolean} Success flag
   */
  changeBlockTonality(index, newTonality) {
    const block = this.getBlockAt(index);
    if (!block) {
      return false;
    }
    
    block.tonality = newTonality;
    return true;
  }
  
  /**
   * Get all chords from all blocks
   * @returns {Array} Array of chords
   */
  getAllChords() {
    const allChords = [];
    
    this.blocks.forEach((block, index) => {
      // Add block divider if not first block
      if (index > 0) {
        allChords.push('BLOCK_DIVIDER');
      }
      
      // Add block chords
      allChords.push(...block.chords);
    });
    
    return allChords;
  }
  
  /**
   * Create default track structure
   * @param {string} [tonality] - Default tonality
   * @returns {TrackStructure} New track structure
   */
  static createDefault(tonality = 'C') {
    const defaultBlock = new TrackBlock(
      'block_' + Date.now(),
      'A1',
      tonality,
      []
    );
    
    return new TrackStructure([defaultBlock]);
  }
  
  /**
   * Play full track
   */
  playFullTrack() {
    const allChords = this.getAllChords();
    if (allChords.length === 0) {
      console.warn('Track is empty, nothing to play');
      return;
    }
    
    // Use global Sequencer if available for backward compatibility
    if (window.Sequencer && typeof window.Sequencer.playCustomSequence === 'function') {
      window.Sequencer.playCustomSequence(allChords, true);
    } else {
      console.warn('Sequencer not available to play full track');
    }
  }
}

export { ChordSequence, TrackBlock, TrackStructure };