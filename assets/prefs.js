// User preferences shared by every page (saved on the phone).
// Text size: 'sm' | 'md' | 'lg' — scales the whole interface so nothing breaks.
(function () {
  const SCALE = { sm: 0.92, md: 1, lg: 1.12 };
  const apply = s => { document.documentElement.style.zoom = SCALE[s] || 1; };
  window.Prefs = {
    textSize: () => localStorage.getItem('gg-text') || 'md',
    setTextSize: s => { localStorage.setItem('gg-text', s); apply(s); },
  };
  apply(window.Prefs.textSize());
})();
