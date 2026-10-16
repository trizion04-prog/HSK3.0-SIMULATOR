// Mistake log shared by every level. Saves to this device (localStorage) and,
// when online, sends a copy to the Netlify form "log-kesalahan".
(function () {
  const KEY = 'hsk-log';
  const COLS = ['date', 'level', 'section', 'question', 'my_answer', 'correct_answer', 'why_I_missed_it', 'what_to_review', 'review_date'];
  const WHY = ['Tidak dijawab', 'Tidak tahu kosakata', 'Tidak paham tata bahasa', 'Salah dengar / audio terlalu cepat', 'Salah baca soal', 'Kehabisan waktu', 'Ragu-ragu, menebak', 'Kurang teliti'];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ymd = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const plus = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(rows) { try { localStorage.setItem(KEY, JSON.stringify(rows)); return true; } catch (e) { return false; } }

  function toCSV(rows) {
    const q = v => { v = String(v ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return [COLS.join(',')].concat(rows.map(r => COLS.map(c => q(r[c])).join(','))).join('\n');
  }
  function download(rows, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + toCSV(rows)], { type: 'text/csv;charset=utf-8' }));
    a.download = name || 'hsk-log.csv'; document.body.appendChild(a); a.click(); a.remove();
  }

  const CSS = `.lg{display:grid;gap:10px;margin-top:10px}.lg-i{border:1px solid var(--line);border-left:4px solid var(--red);border-radius:6px;padding:10px 12px}
.lg-h{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:baseline}.lg-h b{font-size:1.05rem}.lg-h span{color:var(--mute);font-size:.9rem}
.lg-t{margin:4px 0 8px}.lg-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}
.lg-f label{display:grid;gap:2px;font-size:.85rem;color:var(--mute)}.lg-f input{font:inherit;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:7px 8px}
.lg-b{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}.lg-b button{font:inherit;font-weight:700;border-radius:6px;padding:9px 18px;cursor:pointer;border:1px solid var(--on)}
.lg-b .p{background:var(--on);color:var(--paper)}.lg-b .s{background:none;color:var(--on)}.lg-b a{color:var(--on)}.lg-ok{font-weight:600;color:var(--ok,#1b7a3d)}`;

  // items: [{section, q, text, my, key}]
  function render(host, opt) {
    if (!document.getElementById('lg-css')) { const s = document.createElement('style'); s.id = 'lg-css'; s.textContent = CSS; document.head.appendChild(s); }
    const today = ymd(new Date()), items = opt.items;
    const sec = document.createElement('section'); sec.className = 'paper';
    if (!items.length) { sec.innerHTML = '<h2>Log kesalahan</h2><p class="note">Tidak ada jawaban salah di bagian yang dinilai otomatis. Hebat!</p>'; host.after(sec); return; }
    sec.innerHTML = `<h2>Log kesalahan · ${items.length} soal</h2>
<p class="note">Isi alasan salah dan apa yang perlu diulang, lalu tekan <b>Simpan ke log</b>. Log tersimpan di perangkat ini dan bisa dibuka lagi dari halaman <a href="/log/">Log kesalahan</a>.</p>
<datalist id="lg-why">${WHY.map(w => `<option value="${esc(w)}">`).join('')}</datalist>
<div class="lg">${items.map((it, i) => `<div class="lg-i" data-i="${i}"><div class="lg-h"><b>Soal ${it.q}</b><span>${esc(it.section)}</span><span>Jawabanmu: <b>${esc(it.my || '–')}</b></span><span>Benar: <b>${esc(it.key)}</b></span></div>
${it.text ? `<div class="lg-t zh">${esc(it.text)}</div>` : ''}<div class="lg-f"><label>Kenapa salah<input list="lg-why" data-f="why_I_missed_it" placeholder="Pilih atau tulis sendiri" value="${it.my ? '' : 'Tidak dijawab'}"></label>
<label>Yang perlu diulang<input data-f="what_to_review" placeholder="mis. kosakata 天气"></label><label>Tanggal review<input type="date" data-f="review_date" value="${plus(3)}"></label></div></div>`).join('')}</div>
<div class="lg-b"><button class="p" type="button" data-a="save">Simpan ke log</button><button class="s" type="button" data-a="csv">Unduh CSV</button><span class="lg-msg"></span></div>`;
    host.after(sec);
    const rows = () => [...sec.querySelectorAll('.lg-i')].map(el => {
      const it = items[el.dataset.i], v = f => el.querySelector(`[data-f="${f}"]`).value.trim();
      return { date: today, level: opt.level, section: it.section, question: String(it.q) + (it.text ? ' · ' + it.text.slice(0, 60) : ''), my_answer: it.my || '', correct_answer: it.key,
        why_I_missed_it: v('why_I_missed_it'), what_to_review: v('what_to_review'), review_date: v('review_date') };
    });
    let savedAt = -1; const msg = sec.querySelector('.lg-msg');
    sec.addEventListener('click', e => {
      const a = e.target.dataset && e.target.dataset.a; if (!a) return;
      const r = rows();
      if (a === 'csv') return download(r, `hsk-log-${opt.level.replace(/\s+/g, '').toLowerCase()}-${today}.csv`);
      const all = load(); if (savedAt >= 0) all.splice(savedAt, r.length); savedAt = all.length; all.push(...r);
      const ok = save(all);
      msg.className = 'lg-msg lg-ok'; msg.textContent = ok ? `✓ ${r.length} catatan tersimpan.` : 'Gagal menyimpan di perangkat ini. Gunakan Unduh CSV.';
      e.target.textContent = 'Simpan perubahan';
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'form-name': 'log-kesalahan', nama: opt.name || '', level: opt.level, tanggal: today, jumlah: String(r.length), csv: toCSV(r) }).toString() }).catch(() => {});
    });
  }

  window.HSKLog = { render, load, save, toCSV, download, COLS };
})();
