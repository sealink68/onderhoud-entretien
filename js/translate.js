/* translate.js – same approach as Werkrapport: werkrapport-translate proxy (max 20 items),
   fallback to MyMemory line by line (with de=..., then without). */
"use strict";
(function (OE) {
  var cache = {};
  OE.trLastErr = "";
  function decode(o) { var tx = document.createElement("textarea"); tx.innerHTML = o; return tx.value; }
  function norm(x) { return String(x).toLowerCase().replace(/[\s.,;:!?'"’]+/g, " ").trim(); }
  function getJSON(url) {
    return new Promise(function (res, rej) {
      var done = false, tm = setTimeout(function () { if (!done) { done = true; rej("timeout"); } }, 12000);
      function fin(f, v) { if (!done) { done = true; clearTimeout(tm); f(v); } }
      fetch(url, { mode: "cors", credentials: "omit", cache: "no-store" }).then(function (r) { if (!r.ok) throw "HTTP " + r.status; return r.json(); })
        .then(function (j) { fin(res, j); }, function (e) { fin(rej, String(e)); });
    });
  }
  function tryMM(txt, lp, withDe) {
    var url = OE.CFG.MYMEMORY + "?q=" + encodeURIComponent(txt.slice(0, 500)) + "&langpair=" + encodeURIComponent(lp) + (withDe ? "&de=" + encodeURIComponent(OE.CFG.MYMEMORY_DE) : "");
    return getJSON(url).then(function (j) {
      var o = j && j.responseData && j.responseData.translatedText;
      if (!o || +j.responseStatus !== 200 || j.quotaFinished === true || /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID|NO QUERY|IS AN INVALID/i.test(o)) throw "api: " + (j && j.responseDetails || o || "empty");
      o = decode(o);
      if (norm(o) === norm(txt)) {
        var m = (j.matches || []).filter(function (x) { return x.translation && norm(x.translation) !== norm(txt) && norm(x.segment || "") === norm(txt); })[0];
        if (m) o = decode(m.translation);
      }
      return o;
    });
  }
  function mmLine(txt, lp) {
    var k = lp + "|" + txt; if (cache[k]) return Promise.resolve(cache[k]);
    return tryMM(txt, lp, true).catch(function (e) { OE.trLastErr = String(e); return tryMM(txt, lp, false); })
      .then(function (o) { var r = { ok: true, t: o }; cache[k] = r; return r; }, function (e) { OE.trLastErr = String(e); return { ok: false, t: txt }; });
  }
  function mmAll(from, to, items) {
    var lp = from + "|" + to, untr = OE.T[to].untr;
    return Promise.all(items.map(function (a) {
      if (!a.trim()) return Promise.resolve({ ok: true, t: a });
      return Promise.all(a.split("\n").map(function (ln) { return ln.trim() ? mmLine(ln, lp) : Promise.resolve({ ok: true, t: ln }); }))
        .then(function (rs) { var ok = rs.every(function (r) { return r.ok; }); return { ok: ok, t: rs.map(function (r) { return r.t; }).join("\n") + (ok ? "" : " " + untr) }; });
    })).then(function (rs) { return { items: rs.map(function (r) { return r.t; }), engine: "mymemory", fail: rs.some(function (r) { return !r.ok; }) }; });
  }
  function postProxy(from, to, items) {
    return new Promise(function (res, rej) {
      var done = false, tm = setTimeout(function () { if (!done) { done = true; rej("timeout"); } }, 15000);
      function fin(f, v) { if (!done) { done = true; clearTimeout(tm); f(v); } }
      fetch(OE.CFG.TRANSLATE_PROXY, { method: "POST", mode: "cors", credentials: "omit", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: from, to: to, items: items }) })
        .then(function (r) { if (!r.ok) throw "HTTP " + r.status; return r.json(); })
        .then(function (j) { if (!j || !Array.isArray(j.items) || j.items.length !== items.length) fin(rej, "length"); else fin(res, j); }, function (e) { fin(rej, String(e && e.message || e)); });
    });
  }
  /* translate(from,to,items[]) -> Promise<{items[], engine, fail}> ; never rejects. Empty strings stay empty. */
  OE.translate = function (from, to, items) {
    var idx = [], src = [];
    items.forEach(function (s, i) { if (String(s || "").trim()) { idx.push(i); src.push(String(s)); } });
    var out = items.map(function (s) { return String(s || ""); });
    if (!src.length) return Promise.resolve({ items: out, engine: "none", fail: false });
    var acc = [], i = 0, engine = "";
    function next() {
      if (i >= src.length) return Promise.resolve();
      var chunk = src.slice(i, i + 20); i += chunk.length;
      return postProxy(from, to, chunk).then(function (j) { acc = acc.concat(j.items); engine = j.engine || "proxy"; return next(); });
    }
    return next().then(function () { OE.trLastErr = ""; return { items: acc, engine: engine, fail: false }; },
      function () { return mmAll(from, to, src); })
      .then(function (r) { r.items.forEach(function (t, k) { out[idx[k]] = t; }); return { items: out, engine: r.engine, fail: r.fail }; });
  };
})(window.OE);
