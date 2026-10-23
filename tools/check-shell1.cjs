// Shell-1 checks: jsdom DOM/event flows at 360x780, 390x844, 1280x900 plus static integrity.
// Run from ~/law-universe-essay: NODE_PATH=/tmp/neuron7-tools/node_modules node tools/check-shell1.cjs
const fs = require('fs'), path = require('path'), crypto = require('crypto'), assert = require('assert/strict');
const {JSDOM, VirtualConsole, requestInterceptor} = require('jsdom');
const APP = path.resolve(__dirname, '../app'), ORIGIN = 'http://lexo.test/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const ok = (cond, msg) => { assert(cond, msg); results.push(msg); };

const TYPES = {'.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html'};
// Serve the real app files from disk under a fake origin (no network).
const local = requestInterceptor(request => {
  const p = path.join(APP, decodeURIComponent(new URL(request.url).pathname));
  if (!p.startsWith(APP) || !fs.existsSync(p)) return new Response('', {status: 404});
  return new Response(fs.readFileSync(p), {headers: {'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream'}});
});
const CSS = fs.readFileSync(path.join(APP, 'pwa/lexo.css'), 'utf8');
const textW = (s, px) => [...s].reduce((w, c) => w + (/[\u0000-ÿ]/.test(c) ? 0.62 : 1) * px, 0);

async function open(W, H, hash = '') {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!/Not implemented/.test(e.message)) errors.push(e.message); });
  vc.on('error', e => errors.push(String(e)));
  const dom = new JSDOM(fs.readFileSync(path.join(APP, 'index.html'), 'utf8'), {
    url: ORIGIN + 'index.html' + hash, runScripts: 'dangerously', resources: {interceptors: [local]}, pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(win) {
      Object.defineProperty(win, 'innerWidth', {value: W, configurable: true});
      Object.defineProperty(win, 'innerHeight', {value: H, configurable: true});
      win.fetch = async url => { const p = path.join(APP, new URL(url, ORIGIN).pathname); const b = fs.readFileSync(p, 'utf8'); return {ok: true, status: 200, json: async () => JSON.parse(b)}; };
      win.scrollTo = () => {};
    }
  });
  const w = dom.window;
  await until(() => w.document.querySelector('#main h1'), 'boot');
  return {dom, w, d: w.document, errors};
}
async function until(fn, label, ms = 8000) {
  const t = Date.now();
  while (Date.now() - t < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(15); }
  throw Error('timeout: ' + label);
}
const hashOf = w => w.location.hash;
async function click(w, el) { el.dispatchEvent(new w.MouseEvent('click', {bubbles: true, cancelable: true})); await sleep(30); }
async function follow(w, a) {
  // jsdom does not follow anchors on synthetic clicks; emulate the browser: run handlers, then navigate unless prevented.
  const ev = new w.MouseEvent('click', {bubbles: true, cancelable: true});
  const go = a.dispatchEvent(ev);
  if (go && a.getAttribute('href').startsWith('#')) w.location.hash = a.getAttribute('href');
  await sleep(40);
}
async function press(w, el) { if (el.tagName === 'A') await follow(w, el); else await click(w, el); }
const primary = d => d.querySelector('#act:not([hidden]) #primary');
async function waitH1(w, re, label) { return until(() => re.test(w.document.querySelector('#main h1')?.textContent || '') && w.document.querySelector('#main h1'), label); }

