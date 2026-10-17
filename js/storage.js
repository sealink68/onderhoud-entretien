/* storage.js – localStorage persistence of settings and the in-progress dossier. */
"use strict";
(function (OE) {
  var KEY = "oe_state_v1";
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  OE.ls = ls;
  OE.blankAnswers = function () { return OE.QUESTIONS.map(function () { return { ok: true, text: "", photos: [] }; }); };
  OE.blankDraft = function (S) {
    S.dossier = ""; S.answers = OE.blankAnswers(); S.extra = ""; S.photoSeq = 0; S.tr = null; S.editing = null; S.step = 0;
    return S;
  };
  OE.loadState = function () {
    var S = null; try { S = JSON.parse(ls(KEY) || "null"); } catch (e) { S = null; }
    if (!S || typeof S !== "object") S = {};
    S.lang = S.lang || null; S.tech = S.tech || { first: "", last: "" };
    S.mode = S.mode || null; S.screen = S.screen || "lang"; S.wo = S.wo || "";
    if (!Array.isArray(S.answers) || S.answers.length !== OE.QUESTIONS.length) { var w = S.wo, m = S.mode; OE.blankDraft(S); S.wo = w; S.mode = m; }
    S.step = +S.step || 0; S.extra = S.extra || ""; S.photoSeq = +S.photoSeq || 0;
    return S;
  };
  OE.save = function () {
    try { ls(KEY, JSON.stringify(OE.S)); }
    catch (e) { /* quota: drop un-uploaded photo data rather than lose the rest */ }
  };
})(window.OE);
