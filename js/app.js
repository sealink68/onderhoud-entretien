/* app.js – bootstrap: load state, wire header, render. */
"use strict";
(function (OE) {
  OE.S = OE.loadState();
  [].forEach.call(document.querySelectorAll("#seg button"), function (b) {
    b.onclick = function () { OE.S.lang = b.dataset.l; OE.save(); OE.render(1); };
  });
  OE.$("tipx").onclick = function () { OE.ls("oe_tip_hide", String(Date.now() + 7 * 864e5)); OE.$("tip").hidden = true; };
  window.addEventListener("resize", OE.fitAll);
  // Outbox: re-render the screens that show its state when it changes; retry pending uploads on start.
  OE.onOutboxChange = function () {
    var sc = OE.S.screen;
    if (sc === "sent") OE.render(1);
    else if (sc === "final" && OE.$("modal").hidden && !OE.mem.finalMsg && !(OE.$("snd") && OE.$("snd").disabled && OE.mem.final && OE.mem.final.dossiers && OE.mem.final.dossiers.length)) { OE.mem.final = null; OE.render(1); }
  };
  OE.render(1);
  OE.outbox.changed(); OE.outbox.flush();
})(window.OE);
