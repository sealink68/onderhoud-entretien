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
  /* Optional photo descriptions: answers[i].photoDesc = { "<photo name>": "text" } (only non-empty entries).
     Their translations live in d.tr.photoDesc (same object shape), produced in the same translate call. */
  OE.descList = function (d) {
    var out = [];
    (d.answers || []).forEach(function (a, i) { var pd = a.photoDesc || {}; (a.photos || []).forEach(function (n) { if (String(pd[n] || "").trim()) out.push({ i: i, n: n, t: String(pd[n]) }); }); });
    return out;
  };
  OE.photoDescText = function (d, i, n, L) {
    var orig = String(((d.answers[i] || {}).photoDesc || {})[n] || "");
    if (!orig.trim() || L === d.lang) return { t: orig, tr: false };
    var tr = d.tr && d.tr.to === L ? (d.tr.photoDesc || {})[n] : null;
    return { t: tr != null && String(tr).trim() ? tr : orig + " " + OE.T[L].untr, tr: true };
  };
  /* Everything that is translated for a dossier, in one list: 8 answer texts, extra, then photo descriptions. */
  OE.trSource = function (d) {
    return d.answers.map(function (a) { return a.text || ""; }).concat([d.extra || ""], OE.descList(d).map(function (x) { return x.t; }));
  };
  OE.trFromResult = function (d, to, r) {
    var N = d.answers.length, pd = {};
    OE.descList(d).forEach(function (x, k) { pd[x.n] = r.items[N + 1 + k]; });
    return { from: d.lang, to: to, engine: r.engine, fail: r.fail, answers: r.items.slice(0, N), extra: r.items[N], photoDesc: pd };
  };
  /* True if d.tr is complete (also covers dossiers saved before photo descriptions existed). */
  OE.trComplete = function (d) {
    if (!d.tr || d.tr.fail) return false;
    var pd = d.tr.photoDesc || {};
    return OE.descList(d).every(function (x) { return pd[x.n] != null; });
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
      var ph = a.ok ? [] : (a.photos || []);
      return { n: i + 1, q: q[L], ok: a.ok, sub: sub, photos: ph, pd: ph.map(function (n) { return OE.photoDescText(d, i, n, L); }) };
    });
  };
  OE.techLabel = function (t) { return (t.first + " " + t.last).trim() + " (" + t.initials + ")"; };
  /* One language block; the technician is NOT repeated here (shown once in dossierText's header). */
  OE.dossierBlock = function (d, L) {
    var T = OE.T[L], out = [];
    OE.reportRows(d, L).forEach(function (r) {
      out.push(r.n + ". " + r.q + " – " + (r.ok ? T.yesT : T.noT).toUpperCase());
      r.sub.forEach(function (s) { out.push("   " + s.t); });
      if (r.photos.length && !r.pd.some(function (x) { return x.t.trim(); })) out.push("   📷 " + r.photos.join(", "));
      else r.photos.forEach(function (n, k) { out.push("   📷 " + n + (r.pd[k].t.trim() ? " – " + r.pd[k].t : "")); });
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
