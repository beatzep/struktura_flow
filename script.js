(() => {
  const navbar = document.getElementById('navbar');
  const hero = document.getElementById('hero');
  const flow = document.getElementById('flow');
  const copy = document.getElementById('heroCopy');
  const mockupWrap = document.getElementById('mockupWrap');
  const parallax = document.getElementById('ghostParallax');
  const baseLayer = document.getElementById('ghostLayer');

  /* ---------- Navbar: beim Scrollen transparent + Blur ---------- */
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Aktiver Nav-Link beim Scrollen ---------- */
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const linkTargets = navLinks
    .map((a) => {
      const id = (a.getAttribute('href') || '').replace('#', '');
      const sec = id && document.getElementById(id);
      return sec ? { a, sec } : null;
    })
    .filter(Boolean);

  if (linkTargets.length && 'IntersectionObserver' in window) {
    const navIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const match = linkTargets.find((t) => t.sec === entry.target);
          if (!match) return;
          navLinks.forEach((a) => a.classList.remove('active'));
          match.a.classList.add('active');
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    linkTargets.forEach((t) => navIO.observe(t.sec));
  }

  /* ---------- Flow-Sizing: Trichter endet immer am Mockup ---------- */
  const sizeFlow = () => {
    const small = innerWidth < 860;
    const startY = small ? copy.offsetTop + copy.offsetHeight - 10 : 0;
    flow.style.top = startY + 'px';
    flow.style.height = Math.max(420, mockupWrap.offsetTop - startY + 150) + 'px';
  };
  addEventListener('resize', sizeFlow);
  addEventListener('load', sizeFlow);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeFlow);
  sizeFlow();

  /* ---------- Scroll-Reveal + Stat-Counter ----------
     Läuft VOR dem Touch-Return, damit Inhalte auf Mobile sichtbar werden. */
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animateCount = (stat) => {
    const target = parseInt(stat.dataset.count, 10);
    const suffix = stat.dataset.suffix || '';
    const el = stat.querySelector('.cnt');
    if (!el) return;
    if (reduceMotion) { el.textContent = target + (suffix ? '' : ''); stat.classList.add('counted'); return; }
    const dur = 1500;
    let start = 0;
    const tick = (now) => {
      if (!start) start = now;
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - (1 - t) * (1 - t);
      el.textContent = Math.round(eased * target);
      if (t < 1) requestAnimationFrame(tick);
      else stat.classList.add('counted');
    };
    requestAnimationFrame(tick);
  };

  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in-view'));
    document.querySelectorAll('.stat[data-count]').forEach(animateCount);
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        if (entry.target.matches('.stat[data-count]')) animateCount(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Transformation: Chaos → Tabelle (Scroll-Morph) ----------
     Ein einziges SVG wird einmal aufgebaut; beim Scrollen werden nur
     Attribute interpoliert (lerp). Sticky-Stage liefert den Scroll-Raum. */
  const morphSection = document.querySelector('[data-morph]');
  if (morphSection) {
    const svg = morphSection.querySelector('.morph-svg');
    const stage = morphSection.querySelector('.trans-stage');
    const before = morphSection.querySelector('.tt-before');
    const after = morphSection.querySelector('.tt-after');
    const dot = morphSection.querySelector('.tp-dot');
    const NS = 'http://www.w3.org/2000/svg';

    const CHAOS = [
      [30,26,72,30,-4,0],[128,14,56,40,3,1],[226,38,88,24,-2,2],
      [322,20,50,34,5,0],[58,92,94,28,2,1],[178,78,62,38,-5,2],
      [288,102,76,26,1,0],[18,158,58,36,4,2],[132,148,84,24,-3,0],
      [248,168,66,32,2,1],[336,148,48,28,-4,2],[48,228,78,26,3,1],
      [158,218,60,38,-2,0],[266,238,86,24,5,2],[348,212,44,32,-3,1],
    ];
    const CCOL = [[197,217,249],[139,179,243],[238,238,230]];
    const TARGET = [232,240,254];
    const COL_X = [24,144,264], ROW_Y = [48,94,140,186,232], CW = 112, CH = 36;
    const ROWS = [['01','Müller','✓ Fertig'],['02','Schmidt','○ Offen'],
      ['03','Weber','✓ Fertig'],['04','Becker','○ Offen'],['05','Krause','✓ Fertig']];
    const HEAD = ['Nr','Name','Status'];

    const cl = (v) => Math.min(Math.max(v, 0), 1);
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = (t) => (t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2);
    const col = (a, b, t) => `rgb(${Math.round(lerp(a[0],b[0],t))},${Math.round(lerp(a[1],b[1],t))},${Math.round(lerp(a[2],b[2],t))})`;

    const mk = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    };

    // Kopfzeile
    const headG = mk('g', { 'font-family': 'DM Sans, sans-serif', 'font-size': '10', 'font-weight': '700', fill: '#3D74CC' });
    const headTexts = HEAD.map((h, i) => {
      const t = mk('text', { x: COL_X[i] + 10, y: 38, 'letter-spacing': '1' });
      t.textContent = h.toUpperCase();
      headG.appendChild(t);
      return t;
    });
    svg.appendChild(headG);

    // Zellen + Labels
    const cells = CHAOS.map((c, i) => {
      const rect = mk('rect', { rx: 4, stroke: '#8BB3F3', 'stroke-width': 0.5 });
      const text = mk('text', { 'font-family': 'DM Sans, sans-serif', 'font-size': '11' });
      text.textContent = ROWS[Math.floor(i/3)][i%3];
      svg.appendChild(rect);
      svg.appendChild(text);
      return { c, rect, text };
    });

    let cur = -1;
    const render = (p) => {
      if (p === cur) return;
      cur = p;
      const t = ease(cl((p - 0.3) / 0.4));
      const lab = cl((p - 0.7) / 0.3);
      headTexts.forEach((h) => h.setAttribute('opacity', lab));
      cells.forEach(({ c, rect, text }, i) => {
        const ci = c[5], cx = i % 3, ry = Math.floor(i / 3);
        const x = lerp(c[0], COL_X[cx], t), y = lerp(c[1], ROW_Y[ry], t);
        const w = lerp(c[2], CW, t), h = lerp(c[3], CH, t), rot = lerp(c[4], 0, t);
        rect.setAttribute('x', x.toFixed(1));
        rect.setAttribute('y', y.toFixed(1));
        rect.setAttribute('width', w.toFixed(1));
        rect.setAttribute('height', h.toFixed(1));
        rect.setAttribute('fill', col(CCOL[ci], TARGET, t));
        rect.setAttribute('stroke-opacity', (t * 0.9).toFixed(2));
        rect.setAttribute('transform', `rotate(${rot.toFixed(2)} ${(x + w/2).toFixed(1)} ${(y + h/2).toFixed(1)})`);
        text.setAttribute('x', COL_X[cx] + 10);
        text.setAttribute('y', ROW_Y[ry] + 23);
        text.setAttribute('fill', cx === 0 ? '#3D74CC' : '#041C44');
        text.setAttribute('opacity', lab);
      });
      if (before) before.style.opacity = cl(1 - (p - 0.4) / 0.1);
      if (after) after.style.opacity = cl((p - 0.5) / 0.1);
      if (dot) dot.style.top = (p * 100) + '%';
    };

    const morphOK = !reduceMotion && innerWidth >= 760;
    if (morphOK) {
      morphSection.classList.add('is-morph');
      let scheduled = false;
      const onScrollMorph = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          const r = stage.getBoundingClientRect();
          const total = r.height - innerHeight;
          render(total > 0 ? cl(-r.top / total) : 1);
        });
      };
      addEventListener('scroll', onScrollMorph, { passive: true });
      addEventListener('resize', onScrollMorph);
      onScrollMorph();
    } else {
      render(1);
    }
  }

  /* ---------- Cursor-Reveal als Spotlight ----------
     Ein statisch maskierter 720px-Kreis (.ghost-spot) bewegt sich per
     translate3d; innen läuft eine Vollkopie des Ghost-Layers exakt
     gegenläufig mit, sodass der Inhalt seitenfest bleibt. Beide Updates
     sind reine Compositor-Transforms — kein Repaint pro Frame. */
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const R = 360; // halbe Kantenlänge von .ghost-spot (720px)
  const spot = document.createElement('div');
  spot.className = 'ghost-spot';
  const spotInner = document.createElement('div');
  spotInner.className = 'ghost-spot-inner';
  const ghostClone = baseLayer.cloneNode(true);
  ghostClone.removeAttribute('id');
  spotInner.appendChild(ghostClone);
  spot.appendChild(spotInner);
  parallax.appendChild(spot);

  const sizeSpot = () => {
    // Parallax-Box (Hero + 20px Rand), damit die Kopie deckungsgleich zum Basis-Layer liegt
    spotInner.style.width = parallax.clientWidth + 'px';
    spotInner.style.height = parallax.clientHeight + 'px';
  };
  addEventListener('resize', sizeSpot);
  addEventListener('load', sizeSpot);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeSpot);
  sizeSpot();

  let tx = -1000, ty = -1000, cx = -1000, cy = -1000, raf = null;

  const step = () => {
    raf = null;
    cx += (tx - cx) * 0.16;
    cy += (ty - cy) * 0.16;
    spot.style.transform = `translate3d(${(cx - R).toFixed(1)}px, ${(cy - R).toFixed(1)}px, 0)`;
    spotInner.style.transform = `translate3d(${(R - cx).toFixed(1)}px, ${(R - cy).toFixed(1)}px, 0)`;
    if (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) raf = requestAnimationFrame(step);
  };

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
    if (cx === -1000) { cx = tx; cy = ty; }
    hero.classList.add('cursor-on');
    if (!raf) raf = requestAnimationFrame(step);
  });

  hero.addEventListener('pointerleave', () => {
    hero.classList.remove('cursor-on');
  });
})();
