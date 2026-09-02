/* Shared behaviour for every page of the portfolio: theme, reveal, and the
   destination names for the design system's page transition.
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
   MOT-05 comes from the design system: markup and CSS in
   ds-bundle.css, behaviour in page-transition.js, which loads after
   this file. All this site has to say is what each page is called.
   Longest paths first — the first match wins. */
window.EMW_CURTAIN_LABELS = {
  '/work/investment-framework': 'Investment Framework',
  '/work/blowing-machine':      'Blowing Machine',
  '/work/quality-improvement':  'Quality Improvement',
  '/work/manufacture-terminal': 'Manufacture Terminal',
  '/work':                      'Selected Work',
  '/skills':                    'How I think',
  '/contact':                   'Contact',
  '/':                          'Profile'
};
