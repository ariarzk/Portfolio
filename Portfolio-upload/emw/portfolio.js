/* Shared behaviour for every page of the portfolio: theme + reveal.
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
