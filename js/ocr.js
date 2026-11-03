/* ocr.js – on-device ServiceMax screenshot reader (Tesseract.js, lazy CDN, never uploaded). */
"use strict";
(function (OE) {
  var esc = OE.esc, $ = OE.$;
  function labels() { return ServiceMax.labels[(OE.S && OE.S.lang) || "nl"]; }
  function otherLabels() { return ServiceMax.labels[(OE.S && OE.S.lang) === "fr" ? "nl" : "fr"]; }
  function bilingual() { return !(OE.S && OE.S.lang); }
  OE.hasClient = function () {
    var c = (OE.S && OE.S.client) || {};
    return ["wo", "account", "adres", "contact", "product"].some(function (k) { return String(c[k] || "").trim(); });
  };
  OE.scanBar = function () {
    var both = bilingual(), x = ServiceMax.labels.nl, y = ServiceMax.labels.fr, L = labels();
    var label = both ? esc(x.scan) + "<small>" + esc(y.scan) + "</small>" : esc(L.scan);
    var sub = both ? esc(x.scanSub) + " / " + esc(y.scanSub) : esc(L.scanSub);
    var note = OE.hasClient() ? '<p class="note oknote">' + esc(both ? x.took + "<br>" + y.took : L.took) + "</p>" : "";
    return '<button type="button" class="btn scan big" id="ocrbtn">' + label + '</button><p class="hint scan-hint">' + sub + "</p>" + note;
  };
  OE.bindScan = function () {
    var b = $("ocrbtn");
    if (b) b.onclick = function () { var inp = $("ocrfile"); if (inp) inp.click(); };
  };
  function showBusy(msg) {
    var L = labels(), both = bilingual();
    OE.mem.ocr = "busy";
    $("top").innerHTML = "";
    $("card").innerHTML = '<div class="start"><h2>' + esc(L.reading) + '</h2><p id="ocrstatus">' + esc(msg || L.loading) + '</p><div class="ocrbar"><i id="ocrfill"></i></div><p class="hint">' + esc(L.scanSub) + (both ? " / " + esc(otherLabels().scanSub) : "") + "</p></div>";
  }
  function showOcrError(msg) {
    var L = labels(), both = bilingual(), back = both ? L.back + " / " + otherLabels().back : L.back, again = both ? L.scan + " / " + otherLabels().scan : L.scan;
    OE.mem.ocr = "err";
    OE.mem.ocrErr = msg;
    $("card").innerHTML = '<div class="start"><div class="err">' + esc(msg) + '</div><div class="btns"><button type="button" class="btn sec" id="ocrback">' + esc(back) + '</button><button type="button" class="btn pri" id="ocrretry">' + esc(again) + "</button></div></div>";
    $("ocrback").onclick = function () { OE.mem.ocr = null; OE.render(1); };
    $("ocrretry").onclick = function () { var inp = $("ocrfile"); if (inp) inp.click(); };
  }
  function grabDraft() {
    if (!$("f-wo")) return;
    var d = ServiceMax.blank();
    ["wo", "account", "adres", "contact", "product"].forEach(function (k) {
      d[k] = ($("f-" + k).value || "").replace(/\s+/g, " ").trim();
    });
    OE.mem.draft = d;
  }
  function reviewView() {
    var both = bilingual(), x = labels(), y = otherLabels(), d = OE.mem.draft || ServiceMax.blank();
    function field(k) {
      var long = k === "adres" || k === "contact" || k === "product";
      var control = long ? '<textarea id="f-' + k + '" rows="1" autocomplete="off" autocapitalize="words"></textarea>' : '<input id="f-' + k + '" autocomplete="off" autocapitalize="' + (k === "wo" ? "off" : "words") + '" enterkeyhint="done">';
      return "<label>" + esc(x[k]) + (both ? "<small>" + esc(y[k]) + "</small>" : "") + control + "</label>";
    }
    $("top").innerHTML = "";
    $("card").innerHTML = '<div class="start"><h2>' + esc(both ? x.review + " / " + y.review : x.review) + '</h2><p class="hint">' + esc(both ? x.reviewSub + " / " + y.reviewSub : x.reviewSub) + '</p><div class="fields">' +
      field("wo") + field("account") + field("adres") + field("contact") + field("product") + '</div><div class="btns stack"><button type="button" class="btn pri" id="ocrtake">' + esc(both ? x.take + " / " + y.take : x.take) + '</button><button type="button" class="btn sec" id="ocrback">' + esc(both ? x.back + " / " + y.back : x.back) + "</button></div></div>";
    ["wo", "account", "adres", "contact", "product"].forEach(function (k) {
      var el = $("f-" + k); el.value = d[k] || ""; if (el.tagName === "TEXTAREA") OE.fit(el);
    });
    $("ocrback").onclick = function () { OE.mem.ocr = null; OE.render(-1); };
    $("ocrtake").onclick = function () {
      grabDraft();
      var d = OE.mem.draft;
      OE.S.client = { wo: d.wo.trim(), account: d.account.trim(), adres: d.adres.trim(), contact: d.contact.trim(), product: d.product.trim() };
      // Dossier field is the installed product, never the work-order number.
      OE.S.dossier = ServiceMax.dossierFrom(OE.S.client);
      OE.mem.ocr = null;
      OE.save();
      OE.render(1);
    };
  }
  OE.screens.ocr = function () {
    if (OE.mem.ocr === "review") return reviewView();
    if (OE.mem.ocr === "err") return showOcrError(OE.mem.ocrErr || labels().fail);
    showBusy(OE.mem.ocrMsg || labels().loading);
  };
  function loadTess() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (loadTess.p) return loadTess.p;
    loadTess.p = new Promise(function (ok, bad) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
      s.async = true;
      s.onload = function () { window.Tesseract ? ok(window.Tesseract) : bad(new Error("lib")); };
      s.onerror = function () { loadTess.p = null; bad(new Error("cdn")); };
      document.head.appendChild(s);
    });
    return loadTess.p;
  }
  // The photo is drawn to a canvas in this page and read by Tesseract locally. It is never uploaded.
  function prepImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        if (!w || !h) { URL.revokeObjectURL(url); rej(new Error("image")); return; }
        var scale = Math.min(1, 2200 / Math.max(w, h)), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
        var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("image")); };
      img.src = url;
    });
  }
  var ocrGen = 0;
  function runOcr(files) {
    var id = ++ocrGen, n = files.length, cur = 0;
    OE.mem.ocr = "busy"; OE.mem.ocrMsg = labels().loading; OE.render(1);
    loadTess().then(function (Tess) {
      return Tess.createWorker("nld+fra+eng", 1, { logger: function (m) {
        if (id !== ocrGen) return;
        var p = typeof m.progress === "number" ? m.progress : 0, fill = $("ocrfill");
        if (fill) fill.style.width = Math.round(((cur + Math.min(p, 0.99)) / n) * 100) + "%";
        var st = $("ocrstatus"); if (!st) return;
        var L = labels();
        st.textContent = m.status === "recognizing text" ? L.reading + (n > 1 ? " (" + (cur + 1) + "/" + n + ")" : "") : L.loading;
      } });
    }).then(function (worker) {
      var texts = [], i = 0;
      function next() {
        if (i >= n) return worker.terminate().then(function () { return texts; });
        var file = files[i]; cur = i; i++;
        return prepImage(file).then(function (canvas) {
          return worker.recognize(canvas).then(function (r) { texts.push(r && r.data && r.data.text || ""); return next(); });
        }, function () { texts.push(""); return next(); });
      }
      return next().catch(function (e) { return worker.terminate().catch(function () {}).then(function () { throw e; }); });
    }).then(function (texts) {
      if (id !== ocrGen) return;
      if (!texts.some(function (t) { return String(t || "").trim(); })) { showOcrError(labels().imgfail); return; }
      OE.mem.draft = ServiceMax.parse(ServiceMax.merge(texts));
      OE.mem.ocr = "review";
      OE.render(1);
    }, function () {
      if (id !== ocrGen) return;
      showOcrError(labels().fail);
    });
  }
  var ocrFile = $("ocrfile");
  if (ocrFile) ocrFile.addEventListener("change", function () {
    var files = [].slice.call(this.files || []); this.value = ""; if (files.length) runOcr(files);
  });
})(window.OE);
