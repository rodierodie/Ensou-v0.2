/**
 * exportService.js
 * Modernized service for exporting chord sequences to MIDI and text
 */

import store from '../core/store.js';
import { chordCollection } from '../models/chord.js';
import { tonalityCollection } from '../models/tonality.js';

class ExportService {
  constructor() {
    // Check if MidiWriter is available
    this.midiWriterAvailable = typeof MidiWriter !== 'undefined';
    
    if (!this.midiWriterAvailable) {
      console.warn('MidiWriter library not loaded. MIDI export will be unavailable.');
    }
  }
  
  /**
   * Export current sequence to MIDI
   * @param {boolean} exportFullTrack - Export full track instead of current sequence
   */
  exportToMidi(exportFullTrack = false) {
    // Check if MidiWriter is available
    if (!this.midiWriterAvailable) {
      alert('MidiWriter library not loaded. MIDI export unavailable.');
      return;
    }
    
    // Get data to export
    let sequence;
    if (exportFullTrack) {
      sequence = this.getFullTrackSequence();
    } else {
      sequence = store.getSequence();
    }
    
    // Check if there are chords to export
    if (!sequence || sequence.length === 0) {
      alert('No chords to export');
      return;
    }
    
    // Get tempo
    const tempo = store.getTempo();
    
    // Create MIDI file
    try {
      const midiData = this.createMidiFile(sequence, tempo);
      this.downloadMidiFile(midiData, exportFullTrack);
    } catch (error) {
      console.error('Error creating MIDI file:', error);
      alert('Error creating MIDI file');
    }
  }
  
  /**
   * Create MIDI file from sequence
   * @param {Array} sequence - Array of chord names
   * @param {number} tempo - Tempo in BPM
   * @returns {Uint8Array} MIDI file data
   */
  createMidiFile(sequence, tempo) {
    // Create track
    const track = new MidiWriter.Track();
    
    // Set tempo
    track.setTempo(tempo);
    
    // Process each chord in sequence
    sequence.forEach(chordName => {
      // Handle special markers
      if (chordName === 'PAUSE') {
        // Add pause (half note)
        track.addEvent(new MidiWriter.NoteEvent({
          wait: '0',
          duration: '2',
          sequential: true,
          rest: true
        }));
        return;
      }
      
      if (chordName === 'BLOCK_DIVIDER') {
        // Add short pause for block divider
        track.addEvent(new MidiWriter.NoteEvent({
          wait: '0',
          duration: '4',
          sequential: true,
          rest: true
        }));
        return;
      }
      
      // Get chord data from collection
      const chord = chordCollection.getChord(chordName);
      if (!chord) {
        console.warn(`Chord data not found for: ${chordName}`);
        return;
      }
      
      // Convert notes to MIDI format
      const midiNotes = this.convertNotesToMidi(chord.notes);
      
      // Create note event
      const noteEvent = new MidiWriter.NoteEvent({
        pitch: midiNotes,
        duration: '2', // Half note
        velocity: 80   // Volume (0-100)
      });
      
      // Add to track
      track.addEvent(noteEvent);
    });
    
    // Create writer
    const writer = new MidiWriter.Writer(track);
    
    // Return binary data
    return writer.buildFile();
  }
  
  /**
   * Convert notes to MIDI format
   * @param {Array} notes - Array of notes (e.g. ['C4', 'E4', 'G4'])
   * @returns {Array} MIDI format notes
   */
  convertNotesToMidi(notes) {
    return notes.map(note => {
      // Just return note as is, as MidiWriter expects this format
      return note;
    });
  }
  
