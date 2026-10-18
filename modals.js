/* ═══════════════ MODALS ═══════════════ */
function openSettings(){
  modalContent.innerHTML = `
    <button class="modal-close" id="modalClose"><i class="fa-solid fa-xmark"></i></button>
    <h2>Settings</h2>
    <div class="settings-row">
      <div>Crossfade<small>Blend songs smoothly</small></div>
      <div class="toggle ${state.crossfade ? 'on' : ''}" id="crossfadeToggle"></div>
    </div>
    <div class="settings-row">
      <div>Sleep timer<small>Auto-stop playback</small></div>
      <button class="modal-btn secondary" style="padding:6px 12px;font-size:12px" onclick="closeModal(); openSleepTimerModal();">Configure Timer</button>
    </div>
    <div class="settings-row">
      <div>Smart Equalizer<small>Custom audio presets &amp; filters</small></div>
      <button class="modal-btn primary" style="padding:6px 12px;font-size:12px" onclick="closeModal(); openEqModal();">Open EQ</button>
    </div>
  `;
  modalBackdrop.classList.add('visible');
  $('modalClose').onclick = closeModal;
  $('crossfadeToggle').onclick = (e) => {
    state.crossfade = !state.crossfade;
    e.currentTarget.classList.toggle('on', state.crossfade);
    save();
  };
}

function openEqModal(){
  const curPreset = state.eqPreset || 'flat';
  const curP = typeof EQ_PRESETS !== 'undefined' ? (EQ_PRESETS[curPreset] || EQ_PRESETS.flat) : { bass: 0, mid: 0, treble: 0 };

  modalContent.innerHTML = `
    <button class="modal-close" id="modalClose"><i class="fa-solid fa-xmark"></i></button>
    <h2>Smart Equalizer &amp; 3D Audio</h2>
    <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">Real-time studio acoustic shaping powered by Web Audio API</p>

    <div class="eq-presets-grid" id="eqChipsContainer">
      ${typeof EQ_PRESETS !== 'undefined' ? Object.entries(EQ_PRESETS).map(([key, p]) => `
        <button class="eq-chip ${curPreset === key ? 'active' : ''}" data-key="${key}">
          ${p.name}
        </button>
      `).join('') : ''}
    </div>

    <div style="background:rgba(255,255,255,.04);padding:14px;border-radius:var(--radius-md);margin-top:14px">
      <div class="eq-slider-row">
        <span class="eq-slider-label">Bass (140Hz)</span>
        <input type="range" class="eq-range" id="eqBassRange" min="-12" max="14" step="1" value="${curP.bass}">
        <span class="eq-val-badge" id="eqBassVal">${curP.bass > 0 ? '+' : ''}${curP.bass}dB</span>
      </div>
      <div class="eq-slider-row">
        <span class="eq-slider-label">Mid (1.6kHz)</span>
        <input type="range" class="eq-range" id="eqMidRange" min="-12" max="14" step="1" value="${curP.mid}">
        <span class="eq-val-badge" id="eqMidVal">${curP.mid > 0 ? '+' : ''}${curP.mid}dB</span>
      </div>
      <div class="eq-slider-row">
        <span class="eq-slider-label">Treble (7.5k)</span>
        <input type="range" class="eq-range" id="eqTrebleRange" min="-12" max="14" step="1" value="${curP.treble}">
        <span class="eq-val-badge" id="eqTrebleVal">${curP.treble > 0 ? '+' : ''}${curP.treble}dB</span>
      </div>
    </div>
  `;
  modalBackdrop.classList.add('visible');
  $('modalClose').onclick = closeModal;

  document.querySelectorAll('.eq-chip').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.eq-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.key;
      if(typeof applyEqPreset === 'function') applyEqPreset(key, true);
      const p = EQ_PRESETS[key];
      $('eqBassRange').value = p.bass;
      $('eqBassVal').textContent = `${p.bass > 0 ? '+' : ''}${p.bass}dB`;
      $('eqMidRange').value = p.mid;
      $('eqMidVal').textContent = `${p.mid > 0 ? '+' : ''}${p.mid}dB`;
      $('eqTrebleRange').value = p.treble;
      $('eqTrebleVal').textContent = `${p.treble > 0 ? '+' : ''}${p.treble}dB`;
    };
  });

  const syncCustom = () => {
    const b = +$('eqBassRange').value;
    const m = +$('eqMidRange').value;
    const tr = +$('eqTrebleRange').value;
    $('eqBassVal').textContent = `${b > 0 ? '+' : ''}${b}dB`;
    $('eqMidVal').textContent = `${m > 0 ? '+' : ''}${m}dB`;
    $('eqTrebleVal').textContent = `${tr > 0 ? '+' : ''}${tr}dB`;
    if(typeof setCustomEq === 'function') setCustomEq(b, m, tr);
    document.querySelectorAll('.eq-chip').forEach(c => c.classList.remove('active'));
  };

  $('eqBassRange').oninput = syncCustom;
  $('eqMidRange').oninput = syncCustom;
  $('eqTrebleRange').oninput = syncCustom;
}

