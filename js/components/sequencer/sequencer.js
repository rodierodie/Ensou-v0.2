/**
 * sequenceComponent.js
 * Component for managing and displaying chord sequences
 */

import store from '../../core/store.js';
import audioService from '../../services/audioService.js';

class SequenceComponent {
  /**
   * Create a new SequenceComponent
   * @param {HTMLElement} container - Container for the sequence
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
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
    store.subscribe(this.handleStateChange.bind(this), 
      ['sequence', 'isPlaying']);
    
    // Initial sync with store
    this.syncWithStore();
    
    // Setup controls
    this.setupControls();
  }
  
  /**
   * Set up sequence controls
   */
  setupControls() {
    // Find or create control container
    let controlsContainer = document.querySelector('.sequence-controls');
    
    if (!controlsContainer) {
      controlsContainer = document.createElement('div');
      controlsContainer.className = 'sequence-controls';
      
      // Insert controls before sequence container
      this.container.parentNode.insertBefore(controlsContainer, this.container);
    }
    
    // Clear controls
    controlsContainer.innerHTML = '';
    
    // Playback controls
    const playbackControls = document.createElement('div');
    playbackControls.className = 'playback-controls';
    
    // Play button
    const playButton = document.createElement('button');
    playButton.id = 'play-sequence';
    playButton.className = 'play-button';
    playButton.textContent = '▶ Проиграть';
    playButton.addEventListener('click', () => {
      store.setIsPlaying(true);
    });
    playbackControls.appendChild(playButton);
    
    // Stop button
    const stopButton = document.createElement('button');
    stopButton.id = 'stop-sequence';
    stopButton.className = 'stop-button';
    stopButton.disabled = !store.getIsPlaying();
    stopButton.textContent = '■ Стоп';
    stopButton.addEventListener('click', () => {
      store.setIsPlaying(false);
    });
    playbackControls.appendChild(stopButton);
    
    // Tempo control
    const tempoControl = document.createElement('div');
    tempoControl.className = 'tempo-control';
    
    // Tempo label
    const tempoLabel = document.createElement('label');
    tempoLabel.textContent = 'Темп:';
    tempoLabel.setAttribute('for', 'tempo-input');
    tempoControl.appendChild(tempoLabel);
    
    // Tempo input
    const tempoInput = document.createElement('input');
    tempoInput.type = 'number';
    tempoInput.id = 'tempo-input';
    tempoInput.min = '40';
    tempoInput.max = '240';
    tempoInput.value = store.getTempo();
    tempoInput.addEventListener('change', () => {
      const newTempo = parseInt(tempoInput.value);
      if (!isNaN(newTempo) && newTempo >= 40 && newTempo <= 240) {
        store.setTempo(newTempo);
      }
    });
    tempoControl.appendChild(tempoInput);
    
    // BPM label
    const bpmLabel = document.createElement('span');
    bpmLabel.textContent = 'BPM';
    tempoControl.appendChild(bpmLabel);
    
    // Metronome checkbox
    const metronomeContainer = document.createElement('label');
    metronomeContainer.className = 'checkbox-container';
    
    const metronomeCheckbox = document.createElement('input');
    metronomeCheckbox.type = 'checkbox';
    metronomeCheckbox.id = 'metronome-checkbox';
    metronomeCheckbox.checked = store.getMetronomeEnabled();
    metronomeCheckbox.addEventListener('change', () => {
      store.setMetronomeEnabled(metronomeCheckbox.checked);
    });
    metronomeContainer.appendChild(metronomeCheckbox);
    
    const metronomeLabel = document.createElement('span');
    metronomeLabel.className = 'checkbox-label';
    metronomeLabel.textContent = 'Метроном';
    metronomeContainer.appendChild(metronomeLabel);
    
    tempoControl.appendChild(metronomeContainer);
    
    // Add controls
    controlsContainer.appendChild(playbackControls);
    controlsContainer.appendChild(tempoControl);
    
    // Editing controls
    const editingControls = document.createElement('div');
    editingControls.className = 'editing-controls';
    
    // Add pause button
    const addPauseButton = document.createElement('button');
    addPauseButton.id = 'add-pause';
    addPauseButton.className = 'secondary-button';
    addPauseButton.textContent = '+ Пауза';
    addPauseButton.addEventListener('click', () => {
      store.addChordToSequence('PAUSE');
    });
    editingControls.appendChild(addPauseButton);
    
    // Clear button
    const clearButton = document.createElement('button');
    clearButton.id = 'clear-sequence';
    clearButton.className = 'danger-button';
    clearButton.textContent = 'Очистить';
    clearButton.addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите очистить текущую последовательность?')) {
        store.clearSequence();
      }
    });
    editingControls.appendChild(clearButton);
    
    // Add editing controls
    controlsContainer.appendChild(editingControls);
  }
  
  /**
   * Sync component with store state
   */
  syncWithStore() {
    this.sequence = store.getSequence();
    this.updateSequenceDisplay();
  }
  
  /**
   * Update sequence display
   */
  updateSequenceDisplay() {
    // Clear container
    this.container.innerHTML = '';
    
    // If sequence is empty, show placeholder
    if (this.sequence.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'timeline-placeholder';
      placeholder.textContent = 'Добавьте аккорды в последовательность';
      this.container.appendChild(placeholder);
      
      // Disable play button
      const playButton = document.getElementById('play-sequence');
      if (playButton) {
        playButton.disabled = true;
      }
      
      return;
    }
    
    // Enable play button
    const playButton = document.getElementById('play-sequence');
    if (playButton) {
      playButton.disabled = false;
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
    const card = document.createElement('div');
    card.className = 'sequence-card';
    card.setAttribute('data-index', index);
    
    // Check if this is the currently playing chord
    if (index === this.currentPlayingIndex) {
      card.classList.add('current-playing');
    }
    
    // Chord name
    const nameElement = document.createElement('div');
    nameElement.className = 'chord-name';
    
    if (chordName === 'PAUSE') {
      nameElement.textContent = '𝄽'; // Pause symbol
      nameElement.classList.add('pause-symbol');
    } else {
      nameElement.textContent = chordName;
      
      // Add function icon for non-pause chords
      const functionIcon = this.createFunctionIcon(chordName);
      if (functionIcon) {
        card.appendChild(functionIcon);
      }
    }
    
    card.appendChild(nameElement);
    
    // Remove button
    const removeButton = document.createElement('div');
    removeButton.className = 'card-remove';
    removeButton.textContent = '×';
    removeButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click
      this.handleChordRemove(index);
    });
    card.appendChild(removeButton);
    
    // Add click handler for the card
    card.addEventListener('click', () => {
      this.handleChordClick(chordName, index);
    });
    
    return card;
  }
  
  /**
   * Create function icon for chord
   * @param {string} chordName - Name of the chord
   * @returns {HTMLElement|null} Function icon element or null
   */
  createFunctionIcon(chordName) {
    // Skip for pauses
    if (chordName === 'PAUSE' || chordName === 'BLOCK_DIVIDER') {
      return null;
    }
    
    // Get chord data and current tonality
    const chord = window.CHORD_DATA ? window.CHORD_DATA[chordName] : null;
    const tonality = store.getCurrentTonality();
    
    if (!chord || !chord.functions || !chord.functions[tonality]) {
      return null;
    }
    
    // Get chord function
    const chordFunction = chord.functions[tonality].function;
    
    // Create icon
    const functionIcon = document.createElement('span');
    functionIcon.className = `function-icon ${this.getFunctionClass(chordFunction)} sequence-function-icon`;
    functionIcon.textContent = this.getFunctionLabel(chordFunction);
    
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
    // Skip for pauses
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
   * Handle state changes from the store
   * @param {Object} state - Store state
   * @param {string} changedProp - Changed property
   */
  handleStateChange(state, changedProp) {
    switch (changedProp) {
      case 'sequence':
        this.sequence = state.sequence;
        this.updateSequenceDisplay();
        break;
        
      case 'isPlaying':
        // Update stop button state
        const stopButton = document.getElementById('stop-sequence');
        if (stopButton) {
          stopButton.disabled = !state.isPlaying;
        }
        
        // Reset playing index if stopped
        if (!state.isPlaying) {
          this.updatePlayingIndex(-1);
        }
        break;
    }
  }
}

export default SequenceComponent;