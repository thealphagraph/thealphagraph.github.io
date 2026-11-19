(function () {
  'use strict';

  var menuBtn = document.getElementById('menu-btn');
  var menu = document.getElementById('menu');
  var shareBtn = document.getElementById('share-btn');
  var toast = document.getElementById('toast');
  var toastTimer;

  /* Footer year */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Menu open / close */
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
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      setMenu(false);
      menuBtn.focus();
    }
  });

  /* About and Contact dialogs */
  menu.querySelectorAll('[data-dialog]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dlg = document.getElementById(btn.getAttribute('data-dialog'));
      setMenu(false);
      if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
    });
  });

  document.querySelectorAll('dialog').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) dlg.close();
    });
  });

  /* Share button */
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1800);
  }

  shareBtn.addEventListener('click', function () {
    var url = location.href;
    if (navigator.share) {
      navigator.share({ title: 'The AlphaGraph', url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { showToast('Link copied'); });
    }
  });
})();
