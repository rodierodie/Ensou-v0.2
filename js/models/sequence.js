/**
 * sequence.js
 * Models for chord sequences and track structure
 */

/**
 * Class representing a sequence of chords
 */
class ChordSequence {
    /**
     * Create a new ChordSequence
     * @param {Array} chords - Array of chord names or special markers ('PAUSE', 'BLOCK_DIVIDER')
     * @param {string} tonality - Tonality code
     */
    constructor(chords = [], tonality = 'C') {
      this.chords = [...chords];
      this.tonality = tonality;
    }
    
    /**
     * Add a chord to the sequence
     * @param {string} chord - Chord name or special marker
     */
    addChord(chord) {
      this.chords.push(chord);
    }
    
    /**
     * Remove a chord from the sequence
     * @param {number} index - Index of chord to remove
     * @returns {string|null} Removed chord or null if index is invalid
     */
    removeChord(index) {
      if (index < 0 || index >= this.chords.length) {
        return null;
      }
      
      return this.chords.splice(index, 1)[0];
    }
    
    /**
     * Get all chords in the sequence
     * @returns {Array} Array of chord names
     */
    getAllChords() {
      return [...this.chords];
    }
    
    /**
     * Get chord at specific index
     * @param {number} index - Index of chord
     * @returns {string|null} Chord name or null if index is invalid
     */
    getChordAt(index) {
      if (index < 0 || index >= this.chords.length) {
        return null;
      }
      
      return this.chords[index];
    }
    
    /**
     * Change chord at specific index
     * @param {number} index - Index of chord
     * @param {string} chord - New chord name
     * @returns {boolean} True if successful
     */
    setChordAt(index, chord) {
      if (index < 0 || index >= this.chords.length) {
        return false;
      }
      
      this.chords[index] = chord;
      return true;
    }
    
    /**
     * Insert chord at specific index
     * @param {number} index - Index to insert at
     * @param {string} chord - Chord name
     */
    insertChord(index, chord) {
      this.chords.splice(index, 0, chord);
    }
    
    /**
     * Clear all chords in the sequence
     */
    clear() {
      this.chords = [];
    }
    
    /**
     * Set the tonality of the sequence
     * @param {string} tonality - Tonality code
     */
    setTonality(tonality) {
      this.tonality = tonality;
    }
    
    /**
     * Get the tonality of the sequence
     * @returns {string} Tonality code
     */
    getTonality() {
      return this.tonality;
    }
    
    /**
     * Add a pause to the sequence
     */
    addPause() {
      this.addChord('PAUSE');
    }
    
    /**
     * Check if sequence is empty
     * @returns {boolean} True if sequence is empty
     */
    isEmpty() {
      return this.chords.length === 0;
    }
    
    /**
     * Get sequence length
     * @returns {number} Number of chords in sequence
     */
    getLength() {
      return this.chords.length;
    }
    
    /**
     * Find all occurrences of a chord
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
     * Get the last non-pause chord
     * @returns {string|null} Last chord or null if none
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
     * Create a clone of this sequence
     * @returns {ChordSequence} Cloned sequence
     */
    clone() {
      return new ChordSequence([...this.chords], this.tonality);
    }
    
    /**
     * Convert to string
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
   * Class representing a track block
   */
  class TrackBlock {
    /**
     * Create a new TrackBlock
     * @param {string} id - Unique identifier
     * @param {string} name - Block name (e.g., 'A1', 'B2')
     * @param {string} tonality - Tonality code
     * @param {Array} chords - Array of chord names
     */
    constructor(id, name, tonality, chords = []) {
      this.id = id || 'block_' + Date.now();
      this.name = name;
      this.tonality = tonality;
      this.chords = [...chords];
    }
    
    /**
     * Get the sequence of this block
     * @returns {ChordSequence} Chord sequence
     */
    getSequence() {
      return new ChordSequence(this.chords, this.tonality);
    }
    
    /**
     * Set the sequence of this block
     * @param {ChordSequence} sequence - Chord sequence
     */
    setSequence(sequence) {
      this.chords = sequence.getAllChords();
      this.tonality = sequence.getTonality();
    }
    
