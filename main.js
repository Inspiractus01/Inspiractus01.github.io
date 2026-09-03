/* Michal Mucha — portfolio motion
   GSAP + ScrollTrigger for scroll, rough.js for hand-drawn frames.
   Sketch stroke colour comes from the CSS var --sketch, so it follows
   the light/dark theme automatically. */

const NS = 'http://www.w3.org/2000/svg';
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- small helpers ---------- */
function splitLetters(el) {
  const text = el.textContent;
  el.textContent = '';
  for (const ch of text) {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(s);
  }
  return el.querySelectorAll('.ch');
}
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((w, i) => {
    const s = document.createElement('span');
    s.className = 'w';
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return el.querySelectorAll('.w');
}
// scramble / decode: random glyphs settle into the final text left to right
function scrambleText(el, finalText, { duration = 1.5, delay = 0 } = {}) {
  if (!window.gsap) return;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>/{}';
  const len = finalText.length;
  const state = { p: 0 };
  gsap.to(state, {
    p: 1, duration, delay, ease: 'power2.out',
    onUpdate: () => {
      const rev = Math.floor(state.p * len);
      let out = '';
      for (let i = 0; i < len; i++)
        out += (i < rev || finalText[i] === ' ') ? finalText[i] : chars[(Math.random() * chars.length) | 0];
      el.textContent = out;
    },
    onComplete: () => { el.textContent = finalText; }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.gsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- theme toggle ---------- */
  const themeBtn = document.querySelector('.theme');
  themeBtn && themeBtn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
  // follow the OS theme when the visitor hasn't picked one manually
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystem = e => {
      let saved = null; try { saved = localStorage.getItem('theme'); } catch (x) {}
      if (!saved) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
    };
    mq.addEventListener ? mq.addEventListener('change', onSystem) : mq.addListener && mq.addListener(onSystem);
  }

  /* ---------- hand-drawn frames (rough.js) ---------- */
  const sketches = [];
  function makeSketch(el, { seed = 1, pad = 3, motif = null, drawTrigger = el, roughness = 1.5 } = {}) {
    if (!window.rough || !el) return;
    const svg = document.createElementNS(NS, 'svg');
    svg.classList.add('rough');
    el.appendChild(svg);
    let paths = [];

    function render() {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.innerHTML = '';
      const rc = rough.svg(svg);
      svg.appendChild(rc.rectangle(pad, pad, w - pad * 2, h - pad * 2,
        { roughness, bowing: 1.4, seed, strokeWidth: 2 }));
      if (motif) drawMotif(rc, svg, motif, w, h, seed);
      paths = Array.from(svg.querySelectorAll('path'));
    }
    render();

    if (REDUCED) { sketches.push({ render }); return; }

    const prime = () => paths.forEach(p => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    prime();
    let drawn = false;
    ScrollTrigger.create({
      trigger: drawTrigger, start: 'top 78%', once: true,
      onEnter: () => { drawn = true; gsap.to(paths, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out', stagger: 0.06 }); }
    });

    // keep crisp on resize
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        render();
        if (drawn || REDUCED) paths.forEach(p => { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = 0; });
        else prime();
        ScrollTrigger.refresh();
      }, 200);
    };
    window.addEventListener('resize', onResize);
    sketches.push({ render });
  }

  // wireframe motifs drawn inside the sketch panels
  function drawMotif(rc, svg, type, w, h, seed) {
    const m = Math.min(w, h) * 0.17;
    const x = m, y = m, iw = w - 2 * m, ih = h - 2 * m;
    if (type === 'browser') {
      const bar = ih * 0.2;
      svg.appendChild(rc.rectangle(x, y, iw, ih, { roughness: 1.3, seed: seed + 1 }));
      svg.appendChild(rc.line(x, y + bar, x + iw, y + bar, { roughness: 1.2, seed: seed + 2 }));
      svg.appendChild(rc.circle(x + bar * 0.55, y + bar * 0.5, bar * 0.34, { seed: seed + 3 }));
      svg.appendChild(rc.circle(x + bar * 1.05, y + bar * 0.5, bar * 0.34, { seed: seed + 4 }));
      const cy = y + bar + (ih - bar) * 0.28;
      svg.appendChild(rc.line(x + iw * 0.1, cy, x + iw * 0.72, cy, { seed: seed + 5 }));
      svg.appendChild(rc.line(x + iw * 0.1, cy + ih * 0.16, x + iw * 0.52, cy + ih * 0.16, { seed: seed + 6 }));
      svg.appendChild(rc.rectangle(x + iw * 0.1, cy + ih * 0.3, iw * 0.34, ih * 0.24, { roughness: 1.4, seed: seed + 7 }));
    } else if (type === 'stack') {
      const gap = ih * 0.14;
      const lh = (ih - 2 * gap) / 3;
      for (let i = 0; i < 3; i++) {
        svg.appendChild(rc.rectangle(x, y + i * (lh + gap), iw, lh, { roughness: 1.4, seed: seed + i }));
      }
      // little link on the side to imply an end-to-end flow
      svg.appendChild(rc.line(x + iw * 0.5, y + lh, x + iw * 0.5, y + lh + gap, { seed: seed + 9 }));
      svg.appendChild(rc.line(x + iw * 0.5, y + 2 * lh + gap, x + iw * 0.5, y + 2 * lh + 2 * gap, { seed: seed + 10 }));
    }
  }

  /* ---------- hero: letters in on load, name drifts on scroll ---------- */
  const nameLines = document.querySelectorAll('.hero__name .line > span');
  let letters = [];
  nameLines.forEach(sp => { letters = letters.concat(Array.from(splitLetters(sp))); });


  if (!REDUCED && window.gsap) {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero__name .ch', { yPercent: 125, duration: 1.0, stagger: 0.035 })
      .from('.hero__meta span', { y: 14, opacity: 0, duration: 0.7, stagger: 0.08 }, '-=0.6')
      .from('.hero__role', { y: 20, opacity: 0, duration: 0.7 }, '-=0.5')
      .from('.hero__tag', { y: 20, opacity: 0, duration: 0.7 }, '-=0.55')
      .from('.hero__scroll', { opacity: 0, duration: 0.6 }, '-=0.3');

    // scramble / decode effect on the role, on load and on hover
    const roleEl = document.querySelector('.hero__role');
    if (roleEl) {
      const finalRole = roleEl.textContent;
      scrambleText(roleEl, finalRole, { duration: 1.6, delay: 0.9 });
      roleEl.style.cursor = 'default';
      roleEl.addEventListener('mouseenter', () => scrambleText(roleEl, finalRole, { duration: 0.9 }));
    }

    // scroll: the two lines pull apart + the block lifts and fades
    const lineEls = document.querySelectorAll('.hero__name .line');
    if (lineEls[0]) gsap.to(lineEls[0], { xPercent: -10, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    if (lineEls[1]) gsap.to(lineEls[1], { xPercent: 12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__name', { yPercent: -18, opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'center top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__foot, .hero__meta', { opacity: 0, y: -20, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'center top', scrub: true } });
  }

  /* ---------- about ---------- */
  if (!REDUCED && window.gsap) {
    gsap.from('.about__lead .w', {
      scrollTrigger: { trigger: '.about__lead', start: 'top 80%' },
      yPercent: 115, opacity: 0, duration: 0.85, ease: 'power3.out', stagger: 0.028
    });
    gsap.from('.about__now', {
      scrollTrigger: { trigger: '.about__now', start: 'top 88%' },
      y: 22, opacity: 0, duration: 0.7, ease: 'power2.out'
    });
  }

  /* ---------- journey: reveal each entry, draw its sketch ---------- */
  document.querySelectorAll('.entry').forEach(entry => {
    if (!REDUCED && window.gsap) {
      const body = entry.querySelector('.entry__body');
      gsap.from(body.children, {
        scrollTrigger: { trigger: entry, start: 'top 72%' },
        y: 46, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08
      });
    }
  });

  /* ---------- projects ---------- */
  if (!REDUCED && window.gsap) {
    gsap.from('.projects__head .eyebrow, .projects__lead', {
      scrollTrigger: { trigger: '.projects', start: 'top 76%' },
      y: 22, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.12
    });
    gsap.from('.proj', {
      scrollTrigger: { trigger: '.projects__grid', start: 'top 84%' },
      y: 38, opacity: 0, duration: 0.75, ease: 'power3.out', stagger: 0.08
    });
    gsap.from('.projects__all', {
      scrollTrigger: { trigger: '.projects__all', start: 'top 94%' },
      y: 16, opacity: 0, duration: 0.6, ease: 'power2.out'
    });
  }

  /* ---------- who am I ---------- */
  const quoteEl = document.querySelector('.who__quote .quote__text');
  if (quoteEl) {
    splitWords(quoteEl);
    if (!REDUCED && window.gsap) {
      gsap.from('.who__quote .quote__text .w', {
        scrollTrigger: { trigger: '.who', start: 'top 72%' },
        yPercent: 110, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.02
      });
      gsap.from('.who .eyebrow, .who__stat, .who__line, .who__quote .quote__mark, .who__quote .quote__by', {
        scrollTrigger: { trigger: '.who', start: 'top 74%' },
        y: 22, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08
      });
    }
  }

  /* ---------- what I do ---------- */
  if (!REDUCED && window.gsap) {
    gsap.from('.skills__intro .eyebrow, .skills__lead', {
      scrollTrigger: { trigger: '.skills', start: 'top 76%' },
      y: 22, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.12
    });
    gsap.from('.skills__list li', {
      scrollTrigger: { trigger: '.skills__list', start: 'top 84%' },
      y: 30, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.06
    });
  }

  /* ---------- contact ---------- */
  if (!REDUCED && window.gsap) {
    gsap.from('.contact__kicker, .contact__foot', {
      scrollTrigger: { trigger: '.contact', start: 'top 78%' },
      y: 22, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.15
    });
    gsap.from('.contact__link', {
      scrollTrigger: { trigger: '.contact__links', start: 'top 82%' },
      yPercent: 60, opacity: 0, duration: 0.9, ease: 'power4.out', stagger: 0.12
    });
  }

  /* ---------- section titles: rise word by word ---------- */
  if (!REDUCED && window.gsap) {
    document.querySelectorAll('.journey__title, .projects__title, .skills__title, .who__title').forEach(h => {
      const ws = splitWords(h);
      gsap.from(ws, {
        scrollTrigger: { trigger: h, start: 'top 88%' },
        yPercent: 120, opacity: 0, rotate: 3, transformOrigin: '0% 100%',
        duration: 0.9, ease: 'power3.out', stagger: 0.06
      });
    });
  }

  /* ---------- attach sketches ---------- */
  // refresh scroll positions once the photo has loaded
  const img = document.querySelector('.entry__sketch--photo img');
  if (img && !img.complete) {
    img.addEventListener('load', () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => window.ScrollTrigger && ScrollTrigger.refresh());
});
