// js/app.js
import store from './core/store.js';
import eventBus from './core/eventBus.js';
import { tonalityCollection } from './models/tonality.js';
import { chordCollection } from './models/chord.js';
import initializeDataModels from './models/initializeData.js';

// Импорт сервисов
import audioService from './services/audioService.js';
import storageService from './services/storageService.js';
import exportService from './services/exportService.js';
import trackStructureService from './models/trackStructure.js';

// Импорт UI компонентов
import TonalitySelector from './components/tonality/tonalitySelector.js';
import TonalityCircle from './components/tonality/tonalityCircle.js';
import ChordSelector from './components/chords/chordSelector.js';
import ChordInfo from './components/chords/chordInfo.js';
import SequenceComponent from './components/sequencer/sequenceComponent.js';
import BlockSelector from './components/sequencer/blockSelector.js';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Инициализация моделей данных
        await initializeDataModels();
        
        // Инициализация аудио сервиса (не стартуем контекст до взаимодействия)
        await audioService.initialize();
        
        // Загрузка сохраненных данных
        storageService.loadData();
        
        // Создание компонентов UI
        createComponents();
        
        // Настройка обработчиков событий
        setupEventListeners();
        
        console.log('Приложение успешно инициализировано');
    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
    }
});

// Функция создания компонентов UI
function createComponents() {
    // Компоненты тональности
    const tonalitySelectorContainer = document.getElementById('tonality-selector-container');
    const tonalityCircleContainer = document.getElementById('tonality-circle-container');
    
    if (tonalitySelectorContainer) {
        new TonalitySelector(tonalitySelectorContainer);
    }
    
    if (tonalityCircleContainer) {
        new TonalityCircle(tonalityCircleContainer);
    }
    
    // Компоненты аккордов
    const basicChordsContainer = document.getElementById('basic-chords');
    const seventhChordsContainer = document.getElementById('seventh-chords');
    const chordInfoContainer = document.getElementById('chord-info-section');
    
    if (basicChordsContainer && seventhChordsContainer) {
        new ChordSelector(basicChordsContainer, seventhChordsContainer);
    }
    
    if (chordInfoContainer) {
        new ChordInfo(chordInfoContainer);
    }
    
    // Компоненты секвенсора
    const sequenceContainer = document.getElementById('sequence-container');
    const blockTabsContainer = document.getElementById('block-tabs-container');
    
    if (sequenceContainer) {
        new SequenceComponent(sequenceContainer);
    }
    
    if (blockTabsContainer) {
        new BlockSelector(blockTabsContainer);
    }
    
    // Настраиваем элементы управления
    setupControls();
}

// Функция настройки элементов управления
function setupControls() {
    // Настройка контролов воспроизведения
    const playButton = document.getElementById('play-button');
    const stopButton = document.getElementById('stop-button');
    
    if (playButton) {
        playButton.addEventListener('click', () => {
            store.setIsPlaying(true);
        });
    }
    
    if (stopButton) {
        stopButton.addEventListener('click', () => {
            store.setIsPlaying(false);
        });
    }
    
    // Настройка контролов темпа
    const tempoInput = document.getElementById('tempo-input');
    if (tempoInput) {
        tempoInput.value = store.getTempo();
        tempoInput.addEventListener('change', () => {
            const tempo = parseInt(tempoInput.value);
            if (!isNaN(tempo) && tempo >= 40 && tempo <= 240) {
                store.setTempo(tempo);
            }
        });
    }
    
    // Настройка переключателя метронома
    const metronomeCheckbox = document.getElementById('metronome-checkbox');
    if (metronomeCheckbox) {
        metronomeCheckbox.checked = store.getMetronomeEnabled();
        metronomeCheckbox.addEventListener('change', () => {
            store.setMetronomeEnabled(metronomeCheckbox.checked);
        });
    }
    
    // Настройка переключателя арпеджиатора
    const arpToggle = document.getElementById('arp-toggle');
    if (arpToggle) {
        arpToggle.textContent = store.getArpeggiatorEnabled() ? 'Вкл' : 'Выкл';
        arpToggle.addEventListener('click', () => {
            const newState = !store.getArpeggiatorEnabled();
            store.setArpeggiatorEnabled(newState);
            arpToggle.textContent = newState ? 'Вкл' : 'Выкл';
        });
    }
    
    // Настройка кнопок экспорта
    setupExportButtons();
    
    // Обработчик для кнопки показа/скрытия квартоквинтового круга
    const toggleCircleButton = document.getElementById('toggle-circle');
    if (toggleCircleButton) {
        toggleCircleButton.addEventListener('click', () => {
            const circleContainer = document.getElementById('tonality-circle-container');
            if (circleContainer) {
                const isVisible = circleContainer.style.display !== 'none';
                circleContainer.style.display = isVisible ? 'none' : 'block';
                toggleCircleButton.textContent = isVisible ? 'Показать круг тональностей' : 'Скрыть круг тональностей';
            }
        });
    }
}

