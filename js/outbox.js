/* outbox.js – persistent send queue (localStorage). "Verstuur" puts the dossier + un-uploaded photos here and
   opens ServiceMax Go in the same tap; uploads continue now and are retried on load / focus / visibilitychange /
   online / every 20 s until the server confirms. */
"use strict";
(function (OE) {
  var KEY = "oe_outbox_v1", busy = false, timer = null;
  function load() { try { var a = JSON.parse(OE.ls(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function store(a) { try { OE.ls(KEY, JSON.stringify(a)); return true; } catch (e) { return false; } }
  OE.outbox = {
    list: load,
    pending: function (wo) { return load().filter(function (e) { return !wo || e.wo === wo; }); },
    isPending: function (wo, dn) { return load().some(function (e) { return e.wo === wo && e.dossier === dn; }); },
    lastOk: 0, lastErr: "",
    /* Add/replace a dossier (same WO + dossier number overwrites the queued one). */
    add: function (d, photos) {
      var a = load().filter(function (e) { return !(e.wo === d.wo && e.dossier === d.dossier); });
      a.push({ wo: d.wo, dossier: d.dossier, d: d, photos: photos || [], at: Date.now(), tries: 0 });
      if (!store(a)) { // storage full: keep the dossier, drop already-uploaded photo data is all we can do
        throw new Error("storage");
      }
    },
    flush: function () {
      if (busy) return Promise.resolve();
      var a = load(); if (!a.length) return Promise.resolve();
      busy = true; OE.outbox.lastErr = "";
      return a.reduce(function (pr, e) {
        return pr.then(function () {
          return e.photos.reduce(function (pp, ph) {
            return pp.then(function () {
              if (ph.up) return;
              return OE.api.putPhoto(e.wo, ph.name, OE.dataUrlToBlob(ph.data)).then(function () {
                ph.up = true; delete ph.data;
                var cur = load(); cur.forEach(function (c) { if (c.wo === e.wo && c.dossier === e.dossier && c.at === e.at) c.photos = e.photos; }); store(cur);
              });
            });
          }, Promise.resolve()).then(function () { return OE.api.putDossier(e.wo, e.dossier, e.d); }).then(function (r) {
            // remove only this exact entry (a newer resubmit of the same dossier stays queued)
            store(load().filter(function (c) { return !(c.wo === e.wo && c.dossier === e.dossier && c.at === e.at); }));
            OE.outbox.lastOk = Date.now();
            var S = OE.S; if (S.lastSent && S.lastSent.wo === e.wo && S.lastSent.dossier === e.dossier) { S.lastSent.over = !!(r && r.overwritten); S.lastSent.stale = !!(r && r.staleFinal); S.lastSent.done = true; OE.save(); }
            if (OE.mem) OE.mem.final = OE.S.screen === "final" ? OE.mem.final : null;
          }, function (err) {
            e.tries++; OE.outbox.lastErr = String(err && err.message || err);
            var cur = load(); cur.forEach(function (c) { if (c.wo === e.wo && c.dossier === e.dossier && c.at === e.at) c.tries = e.tries; }); store(cur);
          });
        });
      }, Promise.resolve()).then(function () { busy = false; OE.outbox.changed(); }, function () { busy = false; OE.outbox.changed(); });
    },
    changed: function () {
      OE.outbox.status();
      if (typeof OE.onOutboxChange === "function") OE.onOutboxChange();
      if (load().length && !timer) timer = setInterval(function () { if (!load().length) { clearInterval(timer); timer = null; } else OE.outbox.flush(); }, 20000);
    },
    /* Small status line under the header. */
    status: function () {
      var el = document.getElementById("obx"); if (!el || !OE.S.lang) { if (el) el.hidden = true; return; }
      var n = load().length, x = OE.t();
      if (n) { el.hidden = false; el.className = "obx wait"; el.innerHTML = "⏳ " + OE.esc(OE.fmt(n === 1 ? x.obxOne : x.obxMany, { n: n })) + ' <button id="obxr">' + x.obxRetry + "</button>"; OE.bind("obxr", OE.outbox.flush); }
      else if (Date.now() - OE.outbox.lastOk < 120000) { el.hidden = false; el.className = "obx ok"; el.textContent = x.obxOk; }
      else el.hidden = true;
    }
  };
  function kick() { if (document.visibilityState !== "hidden") OE.outbox.flush(); }
  document.addEventListener("visibilitychange", kick);
  window.addEventListener("focus", kick);
  window.addEventListener("online", kick);
  window.addEventListener("pageshow", kick);
})(window.OE);
