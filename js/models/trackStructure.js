/**
 * trackStructure.js
 * Service for managing track structure (blocks of chord sequences)
 */

import store from '../core/store.js';
import eventBus from '../core/eventBus.js';
import { TrackBlock, TrackStructure } from './sequence.js';

/**
 * TrackStructureService provides methods for managing track structure
 */
class TrackStructureService {
  constructor() {
    // Create track structure
    this.trackStructure = new TrackStructure();
    
    // Initialize from store if available
    this.initializeFromStore();
  }
  
  /**
   * Initialize from store
   */
  initializeFromStore() {
    const storeStructure = store.getTrackStructure();
    
    if (storeStructure && Array.isArray(storeStructure) && storeStructure.length > 0) {
      // Convert plain objects to TrackBlock instances
      const blocks = storeStructure.map(blockData => {
        return new TrackBlock(
          blockData.id || 'block_' + Date.now(),
          blockData.name,
          blockData.tonality,
          blockData.chords || []
        );
      });
      
      // Create new TrackStructure with blocks
      this.trackStructure = new TrackStructure(blocks);
    } else {
      // Create default track structure
      this.trackStructure = TrackStructure.createDefault();
    }
    
    // Sync with store
    this.syncWithStore();
  }
  
  /**
   * Sync track structure with store
   */
  syncWithStore() {
    // Get blocks array
    const blocks = this.trackStructure.getAllBlocks();
    
    // Update store
    store.setTrackStructure(blocks);
  }
  
  /**
   * Get track structure
   * @returns {TrackStructure} Track structure
   */
  getTrackStructure() {
    return this.trackStructure;
  }
  
  /**
   * Get current block index
   * @returns {number} Current block index
   */
  getCurrentBlockIndex() {
    return store.getCurrentBlockIndex();
  }
  
  /**
   * Add new block
   * @param {string} [tonality] - Block tonality (defaults to current tonality)
   * @returns {number} Index of new block
   */
  addNewBlock(tonality = null) {
    // Get current tonality if not provided
    if (!tonality) {
      tonality = store.getCurrentTonality();
    }
    
    // Generate block name
    const name = this.trackStructure.generateNextBlockName();
    
    // Create new block
    const newBlock = new TrackBlock(
      'block_' + Date.now(),
      name,
      tonality,
      []
    );
    
    // Add to track structure
    this.trackStructure.addBlock(newBlock);
    
    // Sync with store
    this.syncWithStore();
    
    // Get index of new block
    const newIndex = this.trackStructure.blocks.length - 1;
    
    // Set as current block
    store.setCurrentBlockIndex(newIndex);
    
    // Publish event
    eventBus.publish('blockAdded', {
      block: newBlock,
      index: newIndex
    });
    
    return newIndex;
  }
  
  /**
   * Remove block
   * @param {number} index - Block index
   * @returns {TrackBlock|null} Removed block or null
   */
  removeBlock(index) {
    // Check if this is the last block
    if (this.trackStructure.blocks.length <= 1) {
      console.warn('Cannot remove the last block');
      return null;
    }
    
    // Remove block
    const removedBlock = this.trackStructure.removeBlock(index);
    
    // Sync with store
    this.syncWithStore();
    
    // Update current block index in store
    store.setCurrentBlockIndex(this.trackStructure.currentBlockIndex);
    
    // Load sequence from current block
    this.loadBlockSequence(this.trackStructure.currentBlockIndex);
    
    // Publish event
    eventBus.publish('blockRemoved', {
      block: removedBlock,
      index: index
    });
    
    return removedBlock;
  }
  
  /**
   * Rename block
   * @param {number} index - Block index
   * @param {string} newName - New block name
   * @returns {boolean} Success flag
   */
  renameBlock(index, newName) {
    // Get block
    const block = this.trackStructure.getBlockAt(index);
    if (!block) {
      return false;
    }
    
    // Save old name
    const oldName = block.name;
    
    // Rename block
    if (!this.trackStructure.renameBlock(index, newName)) {
      return false;
    }
    
    // Sync with store
    this.syncWithStore();
    
    // Publish event
    eventBus.publish('blockRenamed', {
      block: block,
      index: index,
      oldName: oldName,
      newName: newName
    });
    
    return true;
  }
  
