
/* ═══════════════════════════════════════════
   AURORA MUSIC PLAYER
   Import Engine + Aurora Flow Artwork
═══════════════════════════════════════════ */

/* ───────── AURORA FLOW COVER ───────── */

function makeCover(title, color) {
  const safeColor = /^#[0-9a-f]{3,8}$/i.test(String(color || ""))
    ? color
    : "#7c3aed";

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="400" height="400" viewBox="0 0 400 400">

    <defs>
      <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${safeColor}"/>
        <stop offset="50%" stop-color="#18264f"/>
        <stop offset="100%" stop-color="#10091f"/>
        <animate attributeName="x1"
                 values="0;1;0"
                 dur="11s"
                 repeatCount="indefinite"/>
      </linearGradient>

      <linearGradient id="auroraA" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#25e6d2" stop-opacity=".95"/>
        <stop offset="50%" stop-color="#8b5cf6" stop-opacity=".72"/>
        <stop offset="100%" stop-color="#f72585" stop-opacity=".12"/>
      </linearGradient>

      <linearGradient id="auroraB" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stop-color="#f72585" stop-opacity=".75"/>
        <stop offset="55%" stop-color="#5b7cfa" stop-opacity=".55"/>
        <stop offset="100%" stop-color="#23d5ab" stop-opacity=".08"/>
      </linearGradient>

      <linearGradient id="orbGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity=".7"/>
        <stop offset="30%" stop-color="#c4b5fd" stop-opacity=".3"/>
        <stop offset="70%" stop-color="#7c3aed" stop-opacity=".2"/>
        <stop offset="100%" stop-color="#06b6d4" stop-opacity=".4"/>
      </linearGradient>

      <linearGradient id="chromeRibbon" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffffff" stop-opacity=".8"/>
        <stop offset="25%" stop-color="#38bdf8"/>
        <stop offset="50%" stop-color="#ec4899"/>
        <stop offset="75%" stop-color="#a78bfa"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity=".8"/>
      </linearGradient>

      <radialGradient id="orbCore" cx="35%" cy="32%" r="65%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity=".85"/>
        <stop offset="25%" stop-color="#a78bfa" stop-opacity=".5"/>
        <stop offset="60%" stop-color="#1e1035" stop-opacity=".6"/>
        <stop offset="100%" stop-color="#0d081f" stop-opacity=".8"/>
      </radialGradient>

      <filter id="blur">
        <feGaussianBlur stdDeviation="22"/>
      </filter>

      <filter id="glow">
        <feGaussianBlur stdDeviation="5" result="blurred"/>
        <feMerge>
          <feMergeNode in="blurred"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <clipPath id="coverClip">
        <rect width="400" height="400" rx="34"/>
      </clipPath>
    </defs>

    <g clip-path="url(#coverClip)">

      <!-- Deep gradient background -->
      <rect width="400" height="400" fill="url(#base)"/>

      <!-- Animated Aurora Flow -->
      <g filter="url(#blur)" opacity=".96">

        <path
          d="M-70 170 C25 65 95 270 190 150
             S330 50 470 130 L470 310
             C340 235 285 350 175 270
             S35 350 -70 280Z"
          fill="url(#auroraA)">

          <animateTransform
            attributeName="transform"
            type="translate"
            values="-24 8;20 -12;-24 8"
            dur="9s"
            repeatCount="indefinite"/>
        </path>

        <path
          d="M-40 285 C45 180 130 345 220 230
             S340 170 450 215 L450 410 L-40 410Z"
          fill="url(#auroraB)">

          <animateTransform
            attributeName="transform"
            type="translate"
            values="18 -10;-16 14;18 -10"
            dur="12s"
            repeatCount="indefinite"/>
        </path>

      </g>

      <!-- Soft light accents -->
      <circle cx="90" cy="90" r="65"
              fill="#8b5cf6" opacity=".14">
        <animate attributeName="opacity"
                 values=".08;.22;.08"
                 dur="5s"
                 repeatCount="indefinite"/>
      </circle>

      <circle cx="320" cy="300" r="90"
              fill="#ec4899" opacity=".12">
        <animate attributeName="opacity"
                 values=".06;.2;.06"
                 dur="6s"
                 repeatCount="indefinite"/>
      </circle>

      <!-- Glass frame -->
      <rect x="24" y="24" width="352" height="352"
            rx="26"
            fill="#ffffff"
            fill-opacity=".025"
            stroke="#ffffff"
            stroke-opacity=".22"
            stroke-width="1.5"/>

      <!-- 3D Glass Orb (Centerpiece) -->
      <g filter="url(#glow)">
        <!-- Outer Aurora ambient halo -->
        <circle cx="200" cy="200" r="92" fill="url(#auroraA)" opacity=".22">
          <animate attributeName="r" values="88;98;88" dur="4s" repeatCount="indefinite"/>
        </circle>
        <!-- Glass Orb Body -->
        <circle cx="200" cy="200" r="76" fill="url(#orbCore)" stroke="url(#orbGrad)" stroke-width="2"/>
        <!-- Inner Chrome Core -->
        <circle cx="200" cy="200" r="50" fill="url(#chromeRibbon)" opacity=".45">
          <animate attributeName="opacity" values=".35;.6;.35" dur="3s" repeatCount="indefinite"/>
        </circle>
        <!-- Glass Depth Rings -->
        <circle cx="200" cy="200" r="62" fill="none" stroke="#ffffff" stroke-opacity=".15" stroke-width="1"/>
        <circle cx="200" cy="200" r="32" fill="none" stroke="#ffffff" stroke-opacity=".12" stroke-width="1"/>
        <!-- Top-Left Primary Specular Reflection -->
        <ellipse cx="176" cy="168" rx="28" ry="15" transform="rotate(-30 176 168)" fill="#ffffff" opacity=".65"/>
        <!-- Secondary Tiny Specular -->
        <circle cx="226" cy="166" r="6" fill="#ffffff" opacity=".5"/>
        <!-- Bottom Light Refraction -->
        <ellipse cx="200" cy="246" rx="42" ry="12" fill="#38bdf8" opacity=".4"/>
      </g>

      <!-- Liquid Chrome Metallic Waves & Neon Sound Stream -->
      <path d="M45 285 Q 120 220, 200 285 T 355 285"
            fill="none" stroke="url(#chromeRibbon)" stroke-width="3" stroke-linecap="round" opacity=".85" filter="url(#glow)">
        <animate attributeName="d"
                 values="M45 285 Q 120 220, 200 285 T 355 285;M45 285 Q 120 330, 200 285 T 355 285;M45 285 Q 120 220, 200 285 T 355 285"
                 dur="6s" repeatCount="indefinite"/>
      </path>
      <path d="M60 305 Q 130 260, 200 305 T 340 305"
            fill="none" stroke="#25e6d2" stroke-opacity=".55" stroke-width="1.5" stroke-linecap="round">
        <animate attributeName="d"
                 values="M60 305 Q 130 260, 200 305 T 340 305;M60 305 Q 130 340, 200 305 T 340 305;M60 305 Q 130 260, 200 305 T 340 305"
                 dur="5s" repeatCount="indefinite"/>
      </path>

      <!-- Subtle flowing light line -->
      <path
        d="M45 324 C105 296 135 349 200 320
           S305 299 355 327"
        fill="none"
        stroke="#ffffff"
        stroke-opacity=".3"
        stroke-width="2"
        stroke-linecap="round"/>

      <circle cx="200" cy="320" r="3"
              fill="#ffffff" opacity=".9"/>

    </g>
  </svg>`;

  return "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(svg);
}


/* ───────── AUDIO FILE SUPPORT ───────── */

const SUPPORTED_AUDIO_EXTENSION =
  /\.(mp3|wav|wave|ogg|oga|m4a|mp4|flac|aac|opus|weba|aiff|aif)$/i;

function isAudioFile(file) {
  return Boolean(
    file &&
    (
      (typeof file.type === "string" &&
       file.type.startsWith("audio/")) ||
      SUPPORTED_AUDIO_EXTENSION.test(file.name || "")
    )
  );
}

function getAudioFormat(file) {
  const match = String(file?.name || "").match(/\.([^.]+)$/);
  return match ? match[1].toUpperCase() : "AUDIO";
}

function makeSongId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `song_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}


