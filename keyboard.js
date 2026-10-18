/* ═══════════════ KEYBOARD SHORTCUTS ═══════════════ */
document.addEventListener('keydown', (e) => {
  const tag = document.activeElement.tagName;
  if(tag === 'INPUT' || tag === 'TEXTAREA'){
    if(e.key === 'Escape'){ searchInput.blur(); searchResults.classList.remove('visible'); }
    return;
  }
  switch(e.key){
    case ' ': e.preventDefault(); togglePlay(); break;
    case 'ArrowLeft':
      e.preventDefault();
      if(e.shiftKey) prevTrack();
      else if(audio.duration) audio.currentTime = Math.max(0, audio.currentTime - 5);
      break;
    case 'ArrowRight':
      e.preventDefault();
      if(e.shiftKey) nextTrack();
      else if(audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
      break;
    case 'ArrowUp':
      e.preventDefault();
      state.volume = Math.min(1, state.volume + 0.05);
      state.isMuted = false;
      applyVolume(); save();
      break;
    case 'ArrowDown':
      e.preventDefault();
      state.volume = Math.max(0, state.volume - 0.05);
      applyVolume(); save();
      break;
    case 'm': case 'M': muteBtn.click(); break;
    case 's': case 'S': shuffleBtn.click(); break;
    case 'r': case 'R': repeatBtn.click(); break;
    case 'f': case 'F': toggleFavorite(); break;
    case '/': e.preventDefault(); searchInput.focus(); break;
    case 'Escape':
      if(rightPanel.classList.contains('open')) rightPanel.classList.remove('open');
      else closeModal();
      break;
  }
});

/* Media Session */
if('mediaSession' in navigator){
  navigator.mediaSession.setActionHandler('play', togglePlay);
  navigator.mediaSession.setActionHandler('pause', togglePlay);
  navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
  navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
}