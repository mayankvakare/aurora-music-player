/* ═══════════════ PERSISTENCE ═══════════════
   Small settings stay in localStorage. Audio files are stored as Blobs
   in IndexedDB so they can survive a page refresh without localStorage limits.
================================================ */
const AURORA_DB_NAME = 'aurora_music_library';
const AURORA_DB_VERSION = 1;

function save(){
  try{
    localStorage.setItem('aurora_state', JSON.stringify({
      currentIndex: state.currentIndex,
      favorites: state.favorites,
      volume: state.volume,
      previousVolume: state.previousVolume,
      isMuted: state.isMuted,
      isShuffle: state.isShuffle,
      repeatMode: state.repeatMode,
      crossfade: state.crossfade,
      activeView: state.activeView,
      activeTab: state.activeTab
    }));
  }catch(e){ console.warn('Aurora settings could not be saved:', e); }
}

function load(){
  try{
    const s = JSON.parse(localStorage.getItem('aurora_state') || '{}');
    if(Number.isInteger(s.currentIndex) && s.currentIndex >= 0) state.currentIndex = s.currentIndex;
    if(Array.isArray(s.favorites)) state.favorites = s.favorites;
    if(Number.isFinite(s.volume)) state.volume = Math.max(0, Math.min(1, s.volume));
    if(Number.isFinite(s.previousVolume)) state.previousVolume = Math.max(0, Math.min(1, s.previousVolume));
    if(typeof s.isMuted === 'boolean') state.isMuted = s.isMuted;
    if(typeof s.isShuffle === 'boolean') state.isShuffle = s.isShuffle;
    if(['off','all','one'].includes(s.repeatMode)) state.repeatMode = s.repeatMode;
    if(typeof s.crossfade === 'boolean') state.crossfade = s.crossfade;
    if(['home','library','favorites','recent'].includes(s.activeView)) state.activeView = s.activeView;
    if(['queue','lyrics','playlists'].includes(s.activeTab)) state.activeTab = s.activeTab;
  }catch(e){ console.warn('Aurora settings could not be loaded:', e); }
}

function openAuroraDB(){
  return new Promise((resolve, reject) => {
    if(!('indexedDB' in window)){
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }
    const request = indexedDB.open(AURORA_DB_NAME, AURORA_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if(!db.objectStoreNames.contains('songs')) db.createObjectStore('songs', { keyPath: 'id' });
      if(!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open music library storage.'));
    request.onblocked = () => reject(new Error('Music library storage is blocked by another tab.'));
  });
}

function idbRequest(request){
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Library database request failed.'));
  });
}

/* Persist the complete order and any local audio blobs in one transaction. */
async function saveLibraryToDB(){
  const db = await openAuroraDB();
  try{
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['songs','meta'], 'readwrite');
      const songsStore = tx.objectStore('songs');
      const metaStore = tx.objectStore('meta');
      const localSongs = state.queue.filter(song => song && song.isLocal && (song.fileBlob instanceof Blob || song.blob instanceof Blob));
      const liveIds = new Set(localSongs.map(song => song.id));
      const existingKeysRequest = songsStore.getAllKeys();
      // Keep IndexedDB aligned with the current queue; stale records must not
      // unexpectedly reappear when a saved library is restored later.
      existingKeysRequest.onsuccess = () => {
        existingKeysRequest.result.forEach(id => {
          if(!liveIds.has(id)) songsStore.delete(id);
        });
      };
      localSongs.forEach(song => {
        songsStore.put({
          id: song.id,
          title: song.title,
          artist: song.artist || 'Local File',
          art: song.art,
          color: song.color || '#7c3aed',
          format: song.format || '',
          isLocal: true,
          fileName: song.fileName || `${song.title || 'audio'}.${(song.format || 'audio').toLowerCase()}`,
          fileSize: song.fileSize || (song.fileBlob || song.blob).size || 0,
          importedAt: song.importedAt || Date.now(),
          blob: song.fileBlob || song.blob
        });
      });
      metaStore.put({ key: 'queueOrder', ids: state.queue.map(song => song.id) });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Could not save your songs.'));
      tx.onabort = () => reject(tx.error || new Error('Saving your songs was cancelled.'));
    });
  }finally{
    db.close();
  }
}

/* Restore saved songs with fresh object URLs; object URLs cannot survive reloads. */
async function restoreSongLibrary(){
  let db;
  try{
    db = await openAuroraDB();
    const records = await idbRequest(db.transaction('songs', 'readonly').objectStore('songs').getAll());
    const orderRecord = await idbRequest(db.transaction('meta', 'readonly').objectStore('meta').get('queueOrder'));
    if(!Array.isArray(records) || !records.length) return;

    const byId = new Map(records.filter(record => record && record.blob instanceof Blob).map(record => [record.id, record]));
    const orderedIds = Array.isArray(orderRecord?.ids) ? orderRecord.ids : records.map(record => record.id);
    const restored = [];
    orderedIds.forEach(id => {
      const record = byId.get(id);
      if(!record) return;
      restored.push({
        id: record.id,
        title: record.title || 'Unknown Track',
        artist: record.artist || 'Local File',
        art: record.art || '',
        color: record.color || '#7c3aed',
        format: record.format || '',
        isLocal: true,
        fileName: record.fileName || record.title || 'audio',
        fileSize: record.fileSize || record.blob.size || 0,
        importedAt: record.importedAt || Date.now(),
        fileBlob: record.blob,
        url: URL.createObjectURL(record.blob)
      });
      byId.delete(id);
    });
    // Recover records that might not exist in a queue-order entry from an older session.
    byId.forEach(record => {
      restored.push({
        id: record.id,
        title: record.title || 'Unknown Track',
        artist: record.artist || 'Local File',
        art: record.art || '',
        color: record.color || '#7c3aed',
        format: record.format || '',
        isLocal: true,
        fileName: record.fileName || record.title || 'audio',
        fileSize: record.fileSize || record.blob.size || 0,
        importedAt: record.importedAt || Date.now(),
        fileBlob: record.blob,
        url: URL.createObjectURL(record.blob)
      });
    });
    if(restored.length){
      state.queue = restored;
      state.currentIndex = Math.min(Math.max(0, state.currentIndex), restored.length - 1);
    }
  }catch(e){
    // The player still works for the current session when storage is unavailable.
    console.warn('Aurora could not restore its local song library:', e);
  }finally{
    if(db) db.close();
  }
}

function savePlaylists(){
  try{ localStorage.setItem('aurora_playlists', JSON.stringify(state.playlists)); }
  catch(e){ console.warn('Aurora playlists could not be saved:', e); }
}

function loadPlaylists(){
  try{
    const p = JSON.parse(localStorage.getItem('aurora_playlists') || '[]');
    if(Array.isArray(p)) state.playlists = p.filter(pl => pl && typeof pl.id === 'string' && typeof pl.name === 'string' && Array.isArray(pl.songIds));
  }catch(e){ state.playlists = []; }
}
