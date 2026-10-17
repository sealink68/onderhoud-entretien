/* i18n.js – language helpers. */
"use strict";
(function (OE) {
  OE.other = function (L) { return L === "fr" ? "nl" : "fr"; };
  OE.t = function () { return OE.T[(OE.S && OE.S.lang) || "nl"]; };
  OE.fmt = function (s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); };
  OE.initials = function (first, last) {
    function ini(s) { return String(s || "").trim().split(/[\s-]+/).filter(Boolean).map(function (w) { return w[0]; }).join(""); }
    // "Joachim Lust" -> "JL"; "Jan-Pieter Van Damme" -> "JVD" (first letter of first name + every part of last name)
    var f = String(first || "").trim(), l = String(last || "").trim();
    return ((f ? f[0] : "") + ini(l)).toUpperCase();
  };
})(window.OE);
