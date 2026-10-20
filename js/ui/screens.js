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

  /* "1. Installeer de opdracht": the right link for this iPhone/iPad; desktop/Android show both (labelled). */
  function instButtons(x) {
    var k = OE.deviceKind();
    function a(id, kind, label) { return '<a class="btn sec" id="' + id + '" href="' + esc(OE.shortcutInstall(kind)) + '" target="_blank" rel="noopener">⬇ ' + esc(label) + "</a>"; }
    if (k !== "other") return '<div class="btns">' + a("inst", k, x.techInstall) + "</div>";
    return '<div class="stack">' + a("inst", "iphone", x.techInstallFor.replace("{dev}", "iPhone")) + a("insti", "ipad", x.techInstallFor.replace("{dev}", "iPad")) + "</div>";
  }

  /* ---------- 2. technician (once, editable via settings) ---------- */
  SC.tech = function () {
    var S = OE.S, x = OE.t(), first = !(S.tech.first && S.tech.last);
    $("card").innerHTML = '<h2 class="q">' + x.techH + '</h2><p class="hint" style="margin-top:-8px">' + x.techP + "</p>" +
      '<label class="lbl" for="fn">' + x.first + '</label><input id="fn" autocomplete="given-name" autocapitalize="words" placeholder="' + esc(x.firstPh) + '">' +
      '<label class="lbl" for="lnm">' + x.last + '</label><input id="lnm" autocomplete="family-name" autocapitalize="words" placeholder="' + esc(x.lastPh) + '">' +
      '<p class="hint">' + x.initials + ': <b id="ini"></b></p><div id="err"></div>' +
      instButtons(x) +
      '<div class="btns">' + (first ? "" : '<button class="btn sec" id="bk">‹ ' + x.back + "</button>") +
      '<button class="btn pri" id="go">' + (first ? x.techStart : x.techSave) + "</button></div>" +
      (first ? '<p class="note">' + esc(OE.devText(x.techNote)) + "</p>" : '<button class="small" id="setup">' + esc(x.techStart) + "</button>");
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
      '<button class="btn ' + (S.mode === "multi" ? "sec" : "pri") + ' big" id="m1">1 toestel / 1 appareil<small>' + x.mode1s + "</small></button>" +
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
  /* Existing WO: search field + compact scrollable list (most recent first). After a tap the list collapses
     into a "selected" chip; "Wijzig" opens the search again. */
  function woMatches(w, q) {
    if (!q) return true;
    var n = w.wo.toLowerCase(), ql = q.toLowerCase();
    if (n.indexOf(ql) >= 0) return true;
    var qd = q.replace(/\D/g, "");
    return qd.length > 0 && qd === q.replace(/\s/g, "") && n.replace(/\D/g, "").indexOf(qd) >= 0; // digits only
  }
  function woMeta(w, x) {
    var p = [];
    if (w.n != null) p.push(w.n === 1 ? "1 dossier" : w.n + " " + x.dossiers);
    if (w.updated) p.push(new Date(w.updated).toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit" }));
    return p.join(" · ");
  }
  function woAll() {
    var S = OE.S, l = (mem.woList || []).slice().sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
    if (S.wo && !S.woIsNew && !l.some(function (w) { return w.wo === S.wo; })) l.unshift({ wo: S.wo });
    return l;
  }
  function drawWOList() {
    var S = OE.S, x = OE.t(), el = $("wol"); if (!el) return;
    var err = mem.woErr ? '<div class="err">' + x.woErr + "</div>" : "";
    var exists = S.woIsNew && woExists();
    if (!mem.woShow && !exists && !(S.wo && !S.woIsNew)) {
      el.innerHTML = err + '<button type="button" class="btn sec wosrch" id="wosb">' + x.woSearchBtn + "</button>";
      OE.bind("wosb", function () { mem.woShow = true; drawWOList(); var q = $("woq"); if (q) q.focus(); });
      return;
    }
    if (!mem.woList) { el.innerHTML = '<div class="load"><div class="spin"></div>' + x.woLoading + "</div>"; return; }
    if (S.wo && !S.woIsNew && !mem.woOpen) {
      var cur = woAll().filter(function (w) { return w.wo === S.wo; })[0] || { wo: S.wo };
      el.innerHTML = err + '<div class="wosel" id="wosel" data-wo="' + esc(S.wo) + '"><span>✓ <b>' + esc(S.wo) + "</b><small>" + esc(woMeta(cur, x)) + "</small></span>" +
        '<button id="woch" type="button">' + x.woChange + "</button></div>";
      OE.bind("woch", function () { mem.woOpen = true; drawWOList(); var q = $("woq"); if (q) q.focus(); });
      return;
    }
    if (exists) mem.woQ = OE.CFG.WO_PREFIX + OE.normId(S.woNewTxt).replace(/^WO-/i, "");
    el.innerHTML = err + (exists ? '<div class="err" id="woexists">ℹ️ ' + esc(x.woExistsHint) + "</div>" : "") + '<input id="woq" type="search" inputmode="search" autocomplete="off" autocapitalize="characters" placeholder="' + esc(x.woSearch) + '">' +
      '<div class="wolist" id="wolist" role="listbox"></div><button class="small" id="rl" style="margin:0">' + x.woReload + "</button>" +
      (exists ? "" : '<button class="small" id="woh" style="margin:0 0 0 8px">' + x.woSearchHide + "</button>");
    OE.bind("woh", function () { mem.woShow = false; mem.woQ = ""; drawWOList(); });
    var q = $("woq"); q.value = mem.woQ || "";
    q.oninput = function () { mem.woQ = q.value; drawItems(); };
    q.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); var f = $("wolist").querySelector("[data-wo]"); if (f) f.click(); } };
    OE.bind("rl", loadWOs);
    drawItems();
  }
  function drawItems() {
    var S = OE.S, x = OE.t(), box = $("wolist"); if (!box) return;
    var all = woAll(), q = (mem.woQ || "").trim(), l = all.filter(function (w) { return woMatches(w, q); });
    if (!all.length) { box.innerHTML = '<p class="hint wohint">' + x.woNoneYet + "</p>"; return; }
    if (!l.length) { box.innerHTML = '<p class="hint wohint">' + x.woNotFound + "</p>"; return; }
    box.innerHTML = l.slice(0, 300).map(function (w) {
      var on = w.wo === S.wo && !S.woIsNew;
      return '<button type="button" role="option" aria-selected="' + on + '" data-wo="' + esc(w.wo) + '" class="' + (on ? "on" : "") + '"><b>' + esc(w.wo) + "</b><small>" + esc(woMeta(w, x)) + "</small></button>";
    }).join("");
    [].forEach.call(box.querySelectorAll("[data-wo]"), function (b) {
      b.onclick = function () { mem.woShow = false; S.wo = b.dataset.wo; S.woIsNew = false; S.woNewTxt = ""; $("won").value = ""; mem.woOpen = false; mem.woQ = ""; OE.save(); drawWOList(); finalBtn(); };
    });
  }
  function woExists() {
    var w = (OE.CFG.WO_PREFIX + OE.normId(OE.S.woNewTxt || "").replace(/^WO-/i, "")).toUpperCase();
    return (mem.woList || []).some(function (z) { return z.wo.toUpperCase() === w; });
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
      won.value = won.value.replace(/^\s*WO-?/i, "");
      S.woNewTxt = won.value; S.woIsNew = !!won.value; if (S.woIsNew) S.wo = ""; OE.save(); drawWOList(); finalBtn();
    };
    dn.oninput = function () { S.dossier = dn.value; OE.save(); OE.fit(dn); };
    // spaces become "_" when leaving the field (and on Volgende); a pasted trailing newline is trimmed
    won.onblur = function () { won.value = OE.normId(won.value).replace(/^WO-/i, ""); S.woNewTxt = won.value; S.woIsNew = !!won.value; OE.save(); };
    dn.onblur = function () { dn.value = OE.normId(dn.value); S.dossier = dn.value; OE.save(); OE.fit(dn); };
    dn.onkeydown = function (e) { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); next(); } };
    drawWOList(); if (!mem.woList) loadWOs(); finalBtn();
    OE.bind("bk", function () { OE.go("mode", -1); });
    OE.bind("fin", function () { mem.final = null; OE.go("final"); });
    OE.bind("nx", next);
    function next() {
      S.woNewTxt = OE.normId(S.woNewTxt).replace(/^WO-/i, ""); won.value = S.woNewTxt;
      S.dossier = OE.normId(S.dossier); dn.value = S.dossier;
      var wo = S.woIsNew ? OE.CFG.WO_PREFIX + (S.woNewTxt || "") : S.wo;
      if (!wo || wo === OE.CFG.WO_PREFIX) return OE.err(x.needWo);
      if (wo.length > 100) return OE.err(x.woInvalid);
      if (!S.dossier.trim()) return OE.err(x.needDossier);
      if (S.dossier.length > 100) return OE.err(x.dnInvalid);
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
      return '<figure><img src="' + esc(p.data || OE.api.photoUrl(OE.S.wo, p.name)) + '" alt=""><button class="del" data-k="' + k + '" type="button" aria-label="' + esc(OE.t().photoDel) + '">×</button><figcaption>' + esc(p.name) + (p.up ? " ✓" : "") + (p.desc ? '<span class="pd">' + esc(p.desc) + "</span>" : "") + "</figcaption></figure>";
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
    [].forEach.call($("card").querySelectorAll(".del"), function (b) { b.onclick = function () { OE.confirmModal(x.photoDelAsk, function () { a.photos.splice(+b.dataset.k, 1); OE.save(); OE.render(1); }); }; });
    ["cam", "lib"].forEach(function (id) { var f = $(id); if (f) f.onchange = function () { addPhotos(a, [].slice.call(f.files || [])); }; });
    OE.bind("bk", function () { if (i === 0) OE.go(S.editing ? "final" : "wo", -1); else { S.step--; OE.go("q", -1); } });
    OE.bind("nx", function () {
      if (!a.ok && (q.kind === "text" || q.desc) && !a.text.trim()) return OE.err(x.needText);
      if (!a.ok && q.photo && !a.photos.length) return OE.err(x.photoNeed);
      if (i < N - 1) { S.step++; OE.go("q"); } else OE.go("extra");
    });
  };
  /* Every chosen photo (camera or library) first goes through the annotation editor + optional description
     (js/annot.js). Cancel = this photo is not added. Only the annotated JPEG is kept. */
  function addPhotos(a, files) {
    var S = OE.S;
    files.reduce(function (pr, f) {
      return pr.then(function () {
        return OE.annotate(f).then(function (r) {
          if (!r) return;
          var data = r.data, p = { name: OE.photoName(S.wo, S.dossier, ++S.photoSeq), data: data, up: false };
          if (r.desc) p.desc = r.desc;
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
        var keepPh = !a.ok && q.photo, r = { ok: !!a.ok, text: keepText ? a.text.trim() : "", photos: keepPh ? a.photos.map(function (p) { return p.name; }) : [] };
        if (keepPh) a.photos.forEach(function (p) { var t = String(p.desc || "").trim(); if (t) (r.photoDesc = r.photoDesc || {})[p.name] = t; });
        return r;
      }),
      extra: S.extra.trim(),
      texts: Q.map(function (q, i) { return { nl: q.nl, fr: q.fr, fixed: q.fixed || null, revisit: q.kind === "revisit" ? OE.REVISIT : null }; })
    };
    if (ed) { d.editedBy = { first: S.tech.first, last: S.tech.last, initials: OE.initials(S.tech.first, S.tech.last) }; d.firstCreatedAt = ed.createdAt; }
    return d;
  };
  function srcKey(d) { return JSON.stringify([d.lang, d.answers.map(function (a) { return a.text; }), d.extra, OE.descList(d)]); }
  function ensureTr(d, force) {
    var S = OE.S, k = srcKey(d);
    if (!force && S.tr && S.tr.key === k) return Promise.resolve(S.tr);
    var to = OE.other(d.lang);
    return OE.translate(d.lang, to, OE.trSource(d)).then(function (r) {
      S.tr = OE.trFromResult(d, to, r); S.tr.key = k;
      OE.save(); return S.tr;
    });
  }
  function withTr(d) { var t = OE.S.tr; if (t) d.tr = { from: t.from, to: t.to, engine: t.engine, fail: t.fail, answers: t.answers, extra: t.extra, photoDesc: t.photoDesc || {} }; return d; }

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
          (r.photos.length ? "<em>📷 " + esc(r.photos.join(", ")) + "</em>" : "") +
          r.photos.map(function (n, k) {
            var pd = r.pd[k], o = other && other.pd[k]; if (!pd.t.trim()) return "";
            return '<em class="pdesc">📷 ' + esc(n) + ": " + esc(pd.t) + "</em>" + (o && (o.tr || pd.tr) ? '<em class="tr">→ ' + esc(o.t) + "</em>" : "");
          }).join("") + "</li>";
      }).join("") +
      (d.extra ? "<li>" + x.extra + ": <em>" + esc(OE.freeText(d, "extra", L).t) + "</em>" + (opts.tr ? '<em class="tr">→ ' + esc(OE.freeText(d, "extra", O).t) + "</em>" : "") + "</li>" : "") +
      "</ul>" + (opts.edit ? '<button class="edit" data-edit="' + esc(d.dossier) + '">✎ ' + x.edit + "</button>" : "") + "</div>";
  }

  /* ---------- 6b. preview + send ---------- */
  SC.preview = function () {
    var S = OE.S, x = OE.t(), d = OE.draftDossier();
    $("card").innerHTML = '<h2 class="q" style="margin-bottom:6px">' + x.prevH + '</h2><p class="hint" style="margin:0 0 6px">' + esc(S.wo) + " · " + esc(d.tech.first + " " + d.tech.last) + (S.editing ? " · " + x.editing : "") + "</p>" +
      '<div id="pv"><div class="load"><div class="spin"></div>' + x.translating + "</div></div><div id=\"rep\"></div><div id=\"err\"></div>" +
      '<button class="small" id="sr">' + (mem.showRep ? x.hideReport : x.showReport) + "</button>" +
      (S.editing
        ? '<div class="btns"><button class="btn sec" id="bk">‹ ' + x.back + '</button><button class="btn ok" id="pvf" disabled>💾 ' + x.saveToFinal + "</button></div>"
        : '<div class="btns"><button class="btn sec" id="bk">‹ ' + x.back + '</button><button class="btn ok" id="snd" disabled>✓ ' + x.sendInterim + "</button></div>" +
          '<div class="btns"><button class="btn pri" id="pvf" disabled>📄 ' + x.finalBtn + "</button></div>") +
      '<button class="lnk" id="cl">' + x.closeApp + "</button>";
    OE.bind("bk", function () { OE.go("extra", -1); });
    OE.bind("sr", function () { mem.showRep = !mem.showRep; OE.render(1); });
    OE.bind("cl", OE.closeApp);
    function en(v) { ["snd", "pvf"].forEach(function (id) { var b = $(id); if (b) b.disabled = !v; }); }
    function draw(force) {
      en(false);
      ensureTr(d, force).then(function (tr) {
        if (S.screen !== "preview") return;
        withTr(d);
        $("pv").innerHTML = dossierCard(d, S.lang, { all: true, tr: true }) + (tr.fail ? '<div class="err" id="trerr">⚠️ ' + x.trerr + '</div><button class="small" id="retr">' + x.retr + "</button>" : "");
        if (mem.showRep) $("rep").innerHTML = '<pre id="out">' + esc(OE.dossierText(d)) + "</pre>";
        OE.bind("retr", function () { draw(true); });
        en(true);
      });
    }
    draw(false);
    // Queue the door in the persistent outbox (survives reloads / no network). Returns false when storage is full.
    function queue() {
      var d = withTr(OE.draftDossier()), photos = [];
      S.answers.forEach(function (a) { a.photos.forEach(function (p) { if (!p.up && p.data) photos.push({ name: p.name, data: p.data, up: false }); }); });
      try { OE.outbox.add(d, photos); } catch (e) { OE.err(x.storeFull); return false; }
      S.lastSent = { wo: S.wo, dossier: S.dossier, over: false, done: false };
      mem.recent = (mem.recent || []).filter(function (r) { return !(r.wo === S.wo && r.dn === S.dossier); }).concat([{ wo: S.wo, dn: S.dossier, d: JSON.parse(JSON.stringify(d)), at: Date.now() }]);
      S.answers.forEach(function (a) { a.photos.forEach(function (p) { if (p.data) { delete p.data; p.up = true; } }); }); // data now lives in the outbox
      return true;
    }
    // Verstuur tussenverslag: queue, open ServiceMax Go inside this tap (iOS), upload in the background.
    OE.bind("snd", function () {
      if (!queue()) return;
      mem.final = null; S.screen = "sent"; OE.save(); OE.render(1);
      OE.openGo();
      OE.outbox.flush();
    });
    // Preview eindverslag / Opslaan › eindverslag: the door is queued FIRST (so it can't be lost), the draft is closed,
    // and the final screen waits for the outbox before reading the server.
    OE.bind("pvf", function () {
      if (!queue()) return;
      var wo = S.wo, m = S.mode; OE.blankDraft(S); S.wo = wo; S.mode = m; S.woIsNew = false;
      mem.final = null; OE.save(); OE.outbox.flush(); OE.go("final");
    });
  };

  /* ---------- 7. after sending ---------- */
  // Exception only (small grey link): leave without saving/sending the current draft. Already queued doors keep uploading.
  OE.closeApp = function () {
    OE.confirmModal(OE.t().closeAsk, function () {
      var S = OE.S; OE.blankDraft(S); S.wo = ""; S.woIsNew = false; S.woNewTxt = ""; S.screen = "mode"; S.lastSent = null; mem.final = null; mem.woList = null;
      OE.save(); OE.render(1);
    });
  };
  SC.sent = function () {
    var S = OE.S, x = OE.t(), ls = S.lastSent || { wo: S.wo, dossier: S.dossier };
    $("card").innerHTML = '<div class="check">✓</div><h2 class="q center">' + x.sentH + '</h2><p class="center hint">' + esc(OE.fmt(x.sentP, { d: ls.dossier, w: ls.wo })) + "</p>" +
      '<p class="center" id="sst">' + (OE.outbox.isPending(ls.wo, ls.dossier) ? '<span class="badge r">⏳ ' + x.sentWait + "</span>" : '<span class="badge g">' + x.sentDone + "</span>" + (ls.over ? '<br><small class="hint">' + x.sentOver + "</small>" : "")) + "</p>" +
      (ls.stale ? '<div class="err" id="sentstale">⚠️ ' + esc(x.sentStale) + "</div>" : "") +
      '<div class="stack"><button class="btn pri" id="nd">＋ ' + x.newDossier + '</button><button class="btn sec" id="fin">📄 ' + x.finalBtn + "</button></div>" +
      '<button class="lnk" id="cl">' + x.closeApp + "</button>";
    OE.bind("nd", function () { var wo = S.wo, m = S.mode; OE.blankDraft(S); S.wo = wo; S.mode = m; S.woIsNew = false; OE.go("wo"); });
    OE.bind("cl", OE.closeApp);
    OE.bind("fin", function () { mem.final = null; OE.go("final"); });
  };

  /* ---------- 8. Eindverslag WO ---------- */
  function loadFinal() {
    var S = OE.S, wo = S.wo; mem.final = "loading"; mem.finalErr = ""; mem.pdf = null; mem.pdfBlob = null; mem.finalMsg = ""; mem.lastPend = OE.outbox.pending(wo).length;
    if (mem.finalWo !== wo) { mem.finalWo = wo; mem.allIn = false; mem.sgn = null; }
    waitOutbox(wo, 8).then(function () { return getWOFresh(wo); }).then(function (w) {
      mem.final = w; mem.summary = OE.buildSummary(w.dossiers, w.wo, w.signer || "");
      // Pre-build the PDF while the user reviews, so the send tap only has to upload it.
      if (w.dossiers.length) mem.pdf = buildFinalPdf(w);
    }, function (e) { mem.final = null; mem.finalErr = String(e && e.message || e); })
      .then(function () { if (S.screen === "final" && S.wo === wo) OE.render(1); });
  }
  // Wait (max ~n s) until this device's queued doors of this WO are on the server.
  function waitOutbox(wo, n) {
    if (!OE.outbox.pending(wo).length || n <= 0) return Promise.resolve();
    return OE.outbox.flush().then(function () {
      if (!OE.outbox.pending(wo).length) return;
      return new Promise(function (res) { setTimeout(res, 1000); }).then(function () { return waitOutbox(wo, n - 1); });
    });
  }
  // GET /wo + the doors this device just sent (the server's door list can lag up to ~1 min after a PUT).
  function getWOFresh(wo) {
    return OE.api.getWO(wo).then(function (w) {
      var rec = (mem.recent || []).filter(function (r) { return r.wo === wo && Date.now() - r.at < 180000; });
      var miss = rec.filter(function (r) { return !w.dossiers.some(function (d) { return d.dossier === r.dn; }); });
      return Promise.all(miss.map(function (r) { return OE.api.getDossier(wo, r.dn).catch(function () { return null; }); })).then(function (ds) {
        ds.forEach(function (d) { if (d) w.dossiers.push(d); });
        // A door sent/edited on this device in the last 3 min: if the server copy is missing or older, show the local copy.
        rec.forEach(function (r) {
          var k = -1; w.dossiers.forEach(function (d, i) { if (d.dossier === r.dn) k = i; });
          var srv = k >= 0 ? w.dossiers[k] : null;
          if (!srv || (srv.receivedAt || 0) < r.at - 120000 || OE.outbox.isPending(wo, r.dn)) {
            var loc = JSON.parse(JSON.stringify(r.d)); loc._local = true; loc.receivedAt = srv ? srv.receivedAt : 0; loc.firstReceivedAt = srv ? srv.firstReceivedAt : r.at;
            if (k >= 0) w.dossiers[k] = loc; else w.dossiers.push(loc);
          }
        });
        return w;
      });
    });
  }
  function fillTr(w) {
    // Dossiers without (good) translation are translated now.
    return w.dossiers.reduce(function (pr, d) {
      if (OE.trComplete(d)) return pr;
      return pr.then(function () {
        var to = OE.other(d.lang);
        return OE.translate(d.lang, to, OE.trSource(d)).then(function (r) {
          d.tr = OE.trFromResult(d, to, r);
        });
      });
    }, Promise.resolve());
  }
  function buildFinalPdf(w) {
    return fillTr(w).then(function () { return OE.buildPdf(w.wo, w.dossiers, null, w.signer || ""); }).then(function (b) { mem.pdfBlob = b; return b; });
  }
  OE.buildFinalPdf = buildFinalPdf;
  SC.final = function () {
    var S = OE.S, x = OE.t();
    if (mem.final === null && !mem.finalErr) loadFinal();
    var w = mem.final, html = '<h2 class="q" style="margin-bottom:6px">' + x.finalH + " " + esc(S.wo) + "</h2>";
    if (mem.finalErr) html += '<div class="err">' + esc(x.sendErr + " (" + mem.finalErr + ")") + '</div><button class="small" id="rl">' + x.woReload + "</button>";
    else if (!w || w === "loading") html += '<div class="load"><div class="spin"></div>' + x.finalLoading + "</div>";
    else if (!w.dossiers.length) html += '<p class="hint">' + x.finalNone + "</p>";
    var nOut = OE.outbox.pending(S.wo).length;
    if (nOut) html += '<div class="err" id="obxwarn">⚠️ ' + esc(OE.fmt(x.finalOutbox, { n: nOut })) + "</div>";
    if (mem.finalErr || !w || w === "loading" || !w.dossiers.length) {}
    else html += '<p class="hint" style="margin:0">' + esc(OE.fmt(x.dossiersIn, { w: S.wo })) + ": " + w.dossiers.length + "</p>" +
      '<p class="okmsg" id="fincount" style="margin:6px 0">' + esc(OE.fmt(x.finalCount, { n: w.dossiers.length })) + "</p>" +
      (finalStale(w) ? '<div class="err" id="finstale">⚠️ ' + esc(x.finalStale) + "</div>" : "") +
      w.dossiers.map(function (d) { return dossierCard(d, S.lang, { all: false, edit: true }); }).join("");
    var has = w && w !== "loading" && w.dossiers && w.dossiers.length;
    if (has) html += '<div class="fsig"><label class="lbl" for="sgn">' + x.sgnLbl + '</label><input id="sgn" autocomplete="off" autocapitalize="words" placeholder="' + esc(x.signerPh) + '">' +
      '<p class="hint" style="margin-top:4px">' + x.sgnHint + "</p>" +
      '<label class="lbl">' + x.allInQ + '</label><label class="chkq" for="allin"><input type="checkbox" id="allin"' + (mem.allIn ? " checked" : "") + "><span>" + x.allInYes + "</span></label></div>";
    html += '<div id="err"></div><div id="msg">' + (mem.finalMsg || "") + "</div>" +
      '<div class="btns"><button class="btn sec" id="bk">‹ ' + x.back + '</button><button class="btn ok" id="snd"' + (has ? "" : " disabled") + ">" + x.finalSend + "</button></div>" +
      '<div class="btns"><button class="btn sec" id="nd">＋ ' + x.newDossier + "</button></div>" +
      '<button class="lnk" id="cl">' + x.closeApp + "</button>";
    $("card").innerHTML = html;
    var sgn = $("sgn");
    if (sgn) { sgn.value = mem.sgn != null ? mem.sgn : (w.signer || ""); sgn.oninput = function () { mem.sgn = sgn.value; }; }
    var ai = $("allin"); if (ai) ai.onchange = function () { mem.allIn = ai.checked; };
    OE.bind("rl", function () { mem.final = null; mem.finalErr = ""; OE.render(1); });
    OE.bind("bk", function () { OE.go(S.lastSent && S.lastSent.wo === S.wo ? "sent" : "wo", -1); });
    OE.bind("nd", function () { var wo = S.wo, m = S.mode; OE.blankDraft(S); S.wo = wo; S.mode = m; S.woIsNew = false; OE.go("wo"); });
    OE.bind("cl", OE.closeApp);
    [].forEach.call($("card").querySelectorAll("[data-edit]"), function (b) { b.onclick = function () { editDossier(b.dataset.edit); }; });
    // send -> signer popup (mandatory, prefilled) -> confirm popup -> generate (copy happens in the confirm tap)
    OE.bind("snd", function () {
      if (!sgn || !String(sgn.value || "").trim() || sgn.value.length > 200) { OE.err(x.signerNeed); sgn && sgn.focus(); return; }
      if (!ai.checked) { OE.err(x.allInNeed); return; }
      $("err").innerHTML = "";
      // Always re-read the server state first: another technician may have sent a door meanwhile.
      var old = mem.final, b = $("snd"); b.disabled = true;
      $("msg").innerHTML = '<div class="load"><div class="spin"></div>' + x.finalChecking + "</div>";
      getWOFresh(S.wo).then(function (w) {
        b.disabled = false; $("msg").innerHTML = "";
        if (!old || old === "loading" || !sameState(w, old)) {
          if (old && old.signer && !w.signer) w.signer = old.signer;
          mem.final = w; mem.summary = OE.buildSummary(w.dossiers, w.wo, w.signer || ""); mem.pdf = w.dossiers.length ? buildFinalPdf(w) : null;
          mem.finalMsg = '<div class="err" id="finchanged">⚠️ ' + esc(OE.fmt(x.finalChanged, { n: w.dossiers.length })) + "</div>";
          OE.render(1); return;
        }
        mem.final.pdfAt = w.pdfAt; finish();
      }, function (e) { b.disabled = false; $("msg").innerHTML = '<div class="err">' + esc(x.sendErr + " (" + (e && e.message || e) + ")") + "</div>"; });
    });
    // signer (name only) + "all reports in?" are on the page itself; then PDF -> upload -> '▶ Bewaar PDF'.
    function finish() {
      var w = mem.final, signer = OE.normSpace ? OE.normSpace(sgn.value) : String(sgn.value || "").replace(/\s+/g, " ").trim();
      w.signer = signer; mem.pdf = buildFinalPdf(w);
      mem.summary = OE.buildSummary(w.dossiers, w.wo, signer);
      mem.signerSave = OE.api.setSigner(w.wo, signer);
      sendFinal();
    }
    bindFinalMsg();
  };
  function sig(w) { return w && w.dossiers ? w.dossiers.map(function (d) { return d.dossier; }).sort().join("|") : ""; }
  function sameState(a, b) {
    if (sig(a) !== sig(b)) return false;
    return a.dossiers.every(function (d) { var e = b.dossiers.filter(function (z) { return z.dossier === d.dossier; })[0]; return d._local || e._local || (d.receivedAt || 0) === (e.receivedAt || 0); });
  }
  function finalStale(w) { return !!(w && w.pdfAt && w.dossiers.some(function (d) { return (d.firstReceivedAt || d.receivedAt || 0) > w.pdfAt; })); }
  function bindFinalMsg() {
    OE.bind("rsc", function () { OE.copyText(mem.summary); OE.runShortcut(OE.S.wo); });
    OE.bind("pdl", function () { if (mem.pdfBlob) OE.shareOrDownload(mem.pdfBlob, OE.safeFile("OC_" + OE.S.wo + ".pdf")); });
    OE.bind("cpy", function () { OE.copyText(mem.summary); });
  }
  function sendFinal() {
    var S = OE.S, x = OE.t(), wo = S.wo, w = mem.final;
    // B) copy the summary inside the tap, BEFORE anything async / opening the Shortcut.
    var copied = OE.copyText(mem.summary);
    $("snd").disabled = true;
    $("msg").innerHTML = '<div class="load"><div class="spin"></div>' + x.pdfBusy + "</div>";
    // A) PDF -> upload -> Shortcut
    Promise.all([mem.pdf || (mem.pdf = buildFinalPdf(w)), mem.signerSave]).then(function (r) { return OE.api.putPdf(wo, r[0]); })
      .then(function (pr) {
        if (mem.final && mem.final.dossiers) mem.final.pdfAt = (pr && pr.pdfAt) || Date.now();
        var st = $("finstale"); if (st) st.remove();
        return copied.then(function (ok) {
          mem.finalMsg = '<div class="okmsg" id="pdfok">✓ ' + esc(x.pdfOk) + "</div>" + (ok ? "" : '<div class="err">' + esc(x.copyFail) + "</div>") +
            '<p class="hint" id="pdfnext">' + esc(x.pdfNext) + "</p>" +
            '<div class="stack"><button class="btn pri" id="rsc">' + x.runShortcut + '</button><button class="btn sec" id="pdl">' + x.pdfDl + '</button><button class="btn sec" id="cpy">' + x.copyAgain + "</button></div>";
          if (S.screen === "final") { $("msg").innerHTML = mem.finalMsg; $("snd").disabled = false; bindFinalMsg(); }
          // No automatic OE.runShortcut here: after the async upload iOS may block it. The user taps #rsc.
          var r = $("rsc"); if (r && r.scrollIntoView) r.scrollIntoView({ block: "center", behavior: "smooth" });
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
      var pd = a.photoDesc || {};
      return { ok: !!a.ok, text: a.text || "", photos: (a.photos || []).map(function (n) { var p = { name: n, up: true }; if (pd[n]) p.desc = pd[n]; return p; }) };
    });
    S.photoSeq = maxN; S.editing = { tech: d.tech, mode: d.mode, lang: d.lang, createdAt: d.firstCreatedAt || d.createdAt };
    OE.go("q");
  }
})(window.OE);
