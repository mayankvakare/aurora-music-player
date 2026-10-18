# Aurora — Premium Music Player

A glassmorphic desktop music player built with vanilla HTML, CSS, and JavaScript. No build step or framework is required.

## Features

- Import local audio files through the toolbar, empty-state button, or drag-and-drop.
- Supported browser-playable formats include MP3, WAV, OGG, M4A/MP4 audio, FLAC, AAC, Opus, WebA, and AIFF (exact decoding support depends on the browser and file codec).
- Persistent local audio library using IndexedDB; playback URLs are recreated when the page reloads.
- Library count, queue, center player, favorites, lyrics fallback, and playlist UI stay in sync.
- Create, rename, delete, and organize playlists; add/remove tracks from playlists.
- Saved volume, shuffle/repeat settings, favorites, playlist information, and queue order.
- Responsive glassmorphism layout with a slide-out queue/lyrics/playlists panel on smaller screens.
- Search, keyboard shortcuts, visualizer, and Media Session support where the browser allows it.
- Audio format is shown accurately instead of claiming every file is lossless.

## Run Aurora

**Recommended: VS Code Live Server**

1. Extract this folder.
2. Open `aurora-music-player` in VS Code.
3. Right-click `index.html` and choose **Open with Live Server**.

**Alternative: Python local server**

From inside the `aurora-music-player` folder, run:

```bash
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

A local server is recommended because browser storage behavior for `file://` pages varies. The first time you upgrade from an older Aurora build, you may need to import your songs once again: older builds kept their audio files only in memory and did not save their actual audio data.

## Storage and privacy

Your imported tracks are stored in the browser's local IndexedDB database for this site. They are not uploaded by Aurora. Clearing browser site data can remove the saved library. Use the same browser and local-site address after importing so the player can find its saved database.
