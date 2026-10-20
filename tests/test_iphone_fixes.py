"""iPhone fixes: no horizontal overflow during slide transitions, tap targets >= 44px, photo delete confirm,
'▶ Bewaar PDF' button after upload (runShortcut only on tap), body::before background, no JS errors.
WebKit + Chromium, iPhone SE / iPhone 15 / iPad. Fully mocked backend (WO-TEST… only).
Run: python3 -m http.server 8817 --bind 127.0.0.1 & ; /workspace/pwenv/bin/python tests/test_iphone_fixes.py"""
import json, os, time
from playwright.sync_api import sync_playwright
U = "http://localhost:8817/index.html"; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH = os.path.join(ROOT, "screens_iphone") + "/"; os.makedirs(SH, exist_ok=True)
ok = True
def chk(c, m):
  global ok; print(("PASS " if c else "FAIL ") + m); ok &= bool(c)
H = {"access-control-allow-origin": "*", "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS", "access-control-allow-headers": "content-type"}
T0 = int(time.time() * 1000); WO = "WO-TEST-IPH"
def dos(dn): return {"wo": WO, "dossier": dn, "lang": "nl", "tech": {"first": "T", "last": "X"}, "answers": [{"ok": True, "text": "", "photos": []} for _ in range(8)], "extra": "", "receivedAt": T0, "firstReceivedAt": T0}
def api(route):
  r = route.request
  if r.method == "OPTIONS": return route.fulfill(status=204, headers=H)
  u = r.url.split("?")[0]
  if u.endswith("/wos"): b = {"wos": [{"wo": WO, "updated": T0, "n": 2}]}
  elif u.endswith("/pdf"): b = {"ok": True, "pdfAt": int(time.time() * 1000), "n": 2, "url": "x"}
  elif "/signer" in u: b = {"ok": True}
  else: b = {"wo": WO, "pdfAt": 0, "signer": "", "n": 2, "dossiers": [dos("D1"), dos("D2")]}
  route.fulfill(status=200, content_type="application/json", headers=H, body=json.dumps(b))
PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
def st(lang, screen, **k):
  s = {"lang": lang, "tech": {"first": "Test", "last": "Tech"}, "mode": "multi", "screen": screen, "wo": WO, "dossier": "D1", "step": 0}; s.update(k); return s
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
VP = {"se": (375, 667), "iphone15": (393, 852), "ipad": (820, 1180)}
def size(pg, sel):
  return pg.evaluate("s=>[].map.call(document.querySelectorAll(s),e=>{var r=e.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]})", sel)
