/* MarvinApps — Red de Confianza: filtros, búsqueda, brillo que sigue al cursor y enlaces directos.
   Sin JavaScript todas las recomendaciones se ven igual; esto solo añade interacción. */
(function () {
  "use strict";
  var grid = document.querySelector("[data-trust-grid]");
  if (!grid) return;

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = Array.prototype.slice.call(grid.querySelectorAll(".trust-item"));
  var toolbar = document.querySelector("[data-trust-toolbar]");
  var filter = toolbar && toolbar.querySelector(".trust-filter");
  var pill = filter && filter.querySelector(".trust-filter-pill");
  var buttons = filter ? Array.prototype.slice.call(filter.querySelectorAll("button")) : [];
  var search = document.querySelector("[data-trust-search]");
  var count = document.querySelector("[data-trust-count]");
  var empty = document.querySelector("[data-trust-empty]");
  var pager = document.querySelector("[data-trust-pager]");
  var moreBtn = pager && pager.querySelector("[data-trust-more]");
  var PAGE = 9; // tarjetas visibles antes de "Mostrar más"
  var state = { type: "all", q: "", limit: PAGE };

  function norm(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  }

  /* ---- Pastilla deslizante del filtro ---- */
  function movePill() {
    if (!pill) return;
    var active = filter.querySelector('[aria-pressed="true"]');
    if (!active) return;
    pill.style.setProperty("--x", active.offsetLeft + "px");
    pill.style.setProperty("--y", active.offsetTop + "px");
    pill.style.setProperty("--w", active.offsetWidth + "px");
    pill.style.setProperty("--h", active.offsetHeight + "px");
  }

  function updateCount(n) {
    if (!count) return;
    count.textContent = n === 1 ? count.getAttribute("data-one") : count.getAttribute("data-many").replace("{n}", n);
  }

  /* ---- Aplicar filtro + búsqueda ---- */
  // Texto de búsqueda normalizado una sola vez
  items.forEach(function (li) { li._q = norm(li.getAttribute("data-search")); });

  function apply(animate, from) {
    var q = norm(state.q);
    var matches = 0, shown = 0;
    // Con búsqueda se muestran todas las coincidencias; sin ella, se pagina.
    var limit = q ? Infinity : state.limit;
    items.forEach(function (li) {
      var okType = state.type === "all" || li.getAttribute("data-type") === state.type;
      var okText = !q || li._q.indexOf(q) !== -1;
      var match = okType && okText;
      if (match) matches++;
      var show = match && matches <= limit;
      var wasHidden = li.hidden;
      li.hidden = !show;
      li.classList.remove("is-entering");
      if (show) {
        if (animate && !reduce && wasHidden && shown >= (from || 0)) {
          void li.offsetWidth; // reinicia la animación
          li.style.setProperty("--d", Math.min(shown - (from || 0), 8) * 45 + "ms");
          li.classList.add("is-entering");
        }
        // Las tarjetas mostradas por un filtro no deben quedarse invisibles esperando el scroll
        var card = li.querySelector(".reveal");
        if (card) card.classList.add("is-visible");
        shown++;
      }
    });
    updateCount(matches);
    if (typeof measureAll === "function") requestAnimationFrame(measureAll);
    if (empty) empty.hidden = matches !== 0;
    if (pager) {
      var rest = matches - shown;
      pager.hidden = rest <= 0;
      if (rest > 0) moreBtn.textContent = moreBtn.getAttribute("data-label").replace("{n}", rest);
    }
  }
  if (moreBtn) {
    moreBtn.addEventListener("click", function () {
      var from = state.limit;
      state.limit += PAGE;
      apply(true, from);
      // Llevar el foco a la primera tarjeta nueva (accesibilidad con teclado)
      var first = items.filter(function (li) { return !li.hidden; })[from];
      if (first) { var a = first.querySelector("a, button:not([hidden])"); if (a) a.focus({ preventScroll: true }); }
    });
  }

  if (toolbar) {
    toolbar.hidden = false;
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        buttons.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        state.type = b.getAttribute("data-filter");
        state.limit = PAGE;
        movePill();
        items.forEach(function (li) { li.hidden = true; }); // todas entran de nuevo, escalonadas
        apply(true);
      });
    });
    if (search) {
      var t;
      search.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () { state.q = search.value; apply(false); }, 120);
      });
    }
    movePill();
    requestAnimationFrame(function () { filter && filter.classList.add("is-ready"); });
    window.addEventListener("resize", movePill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);
  }
  apply(false);

  /* ---- Reseñas largas: recortar a 4 líneas con "Leer más" ---- */
  grid.querySelectorAll(".trust-quote").forEach(function (q) {
    var text = q.querySelector(".trust-quote-text");
    var btn = q.querySelector("[data-trust-expand]");
    if (!text || !btn) return;
    var more = btn.textContent, less = btn.getAttribute("data-less");
    text.classList.add("is-clamped");
    // Mide cuando la tarjeta es visible (las ocultas tienen altura 0)
    function measure() {
      if (text.scrollHeight - text.clientHeight > 2) btn.hidden = false;
      else if (text.clientHeight) text.classList.remove("is-clamped");
    }
    q._measure = measure;
    btn.addEventListener("click", function () {
      var open = text.classList.toggle("is-clamped") === false;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? less : more;
    });
  });
  function measureAll() {
    grid.querySelectorAll(".trust-quote").forEach(function (q) {
      var btn = q.querySelector("[data-trust-expand]");
      if (q._measure && btn && btn.hidden && q.offsetParent) q._measure();
    });
  }

  /* ---- Brillo que sigue al cursor (un cálculo por cuadro) ---- */
  if (!reduce && window.matchMedia("(hover: hover)").matches) {
    var pending = null;
    grid.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".trust-card");
      if (!card) return;
      if (!pending) requestAnimationFrame(function () {
        var p = pending; pending = null;
        var r = p.card.getBoundingClientRect();
        p.card.style.setProperty("--mx", p.x - r.left + "px");
        p.card.style.setProperty("--my", p.y - r.top + "px");
      });
      pending = { card: card, x: e.clientX, y: e.clientY };
    }, { passive: true });
  }

  /* ---- Copiar enlace directo a una recomendación ---- */
  if (navigator.clipboard && window.isSecureContext) {
    grid.querySelectorAll("[data-trust-copy]").forEach(function (btn) {
      btn.hidden = false;
      btn.addEventListener("click", function () {
        var url = location.origin + location.pathname + "#" + btn.getAttribute("data-trust-copy");
        navigator.clipboard.writeText(url).then(function () {
          btn.classList.add("is-done");
          setTimeout(function () { btn.classList.remove("is-done"); }, 1800);
        });
      });
    });
  }

  /* ---- Resaltar la recomendación enlazada (#id) ---- */
  function highlight() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var card = document.getElementById(id);
    if (!card || !card.classList.contains("trust-card")) return;
    var li = card.closest(".trust-item");
    if (li && li.hidden) {
      state.type = "all"; state.q = ""; state.limit = Infinity; if (search) search.value = "";
      buttons.forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-filter") === "all" ? "true" : "false"); });
      movePill(); apply(false);
    }
    card.classList.add("is-visible");
    card.classList.remove("is-target"); void card.offsetWidth; card.classList.add("is-target");
    card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }
  window.addEventListener("hashchange", highlight);
  measureAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureAll);
  highlight();
})();