// Настройка кнопок экспорта
function setupExportButtons() {
    // MIDI экспорт (текущая последовательность)
    const exportMidiButton = document.getElementById('export-midi');
    if (exportMidiButton) {
        exportMidiButton.addEventListener('click', () => {
            exportService.exportToMidi(false);
        });
    }
    
    // Text экспорт (текущая последовательность)
    const exportTextButton = document.getElementById('export-text');
    if (exportTextButton) {
        exportTextButton.addEventListener('click', () => {
            exportService.exportToText(false);
        });
    }
    
    // MIDI экспорт (полный трек)
    const exportTrackMidiButton = document.getElementById('export-track-midi');
    if (exportTrackMidiButton) {
        exportTrackMidiButton.addEventListener('click', () => {
            exportService.exportToMidi(true);
        });
    }
    
    // Text экспорт (полный трек)
    const exportTrackTextButton = document.getElementById('export-track-text');
    if (exportTrackTextButton) {
        exportTrackTextButton.addEventListener('click', () => {
            exportService.exportToText(true);
        });
    }
    
    // Экспорт проекта
    const exportProjectButton = document.getElementById('export-data');
    if (exportProjectButton) {
        exportProjectButton.addEventListener('click', () => {
            storageService.exportProjectToFile();
        });
    }
    
    // Импорт проекта
    const importProjectInput = document.getElementById('import-data');
    if (importProjectInput) {
        importProjectInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                storageService.importProjectFromFile(file)
                    .then(() => alert('Проект успешно импортирован'))
                    .catch(error => alert('Ошибка импорта проекта: ' + error.message));
            }
        });
    }
}

// Настройка глобальных обработчиков событий
function setupEventListeners() {
    // Сохранение данных перед закрытием страницы
    window.addEventListener('beforeunload', () => {
        storageService.saveData();
    });
    
    // Обработка нажатий клавиш
    document.addEventListener('keydown', (event) => {
        // Если фокус в полях ввода - не обрабатываем
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA' || 
            document.activeElement.tagName === 'SELECT') {
            return;
        }
        
        // Пробел - воспроизведение/остановка
        if (event.code === 'Space') {
            event.preventDefault();
            store.setIsPlaying(!store.getIsPlaying());
        }
        
        // Escape - остановка
        if (event.code === 'Escape') {
            store.setIsPlaying(false);
        }
    });
    
    // Запуск аудио контекста по первому взаимодействию
    const startAudio = async () => {
        try {
            await audioService.startAudioContext();
            // Удаляем обработчики после успешного запуска
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
            document.removeEventListener('touchstart', startAudio);
        } catch (error) {
            console.error('Ошибка запуска аудио контекста:', error);
        }
    };
    
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
    document.addEventListener('touchstart', startAudio);
    
    // Подписка на изменения в store
    store.subscribe((state, changedProp) => {
        // Обработка изменений состояния
        switch(changedProp) {
            case 'isPlaying':
                if (state.isPlaying) {
                    audioService.playSequence(state.sequence, true);
                } else {
                    audioService.stopAllSounds();
                }
                break;
        }
    });
}