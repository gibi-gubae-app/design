// Shared behaviour for report pages (sections, weekly report, review):
// 1. saved pill: "በስልክ ተቀምጧል" (offline) or "ተመሳስሏል" (synced) — demo offline with ?offline=1
// 2. narrow screens: pill becomes icon-only, then the title may wrap to 2 lines
// 3. <body data-none="…"> adds a "nothing this week" switch on top of the section
(function () {
  const q = new URLSearchParams(location.search);
  const offline = q.get('offline') === '1' || !navigator.onLine;
  window.GG_OFFLINE = offline;
  const returned = q.get('r') === '1' || q.get('state') === 'returned';
  const page = location.pathname.split('/').pop();

  // sections opened from the returned report go back to it, not to the current week
  if (returned && page.startsWith('section-')) {
    document.querySelectorAll('a[href="weekly-report.html"]').forEach(a => a.href = 'weekly-report.html?state=returned');
    document.querySelectorAll('[onclick*="weekly-report.html"]').forEach(b => b.setAttribute('onclick', "location.href='weekly-report.html?state=returned'"));
  }

  // text boxes grow with what is typed
  const grow = t => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; };
  document.addEventListener('input', e => { if (e.target.tagName === 'TEXTAREA') grow(e.target); });
  const growAll = () => document.querySelectorAll('textarea').forEach(t => t.offsetParent && grow(t));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(growAll);
  document.addEventListener('click', () => setTimeout(growAll, 30));

  document.querySelectorAll('.pill.saved').forEach(p => {
    p.innerHTML = offline
      ? '<span class="ms" style="font-size:14px">smartphone</span><span class="t">በስልክ ተቀምጧል</span>'
      : '<span class="ms" style="font-size:14px">cloud_done</span><span class="t">ተመሳስሏል</span>';
    p.title = offline ? 'በስልክ ተቀምጧል፤ ኢንተርኔት ሲገኝ ይመሳሰላል' : 'ተቀምጧል እና ተመሳስሏል';
  });

  const fit = () => {
    const h1 = document.querySelector('.appbar h1'), pill = document.querySelector('.appbar .pill.saved');
    if (!h1) return;
    pill && pill.classList.remove('compact'); h1.classList.remove('wrap');
    if (h1.scrollWidth > h1.clientWidth + 1 && pill) pill.classList.add('compact');
    if (h1.scrollWidth > h1.clientWidth + 1) h1.classList.add('wrap');
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
  addEventListener('resize', fit);

  const label = document.body.dataset.none;
  if (!label) return;
  const key = (returned ? 'gg-none-r-' : 'gg-none-') + page;   // separate per report week
  const stored = localStorage.getItem(key);
  let on = stored === null ? q.get('none') === '1' : stored === '1';
  const note = document.querySelector('.section-note');
  const row = document.createElement('section');
  row.className = 'card none-row';
  const icon = document.body.dataset.noneIcon || 'event_busy';
  row.innerHTML = `<span class="ic"><span class="ms">${icon}</span></span>
    <div class="min-w-0 flex-1"><b>${label}</b><small>ክፍሉ እንደተሞላ ይቆጠራል</small></div>
    <button type="button" class="switch" aria-label="${label}"></button>`;
  const empty = document.createElement('div');
  empty.className = 'card none-note';
  empty.innerHTML = `<span class="ms">${icon}</span><b style="color:var(--text)">${label}</b>ይህ ክፍል በሪፖርቱ ላይ «አልነበረም» ተብሎ ይላካል።`;
  note.after(row); row.after(empty);
  const rest = [...row.parentElement.children].filter(el => el !== note && el !== row && el !== empty);
  const apply = () => {
    row.classList.toggle('on', on); row.querySelector('.switch').classList.toggle('on', on);
    rest.forEach(el => el.classList.toggle('none-hide', on)); empty.classList.toggle('none-hide', !on);
  };
  row.querySelector('.switch').onclick = () => { on = !on; localStorage.setItem(key, on ? '1' : '0'); apply(); };
  apply();
})();
