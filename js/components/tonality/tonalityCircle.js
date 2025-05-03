/**
 * tonalityCircle.js
 * Component for displaying and interacting with the circle of fifths
 */

import store from '../../core/store.js';

class TonalityCircle {
  /**
   * Create a new TonalityCircle component
   * @param {HTMLElement} container - Container element for the circle
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      radius: 150,           // Circle radius
      majorRadius: 120,      // Radius for major keys
      minorRadius: 80,       // Radius for minor keys
      centerX: 150,          // Center X coordinate
      centerY: 150,          // Center Y coordinate
      outerCircleColor: '#f5f5f5',
      innerCircleColor: '#f0f0f0',
      majorNoteColor: '#e3f2fd',
      selectedMajorColor: '#bbdefb',
      minorNoteColor: '#f3e5f5',
      selectedMinorColor: '#e1bee7',
      noteCircleSize: 24,    // Size of note circles
      minorNoteCircleSize: 18,
      textColor: '#333',
      fontSize: 14,
      minorFontSize: 12,
      ...options
    };
    
    // Circle of fifths arrangement
    this.majorKeys = [
      { note: 'C', angle: 270 },
      { note: 'G', angle: 300 },
      { note: 'D', angle: 330 },
      { note: 'A', angle: 0 },
      { note: 'E', angle: 30 },
      { note: 'B', angle: 60 },
      { note: 'F#', angle: 90 },
      { note: 'F', angle: 240 },
      { note: 'Bb', angle: 210 },
      { note: 'Eb', angle: 180 },
      { note: 'Ab', angle: 150 },
      { note: 'Db', angle: 120 }
    ];
    
    // Generate related minor keys
    this.minorKeys = this.majorKeys.map(majorKey => {
      return {
        note: this.getRelativeMinor(majorKey.note),
        angle: majorKey.angle
      };
    });
    
    // Track selected note and type
    this.selectedNote = null;
    this.selectedType = 'major';
    
    // Create SVG element
    this.createSvgElement();
    
    // Initialize the circle
    this.renderCircle();
    
    // Subscribe to store changes
    store.subscribe(this.handleStateChange.bind(this), ['currentTonality']);
    
    // Initial sync with store
    this.syncWithStore();
  }
  
  /**
   * Create SVG element for the circle
   */
  createSvgElement() {
    // Create SVG namespace element
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', '0 0 300 300');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', 'auto');
    this.svg.setAttribute('class', 'tonality-circle');
    
