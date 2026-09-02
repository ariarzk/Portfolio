/* EMW Design System — MOT-05, page transition (the curtain).
   The behaviour half of the pattern; the CSS lives in _ds_bundle.css.

   A multi-page site, so the transition has to survive real navigations:
   the outgoing page closes the curtain and records that it did, and the
   incoming page reads that record before first paint and starts covered.

   ---------------------------------------------------------------------
   1. Markup, once per page, immediately after <body>:

      <div class="curtain" aria-hidden="true">
        <div class="curtain-cols">
          <span class="curtain-col" style="--i:0"></span>
          … seven in total …
        </div>
        <div class="curtain-label">
          <span class="curtain-name"></span><span class="curtain-dot">.</span>
        </div>
      </div>

   2. In <head>, BEFORE any stylesheet, so the state is resolved before
      the first paint. `page` is this page's own name:

      <script>
        (function () {
          var d = document.documentElement, page = 'Holdings';
          try {
            var closed = sessionStorage.getItem('curtain:closed');
            var label  = sessionStorage.getItem('curtain:label');
            var seen   = sessionStorage.getItem('curtain:seen');
            sessionStorage.removeItem('curtain:closed');
            sessionStorage.removeItem('curtain:label');
            sessionStorage.setItem('curtain:seen', '1');
            if (closed || !seen) {
              d.setAttribute('data-curtain', 'closed');
              if (!closed) d.setAttribute('data-curtain-intro', '');
              d.style.setProperty('--curtain-label',
                JSON.stringify(closed && label ? label : page));
            }
          } catch (e) {}
        })();
      </script>

   3. This file, deferred:  <script src="page-transition.js" defer></script>

   Naming the destination, in order of precedence:
     a. data-curtain="Holdings" on the link itself
     b. window.EMW_CURTAIN_LABELS — { '/holdings': 'Holdings' }, matched
        against the end of the destination path once '/index.html' and any
        trailing slash are trimmed, so it works at a domain root or in a
        subfolder. The key '/' names the site root itself. Declare it before
        this file loads; longest keys first, since the first match wins.
     c. the link's own text, less any arrow
   --------------------------------------------------------------------- */
(function () {
  var html = document.documentElement;
  var curtain = document.querySelector('.curtain');
  if (!curtain) return;

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var COLS = curtain.querySelectorAll('.curtain-col').length || 7;
  var STAGGER = reduce ? 0 : 40;                       /* --curtain-stagger */
  var DUR = reduce ? 160 : 640;                        /* --motion-deliberate */
  var SWEEP = STAGGER * (COLS - 1) + DUR;              /* last column finishing */
  var HOLD = reduce ? 100 : 320;                       /* --motion-standard */
  var INTRO = reduce ? 220 : 960;                      /* deliberate + standard */

  curtain.style.setProperty('--curtain-cols', COLS);

  var LABELS = window.EMW_CURTAIN_LABELS || {};

  function labelFor(a) {
    if (a.getAttribute('data-curtain')) return a.getAttribute('data-curtain');
    var raw = a.pathname || '';
    var path = raw.replace(/\/index\.html$/, '').replace(/\/$/, '');
    for (var key in LABELS) {
      if (Object.prototype.hasOwnProperty.call(LABELS, key) && key !== '/' &&
          path.slice(-key.length) === key) return LABELS[key];
    }
    /* '/' names the site root, wherever the site is mounted */
    if (LABELS['/'] && (path === '' || /\/index\.html$|\/$/.test(raw))) return LABELS['/'];
    return (a.textContent || '').replace(/[\u2190-\u21FF+\u2212]/g, '').trim();
  }

  function setLabel(text) {
    /* a CSS string, so quotes and apostrophes in a page name survive */
    html.style.setProperty('--curtain-label', JSON.stringify(String(text)));
  }

  /* transitions are suppressed until after the first paint, so the curtain
     is never caught assembling itself */
  requestAnimationFrame(function () { curtain.classList.add('is-animated'); });

  function open() {
    if (!html.hasAttribute('data-curtain')) return;
    html.setAttribute('data-curtain', 'opening');
    html.removeAttribute('data-curtain-intro');
    setTimeout(function () { html.removeAttribute('data-curtain'); }, SWEEP + 80);
  }

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
    if (!/^(https?|file):$/.test(url.protocol)) return;                // mailto:, tel:
    if (url.protocol !== location.protocol) return;                    // file:// previews
    if (url.host !== location.host) return;                            // external
    if (url.href === location.href) return;
    if (url.pathname === location.pathname && url.hash) return;        // same-page anchor
    e.preventDefault();
    leave(url.href, labelFor(a));
  });
})();
