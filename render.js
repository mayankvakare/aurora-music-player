/* ═══════════════ RENDER ═══════════════ */
function hasSongs(){ return state.queue.length > 0; }
function currentSong(){ return state.queue[state.currentIndex] || null; }

function updateEmptyState(){
  const formatBadge = $('formatBadge');
  const sourceBadge = $('sourceBadge');
  if(libraryCount) libraryCount.textContent = String(state.queue.length);
  if(!hasSongs()){
    heroEl.classList.add('empty');
    document.title = 'Aurora — Premium Music Player';
    songTitle.textContent = '—';
    songArtist.textContent = '—';
    albumArt.removeAttribute('src');
    progressFill.style.width = '0%';
    progressThumb.style.left = '0%';
    currentTime.textContent = '0:00';
    totalTime.textContent = '0:00';
    if(formatBadge) formatBadge.textContent = 'AUDIO';
    if(sourceBadge) sourceBadge.textContent = 'Local file';
    queueList.innerHTML = '<div class="search-empty" style="padding:24px 12px"><i class="fa-solid fa-music" style="font-size:20px;opacity:.4;margin-bottom:6px;display:block"></i>Queue is empty<br><small style="font-size:11px;opacity:.7">Import songs to start</small></div>';
    lyricsList.innerHTML = '<div class="search-empty" style="padding:24px 12px"><i class="fa-solid fa-scroll" style="font-size:20px;opacity:.4;margin-bottom:6px;display:block"></i>No lyrics available</div>';
  } else {
    heroEl.classList.remove('empty');
  }
}

function renderSong(){
  const s = currentSong();
  if(!s){ updateEmptyState(); return; }
  updateEmptyState();
  albumArt.classList.add('swap-out');
  setTimeout(() => {
    albumArt.src = s.art;
    albumArt.alt = s.title;
    albumArt.onload = () => albumArt.classList.remove('swap-out');
    setTimeout(() => albumArt.classList.remove('swap-out'), 50);
  }, 200);
  songTitle.textContent = s.title;
  songArtist.textContent = s.artist || 'Unknown Artist';
  const formatBadge = $('formatBadge');
  const sourceBadge = $('sourceBadge');
  if(formatBadge){
    formatBadge.textContent = (s.format || (s.fileName || '').split('.').pop() || 'AUDIO').toUpperCase();
    formatBadge.title = `Audio format: ${formatBadge.textContent}`;
  }
  if(sourceBadge) sourceBadge.textContent = s.isLocal ? 'Local file' : 'Library';
  albumGlow.style.background = s.color;
  applyDynamicTheme(s.color || '#a78bfa');
  document.title = `${s.title} — ${s.artist} | Aurora`;
  updateFavoriteIcon();
  renderLyrics();
  renderQueue();
  renderLeftPanel();
  updateMobileMiniPlayer();
  updateMediaSession();
  save();
}

function applyDynamicTheme(colorHex) {
  if (!colorHex || typeof colorHex !== 'string') return;
  try {
    const root = document.documentElement;
    root.style.setProperty('--accent', colorHex);
    root.style.setProperty('--accent-glow', `${colorHex}88`);
    const blob1 = document.querySelector('.blob-1');
    const blob2 = document.querySelector('.blob-2');
    if (blob1) blob1.style.background = `radial-gradient(circle, ${colorHex}, #2e1065)`;
    if (blob2) blob2.style.background = `radial-gradient(circle, #db2777, ${colorHex})`;
  } catch(e) {}
}

function updateMobileMiniPlayer() {
  const mini = $('mobileMiniPlayer');
  if (!mini) return;
  const s = currentSong();
  const titleEl = $('miniSongTitle');
  const artistEl = $('miniSongArtist');
  const playBtn = $('miniPlayBtn');
  if (!s) {
    if (titleEl) titleEl.textContent = 'No track playing';
    if (artistEl) artistEl.textContent = 'Select a song to start';
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    return;
  }
  if (titleEl) titleEl.textContent = s.title;
  if (artistEl) artistEl.textContent = s.artist || 'Unknown Artist';
  if (playBtn) {
    playBtn.innerHTML = state.isPlaying
      ? '<i class="fa-solid fa-pause"></i>'
      : '<i class="fa-solid fa-play"></i>';
  }
}

function renderQueue(){
  if(libraryCount) libraryCount.textContent = String(state.queue.length);
  queueList.innerHTML = '';
  if(!state.queue.length){
    queueList.innerHTML = '<div class="search-empty" style="padding:24px 12px"><i class="fa-solid fa-music" style="font-size:20px;opacity:.4;margin-bottom:6px;display:block"></i>Queue is empty<br><small style="font-size:11px;opacity:.7">Import songs to start</small></div>';
    return;
  }
  state.queue.forEach((song, i) => {
    const item = document.createElement('div');
    item.className = 'queue-item' +
      (i === state.currentIndex ? ' active' : '') +
      (state.isPlaying && i === state.currentIndex ? ' playing' : '');
    item.draggable = true;
    item.dataset.index = i;
    const isActive = i === state.currentIndex;
    item.innerHTML = `
      <div class="queue-idx">${isActive && state.isPlaying ? '<div class="eq"><span></span><span></span><span></span></div>' : (i+1)}</div>
      <img src="${song.art}" alt="" loading="lazy">
      <div class="queue-info"><div class="queue-title">${escapeHtml(song.title)}</div><div class="queue-artist">${escapeHtml(song.artist)}</div></div>
      <i class="fa-solid fa-grip-vertical drag-handle"></i>
    `;
    item.addEventListener('click', (e) => {
      if(e.target.closest('.drag-handle')) return;
      playSongAt(i);
    });
    item.addEventListener('dragstart', (e) => {
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', i);
    });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
    item.addEventListener('dragover', (e) => e.preventDefault());
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      const from = +e.dataTransfer.getData('text/plain');
      const to = i;
      if(from === to) return;
      const moved = state.queue.splice(from, 1)[0];
      state.queue.splice(to, 0, moved);
      if(state.currentIndex === from) state.currentIndex = to;
      else if(from < state.currentIndex && to >= state.currentIndex) state.currentIndex--;
      else if(from > state.currentIndex && to <= state.currentIndex) state.currentIndex++;
      renderQueue();
      renderLeftPanel();
      showToast('Queue reordered', 'info');
      save();
    });
    queueList.appendChild(item);
  });
}

