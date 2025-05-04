/**
 * sequenceComponent.js
 * Component for managing and displaying chord sequences
 */

import Component from '../component.js';
import store from '../../core/store.js';
import audioService from '../../services/audioService.js';
import { chordCollection } from '../../models/chord.js';
import eventBus from '../../core/eventBus.js';

class SequenceComponent extends Component {
  /**
   * Create a new SequenceComponent
   * @param {HTMLElement} container - Container for the sequence
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    super(container, {
      ...options,
      autoRender: false
    });
    
    this.options = {
      onChordClick: null,      // Callback when chord is clicked
      onChordRemove: null,     // Callback when chord is removed
      maxVisibleChords: 16,    // Maximum number of chords visible without scrolling
      ...options
    };
    
    // Sequence state
    this.sequence = [];
    this.currentPlayingIndex = -1;
    
    // Initialize component
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    // Subscribe to store changes
    this.subscribeToStore(this.handleStateChange, 
      ['sequence', 'isPlaying']);
    
    // Subscribe to events
    this.subscribeToEvent('chordPlaying', this.handleChordPlaying.bind(this));
    
    // Initialize sequence from store
    this.sequence = store.getSequence() || [];
    
    // Now render manually
    this.render();
  }
  
  /**
   * Render the component
   */
  render() {
    this.clearContainer();
    
    // Ensure sequence is initialized and is an array
    if (!this.sequence) {
      this.sequence = [];
    }
    
    // If sequence is empty, show placeholder
    if (this.sequence.length === 0) {
      const placeholder = this.createElement('div', {
        className: 'timeline-placeholder',
        textContent: 'Добавьте аккорды в последовательность'
      });
      
      this.container.appendChild(placeholder);
      return;
    }
    
    // Create and add sequence cards
    this.sequence.forEach((chordName, index) => {
      const card = this.createSequenceCard(chordName, index);
      this.container.appendChild(card);
    });
    
    // Scroll to make current playing chord visible if needed
    if (this.currentPlayingIndex >= 0) {
      this.scrollToCurrentChord();
    }
  }
  
  /**
   * Create a card for a sequence chord
   * @param {string} chordName - Name of the chord
   * @param {number} index - Index in the sequence
   * @returns {HTMLElement} Sequence card element
   */
  createSequenceCard(chordName, index) {
    // Create card element
    const card = this.createElement('div', {
      className: 'sequence-card',
      dataset: { index: index },
      onClick: () => this.handleChordClick(chordName, index)
    });
    
    // Add current-playing class if this is the currently playing chord
    if (index === this.currentPlayingIndex) {
      card.classList.add('current-playing');
    }
    
    // Create chord name element
    const nameElement = this.createElement('div', {
      className: 'chord-name'
    });
    
    // Handle pause and regular chords differently
    if (chordName === 'PAUSE') {
      nameElement.textContent = '𝄽'; // Pause symbol
      nameElement.classList.add('pause-symbol');
    } else if (chordName === 'BLOCK_DIVIDER') {
      nameElement.textContent = '|'; // Block divider symbol
      nameElement.classList.add('block-divider-symbol');
    } else {
      nameElement.textContent = chordName;
      
      // Add function icon for regular chords
      const functionIcon = this.createFunctionIcon(chordName);
      if (functionIcon) {
        card.appendChild(functionIcon);
      }
    }
    
    card.appendChild(nameElement);
    
    // Create remove button (only for regular sequence editing)
    const removeButton = this.createElement('div', {
      className: 'card-remove',
      textContent: '×',
      onClick: (e) => {
        e.stopPropagation(); // Prevent card click
        this.handleChordRemove(index);
      }
    });
    
    card.appendChild(removeButton);
    
    return card;
  }
  
  /**
   * Create function icon for chord
   * @param {string} chordName - Name of the chord
   * @returns {HTMLElement|null} Function icon element or null
   */
  createFunctionIcon(chordName) {
    // Skip for pauses and block dividers
    if (chordName === 'PAUSE' || chordName === 'BLOCK_DIVIDER') {
      return null;
    }
    
    // Get chord data and current tonality
    const chord = chordCollection.getChord(chordName);
    const tonality = store.getCurrentTonality();
    
    if (!chord || !chord.functions || !chord.getFunctionInTonality(tonality)) {
      return null;
    }
    
    // Get chord function
    const chordFunction = chord.getFunctionInTonality(tonality).function;
    
    // Create icon
    const functionIcon = this.createElement('span', {
      className: `function-icon ${this.getFunctionClass(chordFunction)} sequence-function-icon`,
      textContent: this.getFunctionLabel(chordFunction)
    });
    
    return functionIcon;
  }
  
