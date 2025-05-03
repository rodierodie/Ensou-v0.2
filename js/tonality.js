/**
 * tonality.js
 * База данных тональностей с аккордами
 */

// База данных тональностей и аккордов
const TONALITY_DATA = {
    // Мажорные тональности
    'C': {
        name: 'До мажор',
        type: 'major',
        signature: '0',
        chords: {
            basic: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
            seventh: ['C7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5']
        }
    },
    'G': {
        name: 'Соль мажор',
        type: 'major',
        signature: '1#',
        chords: {
            basic: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
            seventh: ['G7', 'Am7', 'Bm7', 'Cmaj7', 'D7', 'Em7', 'F#m7b5']
        }
    },
    'D': {
        name: 'Ре мажор',
        type: 'major',
        signature: '2#',
        chords: {
            basic: ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
            seventh: ['D7', 'Em7', 'F#m7', 'Gmaj7', 'A7', 'Bm7', 'C#m7b5']
        }
    },
    'A': {
        name: 'Ля мажор',
        type: 'major',
        signature: '3#',
        chords: {
            basic: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
            seventh: ['A7', 'Bm7', 'C#m7', 'Dmaj7', 'E7', 'F#m7', 'G#m7b5']
        }
    },
    'E': {
        name: 'Ми мажор',
        type: 'major',
        signature: '4#',
        chords: {
            basic: ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
            seventh: ['E7', 'F#m7', 'G#m7', 'Amaj7', 'B7', 'C#m7', 'D#m7b5']
        }
    },
    'F': {
        name: 'Фа мажор',
        type: 'major',
        signature: '1b',
        chords: {
            basic: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
            seventh: ['F7', 'Gm7', 'Am7', 'Bbmaj7', 'C7', 'Dm7', 'Em7b5']
        }
    },
    'Bb': {
        name: 'Си-бемоль мажор',
        type: 'major',
        signature: '2b',
        chords: {
            basic: ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim'],
            seventh: ['Bb7', 'Cm7', 'Dm7', 'Ebmaj7', 'F7', 'Gm7', 'Am7b5']
        }
    },
    'Eb': {
        name: 'Ми-бемоль мажор',
        type: 'major',
        signature: '3b',
        chords: {
            basic: ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim'],
            seventh: ['Eb7', 'Fm7', 'Gm7', 'Abmaj7', 'Bb7', 'Cm7', 'Dm7b5']
        }
    },
    // Минорные тональности
    'Am': {
        name: 'Ля минор',
        type: 'minor',
        signature: '0',
        chords: {
            basic: ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'],
            seventh: ['Am7', 'Bm7b5', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7']
        }
    },
    'Em': {
        name: 'Ми минор',
        type: 'minor',
        signature: '1#',
        chords: {
            basic: ['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D'],
            seventh: ['Em7', 'F#m7b5', 'Gmaj7', 'Am7', 'Bm7', 'Cmaj7', 'D7']
        }
    },
    'Dm': {
        name: 'Ре минор',
        type: 'minor',
        signature: '1b',
        chords: {
            basic: ['Dm', 'Edim', 'F', 'Gm', 'Am', 'Bb', 'C'],
            seventh: ['Dm7', 'Em7b5', 'Fmaj7', 'Gm7', 'Am7', 'Bbmaj7', 'C7']
        }
    }
};

// Экспортируем TONALITY_DATA для использования в других модулях
window.TONALITY_DATA = TONALITY_DATA;