/* ───────── IMPORT SONGS ───────── */

async function importFiles(fileList) {
  const selected = Array.from(fileList || [])
    .filter(file => file && file.size >= 0);

  if (!selected.length) return;

  const audioFiles = selected.filter(isAudioFile);

  if (!audioFiles.length) {
    showToast(
      "No supported audio files found. Try MP3, WAV, M4A or FLAC.",
      "error"
    );
    return;
  }

  if (
    typeof state === "undefined" ||
    !Array.isArray(state.queue)
  ) {
    showToast(
      "Player is not ready. Refresh the page and try again.",
      "error"
    );
    console.error("Aurora import: state.queue is unavailable.");
    return;
  }

  const existingKeys = new Set(
    state.queue.map(song =>
      `${song.fileName || ""}::${song.fileSize || 0}`
    )
  );

  const uniqueFiles = [];
  let duplicates = 0;

  audioFiles.forEach(file => {
    const key = `${file.name}::${file.size}`;

    if (existingKeys.has(key)) {
      duplicates++;
      return;
    }

    existingKeys.add(key);
    uniqueFiles.push(file);
  });

  if (!uniqueFiles.length) {
    showToast(
      duplicates
        ? "These songs are already in your library."
        : "No new songs to import.",
      "info"
    );
    return;
  }

  const wasEmpty = state.queue.length === 0;
  const firstNewIndex = state.queue.length;

  const colors =
    typeof LOCAL_COLORS !== "undefined" &&
    Array.isArray(LOCAL_COLORS) &&
    LOCAL_COLORS.length
      ? LOCAL_COLORS
      : ["#7c3aed", "#ec4899", "#06b6d4"];

  const newlyAdded = [];

  uniqueFiles.forEach(file => {
    try {
      const title =
        file.name.replace(/\.[^/.]+$/, "").trim() ||
        "Unknown Track";

      const color =
        colors[Math.floor(Math.random() * colors.length)];

      const song = {
        id: makeSongId(),
        title,
        artist: "Local File",

        // Aurora Flow artwork replaces the letter logo.
        art: makeCover(title, color),

        url: URL.createObjectURL(file),
        fileBlob: file,
        fileName: file.name,
        fileSize: file.size,
        format: getAudioFormat(file),
        importedAt: Date.now(),
        color,
        isLocal: true
      };

      state.queue.push(song);
      newlyAdded.push(song);

    } catch (error) {
      console.error(
        "Aurora could not import:",
        file.name,
        error
      );
    }
  });

  if (!newlyAdded.length) {
    showToast("Unable to import these audio files.", "error");
    return;
  }

  /* Update the interface */
  updateEmptyState();
  renderQueue();
  renderLeftPanel();
  renderLyrics();

  if (state.activeTab === "playlists") {
    renderPlaylists();
  }

  save();

  /* Start the first imported song */
  if (wasEmpty && state.queue.length > 0) {
    loadAndPlay(firstNewIndex);
  }

  /* Persist the local audio library */
  if (typeof saveLibraryToDB === "function") {
    saveLibraryToDB()
      .then(() => {
        showToast(
          `${newlyAdded.length} song${newlyAdded.length === 1 ? "" : "s"} imported and saved`,
          "success"
        );
      })
      .catch(error => {
        console.warn(
          "Aurora could not persist imported audio:",
          error
        );

        showToast(
          "Songs imported for this session, but browser storage failed.",
          "error"
        );
      });
  } else {
    showToast(
      `${newlyAdded.length} song${newlyAdded.length === 1 ? "" : "s"} imported`,
      "success"
    );
  }

  if (duplicates) {
    showToast(
      `${duplicates} duplicate file${duplicates === 1 ? "" : "s"} skipped`,
      "info"
    );
  }
}


