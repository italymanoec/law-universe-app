/* LEXO app shell: hash routes, one primary action per screen, four tabs. */
(function () {
  'use strict';
  const NAME = (window.LAWU_CONFIG && window.LAWU_CONFIG.name) || 'LEXO';
  // Filled in by tools/finalize-shell.py; question files never change.
  const QB_SRI = {"administrative": "sha384-71wV26t85iQdh4TOK/CeqUM7RjfVfQFhVELHjXj/Q7d+bnl7Kv1LYrrkhMsbLg3p", "bills": "sha384-eInfh+orvvfvbTb9x1F9TS/UKI/gxcVUCDHfCtQvYX6RdSTFADjDtlmox2ziUEla", "civil": "sha384-7Su9bi5XiyROqaboLDuRNI9rjZKMztgVhuxkiJoFaVPOMKyoT4qwPKq4s9EC3AR5", "civpro": "sha384-mXSC+B1Uzk9s93Z/nl4/L4HskJ9z2rXdIm8VLVsfg4VaLtTdFxiiG6JnO2Dfda1J", "company": "sha384-/w+FADxDn9wMLxsZDc4F6sq33C7ZG4t/9WzC+y/l1U6MlDIQrbgXhXG4H8U90OCd", "constitution": "sha384-KuuuccyQxOY8zEnbdMKzooz7Kglu9SYYkhhc8ASU6DLpd/R94FjYDWib8OiP/WaP", "criminal": "sha384-CrRrOwegDC9wF3ukmPhZEeC0uBAU4zgbcmbmFNEcP8P+gFFSXlph5CNz41W5//0s", "crimpro": "sha384-AStbshyxWkoZdbzn/NEnFR9pWxlnxEFAt3bgzBd/CPhz45MuA0Np9mgGy9eIrku7", "enforcement": "sha384-8uIC74MhDBOBNgxzrk5AhbSZNip8gAsbtVO5deQb2XEkstRLmjJGjuTB67ziG0G6", "english": "sha384-KbIsllZ4or8smb3oJ5uQaENBKq2ruF1lDE/zYXZrRcxrNUDlt53NA82Goq83xUvj", "ethics": "sha384-ga6+9cmX32tG7DLrUXOAOJUeylqfEoNILO5JWDLDlWvIjxk+KEWTM2tUH6VnQKXa", "insurance": "sha384-uz7qeCfRY3xfAXeC57YDb++gUQwHA/Xo/Z8aoqYHQ+WKX/RVReRtdctSXcgYI7iP", "pil": "sha384-JPrIhKa4Nirzj6hgw8OocTSiSOUYyeo+mhp56t0YmraYrnqx1JTpxCSL45ROVCwB", "pvt": "sha384-q26iNYjKgEYPsD/nxDQ5gsAkFfOCzwdK9EbsepV0L1h9GD/Xa/oyPQy6BMjEYSbo", "securities": "sha384-4c1pfP2OVmC6dFtaB0RXQ1ERF87c4cxfsmgSNClvWrIDj8lor3TawP33XAGmRkSa", "tax": "sha384-7HnRfxhmiPOvf2UVMBbAcdTg1muwHt7SlbDDnJbCG4N/oviHz9p/4gL2WI573ZPj"};
  const SUBJECTS = [
    ['civil', '民法', 424], ['criminal', '刑法', 283], ['constitution', '憲法', 168], ['administrative', '行政法', 292],
    ['civpro', '民事訴訟法', 269], ['crimpro', '刑事訴訟法', 210], ['company', '公司法', 134], ['insurance', '保險法', 88],
    ['bills', '票據法', 82], ['securities', '證券交易法', 84], ['enforcement', '強制執行法', 70], ['pil', '國際公法', 68],
    ['pvt', '國際私法', 78], ['ethics', '法律倫理', 104], ['tax', '財稅法', 31], ['english', '法學英文', 117]
  ];
  const SUBJ = Object.fromEntries(SUBJECTS.map(([k, name, n]) => [k, {k, name, n}]));
  const ROOTS = ['', 'essay', 'drill', 'map'];

  const $ = s => document.querySelector(s);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const enc = encodeURIComponent;
  const list = v => {
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string' && v.trim().startsWith('[')) return [...v.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)].map(m => m[1] != null ? m[1] : m[2]);
    return v ? [String(v)] : [];
  };
  const getLS = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  /* ---------- answer records: same key and fields as the previous version ---------- */
  const LSK = 'civil-globe-v2', INT = [1, 3, 7, 14, 30];
  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const todayNum = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); };
  const store = Object.assign({srs: {}, mastered: [], mT: 0, mk: {}, log: {}, updated: 0, last: 'civil'}, getLS(LSK, {}) || {});
  store.srs = store.srs || {}; store.log = store.log || {};
  function record(q, ok) {
    const s0 = store.srs[q.id], isNew = !s0;
    let b = s0 ? s0.b : 0, w = s0 ? s0.w : 0;
    if (ok) b = Math.min(b + 1, 5); else { b = 0; w++; }
    store.srs[q.id] = {b, d: todayNum() + (ok ? INT[Math.max(0, b - 1)] : 1), w, t: Date.now()};
    if (!ok && Array.isArray(store.mastered) && store.mastered.includes(q.node)) {
      store.mastered = store.mastered.filter(x => x !== q.node); store.mT = Date.now();
      (store.mk = store.mk || {})[q.node] = [0, store.mT];
    }
    const lg = store.log[todayStr()] || (store.log[todayStr()] = {});
    lg.n = (lg.n || 0) + 1; if (ok) lg.ok = (lg.ok || 0) + 1; if (isNew) lg.nw = (lg.nw || 0) + 1;
    store.updated = Date.now(); setLS(LSK, store);
  }
  const wrongIds = () => Object.keys(store.srs).filter(id => store.srs[id] && store.srs[id].w > 0);

  /* ---------- data loading ---------- */
  let essay = null, essayErr = false, essayLoading = null;
  function loadEssay() {
    if (essay || essayLoading) return essayLoading;
    essayErr = false;
    essayLoading = fetch('data/essay_packs.json').then(r => { if (!r.ok) throw Error(r.status); return r.json(); }).then(raw => {
      const d = {qs: raw.questions, packs: raw.packs, arts: raw.articles};
      d.q = Object.fromEntries(d.qs.map(q => [q.id, q]));
      d.a = Object.fromEntries(d.arts.map(a => [a.id, a]));
      d.p = Object.fromEntries(d.packs.map(p => [p.id, p]));
      d.cats = [...new Set(d.qs.map(q => q.category))];
      d.byCat = Object.fromEntries(d.cats.map(c => [c, d.qs.filter(q => q.category === c)]));
      d.order = d.cats.flatMap(c => d.byCat[c]);
      d.usedBy = {};
      d.qs.forEach(q => qArts(q).forEach(id => (d.usedBy[id] = d.usedBy[id] || []).push(q.id)));
      essay = d;
    }).catch(() => { essayErr = true; }).finally(() => { essayLoading = null; render(); });
    return essayLoading;
  }
  const qArts = q => [...new Set([...(q.article_ids || []), ...(q.issues || []).flatMap(i => [...(i.articles || []), ...(i.related_articles || [])])])];
  const loadingSubj = {};
  function loadSubject(k) {
    window.QBD = window.QBD || {};
    if (window.QBD[k]) return Promise.resolve(window.QBD[k]);
    if (loadingSubj[k]) return loadingSubj[k];
    return (loadingSubj[k] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'qb/' + k + '.js';
      if (QB_SRI[k]) { s.integrity = QB_SRI[k]; s.crossOrigin = 'anonymous'; }
      s.onload = () => window.QBD[k] ? resolve(window.QBD[k]) : reject(Error(k));
      s.onerror = () => { delete loadingSubj[k]; reject(Error(k)); };
      document.head.appendChild(s);
    }));
  }
  const qbFind = (k, id) => (window.QBD && window.QBD[k] || []).find(q => q.id === id);

  /* ---------- labels ---------- */
  const artShort = a => (a.law === '民法' ? '民' : /刑/.test(a.law) ? '刑' : a.law.slice(0, 1)) + '§' + String(a.article_no).replace('之', '-');
  const digits = v => String(v || '').replace(/[㈠㈡㈢㈣㈤㈥㈦㈧㈨㈩]/g, c => String('㈠㈡㈢㈣㈤㈥㈦㈧㈨㈩'.indexOf(c) + 1)).replace(/[一二三四五六七八九十]/g, c => String('一二三四五六七八九十'.indexOf(c) + 1));
  const qName = q => q.year_roc + '年・第 ' + digits(q.question_no) + ' 題' + (q.sub_question_no ? '・小題 ' + digits(q.sub_question_no) : '');
  const qTitle = q => (q.issues && q.issues[0] && q.issues[0].title) || qName(q);
  const freq = id => (essay.usedBy[id] || []).length;

  /* ---------- routing and history ---------- */
  const route = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  // Replacing keeps the current history depth, so ← never steps out of the app.
  const go = (path, replace) => { const h = '#/' + path; if (replace) { history.replaceState({d: depth}, '', h); render(); } else location.hash = h; };
  let depth = 0;
  function parentOf(r) {
    const [a, b, c] = r;
    if (a === 'q' && essay && essay.q[b]) return 'essay/' + enc(essay.q[b].category);
    if (a === 'essay' && b) return 'essay';
    if (a === 'a' && c) return 'q/' + enc(c);
    if (a === 'search') return 'map';
    if (a === 'a' || a === 'g') return 'essay';
    if (a === 'drill' && b) return 'drill';
    if (a === 'wrong') return 'drill';
    return '';
  }
  function back() {
    if (depth > 0) history.back();
    else go(parentOf(route()), true);
  }

  /* ---------- quiz session (survives refresh) ---------- */
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem('lexo-session')) || null; } catch (e) { session = null; }
  const saveSession = () => { try { sessionStorage.setItem('lexo-session', JSON.stringify(session)); } catch (e) {} };
  function subjectQueue(k) {
    const qs = window.QBD[k], t = todayNum(), s = id => store.srs[id];
    const due = qs.filter(q => s(q.id) && s(q.id).d <= t).sort((x, y) => s(y.id).w - s(x.id).w);
    const fresh = qs.filter(q => !s(q.id));
    const later = qs.filter(q => s(q.id) && s(q.id).d > t).sort((x, y) => s(x.id).d - s(y.id).d);
    return [...due, ...fresh, ...later].map(q => ({k, id: q.id}));
  }
  const answered = {};

  /* ---------- screens ---------- */
  const card = (href, meta, title, extra) => `<a class="card" href="${href}">${meta ? `<span class="meta">${meta}</span>` : ''}<strong>${title}</strong>${extra ? `<span class="meta">${extra}</span>` : ''}</a>`;
  const rows = items => `<ul class="rows">${items.map(([href, t, s]) => `<li><a href="${href}">${t}${s ? `<small>${s}</small>` : ''}</a></li>`).join('')}</ul>`;
  const loading = () => ({title: '載入中', html: '<p class="empty">載入中…</p>'});
  const failed = (msg) => ({title: '連不上', html: `<h1>${esc(msg || '暫時讀不到資料')}</h1><p class="note">網路恢復後按下面的按鈕。</p>`, primary: {label: '再試一次', act: 'retry'}});
  const needEssay = () => { if (essay) return null; if (essayErr) return failed(); loadEssay(); return loading(); };

  const revealed = new Set();
  function noteBox(id) {
    const notes = getLS('lexo-notes', {});
    return `<section class="notes"><label for="my-note">我的筆記</label><textarea id="my-note" data-note="${esc(id)}" rows="4" placeholder="寫下你的想法、答題草稿或容易忘記的地方">${esc(notes[id] || '')}</textarea><span class="note" id="note-status" role="status">只儲存在這台裝置</span></section>`;
  }
  function searchBox() {
    return `<form id="law-search" class="search"><label for="law-query">條號搜尋</label><div class="searchline"><input id="law-query" name="q" type="search" placeholder="例如：民法 87、刑法 28" required><button type="submit" aria-label="搜尋法條">搜尋</button></div></form>`;
  }
  function home() {
    const last = getLS('lexo-last-q', null), lastQ = essay && last && essay.q[last];
    const today = (store.log[todayStr()] || {}).n || 0, wrong = wrongIds().length;
    if (!window.QBD || !window.QBD.civil) loadSubject('civil').then(render, () => {});
    const choices = (window.QBD && window.QBD.civil || []).filter(q => Array.isArray(q.o));
    const daily = choices.length ? choices[todayNum() % choices.length] : null;
    const recent = getLS('lexo-last-drill', null);
    let html = `<section class="hero"><p class="kicker">律師・司法官考試</p><h1 tabindex="-1">每天一題，<br>慢慢累積實力。</h1><p>先從選擇題開始。</p></section>`;
    html += `<div class="stats"><a href="#/drill"><b>${today}</b><span>今日已刷</span></a><a href="#/wrong"><b>${wrong}</b><span>錯題本</span></a><a href="#/drill"><b>${Object.keys(store.srs).length}</b><span>累計作答</span></a></div>`;
    if (recent && SUBJ[recent.k]) html += '<h2>繼續上次</h2>' + card('#/drill/' + recent.k + '/' + enc(recent.id), '選擇題・' + esc(SUBJ[recent.k].name), '接著做上一題');
    else if (lastQ) html += '<h2>繼續上次</h2>' + card('#/q/' + enc(last), esc('申論・' + qName(lastQ)), '回到上次的申論題');
    html += '<h2>今日一題</h2>' + (daily ? card('#/drill/civil/' + enc(daily.id), esc('民法・' + daily.y + '年・第 ' + daily.n + ' 題'), esc(daily.q), '選擇題 →') : '<p class="note">正在讀取題庫…</p>');
    html += searchBox();
    if (essay) {
      const top = essay.arts.filter(a => freq(a.id)).sort((a,b) => freq(b.id)-freq(a.id) || a.id.localeCompare(b.id)).slice(0,3);
      html += '<h2>申論常考法條 <span class="note">依現有題庫統計</span></h2>' + rows(top.map((a,i) => ['#/a/' + enc(a.id), `<span class="rank">0${i+1}</span>${esc(a.label)}`, freq(a.id) + ' 題用到']));
    }
    html += `<div class="foot"><p class="note">題目出自考選部公告試題；解析僅供參考，不構成法律意見，請以考選部公告答案與現行法規為準。</p><a class="note" href="classic/">舊版</a></div>`;
    if (!essay && !essayErr) loadEssay();
    return {title: '首頁', html, primary: {label: '開始刷選擇題', href: '#/drill/civil'}};
  }
  function searchResults(query) {
    const wait = needEssay(); if (wait) return wait;
    const norm = t => String(t).replace(/第|條|§|\s/g, '').replace(/之/g, '-');
    const term = norm(query), found = essay.arts.filter(a => norm(a.law + a.article_no).includes(term) || norm(a.label).includes(term));
    return {title: '條號搜尋', html: `<h1 tabindex="-1">條號搜尋</h1>${searchBox()}<h2>「${esc(query)}」・${found.length} 筆</h2>` + (found.length ? rows(found.map(a => ['#/a/' + enc(a.id), esc(a.label), freq(a.id) + ' 題用到'])) : '<p class="empty">找不到這個條號。試試「87」或「民法 87」。</p>')};
  }

  function essayHome() {
    const wait = needEssay(); if (wait) return wait;
    const seen = getLS('lexo-seen', []), last = getLS('lexo-last-q', null);
    let html = `<h1 tabindex="-1">申論題</h1>`;
    html += essay.cats.map(c => {
      const qs = essay.byCat[c], n = qs.filter(q => seen.includes(q.id)).length;
      return `<a class="card big" href="#/essay/${enc(c)}"><strong>${esc(c)}</strong><span class="meta">${qs.length} 題${n ? `・看過 ${n} 題` : ''}</span></a>`;
    }).join('');
    const target = last && essay.q[last] ? last : essay.order[0].id;
    return {title: '申論題', html, primary: {label: last && essay.q[last] ? '繼續上次的題目' : '從第一題開始', href: '#/q/' + enc(target)}};
  }

  function essayList(cat) {
    const wait = needEssay(); if (wait) return wait;
    const qs = essay.byCat[cat]; if (!qs) return notFound();
    const seen = getLS('lexo-seen', []);
    let html = `<p class="kicker">申論題</p><h1 tabindex="-1">${esc(cat)}</h1>`;
    html += qs.map(q => card('#/q/' + enc(q.id), esc(qName(q)) + (q.points ? '・' + q.points + ' 分' : '') + (seen.includes(q.id) ? '<span class="tag">看過</span>' : ''), esc(qTitle(q)), (q.issues || []).length + ' 個關鍵問題・' + qArts(q).length + ' 條法條')).join('');
    return {title: cat, html, primary: {label: '從這科第一題開始', href: '#/q/' + enc(qs[0].id)}};
  }

  function artChip(id, from, soft) {
    const a = essay.a[id];
    return `<a class="chip${soft ? ' soft' : ''}" href="#/a/${enc(id)}${from ? '/' + enc(from) : ''}">${esc(a ? artShort(a) : id)}</a>`;
  }
  function artDetails(id, q) {
    const a = essay.a[id]; if (!a) return '';
    const others = (essay.usedBy[id] || []).filter(x => x !== q.id).map(x => essay.q[x]);
    return `<details class="law" data-art="${esc(id)}"><summary><b>${esc(a.label)}</b><span>看條文</span></summary><div class="in">
      <div class="lawtext">${esc((a.text || []).join('\n'))}</div>
      <h2>其他也考這條的題目</h2>${others.length ? rows(others.map(o => ['#/q/' + enc(o.id), esc(qTitle(o)), esc(o.category + '・' + qName(o))])) : '<p class="note">只有這一題。</p>'}
      <a class="btnline" href="#/a/${enc(id)}/${enc(q.id)}">看這條的完整說明</a></div></details>`;
  }

  function question(id) {
    const wait = needEssay(); if (wait) return wait;
    const q = essay.q[id]; if (!q) return notFound();
    setLS('lexo-last-q', id);
    const seen = getLS('lexo-seen', []); if (!seen.includes(id)) { seen.push(id); setLS('lexo-seen', seen); }
    const i = essay.order.indexOf(q), next = essay.order[i + 1], shown = revealed.has(id);
    let html = `<p class="kicker">${esc(q.category)}・${esc(qName(q))}${q.points ? '・' + q.points + ' 分' : ''}</p><h1 tabindex="-1">申論・小題 ${esc(digits(q.sub_question_no || q.question_no))}</h1>`;
    html += `<div class="box question-stem"><p class="kicker">題目</p><div class="txt">${esc(q.stem_text)}</div></div><div class="box ask"><p class="kicker">請回答</p><div class="txt">${esc(q.prompt_text)}</div></div>`;
    html += noteBox('essay:' + id);
    if (!shown) return {title: '申論・小題 ' + digits(q.sub_question_no || q.question_no), html, primary: {label: '看答案和爭點', act: 'essay-reveal'}, onAct(act) { if (act === 'essay-reveal') { revealed.add(id); render(); const h = $('#answer-start'); if (h) h.focus({preventScroll: true}); } }};
    html += '<div id="answer-start" tabindex="-1" class="answer-heading">答案和爭點</div>';
    html += `<h2>爭點（關鍵問題）</h2>` + (q.issues || []).map((s, n) => `<div class="issue"><strong>${n + 1}. ${esc(s.title)}</strong><p>${esc(s.description)}</p>
      ${(s.articles || []).length ? `<div class="uses">要用到的法條</div><div class="chips">${s.articles.map(a => artChip(a, q.id)).join('')}</div>` : ''}
      ${(s.related_articles || []).length ? `<div class="uses">可能也會用到</div><div class="chips">${s.related_articles.map(a => artChip(a, q.id, true)).join('')}</div>` : ''}</div>`).join('');
    html += `<h2>要用到的法條（點開看條文）</h2>` + qArts(q).map(a => artDetails(a, q)).join('');
    const packs = (q.pack_ids || []).map(p => essay.p[p]).filter(Boolean);
    if (packs.length) html += `<h2>一起考的法條</h2>` + packs.map(p => `<div class="card"><strong>${esc(p.name)}</strong><p class="note" style="margin:6px 0 10px">${esc(p.description)}</p><div class="chips">${(p.article_ids || []).map(a => artChip(a, q.id, !(p.core_article_ids || []).includes(a))).join('')}</div><a class="btnline" href="#/g/${enc(p.id)}/${enc(q.id)}">看這組法條</a></div>`).join('');
    return {title: qTitle(q), html, primary: next ? {label: '下一題', href: '#/q/' + enc(next.id)} : {label: '回到題目列表', href: '#/essay'}};
  }

  function article(id, from) {
    const wait = needEssay(); if (wait) return wait;
    const a = essay.a[id]; if (!a) return notFound();
    const fq = from && essay.q[from];
    let html = `<p class="kicker">${esc(a.law)}${fq ? '・' + esc(qName(fq)) + ' 用到' : ''}</p><h1 tabindex="-1">${esc(a.label)}</h1>`;
    html += `<div class="box"><p class="kicker">條文</p><div class="lawtext">${esc((a.text || []).join('\n'))}</div></div>`;
    if ((a.plain_requirements || []).length) html += `<h2>要件（成立條件）</h2><div class="card"><ul class="plain">${a.plain_requirements.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
    if ((a.common_issues || []).length) html += `<h2>常見爭點（關鍵問題）</h2><div class="card"><ul class="plain">${a.common_issues.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
    html += `<h2>法院怎麼說</h2>` + ((a.cases || []).length ? a.cases.map(c => `<div class="card"><span class="meta">${esc(c.case_no)}${c.decision_date ? '・' + esc(c.decision_date) : ''}</span><p style="margin:6px 0 0">${esc(c.summary || c.excerpt)}</p>${c.url ? `<a class="btnline" href="${esc(c.url)}" target="_blank" rel="noopener">看判決原文</a>` : ''}</div>`).join('') : '<p class="note">還沒找到可以核對的判決，先不列。</p>');
    const used = (essay.usedBy[id] || []).map(x => essay.q[x]);
    html += `<h2>用到這條的題目（${used.length}）</h2>` + (used.length ? rows(used.map(o => ['#/q/' + enc(o.id), esc(qTitle(o)), esc(o.category + '・' + qName(o))])) : '<p class="note">沒有。</p>');
    const rel = (a.related_article_ids || []).filter(x => essay.a[x]);
    if (rel.length) html += `<h2>相關法條</h2><div class="chips">${rel.map(x => artChip(x, from)).join('')}</div>`;
    if (a.source_url) html += `<a class="btnline" href="${esc(a.source_url)}" target="_blank" rel="noopener">全國法規資料庫</a>`;
    let primary;
    if (fq) {
      const arts = qArts(fq), nx = arts[arts.indexOf(id) + 1];
      primary = nx ? {label: '下一條法條', href: '#/a/' + enc(nx) + '/' + enc(from)} : {label: '回到這題', href: '#/q/' + enc(from)};
    } else primary = used.length ? {label: '看用到這條的題目', href: '#/q/' + enc(used[0].id)} : {label: '回到申論題', href: '#/essay'};
    return {title: a.label, html, primary};
  }

  function pack(id, from) {
    const wait = needEssay(); if (wait) return wait;
    const p = essay.p[id]; if (!p) return notFound();
    const qs = (p.question_ids || []).map(x => essay.q[x]).filter(Boolean);
    let html = `<p class="kicker">一起考的法條・${esc(p.category)}</p><h1 tabindex="-1">${esc(p.name)}</h1><div class="box">${esc(p.description)}</div>`;
    html += `<h2>這組法條</h2>` + rows((p.article_ids || []).filter(x => essay.a[x]).map(x => ['#/a/' + enc(x) + (from ? '/' + enc(from) : ''), esc(essay.a[x].label), (p.core_article_ids || []).includes(x) ? '一定會用到' : '常一起出現']));
    html += `<h2>考過這組的題目（${qs.length}）</h2>` + rows(qs.map(o => ['#/q/' + enc(o.id), esc(qTitle(o)), esc(o.category + '・' + qName(o))]));
    const target = from && essay.q[from] ? from : qs[0] && qs[0].id;
    return {title: p.name, html, primary: target ? {label: from ? '回到這題' : '看這題', href: '#/q/' + enc(target)} : {label: '回到申論題', href: '#/essay'}};
  }

  /* ---------- drill (multiple choice and written practice) ---------- */
  function drillHome() {
    const w = wrongIds().length, last = SUBJ[store.last] ? store.last : 'civil';
    let html = `<h1 tabindex="-1">刷題</h1>`;
    if (w) html += card('#/wrong', '答錯過的題目', '錯題本', w + ' 題');
    html += `<h2>選科目</h2>` + rows(SUBJECTS.map(([k, name, n]) => ['#/drill/' + k, esc(name), n + ' 題']));
    return {title: '刷題', html, primary: {label: (Object.keys(store.srs).length ? '繼續刷' : '從這科開始：') + SUBJ[last].name, href: '#/drill/' + last}};
  }

  function drillStart(k) {
    if (!SUBJ[k]) return notFound();
    if (!window.QBD || !window.QBD[k]) { loadSubject(k).then(render, () => { drillErr[k] = true; render(); }); return drillErr[k] ? failed('讀不到這科的題目') : loading(); }
    session = {mode: 'subject', k, items: subjectQueue(k)}; saveSession();
    store.last = k; setLS(LSK, store);
    history.replaceState({d: depth}, '', '#/drill/' + k + '/' + enc(session.items[0].id));
    return drillQ(k, session.items[0].id);
  }
  const drillErr = {};

  function drillQ(k, id) {
    if (!SUBJ[k]) return notFound();
    if (!window.QBD || !window.QBD[k]) { loadSubject(k).then(render, () => { drillErr[k] = true; render(); }); return drillErr[k] ? failed('讀不到這科的題目') : loading(); }
    const q = qbFind(k, id); if (!q) return notFound();
    if (!session || !session.items.some(x => x.k === k && x.id === id)) { session = {mode: 'subject', k, items: subjectQueue(k)}; saveSession(); }
    const pos = session.items.findIndex(x => x.k === k && x.id === id), nx = session.items[pos + 1];
    setLS('lexo-last-drill', {k, id});
    const st = answered[k + '/' + id] || {}, written = !Array.isArray(q.o);
    let html = `<p class="kicker">${esc(SUBJ[k].name)}・${esc(q.y)}年 第${esc(q.n)}題${session.mode === 'wrong' ? '・錯題本' : ''}</p>`;
    html += `<h1 tabindex="-1">第 ${pos + 1} 題 / 共 ${session.items.length} 題</h1><div class="box txt">${esc(q.q)}</div>`;
    let primary = null;
    if (!written) {
      const accs = Array.isArray(q.acc) ? q.acc : [q.a];
      html += q.o.map((t, i) => {
        let c = 'opt';
        if (st.picked != null) { if (accs.includes(i)) c += ' ok'; else if (i === st.picked) c += ' bad'; }
        return `<button type="button" class="${c}" data-act="pick" data-k="${i}"${st.picked != null ? ' disabled' : ''}><b>(${'ABCDEFG'[i]})</b><span>${esc(t)}</span></button>`;
      }).join('');
      if (st.picked != null) {
        const ok = accs.includes(st.picked);
        html += `<div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '答對了' : '答錯了，正確答案是 ' + accs.map(i => '(' + 'ABCDEFG'[i] + ')').join('或')}</div>`;
        html += `<h2>解析</h2><div class="card txt">${esc(q.ex)}</div>`;
      }
    } else {
      if (!st.shown) primary = {label: '看參考答案', act: 'reveal'};
      else {
        const pts = list(q.pts);
        if (pts.length) html += `<h2>答題要點</h2><div class="card"><ul class="plain">${pts.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
        html += `<h2>參考答案</h2><div class="card txt">${esc(q.ex)}</div><h2>你寫得出來嗎？</h2>`;
        html += [['1', '我寫得出來'], ['0', '我還不會']].map(([v, t]) => `<button type="button" class="opt${st.rated === +v ? (v === '1' ? ' ok' : ' bad') : ''}" data-act="rate" data-v="${v}"${st.rated != null ? ' disabled' : ''}><span>${t}</span></button>`).join('');
      }
    }
    if (q.law_note && (st.picked != null || st.shown)) html += `<h2>法規後來改了</h2><div class="card txt">${esc(q.law_note)}</div>`;
    const done = st.picked != null || st.rated != null;
    if (done) primary = nx ? {label: '下一題', href: '#/drill/' + nx.k + '/' + enc(nx.id)} : {label: session.mode === 'wrong' ? '回到錯題本' : '這科做完了，回到科目', href: session.mode === 'wrong' ? '#/wrong' : '#/drill'};
    html += noteBox('drill:' + k + ':' + id);
    return {title: SUBJ[k].name + ' 第' + q.n + '題', html, primary, onAct(act, el) {
      if (act === 'pick' && st.picked == null) { const i = +el.dataset.k; answered[k + '/' + id] = {picked: i}; record(q, (Array.isArray(q.acc) ? q.acc : [q.a]).includes(i)); render(); }
      if (act === 'reveal') { answered[k + '/' + id] = {shown: true}; render(); }
      if (act === 'rate' && st.rated == null) { answered[k + '/' + id] = {shown: true, rated: +el.dataset.v}; record(q, el.dataset.v === '1'); render(); }
    }};
  }

  function wrongList() {
    const ids = new Set(wrongIds());
    const none = {title: '錯題本', html: `<h1 tabindex="-1">錯題本</h1><p class="empty">目前沒有答錯的題目。</p>`, primary: {label: '去刷題', href: '#/drill'}};
    if (!ids.size) return none;
    const missing = SUBJECTS.map(s => s[0]).filter(k => !(window.QBD && window.QBD[k]));
    if (missing.length) { Promise.allSettled(missing.map(loadSubject)).then(render); return loading(); }
    const items = [];
    SUBJECTS.forEach(([k]) => window.QBD[k].forEach(q => { if (ids.has(q.id)) items.push({k, q}); }));
    items.sort((x, y) => (store.srs[y.q.id].w - store.srs[x.q.id].w) || ((store.srs[y.q.id].t || 0) - (store.srs[x.q.id].t || 0)));
    if (!items.length) return none;
    const qitems = items.map(({k, q}) => ({k, id: q.id}));
    let html = `<h1 tabindex="-1">錯題本</h1><p class="note">${items.length} 題，答錯越多次排越前面。</p>`;
    html += rows(items.map(({k, q}) => ['#/drill/' + k + '/' + enc(q.id), esc(String(q.q).slice(0, 48)) + (String(q.q).length > 48 ? '…' : ''), esc(SUBJ[k].name + '・' + q.y + '年 第' + q.n + '題・答錯 ' + store.srs[q.id].w + ' 次')]));
    return {title: '錯題本', html, primary: {label: '從第一題開始重做', act: 'redo'}, onAct(act) {
      if (act === 'redo') startWrong(qitems, 0);
    }, onLink(a) {
      const m = a.getAttribute('href').match(/^#\/drill\/([^/]+)\/(.+)$/);
      if (m) startWrong(qitems, qitems.findIndex(x => x.k === m[1] && x.id === decodeURIComponent(m[2])), true);
    }};
  }
  function startWrong(items, i, viaLink) {
    session = {mode: 'wrong', items}; saveSession();
    items.forEach(x => delete answered[x.k + '/' + x.id]);
    if (!viaLink) go('drill/' + items[i].k + '/' + enc(items[i].id));
  }

  /* ---------- map ---------- */
  function layoutHex(n, width) {
    const cols = Math.max(3, Math.floor(width / 62 - 0.5)), w = width / (cols + 0.5), h = w * 1.1547, step = h * 0.75, gap = 3;
    const cells = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      cells.push({left: c * w + (r % 2 ? w / 2 : 0) + gap / 2, top: r * step + gap / 2, width: w - gap, height: h - gap});
    }
    const rowsN = Math.ceil(n / cols);
    return {cols, cells, height: rowsN ? (rowsN - 1) * step + h : 0, width};
  }
  function mapWidth() {
    const el = $('#main'), cw = el && el.clientWidth ? el.clientWidth - 32 : 0;
    return cw > 0 ? cw : Math.min(window.innerWidth || 360, 480) - 32;
  }
  function hexGrid(items, width) {
    const L = layoutHex(items.length, width);
    return `<div class="hexes" style="height:${L.height.toFixed(1)}px">${items.map((it, i) => {
      const c = L.cells[i];
      return `<a class="hex ${it.cls}" href="${it.href}" aria-label="${esc(it.aria)}" style="left:${c.left.toFixed(1)}px;top:${c.top.toFixed(1)}px;width:${c.width.toFixed(1)}px;height:${c.height.toFixed(1)}px"><b${[...it.a].length >= 6 ? ' class="sm"' : ''}>${esc(it.a)}</b><small>${esc(it.b)}</small></a>`;
    }).join('')}</div>`;
  }
  function mapView() {
    const wait = needEssay(); if (wait) return wait;
    let cat = getLS('lexo-map-cat', essay.cats[0]);
    if (cat !== '全部' && !essay.byCat[cat]) cat = essay.cats[0];
    const qs = cat === '全部' ? essay.order : essay.byCat[cat];
    const arts = [...new Set(qs.flatMap(qArts))].filter(id => essay.a[id]).sort((x, y) => freq(y) - freq(x) || x.localeCompare(y, 'en', {numeric: true}));
    const width = mapWidth();
    let html = `<h1 tabindex="-1">地圖</h1>${searchBox()}<div class="seg" role="group" aria-label="科目">${[...essay.cats, '全部'].map(c => `<button type="button" data-act="cat" data-cat="${esc(c)}" aria-pressed="${c === cat}">${esc(c)}</button>`).join('')}</div>`;
    html += `<div class="legend"><span><i class="lg-q"></i>題目</span><span><i class="lg-1"></i>考 1 題</span><span><i class="lg-2"></i>考 2 題</span><span><i class="lg-3"></i>考 3 題以上</span></div>`;
    html += `<h2>題目（${qs.length}）</h2>` + hexGrid(qs.map(q => ({cls: 'q', href: '#/q/' + enc(q.id), a: q.year_roc + '年', b: '題 ' + digits(q.question_no) + (q.sub_question_no ? '・' + digits(q.sub_question_no) : ''), aria: q.category + ' ' + qName(q) + ' ' + qTitle(q)})), width);
    html += `<h2>法條（${arts.length}，顏色越深越常考）</h2>` + hexGrid(arts.map(id => { const a = essay.a[id], f = freq(id); return {cls: f >= 3 ? 'l3' : f === 2 ? 'l2' : 'l1', href: '#/a/' + enc(id), a: artShort(a), b: f + ' 題', aria: a.label + '，考 ' + f + ' 題'}; }), width);
    return {title: '地圖', html, primary: {label: cat === '全部' ? '開始第一題' : '開始這科第一題', href: '#/q/' + enc(qs[0].id)}, onAct(act, el) {
      if (act === 'cat') { setLS('lexo-map-cat', el.dataset.cat); render(); }
    }};
  }

  function notFound() { return {title: '找不到', html: `<h1 tabindex="-1">找不到這一頁</h1>`, primary: {label: '回首頁', href: '#/'}}; }

  /* ---------- render ---------- */
  let current = null, lastKey = null;
  function screen(r) {
    const [a, b, c] = r;
    if (!a) return home();
    if (a === 'essay') return b ? essayList(b) : essayHome();
    if (a === 'q') return question(b);
    if (a === 'a') return article(b, c);
    if (a === 'g') return pack(b, c);
    if (a === 'drill') return c ? drillQ(b, c) : b ? drillStart(b) : drillHome();
    if (a === 'wrong') return wrongList();
    if (a === 'map') return mapView();
    if (a === 'search') return searchResults(b || '');
    return notFound();
  }
  const TAB = {'': 'home', essay: 'essay', q: 'essay', a: 'essay', g: 'essay', drill: 'drill', wrong: 'drill', map: 'map', search: 'map'};
  function render() {
    const s = screen(route()), r = route(), key = r.join('/');
    current = s;
    const main = $('#main');
    main.innerHTML = s.html;
    document.title = s.title && s.title !== '首頁' ? s.title + '｜' + NAME : NAME;
    $('#appName').textContent = NAME;
    $('#back').hidden = ROOTS.includes(r[0] || '') && r.length <= 1;
    const tab = TAB[r[0] || ''] || 'home';
    document.querySelectorAll('#tabs .tab').forEach(t => { if (t.dataset.tab === tab) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current'); });
    const act = $('#act');
    if (s.primary) {
      const p = s.primary;
      act.innerHTML = p.href ? `<a class="primary" id="primary" href="${p.href}">${esc(p.label)}</a>` : `<button type="button" class="primary" id="primary" data-act="${esc(p.act)}">${esc(p.label)}</button>`;
      act.hidden = false;
    } else { act.innerHTML = ''; act.hidden = true; }
    document.body.classList.toggle('has-act', !!s.primary);
    if (key !== lastKey) {
      lastKey = key;
      try { window.scrollTo(0, 0); } catch (e) {}
      const h = main.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({preventScroll: true}); } catch (e) {} }
    }
  }
  function onAct(e) {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act;
    if (act === 'retry') { essayErr = false; Object.keys(drillErr).forEach(k => delete drillErr[k]); loadEssay(); render(); return; }
    if (current && current.onAct) current.onAct(act, el);
  }
  function onLink(e) {
    const a = e.target.closest('a[href^="#/"]');
    if (a && current && current.onLink) current.onLink(a);
  }

  function onRoute() {
    if (!history.state || typeof history.state.d !== 'number') history.replaceState({d: depth + 1}, '', location.href);
    depth = history.state.d;
    render();
  }

  function boot() {
    if (!history.state || typeof history.state.d !== 'number') history.replaceState({d: 0}, '', location.href);
    depth = history.state.d;
    $('#back').addEventListener('click', back);
    $('#main').addEventListener('submit', e => {
      if (e.target.id !== 'law-search') return;
      e.preventDefault(); const value = $('#law-query').value.trim();
      if (value) go('search/' + enc(value));
    });
    $('#main').addEventListener('input', e => {
      if (!e.target.matches('[data-note]')) return;
      const notes = getLS('lexo-notes', {}); notes[e.target.dataset.note] = e.target.value;
      try { localStorage.setItem('lexo-notes', JSON.stringify(notes)); $('#note-status').textContent = '已儲存在這台裝置'; }
      catch (err) { $('#note-status').textContent = '儲存失敗，請先複製你的筆記'; }
    });
    $('#main').addEventListener('click', onAct);
    $('#act').addEventListener('click', onAct);
    $('#main').addEventListener('click', onLink, true);
    // Tapping the tab you are on goes back to its top, like a native app.
    $('#tabs').addEventListener('click', e => {
      const t = e.target.closest('.tab');
      if (t && t.getAttribute('href') === (location.hash || '#/')) { e.preventDefault(); try { window.scrollTo({top: 0, behavior: 'smooth'}); } catch (x) {} }
    });
    window.addEventListener('hashchange', onRoute);
    let rw = window.innerWidth;
    window.addEventListener('resize', () => { if (route()[0] === 'map' && window.innerWidth !== rw) { rw = window.innerWidth; render(); } });
    render();
    registerSW();
  }

  function registerSW() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(reg => {
        const offer = () => {
          if ($('#upd') || !reg.waiting || !navigator.serviceWorker.controller) return;
          const b = document.createElement('button');
          b.id = 'upd'; b.className = 'upd'; b.type = 'button'; b.textContent = '有新版本，點這裡更新';
          b.onclick = () => reg.waiting && reg.waiting.postMessage('skipWaiting');
          document.body.appendChild(b);
        };
        offer();
        reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') offer(); }); });
      }).catch(() => {});
      navigator.serviceWorker.addEventListener('controllerchange', () => { if ($('#upd')) location.reload(); });
    });
  }

  window.LEXO = {layoutHex, mapWidth, SUBJECTS};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
