"""Device detection + per-device iOS Shortcut (OC_Iphone / OC_Ipad): install link, run URL, texts. Fully mocked backend.
Run:  cd <repo> && python3 -m http.server 8817 --bind 127.0.0.1  (other shell)
      /workspace/pwenv/bin/python tests/test_device.py
No live backend is touched (onderhoud-api, translate proxy and MyMemory are mocked; WO-TESTDEV… IDs only)."""
import json, os, re, subprocess, sys
from urllib.parse import quote
from playwright.sync_api import sync_playwright
U = "http://localhost:8817/index.html"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH = os.path.join(ROOT, "screens_device") + "/"; os.makedirs(SH, exist_ok=True)
L_IPHONE = "https://www.icloud.com/shortcuts/6996453996e64d18818c3d3bda1a5fab"
L_IPAD = "https://www.icloud.com/shortcuts/05201aff0eb94a7088bff5e1c2c75edc"
OLD = ["ae5ae596" + "ed7d4671870b9b685ba90f43", "527981a4" + "9cbd4cb09a70e05ca6661274"]  # split so this file doesn't contain them
WO = "WO-TESTDEV 1/ä&x"  # needs URL-encoding
ok = True
def chk(c, m):
  global ok; print(("PASS " if c else "FAIL ") + m); ok &= bool(c)

H = {"access-control-allow-origin": "*", "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS", "access-control-allow-headers": "content-type"}
def api(route):
  if route.request.method == "OPTIONS": return route.fulfill(status=204, headers=H)
  u = route.request.url
  body = {"wos": [{"wo": "WO-TESTDEV1", "created": 0, "updated": 0, "n": 0, "pdfAt": 0}]} if u.split("?")[0].endswith("/wos") else {"wo": "WO-TESTDEV1", "dossiers": []}
  route.fulfill(status=200, content_type="application/json", headers=H, body=json.dumps(body))
def down(route): route.fulfill(status=500, headers=H, body="x")

UA = {
  "iphone13": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "ipad_ua": "Mozilla/5.0 (iPad; CPU OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1",
  "ipad_mac": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "mac_desktop": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "win_desktop": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
  "android": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36",
}
# name: (ua, viewport, platform, maxTouchPoints, expected kind)
DEV = {
  "iphone13": (UA["iphone13"], (390, 844), "iPhone", 5, "iphone"),
  "ipad_ua": (UA["ipad_ua"], (820, 1180), "iPad", 5, "ipad"),
  "ipad_mac": (UA["ipad_mac"], (820, 1180), "MacIntel", 5, "ipad"),
  "mac_desktop": (UA["mac_desktop"], (1280, 800), "MacIntel", 0, "other"),
  "win_desktop": (UA["win_desktop"], (1280, 800), "Win32", 0, "other"),
  "android": (UA["android"], (412, 915), "Linux armv8l", 5, "other"),
}
EXP = {"iphone": ("OC_Iphone", [L_IPHONE], "iPhone"), "ipad": ("OC_Ipad", [L_IPAD], "iPad"), "other": ("OC_Iphone", [L_IPHONE, L_IPAD], "iPhone/iPad")}

def state(lang, screen, tech=True):
  return {"lang": lang, "tech": {"first": "Joachim", "last": "Lust"} if tech else {"first": "", "last": ""}, "mode": "single", "screen": screen, "wo": "WO-TESTDEV1"}