  /**
   * Change block tonality
   * @param {number} index - Block index
   * @param {string} tonality - New tonality
   * @param {boolean} fromUI - Flag indicating if change is from UI
   * @returns {boolean} Success flag
   */
  changeBlockTonality(index, tonality, fromUI = false) {
    // Get block
    const block = this.trackStructure.getBlockAt(index);
    if (!block) {
      return false;
    }
    
    // Save old tonality
    const oldTonality = block.tonality;
    
    // Change tonality
    if (!this.trackStructure.changeBlockTonality(index, tonality)) {
      return false;
    }
    
    // Sync with store
    this.syncWithStore();
    
    // If this is the current block, update current tonality
    if (index === this.getCurrentBlockIndex()) {
      // Update internalTonalityChange flag to prevent circular updates
      if (fromUI) {
        store.setState({ internalTonalityChange: true });
      }
      
      // Update current tonality
      store.setCurrentTonality(tonality);
      
      // Reset flag
      if (fromUI) {
        setTimeout(() => {
          store.setState({ internalTonalityChange: false });
        }, 0);
      }
    }
    
    // Publish event
    eventBus.publish('blockTonalityChanged', {
      block: block,
      index: index,
      oldTonality: oldTonality,
      newTonality: tonality
    });
    
    return true;
  }
  
  /**
   * Load sequence from block
   * @param {number} index - Block index
   * @returns {boolean} Success flag
   */
  loadBlockSequence(index) {
    // Get block
    const block = this.trackStructure.getBlockAt(index);
    if (!block) {
      return false;
    }
    
    // Set current block index
    store.setCurrentBlockIndex(index);
    
    // Set current tonality if different
    if (store.getCurrentTonality() !== block.tonality) {
      store.setCurrentTonality(block.tonality);
    }
    
    // Set sequence
    store.setSequence(block.chords || []);
    
    // Publish event
    eventBus.publish('blockLoaded', {
      block: block,
      index: index
    });
    
    return true;
  }
  
  /**
   * Save current sequence to block
   * @param {number} [index] - Block index (defaults to current block)
   * @returns {boolean} Success flag
   */
  saveSequenceToBlock(index = null) {
    // If index not provided, use current block index
    if (index === null) {
      index = this.getCurrentBlockIndex();
    }
    
    // Get block
    const block = this.trackStructure.getBlockAt(index);
    if (!block) {
      return false;
    }
    
    // Get current sequence
    const sequence = store.getSequence();
    
    // Update block chords
    block.chords = [...sequence];
    
    // Sync with store
    this.syncWithStore();
    
    // Publish event
    eventBus.publish('blockSaved', {
      block: block,
      index: index,
      sequence: sequence
    });
    
    return true;
  }
  
  /**
   * Clear current block
   * @returns {boolean} Success flag
   */
  clearCurrentBlock() {
    // Get current block index
    const index = this.getCurrentBlockIndex();
    
    // Get block
    const block = this.trackStructure.getBlockAt(index);
    if (!block) {
      return false;
    }
    
    // Clear block chords
    block.chords = [];
    
    // Sync with store
    this.syncWithStore();
    
    // Clear sequence
    store.clearSequence();
    
    // Publish event
    eventBus.publish('blockCleared', {
      block: block,
      index: index
    });
    
    return true;
  }
  
  /**
   * Duplicate block
   * @param {number} index - Block index
   * @returns {number} Index of new block
   */
  duplicateBlock(index) {
    // Get block
    const block = this.trackStructure.getBlockAt(index);
    if (!block) {
      return -1;
    }
    
    // Duplicate block
    const newIndex = this.trackStructure.duplicateBlock(index);
    
    // Sync with store
    this.syncWithStore();
    
    // Publish event
    eventBus.publish('blockDuplicated', {
      originalBlock: block,
      originalIndex: index,
      newBlock: this.trackStructure.getBlockAt(newIndex),
      newIndex: newIndex
    });
    
    return newIndex;
  }
}

// Create singleton instance
const trackStructureService = new TrackStructureService();

// Subscribe to sequence changes to save to current block
store.subscribe((state, changedProp) => {
  if (changedProp === 'sequence') {
    // Save sequence to current block
    trackStructureService.saveSequenceToBlock();
  }
}, ['sequence']);

export default trackStructureService;