/* ═══════════════ INIT & EVENT WIRING ═══════════════ */
function toggleFavorite(){
  const s = currentSong();
  if(!s){ showToast('No song selected', 'info'); return; }
  const i = state.favorites.indexOf(s.id);
  if(i >= 0){
    state.favorites.splice(i, 1);
    showToast('Removed from favorites', 'info');
  } else {
    state.favorites.push(s.id);
    showToast('Added to favorites', 'favorite');
    if(typeof burstParticles === 'function') burstParticles(favoriteBtn);
  }
  favoriteBtn.style.transform = 'scale(1.3)';
  setTimeout(() => { favoriteBtn.style.transform = ''; }, 200);
  updateFavoriteIcon();
  save();
  renderLeftPanel();
}

function setView(view){
  state.activeView = view;
  save();
  document.querySelectorAll('.nav-icon').forEach(el =>
    el.classList.toggle('active', el.dataset.view === view)
  );
  if(view === 'favorites'){
    if(!hasSongs()){ showToast('Import songs first', 'info'); return; }
    if(!state.favorites.length){ showToast('No favorites yet', 'info'); return; }
    const firstFavIdx = state.queue.findIndex(s => state.favorites.includes(s.id));
    if(firstFavIdx >= 0) loadAndPlay(firstFavIdx);
  } else if(view === 'library'){
    if(!hasSongs()){ showToast('Import songs first', 'info'); return; }
    loadAndPlay(0);
  } else if(view === 'recent'){
    if(!state.recentlyPlayed || !state.recentlyPlayed.length){ showToast('No recent songs', 'info'); return; }
    const idx = state.queue.findIndex(s => s.id == state.recentlyPlayed[0]);
    if(idx >= 0) loadAndPlay(idx);
  }
}