with sync_playwright() as p:
  for bn in ("webkit", "chromium"):
    br = getattr(p, bn).launch()
    for dev, vp in VP.items():
      lang = "nl" if dev != "iphone15" else "fr"; tag = f"{bn}_{dev}_{lang}"
      c = br.new_context(viewport={"width": vp[0], "height": vp[1]}, user_agent=UA.replace("iPhone", "iPad") if dev == "ipad" else UA, has_touch=True, is_mobile=(bn == "chromium"))
      c.add_init_script("window.__sc=[];window.OE_SHORTCUT_HOOK=function(u){window.__sc.push(u)};window.open=function(){return null};"
                        "window.__ov=0;setInterval(function(){var d=document.documentElement;if(d.scrollWidth>innerWidth+1||scrollX!==0)window.__ov++},10);")
      c.route("**workers.dev/**", api)
      pg = c.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
      pg.goto(U); pg.evaluate("s=>localStorage.setItem('oe_state_v1',JSON.stringify(s))", st(lang, "mode")); pg.reload(); pg.wait_for_selector("#m1")
      # background pseudo-element
      bg = pg.evaluate("[getComputedStyle(document.body,'::before').position,getComputedStyle(document.body,'::before').backgroundImage.slice(0,15),getComputedStyle(document.body).backgroundAttachment]")
      chk(bg[0] == "fixed" and "gradient" in bg[1], tag + ": body::before fixed gradient " + str(bg))
      ox = pg.evaluate("[getComputedStyle(document.documentElement).overflowX,getComputedStyle(document.body).overflowX]")
      chk(all(v in ("clip", "hidden") for v in ox), tag + ": overflow-x on html/body " + str(ox))
      # tap targets: NL/FR toggle, tip close, .small
      pg.evaluate("document.getElementById('tip').hidden=false")
      s = size(pg, "#seg button") + size(pg, "#tipx") + size(pg, "#card .small")
      chk(s and all(w >= 44 and h >= 44 for w, h in s), tag + ": seg/tip/.small >= 44px " + str(s))
      pg.evaluate("document.getElementById('tip').hidden=true")
      # transitions forward/back while sampling overflow
      pg.evaluate("window.__ov=0")
      for _ in range(3):
        pg.click("#m1"); pg.wait_for_selector("#won"); pg.wait_for_timeout(120); pg.click("#bk"); pg.wait_for_selector("#m1"); pg.wait_for_timeout(120)
      pg.wait_for_timeout(400); chk(pg.evaluate("window.__ov") == 0, tag + ": no horizontal overflow during slide transitions")
      # photo delete confirm
      ans = [{"ok": True, "text": "", "photos": []} for _ in range(8)]
      ans[0] = {"ok": False, "text": "kras", "photos": [{"name": "D1_1.jpg", "data": PNG, "up": False}, {"name": "D1_2.jpg", "data": PNG, "up": False}]}
      pg.evaluate("s=>localStorage.setItem('oe_state_v1',JSON.stringify(s))", st(lang, "q", answers=ans)); pg.reload(); pg.wait_for_selector(".photos .del")
      ds = size(pg, ".photos .del"); chk(all(w >= 44 and h >= 44 for w, h in ds), tag + ": photo delete >= 44px " + str(ds))
      al = pg.get_attribute(".photos .del", "aria-label"); chk(al == ("Foto verwijderen" if lang == "nl" else "Supprimer la photo"), tag + ": aria-label " + al)
      pg.screenshot(path=SH + tag + "_photos.png")
      pg.locator(".photos .del").first.tap(); pg.wait_for_selector("#myes")
      chk(("verwijderen?" in pg.inner_text("#mtext")) if lang == "nl" else ("Supprimer cette photo" in pg.inner_text("#mtext")), tag + ": delete confirm text")
      pg.screenshot(path=SH + tag + "_delconfirm.png")
      pg.tap("#mno"); pg.wait_for_timeout(150); chk(pg.locator(".photos figure").count() == 2, tag + ": 'Nee/Non' keeps the photo")
      pg.locator(".photos .del").first.tap(); pg.wait_for_selector("#myes"); pg.tap("#myes"); pg.wait_for_timeout(200)
      chk(pg.locator(".photos figure").count() == 1, tag + ": 'Ja/Oui' deletes the photo")
      # final: edit button size + shortcut button after upload
      pg.evaluate("s=>localStorage.setItem('oe_state_v1',JSON.stringify(s))", st(lang, "final")); pg.reload(); pg.wait_for_selector(".edit")
      es = size(pg, ".edit"); chk(all(w >= 44 and h >= 44 for w, h in es), tag + ": Bewerken/Modifier >= 44px " + str(es))
      pg.evaluate("window.__sc=[]")
      pg.tap("#snd"); pg.wait_for_selector("#minp"); pg.fill("#minp", "Klant"); pg.tap("#mok"); pg.wait_for_selector("#myes"); pg.tap("#myes")
      pg.wait_for_selector("#pdfok", timeout=30000); pg.wait_for_timeout(500)
      chk(pg.evaluate("window.__sc.length") == 0, tag + ": shortcut NOT started automatically after async upload")
      lbl = pg.inner_text("#rsc"); chk(lbl == ("▶ Bewaar PDF (opdracht starten)" if lang == "nl" else "▶ Enregistrer le PDF (lancer le raccourci)"), tag + ": button label " + lbl)
      rs = size(pg, "#rsc"); chk(rs[0][1] >= 44, tag + ": shortcut button >= 44px high")
      pg.screenshot(path=SH + tag + "_pdfklaar.png", full_page=True)
      pg.tap("#rsc"); pg.wait_for_timeout(200); sc = pg.evaluate("window.__sc")
      chk(len(sc) == 1 and "text=" + "WO-TEST-IPH" in sc[0], tag + ": tap calls runShortcut with WO " + str(sc[:1]))
      chk(not errs, tag + ": no JS errors " + str(errs[:2]))
      c.close()
    br.close()
print("ALL OK" if ok else "SOME FAILED"); raise SystemExit(0 if ok else 1)
