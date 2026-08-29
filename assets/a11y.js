/* Self-hosted accessibility toolbar.
   Builds its own markup so a single <script> include covers every page, keeps
   every choice in localStorage, and sends nothing anywhere. */
(function () {
  'use strict';

  var STORE = 'a11ySettings';
  var MIN_FONT = 100, MAX_FONT = 160, STEP = 10;

  var state = { font: 100, contrast: null, flags: {} };

  // Mutually exclusive contrast modes; the rest are independent toggles.
  var CONTRAST = {
    hcDark: 'a11y-hc-dark',
    hcLight: 'a11y-hc-light',
    monochrome: 'a11y-monochrome',
    invert: 'a11y-invert'
  };

  var FLAGS = {
    spacing: 'a11y-spacing',
    readable: 'a11y-readable',
    links: 'a11y-links',
    headings: 'a11y-headings',
    stopmotion: 'a11y-stopmotion',
    cursor: 'a11y-cursor'
  };

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        state.font = Math.min(MAX_FONT, Math.max(MIN_FONT, +saved.font || 100));
        state.contrast = Object.prototype.hasOwnProperty.call(CONTRAST, saved.contrast) ? saved.contrast : null;
        state.flags = {};
        Object.keys(FLAGS).forEach(function (k) { if (saved.flags && saved.flags[k]) state.flags[k] = true; });
      }
    } catch (e) { /* private mode, or corrupt value - fall back to defaults */ }
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  var themeMq = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || (themeMq.matches ? 'dark' : 'light');
  }

  function apply() {
    var root = document.documentElement;

    Object.keys(CONTRAST).forEach(function (k) {
      root.classList.toggle(CONTRAST[k], state.contrast === k);
    });
    Object.keys(FLAGS).forEach(function (k) {
      root.classList.toggle(FLAGS[k], !!state.flags[k]);
    });

    root.style.fontSize = state.font === 100 ? '' : state.font + '%';

    // reflect state on the controls
    document.querySelectorAll('[data-a11y-contrast]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(state.contrast === b.dataset.a11yContrast));
    });
    document.querySelectorAll('[data-a11y-flag]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(!!state.flags[b.dataset.a11yFlag]));
    });
    var val = document.getElementById('a11yFontVal');
    if (val) val.textContent = state.font + '%';

    var themeBtn = document.getElementById('a11yThemeDark');
    if (themeBtn) {
      var dark = currentTheme() === 'dark';
      themeBtn.setAttribute('aria-pressed', String(dark));
      themeBtn.setAttribute('aria-label', dark ? 'כיבוי מצב תצוגה כהה' : 'הפעלת מצב תצוגה כהה');
    }
  }

  function icon(paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }

  var ICONS = {
    person: icon('<circle cx="12" cy="4.5" r="2"/><path d="M5 8.5h14"/><path d="M12 8.5v6"/><path d="M9 21l3-6.5 3 6.5"/>'),
    contrast: icon('<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>'),
    moon: icon('<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>'),
    sun: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>'),
    droplet: icon('<path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10z"/>'),
    text: icon('<path d="M4 6h16M4 12h16M4 18h11"/>'),
    font: icon('<path d="M5 19l6-14 6 14"/><path d="M7.5 14h7"/>'),
    link: icon('<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>'),
    heading: icon('<path d="M6 4v16M18 4v16M6 12h12"/>'),
    motion: icon('<circle cx="12" cy="12" r="9"/><path d="M9 9h6v6H9z"/>'),
    cursor: icon('<path d="M5 3l14 8-6 1.5L10 19z"/>'),
    reset: icon('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
    display: icon('<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8.5 21h7"/><path d="M12 16.5V21"/>')
  };

  function optionButton(kind, key, label, ico) {
    return '<button type="button" class="a11y-opt" data-a11y-' + kind + '="' + key + '" aria-pressed="false">' +
      ico + '<span>' + label + '</span></button>';
  }

  function build() {
    var launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'a11y-launcher';
    launcher.id = 'a11yLauncher';
    launcher.setAttribute('aria-label', 'פתיחת תפריט נגישות');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'a11yPanel');
    launcher.innerHTML = ICONS.person;

    var overlay = document.createElement('div');
    overlay.className = 'a11y-overlay';
    overlay.id = 'a11yOverlay';

    var panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.id = 'a11yPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'a11yTitle');
    panel.setAttribute('hidden', '');

    panel.innerHTML =
      '<div class="a11y-head">' +
        '<h2 id="a11yTitle">תפריט נגישות</h2>' +
        '<button type="button" class="a11y-close" id="a11yClose" aria-label="סגירת תפריט נגישות">✕</button>' +
      '</div>' +
      '<div class="a11y-body">' +

        '<div class="a11y-group">' +
          '<h3>גודל טקסט</h3>' +
          '<div class="a11y-stepper">' +
            '<button type="button" class="a11y-step-btn" id="a11yFontDown" aria-label="הקטנת גודל הטקסט">−</button>' +
            '<span class="a11y-step-val" id="a11yFontVal" role="status" aria-live="polite">100%</span>' +
            '<button type="button" class="a11y-step-btn" id="a11yFontUp" aria-label="הגדלת גודל הטקסט">+</button>' +
          '</div>' +
        '</div>' +

        '<div class="a11y-group">' +
          '<h3>תצוגה</h3>' +
          '<div class="a11y-grid">' +
            '<button type="button" class="a11y-opt" id="a11yThemeDark" aria-pressed="false">' +
              ICONS.display + '<span>מצב כהה</span></button>' +
          '</div>' +
        '</div>' +

        '<div class="a11y-group">' +
          '<h3>ניגודיות וצבע</h3>' +
          '<div class="a11y-grid">' +
            optionButton('contrast', 'hcDark', 'ניגודיות כהה', ICONS.moon) +
            optionButton('contrast', 'hcLight', 'ניגודיות בהירה', ICONS.sun) +
            optionButton('contrast', 'monochrome', 'גווני אפור', ICONS.droplet) +
            optionButton('contrast', 'invert', 'היפוך צבעים', ICONS.contrast) +
          '</div>' +
        '</div>' +

        '<div class="a11y-group">' +
          '<h3>קריאות</h3>' +
          '<div class="a11y-grid">' +
            optionButton('flag', 'readable', 'גופן קריא', ICONS.font) +
            optionButton('flag', 'spacing', 'ריווח טקסט', ICONS.text) +
            optionButton('flag', 'links', 'הדגשת קישורים', ICONS.link) +
            optionButton('flag', 'headings', 'הדגשת כותרות', ICONS.heading) +
          '</div>' +
        '</div>' +

        '<div class="a11y-group">' +
          '<h3>ניווט</h3>' +
          '<div class="a11y-grid">' +
            optionButton('flag', 'cursor', 'סמן גדול', ICONS.cursor) +
            optionButton('flag', 'stopmotion', 'עצירת אנימציות', ICONS.motion) +
          '</div>' +
        '</div>' +

      '</div>' +
      '<div class="a11y-foot">' +
        '<button type="button" class="a11y-reset" id="a11yReset">ביטול הגדרות נגישות</button>' +
        '<a href="accessibility.html">להצהרת הנגישות המלאה</a>' +
      '</div>';

    document.body.appendChild(launcher);
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    return { launcher: launcher, overlay: overlay, panel: panel };
  }

  function init() {
    var els = build();
    var panel = els.panel, launcher = els.launcher, overlay = els.overlay;
    var lastFocus = null;

    function focusables() {
      return Array.prototype.filter.call(
        panel.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])'),
        function (el) { return el.offsetParent !== null; }
      );
    }

    function open() {
      lastFocus = document.activeElement;
      panel.removeAttribute('hidden');
      // let the browser paint the un-hidden panel before transitioning it in
      requestAnimationFrame(function () {
        panel.classList.add('open');
        overlay.classList.add('open');
      });
      launcher.setAttribute('aria-expanded', 'true');
      var f = focusables();
      if (f.length) f[0].focus();
    }

    function close() {
      panel.classList.remove('open');
      overlay.classList.remove('open');
      launcher.setAttribute('aria-expanded', 'false');
      window.setTimeout(function () { panel.setAttribute('hidden', ''); }, 280);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    launcher.addEventListener('click', function () {
      panel.classList.contains('open') ? close() : open();
    });
    overlay.addEventListener('click', close);
    document.getElementById('a11yClose').addEventListener('click', close);

    // keep keyboard focus inside the dialog while it is open
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    panel.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-a11y-contrast], [data-a11y-flag]');
      if (!btn) return;
      if (btn.dataset.a11yContrast) {
        var c = btn.dataset.a11yContrast;
        state.contrast = state.contrast === c ? null : c; // clicking the active mode clears it
      } else {
        var k = btn.dataset.a11yFlag;
        state.flags[k] = !state.flags[k];
      }
      apply(); save();
    });

    document.getElementById('a11yThemeDark').addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
      apply();
    });

    // follow the OS while no explicit choice has been made
    themeMq.addEventListener('change', function () {
      if (!document.documentElement.getAttribute('data-theme')) apply();
    });

    document.getElementById('a11yFontUp').addEventListener('click', function () {
      state.font = Math.min(MAX_FONT, state.font + STEP); apply(); save();
    });
    document.getElementById('a11yFontDown').addEventListener('click', function () {
      state.font = Math.max(MIN_FONT, state.font - STEP); apply(); save();
    });
    document.getElementById('a11yReset').addEventListener('click', function () {
      state = { font: 100, contrast: null, flags: {} };
      // the theme lives in the panel now, so a full reset returns it to the OS setting too
      document.documentElement.removeAttribute('data-theme');
      apply();
      try {
        localStorage.removeItem(STORE);
        localStorage.removeItem('theme');
      } catch (e) { /* private mode */ }
    });

    load();
    apply();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
