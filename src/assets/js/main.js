/* MarvinApps — interacciones del sitio (sin dependencias) */
(function () {
  "use strict";
  var root = document.documentElement;
  var WHATSAPP = "573214012236";

  /* ---- Tema claro / oscuro ---- */
  var toggle = document.querySelector(".theme-toggle");
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    var meta = document.querySelectorAll('meta[name="theme-color"]');
    meta.forEach(function (m) { m.setAttribute("content", t === "light" ? "#f5f6f8" : "#022b31"); });
    if (toggle) {
      var label = root.lang === "en"
        ? (t === "light" ? "Switch to dark theme" : "Switch to light theme")
        : (t === "light" ? "Cambiar a tema oscuro" : "Cambiar a tema claro");
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("title", label);
    }
  }
  applyTheme(root.getAttribute("data-theme") || "dark");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  /* ---- Recordar idioma elegido ---- */
  document.querySelectorAll(".lang-switch a").forEach(function (a) {
    a.addEventListener("click", function () {
      try { localStorage.setItem("lang", a.getAttribute("hreflang")); } catch (e) {}
    });
  });

  /* ---- Menú móvil ---- */
  var header = document.querySelector(".site-header");
  var menuBtn = document.querySelector(".menu-toggle");
  if (menuBtn && header) {
    menuBtn.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    function closeMenu() {
      header.classList.remove("nav-open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
    header.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    // Cerrar con Escape (devolviendo el foco al botón) o al tocar fuera del encabezado
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("nav-open")) { closeMenu(); menuBtn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (header.classList.contains("nav-open") && !header.contains(e.target)) closeMenu();
    });
  }

  /* ---- Aparición al hacer scroll ---- */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Formulario de contacto → WhatsApp ---- */
  var form = document.getElementById("contact-form");
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var product = params.get("producto") || params.get("product");
    var msg = form.querySelector("#f-msg");
    if (product && msg && !msg.value) {
      msg.value = (root.lang === "en"
        ? "Hi Marvin, I'd like to know more about " + product + "."
        : "Hola Marvin, me gustaría conocer más sobre " + product + ".");
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = form.querySelector("#f-name").value.trim();
      var company = form.querySelector("#f-company").value.trim();
      var need = form.querySelector("#f-need");
      var needTxt = need.value ? need.options[need.selectedIndex].text : "";
      var text = msg.value.trim();
      if (!name || !text) { form.reportValidity(); return; }
      var en = root.lang === "en";
      var lines = [
        en ? "Hi Marvin! I'm " + name + (company ? " from " + company : "") + "."
           : "¡Hola Marvin! Soy " + name + (company ? " de " + company : "") + ".",
        needTxt ? (en ? "I need: " : "Necesito: ") + needTxt : "",
        "",
        text
      ].filter(function (l, i) { return l !== "" || i === 2; });
      var url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n"));
      window.open(url, "_blank", "noopener");
    });
  }

  /* ---- Año en el pie ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
