/**
 * modernChordSelector.js
 * Component for displaying and selecting chords in the current tonality
 */

import Component from '../../components/component.js';
import store from '../../core/store.js';
import eventBus from '../../core/eventBus.js';
import audioService from '../../services/audioService.js';
import { tonalityCollection } from '../../models/tonality.js';
import { chordCollection } from '../../models/chord.js';

// Debug helper
function debug(message) {
    console.log(`[CHORD_SELECTOR] ${message}`);
    if (window.debugLog) {
        window.debugLog(message);
    }
}

/**
 * ModernChordSelector component for displaying and selecting chords
 */
class ModernChordSelector extends Component {
    /**
     * Create a new ModernChordSelector
     * @param {HTMLElement} basicChordsContainer - Container for basic chords
     * @param {HTMLElement} seventhChordsContainer - Container for seventh chords
     * @param {Object} options - Component options
     */
    constructor(basicChordsContainer, seventhChordsContainer, options = {}) {
        // Set containers
        const containers = {
            basic: basicChordsContainer,
            seventh: seventhChordsContainer
        };
        
        // Call parent constructor with first container
        super(basicChordsContainer, {
            ...options,
            autoRender: false // Disable auto render
        });
        
        // Store both containers
        this.containers = containers;
        
        // Store state
        this.currentTonality = store.getCurrentTonality();
        this.currentChord = store.getCurrentChord();
        this.suggestionLevel = { // For chord suggestions (will be implemented later)
            high: [],
            medium: [],
            low: []
        };
        
        debug('ModernChordSelector created');
        
        // Subscribe to store changes
        this.subscribeToStore(this.handleStateChange, ['currentTonality', 'currentChord']);
        
        // Initialize component
        this.init();
    }
    
    /**
     * Initialize component
     */
    init() {
        debug('Initializing ModernChordSelector');
        
        // Load chord data
        this.loadChordData();
        
        // Render component
        this.render();
        
        debug('ModernChordSelector initialized');
    }
    
    /**
     * Load chord data for current tonality
     */
    loadChordData() {
        // Get tonality data
        const tonality = tonalityCollection.getTonality(this.currentTonality);
        
        if (!tonality) {
            debug(`ERROR: Tonality ${this.currentTonality} not found`);
            return;
        }
        
        // Store chord data
        this.basicChords = tonality.chords.basic || [];
        this.seventhChords = tonality.chords.seventh || [];
        
        debug(`Loaded chords for tonality ${this.currentTonality}`);
    }
    
    /**
     * Render component
     */
    render() {
        // Render basic chords
        this.renderChordSection(this.containers.basic, this.basicChords, 'basic');
        
        // Render seventh chords
        this.renderChordSection(this.containers.seventh, this.seventhChords, 'seventh');
        
        // Highlight current chord
        this.highlightCurrentChord();
        
        // Highlight suggested chords (if any)
        this.highlightSuggestedChords();
    }
    
    /**
     * Render a chord section (basic or seventh)
     * @param {HTMLElement} container - Container element
     * @param {string[]} chords - Chord names
     * @param {string} type - Section type ('basic' or 'seventh')
     */
    renderChordSection(container, chords, type) {
        // Skip if container doesn't exist
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Create chord buttons
        chords.forEach(chordName => {
            // Skip invalid chords
            if (!chordName || chordName === 'undefined') return;
            
            // Create button element
            const button = document.createElement('div');
            button.className = 'chord-button';
            button.dataset.chord = chordName;
            button.dataset.type = type;
            button.textContent = chordName;
            
            // Add click handler
            button.addEventListener('click', () => this.handleChordClick(chordName));
            
            // Add to container
            container.appendChild(button);
        });
    }
    
    /**
     * Handle chord button click
     * @param {string} chordName - Chord name
     */
    handleChordClick(chordName) {
        debug(`Chord clicked: ${chordName}`);
        
        // Set current chord in store
        store.setCurrentChord(chordName);
        
        // Play chord
        audioService.playChord(chordName);
        
        // Publish event
        eventBus.publish('chordSelected', {
            name: chordName,
            tonality: this.currentTonality
        });
    }
    
    /**
     * Highlight current chord
     */
    highlightCurrentChord() {
        // Remove active class from all chord buttons
        document.querySelectorAll('.chord-button').forEach(button => {
            button.classList.remove('active');
        });
        
        // Add active class to current chord buttons
        document.querySelectorAll(`.chord-button[data-chord="${this.currentChord}"]`).forEach(button => {
            button.classList.add('active');
        });
    }
    
    /**
     * Highlight suggested chords
     */
    highlightSuggestedChords() {
        // Remove all suggestion classes
        document.querySelectorAll('.chord-button').forEach(button => {
            button.classList.remove('suggested-high', 'suggested-medium', 'suggested-low');
            
            // Remove function icon if exists
            const icon = button.querySelector('.suggestion-function-icon');
            if (icon) icon.remove();
        });
        
        // Add high suggestions
        this.suggestionLevel.high.forEach(chordName => {
            document.querySelectorAll(`.chord-button[data-chord="${chordName}"]`).forEach(button => {
                button.classList.add('suggested-high');
            });
        });
        
        // Add medium suggestions
        this.suggestionLevel.medium.forEach(chordName => {
            document.querySelectorAll(`.chord-button[data-chord="${chordName}"]`).forEach(button => {
                button.classList.add('suggested-medium');
            });
        });
        
        // Add low suggestions
        this.suggestionLevel.low.forEach(chordName => {
            document.querySelectorAll(`.chord-button[data-chord="${chordName}"]`).forEach(button => {
                button.classList.add('suggested-low');
            });
        });
    }
    
    /**
     * Update suggestions
     * @param {Array} suggestions - Suggested chords with confidence levels
     */
    updateSuggestions(suggestions) {
        // Reset suggestions
        this.suggestionLevel = {
            high: [],
            medium: [],
            low: []
        };
        
        // Process suggestions
        suggestions.forEach(suggestion => {
            if (suggestion.confidence > 0.6) {
                this.suggestionLevel.high.push(suggestion.name);
            } else if (suggestion.confidence > 0.3) {
                this.suggestionLevel.medium.push(suggestion.name);
            } else {
                this.suggestionLevel.low.push(suggestion.name);
            }
        });
        
        // Update highlighting
        this.highlightSuggestedChords();
    }
    
    /**
     * Handle state changes
     * @param {Object} state - Current state
     * @param {string} changedProp - Changed property
     */
    handleStateChange(state, changedProp) {
        debug(`State changed: ${changedProp}`);
        
        if (changedProp === 'currentTonality') {
            // Update tonality
            this.currentTonality = state.currentTonality;
            
            // Reload chord data
            this.loadChordData();
            
            // Re-render component
            this.render();
        } else if (changedProp === 'currentChord') {
            // Update chord
            this.currentChord = state.currentChord;
            
            // Update highlighting
            this.highlightCurrentChord();
        }
    }
}

export default ModernChordSelector;