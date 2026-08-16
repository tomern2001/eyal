// Shared behaviour for the secondary pages: theme toggle, matching index.html.
(function () {
  'use strict';

  var btn = document.getElementById('themeToggle');
  if (!btn) return;

  var label = btn.querySelector('.theme-label');
  var icon = btn.querySelector('.theme-icon');
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function current() {
    return document.documentElement.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light');
  }

  function paint() {
    var dark = current() === 'dark';
    btn.setAttribute('aria-pressed', String(dark));
    label.textContent = dark ? 'מצב בהיר' : 'מצב כהה';
    icon.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', dark ? 'עבור למצב תצוגה בהיר' : 'עבור למצב תצוגה כהה');
  }

  btn.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
    paint();
  });

  mq.addEventListener('change', function () {
    if (!document.documentElement.getAttribute('data-theme')) paint();
  });

  paint();
})();