function wireEvents(){
  // Audio events
  audio.addEventListener('timeupdate', () => { updateProgress(); syncLyrics(); });
  audio.addEventListener('loadedmetadata', () => { updateProgress(); save(); });
  audio.addEventListener('ended', onEnded);
  
audio.addEventListener('play', () => {
  state.isPlaying = true;
  updatePlayIcons();
  initVisualizer();

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  if (currentSong() && typeof trackRecentlyPlayed === 'function') {
    trackRecentlyPlayed(currentSong().id);
  }

  renderQueue();
});

audio.addEventListener('pause', () => {
  state.isPlaying = false;
  updatePlayIcons();
  renderQueue();
});

  audio.addEventListener('error', () => { if(hasSongs()) showToast('Audio failed to load', 'error'); });

  // Playback
  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', () => nextTrack());
  prevBtn.addEventListener('click', prevTrack);

  // Shuffle / Repeat
  shuffleBtn.addEventListener('click', () => {
    state.isShuffle = !state.isShuffle;
    shuffleBtn.classList.toggle('active', state.isShuffle);
    showToast(state.isShuffle ? 'Shuffle on' : 'Shuffle off', 'info');
    save();
  });

  repeatBtn.addEventListener('click', () => {
    const modes = ['off', 'all', 'one'];
    state.repeatMode = modes[(modes.indexOf(state.repeatMode) + 1) % 3];
    repeatBtn.classList.toggle('active', state.repeatMode !== 'off');
    if(state.repeatMode === 'one'){
      repeatBtn.innerHTML = '<i class="fa-solid fa-repeat" style="position:relative"><span style="position:absolute;top:-2px;right:-4px;font-size:8px">1</span></i>';
    } else {
      repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    }
    showToast(`Repeat: ${state.repeatMode}`, 'info');
    save();
  });

  // Panels
  favoriteBtn.addEventListener('click', toggleFavorite);
  if(addToPlaylistBtn) addToPlaylistBtn.addEventListener('click', () => showAddToPlaylistPopup(addToPlaylistBtn));
  lyricsBtn.addEventListener('click', () => { rightPanel.classList.add('open'); document.querySelector('[data-tab="lyrics"]')?.click(); });
  queueBtn.addEventListener('click', () => { rightPanel.classList.add('open'); document.querySelector('[data-tab="queue"]')?.click(); });
  helpBtn.addEventListener('click', openHelp);

  // Mute
  muteBtn.addEventListener('click', () => {
    if(state.volume === 0 && !state.isMuted){ state.isMuted = false; state.volume = state.previousVolume || 0.7; }
    else { state.previousVolume = state.volume; state.isMuted = !state.isMuted; }
    applyVolume();
    save();
  });

  // Search & Nav
  searchInput.addEventListener('input', () => {
    searchClear.classList.toggle('visible', searchInput.value.length > 0);
    if(typeof doSearch === 'function') doSearch();
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.classList.remove('visible');
    searchResults.classList.remove('visible');
  });
  document.addEventListener('click', (e) => {
    if(!e.target.closest('.search-wrap')) searchResults.classList.remove('visible');
  });

  document.querySelectorAll('.nav-icon').forEach(n => {
    n.addEventListener('click', () => setView(n.dataset.view));
  });

  // Seek + volume
  setupSeek(progressBar, (ratio) => {
    if(audio.duration && isFinite(audio.duration)){ audio.currentTime = ratio * audio.duration; updateProgress(); }
  });
  setupSeek(volumeBar, (ratio) => {
    state.volume = ratio; if(state.volume > 0) state.isMuted = false;
    applyVolume(); save();
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
      state.activeTab = tab.dataset.tab;
      $('queuePane').classList.toggle('active', state.activeTab === 'queue');
      $('lyricsPane').classList.toggle('active', state.activeTab === 'lyrics');
      $('playlistsPane').classList.toggle('active', state.activeTab === 'playlists');
      if(state.activeTab === 'playlists') renderPlaylists();
    });
  });
  $('closeRightPanelBtn')?.addEventListener('click', () => rightPanel.classList.remove('open'));

  // Smart Controls
  $('eqBtn')?.addEventListener('click', () => { if(typeof openEqModal === 'function') openEqModal(); });
  $('speedBtn')?.addEventListener('click', () => { if(typeof cyclePlaybackSpeed === 'function') cyclePlaybackSpeed(); });
  $('timerBtn')?.addEventListener('click', () => { if(typeof openSleepTimerModal === 'function') openSleepTimerModal(); });
  $('userMenuBtn')?.addEventListener('click', () => { if(typeof openSettings === 'function') openSettings(); });

  // Mobile Navigation Tabs
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target === 'eq') {
        if(typeof openEqModal === 'function') openEqModal();
      } else {
        setMobileView(target);
      }
    });
  });

  // Mobile Mini Player
  const miniPlayer = $('mobileMiniPlayer');
  if (miniPlayer) {
    miniPlayer.addEventListener('click', (e) => {
      if (e.target.closest('#miniPlayBtn') || e.target.closest('#miniNextBtn')) return;
      setMobileView('player');
    });
  }
  $('miniPlayBtn')?.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
  $('miniNextBtn')?.addEventListener('click', (e) => { e.stopPropagation(); nextTrack(); });

  // Mobile Swipe Gestures on Hero/Vinyl
  setupMobileGestures(vinyl);
  setupMobileGestures(heroEl);

  // Import controls are registered centrally to avoid duplicate handlers.
  setupImportEvents();

  $('emptyDemoBtn')?.addEventListener('click', playDemoAudio);

  modalBackdrop.addEventListener('click', (e) => { if(e.target === modalBackdrop) closeModal(); });
  window.addEventListener('resize', debounce(() => drawVisualizer(!state.usingRealVis), 200));
}

function setMobileView(view) {
  state.mobileView = view;
  const appEl = document.querySelector('.app');
  if (appEl) {
    appEl.classList.remove('mobile-view-player', 'mobile-view-library', 'mobile-view-queue');
    appEl.classList.add(`mobile-view-${view}`);
  }
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === view);
  });
  if (view === 'player' && typeof drawVisualizer === 'function') {
    setTimeout(() => drawVisualizer(!state.usingRealVis), 60);
  }
  if (typeof updateMobileMiniPlayer === 'function') {
    updateMobileMiniPlayer();
  }
}

function setupMobileGestures(el) {
  if (!el) return;
  let startX = 0, startY = 0, startTime = 0;
  let lastTap = 0;

  el.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    }
  }, { passive: true });

  el.addEventListener('touchend', (e) => {
    if (e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    const dt = Date.now() - startTime;
    const now = Date.now();

    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) {
      if (now - lastTap < 320) {
        togglePlay();
        showSwipeFeedback(state.isPlaying ? 'fa-play' : 'fa-pause');
        lastTap = 0;
        return;
      }
      lastTap = now;
      return;
    }

    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 600) {
      if (dx < 0) {
        nextTrack();
        showSwipeFeedback('fa-forward-step');
      } else {
        prevTrack();
        showSwipeFeedback('fa-backward-step');
      }
    }
  }, { passive: true });
}

