/**
 * blockSelector.js
 * Component for managing and navigating track blocks (sections)
 */

import store from '../../core/store.js';
import { tonalityCollection } from '../../models/tonality.js';
import Component from '../component.js';

class BlockSelector extends Component {
  /**
   * Create a new BlockSelector component
   * @param {HTMLElement} container - Container for block tabs
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    super(container, {
      ...options,
      autoRender: false
    });
    
    this.options = {
      onBlockSelect: null,  // Callback when block is selected
      onBlockAdd: null,     // Callback when block is added
      ...options
    };
    
    // Current state
    this.blocks = [];
    this.currentBlockIndex = 0;
    
    // Initialize component
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    // Subscribe to store changes
    this.subscribeToStore(this.handleStateChange, 
      ['trackStructure', 'currentBlockIndex']);
    
    // Initial sync with store
    this.syncWithStore();
    
    // Now render the component
    this.render();
  }
  
  /**
   * Sync component with store state
   */
  syncWithStore() {
    this.blocks = store.getTrackStructure();
    this.currentBlockIndex = store.getCurrentBlockIndex();
  }
  
  /**
   * Render the component
   */
  render() {
    this.clearContainer();
    
    // Create and add tabs for each block
    this.blocks.forEach((block, index) => {
      const tab = this.createBlockTab(block, index);
      this.container.appendChild(tab);
    });
    
    // Add "New Block" button
    const addButton = this.createElement('button', {
      className: 'add-block',
      textContent: '+',
      title: 'Добавить новый блок',
      onClick: () => this.handleAddBlock()
    });
    
    this.container.appendChild(addButton);
    
    // Update active block title
    this.updateBlockTitle();
  }
  
