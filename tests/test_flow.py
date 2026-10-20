"""Door-end flow: ‹ Terug / ✓ Verstuur tussenverslag / 📄 Preview eindverslag, small grey 'Sluiten app' with confirm,
final preview with per-door edit (PUT), inline signer name + 'Zijn alle verslagen binnen?', PDF + '▶ Bewaar PDF'.
WebKit + Chromium at iPhone SE / iPhone 15 / iPad. Mocked backend (WO-TEST… only) incl. door-list lag and offline.
Run: python3 -m http.server 8817 --bind 127.0.0.1 & ; /workspace/pwenv/bin/python tests/test_flow.py"""
import json, os, time
from urllib.parse import unquote, urlparse
from playwright.sync_api import sync_playwright
U = "http://localhost:8817/index.html"; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH = os.path.join(ROOT, "screens_flow") + "/"; os.makedirs(SH, exist_ok=True)
ok = True
def chk(c, m):
  global ok; print(("PASS " if c else "FAIL ") + m); ok &= bool(c)
H = {"access-control-allow-origin": "*", "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS", "access-control-allow-headers": "content-type"}
WO = "WO-TEST-FLOW"
class DB:
  def reset(s):
    t = int(time.time() * 1000)
    s.ds = {"D1": {"wo": WO, "dossier": "D1", "lang": "nl", "tech": {"first": "Ann", "last": "Peeters", "initials": "AP"}, "answers": [{"ok": True, "text": "", "photos": []} for _ in range(8)], "extra": "", "receivedAt": t, "firstReceivedAt": t}}
    s.vis = {"D1"}; s.lag = False; s.offline = False; s.puts = []; s.signer = ""; s.pdf = 0
db = DB(); db.reset()
def api(route):
  r = route.request
  if r.method == "OPTIONS": return route.fulfill(status=204, headers=H)
  p = [unquote(x) for x in urlparse(r.url).path.split("/")[1:]]
  j = lambda o, st=200: route.fulfill(status=st, content_type="application/json", headers=H, body=json.dumps(o))
  assert not any(w in r.url for w in ("WO-321432", "WO-987634", "WO-456783", "WO-987653"))
  if p == ["wos"]: return j({"wos": [{"wo": WO, "updated": 1, "n": len(db.vis)}]})
  if len(p) == 2: return j({"wo": WO, "pdfAt": db.pdf, "signer": db.signer, "n": len(db.vis), "dossiers": [db.ds[k] for k in sorted(db.vis)]})
  if p[2] == "dossier":
    dn = p[3]
    if r.method == "GET": return j(db.ds[dn]) if dn in db.ds else j({"error": "Not found"}, 404)
    if db.offline: return route.abort()
    d = json.loads(r.post_data); prev = db.ds.get(dn); t = int(time.time() * 1000)
    d["receivedAt"] = t; d["firstReceivedAt"] = prev["firstReceivedAt"] if prev else t; db.ds[dn] = d; db.puts.append(dn)
    if not db.lag: db.vis |= set(db.ds)
    return j({"ok": True, "overwritten": bool(prev), "pdfAt": db.pdf, "staleFinal": bool(db.pdf and not prev)})
  if p[2] == "photo": return j({"ok": True})
  if p[2] == "signer": db.signer = json.loads(r.post_data)["signer"]; return j({"ok": True})
  if p[2] == "pdf": db.pdf = int(time.time() * 1000); return j({"ok": True, "pdfAt": db.pdf, "n": len(db.vis)})
  return j({"error": "x"}, 404)
