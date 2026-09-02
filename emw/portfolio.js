/* Shared behaviour for every page of the portfolio: theme, reveal, and the
   page-transition curtain.
   Loaded with `defer` from every page.
   The pre-paint theme read stays inline in each document head — it has to
   run before first paint, which a deferred file cannot. */

// Theme — Paper / Terminal, on one icon button.
(function () {
  var buttons = document.querySelectorAll('[data-theme-toggle]');
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    buttons.forEach(function (b) {
      b.setAttribute('aria-label', theme === 'dark' ? 'Switch to the Paper theme' : 'Switch to the Terminal theme');
      b.setAttribute('title', theme === 'dark' ? 'Paper' : 'Terminal');
    });
    try { localStorage.setItem('emw-theme', theme); } catch (e) {}
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  });
  apply(document.documentElement.getAttribute('data-theme') || 'dark');
})();

// Sections arrive on the editorial reveal.
(function () {
  var targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (t) { t.classList.add('in'); });
    return;
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  targets.forEach(function (t) { obs.observe(t); });
})();

/* ── Page transition ──────────────────────────────────────────────
   A multi-page site, so the curtain has to survive real navigations:
   the closing half plays here, a sessionStorage flag tells the next
   page to start covered, and its head script paints that state before
   anything else renders. */
(function () {
  var html = document.documentElement;
  var curtain = document.querySelector('.curtain');
  if (!curtain) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLS = curtain.querySelectorAll('.curtain-col').length || 7;
  var STAGGER = reduce ? 0 : 50;
  var DUR = reduce ? 160 : 480;
  var SWEEP = STAGGER * (COLS - 1) + DUR;   // last column finishing
  var HOLD = reduce ? 100 : 380;            // between pages
  var INTRO = reduce ? 220 : 900;           // the first load reads as a loading screen

  /* section names, matched by path suffix so the site works at a
     domain root or in a project subfolder */
  var NAMES = [
    ['/work/investment-framework', 'Investment Framework'],
    ['/work/blowing-machine',      'Blowing Machine'],
    ['/work/quality-improvement',  'Quality Improvement'],
    ['/work/manufacture-terminal', 'Manufacture Terminal'],
    ['/work',                      'Selected Work'],
    ['/skills',                    'How I think'],
    ['/contact',                   'Contact']
  ];

  function labelFor(a) {
    if (a.getAttribute('data-curtain')) return a.getAttribute('data-curtain');
    var path = a.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
    for (var i = 0; i < NAMES.length; i++) {
      if (path.slice(-NAMES[i][0].length) === NAMES[i][0]) return NAMES[i][1];
    }
    if (/\/index\.html$|\/$/.test(a.pathname) || path === '') return 'Profile';
    return (a.textContent || '').replace(/[→↗←+−]/g, '').trim() || 'Loading';
  }

  function setLabel(text) {
    html.style.setProperty('--curtain-label', JSON.stringify(String(text)));
  }

  /* let the browser paint the closed state once before transitions apply */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { curtain.classList.add('is-animated'); });
  });

  function open() {
    if (!html.hasAttribute('data-curtain')) return;
    html.setAttribute('data-curtain', 'opening');
    html.removeAttribute('data-curtain-intro');
    setTimeout(function () { html.removeAttribute('data-curtain'); }, SWEEP + 80);
  }

  /* arriving covered — hold briefly, then reveal */
  if (html.getAttribute('data-curtain') === 'closed') {
    setTimeout(open, html.hasAttribute('data-curtain-intro') ? INTRO : HOLD);
  }

  /* back/forward out of the bfcache must never restore a closed curtain */
  window.addEventListener('pageshow', function (e) { if (e.persisted) open(); });

  function leave(href, label) {
    try {
      sessionStorage.setItem('curtain:closed', '1');
      sessionStorage.setItem('curtain:label', label);
    } catch (e) {}
    setLabel(label);
    html.setAttribute('data-curtain', 'closed');
    setTimeout(function () { window.location.href = href; }, SWEEP + 40);
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;      // new tab / window
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.hasAttribute('download')) return;
    if (a.target && a.target !== '_self') return;                      // opens elsewhere
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (!/^(https?|file):$/.test(url.protocol)) return;                 // mailto:, tel:
    if (url.protocol !== location.protocol) return;
    if (url.host !== location.host) return;                            // external
    if (url.href === location.href) return;
    if (url.pathname === location.pathname && url.hash) return;        // same-page anchor
    e.preventDefault();
    leave(url.href, labelFor(a));
  });
})();
