/* report.js – turns a dossier object into structured / textual report content (per language). */
"use strict";
(function (OE) {
  var Q = OE.QUESTIONS;
  OE.hasRemarks = function (d) { return d.answers.some(function (a) { return !a.ok; }) || !!String(d.extra || "").trim(); };
  /* Free text of answer i (or "extra") in language L: original if L is the writing language, else translation. */
  OE.freeText = function (d, i, L) {
    var orig = i === "extra" ? (d.extra || "") : (d.answers[i].text || "");
    if (!orig.trim() || L === d.lang) return { t: orig, tr: false };
    var tr = d.tr && d.tr.to === L ? (i === "extra" ? d.tr.extra : (d.tr.answers || [])[i]) : null;
    return { t: tr != null && String(tr).trim() ? tr : orig + " " + OE.T[L].untr, tr: true };
  };
  OE.firstRevisit = function (d) {
    for (var i = 0; i < Q.length; i++) if (Q[i].kind === "revisit" && !d.answers[i].ok) return i;
    return -1;
  };
  /* -> [{n, q, ok, sub:[{t, tr}] }] for language L. The revisit sentence appears only once per dossier. */
  OE.reportRows = function (d, L) {
    var fr = OE.firstRevisit(d);
    return Q.map(function (q, i) {
      var a = d.answers[i], sub = [];
      if (!a.ok) {
        if (q.kind === "fixed") sub.push({ t: q.fixed[L], tr: false });
        if (q.kind === "revisit" && i === fr) sub.push({ t: OE.REVISIT[L], tr: false });
        if (q.kind === "text" || q.desc) sub.push(OE.freeText(d, i, L));
      }
      return { n: i + 1, q: q[L], ok: a.ok, sub: sub, photos: a.ok ? [] : (a.photos || []) };
    });
  };
  OE.techLabel = function (t) { return (t.first + " " + t.last).trim() + " (" + t.initials + ")"; };
  /* One language block; the technician is NOT repeated here (shown once in dossierText's header). */
  OE.dossierBlock = function (d, L) {
    var T = OE.T[L], out = [];
    OE.reportRows(d, L).forEach(function (r) {
      out.push(r.n + ". " + r.q + " – " + (r.ok ? T.yesT : T.noT).toUpperCase());
      r.sub.forEach(function (s) { out.push("   " + s.t); });
      if (r.photos.length) out.push("   📷 " + r.photos.join(", "));
    });
    var ex = OE.freeText(d, "extra", L);
    out.push(T.extra + ": " + (ex.t.trim() ? ex.t : "–"));
    return out.join("\n");
  };
  OE.dossierText = function (d) {
    var L = d.lang, O = OE.other(L);
    return "Dossier " + d.dossier + "\n" + OE.PDFT.tech + ": " + OE.techLabel(d.tech) + "\n\n" +
      OE.dossierBlock(d, L) + "\n\n" + OE.CFG.SEP + "\n(" + OE.DISC + ")\n\n" + OE.dossierBlock(d, O);
  };
})(window.OE);
