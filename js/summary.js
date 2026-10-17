/* summary.js – the short clipboard summary for "Eindverslag WO" (NL block, then FR block). */
"use strict";
(function (OE) {
  OE.buildSummary = function (dossiers) {
    var ok = dossiers.filter(function (d) { return !OE.hasRemarks(d); }).map(function (d) { return d.dossier; });
    var rem = dossiers.filter(function (d) { return OE.hasRemarks(d); }).map(function (d) { return d.dossier; });
    function block(L) {
      var parts = [];
      if (ok.length) parts.push(OE.SUMMARY[L].ok + "\n" + ok.join(" | "));
      if (ok.length && rem.length) parts.push(OE.CFG.UNDERSCORES);
      if (rem.length) parts.push(rem.join(" | ") + "\n" + OE.SUMMARY[L].rem);
      return parts.join("\n");
    }
    if (!dossiers.length) return "";
    return block("nl") + "\n\n" + OE.CFG.SEP + "\n\n" + block("fr");
  };
})(window.OE);
