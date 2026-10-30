/* Plansman 2026 — header, menu, reveals, pinned hero crossfade, sticky work stage, band drift, filters, form. */
(function () {
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGsap) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); }

  // Header compacts after the first screen
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('compact', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Mobile menu
  var menu = document.querySelector('.menu');
  document.querySelectorAll('[data-menu]').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      menu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
  });

  // Reveal on enter
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }) : null;
  document.querySelectorAll('.reveal, .reveal-img').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); });

  // Pinned hero: scroll crossfades through featured images, caption follows
  var hero = document.querySelector('.hero[data-pin]');
  if (hero) {
    var imgs = hero.querySelectorAll('.hero-img');
    var caps = hero.querySelectorAll('.hero-caption [data-cap]');
    var idx = hero.querySelector('.hero-index');
    var n = imgs.length;
    function show(i) {
      imgs.forEach(function (im, k) { im.style.opacity = k === i ? 1 : 0; });
      caps.forEach(function (c) { var d = JSON.parse(c.getAttribute('data-cap')); c.textContent = d[i] || ''; });
      if (idx) idx.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    }
    if (hasGsap && !reduce && n > 1) {
      var tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=' + (n * 90) + '%', pin: true, scrub: 0.6, anticipatePin: 1,
        onUpdate: function (st) { var i = Math.min(n - 1, Math.floor(st.progress * n)); if (i !== hero._i) { hero._i = i; caps.forEach(function (c) { var d = JSON.parse(c.getAttribute('data-cap')); c.textContent = d[i] || ''; }); if (idx) idx.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0'); } } } });
      imgs.forEach(function (im, k) {
        gsap.set(im, { opacity: k === 0 ? 1 : 0, scale: 1.06 });
        tl.to(im, { scale: 1, duration: 1, ease: 'none' }, k);
        if (k > 0) tl.to(im, { opacity: 1, duration: 0.35, ease: 'power1.inOut' }, k - 0.35);
      });
      show(0);
    } else if (n > 1 && !reduce) {
      var i = 0; show(0);
      setInterval(function () { i = (i + 1) % n; imgs.forEach(function (im) { im.style.transition = 'opacity 1.4s ease'; }); show(i); }, 4500);
    } else { show(0); }
  }

  // Sticky work stage: the image changes as each entry reaches the middle of the screen
  var stage = document.querySelector('.stage');
  if (stage) {
    var stageImgs = stage.querySelectorAll('.stage-img');
    var entries = document.querySelectorAll('.entry[data-i]');
    function setActive(i) { stageImgs.forEach(function (im, k) { im.classList.toggle('active', k === i); }); }
    setActive(0);
    if ('IntersectionObserver' in window) {
      var eo = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) setActive(parseInt(e.target.getAttribute('data-i'), 10)); });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      entries.forEach(function (el) { eo.observe(el); });
    }
  }

  // Full-bleed band drifts slowly against the scroll
  if (hasGsap && !reduce) {
    document.querySelectorAll('.band img').forEach(function (im) {
      gsap.fromTo(im, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    document.querySelectorAll('.project-hero img, .next img').forEach(function (im) {
      gsap.to(im, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
    });
  }

  // Work filters
  var filters = document.querySelector('.filters');
  if (filters) {
    filters.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-filter]'); if (!b) return;
      filters.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var f = b.getAttribute('data-filter');
      document.querySelectorAll('.card[data-cat]').forEach(function (c) { c.classList.toggle('hide', f !== 'all' && c.getAttribute('data-cat') !== f); });
      if (hasGsap) ScrollTrigger.refresh();
    });
  }

  // Forms: post to data-endpoint when one is configured (Formspree etc.). Until then, open the visitor's
  // mail client with the fields prefilled (data-mailto) so nothing typed into the form is lost.
  document.querySelectorAll('form[data-endpoint]').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var endpoint = form.getAttribute('data-endpoint');
      var done = function () { form.classList.add('sent'); };
      if (endpoint) {
        fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } }).then(done, done);
        return;
      }
      var to = form.getAttribute('data-mailto');
      if (to) {
        var lines = [];
        new FormData(form).forEach(function (v, k) { if (String(v).trim()) lines.push(k.charAt(0).toUpperCase() + k.slice(1) + ': ' + v); });
        var subject = form.getAttribute('data-subject') || 'Website inquiry';
        var name = form.querySelector('[name=name]'); if (name && name.value) subject += ' from ' + name.value;
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      }
      done();
    });
  });
})();
