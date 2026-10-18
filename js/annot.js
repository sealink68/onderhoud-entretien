/* annot.js – full-screen photo annotation editor (arrow, ellipse, rectangle, free drawing, dimension line, text)
   followed by an optional short description. Opened for EVERY new photo (camera or library) BEFORE it is added.
   OE.annotate(file) -> Promise<{data: "data:image/jpeg;base64,…", desc: ""} | null (cancelled)>; rejects if the
   image cannot be decoded. Only the edited version is returned; the original is never stored.
   iOS notes: pointer events (finger + Apple Pencil), touch-action:none on the overlay (no scroll / zoom while
   drawing), max 2000 px long side (2 canvases ≈ 24 MB, well under the iOS canvas memory limit), canvases are
   shrunk to 0×0 when the editor closes so Safari frees the memory immediately. */
"use strict";
(function (OE) {
  var COLORS = [["red", "#e11d48"], ["yellow", "#facc15"], ["blue", "#2563eb"], ["white", "#ffffff"], ["black", "#000000"]];
  var WIDTHS = [0.0035, 0.0065, 0.011];                 // line width as a fraction of the image's long side
  var TOOLS = ["arrow", "ellipse", "rect", "pen", "dim", "text"];
  var NS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICON = {
    arrow: '<svg ' + NS + '><path d="M5 19L19 5M10 5h9v9"/></svg>',
    ellipse: '<svg ' + NS + '><ellipse cx="12" cy="12" rx="9" ry="7"/></svg>',
    rect: '<svg ' + NS + '><rect x="3.5" y="6" width="17" height="12" rx="1"/></svg>',
    pen: '<svg ' + NS + '><path d="M3 17c3-6 5-9 7-6s2 6 5 3 4-7 6-8"/></svg>',
    dim: '<svg ' + NS + '><path d="M3 7v10M21 7v10M3 12h18M6 9.5L3 12l3 2.5M18 9.5l3 2.5-3 2.5"/></svg>',
    text: '<svg ' + NS + '><path d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6"/></svg>',
    undo: '<svg ' + NS + '><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/></svg>',
    clear: '<svg ' + NS + '><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'
  };
  // Tiny 2×1 JPEG with EXIF orientation 6: a browser that honours EXIF reports it as 1×2.
  var ORIENT_TEST = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAYAAAAAAAD/2wBDAFA3PEY8MlBGQUZaVVBfeMiCeG5uePWvuZHI////////////////////////////////////////////////////2wBDAVVaWnhpeOuCguv/////////////////////////////////////////////////////////////////////////wAARCAABAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCKiiiszsP/2Q==";
  var autoOrient = null;
  function browserAutoOrients() {
    if (autoOrient) return autoOrient;
    autoOrient = new Promise(function (res) {
      var i = new Image(); i.onload = function () { res(i.naturalWidth === 1 && i.naturalHeight === 2); }; i.onerror = function () { res(true); }; i.src = ORIENT_TEST;
    });
    return autoOrient;
  }
  /* EXIF orientation (1..8) from the first 128 KB of a JPEG; 1 if absent / not a JPEG. */
  OE.exifOrientation = function (file) {
    return new Promise(function (res) {
      if (!file || !file.slice) return res(1);
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var v = new DataView(fr.result), len = v.byteLength, off = 2;
          if (v.getUint16(0) !== 0xFFD8) return res(1);
          while (off + 4 < len) {
            var mk = v.getUint16(off), sz = v.getUint16(off + 2);
            if (mk === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) {
              var t = off + 10, le = v.getUint16(t) === 0x4949, ifd = t + v.getUint32(t + 4, le), n = v.getUint16(ifd, le);
              for (var k = 0; k < n; k++) { var e = ifd + 2 + k * 12; if (v.getUint16(e, le) === 0x0112) return res(v.getUint16(e + 8, le) || 1); }
              return res(1);
            }
            if ((mk & 0xFF00) !== 0xFF00 || mk === 0xFFDA) break;
            off += 2 + sz;
          }
        } catch (err) {}
        res(1);
      };
      fr.onerror = function () { res(1); };
      fr.readAsArrayBuffer(file.slice(0, 131072));
    });
  };
  function loadImg(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { res({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("image")); };
      img.src = url;
    });
  }
  /* Decoded + upright + downscaled photo on a canvas (long side <= ANNOT_MAX). */
  OE.photoCanvas = function (file) {
    return Promise.all([loadImg(file), OE.exifOrientation(file), browserAutoOrients()]).then(function (r) {
      var img = r[0].img, o = r[2] ? 1 : r[1], w = img.naturalWidth, h = img.naturalHeight;
      var s = Math.min(1, (OE.CFG.ANNOT_MAX || 2000) / Math.max(w, h)), dw = Math.max(1, Math.round(w * s)), dh = Math.max(1, Math.round(h * s));
      var sw = o >= 5 && o <= 8, c = document.createElement("canvas"); c.width = sw ? dh : dw; c.height = sw ? dw : dh;
      var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      // manual EXIF transform only for browsers that do not apply it themselves (old iOS < 13.4)
      var T = { 2: [-1, 0, 0, 1, dw, 0], 3: [-1, 0, 0, -1, dw, dh], 4: [1, 0, 0, -1, 0, dh], 5: [0, 1, 1, 0, 0, 0], 6: [0, 1, -1, 0, dh, 0], 7: [0, -1, -1, 0, dh, dw], 8: [0, -1, 1, 0, 0, dw] }[o];
      if (T) g.setTransform(T[0], T[1], T[2], T[3], T[4], T[5]);
      g.drawImage(img, 0, 0, dw, dh); g.setTransform(1, 0, 0, 1, 0, 0);
      URL.revokeObjectURL(r[0].url); img.src = "";
      return c;
    });
  };

  /* ---------- drawing ---------- */
  function contrast(col) { return col === "#ffffff" || col === "#facc15" ? "rgba(0,0,0,.85)" : "rgba(255,255,255,.9)"; }
  function head(g, x1, y1, x2, y2, len) { // filled arrow head at (x2,y2)
    var a = Math.atan2(y2 - y1, x2 - x1), sp = 0.45;
    g.beginPath(); g.moveTo(x2, y2);
    g.lineTo(x2 - len * Math.cos(a - sp), y2 - len * Math.sin(a - sp));
    g.lineTo(x2 - len * Math.cos(a + sp), y2 - len * Math.sin(a + sp)); g.closePath(); g.fill();
  }
  function label(g, s, x, y, fs, col, ang, bg) {
    g.save(); g.translate(x, y); if (ang) g.rotate(ang);
    g.font = "bold " + Math.round(fs) + "px -apple-system, Helvetica, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    if (bg) { var w = g.measureText(s).width + fs * 0.6; g.fillStyle = contrast(col); g.fillRect(-w / 2, -fs * 0.65, w, fs * 1.3); }
    else { g.lineJoin = "round"; g.lineWidth = Math.max(2, fs * 0.16); g.strokeStyle = contrast(col); g.strokeText(s, 0, 0); }
    g.fillStyle = col; g.fillText(s, 0, 0); g.restore();
  }
  OE.drawShape = function (g, sh) {
    var p = sh.p, lw = sh.w, col = sh.c;
    g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round";
    if (sh.t === "arrow") {
      var hl = Math.max(lw * 4.2, 14), a = Math.atan2(p[3] - p[1], p[2] - p[0]);
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[2] - Math.cos(a) * hl * 0.6, p[3] - Math.sin(a) * hl * 0.6); g.stroke(); head(g, p[0], p[1], p[2], p[3], hl);
    } else if (sh.t === "ellipse") {
      var rx = Math.abs(p[2] - p[0]) / 2, ry = Math.abs(p[3] - p[1]) / 2;
      g.beginPath(); g.ellipse((p[0] + p[2]) / 2, (p[1] + p[3]) / 2, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2); g.stroke();
    } else if (sh.t === "rect") {
      g.strokeRect(Math.min(p[0], p[2]), Math.min(p[1], p[3]), Math.abs(p[2] - p[0]), Math.abs(p[3] - p[1]));
    } else if (sh.t === "pen") {
      g.beginPath(); g.moveTo(p[0], p[1]);
      if (p.length === 2) g.lineTo(p[0] + 0.01, p[1]);
      for (var i = 2; i < p.length - 2; i += 2) g.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2);
      if (p.length > 2) g.lineTo(p[p.length - 2], p[p.length - 1]);
      g.stroke();
    } else if (sh.t === "dim") {
      var dx = p[2] - p[0], dy = p[3] - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L, ny = dx / L, tk = Math.max(lw * 4, 12), ah = Math.max(lw * 3.4, 12);
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[2], p[3]);
      g.moveTo(p[0] + nx * tk, p[1] + ny * tk); g.lineTo(p[0] - nx * tk, p[1] - ny * tk);
      g.moveTo(p[2] + nx * tk, p[3] + ny * tk); g.lineTo(p[2] - nx * tk, p[3] - ny * tk); g.stroke();
      head(g, p[2], p[3], p[0], p[1], ah); head(g, p[0], p[1], p[2], p[3], ah);
      if (sh.s) {
        var ang = Math.atan2(dy, dx); if (ang > Math.PI / 2) ang -= Math.PI; else if (ang < -Math.PI / 2) ang += Math.PI;
        var fs = sh.fs, off = fs * 0.85 + lw, ox = Math.sin(ang) * off, oy = -Math.cos(ang) * off; // label above the line
        label(g, sh.s, (p[0] + p[2]) / 2 + ox, (p[1] + p[3]) / 2 + oy, fs, col, ang, true);
      }
    } else if (sh.t === "text") label(g, sh.s, p[0], p[1], sh.fs, col, 0, false);
    g.restore();
  };

  /* ---------- editor ---------- */
  var cur = null; // only one editor at a time
  OE.annotate = function (file) {
    if (cur) cur.close(null);
    var ov = document.createElement("div"); ov.className = "an"; ov.id = "an"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    document.body.appendChild(ov);
    var html = document.documentElement, prevOv = html.style.overflow; html.style.overflow = "hidden"; document.body.classList.add("an-open");
    ov.innerHTML = '<div class="an-load"><div class="spin"></div><span id="anload"></span></div>';
    OE.$("anload").textContent = OE.t().anLoading;
    return OE.photoCanvas(file).then(function (base) {
      return new Promise(function (resolve) { editor(ov, base, resolve); });
    }).then(function (r) { fin(); return r; }, function (e) { fin(); throw e; });
    function fin() { html.style.overflow = prevOv; document.body.classList.remove("an-open"); if (ov.parentNode) ov.parentNode.removeChild(ov); cur = null; }
  };

  function segHtml() { var L = OE.S.lang || "nl"; return '<div class="seg an-seg"><button type="button" data-al="nl" class="' + (L === "nl" ? "on" : "") + '">NL</button><button type="button" data-al="fr" class="' + (L === "fr" ? "on" : "") + '">FR</button></div>'; }

  function editor(ov, base, resolve) {
    var W = base.width, H = base.height, LONG = Math.max(W, H);
    var st = { tool: "arrow", color: COLORS[0][1], wi: 1 }, shapes = [], hist = [], drag = null, raf = 0, asking = false, mode = "draw";
    var cv, g;
    var stop = function (e) { if (!e.target.closest || !e.target.closest(".an-scroll, .an-ask, textarea, input")) e.preventDefault(); };
    ov.addEventListener("touchmove", stop, { passive: false });
    ov.addEventListener("gesturestart", function (e) { e.preventDefault(); });
    ov.addEventListener("dblclick", function (e) { e.preventDefault(); });
    cur = { close: function (r) { done(r); } };

    function x() { return OE.t(); }
    function lw() { return Math.max(2, Math.round(WIDTHS[st.wi] * LONG)); }
    function fs() { return Math.max(14, Math.round(LONG * [0.026, 0.034, 0.046][st.wi])); }

    function build() {
      var t = x(), tn = { arrow: t.anArrow, ellipse: t.anEllipse, rect: t.anRect, pen: t.anPen, dim: t.anDim, text: t.anText };
      var cn = { red: t.anRed, yellow: t.anYellow, blue: t.anBlue, white: t.anWhite, black: t.anBlack }, wn = [t.anThin, t.anMid, t.anThick];
      ov.innerHTML = '<div class="an-top"><button type="button" class="an-tbtn" id="ancancel">' + OE.esc(t.anCancel) + '</button><span class="an-title" id="antitle">' + OE.esc(t.anTitle) + "</span>" + segHtml() +
        '<button type="button" class="an-tbtn an-done" id="andone">' + OE.esc(t.anDone) + "</button></div>" +
        '<div class="an-body"><div class="an-stage" id="anstage"><canvas id="ancv"></canvas><div class="an-ask" id="anask" hidden></div></div>' +
        '<div class="an-tb" id="antb">' +
        TOOLS.map(function (k) { return '<button type="button" class="an-b an-tool' + (st.tool === k ? " on" : "") + '" data-tool="' + k + '" aria-label="' + OE.esc(tn[k]) + '" title="' + OE.esc(tn[k]) + '">' + ICON[k] + "</button>"; }).join("") +
        '<button type="button" class="an-b" id="anundo" aria-label="' + OE.esc(t.anUndo) + '" title="' + OE.esc(t.anUndo) + '">' + ICON.undo + "</button>" +
        '<button type="button" class="an-b" id="anclear" aria-label="' + OE.esc(t.anClear) + '" title="' + OE.esc(t.anClear) + '">' + ICON.clear + "</button>" +
        COLORS.map(function (c) { return '<button type="button" class="an-b an-col' + (st.color === c[1] ? " on" : "") + '" data-col="' + c[1] + '" data-cn="' + c[0] + '" aria-label="' + OE.esc(cn[c[0]]) + '" title="' + OE.esc(cn[c[0]]) + '"><i style="background:' + c[1] + '"></i></button>'; }).join("") +
        wn.map(function (n, k) { return '<button type="button" class="an-b an-w' + (st.wi === k ? " on" : "") + '" data-w="' + k + '" aria-label="' + OE.esc(n) + '" title="' + OE.esc(n) + '"><i style="width:' + (5 + k * 5) + "px;height:" + (5 + k * 5) + 'px"></i></button>'; }).join("") +
        "</div></div>";
      var old = cv; cv = OE.$("ancv");
      if (old && old !== cv) { cv.width = old.width; cv.height = old.height; old.width = old.height = 0; } else { cv.width = W; cv.height = H; }
      g = cv.getContext("2d"); redraw(); layout(); bind();
    }
    function layout() {
      var sg = OE.$("anstage"); if (!sg || !cv) return;
      var r = sg.getBoundingClientRect(), s = Math.min((r.width - 8) / W, (r.height - 8) / H);
      if (!(s > 0)) s = 0.1;
      cv.style.width = Math.floor(W * s) + "px"; cv.style.height = Math.floor(H * s) + "px";
    }
    function redraw(extra) {
      g.drawImage(base, 0, 0);
      shapes.forEach(function (s) { OE.drawShape(g, s); });
      if (extra) OE.drawShape(g, extra);
    }
    function sched() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; redraw(drag && drag.sh); }); }
    function pos(e) { var r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(W, (e.clientX - r.left) * W / r.width)), Math.max(0, Math.min(H, (e.clientY - r.top) * H / r.height))]; }
    function commit(sh) { hist.push(shapes.slice()); shapes.push(sh); redraw(); updBtns(); }
    function updBtns() { var u = OE.$("anundo"), c = OE.$("anclear"); if (u) u.disabled = !hist.length; if (c) c.disabled = !shapes.length; }
    function bind() {
      [].forEach.call(ov.querySelectorAll("[data-tool]"), function (b) { b.onclick = function () { st.tool = b.dataset.tool; sel("[data-tool]", b); }; });
      [].forEach.call(ov.querySelectorAll("[data-col]"), function (b) { b.onclick = function () { st.color = b.dataset.col; sel("[data-col]", b); }; });
      [].forEach.call(ov.querySelectorAll("[data-w]"), function (b) { b.onclick = function () { st.wi = +b.dataset.w; sel("[data-w]", b); }; });
      [].forEach.call(ov.querySelectorAll("[data-al]"), function (b) { b.onclick = function () { setLang(b.dataset.al); }; });
      OE.$("anundo").onclick = function () { if (asking || !hist.length) return; shapes = hist.pop(); redraw(); updBtns(); };
      OE.$("anclear").onclick = function () { if (asking || !shapes.length) return; hist.push(shapes.slice()); shapes = []; redraw(); updBtns(); };
      OE.$("ancancel").onclick = function () { done(null); };
      OE.$("andone").onclick = function () { if (asking) return; toDesc(); };
      cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move);
      cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
      cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });
      updBtns();
    }
    function sel(q, b) { [].forEach.call(ov.querySelectorAll(q), function (z) { z.classList.toggle("on", z === b); }); }
    function setLang(L) {
      if (OE.S.lang === L) return; OE.S.lang = L; OE.save(); if (OE.hdr) OE.hdr();
      if (mode === "draw") { var a = asking ? OE.$("anaskin") : null, v = a ? a.value : null, kind = asking; asking = false; build(); if (kind) { if (kind.sh) redraw(kind.sh); ask(kind.kind, kind.cb, v); asking.sh = kind.sh; } }
      else descView(OE.$("andesc") ? OE.$("andesc").value : "");
    }
    function down(e) {
      if (asking || drag || (e.pointerType === "mouse" && e.button !== 0)) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      var p = pos(e);
      if (st.tool === "text") { drag = { id: e.pointerId, text: p }; return; }
      var sh = { t: st.tool, c: st.color, w: lw(), p: st.tool === "pen" ? [p[0], p[1]] : [p[0], p[1], p[0], p[1]] };
      if (st.tool === "dim") sh.fs = fs();
      drag = { id: e.pointerId, sh: sh }; sched();
    }
    function move(e) {
      if (!drag || e.pointerId !== drag.id || !drag.sh) return;
      e.preventDefault();
      var sh = drag.sh, evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
      if (sh.t === "pen") {
        (evs && evs.length ? evs : [e]).forEach(function (ev) {
          var p = pos(ev), n = sh.p.length; var dx = p[0] - sh.p[n - 2], dy = p[1] - sh.p[n - 1];
          if (dx * dx + dy * dy >= 4) sh.p.push(p[0], p[1]);
        });
      } else { var p = pos(e); sh.p[2] = p[0]; sh.p[3] = p[1]; }
      sched();
    }
    function up(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      try { cv.releasePointerCapture(e.pointerId); } catch (er) {}
      if (d.text) { if (e.type === "pointerup") ask("text", function (s) { if (s) commit({ t: "text", c: st.color, w: lw(), fs: fs(), s: s, p: d.text }); else redraw(); }); return; }
      var sh = d.sh, p = sh.p, min = LONG * 0.012;
      if (sh.t !== "pen" && Math.abs(p[2] - p[0]) < min && Math.abs(p[3] - p[1]) < min) { redraw(); return; } // accidental tap
      if (sh.t === "dim") {
        redraw(sh);
        ask("dim", function (s, ok) { if (!ok) { redraw(); return; } sh.s = s; commit(sh); });
        asking.sh = sh; return;
      }
      commit(sh);
    }
    /* Small inline input (dimension label / text). cb(value, confirmed). */
    function ask(kind, cb, val) {
      var t = x(), box = OE.$("anask"); asking = { kind: kind, cb: cb };
      box.innerHTML = '<label for="anaskin">' + OE.esc(kind === "dim" ? t.anDimAsk : t.anTextAsk) + '</label><input id="anaskin" maxlength="' + (kind === "dim" ? 24 : 60) + '" autocomplete="off" enterkeyhint="done"' + (kind === "dim" ? ' inputmode="text" placeholder="1250 mm"' : "") + ">" +
        '<div class="an-askb"><button type="button" class="btn sec" id="anaskno">' + OE.esc(t.anCancel) + '</button><button type="button" class="btn pri" id="anaskok">' + OE.esc(t.anOk) + "</button></div>";
      box.hidden = false;
      var i = OE.$("anaskin"); i.value = val || "";
      function close(v, ok) { box.hidden = true; box.innerHTML = ""; asking = false; cb(v, ok); }
      OE.$("anaskok").onclick = function () { close(i.value.replace(/\s+/g, " ").trim(), true); };
      OE.$("anaskno").onclick = function () { close("", false); };
      i.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); OE.$("anaskok").click(); } };
      try { i.focus(); } catch (er) {}
    }
    /* ---- step 2: optional short description ---- */
    var out = null;
    function toDesc() {
      redraw(); out = exportJpeg(cv); mode = "desc";
      cv.width = cv.height = 0; base.width = base.height = 0; cv = null; // free canvas memory before the keyboard opens
      window.removeEventListener("resize", onResize);
      descView("");
    }
    function descView(val) {
      var t = x(), max = OE.CFG.DESC_MAX || 150;
      ov.innerHTML = '<div class="an-top"><button type="button" class="an-tbtn" id="anskip">' + OE.esc(t.descSkip) + '</button><span class="an-title">' + OE.esc(t.anTitle) + "</span>" + segHtml() +
        '<button type="button" class="an-tbtn an-done" id="andescok">' + OE.esc(t.descDone) + "</button></div>" +
        '<div class="an-scroll"><div class="an-desc"><img id="anprev" alt="" src="' + out + '"><label class="lbl" for="andesc" id="andesch">' + OE.esc(t.descH) + "</label>" +
        '<textarea id="andesc" rows="2" maxlength="' + max + '" autocapitalize="sentences" enterkeyhint="done"></textarea><div class="an-cnt" id="ancnt"></div>' +
        '<div class="btns"><button type="button" class="btn sec" id="anskip2">' + OE.esc(t.descSkip) + '</button><button type="button" class="btn pri" id="andescok2">' + OE.esc(t.descDone) + "</button></div></div></div>";
      var ta = OE.$("andesc"); ta.placeholder = t.descPh; ta.value = val || "";
      function cnt() { if (ta.value.length > max) ta.value = ta.value.slice(0, max); OE.$("ancnt").textContent = ta.value.length + " / " + max; }
      ta.oninput = function () { ta.value = ta.value.replace(/\n/g, " "); cnt(); };
      ta.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); OE.$("andescok").click(); } };
      cnt();
      [].forEach.call(ov.querySelectorAll("[data-al]"), function (b) { b.onclick = function () { setLang(b.dataset.al); }; });
      OE.$("anskip").onclick = OE.$("anskip2").onclick = function () { done({ data: out, desc: "" }); };
      OE.$("andescok").onclick = OE.$("andescok2").onclick = function () { done({ data: out, desc: ta.value.replace(/\s+/g, " ").trim().slice(0, max) }); };
      try { ta.focus(); } catch (er) {}
    }
    var closed = false;
    function done(r) {
      if (closed) return; closed = true;
      window.removeEventListener("resize", onResize);
      if (cv) { cv.width = cv.height = 0; } base.width = base.height = 0;
      resolve(r);
    }
    function onResize() { layout(); }
    window.addEventListener("resize", onResize);
    build();
    OE.annotState = function () { return { tool: st.tool, color: st.color, wi: st.wi, shapes: shapes.length, mode: mode }; }; // for tests
  }
  /* JPEG ~0.85; if very large (localStorage / outbox), step down quality, then size. */
  function exportJpeg(c) {
    var q = OE.CFG.ANNOT_Q || 0.85, lim = OE.CFG.ANNOT_MAXCHARS || 1400000, d = c.toDataURL("image/jpeg", q);
    if (d.length > lim) d = c.toDataURL("image/jpeg", 0.75);
    var s = c, f = 0.8;
    while (d.length > lim && f > 0.3) {
      var t = document.createElement("canvas"); t.width = Math.round(c.width * f); t.height = Math.round(c.height * f);
      t.getContext("2d").drawImage(c, 0, 0, t.width, t.height); d = t.toDataURL("image/jpeg", 0.8); t.width = t.height = 0; f -= 0.15;
    }
    return d;
  }
})(window.OE);
