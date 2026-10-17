/* pdf.js – one bilingual (NL + FR) PDF for a whole WO, with vendored jsPDF. */
"use strict";
(function (OE) {
  // jsPDF standard fonts only cover WinAnsi: replace anything else.
  var WIN = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
  function clean(s) {
    return String(s == null ? "" : s).replace(/[\u2192]/g, "->").replace(/[\u00A0\u202F]/g, " ").replace(/[^\n\x20-\x7E\u00A1-\u00FF]/g, function (c) { return WIN.indexOf(c) >= 0 ? c : "?"; });
  }
  OE.buildPdf = function (wo, dossiers, onProgress) {
    var J = window.jspdf.jsPDF, doc = new J({ unit: "mm", format: "a4", compress: true });
    var P = OE.PDFT, W = 210, H = 297, M = 15, CW = W - 2 * M, y = M;
    function font(st, sz, col) { doc.setFont("helvetica", st || "normal"); doc.setFontSize(sz || 10); var c = col || [15, 23, 42]; doc.setTextColor(c[0], c[1], c[2]); }
    function need(h) { if (y + h > H - 14) { doc.addPage(); y = M; } }
    function para(txt, x, w, st, sz, col, lh) {
      font(st, sz, col); var lines = doc.splitTextToSize(clean(txt), w), l = (lh || 0.42) * (sz || 10);
      lines.forEach(function (ln) { need(l); doc.text(ln, x, y + l * 0.8); y += l; });
    }
    // Load every photo first.
    var jobs = [];
    dossiers.forEach(function (d) { d.answers.forEach(function (a) { if (!a.ok) (a.photos || []).forEach(function (n) { jobs.push(n); }); }); });
    var imgs = {}, done = 0;
    return jobs.reduce(function (pr, n) {
      return pr.then(function () {
        return OE.loadImage(OE.api.photoUrl(wo, n)).then(function (im) { imgs[n] = im; }, function () { imgs[n] = null; })
          .then(function () { done++; if (onProgress) onProgress(done, jobs.length); });
      });
    }, Promise.resolve()).then(function () {
      // Header
      doc.setFillColor(79, 70, 229); doc.rect(0, 0, W, 26, "F");
      font("bold", 16, [255, 255, 255]); doc.text(clean(P.title), M, 12);
      font("normal", 10, [255, 255, 255]); doc.text(clean(P.wo + ": " + wo), M, 20);
      var now = new Date(), ds = now.toLocaleDateString("nl-BE") + " " + now.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
      doc.text(clean(P.date + ": " + ds), W - M, 20, { align: "right" });
      y = 32;
      var techs = [];
      dossiers.forEach(function (d) { var s = d.tech.initials + " (" + d.tech.first + " " + d.tech.last + ")"; if (techs.indexOf(s) < 0) techs.push(s); });
      para(P.techs + ": " + techs.join(", "), M, CW, "normal", 10, [71, 85, 105]);
      para("Dossiers: " + dossiers.map(function (d) { return d.dossier + " [" + d.tech.initials + "]"; }).join(" | "), M, CW, "normal", 10, [71, 85, 105]);
      y += 2;
      dossiers.forEach(function (d) {
        need(30);
        // Dossier title bar
        doc.setFillColor(238, 242, 255); doc.roundedRect(M, y, CW, 15, 2, 2, "F");
        font("bold", 13); doc.text(clean(P.dossier + " " + d.dossier), M + 3, y + 6.5);
        var rem = OE.hasRemarks(d);
        font("bold", 9, rem ? [185, 28, 28] : [4, 120, 87]);
        doc.text(clean(rem ? "Opmerkingen / Remarques" : "Alles juist / Tout correct"), W - M - 3, y + 6.5, { align: "right" });
        font("normal", 8.5, [71, 85, 105]);
        var when = d.createdAt ? new Date(d.createdAt) : new Date(d.receivedAt || Date.now());
        doc.text(clean(P.tech + ": " + d.tech.initials + " (" + d.tech.first + " " + d.tech.last + ")   ·   " + (P.mode[d.mode] || "") + "   ·   " + P.sent + ": " + when.toLocaleDateString("nl-BE") + " " + when.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })), M + 3, y + 12);
        y += 18;
        var rn = OE.reportRows(d, "nl"), rf = OE.reportRows(d, "fr");
        rn.forEach(function (r, i) {
          var f = rf[i], qw = CW - 40;
          var ln1 = doc.splitTextToSize(clean(r.n + ". " + r.q), qw), ln2 = doc.splitTextToSize(clean(f.q), qw - 4);
          need((ln1.length + ln2.length) * 4.4 + 3);
          var y0 = y;
          font("bold", 9.5); ln1.forEach(function (l) { doc.text(l, M, y + 3.5); y += 4.2; });
          font("italic", 9, [100, 116, 139]); ln2.forEach(function (l) { doc.text(l, M + 4, y + 3.3); y += 4; });
          if (r.ok) doc.setFillColor(209, 250, 229); else doc.setFillColor(254, 226, 226);
          doc.roundedRect(W - M - 36, y0, 36, 6.5, 1.5, 1.5, "F");
          font("bold", 8, r.ok ? [6, 95, 70] : [153, 27, 27]); doc.text(r.ok ? P.yes : P.no, W - M - 18, y0 + 4.4, { align: "center" });
          r.sub.forEach(function (s, k) {
            var sf = f.sub[k], fromLang = d.lang;
            [["NL", s], ["FR", sf]].forEach(function (pair) {
              var it = pair[1];
              para(pair[0] + ": " + it.t, M + 6, CW - 10, it.tr ? "italic" : "normal", 9.5, it.tr ? [79, 70, 229] : [15, 23, 42]);
            });
            if (s.tr || sf.tr) para("(" + OE.DISC + ")", M + 6, CW - 10, "italic", 7, [148, 163, 184]);
          });
          y += 1.5; doc.setDrawColor(226, 232, 240); doc.line(M, y, W - M, y); y += 1.5;
        });
        // Extra info
        var en = OE.freeText(d, "extra", "nl"), ef = OE.freeText(d, "extra", "fr");
        need(10); para(P.extra, M, CW, "bold", 9.5);
        if (en.t.trim()) {
          para("NL: " + en.t, M + 6, CW - 10, en.tr ? "italic" : "normal", 9.5, en.tr ? [79, 70, 229] : [15, 23, 42]);
          para("FR: " + ef.t, M + 6, CW - 10, ef.tr ? "italic" : "normal", 9.5, ef.tr ? [79, 70, 229] : [15, 23, 42]);
          para("(" + OE.DISC + ")", M + 6, CW - 10, "italic", 7, [148, 163, 184]);
        } else para(P.none, M + 6, CW - 10, "normal", 9.5, [148, 163, 184]);
        // Photos (2 per row)
        var names = [];
        d.answers.forEach(function (a) { if (!a.ok) (a.photos || []).forEach(function (n) { names.push(n); }); });
        if (names.length) {
          y += 2; need(12); para(P.photos, M, CW, "bold", 9.5);
          var colW = (CW - 6) / 2, x = M, rowH = 0;
          names.forEach(function (n, k) {
            var im = imgs[n], w = colW, h = im ? Math.min(colW * im.h / im.w, 90) : 10; if (im) w = h * im.w / im.h;
            if (k % 2 === 0) { y += rowH; rowH = 0; need(h + 6); x = M; } else x = M + colW + 6;
            if (im) doc.addImage(im.data, "JPEG", x, y, w, h, n, "FAST");
            else { font("italic", 8, [185, 28, 28]); doc.text(clean("[foto niet beschikbaar / photo indisponible]"), x, y + 5); }
            font("normal", 7, [100, 116, 139]); doc.text(clean(n), x, y + h + 3.5);
            rowH = Math.max(rowH, h + 6);
          });
          y += rowH;
        }
        y += 6;
      });
      var np = doc.getNumberOfPages();
      for (var i = 1; i <= np; i++) {
        doc.setPage(i); font("normal", 8, [148, 163, 184]);
        doc.text(clean("OC_" + wo + ".pdf  ·  dormakaba  ·  " + P.page + " " + i + "/" + np), W / 2, H - 7, { align: "center" });
      }
      return doc.output("blob");
    });
  };
})(window.OE);