    // Append SVG to container
    this.container.appendChild(this.svg);
  }
  
  /**
   * Render the circle of fifths
   */
  renderCircle() {
    // Clear existing content
    this.svg.innerHTML = '';
    
    // Add outer circle
    const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerCircle.setAttribute('cx', this.options.centerX);
    outerCircle.setAttribute('cy', this.options.centerY);
    outerCircle.setAttribute('r', this.options.majorRadius);
    outerCircle.setAttribute('fill', this.options.outerCircleColor);
    outerCircle.setAttribute('stroke', '#ddd');
    outerCircle.setAttribute('stroke-width', '1');
    this.svg.appendChild(outerCircle);
    
    // Add inner circle
    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerCircle.setAttribute('cx', this.options.centerX);
    innerCircle.setAttribute('cy', this.options.centerY);
    innerCircle.setAttribute('r', this.options.minorRadius);
    innerCircle.setAttribute('fill', this.options.innerCircleColor);
    innerCircle.setAttribute('stroke', '#ddd');
    innerCircle.setAttribute('stroke-width', '1');
    this.svg.appendChild(innerCircle);
    
    // Add connecting lines between related keys
    this.drawConnectionLines();
    
    // Add major key notes
    this.majorKeys.forEach(key => {
      this.addNoteToCircle(key, 'major');
    });
    
    // Add minor key notes
    this.minorKeys.forEach(key => {
      this.addNoteToCircle(key, 'minor');
    });
  }
  
  /**
   * Draw connection lines between related keys
   */
  drawConnectionLines() {
    // Draw lines connecting relative major/minor keys
    this.majorKeys.forEach(majorKey => {
      const majorCoords = this.getCoordinatesForAngle(majorKey.angle, this.options.majorRadius);
      const minorCoords = this.getCoordinatesForAngle(majorKey.angle, this.options.minorRadius);
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', majorCoords.x);
      line.setAttribute('y1', majorCoords.y);
      line.setAttribute('x2', minorCoords.x);
      line.setAttribute('y2', minorCoords.y);
      line.setAttribute('stroke', '#ddd');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '4,4');
      
      this.svg.appendChild(line);
    });
  }
  
  /**
   * Add a note to the circle
   * @param {Object} key - Key information {note, angle}
   * @param {string} type - 'major' or 'minor'
   */
  addNoteToCircle(key, type) {
    const radius = type === 'major' ? this.options.majorRadius : this.options.minorRadius;
    const coords = this.getCoordinatesForAngle(key.angle, radius);
    const noteSize = type === 'major' ? this.options.noteCircleSize : this.options.minorNoteCircleSize;
    const fontSize = type === 'major' ? this.options.fontSize : this.options.minorFontSize;
    
    // Create group for the note
    const noteGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    noteGroup.setAttribute('class', `note-group ${type}`);
    noteGroup.setAttribute('data-note', key.note);
    noteGroup.setAttribute('data-type', type);
    
    // Determine if this note is selected
    const isSelected = this.isNoteSelected(key.note, type);
    
    // Create circle for the note
    const noteCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    noteCircle.setAttribute('cx', coords.x);
    noteCircle.setAttribute('cy', coords.y);
    noteCircle.setAttribute('r', noteSize);
    
    // Set fill color based on type and selection state
    if (type === 'major') {
      noteCircle.setAttribute('fill', isSelected ? this.options.selectedMajorColor : this.options.majorNoteColor);
    } else {
      noteCircle.setAttribute('fill', isSelected ? this.options.selectedMinorColor : this.options.minorNoteColor);
    }
    
    noteCircle.setAttribute('stroke', isSelected ? '#2196f3' : '#90caf9');
    noteCircle.setAttribute('stroke-width', isSelected ? '2' : '1');
    
    // Create text for the note
    const noteText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    noteText.setAttribute('x', coords.x);
    noteText.setAttribute('y', coords.y + 5); // Adjust for vertical centering
    noteText.setAttribute('text-anchor', 'middle');
    noteText.setAttribute('font-size', fontSize);
    noteText.setAttribute('fill', this.options.textColor);
    noteText.textContent = type === 'minor' ? key.note + 'm' : key.note;
    
    // Add click handler
    noteGroup.addEventListener('click', () => {
      this.handleNoteClick(key.note, type);
    });
    
    // Add elements to group
    noteGroup.appendChild(noteCircle);
    noteGroup.appendChild(noteText);
    
    // Add group to SVG
    this.svg.appendChild(noteGroup);
  }
  
  /**
   * Handle note click
   * @param {string} note - Note name
   * @param {string} type - 'major' or 'minor'
   */
  handleNoteClick(note, type) {
    // Update selected note and type
    this.selectedNote = note;
    this.selectedType = type;
    
    // Update tonality in store
    const tonalityCode = type === 'minor' ? note + 'm' : note;
    store.setCurrentTonality(tonalityCode);
    
    // Update circle visually
    this.renderCircle();
    
    // Trigger callback if provided
    if (this.options.onSelect) {
      this.options.onSelect(note, type);
    }
  }
  
  /**
   * Check if note is selected
   * @param {string} note - Note name
   * @param {string} type - 'major' or 'minor'
   * @returns {boolean} True if note is selected
   */
  isNoteSelected(note, type) {
    return this.selectedNote === note && this.selectedType === type;
  }
  
  /**
   * Calculate coordinates for a given angle and radius
   * @param {number} angle - Angle in degrees
   * @param {number} radius - Radius
   * @returns {Object} {x, y} coordinates
   */
  getCoordinatesForAngle(angle, radius) {
    const angleInRadians = (angle - 90) * Math.PI / 180;
    return {
      x: this.options.centerX + radius * Math.cos(angleInRadians),
      y: this.options.centerY + radius * Math.sin(angleInRadians)
    };
  }
  
  /**
   * Get relative minor for a major key
   * @param {string} majorNote - Major note
   * @returns {string} Relative minor note
   */
  getRelativeMinor(majorNote) {
    const noteMap = {
      'C': 'A', 'G': 'E', 'D': 'B', 'A': 'F#',
      'E': 'C#', 'B': 'G#', 'F#': 'D#',
      'F': 'D', 'Bb': 'G', 'Eb': 'C', 'Ab': 'F', 'Db': 'Bb'
    };
    
    return noteMap[majorNote] || majorNote;
  }
  
  /**
   * Update selected tonality
   * @param {string} note - Note name
   * @param {string} type - 'major' or 'minor'
   */
  updateSelectedTonality(note, type) {
    if (this.selectedNote === note && this.selectedType === type) {
      return; // No change needed
    }
    
    this.selectedNote = note;
    this.selectedType = type;
    
    // Update circle visually
    this.renderCircle();
  }
  
  /**
   * Handle state changes from the store
   * @param {Object} state - Application state
   * @param {string} changedProp - Property that changed
   */
  handleStateChange(state, changedProp) {
    if (changedProp === 'currentTonality') {
      this.syncWithStore();
    }
  }
  
  /**
   * Sync component with store
   */
  syncWithStore() {
    const tonality = store.getCurrentTonality();
    
    // Parse tonality code to get note and type
    let note, type;
    if (tonality.endsWith('m')) {
      note = tonality.slice(0, -1);
      type = 'minor';
    } else {
      note = tonality;
      type = 'major';
    }
    
    this.updateSelectedTonality(note, type);
  }
}

export default TonalityCircle;