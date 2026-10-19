"""Clipboard summary: first line of NL and FR block = total door count. No backend needed.
Run: python3 -m http.server 8817 --bind 127.0.0.1 & ; /workspace/pwenv/bin/python tests/test_summary.py"""
from playwright.sync_api import sync_playwright
ok = True
def chk(c, m):
  global ok; print(("PASS " if c else "FAIL ") + m); ok &= bool(c)
with sync_playwright() as p:
  b = p.chromium.launch()
  for name, vp in (("iphone", (390, 844)), ("ipad", (820, 1180))):
    pg = b.new_page(viewport={"width": vp[0], "height": vp[1]}); pg.route("**workers.dev/**", lambda r: r.abort())
    pg.add_init_script("localStorage.setItem('oe_tip_hide',String(Date.now()+9e9))"); pg.goto("http://localhost:8817/index.html"); pg.wait_for_load_state("load")
    for n, rem in ((1, 0), (3, 1), (3, 3)):
      s = pg.evaluate("""([n,rem])=>{var A=OE.QUESTIONS.map(function(){return {ok:true,text:'',photos:[]}});
        var ds=[];for(var i=0;i<n;i++){var a=JSON.parse(JSON.stringify(A));if(i<rem)a[1]={ok:false,text:'x',photos:[]};ds.push({dossier:'D'+(i+1),answers:a,extra:'',lang:'nl'})}
        return OE.buildSummary(ds,'WO-TEST-SUM','Klant')}""", [n, rem])
      nl, fr = s.split("\n\n" + pg.evaluate("OE.CFG.SEP") + "\n\n")
      chk(nl.split("\n")[0] == "Aantal toestellen: %d" % n, f"{name} n={n} rem={rem}: NL first line {nl.splitlines()[0]!r}")
      chk(fr.split("\n")[0] == "Nombre d’appareils : %d" % n, f"{name} n={n} rem={rem}: FR first line {fr.splitlines()[0]!r}")
      chk(all("D%d" % (i + 1) in nl and "D%d" % (i + 1) in fr for i in range(n)) and "Ondertekenaar: Klant" in nl and "Signataire : Klant" in fr and "/wo/WO-TEST-SUM/pdf" in fr, f"{name} n={n}: rest of format kept")
    chk(pg.evaluate("OE.buildSummary([], 'WO-TEST-SUM', '')") == "", name + ": empty WO -> empty summary")
  b.close()
print("ALL OK" if ok else "SOME FAILED"); raise SystemExit(0 if ok else 1)
