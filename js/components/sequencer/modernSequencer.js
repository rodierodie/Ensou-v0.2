/**
 * modernSequencer.js
 * Component for managing and displaying chord sequences
 */

import Component from '../../components/component.js';
import store from '../../core/store.js';
import eventBus from '../../core/eventBus.js';
import audioService from '../../services/audioService.js';

// Debug helper
function debug(message) {
    console.log(`[SEQUENCER] ${message}`);
    if (window.debugLog) {
        window.debugLog(message);
    }
}

/**
 * ModernSequencer component for managing chord sequences
 */
class ModernSequencer extends Component {
    /**
     * Create a new ModernSequencer
     * @param {HTMLElement} controlsContainer - Container for sequence controls
     * @param {HTMLElement} sequenceContainer - Container for sequence display
     * @param {Object} options - Component options
     */
    constructor(controlsContainer, sequenceContainer, options = {}) {
        // Call parent constructor with controls container
        super(controlsContainer, {
            ...options,
            autoRender: false // Disable auto render
        });
        
        // Store sequence container
        this.sequenceContainer = sequenceContainer;
        
        // Store state
        this.sequence = store.getSequence();
        this.isPlaying = store.getIsPlaying();
        this.currentPlayingIndex = -1;
        this.tempo = store.getTempo();
        
        debug('ModernSequencer created');
        
        // Subscribe to store changes
        this.subscribeToStore(this.handleStateChange, ['sequence', 'isPlaying', 'tempo']);
        
        // Subscribe to events
        this.subscribeToEvent('chordPlaying', this.handleChordPlaying.bind(this));
        
        // Initialize component
        this.init();
    }
    
    /**
     * Initialize component
     */
    init() {
        debug('Initializing ModernSequencer');
        
        // Render component
        this.render();
        
        // Render sequence
        this.renderSequence();
        
        debug('ModernSequencer initialized');
    }
    
    /**
     * Render component (controls)
     */
    render() {
        if (!this.container) return;
        
        // Clear container
        this.clearContainer();
        
        // Create main controls container
        const mainControls = document.createElement('div');
        mainControls.className = 'main-sequence-controls';
        
        // Create play button
        const playButton = document.createElement('button');
        playButton.id = 'play-sequence';
        playButton.className = 'play-button';
        playButton.textContent = '▶ Проиграть';
        playButton.disabled = this.isPlaying || this.sequence.length === 0;
        playButton.addEventListener('click', () => this.handlePlayClick());
        mainControls.appendChild(playButton);
        
        // Create stop button
        const stopButton = document.createElement('button');
        stopButton.id = 'stop-sequence';
        stopButton.className = 'stop-button';
        stopButton.textContent = '■ Стоп';
        stopButton.disabled = !this.isPlaying;
        stopButton.addEventListener('click', () => this.handleStopClick());
        mainControls.appendChild(stopButton);
        
        // Add main controls to container
        this.container.appendChild(mainControls);
        
        // Create edit controls container
        const editControls = document.createElement('div');
        editControls.className = 'edit-sequence-controls';
        
        // Create add pause button
        const addPauseButton = document.createElement('button');
        addPauseButton.id = 'add-pause';
        addPauseButton.className = 'add-pause-button';
        addPauseButton.textContent = '+ Пауза';
        addPauseButton.addEventListener('click', () => this.handleAddPauseClick());
        editControls.appendChild(addPauseButton);
        
        // Create clear button
        const clearButton = document.createElement('button');
        clearButton.id = 'clear-sequence';
        clearButton.className = 'clear-button';
        clearButton.textContent = 'Очистить';
        clearButton.disabled = this.sequence.length === 0;
        clearButton.addEventListener('click', () => this.handleClearClick());
        editControls.appendChild(clearButton);
        
        // Add edit controls to container
        this.container.appendChild(editControls);
    }
    
    /**
     * Render sequence
     */
    renderSequence() {
        if (!this.sequenceContainer) return;
        
        // Clear container
        this.sequenceContainer.innerHTML = '';
        
        // If sequence is empty, show placeholder
        if (this.sequence.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'timeline-placeholder';
            placeholder.textContent = 'Добавьте аккорды в последовательность';
            this.sequenceContainer.appendChild(placeholder);
            return;
        }
        
        // Create card for each chord in sequence
        this.sequence.forEach((chordName, index) => {
            const card = this.createSequenceCard(chordName, index);
            this.sequenceContainer.appendChild(card);
        });
        
        // Scroll to current chord if playing
        if (this.currentPlayingIndex >= 0 && this.isPlaying) {
            this.scrollToCurrentChord();
        }
    }
    
