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
    OE.updateTip(); if (OE.outbox) OE.outbox.status(); OE.fitBrand();
  };
  /* dormakaba logo: full word mark only when it fits next to the title, else just the red symbol. */
  OE.fitBrand = function () {
    var h = document.querySelector("header"), b = h && h.querySelector(".brand"), t = OE.$("title"), r = h && h.querySelector(".hr");
    if (!b || !t || !r) return;
    h.classList.remove("bc", "bt", "bt2", "bt3"); t.style.whiteSpace = "nowrap";
    var g = function (e) { return parseFloat(getComputedStyle(e).columnGap) || 0; }, room = h.clientWidth - r.offsetWidth - g(h);
    var over = function () { return b.offsetWidth + g(b.parentNode) + t.scrollWidth > room + 0.5; };
    if (over()) h.classList.add("bc");
    var k = ["bt", "bt2", "bt3"], i = 0;
    for (; i < k.length && over(); i++) { if (i) h.classList.remove(k[i - 1]); h.classList.add(k[i]); }
    if (over() && /\s/.test(t.textContent)) h.classList.remove(k[i - 1]); /* multi-word title: wrap at normal size, as before */
    t.style.whiteSpace = "";
  };
  window.addEventListener("resize", function () { OE.fitBrand(); });
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
  /* Mandatory text popup (e.g. signer). onOk(value) runs inside the tap. */
  OE.promptModal = function (title, hint, value, needMsg, onOk) {
    var m = OE.$("modal"), x = OE.t(); m.onclick = null; m.dataset.help = "";
    m.innerHTML = '<div class="card"><p id="mtext">' + OE.esc(title) + '</p><textarea id="minp" rows="1" autocapitalize="words" autocomplete="off"></textarea><div id="merr"></div>' +
      '<div class="btns"><button class="btn sec" id="mno">' + x.cancel + '</button><button class="btn pri" id="mok">' + x.ok + "</button></div></div>";
    m.hidden = false;
    var i = OE.$("minp"); i.placeholder = hint; i.value = value || ""; OE.fit(i);
    i.oninput = function () { i.value = i.value.replace(/\n/g, ""); OE.fit(i); };
    i.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); OE.$("mok").click(); } };
    setTimeout(function () { try { i.focus(); } catch (e) {} }, 50);
    OE.$("mno").onclick = function () { m.hidden = true; };
    OE.$("mok").onclick = function () {
      var v = i.value.replace(/\s+/g, " ").trim();
      if (!v) { OE.$("merr").innerHTML = '<div class="err">⚠️ ' + OE.esc(needMsg) + "</div>"; return; }
      m.hidden = true; onOk(v);
    };
  };
  /* Confirm popup; onYes runs inside the user's tap (keeps clipboard/user-gesture rights). */
  OE.confirmModal = function (text, onYes) {
    var m = OE.$("modal"), x = OE.t(); m.onclick = null; m.dataset.help = "";
    m.innerHTML = '<div class="card"><p id="mtext">' + OE.esc(text) + '</p><div class="btns"><button class="btn sec" id="mno">' + x.no + '</button><button class="btn ok" id="myes">' + x.yes + "</button></div></div>";
    m.hidden = false;
    OE.$("mno").onclick = function () { m.hidden = true; };
    OE.$("myes").onclick = function () { m.hidden = true; onYes(); };
  };
  /* Per-screen help popup (texts in OE.HELP). Language screen: both languages. */
  function helpBody(L, sc) {
    var lines = (OE.HELP[L][sc] || OE.HELP[L].mode), out = "", ul = "";
    lines.forEach(function (l) {
      l = OE.devText(l);
      if (l.indexOf("• ") === 0) ul += "<li>" + OE.esc(l.slice(2)) + "</li>";
      else { if (ul) { out += "<ul>" + ul + "</ul>"; ul = ""; } out += "<p>" + OE.esc(l) + "</p>"; }
    });
    return out + (ul ? "<ul>" + ul + "</ul>" : "");
  }
  OE.showHelp = function () {
    var S = OE.S, m = OE.$("modal"), sc = S.lang ? S.screen : "lang", both = !S.lang, L = S.lang || "nl", H = OE.HELP[L];
    var title = both ? "Help / Aide" : H.title, close = both ? OE.HELP.nl.close + " / " + OE.HELP.fr.close : H.close;
    var body = both ? "<h3>Nederlands</h3>" + helpBody("nl", sc) + "<h3>Français</h3>" + helpBody("fr", sc) : helpBody(L, sc);
    m.innerHTML = '<div class="card hlp" id="hlp" role="dialog" aria-modal="true" aria-labelledby="hlph"><div class="hh"><h2 id="hlph">' + OE.esc(title) + '</h2><button type="button" class="hx" id="hlpx" aria-label="' + OE.esc(close) + '">×</button></div>' +
      body + '<div class="btns"><button type="button" class="btn sec" id="hlpc">' + OE.esc(close) + "</button></div></div>";
    m.hidden = false; m.dataset.help = "1";
    function shut() { m.hidden = true; m.dataset.help = ""; m.onclick = null; document.removeEventListener("keydown", key); }
    function key(e) { if (e.key === "Escape") shut(); }
    OE.$("hlpx").onclick = OE.$("hlpc").onclick = shut;
    m.onclick = function (e) { if (e.target === m) shut(); };
    document.addEventListener("keydown", key);
  };
})(window.OE);
