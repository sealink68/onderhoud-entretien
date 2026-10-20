"""WO search button (hidden list, auto-show when a 'new' WO exists) + eindverslag fresh-state/stale notice.
Fully mocked backend (WO-TEST… IDs only). Run: python3 -m http.server 8817 --bind 127.0.0.1 & ; /workspace/pwenv/bin/python tests/test_search_final.py"""
import json, os, time
from playwright.sync_api import sync_playwright
U = "http://localhost:8817/index.html"; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH = os.path.join(ROOT, "screens_search") + "/"; os.makedirs(SH, exist_ok=True)
ok = True
def chk(c, m):
  global ok; print(("PASS " if c else "FAIL ") + m); ok &= bool(c)
H = {"access-control-allow-origin": "*", "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS", "access-control-allow-headers": "content-type"}
T0 = int(time.time() * 1000)
def dos(dn, t): return {"wo": "WO-TEST-A", "dossier": dn, "lang": "nl", "tech": {"first": "T", "last": "X"}, "answers": [{"ok": True, "text": "", "photos": []} for _ in range(8)], "extra": "", "receivedAt": t, "firstReceivedAt": t}
DB = {}
def reset(pdfAt=0, n=1): DB.clear(); DB.update(pdfAt=pdfAt, ds=[dos("D%d" % i, T0 - 1000 * i) for i in range(1, n + 1)])
def api(route):
  r = route.request
  if r.method == "OPTIONS": return route.fulfill(status=204, headers=H)
  u = r.url.split("?")[0]
  if u.endswith("/wos"): b = {"wos": [{"wo": "WO-TEST-A", "updated": T0, "n": len(DB["ds"])}, {"wo": "WO-TEST-B", "updated": T0 - 5, "n": 0}]}
  elif u.endswith("/pdf"): DB["pdfAt"] = int(time.time() * 1000); b = {"ok": True, "pdfAt": DB["pdfAt"], "n": len(DB["ds"]), "url": "x"}
  elif "/signer" in u: b = {"ok": True}
  else: b = {"wo": "WO-TEST-A", "pdfAt": DB["pdfAt"], "signer": "Klant", "n": len(DB["ds"]), "dossiers": DB["ds"]}
  route.fulfill(status=200, content_type="application/json", headers=H, body=json.dumps(b))
def state(lang, screen, wo=""): return {"lang": lang, "tech": {"first": "Test", "last": "Tech"}, "mode": "multi", "screen": screen, "wo": wo}
VP = {"iphone": ((390, 844), "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"),
      "ipad": ((820, 1180), "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1")}
with sync_playwright() as p:
  br = p.chromium.launch()
  for dev, (vp, ua) in VP.items():
    for lang in ("nl", "fr"):
      c = br.new_context(viewport={"width": vp[0], "height": vp[1]}, user_agent=ua, is_mobile=True, has_touch=True)
      c.add_init_script("localStorage.setItem('oe_tip_hide',String(Date.now()+9e9));window.OE_SHORTCUT_HOOK=function(){};window.open=function(){return null};")
      c.route("**/onderhoud-api*/**", api); c.route("**workers.dev/**", api)
      pg = c.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
      tag = dev + "_" + lang; reset()
      pg.goto(U); pg.evaluate("s=>localStorage.setItem('oe_state_v1',JSON.stringify(s))", state(lang, "wo")); pg.reload()
      pg.wait_for_selector("#wosb"); pg.wait_for_timeout(300)
      chk(pg.locator("#woq").count() == 0 and pg.locator("#wolist").count() == 0, tag + ": list hidden by default, 🔍 button shown")
      pg.screenshot(path=SH + tag + "_1_hidden.png")
      pg.click("#wosb"); pg.wait_for_selector("#wolist [data-wo]")
      chk(pg.locator("#wolist [data-wo]").count() == 2, tag + ": 🔍 shows the list")
      pg.screenshot(path=SH + tag + "_2_shown.png")
      pg.click("#woh"); chk(pg.locator("#wosb").count() == 1, tag + ": list can be hidden again")
      pg.fill("#won", "TEST-ZZZ"); pg.wait_for_timeout(100)
      chk(pg.locator("#woexists").count() == 0 and pg.locator("#wosb").count() == 1, tag + ": unknown new WO -> list stays hidden")
      pg.fill("#won", "test-a"); pg.wait_for_selector("#woexists")
      hint = pg.inner_text("#woexists")
      chk(("bestaat al" in hint) if lang == "nl" else ("existe déjà" in hint), tag + ": existing WO typed as new -> list + hint (%s)" % lang)
      chk(pg.locator("#wolist [data-wo]").count() == 1, tag + ": list filtered to the matching WO")
      pg.screenshot(path=SH + tag + "_3_exists.png")
      pg.click("#wolist [data-wo]"); pg.wait_for_selector("#wosel")
      chk(pg.input_value("#won") == "" and pg.locator("#fin").is_visible(), tag + ": tap selects existing WO")
      # help text
      pg.click("#help"); pg.wait_for_timeout(200); ht = pg.inner_text("#modal")
      chk("🔍" in ht, tag + ": in-app help mentions 🔍"); pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
      if not pg.locator("#modal").is_hidden(): pg.evaluate("document.getElementById('modal').hidden=true")
      # final: count + fresh fetch + stale notice
      reset(pdfAt=T0 - 500, n=2)  # D1 (T0-1000) & D2 before? D1 at T0-1000 < pdfAt -> not stale
      pg.click("#fin"); pg.wait_for_selector("#fincount")
      chk("2" in pg.inner_text("#fincount") and pg.locator("#finstale").count() == 0, tag + ": count 2, no stale notice")
      DB["ds"].append(dos("D9", int(time.time() * 1000)))  # another technician adds a door
      pg.fill("#sgn", "Klant"); pg.check("#allin"); pg.click("#snd"); pg.wait_for_selector("#finchanged")
      chk("3" in pg.inner_text("#finchanged") and "3" in pg.inner_text("#fincount"), tag + ": send re-reads server -> now 3 doors, notice")
      chk(pg.locator("#finstale").count() == 1, tag + ": door added after PDF -> 'eindverslag opnieuw' notice")
      st = pg.inner_text("#finstale"); chk(("opnieuw" in st) if lang == "nl" else ("refait" in st), tag + ": stale notice language")
      pg.screenshot(path=SH + tag + "_4_stale.png", full_page=True)
      chk(pg.input_value("#sgn") == "Klant" and pg.is_checked("#allin"), tag + ": signer + all-in kept after refresh")
      mt = pg.inner_text("#fincount")
      chk("3" in mt, tag + ": count shown before send: " + mt)
      pg.click("#snd"); pg.wait_for_selector("#pdfok", timeout=30000)
      chk(pg.locator("#finstale").count() == 0, tag + ": stale notice gone after new eindverslag")
      chk(not errs, tag + ": no JS errors " + str(errs[:2]))
      c.close()
  br.close()
print("ALL OK" if ok else "SOME FAILED"); raise SystemExit(0 if ok else 1)
