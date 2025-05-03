// js/core/store.js
class Store {
  constructor() {
      // Начальное состояние приложения
      this.state = {
          currentTonality: 'C',
          currentChord: 'C',
          sequence: [],
          trackStructure: [],
          currentBlockIndex: 0,
          isPlaying: false,
          arpeggiatorEnabled: false,
          metronomeEnabled: false,
          tempo: 120
      };
      
      // Подписчики на изменения состояния
      this.subscribers = [];
      
      // Загрузка сохраненного состояния из localStorage
      this.loadSavedState();
  }
  
  // Подписка на изменения состояния
  subscribe(callback, watchProps = null) {
      const subscriber = { callback, watchProps };
      this.subscribers.push(subscriber);
      
      // Возвращаем функцию отписки
      return () => {
          const index = this.subscribers.indexOf(subscriber);
          if (index !== -1) {
              this.subscribers.splice(index, 1);
          }
      };
  }
  
  // Уведомление подписчиков об изменениях
  notifySubscribers(changedProp) {
      this.subscribers.forEach(subscriber => {
          // Если подписчик следит за определенными свойствами, проверяем, есть ли изменившееся свойство в списке
          if (subscriber.watchProps && !subscriber.watchProps.includes(changedProp)) {
              return;
          }
          
          // Вызываем подписчика с текущим состоянием и именем измененного свойства
          try {
              subscriber.callback(this.state, changedProp);
          } catch (error) {
              console.error(`Ошибка в подписчике при изменении свойства '${changedProp}':`, error);
          }
      });
      
      // Сохраняем состояние в localStorage
      this.saveState();
  }
  
  // Обновление состояния и уведомление подписчиков
  setState(changes) {
      const changedProps = Object.keys(changes);
      
      // Обновляем состояние
      changedProps.forEach(prop => {
          if (this.state.hasOwnProperty(prop)) {
              this.state[prop] = changes[prop];
          }
      });
      
      // Уведомляем подписчиков для каждого измененного свойства
      changedProps.forEach(prop => {
          this.notifySubscribers(prop);
      });
  }
  
  // Сохранение состояния в localStorage
  saveState() {
      try {
          // Сохраняем только определенные части состояния
          const savedState = {
              currentTonality: this.state.currentTonality,
              trackStructure: this.state.trackStructure,
              tempo: this.state.tempo,
              arpeggiatorEnabled: this.state.arpeggiatorEnabled,
              metronomeEnabled: this.state.metronomeEnabled
          };
          
          localStorage.setItem('chordPlayerState', JSON.stringify(savedState));
      } catch (error) {
          console.error('Ошибка сохранения состояния в localStorage:', error);
      }
  }
  
  // Загрузка сохраненного состояния из localStorage
  loadSavedState() {
      try {
          const savedState = localStorage.getItem('chordPlayerState');
          
          if (savedState) {
              const parsedState = JSON.parse(savedState);
              
              // Объединяем сохраненное состояние с текущим
              this.state = {
                  ...this.state,
                  ...parsedState
              };
              
              console.log('Загружено сохраненное состояние из localStorage');
          }
      } catch (error) {
          console.error('Ошибка загрузки состояния из localStorage:', error);
      }
  }
  
  // Геттеры для состояния
  getCurrentTonality() { return this.state.currentTonality; }
  getCurrentChord() { return this.state.currentChord; }
  getSequence() { return [...this.state.sequence]; }
  getTrackStructure() { return JSON.parse(JSON.stringify(this.state.trackStructure)); }
  getCurrentBlockIndex() { return this.state.currentBlockIndex; }
  getIsPlaying() { return this.state.isPlaying; }
  getArpeggiatorEnabled() { return this.state.arpeggiatorEnabled; }
  getMetronomeEnabled() { return this.state.metronomeEnabled; }
  getTempo() { return this.state.tempo; }
  
  // Сеттеры для состояния
  setCurrentTonality(tonality) {
      if (!tonality) return;
      this.setState({ currentTonality: tonality });
  }
  
  setCurrentChord(chord) {
      if (!chord) return;
      this.setState({ currentChord: chord });
  }
  
  setSequence(sequence) {
      if (!Array.isArray(sequence)) {
          console.warn('setSequence вызван с не-массивом:', sequence);
          sequence = [];
      }
      this.setState({ sequence: [...sequence] });
  }
  
  addChordToSequence(chord) {
      if (!chord) return;
      
      // Получаем текущую последовательность
      const currentSequence = [...this.state.sequence];
      
      // Добавляем аккорд
      const newSequence = [...currentSequence, chord];
      
      this.setState({ sequence: newSequence });
  }
  
  removeChordFromSequence(index) {
      // Получаем текущую последовательность
      const currentSequence = [...this.state.sequence];
      
      // Проверяем корректность индекса
      if (index < 0 || index >= currentSequence.length) {
          console.warn('removeChordFromSequence вызван с некорректным индексом:', index);
          return;
      }
      
      // Удаляем аккорд
      const newSequence = [...currentSequence];
      newSequence.splice(index, 1);
      
      this.setState({ sequence: newSequence });
  }
  
  clearSequence() {
      this.setState({ sequence: [] });
  }
  
  setTrackStructure(structure) {
      if (!Array.isArray(structure)) {
          console.warn('setTrackStructure вызван с не-массивом:', structure);
          structure = [];
      }
      
      this.setState({ trackStructure: JSON.parse(JSON.stringify(structure)) });
  }
  
  setCurrentBlockIndex(index) {
      const trackStructure = this.state.trackStructure;
      if (!Array.isArray(trackStructure) || index < 0 || index >= trackStructure.length) {
          console.warn('setCurrentBlockIndex вызван с некорректным индексом:', index);
          return;
      }
      
      this.setState({ currentBlockIndex: index });
  }
  
  setIsPlaying(isPlaying) {
      this.setState({ isPlaying: !!isPlaying });
  }
  
  setArpeggiatorEnabled(enabled) {
      this.setState({ arpeggiatorEnabled: !!enabled });
  }
  
  setMetronomeEnabled(enabled) {
      this.setState({ metronomeEnabled: !!enabled });
  }
  
  setTempo(tempo) {
      if (typeof tempo !== 'number' || tempo < 40 || tempo > 240) {
          console.warn('setTempo вызван с некорректным значением:', tempo);
          return;
      }
      
      this.setState({ tempo: tempo });
  }
}

// Создаем и экспортируем синглтон объект store
const store = new Store();
export default store;