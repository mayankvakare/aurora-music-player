/* ═══════════════ PLAYLISTS ═══════════════ */
function createPlaylist(name){
  if(!name || !name.trim()) return null;
  const pl = {
    id: 'pl_' + Date.now() + Math.random().toString(36).slice(2, 6),
    name: name.trim(),
    songIds: [],
    createdAt: Date.now()
  };
  state.playlists.unshift(pl);
  savePlaylists();
  renderPlaylists();
  showToast(`Playlist "${pl.name}" created`, 'success');
  return pl;
}

function deletePlaylist(id){
  const idx = state.playlists.findIndex(p => p.id === id);
  if(idx < 0) return;
  const name = state.playlists[idx].name;
  state.playlists.splice(idx, 1);
  savePlaylists();
  renderPlaylists();
  showToast(`Playlist "${name}" deleted`, 'info');
}

function renamePlaylist(id, newName){
  const pl = state.playlists.find(p => p.id === id);
  if(!pl || !newName || !newName.trim()) return;
  pl.name = newName.trim();
  savePlaylists();
  renderPlaylists();
  showToast('Playlist renamed', 'success');
}

function addSongToPlaylist(plId, songId){
  const pl = state.playlists.find(p => p.id === plId);
  if(!pl) return;
  if(pl.songIds.includes(songId)){ showToast('Already in playlist', 'info'); return; }
  pl.songIds.push(songId);
  savePlaylists();
  renderPlaylists();
  if(state.activePlaylistId === plId) renderPlaylistDetail(plId);
  showToast(`Added to "${pl.name}"`, 'success');
}

function removeSongFromPlaylist(plId, songId){
  const pl = state.playlists.find(p => p.id === plId);
  if(!pl) return;
  pl.songIds = pl.songIds.filter(id => id != songId);
  savePlaylists();
  if(state.activePlaylistId === plId) renderPlaylistDetail(plId);
  renderPlaylists();
}

function playPlaylist(id){
  const pl = state.playlists.find(p => p.id === id);
  if(!pl || !pl.songIds.length){ showToast('Playlist is empty', 'info'); return; }
  const firstIdx = state.queue.findIndex(s => s.id == pl.songIds[0]);
  if(firstIdx < 0){ showToast('Song unavailable (reimport needed)', 'error'); return; }
  loadAndPlay(firstIdx);
  showToast(`Playing: ${pl.name}`, 'success');
}

function renderPlaylists(){
  // ✨ NEW — Refresh sidebar playlists list
    if(typeof renderLeftPanel === 'function') renderLeftPanel();

  const list = $('playlistsList');
  const detail = $('playlistDetail');
  if(!list) return;
  list.style.display = 'block';
  detail.classList.remove('active');
  state.activePlaylistId = null;
  list.innerHTML = `
    <div class="playlists-header"><div class="playlists-header-title">Your Playlists</div></div>
    <button class="playlist-add-btn" id="newPlaylistBtn"><i class="fa-solid fa-plus"></i> New Playlist</button>
    <div id="playlistsItems"></div>
  `;
  const itemsEl = $('playlistsItems');
  if(!state.playlists.length){
    itemsEl.innerHTML = `<div class="playlist-empty"><i class="fa-solid fa-folder-open"></i>No playlists yet<br><small style="opacity:.7">Create one to organize your songs</small></div>`;
  } else {
    itemsEl.innerHTML = state.playlists.map(pl => `
      <div class="playlist-item" data-id="${pl.id}">
        <div class="playlist-cover">${escapeHtml(pl.name.charAt(0).toUpperCase())}</div>
        <div class="playlist-item-info">
          <div class="playlist-item-name">${escapeHtml(pl.name)}</div>
          <div class="playlist-item-count">${pl.songIds.length} song${pl.songIds.length !== 1 ? 's' : ''}</div>
        </div>
        <button class="playlist-item-menu" data-menu="${pl.id}" aria-label="Options"><i class="fa-solid fa-ellipsis"></i></button>
      </div>
    `).join('');
    itemsEl.querySelectorAll('.playlist-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if(e.target.closest('.playlist-item-menu')) return;
        renderPlaylistDetail(item.dataset.id);
      });
    });
    itemsEl.querySelectorAll('.playlist-item-menu').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = btn.getBoundingClientRect();
        showPlaylistMenu(rect.left, rect.bottom + 4, btn.dataset.menu);
      });
    });
  }
  $('newPlaylistBtn').addEventListener('click', () =>
    promptPlaylistName('New Playlist', '', (name) => createPlaylist(name))
  );
}

