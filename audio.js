/* ═══════════════ SMART AUDIO ENGINE & EQUALIZER ═══════════════ */
let bassFilter = null;
let midFilter = null;
let trebleFilter = null;

const EQ_PRESETS = {
  flat:       { bass: 0,  mid: 0,  treble: 0,  name: 'Flat / Studio' },
  bass_boost: { bass: 9,  mid: -1, treble: 2,  name: 'Bass Boost 🔊' },
  vocal:      { bass: -3, mid: 7,  treble: 3,  name: 'Vocal Clarity 🎤' },
  electronic: { bass: 7,  mid: 2,  treble: 6,  name: 'Electronic / EDM ⚡' },
  lofi:       { bass: 5,  mid: 1,  treble: -8, name: 'Lo-Fi Chill ☕' },
  spatial:    { bass: 4,  mid: 1,  treble: 5,  name: '3D Spatial Audio 🌌' }
};

function setupAudioFilters(source, ctx) {
  if (!ctx) return source;
  try {
    bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 140;

    midFilter = ctx.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1600;
    midFilter.Q.value = 1.0;

    trebleFilter = ctx.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 7500;

    source.connect(bassFilter);
    bassFilter.connect(midFilter);
    midFilter.connect(trebleFilter);

    applyEqPreset(state.eqPreset || 'flat', false);
    return trebleFilter;
  } catch(e) {
    console.warn('Audio filter setup fallback:', e);
    return source;
  }
}

function applyEqPreset(presetKey, notify = true) {
  const p = EQ_PRESETS[presetKey] || EQ_PRESETS.flat;
  state.eqPreset = presetKey;
  if (bassFilter && midFilter && trebleFilter && audioCtx) {
    const t = audioCtx.currentTime;
    bassFilter.gain.setTargetAtTime(p.bass, t, 0.05);
    midFilter.gain.setTargetAtTime(p.mid, t, 0.05);
    trebleFilter.gain.setTargetAtTime(p.treble, t, 0.05);
  }
  if (notify && typeof showToast === 'function') {
    showToast(`Smart EQ: ${p.name}`, 'info');
  }
  save();
}

function setCustomEq(bass, mid, treble) {
  if (bassFilter && midFilter && trebleFilter && audioCtx) {
    const t = audioCtx.currentTime;
    bassFilter.gain.setTargetAtTime(bass, t, 0.05);
    midFilter.gain.setTargetAtTime(mid, t, 0.05);
    trebleFilter.gain.setTargetAtTime(treble, t, 0.05);
  }
}

const PLAYBACK_SPEEDS = [1.0, 1.25, 1.5, 2.0, 0.75];
function cyclePlaybackSpeed() {
  const cur = state.playbackRate || 1.0;
  const idx = PLAYBACK_SPEEDS.indexOf(cur);
  const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
  state.playbackRate = next;
  audio.playbackRate = next;
  const speedBtn = $('speedBtn');
  if (speedBtn) speedBtn.textContent = `${next}x`;
  showToast(`Playback Speed: ${next}x`, 'info');
  save();
}

function setSmartSleepTimer(minutes) {
  if (state.sleepTimerId) {
    clearTimeout(state.sleepTimerId);
    state.sleepTimerId = null;
  }
  if (state.sleepFadeInterval) {
    clearInterval(state.sleepFadeInterval);
    state.sleepFadeInterval = null;
  }
  const timerBtn = $('timerBtn');
  if (minutes === 0) {
    showToast('Sleep timer turned off', 'info');
    if (timerBtn) timerBtn.classList.remove('active');
    return;
  }
  showToast(`🌙 Sleep timer set: ${minutes} min (auto fade-out)`, 'success');
  if (timerBtn) timerBtn.classList.add('active');

  const totalMs = minutes * 60 * 1000;
  const fadeMs = Math.min(25000, totalMs * 0.25);
  const fadeStart = Math.max(0, totalMs - fadeMs);

  state.sleepTimerId = setTimeout(() => {
    const startVol = state.volume;
    const startT = Date.now();
    state.sleepFadeInterval = setInterval(() => {
      const elapsed = Date.now() - startT;
      const prog = Math.min(1, elapsed / fadeMs);
      audio.volume = Math.max(0, startVol * (1 - prog));
      if (prog >= 1) {
        clearInterval(state.sleepFadeInterval);
        state.sleepFadeInterval = null;
        audio.pause();
        state.isPlaying = false;
        audio.volume = startVol;
        updatePlayIcons();
        if (timerBtn) timerBtn.classList.remove('active');
        showToast('💤 Sleep timer complete. Audio paused.', 'info');
      }
    }, 300);
  }, fadeStart);
}

