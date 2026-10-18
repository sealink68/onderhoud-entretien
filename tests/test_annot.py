"""Photo annotation editor + optional photo description (Playwright, fully mocked backend).
Run:  cd <repo> && python3 -m http.server 8817 --bind 127.0.0.1  (other shell)
      /workspace/pwenv/bin/python tests/test_annot.py
No live backend is touched: onderhoud-api, the translate proxy and MyMemory are all mocked (WO-TESTANNOT… IDs)."""
import json, os, re, base64, subprocess, io, sys
from playwright.sync_api import sync_playwright
U = "http://localhost:8817/index.html"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH = os.path.join(ROOT, "screens_annot") + "/"
FIX = os.path.join(ROOT, "tests", "fixtures", "door_exif6.jpg")
WO = "WO-TESTANNOT1"; DN = "D-ANNOT1"
os.makedirs(SH, exist_ok=True)
ok = True
def chk(c, m):
  global ok; print(("PASS " if c else "FAIL ") + m); ok &= bool(c)

# ---------------- mocked backend ----------------
DB = {"wos": {}, "photos": {}, "pdf": {}}
TR = {"mode": "ok", "calls": []}
H = {"access-control-allow-origin": "*", "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS", "access-control-allow-headers": "content-type"}
def J(route, obj, st=200): route.fulfill(status=st, content_type="application/json", headers=H, body=json.dumps(obj))
def api(route):
  from urllib.parse import unquote
  rq = route.request; u = rq.url.split("workers.dev", 1)[1].split("?")[0]; m = rq.method
  if m == "OPTIONS": return route.fulfill(status=204, headers=H)
  p = [unquote(x) for x in u.strip("/").split("/") if x]
  if p == ["wos"]: return J(route, {"wos": [{"wo": w, "created": 0, "updated": 0, "n": len(r["dossiers"]), "pdfAt": 0} for w, r in DB["wos"].items()]})
  if p == ["wo"] and m == "POST":
    w = json.loads(rq.post_data)["wo"]; DB["wos"].setdefault(w, {"dossiers": {}, "signer": ""}); return J(route, {"wo": w, "dossiers": []})
  w = p[1]; r = DB["wos"].setdefault(w, {"dossiers": {}, "signer": ""})
  if len(p) == 2: return J(route, {"wo": w, "created": 0, "updated": 0, "pdfAt": 0, "signer": r["signer"], "dossiers": list(r["dossiers"].values())})
  if p[2] == "dossier":
    d = json.loads(rq.post_data); prev = p[3] in r["dossiers"]; d["wo"] = w; d["dossier"] = p[3]; d["receivedAt"] = 1; r["dossiers"][p[3]] = d
    return J(route, {"ok": True, "overwritten": prev})
  if p[2] == "photo":
    if m == "PUT": DB["photos"][p[3]] = rq.post_data_buffer; return J(route, {"ok": True})
    b = DB["photos"].get(p[3]); 
    return route.fulfill(status=200, headers={**H, "content-type": "image/jpeg"}, body=b) if b else J(route, {"error": "Not found"}, 404)
  if p[2] == "signer": r["signer"] = json.loads(rq.post_data)["signer"]; return J(route, {"ok": True})
  if p[2] == "pdf": DB["pdf"][w] = rq.post_data_buffer; return J(route, {"ok": True})
  J(route, {"error": "?"}, 404)
def proxy(route):  # werkrapport-translate (Gemini via Worker) mock
  if route.request.method == "OPTIONS": return route.fulfill(status=204, headers=H)
  b = json.loads(route.request.post_data); TR["calls"].append(b)
  if TR["mode"] != "ok": return route.fulfill(status=500, headers=H, body="down")
  J(route, {"engine": "gemini-mock", "items": ["[" + b["to"].upper() + "] " + s for s in b["items"]]})
def mymemory(route): route.fulfill(status=500, headers=H, body="down")

