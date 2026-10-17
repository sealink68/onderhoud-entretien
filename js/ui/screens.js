/* ui/screens.js – one function per screen. Flow:
   lang -> tech (once) -> mode -> wo -> q (8x) -> extra -> preview -> sent -> final */
"use strict";
(function (OE) {
  var $ = OE.$, esc = OE.esc, SC = OE.screens, Q = OE.QUESTIONS;
  var mem = { woList: null, woErr: false, final: null, finalErr: "", pdf: null, pdfBlob: null, summary: "", finalMsg: "", showRep: false, trBusy: false };
  OE.mem = mem;

  /* ---------- 1. language ---------- */
  SC.lang = function () {
    $("card").innerHTML = '<div class="start"><h2>Kies je taal</h2><p>Choisissez votre langue</p>' +
      '<button class="btn pri big" data-l="nl">🇧🇪 Nederlands<small>' + OE.T.nl.langNl + '</small></button>' +
      '<button class="btn sec big" data-l="fr">🇫🇷 Français<small>' + OE.T.fr.langFr + "</small></button></div>";
    [].forEach.call($("card").querySelectorAll("[data-l]"), function (b) {
      b.onclick = function () { OE.S.lang = b.dataset.l; OE.go(OE.S.tech.first && OE.S.tech.last ? "mode" : "tech"); };
    });
  };

  /* ---------- 2. technician (once, editable via settings) ---------- */
  SC.tech = function () {
    var S = OE.S, x = OE.t(), first = !(S.tech.first && S.tech.last);
    $("card").innerHTML = '<h2 class="q">' + x.techH + '</h2><p class="hint" style="margin-top:-8px">' + x.techP + "</p>" +
      '<label class="lbl" for="fn">' + x.first + '</label><input id="fn" autocomplete="given-name" autocapitalize="words" placeholder="' + esc(x.firstPh) + '">' +
      '<label class="lbl" for="lnm">' + x.last + '</label><input id="lnm" autocomplete="family-name" autocapitalize="words" placeholder="' + esc(x.lastPh) + '">' +
      '<p class="hint">' + x.initials + ': <b id="ini"></b></p><div id="err"></div>' +
      '<div class="btns"><a class="btn sec" id="inst" href="' + esc(OE.CFG.SHORTCUT_INSTALL) + '" target="_blank" rel="noopener">⬇ ' + esc(x.techInstall) + "</a></div>" +
      '<div class="btns">' + (first ? "" : '<button class="btn sec" id="bk">‹ ' + x.back + "</button>") +
      '<button class="btn pri" id="go">' + (first ? x.techStart : x.techSave) + "</button></div>" +
      (first ? '<p class="note">' + esc(x.techNote) + "</p>" : '<button class="small" id="setup">' + esc(x.techStart) + "</button>");
    var fn = $("fn"), ln = $("lnm");
    fn.value = S.tech.first; ln.value = S.tech.last;
    function upd() { $("ini").textContent = OE.initials(fn.value, ln.value) || "–"; }
    fn.oninput = ln.oninput = upd; upd();
    function store() {
      if (!fn.value.trim() || !ln.value.trim()) { OE.err(x.needName); return false; }
      S.tech = { first: fn.value.trim(), last: ln.value.trim() }; OE.save(); return true;
    }
    OE.bind("bk", function () { OE.go("mode", -1); });
    OE.bind("go", function () { if (!store()) return; if (first) OE.runShortcut("setup"); OE.go("mode"); });
    OE.bind("setup", function () { if (!store()) return; OE.runShortcut("setup"); });
  };

  /* ---------- 3. 1 or more devices ---------- */
  SC.mode = function () {
    var S = OE.S, x = OE.t();
    $("card").innerHTML = '<div class="start"><h2>' + x.modeH + "</h2><p>" + esc(S.tech.first + " " + S.tech.last) + " · " + OE.initials(S.tech.first, S.tech.last) + "</p>" +
      '<button class="btn ' + (S.mode === "multi" ? "sec" : "pri") + ' big" id="m1">1 toestel / un appareil<small>' + x.mode1s + "</small></button>" +
      '<button class="btn ' + (S.mode === "multi" ? "pri" : "sec") + ' big" id="mn">Meerdere toestellen / plusieurs appareils<small>' + x.modeNs + "</small></button></div>" +
      '<button class="small" id="set">' + x.settings + "</button>";
    OE.bind("m1", function () { S.mode = "single"; OE.go("wo"); });
    OE.bind("mn", function () { S.mode = "multi"; OE.go("wo"); });
    OE.bind("set", function () { OE.go("tech"); });
  };

  /* ---------- 4. WO + dossier ---------- */
  function loadWOs() {
    mem.woList = null; mem.woErr = false;
    OE.api.listWOs().then(function (l) { mem.woList = l; }, function () { mem.woList = []; mem.woErr = true; })
      .then(function () { if (OE.S.screen === "wo") drawWOList(); });
  }
  function drawWOList() {
    var S = OE.S, x = OE.t(), el = $("wol"); if (!el) return;
    if (!mem.woList) { el.innerHTML = '<div class="load"><div class="spin"></div>' + x.woLoading + "</div>"; return; }
    var l = mem.woList.slice();
    if (S.wo && !S.woIsNew && !l.some(function (w) { return w.wo === S.wo; })) l.unshift({ wo: S.wo });
    el.innerHTML = (mem.woErr ? '<div class="err">' + x.woErr + "</div>" : "") +
      (l.length ? '<div class="opt">' + l.map(function (w) {
        return '<button data-wo="' + esc(w.wo) + '" class="' + (w.wo === S.wo && !S.woIsNew ? "on" : "") + '">' + esc(w.wo) +
          (w.n != null ? "<small>" + w.n + " " + x.dossiers + (w.updated ? " · " + new Date(w.updated).toLocaleDateString("nl-BE") : "") + "</small>" : "") + "</button>";
      }).join("") + "</div>" : '<p class="hint">' + x.woNone + "</p>") +
      '<button class="small" id="rl" style="margin:0">' + x.woReload + "</button>";
    [].forEach.call(el.querySelectorAll("[data-wo]"), function (b) {
      b.onclick = function () { S.wo = b.dataset.wo; S.woIsNew = false; S.woNewTxt = ""; $("won").value = ""; OE.save(); drawWOList(); finalBtn(); };
    });
    OE.bind("rl", loadWOs);
  }
  function finalBtn() { var b = $("fin"); if (b) b.style.display = OE.S.wo && !OE.S.woIsNew ? "" : "none"; }
  SC.wo = function () {
    var S = OE.S, x = OE.t();
    $("card").innerHTML = '<h2 class="q">' + x.woH + "</h2>" +
      '<label class="lbl">' + x.woExisting + '</label><div id="wol"></div>' +
      '<label class="lbl" for="won">' + x.woNew + '</label><div class="pre"><span>WO-</span><input id="won" autocapitalize="characters" autocomplete="off" placeholder="' + x.woNewPh + '"></div>' +
      '<label class="lbl" for="dn">' + x.dossier + '</label><textarea id="dn" rows="1" autocomplete="off" autocapitalize="characters" enterkeyhint="next"></textarea>' +
      '<div id="err"></div><div class="btns"><button class="btn sec" id="bk">‹ ' + x.back + '</button><button class="btn pri" id="nx">' + x.next + " ›</button></div>" +
      '<div class="btns"><button class="btn sec" id="fin">📄 ' + x.finalBtn + "</button></div>";
    var won = $("won"), dn = $("dn");
    won.value = S.woNewTxt || ""; dn.value = S.dossier || ""; dn.placeholder = x.dossierPh;
    won.oninput = function () {
      won.value = won.value.replace(/^\s*WO-?/i, "").replace(/\s+/g, "");
      S.woNewTxt = won.value; S.woIsNew = !!won.value; if (S.woIsNew) S.wo = ""; OE.save(); drawWOList(); finalBtn();
    };
    dn.oninput = function () { dn.value = dn.value.replace(/\s+/g, ""); S.dossier = dn.value; OE.save(); OE.fit(dn); };
    dn.onkeydown = function (e) { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); next(); } };
    drawWOList(); if (!mem.woList) loadWOs(); finalBtn();
    OE.bind("bk", function () { OE.go("mode", -1); });
    OE.bind("fin", function () { mem.final = null; OE.go("final"); });
    OE.bind("nx", next);
    function next() {
      var wo = S.woIsNew ? OE.CFG.WO_PREFIX + (S.woNewTxt || "") : S.wo;
      if (!wo || wo === OE.CFG.WO_PREFIX) return OE.err(x.needWo);
      if (!/^WO-[A-Za-z0-9._-]{1,40}$/.test(wo)) return OE.err(x.woInvalid);
      if (!S.dossier.trim()) return OE.err(x.needDossier);
      if (!/^[A-Za-z0-9._-]{1,40}$/.test(S.dossier)) return OE.err(x.dnInvalid);
      $("nx").disabled = true;
      var pr = S.woIsNew ? OE.api.createWO(wo) : Promise.resolve();
      pr.then(function () {
        if (S.woIsNew) { mem.woList = null; S.woIsNew = false; S.woNewTxt = ""; }
        S.wo = wo; S.step = 0; OE.go("q");
      }, function (e) { $("nx").disabled = false; OE.err(x.sendErr + " (" + (e && e.message || e) + ")"); });
    }
  };

  /* ---------- 5. checklist (one statement per page) ---------- */
  function photoHtml(a) {
    return '<div class="photos">' + a.photos.map(function (p, k) {
      return '<figure><img src="' + esc(p.data || OE.api.photoUrl(OE.S.wo, p.name)) + '" alt=""><button class="del" data-k="' + k + '" aria-label="x">×</button><figcaption>' + esc(p.name) + (p.up ? " ✓" : "") + "</figcaption></figure>";
    }).join("") + "</div>";
  }
  SC.q = function () {
    var S = OE.S, x = OE.t(), L = S.lang, i = S.step, q = Q[i], a = S.answers[i], N = Q.length;
    OE.progress(i + 1, N, OE.fmt(x.qOf, { a: i + 1, b: N }) + " · " + S.wo + " · " + S.dossier);
    var body = "";
    if (!a.ok) {
      if (q.kind === "fixed") body += '<div class="fixed">' + esc(q.fixed[L]) + "</div>";
      if (q.kind === "revisit") body += '<div class="fixed">' + esc(OE.REVISIT[L]) + ' <small style="font-weight:500">' + esc(x.revisitOnce) + "</small></div>";
      if (q.kind === "text" || q.desc) body += '<textarea id="inp" rows="1" autocapitalize="sentences"></textarea>';
      if (q.photo) body += photoHtml(a) + '<div class="btns"><label class="btn sec file">' + x.photoAdd + '<input type="file" id="cam" accept="image/*" capture="environment"></label>' +
        '<label class="btn sec file">' + x.photoLib + '<input type="file" id="lib" accept="image/*" multiple></label></div>';
    }
    $("card").innerHTML = '<div class="num">' + (i + 1) + '</div><h2 class="q">' + esc(q[L]) + "</h2>" +
      '<div class="tog"><button class="y' + (a.ok ? " on" : "") + '" id="ty">✓ ' + x.yesT + '</button><button class="n' + (a.ok ? "" : " on") + '" id="tn">✗ ' + x.noT + "</button></div>" +
      body + '<div id="err"></div><div class="btns"><button class="btn sec" id="bk">‹ ' + x.back + '</button><button class="btn pri" id="nx">' + x.next + " ›</button></div>";
    OE.bind("ty", function () { a.ok = true; OE.save(); OE.render(1); });
    OE.bind("tn", function () { a.ok = false; OE.save(); OE.render(1); setTimeout(function () { var e = $("inp"); if (e) e.focus(); }, 80); });
    var inp = $("inp");
    if (inp) { inp.placeholder = q.ph[L]; inp.value = a.text; inp.oninput = function () { a.text = inp.value; OE.save(); OE.fit(inp); }; }
    [].forEach.call($("card").querySelectorAll(".del"), function (b) { b.onclick = function () { a.photos.splice(+b.dataset.k, 1); OE.save(); OE.render(1); }; });
    ["cam", "lib"].forEach(function (id) { var f = $(id); if (f) f.onchange = function () { addPhotos(a, [].slice.call(f.files || [])); }; });
    OE.bind("bk", function () { if (i === 0) OE.go(S.editing ? "final" : "wo", -1); else { S.step--; OE.go("q", -1); } });
    OE.bind("nx", function () {
      if (!a.ok && (q.kind === "text" || q.desc) && !a.text.trim()) return OE.err(x.needText);
      if (!a.ok && q.photo && !a.photos.length) return OE.err(x.photoNeed);
      if (i < N - 1) { S.step++; OE.go("q"); } else OE.go("extra");
    });
  };
  function addPhotos(a, files) {
    var S = OE.S;
    files.reduce(function (pr, f) {
      return pr.then(function () {
        return OE.resizePhoto(f).then(function (data) {
          var p = { name: OE.photoName(S.wo, S.dossier, ++S.photoSeq), data: data, up: false };
          a.photos.push(p); OE.save();
          OE.api.putPhoto(S.wo, p.name, OE.dataUrlToBlob(data)).then(function () { p.up = true; delete p.data; OE.save(); }, function () {});
        });
      });
    }, Promise.resolve()).then(function () { OE.render(1); }, function () { OE.render(1); OE.err(OE.t().photoErr); });
  }

  /* ---------- 6. extra info ---------- */
  SC.extra = function () {
    var S = OE.S, x = OE.t();
    OE.progress(1, 1, x.extraH + " · " + S.wo + " · " + S.dossier);
    $("card").innerHTML = '<div class="num">+</div><h2 class="q">' + x.extraH + '</h2><textarea id="inp" rows="1" autocapitalize="sentences"></textarea>' +
      '<div class="btns"><button class="btn sec" id="bk">‹ ' + x.back + '</button><button class="btn pri" id="nx">' + x.sendDossier + " ›</button></div>";
    var inp = $("inp"); inp.placeholder = x.extraPh; inp.value = S.extra;
    inp.oninput = function () { S.extra = inp.value; OE.save(); OE.fit(inp); };
    OE.bind("bk", function () { S.step = Q.length - 1; OE.go("q", -1); });
    OE.bind("nx", function () { mem.showRep = false; OE.go("preview"); });
  };

  /* ---------- draft -> dossier object ---------- */
  OE.draftDossier = function () {
    var S = OE.S, ed = S.editing, tech = ed ? ed.tech : { first: S.tech.first, last: S.tech.last, initials: OE.initials(S.tech.first, S.tech.last) };
    var d = {
      version: 1, app: OE.CFG.APP, wo: S.wo, dossier: S.dossier, mode: (ed && ed.mode) || S.mode || "single",
      lang: ed ? ed.lang : S.lang, tech: tech, createdAt: new Date().toISOString(),
      answers: S.answers.map(function (a, i) {
        var q = Q[i], keepText = !a.ok && (q.kind === "text" || q.desc);
        return { ok: !!a.ok, text: keepText ? a.text.trim() : "", photos: !a.ok && q.photo ? a.photos.map(function (p) { return p.name; }) : [] };
      }),
      extra: S.extra.trim(),
      texts: Q.map(function (q, i) { return { nl: q.nl, fr: q.fr, fixed: q.fixed || null, revisit: q.kind === "revisit" ? OE.REVISIT : null }; })
    };
    if (ed) { d.editedBy = { first: S.tech.first, last: S.tech.last, initials: OE.initials(S.tech.first, S.tech.last) }; d.firstCreatedAt = ed.createdAt; }
    return d;
  };
  function srcKey(d) { return JSON.stringify([d.lang, d.answers.map(function (a) { return a.text; }), d.extra]); }
  function ensureTr(d, force) {
    var S = OE.S, k = srcKey(d);
    if (!force && S.tr && S.tr.key === k) return Promise.resolve(S.tr);
    var to = OE.other(d.lang), items = d.answers.map(function (a) { return a.text; }).concat([d.extra]);
    return OE.translate(d.lang, to, items).then(function (r) {
      S.tr = { key: k, from: d.lang, to: to, engine: r.engine, fail: r.fail, answers: r.items.slice(0, Q.length), extra: r.items[Q.length] };
      OE.save(); return S.tr;
    });
  }
  function withTr(d) { var t = OE.S.tr; if (t) d.tr = { from: t.from, to: t.to, engine: t.engine, fail: t.fail, answers: t.answers, extra: t.extra }; return d; }

  function dossierCard(d, L, opts) {
    var x = OE.T[L], rem = OE.hasRemarks(d);
    var rows = OE.reportRows(d, L).filter(function (r) { return !r.ok || opts.all; });
    var O = OE.other(L);
    return '<div class="dos"><h3><span>' + esc(d.dossier) + ' <small style="color:#64748b">· ' + esc(d.tech.initials) + "</small></span>" +
      '<span class="badge ' + (rem ? "r" : "g") + '">' + (rem ? x.remarks : x.allOk) + "</span></h3>" +
      '<ul class="res">' + rows.map(function (r) {
        var other = opts.tr ? OE.reportRows(d, O)[r.n - 1] : null;
        return "<li><span class=\"" + (r.ok ? "g" : "r") + "\">" + (r.ok ? "✓" : "✗") + "</span> " + esc(r.n + ". " + r.q) +
          r.sub.map(function (s, k) { var o = other && other.sub[k]; return "<em>" + esc(s.t) + "</em>" + (o && (o.tr || s.tr) ? '<em class="tr">→ ' + esc(o.t) + "</em>" : ""); }).join("") +
          (r.photos.length ? "<em>📷 " + esc(r.photos.join(", ")) + "</em>" : "") + "</li>";
      }).join("") +
      (d.extra ? "<li>" + x.extra + ": <em>" + esc(OE.freeText(d, "extra", L).t) + "</em>" + (opts.tr ? '<em class="tr">→ ' + esc(OE.freeText(d, "extra", O).t) + "</em>" : "") + "</li>" : "") +
      "</ul>" + (opts.edit ? '<button class="edit" data-edit="' + esc(d.dossier) + '">✎ ' + x.edit + "</button>" : "") + "</div>";
  }

  /* ---------- 6b. preview + send ---------- */
  SC.preview = function () {
    var S = OE.S, x = OE.t(), d = OE.draftDossier();
    $("card").innerHTML = '<h2 class="q" style="margin-bottom:6px">' + x.prevH + '</h2><p class="hint" style="margin:0 0 6px">' + esc(S.wo) + " · " + esc(d.tech.first + " " + d.tech.last) + (S.editing ? " · " + x.editing : "") + "</p>" +
      '<div id="pv"><div class="load"><div class="spin"></div>' + x.translating + "</div></div><div id=\"rep\"></div><div id=\"err\"></div>" +
      '<div class="btns"><button class="btn sec" id="bk">‹ ' + x.back + '</button><button class="btn sec" id="sr">' + (mem.showRep ? x.hideReport : x.showReport) + "</button></div>" +
      '<div class="btns"><button class="btn ok" id="snd" disabled>' + x.sendCentral + "</button></div>";
    OE.bind("bk", function () { OE.go("extra", -1); });
    OE.bind("sr", function () { mem.showRep = !mem.showRep; OE.render(1); });
    function draw(force) {
      $("snd").disabled = true;
      ensureTr(d, force).then(function (tr) {
        if (S.screen !== "preview") return;
        withTr(d);
        $("pv").innerHTML = dossierCard(d, S.lang, { all: true, tr: true }) + (tr.fail ? '<div class="err" id="trerr">⚠️ ' + x.trerr + '</div><button class="small" id="retr">' + x.retr + "</button>" : "");
        if (mem.showRep) $("rep").innerHTML = '<pre id="out">' + esc(OE.dossierText(d)) + "</pre>";
        OE.bind("retr", function () { draw(true); });
        $("snd").disabled = false;
      });
    }
    draw(false);
    OE.bind("snd", function () {
      var b = $("snd"); b.disabled = true; b.textContent = x.sending; OE.err("");
      OE.uploadPending(S).then(function () { return OE.api.putDossier(S.wo, S.dossier, withTr(OE.draftDossier())); })
        .then(function (r) { S.lastSent = { wo: S.wo, dossier: S.dossier, over: !!(r && r.overwritten) }; mem.final = null; OE.go("sent"); },
          function (e) { b.disabled = false; b.textContent = x.sendCentral; OE.err(x.sendErr + " (" + (e && e.message || e) + ")"); });
    });
  };

  /* ---------- 7. after sending ---------- */
  OE.closeApp = function () {
    var S = OE.S; OE.blankDraft(S); S.wo = ""; S.woIsNew = false; S.woNewTxt = ""; S.screen = "mode"; mem.final = null; mem.woList = null;
    OE.save(); OE.render(1); OE.openGo();
  };
  SC.sent = function () {
    var S = OE.S, x = OE.t(), ls = S.lastSent || { wo: S.wo, dossier: S.dossier };
    $("card").innerHTML = '<div class="check">✓</div><h2 class="q center">' + x.sentH + '</h2><p class="center hint">' + esc(OE.fmt(x.sentP, { d: ls.dossier, w: ls.wo })) + (ls.over ? "<br>" + x.sentOver : "") + "</p>" +
      '<div class="stack"><button class="btn pri" id="nd">＋ ' + x.newDossier + '</button><button class="btn sec" id="fin">📄 ' + x.finalBtn + '</button><button class="btn sec" id="cl">' + x.closeApp + "</button></div>";
    OE.bind("nd", function () { var wo = S.wo, m = S.mode; OE.blankDraft(S); S.wo = wo; S.mode = m; S.woIsNew = false; OE.go("wo"); });
    OE.bind("cl", OE.closeApp);
    OE.bind("fin", function () { mem.final = null; OE.go("final"); });
  };

  /* ---------- 8. Eindverslag WO ---------- */
  function loadFinal() {
    var S = OE.S, wo = S.wo; mem.final = "loading"; mem.finalErr = ""; mem.pdf = null; mem.pdfBlob = null; mem.finalMsg = "";
    OE.api.getWO(wo).then(function (w) {
      mem.final = w; mem.summary = OE.buildSummary(w.dossiers);
      // Pre-build the PDF while the user reviews, so the send tap only has to upload it.
      if (w.dossiers.length) mem.pdf = buildFinalPdf(w);
    }, function (e) { mem.final = null; mem.finalErr = String(e && e.message || e); })
      .then(function () { if (S.screen === "final" && S.wo === wo) OE.render(1); });
  }
  function fillTr(w) {
    // Dossiers without (good) translation are translated now.
    return w.dossiers.reduce(function (pr, d) {
      if (d.tr && !d.tr.fail) return pr;
      return pr.then(function () {
        var to = OE.other(d.lang);
        return OE.translate(d.lang, to, d.answers.map(function (a) { return a.text; }).concat([d.extra || ""])).then(function (r) {
          d.tr = { from: d.lang, to: to, engine: r.engine, fail: r.fail, answers: r.items.slice(0, Q.length), extra: r.items[Q.length] };
        });
      });
    }, Promise.resolve());
  }
  function buildFinalPdf(w) {
    return fillTr(w).then(function () { return OE.buildPdf(w.wo, w.dossiers); }).then(function (b) { mem.pdfBlob = b; return b; });
  }
  OE.buildFinalPdf = buildFinalPdf;
  SC.final = function () {
    var S = OE.S, x = OE.t();
    if (mem.final === null && !mem.finalErr) loadFinal();
    var w = mem.final, html = '<h2 class="q" style="margin-bottom:6px">' + x.finalH + " " + esc(S.wo) + "</h2>";
    if (mem.finalErr) html += '<div class="err">' + esc(x.sendErr + " (" + mem.finalErr + ")") + '</div><button class="small" id="rl">' + x.woReload + "</button>";
    else if (!w || w === "loading") html += '<div class="load"><div class="spin"></div>' + x.finalLoading + "</div>";
    else if (!w.dossiers.length) html += '<p class="hint">' + x.finalNone + "</p>";
    else html += '<p class="hint" style="margin:0">' + esc(OE.fmt(x.dossiersIn, { w: S.wo })) + ": " + w.dossiers.length + "</p>" +
      w.dossiers.map(function (d) { return dossierCard(d, S.lang, { all: false, edit: true }); }).join("");
    html += '<div id="err"></div><div id="msg">' + (mem.finalMsg || "") + "</div>" +
      '<div class="btns"><button class="btn sec" id="bk">‹ ' + x.back + '</button><button class="btn ok" id="snd"' + (w && w.dossiers && w.dossiers.length ? "" : " disabled") + ">" + x.finalSend + "</button></div>" +
      '<div class="btns"><button class="btn sec" id="nd">＋ ' + x.newDossier + '</button><button class="btn sec" id="cl">' + x.closeApp + "</button></div>";
    $("card").innerHTML = html;
    OE.bind("rl", function () { mem.final = null; mem.finalErr = ""; OE.render(1); });
    OE.bind("bk", function () { OE.go(S.lastSent && S.lastSent.wo === S.wo ? "sent" : "wo", -1); });
    OE.bind("nd", function () { var wo = S.wo, m = S.mode; OE.blankDraft(S); S.wo = wo; S.mode = m; S.woIsNew = false; OE.go("wo"); });
    OE.bind("cl", OE.closeApp);
    [].forEach.call($("card").querySelectorAll("[data-edit]"), function (b) { b.onclick = function () { editDossier(b.dataset.edit); }; });
    OE.bind("snd", function () { OE.confirmModal(x.finalConfirm, sendFinal); });
    bindFinalMsg();
  };
  function bindFinalMsg() {
    OE.bind("rsc", function () { OE.copyText(mem.summary); OE.runShortcut(OE.S.wo); });
    OE.bind("pdl", function () { if (mem.pdfBlob) OE.shareOrDownload(mem.pdfBlob, "OC_" + OE.S.wo + ".pdf"); });
    OE.bind("cpy", function () { OE.copyText(mem.summary); });
  }
  function sendFinal() {
    var S = OE.S, x = OE.t(), wo = S.wo, w = mem.final;
    // B) copy the summary inside the tap, BEFORE anything async / opening the Shortcut.
    var copied = OE.copyText(mem.summary);
    $("snd").disabled = true;
    $("msg").innerHTML = '<div class="load"><div class="spin"></div>' + x.pdfBusy + "</div>";
    // A) PDF -> upload -> Shortcut
    (mem.pdf || (mem.pdf = buildFinalPdf(w))).then(function (blob) { return OE.api.putPdf(wo, blob); })
      .then(function () {
        return copied.then(function (ok) {
          mem.finalMsg = '<div class="okmsg" id="pdfok">✓ ' + esc(x.pdfOk) + "</div>" + (ok ? "" : '<div class="err">' + esc(x.copyFail) + "</div>") +
            '<div class="stack"><button class="btn sec" id="rsc">' + x.runShortcut + '</button><button class="btn sec" id="pdl">' + x.pdfDl + '</button><button class="btn sec" id="cpy">' + x.copyAgain + "</button></div>";
          if (S.screen === "final") { $("msg").innerHTML = mem.finalMsg; $("snd").disabled = false; bindFinalMsg(); }
          OE.runShortcut(wo);
        });
      }, function (e) {
        mem.pdf = null; $("snd").disabled = false;
        $("msg").innerHTML = '<div class="err">' + esc(x.pdfErr + " (" + (e && e.message || e) + ")") + "</div>" +
          (mem.pdfBlob ? '<div class="stack"><button class="btn sec" id="pdl">' + x.pdfDl + "</button></div>" : "");
        bindFinalMsg();
      });
  }
  function editDossier(dn) {
    var S = OE.S, d = mem.final.dossiers.filter(function (z) { return z.dossier === dn; })[0]; if (!d) return;
    var maxN = 0;
    S.dossier = d.dossier; S.extra = d.extra || ""; S.tr = null; S.step = 0;
    S.answers = d.answers.map(function (a) {
      (a.photos || []).forEach(function (n) { var m = /_(\d+)\.jpg$/.exec(n); if (m) maxN = Math.max(maxN, +m[1]); });
      return { ok: !!a.ok, text: a.text || "", photos: (a.photos || []).map(function (n) { return { name: n, up: true }; }) };
    });
    S.photoSeq = maxN; S.editing = { tech: d.tech, mode: d.mode, lang: d.lang, createdAt: d.firstCreatedAt || d.createdAt };
    OE.go("q");
  }
})(window.OE);