function loadAndPlay(index){
  if(!hasSongs()){ showToast('Import songs first', 'info'); return; }
  state.currentIndex = Math.max(0, Math.min(index, state.queue.length - 1));
  const s = currentSong();
  if(!s) return;
  audio.src = s.url;
  audio.load();
  audio.playbackRate = state.playbackRate || 1.0;
  renderSong();
  audio.play().then(() => {
    state.isPlaying = true;
    updatePlayIcons();
    initVisualizer();
  }).catch(() => {
    showToast('Tap play to start audio', 'info');
    state.isPlaying = false;
    updatePlayIcons();
  });
  save();
}

function playSongAt(index){
  if(index === state.currentIndex && !audio.paused){ audio.pause(); return; }
  loadAndPlay(index);
}

function togglePlay(){
  if(!hasSongs()){
    showToast('Import songs first', 'info');
    fileInput.click();
    return;
  }
  if(!audio.getAttribute('src')){ loadAndPlay(state.currentIndex); return; }
  if(audio.paused){
    audio.play().then(() => {
      state.isPlaying = true; updatePlayIcons(); initVisualizer();
    }).catch(() => showToast('Unable to play audio', 'error'));
  } else {
    audio.pause();
    state.isPlaying = false;
    updatePlayIcons();
  }
}

function nextTrack(auto=false){
  if(!hasSongs()) return;
  let next;
  if(state.isShuffle){
    do { next = Math.floor(Math.random() * state.queue.length); }
    while(next === state.currentIndex && state.queue.length > 1);
  } else {
    next = (state.currentIndex + 1) % state.queue.length;
  }
  if(auto && state.repeatMode === 'one'){ audio.currentTime = 0; audio.play(); return; }
  loadAndPlay(next);
}

function prevTrack(){
  if(!hasSongs()) return;
  if(audio.currentTime > 3){ audio.currentTime = 0; return; }
  let prev;
  if(state.isShuffle){
    do { prev = Math.floor(Math.random() * state.queue.length); }
    while(prev === state.currentIndex && state.queue.length > 1);
  } else {
    prev = (state.currentIndex - 1 + state.queue.length) % state.queue.length;
  }
  loadAndPlay(prev);
}

function onEnded(){
  if(!hasSongs()) return;
  if(state.repeatMode === 'one'){
    audio.currentTime = 0;
    audio.play().catch(() => { state.isPlaying = false; updatePlayIcons(); });
    return;
  }
  if(state.repeatMode === 'off' && !state.isShuffle && state.currentIndex === state.queue.length - 1){
    state.isPlaying = false;
    updatePlayIcons();
    return;
  }
  nextTrack(true);
}

function updateProgress(){
  if(!audio.duration || !isFinite(audio.duration)) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = pct + '%';
  progressThumb.style.left = pct + '%';
  currentTime.textContent = fmtTime(audio.currentTime);
  totalTime.textContent = fmtTime(audio.duration);
  if(typeof updateMobileMiniPlayer === 'function') updateMobileMiniPlayer();
}

function setupSeek(bar, onSeek){
  let dragging = false;
  const seek = (e) => {
    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(x);
  };
  bar.addEventListener('pointerdown', (e) => {
    dragging = true;
    bar.classList.add('dragging');
    bar.setPointerCapture(e.pointerId);
    seek(e);
  });
  bar.addEventListener('pointermove', (e) => { if(dragging) seek(e); });
  bar.addEventListener('pointerup', () => { dragging = false; bar.classList.remove('dragging'); });
  bar.addEventListener('pointercancel', () => { dragging = false; bar.classList.remove('dragging'); });
}

function applyVolume(){
  audio.volume = state.isMuted ? 0 : state.volume;
  volumeFill.style.width = (state.isMuted ? 0 : state.volume * 100) + '%';
  volumeThumb.style.left = (state.isMuted ? 0 : state.volume * 100) + '%';
  const icon = state.isMuted || state.volume === 0
    ? 'fa-volume-xmark'
    : state.volume < .4 ? 'fa-volume-low' : 'fa-volume-high';
  muteBtn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
}