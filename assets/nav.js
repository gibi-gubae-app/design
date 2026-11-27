// Bottom navigation with a wave notch that slides to the active tab.
// Usage: <nav class="navwrap" data-active="0"></nav><script src="assets/nav.js"></script>
(function () {
  const nav = document.querySelector('.navwrap');
  if (!nav) return;
  const items = [
    { icon: 'home', label: 'ዋና', href: 'home.html' },
    { icon: 'description', label: 'ሪፖርቶች', href: 'reports.html' },
    { icon: 'notifications', label: 'ማሳወቂያ', href: 'notifications.html' },
    { icon: 'person', label: 'መገለጫ', href: 'profile.html' },
  ];
  nav.setAttribute('aria-label', 'ዋና ማውጫ');
  nav.innerHTML =
    '<svg class="navsvg"><path/></svg><div class="bubble"><span class="ms fill"></span></div><div class="tabs">' +
    items.map((it, i) => `<a class="tab" data-i="${i}" href="${it.href}"><span class="ms">${it.icon}</span><span class="lb">${it.label}</span></a>`).join('') +
    '</div>';

  const tabs = [...nav.querySelectorAll('.tab')];
  const path = nav.querySelector('path');
  const bubble = nav.querySelector('.bubble');
  const icon = bubble.querySelector('.ms');
  const HALF = 32, DEPTH = 31; // notch half-width and depth
  let cur = null, raf;

  function draw(x) {
    const W = nav.clientWidth, H = nav.clientHeight;
    const a = Math.max(0, x - HALF - 10), b = Math.min(W, x + HALF + 10);
    path.setAttribute('d',
      `M0,0 H${a} C${x - HALF + 6},0 ${x - 30},${DEPTH} ${x},${DEPTH} ` +
      `C${x + 30},${DEPTH} ${x + HALF - 6},0 ${b},0 H${W} V${H} H0 Z`);
    bubble.style.left = x + 'px';
  }
  // Tab centres are calculated, not measured, so they stay right at every text size (page zoom).
  const INSET = 12; // must match .tabs { inset: 0 12px } in app.css
  const centerOf = t => { const i = tabs.indexOf(t), W = nav.clientWidth; return INSET + (W - 2 * INSET) * (i + 0.5) / tabs.length; };

  function select(i, instant) {
    const t = tabs[i], to = centerOf(t);
    tabs.forEach(x => x.classList.toggle('on', x === t));
    if (cur === null || instant) { cur = to; draw(to); icon.textContent = items[i].icon; return; }
    icon.classList.add('swap');
    setTimeout(() => { icon.textContent = items[i].icon; icon.classList.remove('swap'); }, 150);
    const from = cur, start = performance.now();
    cancelAnimationFrame(raf);
    const step = now => {
      let p = Math.min(1, (now - start) / 420);
      p = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // ease-in-out
      cur = from + (to - from) * p; draw(cur);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  tabs.forEach((t, i) => t.addEventListener('click', e => {
    e.preventDefault();
    select(i);
    setTimeout(() => { location.href = items[i].href; }, 430); // let the wave finish, then open the page
  }));
  const active = +(nav.dataset.active || 0);
  select(active, true);
  addEventListener('resize', () => select(tabs.findIndex(t => t.classList.contains('on')), true));
})();