function openSleepTimerModal(){
  modalContent.innerHTML = `
    <button class="modal-close" id="modalClose"><i class="fa-solid fa-xmark"></i></button>
    <h2>🌙 Smart Sleep Timer</h2>
    <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">Playback will gently fade out over the last 30 seconds</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button class="modal-btn secondary" data-mins="15">15 Minutes</button>
      <button class="modal-btn secondary" data-mins="30">30 Minutes</button>
      <button class="modal-btn secondary" data-mins="45">45 Minutes</button>
      <button class="modal-btn secondary" data-mins="60">1 Hour</button>
      <button class="modal-btn danger" style="grid-column:span 2" data-mins="0">Turn Off Timer</button>
    </div>
  `;
  modalBackdrop.classList.add('visible');
  $('modalClose').onclick = closeModal;

  modalContent.querySelectorAll('button[data-mins]').forEach(btn => {
    btn.onclick = () => {
      const mins = +btn.dataset.mins;
      if(typeof setSmartSleepTimer === 'function') setSmartSleepTimer(mins);
      closeModal();
    };
  });
}

function openHelp(){
  modalContent.innerHTML = `
    <button class="modal-close" id="modalClose"><i class="fa-solid fa-xmark"></i></button>
    <h2>Keyboard Shortcuts</h2>
    <div class="shortcut-row"><span>Play / Pause</span><kbd>Space</kbd></div>
    <div class="shortcut-row"><span>Seek ±5s</span><kbd>← →</kbd></div>
    <div class="shortcut-row"><span>Previous / Next</span><kbd>Shift + ← →</kbd></div>
    <div class="shortcut-row"><span>Volume ±</span><kbd>↑ ↓</kbd></div>
    <div class="shortcut-row"><span>Mute</span><kbd>M</kbd></div>
    <div class="shortcut-row"><span>Shuffle</span><kbd>S</kbd></div>
    <div class="shortcut-row"><span>Repeat</span><kbd>R</kbd></div>
    <div class="shortcut-row"><span>Favorite</span><kbd>F</kbd></div>
    <div class="shortcut-row"><span>Focus Search</span><kbd>/</kbd></div>
    <div class="shortcut-row"><span>Close modal</span><kbd>Esc</kbd></div>
  `;
  modalBackdrop.classList.add('visible');
  $('modalClose').onclick = closeModal;
}

function closeModal(){ modalBackdrop.classList.remove('visible'); }

function promptPlaylistName(title, defVal, callback){
  modalContent.innerHTML = `
    <button class="modal-close" id="modalClose"><i class="fa-solid fa-xmark"></i></button>
    <h2>${title}</h2>
    <input type="text" class="playlist-input" id="playlistNameInput" value="${escapeHtml(defVal || '')}" placeholder="Playlist name" maxlength="50">
    <div class="modal-actions">
      <button class="modal-btn secondary" id="cancelBtn">Cancel</button>
      <button class="modal-btn primary" id="saveBtn">Save</button>
    </div>
  `;
  modalBackdrop.classList.add('visible');
  const input = $('playlistNameInput');
  input.focus();
  input.select();
  const saveIt = () => {
    const name = input.value.trim();
    if(!name){ input.style.borderColor = 'var(--danger)'; input.focus(); return; }
    closeModal();
    callback(name);
  };
  $('saveBtn').onclick = saveIt;
  $('cancelBtn').onclick = closeModal;
  $('modalClose').onclick = closeModal;
  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') saveIt();
    else if(e.key === 'Escape') closeModal();
  });
}

function confirmDialog(title, msg, callback){
  modalContent.innerHTML = `
    <button class="modal-close" id="modalClose"><i class="fa-solid fa-xmark"></i></button>
    <h2>${title}</h2>
    <p style="font-size:14px;color:var(--text-secondary);margin-bottom:20px;line-height:1.5">${escapeHtml(msg)}</p>
    <div class="modal-actions">
      <button class="modal-btn secondary" id="cancelBtn">Cancel</button>
      <button class="modal-btn danger" id="confirmBtn">Delete</button>
    </div>
  `;
  modalBackdrop.classList.add('visible');
  $('cancelBtn').onclick = closeModal;
  $('modalClose').onclick = closeModal;
  $('confirmBtn').onclick = () => { closeModal(); callback(); };
}