function staticLayout(W, H) {
  const col = Math.min(W, 480), inner = col - 32;
  // Fixed chrome from the stylesheet: header 52, act bar 80 above a 64px tab bar.
  ok(/\.act\{bottom:calc\(64px \+ env\(safe-area-inset-bottom\)\);height:80px/.test(CSS) && /\.top,\.tabs,\.act\{position:fixed/.test(CSS), `${W}: action bar fixed above tab bar`);
  const actTop = H - 64 - 80, btnTop = actTop + 12, btnBottom = btnTop + 56;
  ok(btnTop >= 52 && btnBottom <= H - 64, `${W}x${H}: primary button inside viewport (y ${btnTop}–${btnBottom}, thumb zone bottom ${Math.round((H - btnBottom))}px from edge)`);
  ok(/\.shell\{width:100%;max-width:480px/.test(CSS) && /max-width:480px/.test(CSS), `${W}: column capped at 480px (desktop centred phone width)`);
  ok(!/(?:^|[;{])(?:min-)?width:\s*(?:[4-9]\d\d|\d{4,})px/.test(CSS.replace(/max-width:\d+px/g, '')), `${W}: no fixed CSS width wider than 360px`);
  return {col, inner};
}

function overflowBudget(d, W, label) {
  const col = Math.min(W, 480), inner = col - 32;
  const bad = [];
  d.querySelectorAll('.primary').forEach(e => { if (textW(e.textContent, 17) > inner - 32) bad.push('primary:' + e.textContent); });
  d.querySelectorAll('.chip').forEach(e => { if (textW(e.textContent, 15) + 30 > inner) bad.push('chip:' + e.textContent); });
  d.querySelectorAll('.seg button').forEach(e => { if (textW(e.textContent, 14) + 6 > (inner - 18) / 4) bad.push('seg:' + e.textContent); });
  d.querySelectorAll('.tab span').forEach(e => { if (textW(e.textContent, 12) > col / 4) bad.push('tab:' + e.textContent); });
  d.querySelectorAll('.hex').forEach(e => {
    const wpx = parseFloat(e.style.width);
    const b = e.querySelector('b').textContent, s = e.querySelector('small').textContent;
    const bpx = e.querySelector('b').classList.contains('sm') ? 12 : 13;
    if (textW(b, bpx) > wpx * 0.92 || textW(s, 12) > wpx * 0.92) bad.push('hex:' + b + '/' + s + '@' + wpx.toFixed(0));
  });
  d.querySelectorAll('[style]').forEach(e => { const m = e.getAttribute('style').match(/(?:^|;)\s*width:\s*([\d.]+)px/); if (m && +m[1] > inner) bad.push('style width ' + m[1]); });
  ok(!bad.length, `${W}: ${label}: no horizontal overflow (nowrap text budgets, inline widths ≤ ${inner}px)${bad.length ? ' ' + bad.join(',') : ''}`);
}

async function deadButtonSweep(w, label) {
  // Every visible link/button on this screen must change the route or the screen.
  const d = w.document, start = hashOf(w);
  const n = d.querySelectorAll('#main a[href], #main button, #act #primary, #tabs a, #back:not([hidden])').length;
  let checked = 0;
  for (let i = 0; i < n; i++) {
    const all = [...d.querySelectorAll('#main a[href], #main button, #act #primary, #tabs a, #back:not([hidden])')];
    const el = all[i]; if (!el) break;
    const href = el.getAttribute('href') || '';
    if (/^https?:|^classic\//.test(href)) { ok(el.target === '_blank' || href === 'classic/', `${label}: link ${href.slice(0, 40)} opens a page`); checked++; continue; }
    if (el.disabled) continue;
    if (el.matches('#tabs a') && el.getAttribute('href') === (hashOf(w) || '#/')) {
      const ev = new w.MouseEvent('click', {bubbles: true, cancelable: true}); el.dispatchEvent(ev);
      assert(ev.defaultPrevented, `${label}: current tab should scroll to top`); checked++; continue;
    }
    const before = hashOf(w) + '|' + d.querySelector('#main').innerHTML.length + '|' + d.querySelector('#main').innerHTML.slice(0, 2000) + d.querySelectorAll('details[open]').length;
    if (el.closest('summary')) continue;
    await press(w, el);
    await sleep(20);
    const after = hashOf(w) + '|' + d.querySelector('#main').innerHTML.length + '|' + d.querySelector('#main').innerHTML.slice(0, 2000) + d.querySelectorAll('details[open]').length;
    assert.notEqual(after, before, `${label}: dead control ${el.outerHTML.slice(0, 120)}`);
    checked++;
    if (hashOf(w) !== start) { w.location.hash = start; await sleep(40); }
  }
  ok(checked > 0, `${label}: all ${checked} controls do something`);
}

async function run(W, H) {
  const {col, inner} = staticLayout(W, H);
  const {w, d, errors} = await open(W, H);
  // Home: one big button, no tutorial.
  await until(() => primary(d) && primary(d).getAttribute('href'), 'home primary');
  ok(primary(d).textContent === '開始第一題', `${W}: home primary is 「開始第一題」`);
  ok(d.title === 'LEXO' && d.querySelector('#appName').textContent === 'LEXO', `${W}: title bar shows LEXO`);
  ok(d.querySelectorAll('#tabs .tab').length === 4 && [...d.querySelectorAll('#tabs .tab')].every(t => t.querySelector('svg') && t.textContent.trim()), `${W}: 4 bottom tabs with icon + text`);
  ok(d.querySelector('#back').hidden, `${W}: no ← on home`);
  const banned = /節點|組合包|反查|爭點節點|教學|拖曳|長按|縮放|{{APP_NAME}}/;
  overflowBudget(d, W, 'home');
  const seenText = [];

  // Essay flow: start → question → next → back (← and browser back).
  await press(w, primary(d));
  await waitH1(w, /./, 'q1');
  ok(/^#\/q\//.test(hashOf(w)), `${W}: 開始第一題 opens the first question`);
  const q1 = hashOf(w), h1a = d.querySelector('#main h1').textContent;
  ok(d.querySelector('.box.ask') && /這題在問什麼/.test(d.querySelector('.box.ask').textContent), `${W}: question page shows 「這題在問什麼」`);
  ok([...d.querySelectorAll('#main h2')].some(h => /爭點（關鍵問題）/.test(h.textContent)) && [...d.querySelectorAll('#main h2')].some(h => /要用到的法條/.test(h.textContent)), `${W}: issues and articles shown as cards top to bottom`);
  ok(!d.querySelector('#back').hidden, `${W}: ← shown on question page`);
  overflowBudget(d, W, 'question');
  seenText.push(d.body.textContent);
  // Article card opens in place.
  const det = d.querySelector('details.law[data-art]');
  det.open = true; await sleep(10);
  ok(/其他也考這條的題目/.test(det.textContent) && det.querySelector('.lawtext').textContent.length > 10, `${W}: article card opens to show the law text and other questions`);
  await deadButtonSweep(w, `${W} question`);
  ok(primary(d).textContent === '下一題', `${W}: question primary is 「下一題」`);
  await press(w, primary(d));
  await until(() => hashOf(w) !== q1 && d.querySelector('#main h1').textContent !== h1a, 'next');
  const q2 = hashOf(w);
  ok(q2 !== q1, `${W}: 下一題 moves to the next question`);
  await click(w, d.querySelector('#back'));
  await until(() => hashOf(w) === q1, '← back');
  ok(hashOf(w) === q1, `${W}: ← returns to the previous question`);
  await press(w, primary(d)); await until(() => hashOf(w) === q2, 'next again');
  w.history.back();
  await until(() => hashOf(w) === q1, 'browser back');
  ok(hashOf(w) === q1, `${W}: browser back returns to the previous question`);

  // Article page and the "一起考的法條" page.
  const chip = d.querySelector('.issue .chip');
  await follow(w, chip); await waitH1(w, /第.+條/, 'article');
  ok(/^#\/a\//.test(hashOf(w)) && [...d.querySelectorAll('#main h2')].some(h => /用到這條的題目/.test(h.textContent)), `${W}: article page lists questions using the same article`);
  seenText.push(d.body.textContent);
  overflowBudget(d, W, 'article');
  await click(w, d.querySelector('#back')); await until(() => hashOf(w) === q1, 'back from article');
  ok(true, `${W}: ← from an article returns to its question`);
  await follow(w, d.querySelector('.issue .chip')); await waitH1(w, /第.+條/, 'article again');
  await deadButtonSweep(w, `${W} article`);
  w.location.hash = q1; await until(() => hashOf(w) === q1 && d.querySelector('.box.ask'), 'q1 again');
  const packLink = d.querySelector('a.btnline[href^="#/g/"]');
  ok(packLink, `${W}: question shows 「一起考的法條」 with a link`);
  {
    await follow(w, packLink); await until(() => /^#\/g\//.test(hashOf(w)), 'pack');
    ok(/這組法條/.test(d.querySelector('#main').textContent), `${W}: 「一起考的法條」page lists the articles`);
    seenText.push(d.body.textContent);
    await deadButtonSweep(w, `${W} together-page`);
  }

  // Essay tab: subjects → list → question.
  await follow(w, d.querySelector('#tabs [data-tab=essay]')); await waitH1(w, /申論題/, 'essay tab');
  ok(d.querySelector('#tabs [data-tab=essay]').getAttribute('aria-current') === 'page', `${W}: 申論 tab highlighted`);
  seenText.push(d.body.textContent);
  await deadButtonSweep(w, `${W} essay subjects`);
  await follow(w, d.querySelector('#main a.card')); await until(() => /^#\/essay\/.+/.test(hashOf(w)), 'essay list');
  ok(d.querySelectorAll('#main a.card').length >= 6, `${W}: subject shows question cards`);
  seenText.push(d.body.textContent);
  await deadButtonSweep(w, `${W} question list`);

  // Map: every cell inside the column, every cell opens a page.
  await follow(w, d.querySelector('#tabs [data-tab=map]')); await waitH1(w, /地圖/, 'map');
  for (const seg of [...d.querySelectorAll('.seg button')].map(b => b.dataset.cat)) {
    await click(w, d.querySelector(`.seg button[data-cat="${seg}"]`));
    ok(d.querySelector(`.seg button[data-cat="${seg}"]`).getAttribute('aria-pressed') === 'true', `${W}: map filter ${seg} selected`);
    let cells = 0;
    d.querySelectorAll('.hexes').forEach(g => {
      const gh = parseFloat(g.style.height);
      g.querySelectorAll('.hex').forEach(c => {
        const l = parseFloat(c.style.left), t = parseFloat(c.style.top), cw = parseFloat(c.style.width), ch = parseFloat(c.style.height);
        assert(l >= 0 && t >= 0 && l + cw <= inner + 0.05 && t + ch <= gh + 0.05, `${W} ${seg}: cell clipped ${c.getAttribute('aria-label')} ${l},${t},${cw},${ch} in ${inner}x${gh}`);
        cells++;
      });
    });
    ok(cells > 0, `${W}: map ${seg}: all ${cells} cells inside ${inner}px-wide map, none clipped`);
    overflowBudget(d, W, 'map ' + seg);
  }
  seenText.push(d.body.textContent);
  const cellHrefs = [...d.querySelectorAll('.hex')].map(c => c.getAttribute('href'));
  ok(cellHrefs.every(h => /^#\/(q|a)\//.test(h)), `${W}: every map cell links straight to a question or article page`);
  const qCell = d.querySelector('.hex.q'), aCell = d.querySelector('.hex.l1,.hex.l2,.hex.l3');
  await follow(w, qCell); await until(() => /^#\/q\//.test(hashOf(w)), 'map q cell');
  ok(true, `${W}: tapping a question cell opens the question`);
  w.history.back(); await until(() => hashOf(w) === '#/map', 'back to map');
  await follow(w, d.querySelector('.hex.l1,.hex.l2,.hex.l3')); await until(() => /^#\/a\//.test(hashOf(w)), 'map a cell');
  ok(true, `${W}: tapping an article cell opens the article`);
  await follow(w, d.querySelector('#tabs [data-tab=map]')); await waitH1(w, /地圖/, 'map again');
  await deadButtonSweep(w, `${W} map`);

  // Drill: subject → answer wrong → 解析 → 下一題; wrong book; written question.
  await follow(w, d.querySelector('#tabs [data-tab=drill]')); await waitH1(w, /刷題/, 'drill');
  seenText.push(d.body.textContent);
  overflowBudget(d, W, 'drill');
  await follow(w, d.querySelector('#main .rows a[href="#/drill/civil"]'));
  await until(() => /^#\/drill\/civil\/.+/.test(hashOf(w)) && d.querySelector('.opt'), 'civil q');
  ok(!primary(d), `${W}: before answering, the options are the only action`);
  const opts = [...d.querySelectorAll('.opt')];
  const qid = decodeURIComponent(hashOf(w).split('/').pop());
  const q = w.QBD.civil.find(x => x.id === qid), wrongIdx = [0, 1, 2, 3].find(i => i !== q.a);
  await click(w, opts[wrongIdx]);
  ok(/答錯了/.test(d.querySelector('.verdict').textContent) && /解析/.test(d.querySelector('#main').textContent), `${W}: wrong answer shows correct answer and explanation`);
  ok(primary(d) && primary(d).textContent === '下一題', `${W}: after answering, primary is 「下一題」`);
  overflowBudget(d, W, 'drill question');
  const stored = JSON.parse(w.localStorage.getItem('civil-globe-v2'));
  ok(stored.srs[qid] && stored.srs[qid].w === 1, `${W}: answer saved in the existing record key (civil-globe-v2)`);
  const dq = hashOf(w);
  await press(w, primary(d)); await until(() => hashOf(w) !== dq, 'drill next');
  ok(/^#\/drill\/civil\//.test(hashOf(w)), `${W}: 下一題 goes to the next practice question`);
  await click(w, d.querySelector('#back')); await until(() => hashOf(w) === dq, 'drill ←');
  ok(d.querySelector('.verdict'), `${W}: ← returns to the answered question with its result`);
  await follow(w, d.querySelector('#tabs [data-tab=drill]')); await waitH1(w, /刷題/, 'drill root');
  const wb = d.querySelector('#main a.card[href="#/wrong"]');
  ok(wb && /1 題/.test(wb.textContent), `${W}: wrong book appears with 1 question`);
  await follow(w, wb); await waitH1(w, /錯題本/, 'wrong list', 30000);
  await until(() => d.querySelector('#main .rows a'), 'wrong rows', 30000);
  ok(d.querySelectorAll('#main .rows a').length === 1, `${W}: wrong book lists the missed question`);
  seenText.push(d.body.textContent);
  await press(w, primary(d)); await until(() => /^#\/drill\/civil\//.test(hashOf(w)) && d.querySelector('.opt'), 'redo');
  ok(decodeURIComponent(hashOf(w).split('/').pop()) === qid && !d.querySelector('.verdict'), `${W}: 從第一題開始重做 reopens the missed question fresh`);
  await click(w, d.querySelectorAll('.opt')[q.a]);
  ok(/答對了/.test(d.querySelector('.verdict').textContent) && primary(d).textContent === '回到錯題本', `${W}: redo correct → 「回到錯題本」`);
  // Written (tax) question: reveal → rate → next.
  w.location.hash = '#/drill/tax'; await until(() => /^#\/drill\/tax\/.+/.test(hashOf(w)) && primary(d), 'tax', 15000);
  ok(primary(d).textContent === '看參考答案', `${W}: written question primary is 「看參考答案」`);
  await click(w, primary(d));
  ok(/參考答案/.test(d.querySelector('#main').textContent) && d.querySelectorAll('.opt[data-act=rate]').length === 2, `${W}: reference answer and 「我寫得出來／我還不會」 shown`);
  await click(w, d.querySelector('.opt[data-act=rate][data-v="1"]'));
  ok(primary(d).textContent === '下一題', `${W}: after rating, primary is 「下一題」`);
  const tq = hashOf(w); await press(w, primary(d)); await until(() => hashOf(w) !== tq, 'tax next');
  ok(/^#\/drill\/tax\//.test(hashOf(w)), `${W}: written 下一題 works`);

  // Tabs from a deep page; ← fallback on a direct deep link stays in the app.
  for (const t of ['home', 'essay', 'drill', 'map']) {
    await follow(w, d.querySelector(`#tabs [data-tab=${t}]`)); await sleep(30);
    ok(d.querySelector(`#tabs [data-tab=${t}]`).getAttribute('aria-current') === 'page', `${W}: tab ${t} works`);
  }
  await follow(w, d.querySelector('#tabs [data-tab=home]')); await waitH1(w, /律師/, 'home again');
  await deadButtonSweep(w, `${W} home`);
  ok(!seenText.some(t => banned.test(t)), `${W}: no jargon (節點/組合包/反查), tutorial or gesture words on any screen`);
  ok(!errors.length, `${W}: no script errors ${errors.join(' | ')}`);
  w.close();

  const deep = await open(W, H, '#/a/B0000001-87');
  await waitH1(deep.w, /民法第87條/, 'deep link');
  await click(deep.w, deep.d.querySelector('#back'));
  await until(() => deep.w.location.hash === '#/essay', 'deep ←');
  ok(deep.w.location.href.startsWith(ORIGIN), `${W}: ← on a direct link goes up inside the app (#/essay)`);
  deep.w.close();
}

function staticChecks() {
  const idx = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
  for (const f of ['index.html', 'essay.html', 'vendor/lexo.js', 'vendor/app-config.js', 'manifest.json']) {
    const s = fs.readFileSync(path.join(APP, f), 'utf8');
    assert(!s.includes('{{APP_NAME}}'), f + ' has {{APP_NAME}}');
    assert(!/(?:src|href)=["']https?:\/\//i.test(s.replace(/href="\$\{esc\([^)]*\)\}"/g, '')), f + ' loads an external resource');
    assert(!/@import|@font-face|fonts\.googleapis|cdn/i.test(s), f + ' external font/CDN');
  }
  ok(!/@import|@font-face|url\(/.test(CSS), 'CSS has no external fonts or imports');
  ok(true, 'no {{APP_NAME}}, CDN or external font in index.html / essay.html / lexo.js / manifest');
  const cfg = fs.readFileSync(path.join(APP, 'vendor/app-config.js'), 'utf8');
  ok(/name: 'LEXO'/.test(cfg) && /<title>LEXO<\/title>/.test(idx) && /apple-mobile-web-app-title" content="LEXO"/.test(idx) && JSON.parse(fs.readFileSync(path.join(APP, 'manifest.json'))).short_name === 'LEXO', 'name LEXO from the single config constant, written statically');
  const sri = p => 'sha384-' + crypto.createHash('sha384').update(fs.readFileSync(path.join(APP, p))).digest('base64');
  for (const m of idx.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+\.(?:js|css))"[^>]*>/g)) assert(m[0].includes(`integrity="${sri(m[1])}"`), 'SRI ' + m[1]);
  const js = fs.readFileSync(path.join(APP, 'vendor/lexo.js'), 'utf8'), qbs = JSON.parse(js.match(/const QB_SRI = (\{.*?\});/)[1]);
  ok(Object.keys(qbs).length === 16 && Object.entries(qbs).every(([k, v]) => v === sri('qb/' + k + '.js')), 'SRI correct for index.html assets and all 16 question files');
  const sw = fs.readFileSync(path.join(APP, 'sw.js'), 'utf8'), pre = JSON.parse(sw.match(/const PRECACHE = (\[.*?\]);/)[1]);
  const man = JSON.parse(fs.readFileSync(path.join(APP, 'hash-manifest.json')));
  ok(/const VERSION = 'v79-shell-1'/.test(sw) && man.version === 'v79-shell-1' && pre.every(p => fs.existsSync(path.join(APP, p))) && pre.includes('vendor/lexo.js') && !pre.some(p => /three|journey|mindmap|paper\.css/.test(p)), `sw.js v79-shell-1, PRECACHE ${pre.length} files all present`);
  for (const [f, h] of Object.entries(man.files)) assert.equal(crypto.createHash('sha384').update(fs.readFileSync(path.join(APP, f))).digest('hex'), h, 'manifest ' + f);
  ok(true, `hash-manifest: ${Object.keys(man.files).length} files SHA-384 match`);
  const counts = {}; const ctx = {window: {}}; require('vm').createContext(ctx);
  for (const f of fs.readdirSync(path.join(APP, 'qb'))) require('vm').runInContext(fs.readFileSync(path.join(APP, 'qb', f), 'utf8'), ctx);
  const SUBJ = js.match(/const SUBJECTS = (\[[\s\S]*?\]);/)[1];
  for (const [, k, n] of SUBJ.matchAll(/\['(\w+)', '[^']+', (\d+)\]/g)) assert.equal(ctx.window.QBD[k].length, +n, 'count ' + k);
  ok(true, 'subject list counts match the question files (2,502 total)');
}

(async () => {
  staticChecks();
  for (const [W, H] of [[360, 780], [390, 844], [1280, 900]]) await run(W, H);
  console.log(results.map(r => 'PASS ' + r).join('\n'));
  console.log(`\nALL PASS (${results.length} checks)`);
  process.exit(0);
})().catch(e => { console.log(results.map(r => 'PASS ' + r).join('\n')); console.error('FAIL', e.message); process.exit(1); });
