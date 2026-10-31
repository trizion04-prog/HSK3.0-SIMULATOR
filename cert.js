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
    try { await Promise.all([document.fonts.load('900 40px "Noto Serif SC"'), document.fonts.load('700 40px "Noto Serif SC"'), document.fonts.load('700 40px "Public Sans"')]); } catch (e) {}
    const W = 1400, H = 990; cv.width = W; cv.height = H;
    const g = cv.getContext('2d'); g.textBaseline = 'middle'; g.textAlign = 'center';
    const RED = '#9f1d20', GOLD = '#b8892d', INK = '#2a2118', MUT = '#7a6a55', PAPER = '#fdf8ec', SERIF = '"Noto Serif SC", "Songti SC", "SimSun", serif';
    const LV = ['', '一', '二', '三', '四', '五', '六'][c.level] || c.level, mt = c.mode === 'full' ? ['综合', 'Full test'] : MODE[c.mode];
    // paper, red band with gold fret pattern, double gold rule
    g.fillStyle = RED; g.fillRect(24, 24, W - 48, H - 48); g.fillStyle = PAPER; g.fillRect(52, 52, W - 104, H - 104);
    g.strokeStyle = GOLD; g.lineWidth = 2;
    const fret = (x, y) => { g.strokeRect(x - 8, y - 8, 16, 16); g.strokeRect(x - 3, y - 3, 6, 6); };
    for (let x = 38; x <= W - 30; x += 24) { fret(x, 38); fret(x, H - 38); }
    for (let y = 62; y <= H - 54; y += 24) { fret(38, y); fret(W - 38, y); }
    g.lineWidth = 3; g.strokeRect(66, 66, W - 132, H - 132); g.lineWidth = 1; g.strokeRect(74, 74, W - 148, H - 148);
    const dia = (x, y, s) => { g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.closePath(); g.fill(); };
    g.fillStyle = GOLD; [[66, 66], [W - 66, 66], [66, H - 66], [W - 66, H - 66]].forEach(([x, y]) => dia(x, y, 12));
    // watermark
    g.save(); g.globalAlpha = .05; g.fillStyle = RED; g.font = `900 360px ${SERIF}`; g.fillText('模拟', W / 2, H / 2 + 50); g.restore();
    // heading
    g.fillStyle = RED; g.font = `900 66px ${SERIF}`; g.fillText('汉语水平考试', W / 2, 140);
    g.fillStyle = INK; g.font = `700 32px ${SERIF}`; g.fillText('HSK 模拟考试 · 成绩证书', W / 2, 204);
    g.fillStyle = MUT; g.font = `700 20px ${SANS}`; g.fillText('CHINESE PROFICIENCY TEST  ·  PRACTICE SCORE CERTIFICATE', W / 2, 244);
    g.strokeStyle = GOLD; g.lineWidth = 2; g.beginPath(); g.moveTo(300, 278); g.lineTo(W / 2 - 22, 278); g.moveTo(W / 2 + 22, 278); g.lineTo(W - 300, 278); g.stroke(); g.fillStyle = GOLD; dia(W / 2, 278, 9);
    // candidate details
    g.textAlign = 'left'; let y = 340; const x0 = 120, vx = x0 + 180, vw = 720 - vx;
    [['姓名', 'Name', c.name], ['等级', 'Level', `HSK ${LV}级 · Level ${c.level}`], ['考试', 'Test', c.title], ['类型', 'Section', `${mt[0]} · ${mt[1]}`],
     ['日期', 'Date', new Date(c.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })], ['编号', 'No.', 'SIM-' + c.id.toUpperCase()]].forEach(([zh, en, v]) => {
      g.fillStyle = INK; g.font = `700 24px ${SERIF}`; g.fillText(zh, x0, y - 8); g.fillStyle = MUT; g.font = `500 16px ${SANS}`; g.fillText(en, x0, y + 18);
      g.fillStyle = INK; fit(g, String(v), vw, 28, 700, SERIF); g.fillText(String(v), vx, y);
      g.strokeStyle = '#e3d4b4'; g.lineWidth = 1; g.beginPath(); g.moveTo(vx, y + 26); g.lineTo(720, y + 26); g.stroke(); y += 66; });
    // score table
    const tx = 790, cw = [250, 120, 120], th = 54, rh = 58; y = 316;
    const row = (cells, h, bg, fg, font) => { let x = tx; cells.forEach((t, i) => { g.fillStyle = bg; g.fillRect(x, y, cw[i], h); g.strokeStyle = GOLD; g.lineWidth = 1.5; g.strokeRect(x, y, cw[i], h);
      g.fillStyle = fg; g.textAlign = i ? 'center' : 'left'; fit(g, t, cw[i] - 24, +font.split(' ')[1], font.split(' ')[0], i ? SANS : SERIF); g.fillText(t, i ? x + cw[i] / 2 : x + 16, y + h / 2); x += cw[i]; }); y += h; };
    row(['科目 Section', '满分 Max', '成绩 Score'], th, RED, '#fff', '700 20');
    c.rows.forEach((r, i) => row([`${r.zh} ${r.en}`, '100', String(r.pts)], rh, i % 2 ? '#f7eedb' : '#fffaf0', INK, '700 24'));
    if (c.rows.length > 1) row(['总分 Total', String(c.max), String(c.total)], rh, '#f1dfb4', RED, '800 26');
    const pct = Math.round(100 * c.total / c.max), pass = c.total >= c.max * .6;
    g.textAlign = 'center'; g.fillStyle = RED; g.font = `900 64px ${SANS}`; g.fillText(`${c.total} / ${c.max}`, tx + 245, y + 60);
    g.fillStyle = MUT; g.font = `500 20px ${SANS}`; g.fillText(`${pct}% · lulus latihan ≥ 60%`, tx + 245, y + 106);
    // result + accuracy
    g.textAlign = 'left'; g.fillStyle = RED; fit(g, pass ? '合格 · PASSED' : '继续努力 · KEEP PRACTISING', 600, 44, 900, SERIF); g.fillText(pass ? '合格 · PASSED' : '继续努力 · KEEP PRACTISING', x0, 780);
    const n = c.right + c.wrong + c.skip;
    g.fillStyle = MUT; g.font = `500 20px ${SANS}`; g.fillText(n ? `${c.right} benar · ${c.wrong} salah · ${c.skip} kosong dari ${n} soal` : 'Bagian menulis dinilai mandiri', x0, 828);
    // signature
    g.textAlign = 'center'; g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(760, 830); g.lineTo(1020, 830); g.stroke();
    g.fillStyle = INK; g.font = `italic 700 28px ${SANS}`; g.fillText('HSK Simulator', 890, 806); g.fillStyle = MUT; g.font = `500 16px ${SANS}`; g.fillText('模拟考试系统 · Practice system', 890, 852);
    // practice stamp
    const sx = 1180, sy = 800, sr = 82; g.save(); g.globalAlpha = .85; g.strokeStyle = g.fillStyle = '#c8202a';
    g.lineWidth = 5; g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.arc(sx, sy, sr - 10, 0, 7); g.stroke();
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 26; g.lineTo(sx + r * Math.cos(a), sy + r * Math.sin(a)); } g.closePath(); g.fill();
    const arc = (t, mid, span, r, dir) => [...t].forEach((ch, i) => { const a = mid + dir * (i / (t.length - 1) - .5) * span; g.save(); g.translate(sx + r * Math.cos(a), sy + r * Math.sin(a)); g.rotate(a + dir * Math.PI / 2); g.fillText(ch, 0, 0); g.restore(); });
    g.font = `900 22px ${SERIF}`; arc('模拟练习专用章', -Math.PI / 2, Math.PI * .95, sr - 28, 1);
    g.font = `800 13px ${SANS}`; arc('PRACTICE ONLY', Math.PI / 2, Math.PI * .7, sr - 24, -1); g.restore();
    // disclaimer
    g.fillStyle = MUT; fit(g, 'Sertifikat latihan dari HSK Simulator · Bukan sertifikat resmi HSK dan tidak berlaku sebagai bukti kemampuan bahasa Mandarin.', W - 220, 17, 500, SANS);
    g.fillText('Sertifikat latihan dari HSK Simulator · Bukan sertifikat resmi HSK dan tidak berlaku sebagai bukti kemampuan bahasa Mandarin.', W / 2, 896);
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
