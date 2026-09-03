# Michal Mucha — Portfolio

Minimalist, paper‑wireframe portfolio for Michal Mucha — fullstack developer.
Hand‑drawn (rough.js) frames that draw themselves in on scroll, GSAP scroll motion.

## Run locally

```bash
# from this folder
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server works (the page needs an internet connection to load GSAP,
ScrollTrigger and rough.js from CDN, plus Google Fonts).

## Structure

```
index.html    markup + content
styles.css    design system (colours, type, layout)
main.js       GSAP scroll animations + rough.js sketch frames
assets/       images (LeafLoop / NatureBits)
```

## Stack

- GSAP + ScrollTrigger — scroll animation
- rough.js — hand-drawn wireframe frames
- Bricolage Grotesque + JetBrains Mono — type
- No build step, no framework
