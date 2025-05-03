/**
 * trackStructure.js
 * Model and service for managing track structure (blocks of chord sequences)
 */

import store from '../core/store.js';
import { ChordSequence, TrackBlock, TrackStructure } from './sequence.js';
import eventBus from '../core/eventBus.js';

/**
 * Service for managing track structure
 */
class TrackStructureService {
  constructor() {
    // Instance of TrackStructure model
    this.trackStructure = null;
    
    // Initialize with empty structure
    this.init();
    
    // Subscribe to store changes
    store.subscribe(this.handleStoreChanges.bind(this), 
      ['trackStructure', 'currentBlockIndex', 'sequence']);
  }
  
  /**
   * Initialize track structure
   */
  init() {
    // Check store for existing structure
    const storeStructure = store.getTrackStructure();
    
    if (storeStructure && storeStructure.length > 0) {
      // Convert store structure to TrackStructure model
      this.importFromStore(storeStructure);
    } else {
      // Create default structure
      this.trackStructure = TrackStructure.createDefault();
      this.exportToStore();
    }
  }
  
  /**
   * Import track structure from store data
   * @param {Array} storeStructure - Structure data from store
   */
  importFromStore(storeStructure) {
    // Create blocks from store data
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
    
    // Set current block index
    this.trackStructure.currentBlockIndex = store.getCurrentBlockIndex();
  }
  
  /**
   * Export track structure to store
   */
  exportToStore() {
    if (!this.trackStructure) return;
    
    // Convert TrackStructure model to store format
    const storeStructure = this.trackStructure.getAllBlocks().map(block => {
      return {
        id: block.id,
        name: block.name,
        tonality: block.tonality,
        chords: block.chords
      };
    });
    
    // Update store
    store.setTrackStructure(storeStructure);
    store.setCurrentBlockIndex(this.trackStructure.currentBlockIndex);
  }
  
  /**
   * Get current track structure
   * @returns {TrackStructure} Track structure model
   */
  getTrackStructure() {
    return this.trackStructure;
  }
  
  /**
   * Get current block index
   * @returns {number} Current block index
   */
  getCurrentBlockIndex() {
    return this.trackStructure.currentBlockIndex;
  }
  
  /**
   * Add a new block
   * @param {string} [tonality] - Tonality for the new block (default: current tonality)
   * @returns {number} Index of the new block
   */
  addNewBlock(tonality) {
    // If tonality not specified, use current
    const blockTonality = tonality || store.getCurrentTonality();
    
    // Generate name for new block
    const blockName = this.trackStructure.generateNextBlockName();
    
    // Create new block
    const newBlock = new TrackBlock(
      'block_' + Date.now(),
      blockName,
      blockTonality,
      []
    );
    
    // Add to structure
    this.trackStructure.addBlock(newBlock);
    
    // Set as current block
    const newIndex = this.trackStructure.blocks.length - 1;
    this.trackStructure.setCurrentBlockIndex(newIndex);
    
    // Update store
    this.exportToStore();
    
    // Notify about block addition
    eventBus.publish('blockAdded', {
      block: newBlock,
      index: newIndex
    });
    
    // Return new block index
    return newIndex;
  }
  
  /**
   * Remove a block
   * @param {number} index - Index of block to remove
   * @returns {boolean} Success flag
   */
  removeBlock(index) {
    // Check if this is the last block
    if (this.trackStructure.blocks.length <= 1) {
      console.warn('Cannot remove the last block');
      return false;
    }
    
    // Store removed block for event
    const removedBlock = this.trackStructure.getBlockAt(index);
    
    // Remove block
    this.trackStructure.removeBlock(index);
    
    // Update store
    this.exportToStore();
    
    // Notify about block removal
    eventBus.publish('blockRemoved', {
      block: removedBlock,
      index: index
    });
    
    return true;
  }
  
  /**
   * Duplicate a block
   * @param {number} index - Index of block to duplicate
   * @returns {number} Index of new block or -1 if failed
   */
  duplicateBlock(index) {
    // Duplicate block
    const newIndex = this.trackStructure.duplicateBlock(index);
    
    // Check if operation succeeded
    if (newIndex === -1) {
      return -1;
    }
    
    // Update store
    this.exportToStore();
    
    // Notify about block duplication
    eventBus.publish('blockDuplicated', {
      originalIndex: index,
      newIndex: newIndex,
      block: this.trackStructure.getBlockAt(newIndex)
    });
    
    return newIndex;
  }
  
  /**
   * Rename a block
   * @param {number} index - Block index
   * @param {string} newName - New name
   * @returns {boolean} Success flag
   */
  renameBlock(index, newName) {
    // Validate name format
    if (!/^[A-Z][1-9](\d*)$/.test(newName)) {
      console.error('Invalid block name format. Must be a letter followed by a number (e.g., A1, B2)');
      return false;
    }
    
    // Store original name for event
    const oldName = this.trackStructure.getBlockAt(index)?.name;
    
    // Rename block
    const success = this.trackStructure.renameBlock(index, newName);
    
    if (success) {
      // Update store
      this.exportToStore();
      
      // Notify about block rename
      eventBus.publish('blockRenamed', {
        index: index,
        oldName: oldName,
        newName: newName
      });
    }
    
    return success;
  }
  