function renderPlaylistDetail(plId){
  // ✨ NEW — Special case: Liked Songs
  if(plId === '__liked__'){ renderLikedSongsDetail(); return; }

  const pl = state.playlists.find(p => p.id === plId);
  if(!pl) return;
  state.activePlaylistId = plId;
  $('playlistsList').style.display = 'none';
  const detail = $('playlistDetail');
  detail.classList.add('active');
  const songs = pl.songIds.map(id => state.queue.find(s => s.id == id)).filter(Boolean);
  const missing = pl.songIds.length - songs.length;
  detail.innerHTML = `
    <div class="playlist-detail-header">
      <button class="playlists-header-btn" id="playlistBack" aria-label="Back"><i class="fa-solid fa-arrow-left"></i></button>
      <div class="playlist-detail-title">${escapeHtml(pl.name)}</div>
      <button class="playlists-header-btn" id="playlistDetailMenu" aria-label="Options"><i class="fa-solid fa-ellipsis"></i></button>
    </div>
    <button class="playlist-play-btn" id="playPlaylistBtn" ${songs.length ? '' : 'disabled'}>
      <i class="fa-solid fa-play"></i> Play All ${songs.length ? `(${songs.length})` : ''}
    </button>
    ${missing > 0 ? `<div style="font-size:11px;color:var(--text-tertiary);padding:4px 8px;margin-bottom:6px">${missing} song${missing !== 1 ? 's' : ''} unavailable (reimport needed)</div>` : ''}
    <div id="playlistSongs"></div>
  `;
  const songsEl = $('playlistSongs');
  if(!songs.length){
    songsEl.innerHTML = `<div class="playlist-empty"><i class="fa-solid fa-music"></i>Playlist is empty<br><small style="opacity:.7">Add songs using the folder+ button</small></div>`;
  } else {
    songsEl.innerHTML = songs.map(s => `
      <div class="playlist-song-item" data-song-id="${s.id}">
        <img src="${s.art}" alt="">
        <div class="playlist-song-item-info">
          <div class="playlist-song-item-title">${escapeHtml(s.title)}</div>
          <div class="playlist-song-item-artist">${escapeHtml(s.artist)}</div>
        </div>
        <button class="playlist-song-remove" data-remove="${s.id}" aria-label="Remove"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `).join('');
    songsEl.querySelectorAll('.playlist-song-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if(e.target.closest('.playlist-song-remove')) return;
        const idx = state.queue.findIndex(s => s.id == item.dataset.songId);
        if(idx >= 0) loadAndPlay(idx);
      });
    });
    songsEl.querySelectorAll('.playlist-song-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeSongFromPlaylist(plId, btn.dataset.remove);
      });
    });
  }
  $('playlistBack').onclick = () => renderPlaylists();
  $('playPlaylistBtn').onclick = () => playPlaylist(plId);
  $('playlistDetailMenu').onclick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    showPlaylistMenu(rect.left, rect.bottom + 4, plId);
  };
}

/* ═══════════════ LIKED SONGS VIEW (NEW) ═══════════════ */
function renderLikedSongsDetail(){
  state.activePlaylistId = '__liked__';
  $('playlistsList').style.display = 'none';
  const detail = $('playlistDetail');
  detail.classList.add('active');

  const songs = state.queue.filter(s => state.favorites.includes(s.id));

  detail.innerHTML = `
    <div class="playlist-detail-header">
      <button class="playlists-header-btn" id="playlistBack" aria-label="Back"><i class="fa-solid fa-arrow-left"></i></button>
      <div class="playlist-detail-title">Liked Songs</div>
    </div>
    <button class="playlist-play-btn" id="playPlaylistBtn" ${songs.length ? '' : 'disabled'}>
      <i class="fa-solid fa-play"></i> Play All ${songs.length ? `(${songs.length})` : ''}
    </button>
    <div id="playlistSongs"></div>
  `;

  const songsEl = $('playlistSongs');
  if(!songs.length){
    songsEl.innerHTML = `<div class="playlist-empty"><i class="fa-solid fa-heart"></i>No liked songs yet<br><small style="opacity:.7">Tap the heart on any song</small></div>`;
  } else {
    songsEl.innerHTML = songs.map(s => `
      <div class="playlist-song-item" data-song-id="${s.id}">
        <img src="${s.art}" alt="">
        <div class="playlist-song-item-info">
          <div class="playlist-song-item-title">${escapeHtml(s.title)}</div>
          <div class="playlist-song-item-artist">${escapeHtml(s.artist)}</div>
        </div>
        <button class="playlist-song-remove" data-remove="${s.id}" aria-label="Unlike">
          <i class="fa-solid fa-heart" style="color:#ec4899"></i>
        </button>
      </div>
    `).join('');
    songsEl.querySelectorAll('.playlist-song-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if(e.target.closest('.playlist-song-remove')) return;
        const idx = state.queue.findIndex(s => s.id == item.dataset.songId);
        if(idx >= 0) loadAndPlay(idx);
      });
    });
    songsEl.querySelectorAll('.playlist-song-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const songId = btn.dataset.remove;
        const idx = state.favorites.findIndex(id => id == songId);
        if(idx >= 0){
          state.favorites.splice(idx, 1);
          save();
          if(typeof updateFavoriteIcon === 'function') updateFavoriteIcon();
                    if(typeof renderLeftPanel === 'function') renderLeftPanel();
          renderLikedSongsDetail();
          showToast('Removed from liked songs', 'info');
        }
      });
    });
  }

  $('playlistBack').onclick = () => renderPlaylists();
  $('playPlaylistBtn').onclick = () => {
    if(!songs.length) return;
    const firstIdx = state.queue.findIndex(s => s.id == songs[0].id);
    if(firstIdx >= 0) loadAndPlay(firstIdx);
  };
}