with sync_playwright() as p:
  b = p.chromium.launch()
  for name, (ua, (w, h), plat, mtp, kind) in DEV.items():
    touch = mtp > 0
    c = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2, has_touch=touch, is_mobile=touch and kind != "other" or name == "android", user_agent=ua)
    c.add_init_script("Object.defineProperty(Navigator.prototype,'platform',{get:()=>%s});Object.defineProperty(Navigator.prototype,'maxTouchPoints',{get:()=>%d});"
                      "window.OE_SHORTCUT_HOOK=function(u){(window.__sc=window.__sc||[]).push(u)};localStorage.setItem('oe_tip_hide',String(Date.now()+9e9));" % (json.dumps(plat), mtp))
    c.route("**/onderhoud-api.sealink68.workers.dev/**", api); c.route("**/werkrapport-translate.sealink68.workers.dev/**", down); c.route("**/api.mymemory.translated.net/**", down)
    pg = c.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(U); pg.wait_for_function("window.OE && OE.deviceKind")
    sc, links, dev = EXP[kind]
    chk(pg.evaluate("OE.deviceKind()") == kind, f"{name}: deviceKind = {kind}")
    chk(pg.evaluate("OE.shortcutName()") == sc, f"{name}: shortcut name {sc}")
    exp_url = "shortcuts://run-shortcut?name=" + sc + "&input=text&text=" + quote(WO, safe="")
    chk(pg.evaluate("w=>OE.shortcutUrl(w)", WO) == exp_url, f"{name}: run URL URL-encoded ({exp_url})")
    for lang in ("nl", "fr"):
      pg.evaluate("s=>{localStorage.setItem('oe_state_v1',JSON.stringify(s))}", state(lang, "tech", tech=False)); pg.reload(); pg.wait_for_selector("#fn")
      hrefs = pg.eval_on_selector_all("#card a[href*='icloud.com/shortcuts']", "a=>a.map(x=>x.href)")
      chk(hrefs == links, f"{name}/{lang}: install link(s) {hrefs}")
      lab = pg.eval_on_selector_all("#card a[href*='icloud.com/shortcuts']", "a=>a.map(x=>x.textContent)")
      if kind == "other": chk("iPhone" in lab[0] and "iPad" in lab[1], f"{name}/{lang}: both buttons labelled {lab}")
      note = pg.inner_text(".note")
      loc = ("Op mijn " if lang == "nl" else "Sur mon ") + dev
      scn = "OC_Iphone / OC_Ipad" if kind == "other" else sc
      chk(loc in note and ("‘" + scn + "’" in note or "« " + scn + " »" in note) and ("‘Onderhoud_Entretien’" in note or "« Onderhoud_Entretien »" in note), f"{name}/{lang}: tech note mentions {loc}, new name, old shortcut")
      if lang == "nl" and name in ("iphone13", "ipad_mac", "win_desktop"): pg.wait_for_timeout(200); pg.screenshot(path=SH + f"tech-{name}.png")
      pg.tap("#help") if touch else pg.click("#help"); pg.wait_for_selector("#hlp"); t = pg.inner_text("#hlp")
      chk(loc in t and "iCloud" not in t and ("verwijderen" in t if lang == "nl" else "supprimé" in t), f"{name}/{lang}: tech help uses {loc}, old shortcut may be deleted")
      if lang == "nl": pg.wait_for_timeout(150); pg.screenshot(path=SH + f"help-tech-{name}.png") if name in ("iphone13", "ipad_mac") else None
      # run 2. Start -> setup with the right name
      pg.click("#hlpx"); pg.evaluate("window.__sc=[]"); pg.fill("#fn", "Joachim"); pg.fill("#lnm", "Lust"); pg.click("#go")
      chk(pg.evaluate("window.__sc") == ["shortcuts://run-shortcut?name=" + sc + "&input=text&text=setup"], f"{name}/{lang}: 2. Start runs {sc} setup")
      # final-screen help: location + ServiceMax path + favourites tip
      pg.evaluate("s=>{localStorage.setItem('oe_state_v1',JSON.stringify(s))}", state(lang, "final")); pg.reload(); pg.wait_for_selector("#help")
      pg.click("#help"); pg.wait_for_selector("#hlp"); t = pg.inner_text("#hlp")
      if lang == "nl": good = "Op mijn %s › Rapport › Onderhoud_Entretien" % dev in t and "Blader › Locaties › Op mijn %s" % dev in t and "Voeg toe aan favorieten" in t
      else: good = "Sur mon %s › Rapport › Onderhoud_Entretien" % dev in t and "Parcourir › Emplacements › Sur mon %s" % dev in t and "Ajouter aux favoris" in t
      chk(good and "iCloud" not in t, f"{name}/{lang}: final help (location, ServiceMax path, favourites tip)")
      if lang == "nl" and name in ("iphone13", "ipad_mac"): pg.wait_for_timeout(150); pg.screenshot(path=SH + f"help-final-{name}.png")
      pg.click("#hlpx")
    chk(not errs, f"{name}: no JS errors {errs}")
    c.close()
  b.close()

# ---- old Shortcut IDs gone everywhere (tracked + untracked repo files, external tests, manual sources) ----
files = subprocess.run(["git", "ls-files", "-co", "--exclude-standard"], cwd=ROOT, capture_output=True, text=True).stdout.split()
hits = []
for f in files:
  if f.endswith(".tar.gz"): continue  # old release tarballs
  try: s = open(os.path.join(ROOT, f), "rb").read().decode("utf-8", "ignore")
  except Exception: continue
  hits += [f for o in OLD if o in s]
ext = [x for x in ["/workspace/test_onderhoud.py", "/workspace/test_onderhoud_ids.py", "/workspace/test_help.py", "/workspace/test_wo_search.py"] if os.path.exists(x)]
hits += [x for x in ext for o in OLD if o in open(x, encoding="utf-8").read()]
chk(not hits, f"old Shortcut IDs absent from repo files + tests ({len(files)} files) {hits}")
cfg = open(os.path.join(ROOT, "js", "config.js"), encoding="utf-8").read()
chk("SHORTCUT_INSTALL:" not in cfg and re.search(r"\bSHORTCUT:", cfg) is None and all(k in cfg for k in ["SHORTCUT_INSTALL_IPHONE", "SHORTCUT_INSTALL_IPAD", "SHORTCUT_NAME_IPHONE", "SHORTCUT_NAME_IPAD"]), "config: only the per-device Shortcut keys")
print("ALL OK" if ok else "SOME FAILED")
sys.exit(0 if ok else 1)
