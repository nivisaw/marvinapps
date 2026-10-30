/* =========================================================
   MarvinApps — fondo animado del héroe (Canvas 2D)
   Red de nodos con conexiones y figuras geométricas que
   reaccionan al cursor (o al dedo en pantallas táctiles).
   - Se pausa fuera de pantalla y con la pestaña oculta.
   - Menos nodos y 30 fps en móviles.
   - Con "reducir movimiento" dibuja un solo cuadro estático.
   ========================================================= */
(function () {
  "use strict";
  var hero = document.querySelector(".hero.hero-bg");
  if (!hero) return;

  var canvas = document.createElement("canvas");
  canvas.className = "hero-fx";
  canvas.setAttribute("aria-hidden", "true");
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var PALETTE = {
    dark:  { node: "47,231,230", line: "47,231,230", shape: "3,255,254", a: 1 },
    light: { node: "11,125,135", line: "11,125,135", shape: "11,125,135", a: 0.8 }
  };
  var pal = PALETTE.dark;
  function applyTheme() {
    pal = document.documentElement.getAttribute("data-theme") === "light" ? PALETTE.light : PALETTE.dark;
    if (!running) frame(performance.now());
  }

  var mobile = window.matchMedia("(max-width: 860px)").matches || /Mobi|Android/i.test(navigator.userAgent);
  var frameMs = mobile ? 1000 / 30 : 0;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var LINK = mobile ? 110 : 150;          // distancia máxima para conectar nodos
  var RADIUS = mobile ? 120 : 190;        // radio de influencia del cursor
  var W = 0, H = 0, dpr = 1, nodes = [], shapes = [];
  var mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };

  function rand(a, b) { return a + Math.random() * (b - a); }

  function build() {
    var area = W * H;
    var count = Math.round(Math.min(mobile ? 38 : 90, Math.max(18, area / (mobile ? 9000 : 14000))));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({ x: rand(0, W), y: rand(0, H), vx: rand(-0.18, 0.18), vy: rand(-0.18, 0.18), ox: 0, oy: 0, r: rand(1, 2.2) });
    }
    var sc = mobile ? 4 : 7;
    shapes = [];
    for (var j = 0; j < sc; j++) {
      shapes.push({
        x: rand(0, W), y: rand(0, H), vx: rand(-0.08, 0.08), vy: rand(-0.08, 0.08),
        size: rand(18, mobile ? 38 : 56), sides: [3, 4, 6][j % 3], rot: rand(0, Math.PI * 2),
        spin: rand(-0.003, 0.003), ox: 0, oy: 0, skew: 0
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = hero.clientWidth, h = hero.clientHeight;
    if (w === W && h === H) return;
    var first = !W;
    W = w; H = h;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (first || !nodes.length) build();
    else nodes.concat(shapes).forEach(function (n) { n.x = Math.min(n.x, W); n.y = Math.min(n.y, H); });
    if (!running) frame(performance.now());
  }

  // Desplazamiento elástico respecto al cursor: los elementos se apartan y luego vuelven
  function push(o, strength) {
    var dx = o.x - mouse.x, dy = o.y - mouse.y, d2 = dx * dx + dy * dy, R2 = RADIUS * RADIUS;
    var tx = 0, ty = 0;
    if (mouse.active && d2 < R2) {
      var d = Math.sqrt(d2) || 1, f = (1 - d / RADIUS);
      f = f * f * strength;
      tx = dx / d * f; ty = dy / d * f;
    }
    o.ox += (tx - o.ox) * 0.08; o.oy += (ty - o.oy) * 0.08;
  }

  function step(dt) {
    mouse.x += (mouse.tx - mouse.x) * 0.15; mouse.y += (mouse.ty - mouse.y) * 0.15;
    var all = nodes.concat(shapes);
    for (var i = 0; i < all.length; i++) {
      var n = all[i];
      n.x += n.vx * dt; n.y += n.vy * dt;
      if (n.x < -60) n.x = W + 60; else if (n.x > W + 60) n.x = -60;
      if (n.y < -60) n.y = H + 60; else if (n.y > H + 60) n.y = -60;
      push(n, n.sides ? 26 : 38);
      if (n.sides) { n.rot += n.spin * dt; n.skew += ((mouse.active ? Math.hypot(n.ox, n.oy) / 26 : 0) - n.skew) * 0.06; }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var a = pal.a, i, j, n, m, px, py;
    // Conexiones
    ctx.lineWidth = 1;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i]; px = n.x + n.ox; py = n.y + n.oy;
      for (j = i + 1; j < nodes.length; j++) {
        m = nodes[j];
        var dx = px - (m.x + m.ox), dy = py - (m.y + m.oy), d = dx * dx + dy * dy;
        if (d < LINK * LINK) {
          ctx.strokeStyle = "rgba(" + pal.line + "," + ((1 - Math.sqrt(d) / LINK) * 0.22 * a).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(m.x + m.ox, m.y + m.oy); ctx.stroke();
        }
      }
      // Hilo hacia el cursor
      if (mouse.active) {
        var cx = px - mouse.x, cy = py - mouse.y, cd = Math.sqrt(cx * cx + cy * cy);
        if (cd < RADIUS) {
          ctx.strokeStyle = "rgba(" + pal.line + "," + ((1 - cd / RADIUS) * 0.35 * a).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
    // Nodos
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      var near = mouse.active ? Math.max(0, 1 - Math.hypot(n.x + n.ox - mouse.x, n.y + n.oy - mouse.y) / RADIUS) : 0;
      ctx.fillStyle = "rgba(" + pal.node + "," + ((0.45 + near * 0.5) * a).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(n.x + n.ox, n.y + n.oy, n.r + near * 1.6, 0, Math.PI * 2); ctx.fill();
    }
    // Figuras geométricas (se estiran y deforman cerca del cursor)
    for (i = 0; i < shapes.length; i++) {
      var s = shapes[i];
      ctx.save();
      ctx.translate(s.x + s.ox, s.y + s.oy);
      ctx.rotate(s.rot);
      ctx.transform(1 + s.skew * 0.35, s.skew * 0.25, s.skew * 0.25, 1 - s.skew * 0.2, 0, 0);
      ctx.strokeStyle = "rgba(" + pal.shape + "," + ((0.16 + s.skew * 0.3) * a).toFixed(3) + ")";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (j = 0; j <= s.sides; j++) {
        var ang = j / s.sides * Math.PI * 2;
        ctx[j ? "lineTo" : "moveTo"](Math.cos(ang) * s.size, Math.sin(ang) * s.size);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  var running = false, raf = 0, prev = 0, visible = true;
  function frame(now) {
    var dt = prev ? Math.min((now - prev) / 16.67, 3) : 1;
    prev = now;
    if (running) step(dt);
    draw();
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (frameMs && prev && now - prev < frameMs) return;
    frame(now);
  }
  function update() {
    var should = visible && !document.hidden && !reduce.matches;
    if (should && !running) { running = true; prev = 0; raf = requestAnimationFrame(loop); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); }
  }

  // Cursor / toque (el listener es pasivo: no interfiere con el scroll ni los clics)
  function pointer(e) {
    var r = hero.getBoundingClientRect();
    mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
    if (!mouse.active) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
    mouse.active = true;
  }
  function leave() { mouse.active = false; }
  hero.addEventListener("pointermove", pointer, { passive: true });
  hero.addEventListener("pointerdown", pointer, { passive: true });
  hero.addEventListener("pointerleave", leave, { passive: true });
  hero.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") leave(); }, { passive: true });
  hero.addEventListener("pointercancel", leave, { passive: true });

  hero.insertBefore(canvas, hero.firstChild);
  resize();
  applyTheme();
  requestAnimationFrame(function () { hero.classList.add("has-fx"); });

  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(hero);
  else window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; update(); }).observe(hero);
  }
  document.addEventListener("visibilitychange", update);
  if (reduce.addEventListener) reduce.addEventListener("change", update);
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  update();
})();
