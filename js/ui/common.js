/* ui/common.js – DOM helpers, rendering frame, header, modal. */
"use strict";
(function (OE) {
  OE.$ = function (id) { return document.getElementById(id); };
  OE.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  OE.fit = function (el) {
    if (!el) return; el.style.height = "auto";
    var extra = el.offsetHeight - el.clientHeight; el.style.height = (el.scrollHeight + extra) + "px";
    if (el.scrollHeight > el.clientHeight) el.style.height = (el.offsetHeight + (el.scrollHeight - el.clientHeight)) + "px";
  };
  OE.fitAll = function () { [].forEach.call(document.querySelectorAll("textarea"), OE.fit); };
  OE.screens = {};
  OE.hdr = function () {
    var S = OE.S, L = S.lang || "nl";
    OE.$("title").textContent = OE.T[L].title; document.title = OE.CFG.APP; document.documentElement.lang = L;
    [].forEach.call(document.querySelectorAll("#seg button"), function (b) { b.classList.toggle("on", b.dataset.l === S.lang); });
    OE.$("seg").style.visibility = S.lang ? "visible" : "hidden";
    OE.updateTip(); if (OE.outbox) OE.outbox.status();
  };
  OE.anim = function (dir) { var c = OE.$("card"); c.classList.remove("slide-in-r", "slide-in-l"); void c.offsetWidth; c.classList.add(dir < 0 ? "slide-in-l" : "slide-in-r"); };
  OE.render = function (dir) {
    var S = OE.S; OE.hdr(); OE.$("top").innerHTML = "";
    if (!S.lang) S.screen = "lang";
    else if ((!S.tech.first || !S.tech.last) && S.screen !== "lang") S.screen = "tech";
    (OE.screens[S.screen] || OE.screens.mode)();
    OE.anim(dir || 1); OE.fitAll(); window.scrollTo(0, 0);
  };
  OE.go = function (screen, dir) { OE.S.screen = screen; OE.save(); OE.render(dir); };
  OE.bind = function (id, fn) { var e = OE.$(id); if (e) e.onclick = fn; };
  OE.err = function (msg) { var e = OE.$("err"); if (e) { e.innerHTML = msg ? '<div class="err">⚠️ ' + OE.esc(msg) + "</div>" : ""; } };
  OE.progress = function (a, b, label) {
    OE.$("top").innerHTML = '<div class="prog"><span>' + OE.esc(label) + "</span><span>" + Math.round(a / b * 100) + '%</span></div><div class="bar"><i style="width:' + (a / b * 100) + '%"></i></div>';
  };
  /* Confirm popup; onYes runs inside the user's tap (keeps clipboard/user-gesture rights). */
  OE.confirmModal = function (text, onYes) {
    var m = OE.$("modal"), x = OE.t();
    m.innerHTML = '<div class="card"><p id="mtext">' + OE.esc(text) + '</p><div class="btns"><button class="btn sec" id="mno">' + x.no + '</button><button class="btn ok" id="myes">' + x.yes + "</button></div></div>";
    m.hidden = false;
    OE.$("mno").onclick = function () { m.hidden = true; };
    OE.$("myes").onclick = function () { m.hidden = true; onYes(); };
  };
})(window.OE);