    /**
     * Check if block is empty
     * @returns {boolean} True if block has no chords
     */
    isEmpty() {
      return this.chords.length === 0;
    }
    
    /**
     * Clone this block
     * @param {string} [newName] - New name for the clone
     * @returns {TrackBlock} Cloned block
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
   * Class representing a track structure
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
     * Add a block to the structure
     * @param {TrackBlock} block - Block to add
     */
    addBlock(block) {
      this.blocks.push(block);
    }
    
    /**
     * Remove a block from the structure
     * @param {number} index - Index of block to remove
     * @returns {TrackBlock|null} Removed block or null if index is invalid
     */
    removeBlock(index) {
      if (index < 0 || index >= this.blocks.length) {
        return null;
      }
      
      // Adjust current block index if necessary
      if (index === this.currentBlockIndex) {
        this.currentBlockIndex = Math.max(0, this.blocks.length - 2);
      } else if (index < this.currentBlockIndex) {
        this.currentBlockIndex--;
      }
      
      return this.blocks.splice(index, 1)[0];
    }
    
    /**
     * Get all blocks in the structure
     * @returns {Array} Array of TrackBlock objects
     */
    getAllBlocks() {
      return [...this.blocks];
    }
    
    /**
     * Get block at specific index
     * @param {number} index - Index of block
     * @returns {TrackBlock|null} Block or null if index is invalid
     */
    getBlockAt(index) {
      if (index < 0 || index >= this.blocks.length) {
        return null;
      }
      
      return this.blocks[index];
    }
    
    /**
     * Get current block
     * @returns {TrackBlock|null} Current block or null if none
     */
    getCurrentBlock() {
      return this.getBlockAt(this.currentBlockIndex);
    }
    
    /**
     * Set current block index
     * @param {number} index - New index
     * @returns {boolean} True if successful
     */
    setCurrentBlockIndex(index) {
      if (index < 0 || index >= this.blocks.length) {
        return false;
      }
      
      this.currentBlockIndex = index;
      return true;
    }
    
    /**
     * Insert block at specific index
     * @param {number} index - Index to insert at
     * @param {TrackBlock} block - Block to insert
     */
    insertBlock(index, block) {
      // Adjust current block index if necessary
      if (index <= this.currentBlockIndex) {
        this.currentBlockIndex++;
      }
      
      this.blocks.splice(index, 0, block);
    }
    
    /**
     * Duplicate a block
     * @param {number} index - Index of block to duplicate
     * @returns {number} Index of new block or -1 if failed
     */
    duplicateBlock(index) {
      const block = this.getBlockAt(index);
      if (!block) {
        return -1;
      }
      
      // Generate new name
      const newName = this.generateNextBlockName(block.name);
      
      // Clone block
      const newBlock = block.clone(newName);
      
      // Insert after original
      this.insertBlock(index + 1, newBlock);
      
      return index + 1;
    }
    
    /**
     * Generate next block name
     * @param {string} [baseName] - Base name for the new block
     * @returns {string} Generated name
     */
    generateNextBlockName(baseName = null) {
      if (baseName) {
        // For duplicating blocks - use same letter with incremented number
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
          
          // Generate next number
          return prefix + (maxNumber + 1);
        }
      }
      
      // If no blocks exist
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
     * Rename a block
     * @param {number} index - Index of block
     * @param {string} newName - New name
     * @returns {boolean} True if successful
     */
    renameBlock(index, newName) {
      const block = this.getBlockAt(index);
      if (!block) {
        return false;
      }
      
      // Validate name format
      if (!/^[A-Z][1-9](\d*)$/.test(newName)) {
        return false;
      }
      
      block.name = newName;
      return true;
    }
    
    /**
     * Change the tonality of a block
     * @param {number} index - Index of block
     * @param {string} newTonality - New tonality code
     * @returns {boolean} True if successful
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
     * @returns {Array} Array of all chords with block dividers
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
     * Create default structure with one empty block
     * @param {string} [tonality='C'] - Default tonality
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
  }
  
  export { ChordSequence, TrackBlock, TrackStructure };