/* platform.js – device detection, install tip, clipboard, ServiceMax Go, iOS Shortcut, file download/share. */
"use strict";
(function (OE) {
  OE.isStandalone = function () { if (navigator.standalone === true) return true; try { return window.matchMedia("(display-mode: standalone)").matches; } catch (e) { return false; } };
  OE.iosDevice = function () { var ua = navigator.userAgent || ""; if (/iPad|iPhone|iPod/.test(ua)) return true; return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1; };
  OE.mobileBrowser = function () { return OE.iosDevice() || /Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent || ""); };
  OE.updateTip = function () {
    var el = document.getElementById("tip"); if (!el) return;
    var until = +OE.ls("oe_tip_hide") || 0, show = !OE.isStandalone() && OE.mobileBrowser() && Date.now() >= until;
    el.hidden = !show; if (!show) return;
    var fr = OE.S.lang === "fr", ios = OE.iosDevice();
    document.getElementById("tiptext").textContent = fr
      ? (ios ? "Astuce : ajoutez cette app à votre écran d’accueil via Partager → Sur l’écran d’accueil." : "Astuce : ajoutez cette app à votre écran d’accueil via le menu (⋮) → Ajouter à l’écran d’accueil.")
      : (ios ? "Tip: zet deze app op je beginscherm via Deel → Zet op beginscherm." : "Tip: zet deze app op je beginscherm via het menu (⋮) → Toevoegen aan startscherm.");
    document.getElementById("tipx").setAttribute("aria-label", fr ? "Fermer" : "Sluiten");
  };
  /* Clipboard API with execCommand fallback (like Werkrapport). Call synchronously inside the tap. */
  OE.copyText = function (s) {
    function fb() {
      var ta = document.createElement("textarea"); ta.value = s; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.top = "-1000px";
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, s.length);
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {} document.body.removeChild(ta); return ok;
    }
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(s).then(function () { return true; }, function () { return fb(); });
    return Promise.resolve(fb());
  };
  function openBlank(url) {
    var w = null; try { w = window.open(url, "_blank"); } catch (e) { w = null; }
    if (w) return;
    var a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click(); setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 0);
  }
  OE.openGo = function () { openBlank(OE.CFG.GO); };
  OE.shortcutUrl = function (text) {
    return "shortcuts://run-shortcut?name=" + encodeURIComponent(OE.CFG.SHORTCUT) + (text != null ? "&input=text&text=" + encodeURIComponent(text) : "");
  };
  OE.runShortcut = function (text) {
    var url = OE.shortcutUrl(text);
    if (typeof window.OE_SHORTCUT_HOOK === "function") return window.OE_SHORTCUT_HOOK(url); // tests
    window.location.href = url;
  };
  /* Share (iOS share sheet) when possible, else download. */
  OE.shareOrDownload = function (blob, name) {
    try {
      var f = new File([blob], name, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [f] }) && navigator.share) return navigator.share({ files: [f], title: name }).catch(function () {});
    } catch (e) {}
    var u = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = u; a.download = name; a.style.display = "none"; document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(u); }, 8000);
  };
})(window.OE);
