// Shared form parts for all report sections (matches the official weekly Excel form).
// Date picker (opens at the field), choice chips with "ሌላ", multi-select dropdown, assigned-teacher
// with "who covered", teacher picker, numbers, attendance with auto total, title lists,
// "+ ተጨማሪ" for optional fields, repeatable cards.
const F = (() => {
  const MONTHS = ['መስከረም','ጥቅምት','ኅዳር','ታኅሣሥ','ጥር','የካቲት','መጋቢት','ሚያዝያ','ግንቦት','ሰኔ','ሐምሌ','ነሐሴ','ጳጉሜ'];
  const WD = ['ቅዳ','እሑ','ሰኞ','ማክ','ረቡ','ሐሙ','ዓር'];   // week starts on Saturday, like the report week
  // Ethiopian year 2019 starts on a Friday (መስከረም 1 = 11 Sep 2026). Weekday index 0 = Monday.
  const YEAR = 2019, FIRST_WD = 4;
  // reporting week: ኅዳር 12–18, or ኅዳር 5–11 while fixing the returned report (set by weekly-report.html)
  const RETURNED = new URLSearchParams(location.search).get('r') === '1';   // section opened from the returned report
  const WEEK = RETURNED ? { m: 3, from: 5, to: 11 } : { m: 3, from: 12, to: 18 };
  const wdOf = (m, d) => (FIRST_WD + (m - 1) * 30 + (d - 1)) % 7;
  const inWeek = (m, d) => m === WEEK.m && d >= WEEK.from && d <= WEEK.to;

  const BATCHES = [1, 2, 3, 4, 5, 6, 7].map(n => `${n}ኛ ባች`);
  // several batches can learn together → choose one or more
  const batch = (selected = ['1ኛ ባች'], withExtra = false) =>
    multi('ባች', withExtra ? [...BATCHES, 'ማስተርስ', 'ድኅረ ምረቃ'] : BATCHES, selected, 'f-batch', '· ከአንድ በላይ ይቻላል');
  const TEACHERS = ['ማ/ቅ መምህር','ተጋባዥ','ተተኪ','ሰንበት ት/ቤት','የደብሩ','ሌላ'];
  const COVERED_BY = ['ተተኪ ሰባኪ','ሰንበት ት/ቤት','የደብሩ'];   // from the Excel form

  /* ---------- popover: opens right at the tapped element ---------- */
  const pop = document.createElement('div'); pop.className = 'popover';
  let popAnchor = null;
  document.addEventListener('DOMContentLoaded', () => document.body.append(pop));
  function openPop(anchor, html) {
    popAnchor = anchor;
    pop.innerHTML = `<button type="button" class="pop-x" aria-label="ዝጋ"><span class="ms">close</span></button>` + html;
    pop.querySelector('.pop-x').onclick = closePop;
    pop.classList.add('open');
    // page zoom (text size setting) scales measured positions — convert back to CSS pixels
    const z = parseFloat(document.documentElement.style.zoom) || 1, rr = anchor.getBoundingClientRect();
    const r = { top: rr.top / z, bottom: rr.bottom / z, right: rr.right / z }, vw = innerWidth / z, vh = innerHeight / z;
    const w = Math.min(310, vw - 24);
    pop.style.width = w + 'px';
    pop.style.left = Math.min(Math.max(12, r.right - w), vw - w - 12) + 'px';
    const h = pop.offsetHeight, below = vh - r.bottom - 100;   // keep clear of the bottom button bar
    const top = (below >= h || r.top < h + 70) ? r.bottom + 6 : r.top - h - 6;
    pop.style.top = (top + scrollY / z) + 'px';
    pop.dataset.dir = top > r.top ? 'down' : 'up';
    const vb = pop.getBoundingClientRect();
    if (vb.bottom > innerHeight - 90 * z) scrollBy({ top: vb.bottom - innerHeight + 100 * z, behavior: 'smooth' });
  }
  function closePop() { pop.classList.remove('open'); popAnchor = null; }
  const isOpenFor = a => popAnchor === a && pop.classList.contains('open');
  document.addEventListener('click', e => { if (popAnchor && !pop.contains(e.target) && !popAnchor.contains(e.target)) closePop(); }, true);

  /* ---------- date picker ---------- */
  function datePicker(anchor, input) {
    if (isOpenFor(anchor)) return closePop();          // tap the calendar again = close
    let m = WEEK.m;
    const parsed = MONTHS.findIndex(x => input.value.startsWith(x));
    if (parsed >= 0) m = parsed + 1;
    const render = () => {
      const selDay = parseInt(input.value.replace(/^\D+/, ''), 10), selMonth = input.value.split(' ')[0];
      const days = m === 13 ? 6 : 30, lead = (wdOf(m, 1) + 2) % 7;   // Monday=0 → Saturday column 0
      let cells = WD.map(w => `<span class="wd">${w}</span>`).join('') + '<span></span>'.repeat(lead);
      for (let d = 1; d <= days; d++) {
        const ok = inWeek(m, d), sel = ok && d === selDay && MONTHS[m - 1] === selMonth;
        cells += `<button type="button" data-d="${d}" class="${sel ? 'sel' : ok ? 'wk' : ''}" ${ok ? '' : 'disabled'}>${d}</button>`;
      }
      openPop(anchor, `<div class="cal-head"><button type="button" class="icon-btn sm" data-nav="-1"><span class="ms">chevron_left</span></button>
        <b>${MONTHS[m - 1]} ${YEAR}</b><button type="button" class="icon-btn sm" data-nav="1"><span class="ms">chevron_right</span></button></div>
        <div class="cal-grid">${cells}</div><p class="pop-note">የሪፖርቱ ሳምንት (ኅዳር ${WEEK.from}–${WEEK.to}) ብቻ</p>`);
      pop.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => { m = Math.min(13, Math.max(1, m + +b.dataset.nav)); render(); });
      pop.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
        input.value = `${MONTHS[m - 1]} ${b.dataset.d}, ${YEAR}`; input.dispatchEvent(new Event('input', { bubbles: true })); closePop();
      });
    };
    render();
  }

  /* ---------- month picker (Reports page filter) ---------- */
  function monthPicker(anchor, hasData, current, onPick) {
    if (isOpenFor(anchor)) return closePop();
    let y = YEAR;
    const render = () => {
      const btns = MONTHS.map((name, i) => {
        const key = `${name} ${y}`, future = y > YEAR || (y === YEAR && i + 1 > WEEK.m);
        return `<button type="button" data-k="${key}" class="${hasData.includes(key) ? 'has' : ''} ${current === key ? 'sel' : ''}" ${future ? 'disabled' : ''}>${name}</button>`;
      }).join('');
      openPop(anchor, `<div class="cal-head"><button type="button" class="icon-btn sm" data-nav="-1"><span class="ms">chevron_left</span></button>
        <b>${y} ዓ.ም</b><button type="button" class="icon-btn sm" data-nav="1" ${y >= YEAR ? 'disabled style="opacity:.3"' : ''}><span class="ms">chevron_right</span></button></div>
        <div class="month-grid">${btns}</div>
        <button type="button" class="link-add mt-2 w-full justify-center" data-all>ሁሉንም ወራት አሳይ</button>`);
      pop.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => { y = Math.min(YEAR, y + +b.dataset.nav); render(); });
      pop.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { onPick(b.dataset.k); closePop(); });
      pop.querySelector('[data-all]').onclick = () => { onPick(null); closePop(); };
    };
    render();
  }

  /* ---------- time picker (Ethiopian time: hour + ጠዋት/ከቀኑ/ማታ) ---------- */
  const PARTS = ['ጠዋት', 'ከቀኑ', 'ማታ'];
  function timePicker(btn) {
    if (isOpenFor(btn)) return closePop();
    const [hm = '', part = 'ጠዋት'] = (btn.dataset.v || '').split(' ');
    let [h, mi] = hm.split(':'); h = h || ''; mi = mi || '00'; let pt = part;
    const render = () => {
      openPop(btn, `<div class="cal-head"><b class="text-[15px]">ሰዓት ይምረጡ</b></div>
        <div class="seg" style="margin-bottom:10px">${PARTS.map(x => `<button type="button" data-p="${x}" class="${x === pt ? 'on' : ''}">${x}</button>`).join('')}</div>
        <div class="hour-grid">${Array.from({ length: 12 }, (_, i) => i + 1).map(x => `<button type="button" data-h="${x}" class="${String(x) === h ? 'sel' : ''}">${x}</button>`).join('')}</div>
        <div class="min-row">${['00', '15', '30', '45'].map(x => `<button type="button" data-m="${x}" class="${x === mi ? 'sel' : ''}">:${x}</button>`).join('')}</div>
        <div class="flex justify-end mt-3"><button type="button" class="pop-ok" data-done>እሺ</button></div>`);
      pop.querySelector('.seg').style.gridTemplateColumns = 'repeat(3,1fr)';
      pop.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { pt = b.dataset.p; set(); render(); });
      pop.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { h = b.dataset.h; set(); render(); });
      pop.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mi = b.dataset.m; set(); render(); });
      pop.querySelector('[data-done]').onclick = closePop;
    };
    const set = () => { if (!h) return; btn.dataset.v = `${h}:${mi} ${pt}`; btn.querySelector('b').textContent = btn.dataset.v; btn.classList.remove('empty'); };
    render();
  }

  /* ---------- multi-select dropdown ---------- */
  function multiPicker(field) {
    const anchor = field.querySelector('.input');
    if (isOpenFor(anchor)) return closePop();
    const state = JSON.parse(field.dataset.sel || '[]'), all = JSON.parse(field.dataset.opts);
    const render = () => {
      openPop(anchor, `<div class="cal-head"><b class="text-[15px]">ይምረጡ <span style="font-weight:400;color:var(--text-2);font-size:12px">· ከአንድ በላይ ይቻላል</span></b></div>
        <div class="check-list">${all.map(o => `<button type="button" class="check ${state.includes(o) ? 'on' : ''}" data-o="${o}"><span class="box"><span class="ms">check</span></span>${o}</button>`).join('')}</div>
        <div class="flex gap-2 mt-2"><span class="input" style="height:40px"><input placeholder="ሌላ ይጻፉ…" class="new-opt"></span>
          <button type="button" class="add-opt"><span class="ms">add</span></button></div>
        <div class="flex justify-end mt-3"><button type="button" class="pop-ok" data-done>እሺ</button></div>`);
      pop.querySelectorAll('.check').forEach(b => b.onclick = () => {
        const o = b.dataset.o, i = state.indexOf(o); i >= 0 ? state.splice(i, 1) : state.push(o); b.classList.toggle('on'); sync();
      });
      const inp = pop.querySelector('.new-opt');
      const addNew = () => { const v = inp.value.trim(); if (!v) return; if (!all.includes(v)) all.push(v); if (!state.includes(v)) state.push(v); field.dataset.opts = JSON.stringify(all); sync(); render(); };
      pop.querySelector('.add-opt').onclick = addNew; inp.onkeydown = e => { if (e.key === 'Enter') addNew(); };
      pop.querySelector('[data-done]').onclick = closePop;
    };
    const sync = () => { field.dataset.sel = JSON.stringify(state); field.querySelector('.tags').innerHTML = tagsHtml(state); changed(field); };
    render();
  }
  const tagsHtml = sel => sel.length ? sel.map(s => `<span class="tag">${s}</span>`).join('') : '<span style="color:var(--muted)">ይምረጡ…</span>';

  /* ---------- field builders (return HTML) ---------- */
  const lab = (label, hint) => `<span class="label">${label}${hint ? ` <span style="color:var(--muted)">${hint}</span>` : ''}</span>`;

  // demo dates are written for the current week; move them one week back for the returned report
  const shift = v => RETURNED ? v.replace(/^ኅዳር (\d+)/, (m, d) => `ኅዳር ${+d >= 12 && +d <= 18 ? d - 7 : d}`) : v;
  const date = (label, value = '') => (value = shift(value), `<div class="field f-date">${lab(label)}
    <span class="input date-btn" role="button"><input value="${value}" placeholder="ቀን ይምረጡ" readonly><span class="cal" aria-hidden="true"><span class="ms">calendar_month</span></span></span></div>`);

  // chips; "ሌላ" opens a text box (pass other=false to hide it)
  const choice = (label, options, value, otherPh = 'ይጻፉ…', cls = '', other = true) => {
    const isOther = other && value && !options.includes(value);
    const chosen = isOther ? 'ሌላ' : (value || options[0]);
    return `<div class="field f-choice ${cls}">${lab(label)}
      <div class="chips" data-single>${[...options, ...(other ? ['ሌላ'] : [])].map(o => `<button type="button" class="opt ${o === chosen ? 'on' : ''}">${o}</button>`).join('')}</div>
      ${other ? `<span class="reveal ${isOther ? 'show' : ''}"><span class="input mt-1"><input placeholder="${otherPh}" value="${isOther ? value : ''}"></span></span>` : ''}</div>`;
  };

  // chips where several can be chosen; "ሌላ" opens a text box
  const chipsMulti = (label, options, selected = [], otherPh = 'ይጻፉ…', cls = '') => {
    const others = selected.filter(s => !options.includes(s));
    return `<div class="field f-cmulti ${cls}">${lab(label, '· ከአንድ በላይ መምረጥ ይቻላል')}
      <div class="chips" data-multi>${[...options, 'ሌላ'].map(o => `<button type="button" class="opt ${selected.includes(o) || (o === 'ሌላ' && others.length) ? 'on' : ''}">${o === 'ሌላ' ? o : `<span class="ms tick">check</span>${o}`}</button>`).join('')}</div>
      <span class="reveal ${others.length ? 'show' : ''}"><span class="input mt-1"><input placeholder="${otherPh}" value="${others.join('፣ ')}"></span></span></div>`;
  };

  const multi = (label, options, selected = [], cls = '', hint = '') => `<div class="field f-multi ${cls}" data-opts='${JSON.stringify(options)}' data-sel='${JSON.stringify(selected)}'>${lab(label, hint)}
    <span class="input multi-btn" role="button"><span class="tags">${tagsHtml(selected)}</span><span class="ms" style="margin-left:auto">expand_more</span></span></div>`;

  // unit: 'ዓመት' or 'ባች'
  const year = (label, value = '', withExtra = true, unit = 'ዓመት') => {
    const opts = [1, 2, 3, 4, 5, 6, 7].map(n => `${n}ኛ ${unit}`).concat(withExtra ? ['ማስተርስ', 'ድኅረ ምረቃ'] : []);
    const isOther = value && !opts.includes(value);
    return `<div class="field">${lab(label)}
      <span class="input"><select class="f-year">${opts.map(o => `<option ${o === value ? 'selected' : ''}>${o}</option>`).join('')}<option value="other" ${isOther ? 'selected' : ''}>ሌላ…</option></select></span>
      <span class="reveal ${isOther ? 'show' : ''}"><span class="input mt-1"><input placeholder="ይጻፉ" value="${isOther ? value : ''}"></span></span></div>`;
  };

  // For መርሐ ግብር: assigned MK teacher, did they come, and if not who covered (Excel columns D, M–P)
  const assignedTeacher = (name = '', present = true, coverType = 'ተተኪ ሰባኪ', coverName = '', reason = '') => `<div class="field f-assigned">
    ${lab('የተመደቡት መምህር', '(ማኅበረ ቅዱሳን)')}
    <span class="input"><span class="ms">person</span><input class="t-name" placeholder="የመምህሩ ስም" value="${name}"></span>
    <div class="seg mt-1" data-present><button type="button" class="${present ? 'on' : ''}" data-v="1"><span class="ms">how_to_reg</span>ተገኝተዋል</button><button type="button" class="${present ? '' : 'on'}" data-v="0"><span class="ms">person_off</span>አልተገኙም</button></div>
    <div class="reveal cover ${present ? '' : 'show'}" style="--maxh:300px"><div class="cover-box">
      ${choice('መርሐ ግብሩን የሸፈነው', COVERED_BY, coverType, 'ማን እንደሸፈነ ይጻፉ', 'f-cover')}
      ${text('የሸፈነው መምህር', coverName, 'የመምህሩ ስም', '', 'person')}
      ${text('ያልተገኙበት ምክንያት', reason, 'ለምሳሌ፡ ታመዋል', '', 'help')}</div></div></div>`;

  const teacher = (label, type = 'ማ/ቅ መምህር', name = '', otherType = '') => `<div class="field f-teacher">${lab(label)}
    <div class="chips" data-single>${TEACHERS.map(t => `<button type="button" class="opt ${t === type ? 'on' : ''}">${t}</button>`).join('')}</div>
    <span class="reveal ${type === 'ሌላ' ? 'show' : ''}"><span class="input mt-1"><input placeholder="የመምህሩ ዓይነት" value="${otherType}"></span></span>
    <span class="input mt-1"><span class="ms">person</span><input class="t-name" placeholder="የመምህሩ ስም" value="${name}"></span></div>`;

  const text = (label, value = '', ph = '', cls = '', icon = '', hint = '') => `<label class="field">${lab(label, hint)}<span class="input">${icon ? `<span class="ms">${icon}</span>` : ''}<input class="${cls}" placeholder="${ph}" value="${value}"></span></label>`;
  const area = (label, value = '', ph = '', hint = '') => `<label class="field">${lab(label, hint)}<textarea class="input" placeholder="${ph}">${value}</textarea></label>`;
  // a small box of time rows: [['የታቀደው ሰዓት', '8:00 ጠዋት'], …]
  const times = rows => `<div class="att f-times" style="gap:0;padding:4px 12px">${rows.map(([l, v]) => `<div class="t-row"><span>${l}</span>
    <button type="button" class="t-val ${v ? '' : 'empty'}" data-v="${v || ''}"><b>${v || 'ይምረጡ'}</b><span class="ms">schedule</span></button></div>`).join('')}</div>`;
  const hours = (label, value = '') => `<label class="field">${lab(label)}<span class="input"><span class="ms">hourglass_top</span><input type="number" inputmode="decimal" min="0" value="${value}" placeholder="2"><span class="text-[13px]" style="color:var(--muted)">ሰዓት</span></span></label>`;

  const num = (cls, value = 0) => `<span class="numfield"><button type="button" data-step="-1"><span class="ms">remove</span></button>
    <input class="${cls}" type="number" inputmode="numeric" min="0" value="${value}"><button type="button" data-step="1"><span class="ms">add</span></button></span>`;

  const attendance = (m = 0, f = 0, title = 'የተገኙ አባላት') => `<div class="att f-att">
    <div class="subhead"><span class="flex items-center gap-1.5"><span class="ms" style="font-size:19px;color:var(--primary)">groups</span>${title}</span>
      <span class="att-total">ድምር <b class="a-t">${m + f}</b></span></div>
    <div class="att-grid">
      <div class="att-cell"><span class="att-lb"><span class="ms" style="color:var(--primary)">man</span>ወንድ</span>${num('a-m', m)}</div>
      <div class="att-cell"><span class="att-lb"><span class="ms" style="color:var(--gold)">woman</span>ሴት</span>${num('a-f', f)}</div>
    </div></div>`;

  const problems = (p = '', s = '', title = null) => `<div class="field">
    ${title ? `<div class="subhead"><span>${title}</span><small>አማራጭ</small></div>` : ''}
    ${lab('ያጋጠመ ችግር')}<textarea class="input" style="min-height:60px" placeholder="ችግሩን ይግለጹ…">${p}</textarea>
    ${lab('የተወሰደ መፍትሄ')}<textarea class="input" style="min-height:60px" placeholder="የተወሰደውን መፍትሄ ይጻፉ…">${s}</textarea></div>`;

  // a growing list of one or two text inputs per row (mezmur titles, mezmur + singer, agenda …)
  const rowHtml = (phs, vals = []) => `<div class="mini-row" style="grid-template-columns:${phs.map(() => 'minmax(0,1fr)').join(' ')} 36px">${phs.map((p, i) => `<span class="input"><input placeholder="${p}" value="${vals[i] ?? ''}"></span>`).join('')}<button type="button" class="rm" aria-label="አስወግድ"><span class="ms" style="font-size:19px">close</span></button></div>`;
  const list = (title, hint, phs, items = [], addLabel = 'ጨምር') => `<div class="field f-list" data-ph='${JSON.stringify(phs)}'>
    <div class="subhead"><span>${title}</span><small>${hint}</small></div>
    <div class="rows flex flex-col gap-2">${items.map(v => rowHtml(phs, v)).join('')}</div>
    <button type="button" class="link-add" data-add-row><span class="ms" style="font-size:19px">add_circle</span>${addLabel}</button></div>`;
  const mezmurList = (items = []) => list('መዝሙሮች', 'ከአንድ በላይ ይቻላል', ['የመዝሙሩ ርዕስ', 'ዘማሪ'], items, 'መዝሙር ጨምር');

  // optional fields tucked behind "+ ተጨማሪ"
  const more = (inner, label = 'ተጨማሪ መረጃ', open = false) => `<div class="more ${open ? 'open' : ''}">
    <button type="button" class="more-btn" data-more><span class="ms">add</span><span>${label}</span><small>አማራጭ</small></button>
    <div class="more-body">${inner}</div></div>`;

  /* ---------- behaviour (event delegation, works on any page) ---------- */
  document.addEventListener('click', e => {
    const cal = e.target.closest('.f-date .date-btn');
    if (cal) { const f = cal.closest('.f-date'); return datePicker(cal, f.querySelector('input')); }
    const tv = e.target.closest('.t-val');
    if (tv) return timePicker(tv);
    const mb = e.target.closest('.multi-btn');
    if (mb) return multiPicker(mb.closest('.f-multi'));
    const seg = e.target.closest('[data-present] button');
    if (seg) {
      seg.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === seg));
      seg.closest('.f-assigned').querySelector('.cover').classList.toggle('show', seg.dataset.v === '0');
      return changed(seg);
    }
    const om = e.target.closest('[data-multi] .opt');
    if (om) {
      om.classList.toggle('on');
      if (om.textContent === 'ሌላ') { const r = om.closest('.field').querySelector(':scope > .reveal'); r.classList.toggle('show', om.classList.contains('on')); if (om.classList.contains('on')) r.querySelector('input').focus(); }
      return changed(om);
    }
    const o = e.target.closest('[data-single] .opt');
    if (o) {
      o.parentElement.querySelectorAll('.opt').forEach(x => x.classList.toggle('on', x === o));
      const reveal = o.closest('.field').querySelector(':scope > .reveal');
      if (reveal) { reveal.classList.toggle('show', o.textContent === 'ሌላ'); if (o.textContent === 'ሌላ') reveal.querySelector('input').focus(); }
      return changed(o);
    }
    const step = e.target.closest('[data-step]');
    if (step) { const i = step.parentElement.querySelector('input'); i.value = Math.max(0, (+i.value || 0) + +step.dataset.step); return changed(i); }
    const addRow = e.target.closest('[data-add-row]');
    if (addRow) {
      const f = addRow.closest('.f-list'), rows = f.querySelector('.rows');
      rows.insertAdjacentHTML('beforeend', rowHtml(JSON.parse(f.dataset.ph))); rows.lastElementChild.querySelector('input').focus(); return changed(rows);
    }
    const rm = e.target.closest('.rm');
    if (rm) { const host = rm.closest('.f-list'); rm.parentElement.remove(); return changed(host); }
    const mo = e.target.closest('[data-more]');
    if (mo) mo.parentElement.classList.toggle('open');
  });
  document.addEventListener('change', e => {
    if (e.target.matches('.f-year')) e.target.closest('.field').querySelector('.reveal').classList.toggle('show', e.target.value === 'other');
  });
  document.addEventListener('input', e => changed(e.target));
  function changed(el) {
    if (!el || !el.closest) return;
    const att = el.closest('.f-att');
    if (att) att.querySelector('.a-t').textContent = (+att.querySelector('.a-m').value || 0) + (+att.querySelector('.a-f').value || 0);
    const card = el.closest('.rep');
    if (card && card._summary) card.querySelector('.summary').textContent = card._summary(card);
  }

  /* ---------- repeatable cards (e.g. መርሐ ግብር 1, 2, …) ---------- */
  function repeater({ list, addBtn, title, body, summary, items }) {
    const add = (data = {}, open = true) => {
      const i = list.children.length + 1;
      list.insertAdjacentHTML('beforeend', `<section class="card prog rep ${open ? '' : 'closed'}">
        <div class="prog-head"><div class="flex items-center gap-3 min-w-0"><span class="num">${i}</span>
          <div class="min-w-0"><div class="font-semibold text-[15px]">${title} ${i}</div><div class="text-[12.5px] truncate summary" style="color:var(--text-2)"></div></div></div>
          <span class="ms chev">expand_more</span></div>
        <div class="prog-body">${body(data)}
          <div class="rep-foot"><button type="button" class="rep-del"><span class="ms">delete</span>አስወግድ</button>
            <span class="rep-ask">ይወገድ?<button type="button" class="rep-no">ተመለስ</button><button type="button" class="rep-yes">አዎ፣ አስወግድ</button></span></div></div></section>`);
      const card = list.lastElementChild; card._summary = summary; changed(card.querySelector('.prog-body'));
      card.querySelector('.prog-head').onclick = () => card.classList.toggle('closed');
      const foot = card.querySelector('.rep-foot');
      foot.querySelector('.rep-del').onclick = () => foot.classList.add('ask');
      foot.querySelector('.rep-no').onclick = () => foot.classList.remove('ask');
      foot.querySelector('.rep-yes').onclick = () => { card.remove(); renumber(); };
      return card;
    };
    const renumber = () => [...list.children].forEach((c, i) => { c.querySelector('.num').textContent = i + 1; c.querySelector('.prog-head .font-semibold').textContent = `${title} ${i + 1}`; });
    items.forEach((d, i) => add(d, i === 0));
    if (addBtn) addBtn.onclick = () => { [...list.children].forEach(c => c.classList.add('closed')); add({}).scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  }

  // helpers for card summaries
  const val = (card, sel) => (card.querySelector(sel) || {}).value || '';
  const picked = (card, sel) => { const f = card.querySelector(sel); if (!f) return ''; const on = f.querySelector('.opt.on'); if (!on) return '';
    return on.textContent === 'ሌላ' ? (f.querySelector('.reveal input').value || 'ሌላ') : on.textContent; };
  const chipsOf = (card, sel) => card.querySelector(sel + '.f-multi') ? multiOf(card, sel) : [...card.querySelectorAll(sel + ' .opt.on')].map(o => o.textContent.replace(/^check/, '')).filter(x => x !== 'ሌላ');
  const multiOf = (card, sel) => JSON.parse((card.querySelector(sel) || { dataset: { sel: '[]' } }).dataset.sel || '[]');
  const teacherOf = card => picked(card, '.f-teacher');
  const absent = card => { const b = card.querySelector('[data-present] .on'); return b && b.dataset.v === '0'; };
  const total = card => card.querySelector('.a-t') ? card.querySelector('.a-t').textContent : '0';

  return { RETURNED, date, times, choice, chipsMulti, chipsOf, batch, multi, year, assignedTeacher, teacher, text, area, hours, attendance, problems, list, mezmurList, more,
           repeater, monthPicker, val, picked, multiOf, teacherOf, absent, total, MONTHS };
})();