  /**
   * Change block tonality
   * @param {number} index - Block index
   * @param {string} newTonality - New tonality
   * @param {boolean} [fromUI=false] - Flag indicating change came from UI
   * @returns {boolean} Success flag
   */
  changeBlockTonality(index, newTonality, fromUI = false) {
    // Store original tonality for event
    const oldTonality = this.trackStructure.getBlockAt(index)?.tonality;
    
    // Change tonality
    const success = this.trackStructure.changeBlockTonality(index, newTonality);
    
    if (success) {
      // Update store
      this.exportToStore();
      
      // If this is the current block and change didn't come from UI,
      // update application tonality
      if (index === this.trackStructure.currentBlockIndex && !fromUI) {
        if (store.getCurrentTonality() !== newTonality) {
          // Set flag to prevent circular updates
          if (window.UI && window.UI.setInternalTonalityChange) {
            window.UI.setInternalTonalityChange(true);
          }
          
          // Update tonality
          store.setCurrentTonality(newTonality);
        }
      }
      
      // Notify about tonality change
      eventBus.publish('blockTonalityChanged', {
        index: index,
        oldTonality: oldTonality,
        newTonality: newTonality
      });
    }
    
    return success;
  }
  
  /**
   * Save current sequence to block
   * @param {number} [index] - Block index (default: current)
   * @returns {boolean} Success flag
   */
  saveSequenceToBlock(index = null) {
    // If index not provided, use current
    const blockIndex = index !== null ? index : this.trackStructure.currentBlockIndex;
    
    // Get current sequence
    const sequence = store.getSequence();
    
    // Get block
    const block = this.trackStructure.getBlockAt(blockIndex);
    if (!block) {
      return false;
    }
    
    // Update block chords
    block.chords = [...sequence];
    
    // Update store
    this.exportToStore();
    
    // Notify about sequence save
    eventBus.publish('sequenceSavedToBlock', {
      index: blockIndex,
      sequence: sequence
    });
    
    return true;
  }
  
  /**
   * Load sequence from block
   * @param {number} index - Block index
   */
  loadBlockSequence(index) {
    // Check if block exists
    const block = this.trackStructure.getBlockAt(index);
    if (!block) {
      return false;
    }
    
    // Update current block index
    this.trackStructure.setCurrentBlockIndex(index);
    
    // Update store
    store.setCurrentBlockIndex(index);
    store.setSequence(block.chords || []);
    
    // If tonality is different from current, update it
    if (block.tonality !== store.getCurrentTonality()) {
      // Set flag to prevent circular updates if using legacy UI
      if (window.UI && window.UI.setInternalTonalityChange) {
        window.UI.setInternalTonalityChange(true);
      }
      
      store.setCurrentTonality(block.tonality);
    }
    
    // Notify about block loading
    eventBus.publish('blockSequenceLoaded', {
      index: index,
      block: block
    });
    
    return true;
  }
  
  /**
   * Clear current block (remove all chords)
   * @returns {boolean} Success flag
   */
  clearCurrentBlock() {
    const index = this.trackStructure.currentBlockIndex;
    
    // Get block
    const block = this.trackStructure.getBlockAt(index);
    if (!block) {
      return false;
    }
    
    // Clear block chords
    block.chords = [];
    
    // Update store
    this.exportToStore();
    store.clearSequence();
    
    // Notify about block clearing
    eventBus.publish('blockCleared', {
      index: index
    });
    
    return true;
  }
  
  /**
   * Play all blocks in sequence
   */
  playFullTrack() {
    // Get all chords from all blocks
    const allChords = this.trackStructure.getAllChords();
    
    // Check if there are chords to play
    if (!allChords || allChords.length === 0) {
      console.warn('No chords to play');
      return;
    }
    
    // Import from audioService
    const audioService = require('../services/audioService').default;
    
    // Play full sequence
    audioService.playSequence(allChords, false);
    
    // Notify about full track playback
    eventBus.publish('fullTrackPlaybackStarted', {
      chordCount: allChords.length,
      blockCount: this.trackStructure.blocks.length
    });
  }
  
  /**
   * Handle store changes
   * @param {Object} state - Store state
   * @param {string} changedProp - Changed property
   */
  handleStoreChanges(state, changedProp) {
    switch (changedProp) {
      // Structure changed in store
      case 'trackStructure':
        // Skip if change came from this service
        if (this.isExporting) break;
        
        // Import new structure
        this.importFromStore(state.trackStructure);
        break;
        
      // Current block index changed
      case 'currentBlockIndex':
        // Update model
        if (this.trackStructure) {
          this.trackStructure.currentBlockIndex = state.currentBlockIndex;
        }
        break;
        
      // Sequence changed (auto-save to current block)
      case 'sequence':
        // Skip if change came from loading block
        if (this.isLoading) break;
        
        // Auto-save to current block
        this.saveSequenceToBlock();
        break;
    }
  }
}

// Create singleton instance
const trackStructureService = new TrackStructureService();

export default trackStructureService;