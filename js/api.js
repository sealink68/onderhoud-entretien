/* api.js – calls to the onderhoud-api Cloudflare Worker. */
"use strict";
(function (OE) {
  function base() { return (window.OE_API_OVERRIDE || OE.CFG.API); }
  function req(method, path, body, type, timeout) {
    var ctl = window.AbortController ? new AbortController() : null;
    var tm = setTimeout(function () { if (ctl) ctl.abort(); }, timeout || 30000);
    var opt = { method: method, mode: "cors", credentials: "omit", cache: "no-store", headers: {} };
    if (ctl) opt.signal = ctl.signal;
    if (body !== undefined) { opt.body = body; opt.headers["Content-Type"] = type || "application/json"; }
    return fetch(base() + path, opt).then(function (r) {
      clearTimeout(tm);
      return r.text().then(function (t) {
        var j = null; try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok) throw new Error((j && j.error) || ("HTTP " + r.status));
        return j;
      });
    }, function (e) { clearTimeout(tm); throw e; });
  }
  var E = encodeURIComponent;
  OE.api = {
    url: function (path) { return base() + path; },
    listWOs: function () { return req("GET", "/wos").then(function (j) { return j.wos || []; }); },
    createWO: function (wo) { return req("POST", "/wo", JSON.stringify({ wo: wo })); },
    getWO: function (wo) { return req("GET", "/wo/" + E(wo)); },
    getDossier: function (wo, dn) { return req("GET", "/wo/" + E(wo) + "/dossier/" + E(dn)); },
    putDossier: function (wo, dn, d) { return req("PUT", "/wo/" + E(wo) + "/dossier/" + E(dn), JSON.stringify(d)); },
    putPhoto: function (wo, name, blob) { return req("PUT", "/wo/" + E(wo) + "/photo/" + E(name), blob, "image/jpeg", 60000); },
    photoUrl: function (wo, name) { return base() + "/wo/" + E(wo) + "/photo/" + E(name); },
    setSigner: function (wo, signer) { return req("PUT", "/wo/" + E(wo) + "/signer", JSON.stringify({ signer: signer })); },
    putPdf: function (wo, blob) { return req("PUT", "/wo/" + E(wo) + "/pdf", blob, "application/pdf", 120000); },
    pdfUrl: function (wo) { return base() + "/wo/" + E(wo) + "/pdf"; }
  };
})(window.OE);
