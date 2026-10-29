// Tap-to-translate reader shared by pages with transcripts.
// Words, pinyin and meanings come from a pre-built words.json (jieba + pypinyin + CC-CEDICT, CC BY-SA 4.0).
// Saved words live in localStorage "hsk-words" and are listed on /kata/.
(function () {
  const KEY = 'hsk-words';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let DATA = { seg: {}, dict: {} }, SRC = '';

  const CSS = `.hw{cursor:pointer;border-radius:3px;padding:0 1px;ruby-position:over}
.hw:hover,.hw.sel{background:var(--onbg)}.hw rt{font:.62em "Public Sans",system-ui,sans-serif;color:var(--mute);letter-spacing:0}
.hw.saved{text-decoration:underline dotted var(--on);text-underline-offset:4px}
.hr-nopy .hw rt{display:none}
.hr-pop{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);width:min(92vw,420px);z-index:50;background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:14px 16px}
.hr-pop .x{position:absolute;right:8px;top:6px;border:0;background:none;font-size:1.4rem;color:var(--mute);cursor:pointer;line-height:1}
.hr-pop .w{font:700 1.8rem "Noto Serif SC",serif}.hr-pop .p{color:var(--on);font-weight:600;margin:2px 0 6px}
.hr-pop ol{margin:0 0 10px;padding-left:20px;max-height:30vh;overflow:auto}.hr-pop .b{display:flex;gap:8px}
.hr-pop .b button{flex:1;font:inherit;font-weight:700;border-radius:8px;padding:9px;cursor:pointer;border:1px solid var(--on);background:none;color:var(--on)}
.hr-pop .b .sv{background:var(--on);color:var(--paper)}.hr-pop .b .sv.done{background:var(--onbg);color:var(--on)}
.hr-pop .lk{display:block;margin-top:8px;font-size:.85rem;color:var(--mute)}`;

  function load(url, source) {
    SRC = source || document.title;
    if (!document.getElementById('hr-css')) { const s = document.createElement('style'); s.id = 'hr-css'; s.textContent = CSS; document.head.appendChild(s); }
    return fetch(url).then(r => r.json()).then(d => { DATA = d; return d; }).catch(() => DATA);
  }
  const saved = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const store = a => { try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch (e) { return false; } };
  const isSaved = w => saved().some(x => x.w === w);

  // Text -> ruby markup. Falls back to plain text when the sentence is not in words.json.
  function html(text) {
    const toks = DATA.seg[text];
    if (!toks) return esc(text);
    const sv = new Set(saved().map(x => x.w));
    return toks.map(t => t.length < 2 ? esc(t[0]) :
      `<ruby class="hw${sv.has(t[0]) ? ' saved' : ''}" data-w="${esc(t[0])}" data-p="${esc(t[1])}">${esc(t[0])}<rt>${esc(t[1])}</rt></ruby>`).join('');
  }

  let pop = null, cur = null;
  function close() { if (pop) pop.remove(); pop = null; document.querySelectorAll('.hw.sel').forEach(x => x.classList.remove('sel')); }
  function speak(w) {
    try { const u = new SpeechSynthesisUtterance(w); u.lang = 'zh-CN'; u.rate = .8; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
  }
  function open(el) {
    close(); el.classList.add('sel');
    const w = el.dataset.w, p = el.dataset.p, d = DATA.dict[w] || [];
    cur = { w, p, d };
    pop = document.createElement('div'); pop.className = 'hr-pop'; pop.setAttribute('role', 'dialog');
    const sv = isSaved(w);
    pop.innerHTML = `<button class="x" type="button" aria-label="Tutup">×</button><div class="w">${esc(w)}</div><div class="p">${esc(p)}</div>
<ol>${d.map(x => `<li>${esc(x.trim())}</li>`).join('')}</ol>
<div class="b"><button type="button" class="sp">🔊 Dengar</button><button type="button" class="sv${sv ? ' done' : ''}">${sv ? '✓ Tersimpan' : '＋ Simpan kata'}</button></div>
<a class="lk" href="/kata/">Lihat kosakata tersimpan →</a>`;
    document.body.appendChild(pop);
    pop.querySelector('.x').onclick = close;
    pop.querySelector('.sp').onclick = () => speak(w);
    pop.querySelector('.sv').onclick = e => {
      const a = saved(), i = a.findIndex(x => x.w === w);
      if (i >= 0) a.splice(i, 1); else a.unshift({ w, p, d: d.slice(0, 3).map(x => x.trim()).join('; '), src: SRC, ctx: el.closest('[data-ctx]')?.dataset.ctx || '', date: new Date().toISOString().slice(0, 10) });
      store(a);
      const on = i < 0; e.target.classList.toggle('done', on); e.target.textContent = on ? '✓ Tersimpan' : '＋ Simpan kata';
      document.querySelectorAll(`.hw[data-w="${CSS_ESC(w)}"]`).forEach(x => x.classList.toggle('saved', on));
    };
  }
  const CSS_ESC = s => (window.CSS && CSS.escape) ? CSS.escape(s) : s.replace(/"/g, '\\"');
  document.addEventListener('click', e => {
    const el = e.target.closest('.hw');
    if (el) { e.preventDefault(); e.stopPropagation(); open(el); return; }
    if (pop && !e.target.closest('.hr-pop')) close();
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  window.HR = { load, html, saved, store, speak, pinyin: on => document.body.classList.toggle('hr-nopy', !on) };
})();