function renderLyrics(){
  const s = currentSong();
  if(!s){
    lyricsList.innerHTML = '<div class="search-empty" style="padding:24px 12px"><i class="fa-solid fa-scroll" style="font-size:20px;opacity:.4;margin-bottom:6px;display:block"></i>No lyrics available</div>';
    return;
  }
  const lines = (typeof LYRICS !== 'undefined' && LYRICS[s.id]) ? LYRICS[s.id] : ['♪ Instrumental ♪'];
  lyricsList.innerHTML = lines.map((l, i) => `<div class="lyrics-line" data-i="${i}">${escapeHtml(l)}</div>`).join('');
}

function updateFavoriteIcon(){
  const s = currentSong();
  if(!s){ favoriteBtn.innerHTML = '<i class="fa-regular fa-heart"></i>'; return; }
  const isFav = state.favorites.includes(s.id);
  favoriteBtn.innerHTML = `<i class="fa-${isFav ? 'solid' : 'regular'} fa-heart" style="color:${isFav ? '#ec4899' : ''}"></i>`;
}

function updatePlayIcons(){
  const icon = state.isPlaying ? 'fa-pause' : 'fa-play';
  playBtn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
  if(state.isPlaying) vinyl.classList.add('playing'); else vinyl.classList.remove('playing');
  document.querySelectorAll('.queue-item').forEach((el, i) =>
    el.classList.toggle('playing', state.isPlaying && i === state.currentIndex)
  );
}

function updateMediaSession(){
  if(!('mediaSession' in navigator)) return;
  const s = currentSong();
  if(!s) return;
  try{
    navigator.mediaSession.metadata = new MediaMetadata({
      title: s.title, artist: s.artist, album: 'Aurora',
      artwork: [{ src: s.art, sizes: '400x400', type: 'image/svg+xml' }]
    });
  }catch(e){}
}

function syncLyrics(){
  if(state.activeTab !== 'lyrics' || !audio.duration || !isFinite(audio.duration)) return;
  const lines = lyricsList.querySelectorAll('.lyrics-line');
  if(!lines.length) return;
  const idx = Math.floor((audio.currentTime / audio.duration) * lines.length);
  lines.forEach((l, i) => l.classList.toggle('active', i === idx));
  const active = lines[Math.min(idx, lines.length - 1)];
  if(active) active.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* ═══════════════ LEFT PANEL RENDERING ═══════════════ */
function renderLeftPanel(){
  if(libraryCount) libraryCount.textContent = state.queue.length;

  if(leftPlaylists){
    let plHtml = `
      <div class="left-playlist-item" onclick="renderLikedSongsDetail(); rightPanel.classList.add('open'); document.querySelector('[data-tab=\\'playlists\\']').click();">
        <div class="left-playlist-cover liked"><i class="fa-solid fa-heart"></i></div>
        <div class="left-playlist-info"><div class="left-playlist-name">Liked Songs</div></div>
      </div>
    `;
    state.playlists.slice(0, 3).forEach(pl => {
      plHtml += `
        <div class="left-playlist-item" onclick="openPlaylistFromLeft('${pl.id}')">
          <div class="left-playlist-cover">${escapeHtml(pl.name.charAt(0).toUpperCase())}</div>
          <div class="left-playlist-info"><div class="left-playlist-name">${escapeHtml(pl.name)}</div></div>
        </div>
      `;
    });
    leftPlaylists.innerHTML = plHtml;
  }

  if(!libraryList) return;
  if(!state.queue.length){
    libraryList.innerHTML = `<div class="playlist-empty" style="padding:20px 0"><i class="fa-solid fa-music"></i>No songs yet</div>`;
    return;
  }

  libraryList.innerHTML = state.queue.map((song, i) => {
    const isActive = i === state.currentIndex;
    return `
      <div class="library-item ${isActive ? 'active' : ''}" onclick="playSongAt(${i})">
        <img src="${song.art}" alt="">
        <div class="library-info">
          <div class="library-title" style="${isActive ? 'color:var(--accent)' : ''}">${escapeHtml(song.title)}</div>
          <div class="library-artist">${escapeHtml(song.artist)}</div>
        </div>
      </div>
    `;
  }).join('');
}

window.openPlaylistFromLeft = function(plId){
  rightPanel.classList.add('open');
  document.querySelector('[data-tab="playlists"]').click();
  setTimeout(() => renderPlaylistDetail(plId), 50);
};