/* ───────── FILE PICKER ───────── */

function openAudioPicker() {
  const input = $("fileInput");

  if (!input) {
    showToast(
      "Import control is missing. Please check index.html.",
      "error"
    );

    console.error(
      "Aurora import: #fileInput element not found."
    );
    return;
  }

  input.click();
}


/* ───────── IMPORT EVENTS ───────── */

function setupImportEvents() {
  const input = $("fileInput");
  const importBtn = $("importBtn");
  const emptyImportBtn = $("emptyImportBtn");

  if (!input) {
    console.error(
      "Aurora import setup failed: #fileInput was not found."
    );
    return;
  }

  if (input.dataset.auroraImportReady === "true") return;

  input.dataset.auroraImportReady = "true";

  importBtn?.addEventListener("click", openAudioPicker);
  emptyImportBtn?.addEventListener("click", openAudioPicker);

  input.addEventListener("change", event => {
    const files = Array.from(event.target.files || []);

    // Allow selecting the same file again.
    input.value = "";

    if (files.length) {
      importFiles(files);
    }
  });

  function isFileDrag(event) {
    return (
      event.dataTransfer &&
      Array.from(event.dataTransfer.types || [])
        .includes("Files")
    );
  }

  document.addEventListener("dragover", event => {
    if (!isFileDrag(event)) return;

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }

    document
      .querySelector(".layout-grid")
      ?.classList.add("drag-over");
  });

  document.addEventListener("dragleave", event => {
    if (
      event.relatedTarget &&
      document.documentElement.contains(event.relatedTarget)
    ) {
      return;
    }

    document
      .querySelector(".layout-grid")
      ?.classList.remove("drag-over");
  });

  document.addEventListener("drop", event => {
    if (!isFileDrag(event)) return;

    event.preventDefault();

    document
      .querySelector(".layout-grid")
      ?.classList.remove("drag-over");

    const files = Array.from(
      event.dataTransfer.files || []
    );

    if (files.length) {
      importFiles(files);
    }
  });
}
