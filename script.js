(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var menuBtn = $('menu-btn'), menu = $('menu'), shareBtn = $('share-btn');
  var timers = {};

  /* Footer year */
  $('year').textContent = new Date().getFullYear();

  /* Toast (each dialog needs its own, because dialogs sit above everything) */
  function showToast(el, text) {
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(timers[el.id]);
    timers[el.id] = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }

  /* Tap ripple on every button and link */
  document.addEventListener('pointerdown', function (e) {
    var t = e.target.closest('.link, .icon-btn, .menu > *, .btn, .logo, .close');
    if (!t) return;
    var r = t.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2;
    var d = document.createElement('span');
    d.className = 'ripple';
    d.style.width = d.style.height = size + 'px';
    d.style.left = (e.clientX - r.left - size / 2) + 'px';
    d.style.top = (e.clientY - r.top - size / 2) + 'px';
    t.appendChild(d);
    d.addEventListener('animationend', function () { d.remove(); });
  });

  /* Let the ripple play for a moment, then open the panel */
  function later(dlg, ms, before) {
    setTimeout(function () {
      if (dlg.open) return;
      if (before) before();
      dlg.showModal();
    }, ms);
  }

  /* Menu */
  function setMenu(open) {
    menu.classList.toggle('open', open);
    menu.inert = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    setMenu(!menu.classList.contains('open'));
  });
  document.addEventListener('click', function (e) {
    if (menu.classList.contains('open') && !menu.contains(e.target)) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });

  /* About and Contact */
  menu.querySelectorAll('[data-dialog]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dlg = $(btn.getAttribute('data-dialog'));
      setMenu(false);
      if (dlg && dlg.showModal) later(dlg, 120);
    });
  });
  document.querySelectorAll('dialog').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  });

  /* Page share button */
  shareBtn.addEventListener('click', function () {
    if (navigator.share) {
      navigator.share({ title: 'The AlphaGraph', url: location.href }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href).then(function () { showToast($('toast'), 'Link copied'); });
    }
  });

  /* Confirm panel before opening a social link */
  var confirmDlg = $('confirm-dialog'), openLink = $('confirm-open');
  var names = { 'youtube.com': 'YouTube', 't.me': 'Telegram', 'x.com': 'X', 'facebook.com': 'Facebook', 'instagram.com': 'Instagram', 'threads.com': 'Threads' };

  document.addEventListener('click', function (e) {
    var a = e.target.closest('.link, .menu a');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    var host = new URL(a.href).hostname.replace(/^www\./, '');
    var name = names[host] || host;
    setMenu(false);
    $('confirm-title').textContent = 'Open ' + name + '?';
    $('confirm-text').textContent = 'This will take you to The AlphaGraph on ' + name + '.';
    openLink.href = a.href;
    later(confirmDlg, 180);
  });
  $('confirm-cancel').addEventListener('click', function () { confirmDlg.close(); });
  openLink.addEventListener('click', function () { setTimeout(function () { confirmDlg.close(); }, 0); });
  window.addEventListener('pageshow', function () { if (confirmDlg.open) confirmDlg.close(); });

  /* Logo viewer: pinch / wheel / double-tap zoom, drag, download, share */
  var viewer = $('viewer'), stage = $('stage'), pic = $('viewer-img');
  var s = 1, x = 0, y = 0, d0 = 0, s0 = 1, pts = {}, lastTap = 0, down = null, logoFile = null;

  function apply() { pic.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')'; }
  function fit() {
    s = Math.min(5, Math.max(1, s));
    var side = Math.min(pic.offsetWidth, pic.offsetHeight);
    var mx = Math.max(0, (side * s - stage.clientWidth) / 2);
    var my = Math.max(0, (side * s - stage.clientHeight) / 2);
    x = Math.min(mx, Math.max(-mx, x));
    y = Math.min(my, Math.max(-my, y));
    apply();
  }
  function reset() { s = 1; x = 0; y = 0; pts = {}; apply(); }
  function ids() { return Object.keys(pts); }
  function base() {
    var k = ids();
    if (k.length === 2) {
      d0 = Math.hypot(pts[k[0]].x - pts[k[1]].x, pts[k[0]].y - pts[k[1]].y);
      s0 = s;
    }
  }

  $('logo-btn').addEventListener('click', function () {
    later(viewer, 150, reset);
    if (!logoFile && window.fetch) {
      fetch('2983.jpg').then(function (r) { return r.blob(); }).then(function (b) {
        logoFile = new File([b], 'The-AlphaGraph-logo.jpg', { type: b.type || 'image/jpeg' });
      }).catch(function () {});
    }
  });
  viewer.addEventListener('close', reset);

  stage.addEventListener('pointerdown', function (e) {
    stage.setPointerCapture(e.pointerId);
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    down = { x: e.clientX, y: e.clientY };
    base();
  });
  stage.addEventListener('pointermove', function (e) {
    var prev = pts[e.pointerId];
    if (!prev) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var k = ids();
    if (k.length === 2) {
      var d = Math.hypot(pts[k[0]].x - pts[k[1]].x, pts[k[0]].y - pts[k[1]].y);
      if (d0) s = s0 * d / d0;
      x += (e.clientX - prev.x) / 2;
      y += (e.clientY - prev.y) / 2;
    } else if (s > 1) {
      x += e.clientX - prev.x;
      y += e.clientY - prev.y;
    }
    fit();
  });
  function end(e) {
    var tapped = down && pts[e.pointerId] && ids().length === 1 &&
      Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8;
    delete pts[e.pointerId];
    base();
    if (tapped && e.type === 'pointerup') {
      var now = Date.now();
      if (now - lastTap < 300) { s = s > 1 ? 1 : 2.5; x = 0; y = 0; fit(); lastTap = 0; }
      else lastTap = now;
    }
  }
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    s *= e.deltaY < 0 ? 1.1 : 0.9;
    fit();
  }, { passive: false });

  /* Share the logo file when the browser allows it, else the page link */
  $('viewer-share').addEventListener('click', function () {
    var t = $('viewer-toast');
    if (logoFile && navigator.canShare && navigator.canShare({ files: [logoFile] })) {
      navigator.share({ files: [logoFile], title: 'The AlphaGraph' }).catch(function () {});
    } else if (navigator.share) {
      navigator.share({ title: 'The AlphaGraph', url: location.href }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href).then(function () { showToast(t, 'Link copied'); });
    }
  });
})();
        
