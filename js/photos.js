/* photos.js – client-side resize to ~1280px JPEG q0.7 and naming <WO>_<dossier>_<n>.jpg */
"use strict";
(function (OE) {
  OE.resizePhoto = function (file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var max = OE.CFG.PHOTO_MAX, w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, max / Math.max(w, h));
        var c = document.createElement("canvas"); c.width = Math.round(w * s); c.height = Math.round(h * s);
        var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", OE.CFG.PHOTO_Q));
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("image")); };
      img.src = url;
    });
  };
  OE.dataUrlToBlob = function (d) {
    var b = atob(d.split(",")[1]), u = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return new Blob([u], { type: "image/jpeg" });
  };
  // Only characters that break file names / paths are replaced; everything else (ü, (), ...) stays.
  OE.safeFile = function (s) { return String(s).replace(/[\s\/\\:*?"<>|\u0000-\u001F\u007F]/g, "_"); };
  OE.photoName = function (wo, dn, n) { return OE.safeFile(wo + "_" + dn + "_" + n + ".jpg"); };
  /* Upload every photo of the draft that is not on the server yet. */
  OE.uploadPending = function (S) {
    var list = [];
    S.answers.forEach(function (a) { a.photos.forEach(function (p) { if (!p.up && p.data) list.push(p); }); });
    return list.reduce(function (pr, p) {
      return pr.then(function () { return OE.api.putPhoto(S.wo, p.name, OE.dataUrlToBlob(p.data)).then(function () { p.up = true; delete p.data; OE.save(); }); });
    }, Promise.resolve());
  };
  OE.loadImage = function (url) {
    return fetch(url, { mode: "cors", credentials: "omit" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.blob(); })
      .then(function (b) { return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(b); }); })
      .then(function (d) { return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res({ data: d, w: i.naturalWidth, h: i.naturalHeight }); }; i.onerror = rej; i.src = d; }); });
  };
})(window.OE);