  /**
   * Download MIDI file
   * @param {Uint8Array} midiData - MIDI file binary data
   * @param {boolean} isFullTrack - Full track flag
   */
  downloadMidiFile(midiData, isFullTrack) {
    // Get current tonality for filename
    const tonality = store.getCurrentTonality();
    
    // Create filename with current date
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = isFullTrack ? 
      `track_${dateStr}.mid` : 
      `chord_sequence_${tonality}_${dateStr}.mid`;
    
    // Create blob
    const blob = new Blob([midiData], { type: 'audio/midi' });
    
    // Create download URL
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  /**
   * Export current sequence to text
   * @param {boolean} exportFullTrack - Export full track instead of current sequence
   */
  exportToText(exportFullTrack = false) {
    // Get data to export
    let content;
    if (exportFullTrack) {
      content = this.createFullTrackText();
    } else {
      content = this.createSequenceText();
    }
    
    // Show text export dialog
    this.showTextExportDialog(content);
  }
  
  /**
   * Create text representation of current sequence
   * @returns {string} Text representation
   */
  createSequenceText() {
    // Get current sequence and tonality
    const sequence = store.getSequence();
    const tonalityCode = store.getCurrentTonality();
    
    // Get tonality information from collection
    const tonality = tonalityCollection.getTonality(tonalityCode);
    const tonalityName = tonality ? tonality.name : tonalityCode;
    
    // Create header
    let text = `Аккордовая последовательность в тональности ${tonalityName}\n`;
    text += '─'.repeat(50) + '\n\n';
    
    // Add chords (8 per line)
    if (sequence && sequence.length > 0) {
      const chordsPerLine = 8;
      for (let i = 0; i < sequence.length; i += chordsPerLine) {
        const line = sequence.slice(i, i + chordsPerLine);
        text += line.map(chord => chord === 'PAUSE' ? '◊' : chord).join(' - ');
        text += '\n';
      }
    } else {
      text += 'Последовательность пуста\n';
    }
    
    // Add chord function information
    text += '\n' + '─'.repeat(50) + '\n';
    text += 'Функциональное значение аккордов:\n\n';
    
    if (sequence && sequence.length > 0) {
      // Create set to avoid duplicates
      const processedChords = new Set();
      
      sequence.forEach(chordName => {
        // Skip pauses and already processed chords
        if (chordName === 'PAUSE' || processedChords.has(chordName)) return;
        
        // Mark chord as processed
        processedChords.add(chordName);
        
        // Get chord data from collection
        const chord = chordCollection.getChord(chordName);
        if (!chord) return;
        
        // Get function in current tonality
        const func = chord.functions && chord.functions[tonalityCode];
        if (func) {
          text += `${chordName}: ${func.function} (ступень ${func.degree})\n`;
        }
      });
    }
    
    // Add application information
    text += '\n' + '─'.repeat(50) + '\n';
    text += 'Создано в приложении "Изучение музыкальной гармонии"\n';
    
    return text;
  }
  
  /**
   * Create text representation of full track
   * @returns {string} Text representation
   */
  createFullTrackText() {
    // Get track structure
    const trackStructure = store.getTrackStructure();
    
    // Create header
    let text = 'СТРУКТУРА ТРЕКА\n';
    text += '═'.repeat(50) + '\n\n';
    
    // Process each block
    trackStructure.forEach((block) => {
      // Block header
      text += `БЛОК ${block.name} (${block.tonality})\n`;
      text += '─'.repeat(30) + '\n';
      
      // If block is empty
      if (!block.chords || block.chords.length === 0) {
        text += 'Нет аккордов\n\n';
        return;
      }
      
      // Add chords (8 per line)
      const chordsPerLine = 8;
      for (let i = 0; i < block.chords.length; i += chordsPerLine) {
        const line = block.chords.slice(i, i + chordsPerLine);
        text += line.map(chord => chord === 'PAUSE' ? '◊' : chord).join(' - ');
        text += '\n';
      }
      
      // Add separator between blocks
      text += '\n';
    });
    
    // Add application information
    text += '═'.repeat(50) + '\n';
    text += 'Создано в приложении "Изучение музыкальной гармонии"\n';
    
    return text;
  }
  
  /**
   * Show text export dialog
   * @param {string} text - Text content
   */
  showTextExportDialog(text) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.backgroundColor = 'white';
    dialog.style.borderRadius = '8px';
    dialog.style.padding = '20px';
    dialog.style.width = '90%';
    dialog.style.maxWidth = '600px';
    dialog.style.maxHeight = '80vh';
    dialog.style.overflow = 'auto';
    
    // Dialog title
    const title = document.createElement('h3');
    title.textContent = 'Экспорт в текст';
    title.style.marginTop = '0';
    dialog.appendChild(title);
    
    // Textarea with content
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.width = '100%';
    textarea.style.height = '300px';
    textarea.style.marginBottom = '15px';
    textarea.style.padding = '10px';
    textarea.style.border = '1px solid #ddd';
    textarea.style.borderRadius = '4px';
    textarea.style.fontFamily = 'monospace';
    dialog.appendChild(textarea);
    
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    
    // Copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Копировать';
    copyButton.addEventListener('click', () => {
      textarea.select();
      document.execCommand('copy');
      alert('Текст скопирован в буфер обмена');
    });
    buttonContainer.appendChild(copyButton);
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Закрыть';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    buttonContainer.appendChild(closeButton);
    
    // Add buttons to dialog
    dialog.appendChild(buttonContainer);
    
    // Add dialog to overlay
    overlay.appendChild(dialog);
    
    // Add overlay to page
    document.body.appendChild(overlay);
    
    // Select text for easy copying
    textarea.select();
  }
  
  /**
   * Get full track sequence
   * @returns {Array} Combined sequence
   */
  getFullTrackSequence() {
    // Get track structure
    const trackStructure = store.getTrackStructure();
    
    // Combine all blocks
    const fullSequence = [];
    
    trackStructure.forEach((block, index) => {
      // Add block divider if not first block
      if (index > 0) {
        fullSequence.push('BLOCK_DIVIDER');
      }
      
      // Add block chords
      if (block.chords && block.chords.length > 0) {
        fullSequence.push(...block.chords);
      }
    });
    
    return fullSequence;
  }
}

// Create singleton
const exportService = new ExportService();

export default exportService;