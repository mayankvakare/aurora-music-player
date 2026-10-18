/* ═══════════════ UTILITIES ═══════════════ */
const $ = id => document.getElementById(id);

const fmtTime = s => {
  if(!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + sec.toString().padStart(2,'0');
};

const debounce = (fn, wait) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
};

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function attachRipple(el){
  el.addEventListener('click', function(e){
    const rect = this.getBoundingClientRect();
    const r = document.createElement('span');
    r.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = size + 'px';
    r.style.left = (e.clientX - rect.left - size/2) + 'px';
    r.style.top = (e.clientY - rect.top - size/2) + 'px';
    this.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
}

function showToast(msg, type='info'){
  const icons = { info:'fa-circle-info', success:'fa-circle-check', favorite:'fa-heart', error:'fa-circle-exclamation' };
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<i class="fa-solid ${icons[type]||icons.info}"></i><span>${escapeHtml(msg)}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 250); }, 2500);
}