# AURORA PWA setup (UI unchanged)

PWA support has been added without redesigning or restyling the existing interface. The current IndexedDB-based audio persistence in `js/storage.js` was preserved.

## Run on Linux

From this project folder, run:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in Chrome/Chromium. If port 8000 is occupied, use `python3 -m http.server 8080` and open `http://localhost:8080`.

## Install on Android

A service worker and PWA installation require HTTPS on a deployed site (localhost is allowed for development). Deploy the complete folder to an HTTPS static host, open its URL in Android Chrome, then choose **Install app** or **Add to Home screen**.

## Offline and music notes

- The service worker caches the app shell and local CSS/JS/icon files.
- Imported audio is stored separately in IndexedDB by the existing `js/storage.js`; music files are not put in the service-worker cache.
- First load/install requires internet access to load the current externally hosted Google Fonts and Font Awesome CSS. Those remote assets are not guaranteed to be available offline, so some font/icon glyphs may be missing without a network connection. No visual redesign or CDN replacement was made.
- Test offline by opening the app online once, importing a small audio file, reloading, then switching the browser/device offline and reopening the installed app.
- Browser storage may be cleared by the user or browser, and very large music libraries can exceed device storage limits.