function showSwipeFeedback(iconClass) {
  const el = document.createElement('div');
  el.className = 'swipe-feedback-toast';
  el.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 550);
}

function playDemoAudio() {
  const sampleRate = 22050;
  const duration = 16;
  const numSamples = sampleRate * duration;
  const buffer = new Float32Array(numSamples);
  const chords = [
    [220, 261.63, 329.63, 392],
    [174.61, 220, 261.63, 329.63],
    [130.81, 164.81, 196.0, 246.94],
    [196.0, 246.94, 293.66, 349.23]
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor((t / 4) % 4);
    const chord = chords[chordIdx];
    let sample = 0;
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c];
      sample += Math.sin(2 * Math.PI * f * t) * 0.12;
      sample += Math.sin(2 * Math.PI * f * 2 * t) * 0.04;
    }
    const beat = t % 0.5;
    const kick = Math.sin(2 * Math.PI * 60 * Math.exp(-beat * 14) * beat) * Math.exp(-beat * 5) * 0.35;
    sample += kick;
    buffer[i] = Math.max(-1, Math.min(1, sample));
  }

  const wavBytes = new Uint8Array(44 + numSamples * 2);
  const view = new DataView(wavBytes.buffer);
  function writeString(v, off, str) {
    for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i));
  }
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  const demoUrl = URL.createObjectURL(blob);

  const demoSong = {
    id: 'demo-aurora',
    title: 'Aurora Flow (Live Visualizer Demo)',
    artist: 'Quantum Synthesis',
    duration: 16,
    format: 'WAV',
    isLocal: false,
    color: '#7c3aed',
    url: demoUrl,
    art: typeof makeCover === 'function' ? makeCover('Aurora Flow', '#7c3aed') : ''
  };

  state.queue.unshift(demoSong);
  state.currentIndex = 0;
  loadAndPlay(0);
  showToast('Playing Aurora 4-in-1 Visualizer Demo! 🎵', 'info');
}

async function init(){
  document.querySelectorAll('button').forEach(attachRipple);
  load();
  loadPlaylists();
  if(typeof loadRecentlyPlayed === 'function') loadRecentlyPlayed();

  // Restore the saved local audio library before rendering any library views.
  await restoreSongLibrary();
  if(state.queue.length){
    state.currentIndex = Math.min(Math.max(0, state.currentIndex), state.queue.length - 1);
  }else{
    state.currentIndex = 0;
  }

  applyVolume();
  updateEmptyState();
  renderQueue();
  renderLyrics();
  renderLeftPanel();
  if(hasSongs()) renderSong();
  updateFavoriteIcon();
  updatePlayIcons();
  wireEvents();

  document.querySelectorAll('.nav-icon').forEach(el => el.classList.toggle('active', el.dataset.view === state.activeView));
  document.querySelectorAll('.tab').forEach(el => {
    const active = el.dataset.tab === state.activeTab;
    el.classList.toggle('active', active);
    el.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.toggle('active', el.id === `${state.activeTab}Pane`));
  if(state.activeTab === 'playlists') renderPlaylists();
  shuffleBtn.classList.toggle('active', state.isShuffle);
  repeatBtn.classList.toggle('active', state.repeatMode !== 'off');
  if(state.repeatMode === 'one') repeatBtn.innerHTML = '<i class="fa-solid fa-repeat" style="position:relative"><span style="position:absolute;top:-2px;right:-4px;font-size:8px">1</span></i>';

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  if($('searchKbd')) $('searchKbd').textContent = isMac ? '⌘K' : 'Ctrl K';

  // Smart controls startup sync
  if($('speedBtn')) $('speedBtn').textContent = `${state.playbackRate || 1.0}x`;
  if($('timerBtn')) $('timerBtn').classList.toggle('active', Boolean(state.sleepTimerId));
  setMobileView(state.mobileView || 'player');

  setTimeout(() => drawVisualizer(true), 100);
  console.info(`Aurora ready — ${state.queue.length} local track(s) restored.`);
}

init().catch(error => {
  console.error('Aurora failed to initialize:', error);
  showToast('Aurora could not fully initialize. Check the browser console.', 'error');
});
