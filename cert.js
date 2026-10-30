// Section picker + practice certificate shared by all test pages.
// A page calls CERT.setup({level, title, sections:[{key, zh, en, id, stage, items:()=>[{n,kind,min}], available?:()=>bool}]})
// kind: 'auto' (engine ok(n)), 'check' (teacher/self tick M[n]), 'essay' (self rubric).
// Certificates are kept in localStorage "hsk-certs" and listed on /sertifikat/.
(function () {
  const KEY = 'hsk-certs';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const zc = s => (String(s || '').match(/[㐀-鿿]/g) || []).length;
  const MODE = { full: ['综合', 'Full test', 'Lengkap'], L: ['听力', 'Listening', 'Listening saja'], R: ['阅读', 'Reading', 'Reading saja'], W: ['书写', 'Writing', 'Menulis saja'] };
  let C = null, mode = 'full', RUB = {};

  const certs = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const store = a => { try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch (e) { return false; } };

  function setup(cfg) { C = cfg; mode = 'full'; injectCSS(); }
  const secs = () => C.sections.filter(s => !s.available || s.available());
  const chosen = () => mode === 'full' ? secs() : secs().filter(s => s.key === mode);

  function picker() {
    const opts = [['full', `<b>Lengkap</b> · semua bagian`]].concat(C.sections.map(s => {
      const ok = !s.available || s.available();
      return [s.key, `<b>${MODE[s.key][2]}</b> · <span class="zh">${s.zh}</span>${ok ? '' : ' · audio belum tersedia'}`, !ok];
    }));
    return `<fieldset class="ct-pick"><legend>Pilih bagian yang mau dikerjakan</legend>${opts.map(([k, l, dis]) =>
      `<label class="${dis ? 'dis' : ''}"><input type="radio" name="ct-mode" value="${k}"${k === mode ? ' checked' : ''}${dis ? ' disabled' : ''} onchange="CERT.mode(this.value)"> ${l}</label>`).join('')}
<p>Selesai mengerjakan, kamu dapat nilai dan sertifikat latihan yang tersimpan di <a href="/sertifikat/">Sertifikat saya</a>.</p></fieldset>`;
  }
  function setMode(m) { mode = m; }
  function start() { RUB = {}; }
  function first() { return chosen()[0].stage; }
  function after(stage) { const st = chosen().map(s => s.stage).filter(x => x > stage); return st.length ? st[0] : null; }

  // ----- scoring -----
  function itemScore(it) {
    const AA = typeof A !== 'undefined' ? A : {}, a = AA[it.n], ans = typeof a === 'string' ? a.trim() : a;
    if (it.kind === 'essay') { const r = RUB[it.n] || {}; const len = zc(a) >= it.min ? 1 : 0; return { v: ans ? (len + (r.t ? 1 : 0) + (r.g ? 1 : 0) + (r.k ? 1 : 0)) / 4 : 0, ans: !!ans, counted: false }; }
    if (it.kind === 'check') return { v: (typeof M !== 'undefined' ? M : {})[it.n] ? 1 : 0, ans: !!ans, counted: true };
    return { v: ok(it.n) ? 1 : 0, ans: !!ans, counted: true };
  }
  function compute() {
    let right = 0, wrong = 0, skip = 0;
    const rows = chosen().map(s => {
      const its = s.items(); let sum = 0;
      its.forEach(it => { const r = itemScore(it); sum += r.v; if (r.counted) { if (!r.ans) skip++; else if (r.v) right++; else wrong++; } });
      return { key: s.key, zh: s.zh, en: s.en, pts: its.length ? Math.round(100 * sum / its.length) : 0, n: its.length };
    });
    const total = rows.reduce((a, r) => a + r.pts, 0), max = rows.length * 100;
    return { rows, total, max, right, wrong, skip };
  }
  const manual = () => chosen().some(s => s.items().some(it => it.kind !== 'auto'));
  const inChosen = n => chosen().some(s => s.items().some(it => it.n == n) || (s.range && n >= s.range[0] && n <= s.range[1]));

  // ----- result page -----
  function finish() {
    const res = document.getElementById('res'); if (!res) return;
    if (mode !== 'full') {
      const sum = document.getElementById('sum'); if (sum) sum.hidden = true;
      document.querySelectorAll('#app tbody tr').forEach(tr => { const n = parseInt(tr.cells[0]?.textContent); if (n && !inChosen(n)) tr.hidden = true; });
    }
    const box = document.createElement('section'); box.className = 'paper ct-box'; box.id = 'ct';
    res.parentNode.insertBefore(box, res);
    if (manual()) renderGrade(box); else issue(box);
  }
  function renderGrade(box) {
    const essays = chosen().flatMap(s => s.items().filter(it => it.kind === 'essay'));
    const checks = chosen().flatMap(s => s.items().filter(it => it.kind === 'check'));
    box.innerHTML = `<h2>Nilai bagian menulis, lalu terbitkan sertifikat</h2>
<p class="note">Bagian ini tidak bisa dinilai otomatis.${checks.length ? ` Centang <b>Sesuai</b> di tabel jawaban untuk soal ${checks[0].n}–${checks[checks.length - 1].n} yang benar.` : ''}${essays.length ? ' Untuk setiap karangan, centang kriteria yang terpenuhi (jumlah karakter dicek otomatis).' : ''}</p>
${essays.map(it => { const n = zc((typeof A !== 'undefined' ? A : {})[it.n]); return `<div class="ct-rub"><b>Soal ${it.n}</b> · ${n} karakter (minimal ${it.min})
<label><input type="checkbox" disabled ${n >= it.min ? 'checked' : ''}> Jumlah karakter cukup</label>
<label><input type="checkbox" data-r="${it.n}" data-c="t"> Sesuai topik / gambar</label>
<label><input type="checkbox" data-r="${it.n}" data-c="g"> Tata bahasa umumnya benar</label>
<label><input type="checkbox" data-r="${it.n}" data-c="k"> Kosakata bervariasi</label></div>`; }).join('')}
<button class="go" type="button" id="ct-issue">Terbitkan sertifikat</button>`;
    box.addEventListener('change', e => { const r = e.target.dataset.r; if (r) { (RUB[r] = RUB[r] || {})[e.target.dataset.c] = e.target.checked; } });
    box.querySelector('#ct-issue').onclick = () => issue(box);
  }
  function issue(box) {
    const s = compute(), d = new Date();
    const cert = { id: d.getTime().toString(36), date: d.toISOString(), level: C.level, title: C.title, testId: C.testId || '', name: (typeof U !== 'undefined' && U.nama) || '—', mode,
      rows: s.rows.map(r => ({ zh: r.zh, en: r.en, pts: r.pts })), total: s.total, max: s.max, right: s.right, wrong: s.wrong, skip: s.skip };
    const a = certs(); a.unshift(cert); store(a);
    box.innerHTML = `<h2>Sertifikat latihan</h2><div class="ct-img"><canvas></canvas></div>
<div class="ct-act"><button class="go" type="button" id="ct-dl">Unduh sertifikat</button><a class="ct-link" href="/sertifikat/">Lihat semua sertifikat saya →</a></div>`;
    const cv = box.querySelector('canvas');
    draw(cert, cv).then(() => { box.querySelector('#ct-dl').onclick = () => download(cert, cv); });
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ----- certificate image -----
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function fit(g, t, maxW, size, weight, fam) { let s = size; do { g.font = `${weight} ${s}px ${fam}`; s -= 2; } while (g.measureText(t).width > maxW && s > 12); }
  const SANS = '"Public Sans", "Segoe UI", system-ui, sans-serif', ZH = '"Noto Sans SC", "Noto Serif SC", "PingFang SC", "Microsoft YaHei", sans-serif';
  async function draw(c, cv) {
    try { await Promise.all([document.fonts.load('700 40px "Noto Serif SC"'), document.fonts.load('700 40px "Public Sans"')]); } catch (e) {}
    const W = 1024, rows = c.rows.length + (c.rows.length > 1 ? 1 : 0), H = 1545 + rows * 118;
    cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.textAlign = 'center'; g.textBaseline = 'middle';
    const ORG = '#ef7d17', GOLD = '#e3a733', INK = '#1f2933', MUT = '#6b7280';
    g.fillStyle = '#f6f8fb'; g.fillRect(0, 0, W, H);
    g.fillStyle = INK; g.font = `800 64px ${SANS}`; g.fillText('Practice Test Result', W / 2, 70);
    g.fillStyle = '#fdecc8'; rr(g, W / 2 - 190, 105, 380, 60, 30); g.fill(); g.fillStyle = ORG; g.font = `700 32px ${ZH}`; g.fillText('SIMULASI · 模拟成绩', W / 2, 136);
    g.fillStyle = '#d3f5dd'; rr(g, 36, 190, W - 72, 200, 26); g.fill();
    g.fillStyle = '#0b4d33'; fit(g, `${c.total}/${c.max} POINTS`, W - 140, 104, 900, SANS); g.fillText(`${c.total}/${c.max} POINTS`, W / 2, 268);
    g.fillStyle = '#374151'; g.font = `400 34px ${SANS}`; g.fillText(`${c.mode === 'full' ? 'Full test' : MODE[c.mode][1]} practice completed`, W / 2, 348);
    const tiles = [['Right', c.right, '#cff3e3', '#17785a'], ['Skip', c.skip, '#e6e9ee', '#374151'], ['Wrong', c.wrong, '#ffd2d2', '#b42318']], tw = (W - 72 - 40) / 3;
    tiles.forEach(([l, v, bg, fg], i) => { const x = 36 + i * (tw + 20); g.fillStyle = bg; rr(g, x, 415, tw, 130, 20); g.fill(); g.fillStyle = fg; g.font = `500 32px ${SANS}`; g.fillText(l, x + tw / 2, 452); g.fillStyle = INK; g.font = `800 52px ${SANS}`; g.fillText(String(v), x + tw / 2, 506); });
    // certificate frame
    const fy = 575, fh = H - fy - 30; g.fillStyle = '#fff'; g.fillRect(40, fy, W - 80, fh);
    g.strokeStyle = GOLD; g.lineWidth = 5; g.strokeRect(46, fy + 6, W - 92, fh - 12); g.lineWidth = 2; g.strokeRect(60, fy + 20, W - 120, fh - 40);
    [[60, fy + 20], [W - 60, fy + 20], [60, fy + fh - 20], [W - 60, fy + fh - 20]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 18, 0, 7); g.fillStyle = '#fff'; g.fill(); g.stroke(); g.beginPath(); g.arc(x, y, 8, 0, 7); g.stroke(); });
    g.fillStyle = '#fff'; g.fillRect(W / 2 - 46, fy + 10, 92, 20); g.font = `700 22px ${SANS}`; g.fillStyle = GOLD; g.fillText('◇◇◇', W / 2, fy + 20);
    let y = fy + 105;
    g.fillStyle = ORG; g.font = `900 70px ${ZH}`; g.fillText('汉语水平考试', W / 2, y); y += 80;
    g.font = `800 50px ${SANS}`; g.fillText('Chinese Proficiency Test', W / 2, y); y += 66;
    g.font = `800 42px ${ZH}`; fit(g, `HSK ${c.level} ${c.mode === 'full' ? '' : MODE[c.mode][0]}模拟成绩报告`, W - 200, 42, 800, ZH); g.fillText(`HSK ${c.level} ${c.mode === 'full' ? '' : MODE[c.mode][0]}模拟成绩报告`, W / 2, y); y += 84;
    g.textAlign = 'left';
    const line = (lab, val) => { g.fillStyle = MUT; g.font = `400 34px ${ZH}`; g.fillText(lab, 110, y); const w = g.measureText(lab).width; g.fillStyle = INK; fit(g, val, W - 230 - w, 38, 700, ZH); g.fillText(val, 120 + w, y); y += 64; };
    line('名字 / Name:', c.name); line('考试 / Test:', `${c.title} · ${c.mode === 'full' ? 'Full test' : MODE[c.mode][1]}`);
    y += 10; g.textAlign = 'center';
    const tx = 110, tW = W - 220, cw = tW / 3, hh = 118;
    const cell = (x, yy, w, h, bg) => { g.fillStyle = bg; g.fillRect(x, yy, w, h); g.strokeStyle = '#f2cf6b'; g.lineWidth = 3; g.strokeRect(x, yy, w, h); };
    const two = (a, b, x, yy) => { g.fillStyle = INK; g.font = `700 34px ${ZH}`; g.fillText(a, x, yy - 20); g.font = `700 32px ${SANS}`; g.fillText(b, x, yy + 20); };
    [['部分', 'Section'], ['总分', 'Total Score'], ['得分', 'Your Score']].forEach(([a, b], i) => { cell(tx + i * cw, y, cw, hh, '#fdf3d6'); two(a, b, tx + i * cw + cw / 2, y + hh / 2); });
    y += hh;
    const body = c.rows.map(r => [r.zh, r.en, '100', String(r.pts)]); if (c.rows.length > 1) body.push(['总计', 'Total', String(c.max), String(c.total)]);
    body.forEach(([a, b, t, p]) => { [0, 1, 2].forEach(i => cell(tx + i * cw, y, cw, hh, '#fffaf0')); two(a, b, tx + cw / 2, y + hh / 2); g.font = `700 40px ${SANS}`; g.fillStyle = INK; g.fillText(t, tx + cw * 1.5, y + hh / 2); g.fillText(p, tx + cw * 2.5, y + hh / 2); y += hh; });
    y += 30; const n = c.right + c.wrong + c.skip, acc = n ? (100 * c.right / n) : 0;
    g.fillStyle = '#fff6ea'; rr(g, 110, y, W - 220, 74, 37); g.fill();
    const accTxt = n ? `${c.right}/${n} jawaban benar · Akurasi ${acc.toFixed(2).replace('.', ',')}%` : 'Bagian menulis dinilai mandiri';
    g.fillStyle = ORG; fit(g, accTxt, W - 260, 34, 700, SANS); g.fillText(accTxt, W / 2, y + 38); y += 124;
    const pass = c.total >= c.max * .6;
    g.fillStyle = ORG; g.font = `900 46px ${ZH}`; g.fillText(pass ? '合格 · PASSED' : '练习完成 · KEEP GROWING', W / 2, y); y += 64;
    g.fillStyle = MUT; g.font = `400 24px ${SANS}`;
    g.fillText(`Personal practice record · Bukan hasil resmi HSK · ${new Date(c.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, W / 2, y); y += 36;
    g.fillText('Nilai per bagian = persentase jawaban benar, dibulatkan. Lulus latihan: ≥ 60%.', W / 2, y);
  }
  function download(c, cv) {
    const a = document.createElement('a'); a.download = `sertifikat-hsk${c.level}-${(c.name || 'latihan').replace(/\W+/g, '-').toLowerCase()}-${c.date.slice(0, 10)}.png`;
    a.href = cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
  }

  function injectCSS() {
    if (document.getElementById('ct-css')) return;
    const s = document.createElement('style'); s.id = 'ct-css';
    s.textContent = `.ct-pick{max-width:460px;margin:0 auto 18px;text-align:left;border:1px solid var(--line);border-radius:8px;padding:10px 14px}
.ct-pick legend{font-weight:700;padding:0 6px}.ct-pick label{display:flex;gap:8px;align-items:center;padding:6px 0;cursor:pointer}.ct-pick label.dis{opacity:.5;cursor:not-allowed}
.ct-pick input{accent-color:var(--on);width:18px;height:18px}.ct-pick p{font-size:.85rem;color:var(--mute);margin:6px 0 0}
.ct-box h2{margin-top:0}.ct-img canvas{width:100%;max-width:520px;height:auto;display:block;margin:0 auto;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.12)}
.ct-act{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center;margin-top:14px}.ct-link{color:var(--on)}
.ct-rub{border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin:8px 0;display:grid;gap:4px}.ct-rub label{display:flex;gap:8px;align-items:center}`;
    document.head.appendChild(s);
  }

  // keep the mistake log to the sections the user actually did
  function wrapLog() {
    if (!window.HSKLog || HSKLog._ct) return;
    const orig = HSKLog.render; HSKLog._ct = true;
    HSKLog.render = (host, opt) => orig(host, Object.assign({}, opt, { items: (opt.items || []).filter(it => !C || inChosen(it.q)) }));
  }
  document.addEventListener('DOMContentLoaded', wrapLog); wrapLog();

  const items = (a, b, kind = 'auto', min = 0) => Array.from({ length: b - a + 1 }, (_, i) => ({ n: a + i, kind, min }));
  window.CERT = { items, setup, picker, mode: setMode, start, first, after, finish, certs, store, draw, download, MODE, get current() { return mode; } };
})();
