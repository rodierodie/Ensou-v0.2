/**
 * trackStructureManager.js
 * Modernized component for managing track structure
 */

import Component from '../component.js';
import store from '../../core/store.js';
import eventBus from '../../core/eventBus.js';
import trackStructureService from '../../models/trackStructure.js';
import { tonalityCollection } from '../../models/tonality.js';

class TrackStructureManager extends Component {
  /**
   * Creates a track structure manager component
   * @param {HTMLElement} container - Container for UI elements
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    super(container, {
      ...options,
      autoRender: false
    });
    
    // Initialize state
    this.trackStructure = trackStructureService.getTrackStructure();
    this.currentBlockIndex = trackStructureService.getCurrentBlockIndex();
    
    // Subscribe to store changes
    this.subscribeToStore(this.handleStateChange, ['trackStructure', 'currentBlockIndex']);
    
    // Subscribe to events
    this.subscribeToEvent('blockAdded', this.handleBlockAdded.bind(this));
    this.subscribeToEvent('blockRemoved', this.handleBlockRemoved.bind(this));
    this.subscribeToEvent('blockRenamed', this.handleBlockRenamed.bind(this));
    this.subscribeToEvent('blockTonalityChanged', this.handleBlockTonalityChanged.bind(this));
    
    // Initialize UI
    this.init();
  }
  
  /**
   * Initialize component
   */
  init() {
    console.log('Initializing track structure manager component');
    
    // Render UI
    this.render();
  }
  
  /**
   * Render component
   */
  render() {
    if (!this.container) return;
    
    this.clearContainer();
    
    // Create title
    const title = this.createElement('div', {
      className: 'section-title',
      textContent: 'Структура трека'
    });
    this.container.appendChild(title);
    
    // Create toolbar
    const toolbar = this.createToolbar();
    this.container.appendChild(toolbar);
    
    // Create blocks container
    const blocksContainer = this.createElement('div', {
      className: 'blocks-container'
    });
    
    // Create and add blocks
    const structure = this.trackStructure.getAllBlocks();
    structure.forEach((block, index) => {
      const blockElement = this.createBlockElement(block, index);
      blocksContainer.appendChild(blockElement);
    });
    
    this.container.appendChild(blocksContainer);
  }
  
  /**
   * Create toolbar
   * @returns {HTMLElement} Toolbar element
   */
  createToolbar() {
    const toolbar = this.createElement('div', {
      className: 'structure-toolbar'
    });
    
    // Add new block button
    const addButton = this.createElement('button', {
      className: 'add-block-button',
      textContent: '+ Новый блок',
      onClick: this.handleAddBlock.bind(this)
    });
    toolbar.appendChild(addButton);
    
    // Play full track button
    const playAllButton = this.createElement('button', {
      className: 'play-all-button',
      textContent: '▶ Воспроизвести весь трек',
      onClick: this.handlePlayFullTrack.bind(this)
    });
    
    // Check if there are any chords in blocks
    const hasChords = this.trackStructure.getAllBlocks().some(block => block.chords.length > 0);
    playAllButton.disabled = !hasChords;
    
    toolbar.appendChild(playAllButton);
    
    return toolbar;
  }
  
  /**
   * Create block element
   * @param {Object} block - Block object
   * @param {number} index - Block index
   * @returns {HTMLElement} Block element
   */
  createBlockElement(block, index) {
    // Create block container
    const blockElement = this.createElement('div', {
      className: 'track-block',
      dataset: { index: index, blockId: block.id }
    });
    
    // Add active class if current block
    if (index === this.currentBlockIndex) {
      blockElement.classList.add('active-block');
    }
    
    // Block header with name and tonality
    const blockHeader = this.createElement('div', {
      className: 'block-header'
    });
    
    // Block name (editable)
    const blockName = this.createElement('span', {
      className: 'block-name',
      textContent: block.name,
      title: 'Нажмите для редактирования',
      onClick: () => this.handleRenameBlock(index)
    });
    blockHeader.appendChild(blockName);
    
    // Block tonality
    const blockTonality = this.createElement('span', {
      className: 'block-tonality',
      textContent: block.tonality,
      title: 'Нажмите для изменения тональности',
      onClick: () => this.handleChangeTonality(index)
    });
    blockHeader.appendChild(blockTonality);
    
    blockElement.appendChild(blockHeader);
    
    // Chords preview
    const chordsPreview = this.createElement('div', {
      className: 'block-chords-preview'
    });
    
    if (block.chords && block.chords.length > 0) {
      // Display preview chords
      const maxPreviewChords = 8; // Maximum number of chords to display
      const displayChords = block.chords.slice(0, maxPreviewChords);
      
      displayChords.forEach((chord, chordIndex) => {
        const chordBadge = this.createElement('span', {
          className: 'chord-badge',
          textContent: chord === 'PAUSE' ? '𝄽' : chord
        });
        chordsPreview.appendChild(chordBadge);
        
        // Add separator between chords
        if (chordIndex < displayChords.length - 1) {
          const separator = this.createElement('span', {
            className: 'chord-separator',
            textContent: '→'
          });
          chordsPreview.appendChild(separator);
        }
      });
      
      // If more chords than displayed, add ellipsis
      if (block.chords.length > maxPreviewChords) {
        const ellipsis = this.createElement('span', {
          className: 'chord-ellipsis',
          textContent: '...'
        });
        chordsPreview.appendChild(ellipsis);
      }
    } else {
      // If block is empty, show message
      const emptyMessage = this.createElement('span', {
        className: 'empty-block-message',
        textContent: 'Нет аккордов'
      });
      chordsPreview.appendChild(emptyMessage);
    }
    
    blockElement.appendChild(chordsPreview);
    
    // Block button panel
    const buttonPanel = this.createElement('div', {
      className: 'block-buttons'
    });
    
    // Load block button
    const loadButton = this.createElement('button', {
      className: 'block-load-button',
      textContent: 'Загрузить',
      onClick: (e) => {
        e.stopPropagation();
        this.handleLoadBlock(index);
      }
    });
    buttonPanel.appendChild(loadButton);
    
    // Play block button
    const playButton = this.createElement('button', {
      className: 'block-play-button',
      textContent: '▶',
      disabled: !block.chords || block.chords.length === 0,
      onClick: (e) => {
        e.stopPropagation();
        this.handlePlayBlock(index);
      }
    });
    buttonPanel.appendChild(playButton);
    
    // Delete block button
    const deleteButton = this.createElement('button', {
      className: 'block-delete-button',
      textContent: '×',
      // Disable if this is the last block
      disabled: this.trackStructure.blocks.length <= 1,
      onClick: (e) => {
        e.stopPropagation();
        this.handleRemoveBlock(index);
      }
    });
    buttonPanel.appendChild(deleteButton);
    
    blockElement.appendChild(buttonPanel);
    
    // Add click handler for block selection
    blockElement.addEventListener('click', (e) => {
      // Make sure click wasn't on a button or editable element
      if (!e.target.closest('button') && 
          !e.target.closest('.block-name') && 
          !e.target.closest('.block-tonality')) {
        this.handleLoadBlock(index);
      }
    });
    
    return blockElement;
  }
  