    /**
     * Create a sequence card for a chord
     * @param {string} chordName - Chord name
     * @param {number} index - Chord index in sequence
     * @returns {HTMLElement} Sequence card element
     */
    createSequenceCard(chordName, index) {
        // Create card element
        const card = document.createElement('div');
        card.className = 'sequence-card';
        card.dataset.index = index;
        
        // Add current-playing class if this is currently playing chord
        if (index === this.currentPlayingIndex && this.isPlaying) {
            card.classList.add('current-playing');
        }
        
        // Create chord name element
        const nameElement = document.createElement('div');
        nameElement.className = 'chord-name';
        
        if (chordName === 'PAUSE') {
            // Show pause symbol
            nameElement.textContent = '𝄽';
            nameElement.classList.add('pause-symbol');
        } else if (chordName === 'BLOCK_DIVIDER') {
            // Show block divider symbol
            nameElement.textContent = '|';
            nameElement.classList.add('block-divider-symbol');
        } else {
            // Show chord name
            nameElement.textContent = chordName;
        }
        
        card.appendChild(nameElement);
        
        // Create remove button
        const removeButton = document.createElement('div');
        removeButton.className = 'card-remove';
        removeButton.textContent = '×';
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            this.handleRemoveChord(index);
        });
        
        card.appendChild(removeButton);
        
        // Add click handler for card
        card.addEventListener('click', () => {
            this.handleChordCardClick(chordName, index);
        });
        
        return card;
    }
    
    /**
     * Handle play button click
     */
    handlePlayClick() {
        debug('Play button clicked');
        store.setIsPlaying(true);
    }
    
    /**
     * Handle stop button click
     */
    handleStopClick() {
        debug('Stop button clicked');
        store.setIsPlaying(false);
    }
    
    /**
     * Handle add pause button click
     */
    handleAddPauseClick() {
        debug('Add pause button clicked');
        store.addChordToSequence('PAUSE');
    }
    
    /**
     * Handle clear button click
     */
    handleClearClick() {
        debug('Clear button clicked');
        
        // Ask for confirmation
        if (confirm('Вы уверены, что хотите очистить текущую последовательность?')) {
            store.clearSequence();
        }
    }
    
    /**
     * Handle chord card click
     * @param {string} chordName - Chord name
     * @param {number} index - Chord index
     */
    handleChordCardClick(chordName, index) {
        // Skip for pauses and block dividers
        if (chordName === 'PAUSE' || chordName === 'BLOCK_DIVIDER') {
            return;
        }
        
        debug(`Chord card clicked: ${chordName}`);
        
        // Set as current chord
        store.setCurrentChord(chordName);
        
        // Play chord
        audioService.playChord(chordName);
        
        // Publish event
        eventBus.publish('sequenceChordClicked', {
            name: chordName,
            index: index
        });
    }
    
    /**
     * Handle remove chord
     * @param {number} index - Chord index
     */
    handleRemoveChord(index) {
        debug(`Remove chord at index ${index}`);
        store.removeChordFromSequence(index);
    }
    
    /**
     * Handle chord playing event
     * @param {Object} data - Event data
     */
    handleChordPlaying(data) {
        debug(`Chord playing: ${data.chordName} at index ${data.index}`);
        
        // Update current playing index
        this.currentPlayingIndex = data.index;
        
        // Update UI
        this.updatePlayingHighlight();
    }
    
    /**
     * Update playing highlight
     */
    updatePlayingHighlight() {
        // Remove highlight from all cards
        const cards = this.sequenceContainer.querySelectorAll('.sequence-card');
        cards.forEach(card => {
            card.classList.remove('current-playing');
        });
        
        // Add highlight to current card
        if (this.currentPlayingIndex >= 0 && this.isPlaying) {
            const currentCard = this.sequenceContainer.querySelector(`.sequence-card[data-index="${this.currentPlayingIndex}"]`);
            if (currentCard) {
                currentCard.classList.add('current-playing');
                
                // Scroll to make current card visible
                this.scrollToCurrentChord();
            }
        }
    }
    
    /**
     * Scroll to current chord
     */
    scrollToCurrentChord() {
        // Find current card
        const currentCard = this.sequenceContainer.querySelector('.sequence-card.current-playing');
        if (!currentCard) return;
        
        // Calculate if card is visible in container
        const containerRect = this.sequenceContainer.getBoundingClientRect();
        const cardRect = currentCard.getBoundingClientRect();
        
        // Scroll if card is outside visible area
        if (cardRect.left < containerRect.left || cardRect.right > containerRect.right) {
            // Calculate scroll position to center card
            const scrollLeft = (
                currentCard.offsetLeft - 
                this.sequenceContainer.clientWidth / 2 + 
                currentCard.clientWidth / 2
            );
            
            // Scroll container
            this.sequenceContainer.scrollLeft = scrollLeft;
        }
    }
    
    /**
     * Handle state changes
     * @param {Object} state - Current state
     * @param {string} changedProp - Changed property
     */
    handleStateChange(state, changedProp) {
        debug(`State changed: ${changedProp}`);
        
        if (changedProp === 'sequence') {
            // Update sequence
            this.sequence = state.sequence;
            
            // Re-render sequence
            this.renderSequence();
            
            // Update controls (clear button state)
            this.render();
        } else if (changedProp === 'isPlaying') {
            // Update isPlaying
            this.isPlaying = state.isPlaying;
            
            // If stopped, reset current playing index
            if (!this.isPlaying) {
                this.currentPlayingIndex = -1;
                this.updatePlayingHighlight();
            }
            
            // Update controls (play/stop button state)
            this.render();
        } else if (changedProp === 'tempo') {
            // Update tempo
            this.tempo = state.tempo;
        }
    }
}

export default ModernSequencer;