function showPlaylistMenu(x, y, plId){
  closePopups();
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.innerHTML = `
    <button class="context-menu-item" data-action="rename"><i class="fa-solid fa-pen"></i> Rename</button>
    <button class="context-menu-item danger" data-action="delete"><i class="fa-solid fa-trash"></i> Delete</button>
  `;
  document.body.appendChild(menu);
  requestAnimationFrame(() => {
    const r = menu.getBoundingClientRect();
    if(r.right > window.innerWidth - 8) menu.style.left = (window.innerWidth - r.width - 8) + 'px';
    if(r.bottom > window.innerHeight - 8) menu.style.top = (window.innerHeight - r.height - 8) + 'px';
  });
  menu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      const pl = state.playlists.find(p => p.id === plId);
      if(action === 'rename'){
        promptPlaylistName('Rename Playlist', pl?.name || '', (name) => renamePlaylist(plId, name));
      } else if(action === 'delete'){
        confirmDialog('Delete Playlist?', `"${pl?.name}" will be permanently deleted.`, () => deletePlaylist(plId));
      }
      menu.remove();
    });
  });
  setTimeout(() => {
    document.addEventListener('click', function close(e){
      if(!menu.contains(e.target)){ menu.remove(); document.removeEventListener('click', close); }
    });
  }, 0);
}

function showAddToPlaylistPopup(btn){
  closePopups();
  if(!hasSongs() || !currentSong()){ showToast('Play a song first', 'info'); return; }
  const rect = btn.getBoundingClientRect();
  const popup = document.createElement('div');
  popup.className = 'add-to-playlist-popup';
  popup.style.left = rect.left + 'px';
  popup.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
  let html = '<div class="popup-header">Add to Playlist</div>';
  if(state.playlists.length){
    html += state.playlists.map(pl =>
      `<button class="add-to-playlist-item" data-pl="${pl.id}">
         <div class="mini-cover">${escapeHtml(pl.name.charAt(0).toUpperCase())}</div>
         <span>${escapeHtml(pl.name)}</span>
       </button>`
    ).join('');
  } else {
    html += '<div style="padding:16px 12px;font-size:12px;color:var(--text-tertiary);text-align:center">No playlists yet</div>';
  }
  html += `<div style="height:1px;background:rgba(255,255,255,.08);margin:4px 0"></div>
    <button class="add-to-playlist-item" data-pl="__new__">
      <div class="mini-cover create-new"><i class="fa-solid fa-plus"></i></div>
      <span class="create-new-text">Create new playlist</span>
    </button>`;
  popup.innerHTML = html;
  document.body.appendChild(popup);
  requestAnimationFrame(() => {
    const r = popup.getBoundingClientRect();
    if(r.right > window.innerWidth - 8) popup.style.left = (window.innerWidth - r.width - 8) + 'px';
    if(r.left < 8) popup.style.left = '8px';
  });
  popup.querySelectorAll('.add-to-playlist-item').forEach(item => {
    item.addEventListener('click', () => {
      const song = currentSong();
      if(!song){ popup.remove(); return; }
      const plId = item.dataset.pl;
      if(plId === '__new__'){
        promptPlaylistName('New Playlist', '', (name) => {
          const pl = createPlaylist(name);
          if(pl) addSongToPlaylist(pl.id, song.id);
        });
      } else {
        addSongToPlaylist(plId, song.id);
      }
      popup.remove();
    });
  });
  setTimeout(() => {
    document.addEventListener('click', function close(e){
      if(!popup.contains(e.target) && e.target !== btn && !btn.contains(e.target)){
        popup.remove();
        document.removeEventListener('click', close);
      }
    });
  }, 0);
}

function closePopups(){
  document.querySelectorAll('.context-menu, .add-to-playlist-popup').forEach(el => el.remove());
}