/* pdf.js – one print-ready bilingual (NL + FR) A4 PDF for a whole WO, with vendored jsPDF.
   A4 portrait 210x297 mm, 18 mm side margins, running header (title, WO, date) and footer (page X/Y) on
   every page, each dossier on a new page, blocks kept together (no stranded headings), photos max 2 per row. */
"use strict";
(function (OE) {
  var WIN = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
  function clean(s) { // jsPDF standard fonts cover WinAnsi only
    return String(s == null ? "" : s).replace(/[\u2192]/g, "->").replace(/[\u00A0\u202F]/g, " ").replace(/[^\n\x20-\x7E\u00A1-\u00FF]/g, function (c) { return WIN.indexOf(c) >= 0 ? c : "?"; });
  }
  var W = 210, H = 297, M = 18, CW = W - 2 * M, TOP = 30, BOT = H - 18;
  var C = { tx: [15, 23, 42], mu: [100, 116, 139], li: [148, 163, 184], tr: [67, 56, 202], ok: [6, 95, 70], nok: [153, 27, 27] };
  OE.buildPdf = function (wo, dossiers, onProgress) {
    var J = window.jspdf.jsPDF, doc = new J({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    var P = OE.PDFT, y = TOP;
    function font(st, sz, col) { doc.setFont("helvetica", st || "normal"); doc.setFontSize(sz || 10); var c = col || C.tx; doc.setTextColor(c[0], c[1], c[2]); }
    function lh(sz) { return sz * 0.3528 * 1.35; } // line height in mm for pt size
    function lines(txt, w, st, sz) { font(st, sz); return doc.splitTextToSize(clean(txt), w); }
    function newPage() { doc.addPage(); y = TOP; }
    function need(h) { if (y + h > BOT) { newPage(); return true; } return false; }
    // A text paragraph = {x, w, st, sz, col, ls}; measure + draw (may break between lines, never mid-line;
    // keeps at least 2 lines together to avoid widows/orphans).
    function para(txt, x, w, st, sz, col) { return { x: x, w: w, st: st, sz: sz, col: col, ls: lines(txt, w, st, sz) }; }
    function hOf(p) { return p.ls.length * lh(p.sz); }
    function draw(p) {
      var l = lh(p.sz), n = p.ls.length;
      p.ls.forEach(function (ln, i) {
        if (y + l > BOT) newPage();
        else if (i === 0 && n >= 2 && y + 2 * l > BOT) newPage();          // no orphan first line
        else if (i === n - 2 && i > 0 && y + 2 * l > BOT) newPage();      // no widow last line
        font(p.st, p.sz, p.col); doc.text(ln, p.x, y + l * 0.75); y += l;
      });
    }
    var jobs = [];
    dossiers.forEach(function (d) { d.answers.forEach(function (a) { if (!a.ok) (a.photos || []).forEach(function (n) { jobs.push(n); }); }); });
    var imgs = {}, done = 0;
    return jobs.reduce(function (pr, n) {
      return pr.then(function () {
        return OE.loadImage(OE.api.photoUrl(wo, n)).then(function (im) { imgs[n] = im; }, function () { imgs[n] = null; })
          .then(function () { done++; if (onProgress) onProgress(done, jobs.length); });
      });
    }, Promise.resolve()).then(function () {
      var now = new Date(), ds = now.toLocaleDateString("nl-BE") + " " + now.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
      // ---- WO overview (page 1) ----
      font("bold", 16); doc.text(clean(P.title), M, y + 5); y += 10;
      var info = [[P.wo, wo], [P.date, ds], ["Dossiers", String(dossiers.length) + "  (" + dossiers.map(function (d) { return d.dossier; }).join(" | ") + ")"]];
      var techs = []; dossiers.forEach(function (d) { var s = OE.techLabel(d.tech); if (techs.indexOf(s) < 0) techs.push(s); });
      info.push([P.techs, techs.join(", ")]);
      info.forEach(function (r) { var p = para(r[1], M + 48, CW - 48, "normal", 10); font("bold", 10, C.mu); doc.text(clean(r[0]), M, y + lh(10) * 0.75); draw(p); y += 1; });
      y += 4;
      dossiers.forEach(function (d, di) {
        if (di > 0) newPage(); else need(60);
        // ---- dossier header (technician shown ONCE here) ----
        var rem = OE.hasRemarks(d), when = d.createdAt ? new Date(d.createdAt) : new Date(d.receivedAt || Date.now());
        doc.setFillColor(238, 242, 255); doc.roundedRect(M, y, CW, 20, 2, 2, "F");
        font("bold", 14); doc.text(clean(P.dossier + " " + d.dossier), M + 4, y + 7.5, { maxWidth: CW - 60 });
        font("bold", 9, rem ? C.nok : C.ok); doc.text(clean(rem ? "Opmerkingen / Remarques" : "Alles juist / Tout correct"), W - M - 4, y + 7.5, { align: "right" });
        font("normal", 9.5, C.tx); doc.text(clean(P.tech + ": " + OE.techLabel(d.tech)), M + 4, y + 13.5);
        font("normal", 8.5, C.mu); doc.text(clean((P.mode[d.mode] || "") + "   ·   " + P.sent + ": " + when.toLocaleDateString("nl-BE") + " " + when.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })), M + 4, y + 18);
        y += 24;
        // ---- checklist rows: each row kept together ----
        var rn = OE.reportRows(d, "nl"), rf = OE.reportRows(d, "fr"), BW = 34, QW = CW - BW - 4;
        rn.forEach(function (r, i) {
          var f = rf[i], parts = [para(r.n + ". " + r.q, M, QW, "bold", 10, C.tx), para(f.q, M + 5, QW - 5, "italic", 9, C.mu)];
          r.sub.forEach(function (s, k) {
            var sf = f.sub[k];
            parts.push(para("NL: " + s.t, M + 5, CW - 5, s.tr ? "italic" : "normal", 10, s.tr ? C.tr : C.tx));
            parts.push(para("FR: " + sf.t, M + 5, CW - 5, sf.tr ? "italic" : "normal", 10, sf.tr ? C.tr : C.tx));
            if (s.tr || sf.tr) parts.push(para("(" + OE.DISC + ")", M + 5, CW - 5, "italic", 7.5, C.li));
          });
          var h = parts.reduce(function (a, p) { return a + hOf(p); }, 0) + 3;
          need(Math.min(h, BOT - TOP));
          var y0 = y;
          if (r.ok) doc.setFillColor(209, 250, 229); else doc.setFillColor(254, 226, 226);
          doc.roundedRect(W - M - BW, y0 + 0.3, BW, 6, 1.5, 1.5, "F");
          font("bold", 8, r.ok ? C.ok : C.nok); doc.text(r.ok ? P.yes : P.no, W - M - BW / 2, y0 + 4.4, { align: "center" });
          parts.forEach(draw);
          y += 1.2; doc.setDrawColor(226, 232, 240); doc.line(M, y, W - M, y); y += 1.8;
        });
        // ---- extra info (heading kept with its text) ----
        var en = OE.freeText(d, "extra", "nl"), ef = OE.freeText(d, "extra", "fr"), ex = [];
        if (en.t.trim()) {
          ex.push(para("NL: " + en.t, M + 5, CW - 5, en.tr ? "italic" : "normal", 10, en.tr ? C.tr : C.tx));
          ex.push(para("FR: " + ef.t, M + 5, CW - 5, ef.tr ? "italic" : "normal", 10, ef.tr ? C.tr : C.tx));
          ex.push(para("(" + OE.DISC + ")", M + 5, CW - 5, "italic", 7.5, C.li));
        } else ex.push(para(P.none, M + 5, CW - 5, "normal", 10, C.li));
        y += 2; need(lh(10.5) + Math.min(hOf(ex[0]) + (ex[1] ? hOf(ex[1]) : 0), 40));
        draw(para(P.extra, M, CW, "bold", 10.5, C.tx)); ex.forEach(draw);
        // ---- photos: max 2 per row, aspect kept, max 85 mm high, never split ----
        var names = [];
        d.answers.forEach(function (a) { if (!a.ok) (a.photos || []).forEach(function (n) { names.push(n); }); });
        if (names.length) {
          var GAP = 6, colW = (CW - GAP) / 2, MAXH = 85, CAP = 4.5;
          var rows = []; for (var k = 0; k < names.length; k += 2) rows.push(names.slice(k, k + 2));
          rows.forEach(function (row, ri) {
            var dims = row.map(function (n) { var im = imgs[n]; if (!im) return { w: colW, h: 12 };
              var s = Math.min(colW / im.w, MAXH / im.h); return { w: im.w * s, h: im.h * s }; });
            var hd = ri === 0 ? lh(10.5) + 4 : 0, mh = Math.max.apply(null, dims.map(function (z) { return z.h; }));
            var avail = BOT - y - hd - CAP - 3;
            if (mh > avail && avail >= 50) { var f = avail / mh; dims.forEach(function (z) { z.w *= f; z.h *= f; }); mh = avail; } // shrink a bit rather than leave a big gap
            var rh = mh + CAP + 3;
            y += ri === 0 ? 4 : 0;
            need(rh + (ri === 0 ? lh(10.5) : 0));
            if (ri === 0) draw(para(P.photos, M, CW, "bold", 10.5, C.tx));
            row.forEach(function (n, j) {
              var x = M + j * (colW + GAP), z = dims[j], im = imgs[n];
              if (im) { doc.addImage(im.data, "JPEG", x, y, z.w, z.h, n, "FAST"); doc.setDrawColor(226, 232, 240); doc.rect(x, y, z.w, z.h); }
              else { font("italic", 9, C.nok); doc.text(clean("[foto niet beschikbaar / photo indisponible]"), x, y + 6); }
              font("normal", 7.5, C.mu); doc.text(doc.splitTextToSize(clean(n), colW)[0], x, y + z.h + 3.5);
            });
            y += rh;
          });
        }
      });
      // ---- running header + footer on every page ----
      var np = doc.getNumberOfPages();
      for (var i = 1; i <= np; i++) {
        doc.setPage(i);
        font("bold", 9, C.tx); doc.text(clean(P.title), M, 12);
        font("normal", 9, C.mu); doc.text(clean(P.wo + ": " + wo + "   ·   " + ds), W - M, 12, { align: "right", maxWidth: CW - 75 });
        doc.setDrawColor(79, 70, 229); doc.setLineWidth(0.6); doc.line(M, 15.5, W - M, 15.5); doc.setLineWidth(0.2);
        doc.setDrawColor(226, 232, 240); doc.line(M, H - 13, W - M, H - 13);
        font("normal", 8, C.li); doc.text(clean("OC_" + wo + ".pdf  ·  dormakaba"), M, H - 8);
        doc.text(clean(P.page + " " + i + "/" + np), W - M, H - 8, { align: "right" });
      }
      return doc.output("blob");
    });
  };
})(window.OE);