  /**
   * Get CSS class for chord function
   * @param {string} functionName - Function name
   * @returns {string} CSS class
   */
  getFunctionClass(functionName) {
    if (functionName.includes('tonic')) {
      return 'tonic';
    } else if (functionName.includes('dominant')) {
      return 'dominant';
    } else if (functionName.includes('subdominant')) {
      return 'subdominant';
    }
    return '';
  }
  
  /**
   * Get label for function icon
   * @param {string} functionName - Function name
   * @returns {string} Label
   */
  getFunctionLabel(functionName) {
    if (functionName.includes('tonic')) {
      return 'T';
    } else if (functionName.includes('dominant')) {
      return 'D';
    } else if (functionName.includes('subdominant')) {
      return 'S';
    }
    return '?';
  }
  
  /**
   * Handle chord click in sequence
   * @param {string} chordName - Name of the clicked chord
   * @param {number} index - Index in the sequence
   */
  handleChordClick(chordName, index) {
    // Skip for pauses and block dividers
    if (chordName === 'PAUSE' || chordName === 'BLOCK_DIVIDER') {
      return;
    }
    
    // Update current chord in store
    store.setCurrentChord(chordName);
    
    // Play the chord
    audioService.playChord(chordName);
    
    // Call callback if provided
    if (this.options.onChordClick) {
      this.options.onChordClick(chordName, index);
    }
    
    // Publish event
    this.publishEvent('sequenceChordClicked', {
      chordName,
      index
    });
  }
  
  /**
   * Handle chord remove from sequence
   * @param {number} index - Index in the sequence
   */
  handleChordRemove(index) {
    // Update store
    store.removeChordFromSequence(index);
    
    // Call callback if provided
    if (this.options.onChordRemove) {
      this.options.onChordRemove(index);
    }
    
    // Publish event
    this.publishEvent('sequenceChordRemoved', {
      index
    });
  }
  
  /**
   * Handle chord playing event
   * @param {Object} data - Event data
   */
  handleChordPlaying(data) {
    this.updatePlayingIndex(data.index);
  }
  
  /**
   * Update playing index and highlight current chord
   * @param {number} index - Current playing index
   */
  updatePlayingIndex(index) {
    this.currentPlayingIndex = index;
    
    // Remove current-playing class from all cards
    const cards = this.container.querySelectorAll('.sequence-card');
    cards.forEach(card => {
      card.classList.remove('current-playing');
    });
    
    // Add class to current card
    if (index >= 0 && index < cards.length) {
      cards[index].classList.add('current-playing');
      
      // Scroll to make current card visible
      this.scrollToCurrentChord();
    }
  }
  
  /**
   * Scroll to make current chord visible
   */
  scrollToCurrentChord() {
    // Find current card
    const currentCard = this.container.querySelector('.sequence-card.current-playing');
    if (!currentCard) return;
    
    // Calculate if card is visible
    const containerRect = this.container.getBoundingClientRect();
    const cardRect = currentCard.getBoundingClientRect();
    
    // Check if card is outside visible area
    if (cardRect.left < containerRect.left || cardRect.right > containerRect.right) {
      // Scroll to make card visible
      this.container.scrollLeft = currentCard.offsetLeft - containerRect.width / 2 + cardRect.width / 2;
    }
  }
  
  /**
   * Update sequence from store
   * @param {Array} sequence - New sequence
   */
  updateSequence(sequence) {
    this.sequence = Array.isArray(sequence) ? [...sequence] : [];
    this.render();
  }
  
  /**
   * Handle state changes from the store
   * @param {Object} state - Store state
   * @param {string} changedProp - Changed property
   */
  handleStateChange(state, changedProp) {
    switch (changedProp) {
      case 'sequence':
        this.updateSequence(state.sequence);
        break;
        
      case 'isPlaying':
        // Reset playing index if stopped
        if (!state.isPlaying) {
          this.updatePlayingIndex(-1);
        }
        break;
    }
  }
}

export default SequenceComponent;