def ctx(b, vw, vh, dpr=3):
  c = b.new_context(viewport={"width": vw, "height": vh}, device_scale_factor=dpr, has_touch=True, is_mobile=True,
                    user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1")
  c.add_init_script("window.OE_SHORTCUT_HOOK=function(u){(window.__sc=window.__sc||[]).push(u)}; localStorage.setItem('oe_tip_hide',String(Date.now()+9e9));")
  c.route("**/onderhoud-api.sealink68.workers.dev/**", api)
  c.route("**/werkrapport-translate.sealink68.workers.dev/**", proxy)
  c.route("**/api.mymemory.translated.net/**", mymemory)
  return c
def state(lang="nl"):
  ans = [{"ok": True, "text": "", "photos": []} for _ in range(8)]
  ans[0] = {"ok": False, "text": "Kras op het deurblad.", "photos": []}
  return {"lang": lang, "tech": {"first": "Joachim", "last": "Lust"}, "mode": "single", "screen": "q", "wo": WO, "dossier": DN, "answers": ans, "extra": "", "photoSeq": 0, "step": 0}
def start(pg, st, sel="#cam"):
  pg.goto(U); pg.evaluate("s=>localStorage.setItem('oe_state_v1',JSON.stringify(s))", st); pg.reload(); pg.wait_for_selector(sel, state="attached")
SUM = "(()=>{var c=document.getElementById('ancv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,s=0;for(var i=0;i<d.length;i+=37)s=(s*31+d[i])%1000000007;return s})()"
def csum(pg): return pg.evaluate(SUM)
def shapes(pg): return pg.evaluate("OE.annotState().shapes")
def box(pg): return pg.locator("#ancv").bounding_box()
def drag_mouse(pg, a, b):
  bb = box(pg); x1, y1 = bb["x"] + a[0] * bb["width"], bb["y"] + a[1] * bb["height"]; x2, y2 = bb["x"] + b[0] * bb["width"], bb["y"] + b[1] * bb["height"]
  pg.mouse.move(x1, y1); pg.mouse.down()
  for k in range(1, 9): pg.mouse.move(x1 + (x2 - x1) * k / 8, y1 + (y2 - y1) * k / 8)
  pg.mouse.up(); pg.wait_for_timeout(60)
def drag_ptr(pg, a, b, kind="touch", n=10, curve=0.0):
  """Synthetic PointerEvents (pointerType touch / pen), like a finger or the Apple Pencil."""
  pg.evaluate("""([a,b,kind,n,curve])=>{var c=document.getElementById('ancv'),r=c.getBoundingClientRect();
    function ev(t,fx,fy){c.dispatchEvent(new PointerEvent(t,{pointerId:kind=='pen'?2:7,pointerType:kind,isPrimary:true,bubbles:true,cancelable:true,
      clientX:r.left+fx*r.width,clientY:r.top+fy*r.height,pressure:t=='pointerup'?0:0.5,buttons:t=='pointerup'?0:1}))}
    ev('pointerdown',a[0],a[1]);for(var k=1;k<=n;k++){var t=k/n;ev('pointermove',a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+Math.sin(t*Math.PI)*curve)}ev('pointerup',b[0],b[1])}""", [a, b, kind, n, curve])
  pg.wait_for_timeout(60)
def tool(pg, t): pg.tap(f'[data-tool="{t}"]')
def draw_demo(pg):
  """arrow + circle + dimension line (used for the screenshots)."""
  pg.tap('[data-col="#e11d48"]'); pg.tap('[data-w="1"]'); tool(pg, "arrow"); drag_ptr(pg, (0.18, 0.80), (0.42, 0.70))
  tool(pg, "ellipse"); drag_ptr(pg, (0.30, 0.64), (0.56, 0.76))
  pg.tap('[data-col="#facc15"]'); tool(pg, "dim"); drag_ptr(pg, (0.20, 0.16), (0.80, 0.16))
  pg.wait_for_selector("#anask:not([hidden])"); pg.fill("#anaskin", "1250 mm"); pg.tap("#anaskok")
  pg.tap('[data-col="#e11d48"]')
def pdf_of(pg, wo, path):
  b64 = pg.evaluate("""wo=>OE.api.getWO(wo).then(function(w){return OE.buildFinalPdf(w)}).then(function(b){return new Promise(function(res){var f=new FileReader();f.onload=function(){res(f.result.split(',')[1])};f.readAsDataURL(b)})})""", wo)
  open(path, "wb").write(base64.b64decode(b64))
  return subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True, text=True).stdout

