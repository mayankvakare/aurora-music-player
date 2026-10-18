/* ═══════════════ DOM REFS ═══════════════ */
/* `$` is declared once in utils.js and reused by this file. */
const audio = $('audio');
const albumArt = $('albumArt'), vinyl = $('vinyl'), albumGlow = $('albumGlow');
const songTitle = $('songTitle'), songArtist = $('songArtist');
const progressBar = $('progressBar'), progressFill = $('progressFill'), progressThumb = $('progressThumb');
const currentTime = $('currentTime'), totalTime = $('totalTime');
const playBtn = $('playBtn'), prevBtn = $('prevBtn'), nextBtn = $('nextBtn');
const shuffleBtn = $('shuffleBtn'), repeatBtn = $('repeatBtn');
const favoriteBtn = $('favoriteBtn'), lyricsBtn = $('lyricsBtn'),
      queueBtn = $('queueBtn'), helpBtn = $('helpBtn'),
      addToPlaylistBtn = $('addToPlaylistBtn');
const muteBtn = $('muteBtn');
const volumeBar = $('volumeBar'), volumeFill = $('volumeFill'), volumeThumb = $('volumeThumb');
const queueList = $('queueList'), lyricsList = $('lyricsList');
const searchInput = $('searchInput'), searchClear = $('searchClear'), searchResults = $('searchResults');
const rightPanel = $('rightPanel');
const toastContainer = $('toastContainer');
const modalBackdrop = $('modalBackdrop'), modalContent = $('modalContent');
const visualizerCanvas = $('visualizer');
const heroEl = $('hero');
const fileInput = $('fileInput');

// Left panel elements (naye)
const libraryList = $('libraryList');
const leftPlaylists = $('leftPlaylists');
const libraryCount = $('libraryCount');