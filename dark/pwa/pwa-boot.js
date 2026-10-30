// Original answer records remain in localStorage, using the v68 keys.
(function () {
  'use strict';
  var lawuHadCtl = 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;   // 2026-10-30 題庫換新自動更新
  function status(text) {
    var el = document.getElementById('pwaStatus');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pwaStatus'; el.setAttribute('role', 'status');
      document.querySelector('.hud').appendChild(el);
    }
    el.textContent = text;
  }
  window.addEventListener('load', function () {
    try {
      localStorage.setItem('lawu-storage-test', '1');
      localStorage.removeItem('lawu-storage-test');
    } catch (error) {
      status('本機儲存無法使用，作答紀錄可能無法保留');
      return;
    }
    if (!('serviceWorker' in navigator)) { status('此瀏覽器不支援離線安裝'); return; }
    status('正在準備離線題庫…');
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      function ready() { status('離線題庫已備妥 · 作答紀錄存本機'); }
      function update() {
        if (document.getElementById('lawuUpd')) return;
        var b = document.createElement('button');
        b.id = 'lawuUpd'; b.className = 'lawu-upd'; b.textContent = '新版本已備妥，點此更新';
        b.onclick = function () { if (reg.waiting) reg.waiting.postMessage('skipWaiting'); };
        document.body.appendChild(b);
      }
      if (reg.active) ready();
      if (reg.waiting && navigator.serviceWorker.controller) update();
      function watch(worker) {
        if (!worker) return;
        worker.addEventListener('statechange', function () {
          if (worker.state === 'installed') {
            ready();
            if (navigator.serviceWorker.controller) update();
          }
          if (worker.state === 'redundant') status('離線題庫準備失敗，請連網後重新整理');
        });
      }
      watch(reg.installing);
      reg.addEventListener('updatefound', function () { watch(reg.installing); });
      navigator.serviceWorker.ready.then(ready);
    }).catch(function () { status('離線題庫準備失敗，請以 HTTPS 或 localhost 開啟'); });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (lawuHadCtl || document.getElementById('lawuUpd')) location.reload();
    });
  });
})();