def st(lang, screen, dn="D2", text="kras op deur"):
  ans = [{"ok": True, "text": "", "photos": []} for _ in range(8)]; ans[1] = {"ok": False, "text": text, "photos": []}
  return {"lang": lang, "tech": {"first": "Test", "last": "Tech"}, "mode": "multi", "screen": screen, "wo": WO, "dossier": dn, "step": 0, "answers": ans, "extra": ""}
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
VP = {"se": ((375, 667), "nl"), "iphone15": ((393, 852), "fr"), "ipad": ((820, 1180), "nl")}
def seed(pg, s): pg.evaluate("s=>{localStorage.setItem('oe_state_v1',JSON.stringify(s));localStorage.removeItem('oe_outbox_v1')}", s); pg.reload()
with sync_playwright() as p:
  for bn in ("webkit", "chromium"):
    br = getattr(p, bn).launch()
    for dev, (vp, lang) in VP.items():
      tag = f"{bn}_{dev}_{lang}"; nl = lang == "nl"; db.reset()
      c = br.new_context(viewport={"width": vp[0], "height": vp[1]}, user_agent=UA.replace("iPhone", "iPad") if dev == "ipad" else UA, has_touch=True, is_mobile=(bn == "chromium"))
      c.add_init_script("window.__sc=[];window.OE_SHORTCUT_HOOK=function(u){window.__sc.push(u)};window.__open=[];window.open=function(u){window.__open.push(u);return {}};localStorage.setItem('oe_tip_hide',String(Date.now()+9e9));")
      c.route("**/onderhoud-api.sealink68.workers.dev/**", api)
      c.route("**/werkrapport-translate.sealink68.workers.dev/**", lambda r: r.fulfill(status=500, headers=H, body="x"))
      c.route("**/api.mymemory.translated.net/**", lambda r: r.fulfill(status=500, headers=H, body="x"))
      pg = c.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
      pg.goto(U)
      # --- preview: 3 buttons + small grey close link
      seed(pg, st(lang, "preview")); pg.wait_for_selector("#pvf:not([disabled])", timeout=20000)
      t = [pg.inner_text(s).strip() for s in ("#bk", "#snd", "#pvf")]
      chk(t == (["‹ Terug", "✓ Verstuur tussenverslag", "📄 Preview eindverslag"] if nl else ["‹ Retour", "✓ Envoyer le rapport intermédiaire", "📄 Aperçu du rapport final"]), tag + ": preview buttons " + str(t))
      cl = pg.evaluate("(()=>{var e=document.getElementById('cl'),c=getComputedStyle(e),r=e.getBoundingClientRect();return [e.className,c.color,c.fontSize,Math.round(r.height)]})()")
      chk(cl[0] == "lnk" and cl[2] == "13px" and cl[3] >= 44, tag + ": 'Sluiten app' small grey link " + str(cl))
      pg.screenshot(path=SH + tag + "_1_preview.png", full_page=True)
      pg.tap("#cl"); pg.wait_for_selector("#myes"); q = pg.inner_text("#mtext")
      chk(q == ("Verslag niet opslaan/versturen?" if nl else "Ne pas enregistrer/envoyer le rapport ?"), tag + ": close confirm " + q)
      pg.screenshot(path=SH + tag + "_2_closeconfirm.png")
      pg.tap("#mno"); pg.wait_for_timeout(150); chk(pg.locator("#pvf").count() == 1 and not pg.evaluate("window.__open.length"), tag + ": Nee/Non stays on preview, Go not opened")
      pg.tap("#cl"); pg.wait_for_selector("#myes"); pg.tap("#myes"); pg.wait_for_selector("#m1")
      s = pg.evaluate("JSON.parse(localStorage.getItem('oe_state_v1'))")
      chk(s["screen"] == "mode" and s["wo"] == "" and s["dossier"] == "" and not db.puts and pg.evaluate("window.__open.length") == 1, tag + ": Ja/Oui -> start, draft discarded, nothing sent, ServiceMax Go opened")
      # --- Verstuur tussenverslag: queue + Go + sent screen
      seed(pg, st(lang, "preview")); pg.wait_for_selector("#snd:not([disabled])", timeout=20000); pg.evaluate("window.__open=[]"); pg.tap("#snd"); pg.wait_for_selector("#nd")
      pg.wait_for_function("document.querySelector('#sst .badge.g')", timeout=15000)
      chk(db.puts == ["D2"] and pg.evaluate("window.__open.length") == 1, tag + ": tussenverslag -> PUT D2 + ServiceMax Go opened")
      chk(pg.locator(".lnk#cl").count() == 1 and pg.inner_text("#fin").strip().endswith("Preview eindverslag" if nl else "Aperçu du rapport final"), tag + ": sent screen: preview button + grey close")
      pg.screenshot(path=SH + tag + "_3_sent.png")
      # --- Preview eindverslag with server door-list lag: door D3 must still be in the final
      db.lag = True; seed(pg, st(lang, "preview", dn="D3", text="slot hapert")); pg.wait_for_selector("#pvf:not([disabled])", timeout=20000)
      pg.evaluate("window.__open=[]"); pg.tap("#pvf"); pg.wait_for_selector("#fincount", timeout=30000)
      ids = pg.eval_on_selector_all(".dos [data-edit]", "l=>l.map(e=>e.dataset.edit)")
      chk("D3" in db.puts and "D3" in ids and not pg.evaluate("window.__open.length"), tag + ": Preview eindverslag sends/queues D3 first, D3 shown despite list lag " + str(ids))
      chk(pg.evaluate("JSON.parse(localStorage.getItem('oe_outbox_v1')||'[]').length") == 0, tag + ": outbox empty after preview")
      # --- offline: door stays queued and is still shown (local copy) + outbox warning
      db.offline = True; seed(pg, st(lang, "preview", dn="D4", text="offline deur")); pg.wait_for_selector("#pvf:not([disabled])", timeout=20000)
      pg.tap("#pvf"); pg.wait_for_selector("#fincount", timeout=60000)
      ids = pg.eval_on_selector_all(".dos [data-edit]", "l=>l.map(e=>e.dataset.edit)")
      chk("D4" in ids and pg.locator("#obxwarn").count() == 1 and pg.evaluate("JSON.parse(localStorage.getItem('oe_outbox_v1')||'[]').length") == 1, tag + ": offline: D4 kept in outbox and shown with warning " + str([ids, pg.locator("#obxwarn").count(), pg.evaluate("JSON.parse(localStorage.getItem('oe_outbox_v1')||'[]').length")]))
      db.offline = False; db.lag = False; db.vis |= set(db.ds); pg.evaluate("OE.outbox.flush()"); pg.wait_for_function("JSON.parse(localStorage.getItem('oe_outbox_v1')||'[]').length==0", timeout=15000)
      chk("D4" in db.puts, tag + ": D4 uploaded once online")
      # --- final: edit a door's text -> PUT -> back to final with new text
      pg.wait_for_timeout(1500); pg.evaluate("OE.mem.final=null;OE.mem.finalErr='';OE.S.screen='final';OE.save();OE.render(1)"); pg.wait_for_selector("#fincount", timeout=20000)
      pg.screenshot(path=SH + tag + "_4_final.png", full_page=True)
      pg.tap('[data-edit="D3"]'); pg.wait_for_selector("#ty")
      pg.tap("#nx"); pg.wait_for_selector("#inp"); pg.fill("#inp", "slot vervangen")
      for _ in range(12):
        if pg.locator("#pvf").count(): break
        pg.tap("#nx"); pg.wait_for_timeout(350)
      pg.wait_for_selector("#pvf:not([disabled])", timeout=20000)
      lbl = pg.inner_text("#pvf").strip(); chk(lbl == ("💾 Opslaan › eindverslag" if nl else "💾 Enregistrer › rapport final") and pg.locator("#snd").count() == 0, tag + ": edit preview shows only Save › final " + lbl)
      n0 = db.puts.count("D3"); pg.tap("#pvf"); pg.wait_for_selector("#fincount", timeout=30000)
      chk(db.puts.count("D3") == n0 + 1 and db.ds["D3"]["answers"][1]["text"] == "slot vervangen", tag + ": edit saved via dossier PUT")
      chk("slot vervangen" in pg.inner_text("#card"), tag + ": final shows edited text")
      # --- signer + all-in validation, then finish
      pg.fill("#sgn", ""); pg.tap("#snd"); pg.wait_for_timeout(200)
      chk(("ondertekenaar" if nl else "signataire") in pg.inner_text("#err"), tag + ": signer required")
      pg.fill("#sgn", "M. Janssens"); pg.tap("#snd"); pg.wait_for_timeout(200)
      chk(pg.inner_text("#err").find("binnen" if nl else "arrivés") >= 0, tag + ": 'all reports in' required")
      chk(pg.inner_text(".fsig").find("ServiceMax") >= 0 and pg.locator("canvas").count() == 0, tag + ": name only, no drawn signature")
      pg.check("#allin"); pg.screenshot(path=SH + tag + "_5_signer.png", full_page=True)
      pg.tap("#snd"); pg.wait_for_selector("#pdfok", timeout=40000)
      chk(db.signer == "M. Janssens" and db.pdf > 0 and not pg.evaluate("window.__sc.length"), tag + ": signer saved, PDF uploaded, no auto shortcut")
      pg.tap("#rsc"); pg.wait_for_timeout(200); chk(pg.evaluate("window.__sc.length") == 1, tag + ": ▶ Bewaar PDF starts the shortcut")
      pg.screenshot(path=SH + tag + "_6_pdf.png", full_page=True)
      chk(not errs, tag + ": no JS errors " + str(errs[:2]))
      c.close()
    br.close()
print("ALL OK" if ok else "SOME FAILED"); raise SystemExit(0 if ok else 1)
