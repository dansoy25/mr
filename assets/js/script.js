/* ============================================================
   M&R MECH DEVELOPMENT INC. — Interactions
   ============================================================ */
(function () {
  'use strict';
  // Mark <html> so CSS can enable JS-dependent enhancements (entrance animations
  // are gated behind this — without it the page is fully visible immediately).
  document.documentElement.classList.add('js');

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- THEME TOGGLE ----------
  const themeToggle = $('#themeToggle');
  const root = document.documentElement;
  const STORAGE_KEY = 'mr-mech-theme';

  const applyTheme = (mode) => {
    root.setAttribute('data-theme', mode);
    if (themeToggle) {
      const icon = $('.theme-icon', themeToggle);
      if (icon) icon.textContent = mode === 'dark' ? '☀️' : '🌙';
      themeToggle.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  };

  const stored = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(stored || (prefersDark ? 'dark' : 'light'));

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  }

  // ---------- SCROLL PROGRESS + STICKY HEADER ----------
  const progress = $('#scrollProgress');
  const header   = $('#siteHeader');
  const back     = $('#backToTop');

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
    if (header) header.classList.toggle('scrolled', scrollTop > 10);
    if (back)   back.classList.toggle('visible', scrollTop > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- BACK TO TOP ----------
  if (back) {
    back.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---------- MOBILE MENU ----------
  const hamburger = $('#hamburger');
  const nav = $('#siteNav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    $$('a', nav).forEach((a) => {
      a.addEventListener('click', () => {
        if (nav.classList.contains('open')) {
          nav.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          hamburger.setAttribute('aria-label', 'Open menu');
        }
      });
    });
  }

  // ---------- ACTIVE NAV LINK (scrollspy) ----------
  const navLinks = $$('.nav a[href^="#"]');
  const sections = navLinks
    .map((a) => {
      const id = a.getAttribute('href').slice(1);
      return id ? document.getElementById(id) : null;
    })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((a) => {
              a.classList.toggle('active', a.getAttribute('href') === '#' + id);
            });
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  // ---------- REVEAL STAGGER ----------
  // Detect whether animations actually tick forward — some embedded browsers
  // pause requestAnimationFrame, which would leave fade-in elements invisible.
  // If animations don't advance within 120ms, we leave the page fully visible.
  let rafFired = false;
  requestAnimationFrame(() => { rafFired = true; });
  setTimeout(() => {
    if (!rafFired) return; // skip entrance animation — page is already visible
    const reveals = $$('.reveal');
    reveals.forEach((el) => el.classList.add('pre'));
    document.documentElement.classList.add('reveal-on');
    // next frame: drop .pre to trigger transition
    requestAnimationFrame(() => requestAnimationFrame(() => {
      reveals.forEach((el) => {
        const d = parseInt(el.dataset.delay || '0', 10);
        if (d > 0) el.style.transitionDelay = d + 'ms';
        el.classList.remove('pre');
      });
    }));
  }, 120);

  // ---------- SMOOTH ANCHOR SCROLL (offset for fixed header) ----------
  const headerH = () => (header ? header.offsetHeight : 72);
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.pageYOffset - headerH() + 1;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  // ---------- ABOUT VIDEO MUTE TOGGLE ----------
  const amcVideo   = $('.amc-video');
  const amcMuteBtn = $('#amcMuteBtn');
  if (amcVideo && amcMuteBtn) {
    amcMuteBtn.addEventListener('click', () => {
      amcVideo.muted = !amcVideo.muted;
      const isMuted = amcVideo.muted;
      amcMuteBtn.classList.toggle('is-unmuted', !isMuted);
      amcMuteBtn.setAttribute('aria-label', isMuted ? 'Unmute video' : 'Mute video');
      amcMuteBtn.setAttribute('title',      isMuted ? 'Unmute video' : 'Mute video');
    });
  }

  // ---------- CONTACT FORM ----------
  const form = $('#contactForm');
  const status = $('#formStatus');
  if (form) {
    const setStatus = (msg, kind) => {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status' + (kind ? ' ' + kind : '');
    };

    const validate = () => {
      let ok = true;
      $$('input[required], select[required], textarea[required]', form).forEach((el) => {
        const val = (el.value || '').trim();
        let bad = !val;
        if (!bad && el.type === 'email') {
          bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        }
        el.classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      return ok;
    };

    $$('input, select, textarea', form).forEach((el) => {
      el.addEventListener('input', () => el.classList.remove('invalid'));
      el.addEventListener('change', () => el.classList.remove('invalid'));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      setStatus('', '');
      if (!validate()) {
        setStatus('Please complete the highlighted fields.', 'error');
        return;
      }
      const btn = $('button[type="submit"]', form);
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      // No backend — simulate success and prepare a mailto fallback link
      const data = new FormData(form);
      const subject = encodeURIComponent('Project inquiry — ' + (data.get('service') || 'General'));
      const body = encodeURIComponent(
        'Name: ' + data.get('name') + '\n' +
        'Email: ' + data.get('email') + '\n' +
        'Phone: ' + (data.get('phone') || '—') + '\n' +
        'Service: ' + data.get('service') + '\n\n' +
        (data.get('message') || '')
      );
      setTimeout(() => {
        setStatus('Thanks! Opening your email client to finish sending…', 'success');
        window.location.href = 'mailto:mrengineering718@gmail.com?subject=' + subject + '&body=' + body;
        setTimeout(() => {
          form.reset();
          if (btn) { btn.disabled = false; btn.textContent = 'Send Request →'; }
        }, 1200);
      }, 400);
    });
  }
})();
