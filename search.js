/* ═══════════════ SEARCH ═══════════════ */
function highlight(text, query){
  if(!query) return escapeHtml(text);
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if(idx < 0) return escapeHtml(text);
  return escapeHtml(text.slice(0, idx)) +
    '<mark>' + escapeHtml(text.slice(idx, idx + query.length)) + '</mark>' +
    escapeHtml(text.slice(idx + query.length));
}

const doSearch = debounce(() => {
  const q = searchInput.value.trim();
  if(!q){
    searchResults.classList.remove('visible');
    searchResults.innerHTML = '';
    return;
  }
  const matches = state.queue.filter(s =>
    s.title.toLowerCase().includes(q.toLowerCase()) ||
    s.artist.toLowerCase().includes(q.toLowerCase())
  );
  if(!matches.length){
    searchResults.innerHTML = `<div class="search-empty"><i class="fa-solid fa-music"></i>No songs found</div>`;
  } else {
    searchResults.innerHTML = matches.map(s => {
      const realIdx = state.queue.findIndex(x => x.id === s.id);
      return `<div class="search-result" data-index="${realIdx}">
        <img src="${s.art}">
        <div class="search-result-info">
          <div class="search-result-title">${highlight(s.title, q)}</div>
          <div class="search-result-artist">${highlight(s.artist, q)}</div>
        </div>
      </div>`;
    }).join('');
    searchResults.querySelectorAll('.search-result').forEach(el => {
      el.addEventListener('click', () => {
        loadAndPlay(+el.dataset.index);
        searchResults.classList.remove('visible');
        searchInput.value = '';
        searchClear.classList.remove('visible');
      });
    });
  }
  searchResults.classList.add('visible');
}, 200);