  /**
   * Handle add block button click
   */
  handleAddBlock() {
    trackStructureService.addNewBlock();
  }
  
  /**
   * Handle load block button click
   * @param {number} index - Block index
   */
  handleLoadBlock(index) {
    trackStructureService.loadBlockSequence(index);
  }
  
  /**
   * Handle play block button click
   * @param {number} index - Block index
   */
  handlePlayBlock(index) {
    // Get block
    const block = this.trackStructure.getBlockAt(index);
    if (!block || !block.chords || block.chords.length === 0) return;
    
    // Play sequence
    eventBus.publish('playCustomSequence', {
      sequence: block.chords,
      loop: true
    });
  }
  
  /**
   * Handle play full track button click
   */
  handlePlayFullTrack() {
    trackStructureService.trackStructure.playFullTrack();
  }
  
  /**
   * Handle remove block button click
   * @param {number} index - Block index
   */
  handleRemoveBlock(index) {
    // Get block for confirmation
    const block = this.trackStructure.getBlockAt(index);
    if (!block) return;
    
    if (confirm(`Вы уверены, что хотите удалить блок "${block.name}"?`)) {
      trackStructureService.removeBlock(index);
    }
  }
  
  /**
   * Handle rename block button click
   * @param {number} index - Block index
   */
  handleRenameBlock(index) {
    // Get block
    const block = this.trackStructure.getBlockAt(index);
    if (!block) return;
    
    // Prompt for new name
    const newName = prompt('Введите новое имя блока (формат: буква+цифра, например A1, B2):', block.name);
    
    // Validate input
    if (newName && newName !== block.name && /^[A-Z][1-9](\d*)$/.test(newName)) {
      trackStructureService.renameBlock(index, newName);
    } else if (newName) {
      alert('Некорректный формат имени. Используйте формат буква+цифра, например A1, B2.');
    }
  }
  
  /**
   * Handle change tonality button click
   * @param {number} index - Block index
   */
  handleChangeTonality(index) {
    // Get block
    const block = this.trackStructure.getBlockAt(index);
    if (!block) return;
    
    // Create tonality options from collection
    const tonalities = tonalityCollection.getAllTonalities();
    let tonalityOptions = '';
    
    tonalities.forEach(tonality => {
      tonalityOptions += `${tonality.code} (${tonality.name})\n`;
    });
    
    // Prompt for new tonality
    const newTonality = prompt(
      `Выберите тональность:\n${tonalityOptions}`, 
      block.tonality
    );
    
    // Validate input
    if (newTonality && tonalityCollection.getTonality(newTonality)) {
      trackStructureService.changeBlockTonality(index, newTonality);
    } else if (newTonality) {
      alert('Выбрана несуществующая тональность.');
    }
  }
  
  /**
   * Handle block added event
   * @param {Object} data - Event data
   */
  handleBlockAdded(data) {
    // Update UI
    this.render();
  }
  
  /**
   * Handle block removed event
   * @param {Object} data - Event data
   */
  handleBlockRemoved(data) {
    // Update UI
    this.render();
  }
  
  /**
   * Handle block renamed event
   * @param {Object} data - Event data
   */
  handleBlockRenamed(data) {
    // Update UI
    this.render();
  }
  
  /**
   * Handle block tonality changed event
   * @param {Object} data - Event data
   */
  handleBlockTonalityChanged(data) {
    // Update UI
    this.render();
  }
  
  /**
   * Handle state changes from store
   * @param {Object} state - Store state
   * @param {string} changedProp - Changed property
   */
  handleStateChange(state, changedProp) {
    if (changedProp === 'trackStructure') {
      this.trackStructure = trackStructureService.getTrackStructure();
      this.render();
    } else if (changedProp === 'currentBlockIndex') {
      this.currentBlockIndex = state.currentBlockIndex;
      this.render();
    }
  }
}

export default TrackStructureManager;