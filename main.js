/* Aerografía Chus. Sin dependencias.
   Todo el contenido está en el HTML: este archivo solo añade la pasada de
   aerógrafo del hero, los filtros, la segunda vista de las miniaturas y el visor. */
(function () {
  "use strict";

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------- Hero: la foto aparece como una pasada de aerógrafo ---------- */

  function makeBrush() {
    var s = 256, c = document.createElement("canvas");
    c.width = c.height = s;
    var g = c.getContext("2d");
    var rad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    rad.addColorStop(0, "rgba(0,0,0,.95)");
    rad.addColorStop(0.45, "rgba(0,0,0,.6)");
    rad.addColorStop(0.8, "rgba(0,0,0,.14)");
    rad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rad;
    g.fillRect(0, 0, s, s);
    /* Grano: el borde de un aerógrafo no es limpio, está atomizado */
    g.globalCompositeOperation = "destination-out";
    g.fillStyle = "#000";
    for (var i = 0; i < 2600; i++) {
      var a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * s / 2;
      g.globalAlpha = 0.2 + Math.random() * 0.6;
      g.beginPath();
      g.arc(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, 0.5 + Math.random() * 1.4, 0, 6.283);
      g.fill();
    }
    return c;
  }

  function initSpray() {
    var fig = document.querySelector("[data-spray]");
    if (!fig) return;
    var img = fig.querySelector("img");
    var cv = fig.querySelector("canvas");
    var done = false;

    function finish() {
      if (done) return;
      done = true;
      fig.classList.add("is-ready");
      if (cv) cv.remove();
    }

    var entry = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
    var box = fig.getBoundingClientRect();
    var offscreen = box.bottom < 0 || box.top > window.innerHeight;
    if (!cv || !cv.getContext || location.hash || offscreen || (entry && entry.type === "back_forward")) {
      finish();
      return;
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = cv.width = Math.round(box.width * dpr);
    var H = cv.height = Math.round(box.height * dpr);
    var ctx = cv.getContext("2d");
    var R = Math.max(W, H) * 0.15;
    var brush = makeBrush();

    /* Capa de imprimación: el mismo gris que la página, así la foto nace del fondo */
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--primer").trim() || "#e7e7e4";
    ctx.fillRect(0, 0, W, H);
    fig.classList.add("is-ready");
    ctx.globalCompositeOperation = "destination-out";

    function stamp(x, y, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(Math.random() * 6.283);
      ctx.drawImage(brush, -R, -R, R * 2, R * 2);
      ctx.restore();
      /* Salpicadura suelta alrededor de la boquilla */
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#000";
      for (var i = 0; i < 7; i++) {
        var a = Math.random() * 6.283, d = R * (0.7 + Math.random() * 0.8);
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, (0.4 + Math.random() * 1.5) * dpr, 0, 6.283);
        ctx.fill();
      }
    }

    function line(x0, y0, x1, y1, alpha) {
      var dist = Math.hypot(x1 - x0, y1 - y0);
      var steps = Math.max(1, Math.ceil(dist / (R * 0.22)));
      for (var i = 1; i <= steps; i++) {
        stamp(x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps, alpha);
      }
    }

    /* Recorrido automático: pasadas en zigzag de arriba abajo */
    var passes = 5, pts = [];
    for (var p = 0; p < passes; p++) {
      var y = H * (p + 0.5) / passes;
      var left = -R * 0.3, right = W + R * 0.3;
      pts.push([p % 2 ? right : left, y - H * 0.03]);
      pts.push([p % 2 ? left : right, y + H * 0.03]);
    }
    var seg = [], total = 0;
    for (var s = 1; s < pts.length; s++) {
      var len = Math.hypot(pts[s][0] - pts[s - 1][0], pts[s][1] - pts[s - 1][1]);
      seg.push(len);
      total += len;
    }
    function pointAt(d) {
      for (var i = 0; i < seg.length; i++) {
        if (d <= seg[i]) {
          var t = d / seg[i], a = pts[i], b = pts[i + 1];
          return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        }
        d -= seg[i];
      }
      return pts[pts.length - 1];
    }

    var DURATION = 2600, start = null, last = pts[0];
    function frame(now) {
      if (done) return;
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / DURATION);
      var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      var pos = pointAt(eased * total);
      line(last[0], last[1], pos[0], pos[1], 0.5);
      last = pos;
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        cv.style.transition = "opacity .6s";
        cv.style.opacity = "0";
        setTimeout(finish, 650);
      }
    }

    /* Con el ratón también se pinta */
    var prev = null;
    fig.addEventListener("pointermove", function (e) {
      if (done) return;
      var b = fig.getBoundingClientRect();
      var x = (e.clientX - b.left) * dpr, y2 = (e.clientY - b.top) * dpr;
      if (prev) line(prev[0], prev[1], x, y2, 0.45);
      prev = [x, y2];
    });
    fig.addEventListener("pointerleave", function () { prev = null; });
    window.addEventListener("resize", finish, { once: true });

    function go() { requestAnimationFrame(frame); }
    var ready = img.decode ? img.decode() : Promise.resolve();
    Promise.race([ready, new Promise(function (r) { setTimeout(r, 2500); })]).then(go, go);
    setTimeout(finish, 8000);
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

  /* ---------- Miniaturas: al pasar por encima, otra vista de la pieza ---------- */

  function initTiles() {
    if (!window.matchMedia("(hover: hover)").matches) return;
    document.querySelectorAll(".tile[data-alt]").forEach(function (tile) {
      tile.addEventListener("pointerenter", function () {
        var media = tile.querySelector(".tile__media");
        if (media.querySelector(".tile__alt")) return;
        var im = new Image();
        im.className = "tile__alt";
        im.alt = "";
        im.decoding = "async";
        im.onload = function () { im.classList.add("is-ready"); };
        im.src = tile.dataset.alt;
        media.appendChild(im);
      });
    });
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
    safe(initSpray, "spray");
    safe(initFilters, "filtros");
    safe(initTiles, "miniaturas");
    safe(initLightbox, "visor");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
