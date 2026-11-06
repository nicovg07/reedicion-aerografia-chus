/* Aerografía Chus. Sin dependencias.
   Todo el contenido está en el HTML: este archivo solo añade el cambio de tema,
   los filtros y el visor. */
(function () {
  "use strict";

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------- Modo claro y oscuro ----------
     El tema inicial se fija en el <head> para que no parpadee al cargar. */

  function initTheme() {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    var root = document.documentElement;
    var meta = document.querySelector('meta[name="theme-color"]');

    function sync() {
      var dark = root.dataset.theme === "dark";
      var text = dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
      btn.setAttribute("aria-label", text);
      btn.title = text;
      if (meta) meta.content = dark ? "#141413" : "#e7e7e4";
    }

    function stored() {
      try { return localStorage.getItem("tema"); } catch (e) { return null; }
    }

    btn.addEventListener("click", function () {
      var next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("tema", next); } catch (e) { /* navegación privada */ }
      sync();
    });

    /* Mientras nadie elija a mano, sigue al dispositivo */
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      if (stored()) return;
      root.dataset.theme = e.matches ? "dark" : "light";
      sync();
    });

    sync();
  }

  /* ---------- Filtros ---------- */

  function initFilters() {
    var bar = document.querySelector("[data-filters]");
    if (!bar) return;
    var buttons = Array.prototype.slice.call(bar.querySelectorAll("button"));
    var tiles = Array.prototype.slice.call(document.querySelectorAll(".tile"));

    function paint(cat) {
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.cat === cat)); });
      tiles.forEach(function (t) { t.hidden = cat !== "todos" && t.dataset.cat !== cat; });
    }

    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var cat = b.dataset.cat;
      if (document.startViewTransition && !document.hidden) {
        var vt = document.startViewTransition(function () { paint(cat); });
        /* Dos clics seguidos cancelan la transición anterior: no es un error */
        vt.ready.catch(function () {});
        vt.finished.catch(function () {});
      } else {
        paint(cat);
      }
      try { history.replaceState(null, "", cat === "todos" ? "#proyectos" : "#" + cat); } catch (err) { /* file:// */ }
    });

    var wanted = location.hash.slice(1);
    if (buttons.some(function (b) { return b.dataset.cat === wanted; })) {
      paint(wanted);
      var section = document.getElementById("proyectos");
      if (section) section.scrollIntoView({ behavior: "instant" });
    }
  }

  /* ---------- Visor de fotos ---------- */

  function initLightbox() {
    var links = Array.prototype.slice.call(document.querySelectorAll("[data-lb]"));
    if (!links.length || !window.HTMLDialogElement || document.querySelector(".lb")) return;

    var dlg = document.createElement("dialog");
    dlg.className = "lb";
    dlg.setAttribute("aria-label", "Visor de fotografías");
    dlg.innerHTML =
      '<div class="lb__bar"><span class="lb__count mono"></span><button type="button" class="link" data-close>Cerrar</button></div>' +
      '<div class="lb__stage"><img alt=""></div>' +
      '<div class="lb__bar"><span></span><div class="lb__nav">' +
      '<button type="button" class="link" data-prev>Anterior</button>' +
      '<button type="button" class="link" data-next>Siguiente</button></div></div>';
    document.body.appendChild(dlg);

    var img = dlg.querySelector("img");
    var count = dlg.querySelector(".lb__count");
    var stage = dlg.querySelector(".lb__stage");
    var i = 0;

    function show(n) {
      i = (n + links.length) % links.length;
      img.src = links[i].href;
      img.alt = links[i].querySelector("img").alt;
      count.textContent = (i + 1) + " / " + links.length;
      [i + 1, i - 1].forEach(function (k) {
        new Image().src = links[(k + links.length) % links.length].href;
      });
    }

    links.forEach(function (a, n) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        show(n);
        dlg.showModal();
      });
    });

    dlg.querySelector("[data-close]").addEventListener("click", function () { dlg.close(); });
    dlg.querySelector("[data-prev]").addEventListener("click", function () { show(i - 1); });
    dlg.querySelector("[data-next]").addEventListener("click", function () { show(i + 1); });
    stage.addEventListener("click", function (e) { if (e.target === stage) dlg.close(); });

    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    });

    var x0 = null;
    stage.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
    stage.addEventListener("pointerup", function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 48) show(i + (dx < 0 ? 1 : -1));
    });
  }

  function boot() {
    safe(initTheme, "tema");
    safe(initFilters, "filtros");
    safe(initLightbox, "visor");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