  /**
   * Create tab for a block
   * @param {Object} block - Block data
   * @param {number} index - Index in the track structure
   * @returns {HTMLElement} Block tab element
   */
  createBlockTab(block, index) {
    const tab = this.createElement('button', {
      className: `block-tab ${index === this.currentBlockIndex ? 'active' : ''}`,
      textContent: block.name,
      dataset: {
        index: index,
        blockId: block.id
      },
      onClick: () => this.handleBlockSelect(index)
    });
    
    // Add context menu for additional actions
    tab.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showBlockContextMenu(e, block, index);
    });
    
    return tab;
  }
  
  /**
   * Update block title in block header
   */
  updateBlockTitle() {
    const blockTitle = document.querySelector('.block-title');
    if (!blockTitle) return;
    
    // Check if current block exists
    if (this.currentBlockIndex >= 0 && this.currentBlockIndex < this.blocks.length) {
      blockTitle.textContent = this.blocks[this.currentBlockIndex].name;
    } else {
      blockTitle.textContent = 'Блок';
    }
  }
  
  /**
   * Handle block tab click
   * @param {number} index - Index of selected block
   */
  handleBlockSelect(index) {
    // Skip if it's already the current block
    if (index === this.currentBlockIndex) return;
    
    // Update current block index in store
    store.setCurrentBlockIndex(index);
    
    // Load the block's chord sequence
    this.loadBlockSequence(index);
    
    // Call callback if provided
    if (this.options.onBlockSelect) {
      this.options.onBlockSelect(index);
    }
  }
  
  /**
   * Load sequence from a block
   * @param {number} index - Index of the block
   */
  loadBlockSequence(index) {
    // Check if block exists
    if (index < 0 || index >= this.blocks.length) return;
    
    const block = this.blocks[index];
    
    // Set current chord sequence to the block's chords
    store.setSequence(block.chords || []);
    
    // Update tonality if needed
    if (block.tonality !== store.getCurrentTonality()) {
      store.setCurrentTonality(block.tonality);
    }
  }
  
  /**
   * Handle add block button click
   */
  handleAddBlock() {
    // Generate name for new block
    const newBlockName = this.generateNextBlockName();
    
    // Add new block to store
    const newIndex = store.addNewBlock(newBlockName);
    
    // Call callback if provided
    if (this.options.onBlockAdd) {
      this.options.onBlockAdd(newIndex);
    }
  }
  
  /**
   * Show context menu for block tab
   * @param {Event} event - Context menu event
   * @param {Object} block - Block data
   * @param {number} index - Block index
   */
  showBlockContextMenu(event, block, index) {
    // Remove any existing context menus
    const existingMenu = document.querySelector('.block-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'block-context-menu';
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.style.backgroundColor = '#fff';
    contextMenu.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    contextMenu.style.borderRadius = '4px';
    contextMenu.style.padding = '8px 0';
    contextMenu.style.zIndex = '1000';
    
    // Create menu items
    const menuItems = [
      {
        text: 'Переименовать',
        action: () => this.renameBlock(index)
      },
      {
        text: 'Изменить тональность',
        action: () => this.changeTonality(index)
      },
      {
        text: 'Дублировать',
        action: () => this.duplicateBlock(index)
      },
      {
        text: 'Удалить',
        action: () => this.deleteBlock(index),
        className: 'danger'
      }
    ];
    
    // Create menu item elements
    menuItems.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = `context-menu-item ${item.className || ''}`;
      menuItem.textContent = item.text;
      menuItem.style.padding = '8px 16px';
      menuItem.style.cursor = 'pointer';
      
      if (item.className === 'danger') {
        menuItem.style.color = '#f44336';
      }
      
      menuItem.addEventListener('click', () => {
        // Remove menu after clicking
        contextMenu.remove();
        
        // Execute action
        item.action();
      });
      
      menuItem.addEventListener('mouseover', () => {
        menuItem.style.backgroundColor = '#f5f5f5';
      });
      
      menuItem.addEventListener('mouseout', () => {
        menuItem.style.backgroundColor = 'transparent';
      });
      
      contextMenu.appendChild(menuItem);
    });
    
    // Add menu to document
    document.body.appendChild(contextMenu);
    
    // Add event listener to close menu when clicking outside
    const closeMenu = (e) => {
      if (!contextMenu.contains(e.target)) {
        contextMenu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    
    // Wait a bit before adding the event listener to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 10);
  }
  
  /**
   * Rename block
   * @param {number} index - Block index
   */
  renameBlock(index) {
    // Check if block exists
    if (index < 0 || index >= this.blocks.length) return;
    
    const block = this.blocks[index];
    
    // Prompt for new name
    const newName = prompt('Введите новое название блока (формат: буква+цифра, например A1, B2):', block.name);
    
    // Validate new name
    if (!newName || newName === block.name) return;
    
    if (!/^[A-Z][1-9](\d*)$/.test(newName)) {
      alert('Неверный формат имени. Используйте формат буква+цифра, например A1, B2.');
      return;
    }
    
    // Create updated structure
    const newStructure = [...this.blocks];
    newStructure[index] = {
      ...block,
      name: newName
    };
    
    // Update store
    store.setTrackStructure(newStructure);
  }
  
  /**
   * Change block tonality
   * @param {number} index - Block index
   */
  changeTonality(index) {
    // Check if block exists
    if (index < 0 || index >= this.blocks.length) return;
    
    const block = this.blocks[index];
    
    // Create options for tonalities
    const allTonalities = tonalityCollection.getAllTonalities();
    const tonalityOptions = allTonalities
      .map(tonality => `${tonality.code} (${tonality.name})`)
      .join('\n');
    
    // Prompt for new tonality
    const newTonality = prompt(
      `Выберите тональность:\n${tonalityOptions}`, 
      block.tonality
    );
    
    // Validate new tonality
    if (!newTonality || newTonality === block.tonality) return;
    
    // Check if tonality exists in the collection
    if (!tonalityCollection.getTonality(newTonality)) {
      alert('Неверная тональность. Выберите из списка.');
      return;
    }
    
    // Create updated structure
    const newStructure = [...this.blocks];
    newStructure[index] = {
      ...block,
      tonality: newTonality
    };
    
    // Update store
    store.setTrackStructure(newStructure);
    
    // If this is the current block, update current tonality
    if (index === this.currentBlockIndex) {
      store.setCurrentTonality(newTonality);
    }
  }
  
  /**
   * Duplicate block
   * @param {number} index - Block index
   */
  duplicateBlock(index) {
    // Check if block exists
    if (index < 0 || index >= this.blocks.length) return;
    
    const block = this.blocks[index];
    
    // Generate name for the duplicate
    const duplicateName = this.generateNextBlockName(block.name);
    
    // Create duplicate block
    const duplicateBlock = {
      id: 'block_' + Date.now(),
      name: duplicateName,
      tonality: block.tonality,
      chords: [...(block.chords || [])]
    };
    
    // Create updated structure with the duplicate inserted after the original
    const newStructure = [...this.blocks];
    newStructure.splice(index + 1, 0, duplicateBlock);
    
    // Update store
    store.setTrackStructure(newStructure);
    
    // Make the duplicate the current block
    store.setCurrentBlockIndex(index + 1);
  }
  
  /**
   * Delete block
   * @param {number} index - Block index
   */
  deleteBlock(index) {
    // Check if block exists
    if (index < 0 || index >= this.blocks.length) return;
    
    // Don't allow deleting the last block
    if (this.blocks.length <= 1) {
      alert('Невозможно удалить последний блок.');
      return;
    }
    
    // Confirm deletion
    if (!confirm(`Вы уверены, что хотите удалить блок "${this.blocks[index].name}"?`)) {
      return;
    }
    
    // Create updated structure
    const newStructure = [...this.blocks];
    newStructure.splice(index, 1);
    
    // Adjust current block index if needed
    let newCurrentIndex = this.currentBlockIndex;
    
    if (index === this.currentBlockIndex) {
      // If deleting current block, move to previous or first block
      newCurrentIndex = Math.max(0, index - 1);
    } else if (index < this.currentBlockIndex) {
      // If deleting block before current, adjust index
      newCurrentIndex--;
    }
    
    // Update store
    store.setTrackStructure(newStructure);
    store.setCurrentBlockIndex(newCurrentIndex);
  }
  
  /**
   * Generate next block name
   * @param {string} [baseName] - Base name for duplicating
   * @returns {string} New block name
   */
  generateNextBlockName(baseName = null) {
    if (baseName) {
      // For duplicating - create copy with same prefix
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
   * Handle state changes from store
   * @param {Object} state - Store state
   * @param {string} changedProp - Property that changed
   */
  handleStateChange(state, changedProp) {
    switch (changedProp) {
      case 'trackStructure':
        this.blocks = state.trackStructure;
        this.render();
        break;
        
      case 'currentBlockIndex':
        this.currentBlockIndex = state.currentBlockIndex;
        
        // Update active tab
        const tabs = this.container.querySelectorAll('.block-tab');
        tabs.forEach(tab => {
          const tabIndex = parseInt(tab.getAttribute('data-index'));
          tab.classList.toggle('active', tabIndex === this.currentBlockIndex);
        });
        
        // Update block title
        this.updateBlockTitle();
        break;
    }
  }
}

export default BlockSelector;