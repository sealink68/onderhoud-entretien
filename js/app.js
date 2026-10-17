/* app.js – bootstrap: load state, wire header, render. */
"use strict";
(function (OE) {
  OE.S = OE.loadState();
  [].forEach.call(document.querySelectorAll("#seg button"), function (b) {
    b.onclick = function () { OE.S.lang = b.dataset.l; OE.save(); OE.render(1); };
  });
  OE.$("tipx").onclick = function () { OE.ls("oe_tip_hide", String(Date.now() + 7 * 864e5)); OE.$("tip").hidden = true; };
  window.addEventListener("resize", OE.fitAll);
  OE.render(1);
})(window.OE);
