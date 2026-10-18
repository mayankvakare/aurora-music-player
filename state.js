/* ═══════════════ GLOBAL STATE ═══════════════ */
const state = {
  currentIndex: 0,
  isPlaying: false,
  isShuffle: false,
  repeatMode: 'off',
  volume: 0.7,
  previousVolume: 0.7,
  isMuted: false,
  favorites: [],
  recentlyPlayed: [],
  queue: [],
  playlists: [],
  activePlaylistId: null,
  activeView: 'home',
  activeTab: 'queue',
  sleepTimerId: null,
  crossfade: false,
  usingRealVis: false,
  eqPreset: 'flat',
  playbackRate: 1.0,
  spatialAudio: false,
  mobileView: 'player'
};