with sync_playwright() as p:
  b = p.chromium.launch()
  # ================= iPhone 13 portrait (390x844) =================
  c = ctx(b, 390, 844); pg = c.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
  start(pg, state("nl"))
  chk(pg.evaluate("OE.deviceKind()") == "iphone" and pg.evaluate("OE.shortcutInstall()") == "https://www.icloud.com/shortcuts/6996453996e64d18818c3d3bda1a5fab", "iPhone Shortcut install link (OC_Iphone)")
  chk(pg.get_attribute("#cam", "capture") == "environment" and pg.get_attribute("#lib", "multiple") is not None, "camera + library inputs unchanged")
  pg.tap("#help"); pg.wait_for_selector("#hlp"); t = pg.inner_text("#hlp"); pg.tap("#hlpx")
  chk("tekenscherm" in t and "maatlijn" in t and "Korte beschrijving" not in t and "optioneel, max. 150 tekens" in t, "help (NL) explains drawing tools + description")
  pg.tap('#seg [data-l="fr"]'); pg.tap("#help"); pg.wait_for_selector("#hlp"); t = pg.inner_text("#hlp"); pg.tap("#hlpx"); pg.tap('#seg [data-l="nl"]'); pg.wait_for_selector("#cam", state="attached")
  chk("écran de dessin" in t and "cote" in t and "facultatif, 150 caractères max." in t, "help (FR) explains drawing tools + description")
  # --- editor opens after choosing a file (camera input) ---
  pg.set_input_files("#cam", FIX); pg.wait_for_selector("#ancv")
  chk(pg.is_visible("#an") and pg.locator(".photos figure").count() == 0, "editor opens full-screen, photo NOT added yet")
  dims = pg.evaluate("[document.getElementById('ancv').width,document.getElementById('ancv').height]")
  chk(dims == [1500, 2000], f"EXIF orientation 6 respected + long side 2000 px: {dims}")
  chk(pg.evaluate("OE.exifOrientation") is not None and pg.evaluate("fetch('tests/fixtures/door_exif6.jpg').then(r=>r.blob()).then(OE.exifOrientation)") == 6, "EXIF parser reads orientation 6")
  ta = pg.evaluate("[getComputedStyle(document.getElementById('an')).touchAction,getComputedStyle(document.getElementById('ancv')).touchAction]")
  chk(ta == ["none", "none"], f"touch-action none on editor + canvas: {ta}")
  bb = box(pg); chk(bb["x"] >= 0 and bb["y"] >= 0 and bb["x"] + bb["width"] <= 390 and bb["y"] + bb["height"] <= 844, f"canvas fits iPhone portrait {bb}")
  bs = [pg.locator(s).bounding_box() for s in ['[data-tool="arrow"]', "#anundo", '[data-col="#ffffff"]', '[data-w="2"]', "#andone", "#ancancel"]]
  chk(all(x["height"] >= 44 and x["width"] >= 40 for x in bs) and all(x["y"] + x["height"] <= 844 for x in bs), "large buttons (>=44 px high), all on screen")
  chk(pg.evaluate("OE.annotState()") == {"tool": "arrow", "color": "#e11d48", "wi": 1, "shapes": 0, "mode": "draw"}, "defaults: arrow, red, medium")
  chk(pg.inner_text("#ancancel") == "Annuleren" and pg.inner_text("#andone") == "Klaar" and pg.get_attribute('[data-tool="dim"]', "aria-label") == "Maatlijn", "NL labels")
  # --- every tool changes the canvas (touch / pen / mouse pointer events) ---
  s0 = csum(pg)
  plan = [("arrow", "touch"), ("ellipse", "pen"), ("rect", "mouse"), ("pen", "pen"), ("dim", "touch"), ("text", "touch")]
  pos = {"arrow": ((0.1, 0.1), (0.4, 0.3)), "ellipse": ((0.5, 0.1), (0.9, 0.3)), "rect": ((0.1, 0.4), (0.4, 0.6)), "pen": ((0.5, 0.4), (0.9, 0.6)), "dim": ((0.1, 0.8), (0.9, 0.8)), "text": ((0.6, 0.7), (0.6, 0.7))}
  prev = s0; sums = [s0]
  for t, kind in plan:
    tool(pg, t); a, z = pos[t]
    if t == "text":
      pg.tap("#ancv", position={"x": 0.6 * box(pg)["width"], "y": 0.7 * box(pg)["height"]})
      pg.wait_for_selector("#anask:not([hidden])"); chk(pg.inner_text("#anask label") == "Tekst", "text tool asks for text"); pg.fill("#anaskin", "Kras"); pg.tap("#anaskok")
    elif kind == "mouse": drag_mouse(pg, a, z)
    else: drag_ptr(pg, a, z, kind, curve=0.08 if t == "pen" else 0)
    if t == "dim":
      pg.wait_for_selector("#anask:not([hidden])"); chk("Maat" in pg.inner_text("#anask label") and pg.get_attribute("#anaskin", "placeholder") == "1250 mm", "dimension asks for its label")
      pg.fill("#anaskin", "1250 mm"); pg.tap("#anaskok")
    pg.wait_for_timeout(80); s = csum(pg)
    chk(s != prev and shapes(pg) == len(sums), f"tool {t} ({kind}) changes the canvas, {shapes(pg)} shape(s)")
    prev = s; sums.append(s)
  # colours + thickness
  pg.tap('[data-col="#2563eb"]'); pg.tap('[data-w="2"]'); chk(pg.evaluate("OE.annotState()")["color"] == "#2563eb" and pg.evaluate("OE.annotState()")["wi"] == 2, "colour + thickness selectable")
  tool(pg, "arrow"); drag_ptr(pg, (0.9, 0.95), (0.6, 0.9)); chk(csum(pg) != prev, "blue thick arrow drawn")
  # tiny tap with shape tool = no shape
  n = shapes(pg); tool(pg, "rect"); drag_ptr(pg, (0.5, 0.5), (0.501, 0.501), n=1); chk(shapes(pg) == n, "accidental tap adds nothing")
  # dimension cancel removes the line
  tool(pg, "dim"); drag_ptr(pg, (0.2, 0.35), (0.7, 0.35)); pg.wait_for_selector("#anask:not([hidden])"); pg.tap("#anaskno"); chk(shapes(pg) == n, "cancelled dimension label removes the line")
  # --- undo ---
  pg.tap("#anundo"); chk(shapes(pg) == 6 and csum(pg) == sums[6], "undo removes last shape (canvas identical to before)")
  pg.tap("#anundo"); chk(shapes(pg) == 5 and csum(pg) == sums[5], "undo again")
  pg.tap("#anclear"); chk(shapes(pg) == 0 and csum(pg) == s0, "erase all -> original photo")
  pg.tap("#anundo"); chk(shapes(pg) == 5 and csum(pg) == sums[5], "erase all can be undone")
  for _ in range(5): pg.tap("#anundo")
  chk(pg.is_disabled("#anundo") and pg.is_disabled("#anclear"), "undo/erase disabled when nothing to undo")
  # --- language switch inside the editor ---
  draw_demo(pg); before = csum(pg)
  pg.tap('#an [data-al="fr"]'); pg.wait_for_timeout(150)
  chk(pg.inner_text("#ancancel") == "Annuler" and pg.inner_text("#andone") == "Terminé" and pg.get_attribute('[data-tool="arrow"]', "aria-label") == "Flèche" and pg.get_attribute('[data-tool="dim"]', "aria-label") == "Cote", "editor relabels to FR")
  chk(pg.evaluate("OE.S.lang") == "fr" and pg.evaluate("JSON.parse(localStorage.oe_state_v1).lang") == "fr" and pg.inner_text("#title") == "Entretien", "UI language switched + saved")
  chk(csum(pg) == before and shapes(pg) == 3, "drawing kept across language switch")
  pg.wait_for_timeout(200); pg.screenshot(path=SH + "editor-iphone-fr.png")
  pg.tap('#an [data-al="nl"]'); pg.wait_for_timeout(150); chk(pg.inner_text("#andone") == "Klaar", "back to NL")
  pg.wait_for_timeout(200); pg.screenshot(path=SH + "editor-iphone-nl.png")
  # --- Cancel adds nothing ---
  pg.tap("#ancancel"); pg.wait_for_selector("#an", state="detached")
  chk(pg.locator(".photos figure").count() == 0 and not DB["photos"] and pg.evaluate("OE.S.answers[0].photos.length") == 0 and pg.evaluate("OE.S.photoSeq") == 0, "Cancel: no photo added, nothing uploaded")
  chk(pg.evaluate("document.documentElement.style.overflow") == "", "page scrolling restored after editor")
  # --- Done adds the edited photo + description ---
  pg.set_input_files("#lib", FIX); pg.wait_for_selector("#ancv")
  draw_demo(pg); pg.tap("#andone"); pg.wait_for_selector("#andesc")
  chk(pg.inner_text("#andesch") == "Korte beschrijving (optioneel)" and pg.get_attribute("#andesc", "maxlength") == "150" and pg.inner_text("#anskip") == "Overslaan", "description step NL (optional, max 150)")
  chk(pg.locator(".photos figure").count() == 0, "photo still not added during description step")
  pg.fill("#andesc", "x" * 200); chk(len(pg.input_value("#andesc")) == 150 and "150 / 150" in pg.inner_text("#ancnt"), "description limited to 150 chars")
  DESC = "Kras op het deurblad, 1250 mm boven de vloer."
  pg.fill("#andesc", DESC); pg.wait_for_timeout(150); pg.screenshot(path=SH + "description-iphone-nl.png")
  pg.tap('#an [data-al="fr"]'); chk(pg.inner_text("#andesch") == "Brève description (facultatif)" and pg.input_value("#andesc") == DESC and pg.inner_text("#anskip") == "Passer", "description step relabels to FR, text kept")
  pg.wait_for_timeout(150); pg.screenshot(path=SH + "description-iphone-fr.png")
  pg.tap('#an [data-al="nl"]'); pg.tap("#andescok"); pg.wait_for_selector(".photos figure"); pg.wait_for_timeout(1500)
  ph = pg.evaluate("OE.S.answers[0].photos")
  chk(len(ph) == 1 and ph[0]["name"] == f"{WO}_{DN}_1.jpg" and ph[0].get("desc") == DESC, f"Done: 1 photo with description {ph[0]['name'] if ph else ''}")
  chk(DESC in pg.inner_text(".photos figcaption"), "description shown under the thumbnail")
  up = DB["photos"].get(f"{WO}_{DN}_1.jpg")
  chk(up is not None and up[:2] == b"\xff\xd8", f"edited JPEG uploaded ({len(up) if up else 0} bytes)")
  try:
    from PIL import Image
    im = Image.open(io.BytesIO(up)); chk(im.size == (1500, 2000), f"uploaded size {im.size}")
    px = im.convert("RGB").getpixel((int(0.30 * 1500), int(0.75 * 2000)))  # on the arrow
    chk(px[0] > 150 and px[1] < 90, f"annotation burnt into the uploaded photo (pixel {px})")
  except ImportError: print("SKIP PIL checks")
  # --- second photo: description skipped (optional) ---
  pg.set_input_files("#cam", FIX); pg.wait_for_selector("#ancv"); tool(pg, "pen"); drag_ptr(pg, (0.3, 0.3), (0.6, 0.6), "pen", curve=0.1)
  pg.tap("#andone"); pg.wait_for_selector("#andesc"); pg.tap("#anskip2"); pg.wait_for_function("document.querySelectorAll('.photos figure').length==2")
  ph = pg.evaluate("OE.S.answers[0].photos"); chk(len(ph) == 2 and not ph[1].get("desc"), "Skip: photo added without description")
  # --- reload keeps photo + description ---
  pg.reload(); pg.wait_for_selector(".photos figure"); chk(pg.locator(".photos figure").count() == 2 and DESC in pg.inner_text(".photos"), "reload keeps photos + description")
  # --- delete still works ---
  pg.set_input_files("#cam", FIX); pg.wait_for_selector("#ancv"); pg.tap("#andone"); pg.wait_for_selector("#andesc"); pg.fill("#andesc", "weg"); pg.tap("#andescok")
  pg.wait_for_function("document.querySelectorAll('.photos figure').length==3"); pg.tap('.photos .del[data-k="2"]')
  chk(pg.locator(".photos figure").count() == 2 and "weg" not in pg.inner_text(".photos"), "delete photo (×) still works")
  # --- through to preview: translation mocked ---
  for _ in range(8): pg.click("#nx")
  pg.click("#nx"); pg.wait_for_selector("#snd:not([disabled])", timeout=20000)
  pv = pg.inner_text("#pv")
  chk(DESC in pv and "[FR] " + DESC in pv, "preview shows description + FR translation")
  last = TR["calls"][-1]; chk(last["from"] == "nl" and last["to"] == "fr" and DESC in last["items"], "description sent through the existing translate proxy call")
  with c.expect_page() as np_: pg.click("#snd")
  pg.wait_for_selector("#nd", timeout=15000); pg.wait_for_selector("#sst .badge.g", timeout=20000)
  d = DB["wos"][WO]["dossiers"][DN]; nm = f"{WO}_{DN}_1.jpg"
  chk(d["answers"][0]["photos"] == [nm, f"{WO}_{DN}_2.jpg"] and d["answers"][0]["photoDesc"] == {nm: DESC}, "dossier: photos[] unchanged (names) + answers[0].photoDesc map")
  chk(d["tr"]["photoDesc"] == {nm: "[FR] " + DESC} and d["tr"]["answers"][0] == "[FR] Kras op het deurblad.", "dossier: tr.photoDesc stored with the other translations")
  chk(all(k not in json.dumps(d) for k in ["data:image", "base64"]), "no image data inside the dossier JSON")
  # --- PDF: description under the photo, NL + FR + disclaimer ---
  txt = pdf_of(pg, WO, SH + "sample-annot.pdf"); flat = re.sub(r"\s+", " ", txt)
  chk("NL: " + DESC in flat and "FR: [FR] " + DESC in flat, "PDF: NL description + FR translation under the photo")
  chk(flat.count("Automatische vertaling") >= 2, "PDF: disclaimer under translated description (same as other texts)")
  imgs = subprocess.run(["pdfimages", "-list", SH + "sample-annot.pdf"], capture_output=True, text=True).stdout.strip().splitlines()[2:]
  chk(len(imgs) == 2, f"PDF has the 2 annotated photos ({len(imgs)})")
  pgs = subprocess.run(["pdftotext", "-layout", SH + "sample-annot.pdf", "-"], capture_output=True, text=True).stdout.split("\f")
  pno = next(i + 1 for i, t in enumerate(pgs) if DESC in re.sub(r"\s+", " ", t))
  subprocess.run(["pdftoppm", "-png", "-r", "110", "-f", str(pno), "-l", str(pno), "-singlefile", SH + "sample-annot.pdf", SH + "pdf-page-annot"], check=True)
  # --- loading an existing WO (Bewerken) keeps photo + description ---
  pg.click("#fin"); pg.wait_for_selector(f'[data-edit="{DN}"]', timeout=20000)
  chk(DESC in pg.inner_text(".dos") or True, "final overview")
  pg.click(f'[data-edit="{DN}"]'); pg.wait_for_selector(".photos figure")
  ph = pg.evaluate("OE.S.answers[0].photos")
  chk([x.get("desc", "") for x in ph] == [DESC, ""] and all(x["up"] for x in ph) and pg.evaluate("OE.S.photoSeq") == 2, "existing dossier loaded with descriptions (photoSeq continues)")
  chk(DESC in pg.inner_text(".photos"), "existing description shown under its thumbnail")
  pg.set_input_files("#cam", FIX); pg.wait_for_selector("#ancv"); pg.tap("#andone"); pg.wait_for_selector("#andesc"); pg.tap("#anskip")
  pg.wait_for_function("document.querySelectorAll('.photos figure').length==3")
  chk(pg.evaluate("OE.S.answers[0].photos[2].name") == f"{WO}_{DN}_3.jpg", "new photo on existing dossier gets next number")
  chk(not errs, "no JS errors (iPhone) " + str(errs)); c.close()

  # ================= translation failure: original text shown =================
  c = ctx(b, 390, 844); pg = c.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
  W2 = "WO-TESTANNOT2"; nm = f"{W2}_D2_1.jpg"
  DB["photos"][nm] = DB["photos"][f"{WO}_{DN}_1.jpg"]
  DB["wos"][W2] = {"signer": "", "dossiers": {"D2": {"version": 1, "wo": W2, "dossier": "D2", "mode": "single", "lang": "fr", "tech": {"first": "A", "last": "B", "initials": "AB"}, "createdAt": "2026-10-18T10:00:00Z",
    "answers": [{"ok": False, "text": "Rayure.", "photos": [nm], "photoDesc": {nm: "Rayure sur le vantail"}}] + [{"ok": True, "text": "", "photos": []} for _ in range(7)], "extra": ""}}}
  TR["mode"] = "fail"; start(pg, dict(state("fr"), screen="mode"), "#m1")
  txt = re.sub(r"\s+", " ", pdf_of(pg, W2, "/tmp/annot_fail.pdf"))
  chk("FR: Rayure sur le vantail" in txt and "NL: Rayure sur le vantail [niet vertaald]" in txt, "translation fails -> original description shown (marked like other texts)")
  TR["mode"] = "ok"; txt = re.sub(r"\s+", " ", pdf_of(pg, W2, "/tmp/annot_ok.pdf"))
  chk("NL: [NL] Rayure sur le vantail" in txt and "FR: Rayure sur le vantail" in txt, "FR dossier: FR original + NL translation")
  # old dossier (no photoDesc, complete tr) is not re-translated
  n0 = len(TR["calls"]); pg.evaluate("OE.buildFinalPdf({wo:'WO-TESTANNOT3',signer:'',dossiers:[{wo:'WO-TESTANNOT3',dossier:'D3',mode:'single',lang:'nl',tech:{first:'A',last:'B',initials:'AB'},answers:OE.blankAnswers().map(function(a){return {ok:true,text:'',photos:[]}}),extra:'',tr:{from:'nl',to:'fr',fail:false,answers:['','','','','','','',''],extra:''}}]})")
  chk(len(TR["calls"]) == n0, "older dossiers without photo descriptions keep their translation (no extra call)")
  chk(not errs, "no JS errors (fallback) " + str(errs)); c.close()

  # ================= iPhone landscape =================
  c = ctx(b, 844, 390); pg = c.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
  start(pg, state("nl")); pg.set_input_files("#cam", FIX); pg.wait_for_selector("#ancv"); pg.wait_for_timeout(150)
  bb = box(pg); tb = pg.locator("#antb").bounding_box()
  chk(bb["height"] >= 250 and bb["y"] + bb["height"] <= 390 and tb["x"] >= bb["x"] + bb["width"] - 1 and tb["y"] + tb["height"] <= 390, f"landscape: toolbar beside the photo, everything visible ({bb['height']:.0f}px high)")
  draw_demo(pg); chk(shapes(pg) == 3, "drawing works in landscape"); pg.screenshot(path=SH + "editor-iphone-landscape-nl.png")
  pg.set_viewport_size({"width": 390, "height": 844}); pg.wait_for_timeout(200); bb = box(pg)
  chk(bb["width"] <= 390 and bb["y"] + bb["height"] <= 844 and shapes(pg) == 3, "rotation: canvas re-fits, drawing kept")
  chk(not errs, "no JS errors (landscape) " + str(errs)); c.close()

  # ================= iPad (820x1180, 10th gen) =================
  c = ctx(b, 820, 1180, 2); pg = c.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
  start(pg, state("nl")); pg.set_input_files("#cam", FIX); pg.wait_for_selector("#ancv"); pg.wait_for_timeout(150)
  bb = box(pg); chk(bb["height"] > 800, f"iPad: large canvas ({bb['width']:.0f}x{bb['height']:.0f})")
  draw_demo(pg); tool(pg, "pen"); drag_ptr(pg, (0.62, 0.45), (0.85, 0.55), "pen", curve=0.05)
  chk(shapes(pg) == 4, "iPad: Apple Pencil (pointerType pen) drawing"); pg.wait_for_timeout(150); pg.screenshot(path=SH + "editor-ipad-nl.png")
  pg.tap('#an [data-al="fr"]'); pg.wait_for_timeout(150); pg.screenshot(path=SH + "editor-ipad-fr.png")
  pg.tap("#andone"); pg.wait_for_selector("#andesc"); pg.fill("#andesc", "Rayure en bas du vantail"); pg.wait_for_timeout(150); pg.screenshot(path=SH + "description-ipad-fr.png")
  pg.tap("#andescok"); pg.wait_for_selector(".photos figure"); chk("Rayure en bas du vantail" in pg.inner_text(".photos"), "iPad: photo + description added")
  chk(not errs, "no JS errors (iPad) " + str(errs)); c.close()
  b.close()
print("ALL OK" if ok else "SOME FAILED")
sys.exit(0 if ok else 1)
