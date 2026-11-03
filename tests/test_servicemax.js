"use strict";
var fs = require("fs"), vm = require("vm"), assert = require("assert"), path = require("path");
var sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "servicemax.js"), "utf8"), sandbox, { filename: "js/servicemax.js" });
var SM = sandbox.ServiceMax;
assert.ok(SM && SM.parse, "parser loaded");

var dutch = [
  "14104 uw",
  "Afspraak Et",
  "< wo-TEST0001 5",
  "Routebeschrijving ophalen",
  "TESTSTRAAT 1, TESTSTAD 1000, Belgium",
  "Werkordernummer",
  "wo-TEST0001",
  "Onderwerp",
  "Nummer: 000000000000000 || testonderwerp niet overnemen",
  "de testdeur. dit mag niet in het rapport",
  "Account",
  "TEST ACCOUNT NV",
  "Account geblokkeerd",
  "Nee",
  "Locatie",
  "TEST LOCATIE",
  "Geinstalleerd Product",
  "1P-00000001|TESTDEUR FTS-E02",
  "Test Persoon",
  "+32000000001",
  "Geprefereerde Starttijd",
  "01/01/2026 08:00",
  "Serviceplan",
  "BE - TEST CONTRACT",
  "Ma Vid WEG, Vn ob"].join("\n");

var got = SM.parse(dutch);
assert.strictEqual(got.wo, "WO-TEST0001");
assert.strictEqual(got.account, "TEST ACCOUNT NV");
assert.strictEqual(got.adres, "TESTSTRAAT 1, TESTSTAD 1000, Belgium");
assert.strictEqual(got.contact, "Test Persoon +32000000001");
assert.strictEqual(got.product, "IP-00000001|TESTDEUR FTS-E02");
assert.ok(JSON.stringify(got).indexOf("niet overnemen") < 0, "subject must not be extracted");
assert.ok(JSON.stringify(got).indexOf("TEST LOCATIE") < 0, "location is not the account or contact");
assert.ok(JSON.stringify(got).indexOf("Nee") < 0, "blocked-account value is not the account");

var messy = SM.parse([
  "Routebeschrijvlng ophalen",
  "TESTSTRAAT 9,",
  "TESTSTAD 2000, Belgium",
  "Werkordernummer",
  "W0-TEST0002",
  "Accoun t",
  "TEST ACCOUNT NV",
  "Account geblokkeerd",
  "Ja",
  "Geïnstalleerd Product",
  "IP-00000002lTESTDEUR FTS-E02",
  "Test Persoon",
  "+32 000 00 00 02"].join("\n"));
assert.strictEqual(messy.wo, "WO-TEST0002");
assert.strictEqual(messy.account, "TEST ACCOUNT NV");
assert.strictEqual(messy.adres, "TESTSTRAAT 9, TESTSTAD 2000, Belgium");
assert.strictEqual(messy.contact, "Test Persoon +32000000002");
assert.strictEqual(messy.product, "IP-00000002|TESTDEUR FTS-E02");

var fr = SM.parse([
  "Obtenir l'itinéraire",
  "RUE TEST 2, LIEGE 4000, Belgium",
  "Numéro d'ordre de travail",
  "WO-TEST0003",
  "Objet",
  "Sujet à ignorer complètement",
  "Compte bloqué",
  "Non",
  "Compte",
  "COMPTE TEST SA",
  "Produit installé",
  "IP-00000003|PORTE TEST",
  "Alex Test",
  "+32 470 00 00 03"].join("\n"));
assert.strictEqual(fr.wo, "WO-TEST0003");
assert.strictEqual(fr.account, "COMPTE TEST SA");
assert.strictEqual(fr.adres, "RUE TEST 2, LIEGE 4000, Belgium");
assert.strictEqual(fr.contact, "Alex Test +32470000003");
assert.strictEqual(fr.product, "IP-00000003|PORTE TEST");
assert.ok(JSON.stringify(fr).indexOf("ignorer") < 0);
assert.strictEqual(fr.account !== "Non", true);

var top = [
  "Werkordernummer",
  "WO-TEST0004",
  "Account",
  "TEST ACCOUNT NV",
  "Account geblokkeerd",
  "Nee",
  "Geinstalleerd Product"].join("\n");
var bottom = [
  "Account geblokkeerd",
  "Nee",
  "Geïnstalleerd Product",
  "1P-00000004|TESTDEUR",
  "Test Persoon",
  "+32000000004"].join("\n");
var merged = SM.merge([top, bottom]);
assert.strictEqual(merged.split("\n").filter(function (l) { return SM.lines(l)[0] === "Nee"; }).length, 1);
var both = SM.parse(merged);
assert.strictEqual(both.wo, "WO-TEST0004");
assert.strictEqual(both.account, "TEST ACCOUNT NV");
assert.strictEqual(both.product, "IP-00000004|TESTDEUR");
assert.strictEqual(both.contact, "Test Persoon +32000000004");

var block = SM.formatBlock("nl", got);
assert.ok(block.indexOf("Klantgegevens") === 0);
assert.ok(block.indexOf("Werkordernummer: WO-TEST0001") >= 0);
assert.ok(block.indexOf("Geïnstalleerd product: IP-00000001|TESTDEUR FTS-E02") >= 0);
assert.strictEqual(SM.dossierFrom(got), "IP-00000001|TESTDEUR FTS-E02");
assert.ok(SM.dossierFrom(got).indexOf("WO-TEST") < 0, "dossier field is the product, not the work order");
assert.strictEqual(SM.dossierFrom({ wo: "WO-TEST0009", product: "  IP-00000009|TESTDEUR  " }), "IP-00000009|TESTDEUR");
assert.strictEqual(SM.dossierFrom({ wo: "WO-TEST0009", product: "" }), "");
assert.strictEqual(SM.dossierFrom({ wo: "WO-TEST0009", product: "WO-TEST0009" }), "");
assert.strictEqual(SM.q1OnLoad("WO-TEST0008", { wo: "WO-TEST0008", product: "IP-00000008|TESTDEUR" }), "IP-00000008|TESTDEUR");
assert.strictEqual(SM.q1OnLoad("WO-TEST0008", { wo: "WO-TEST0008", product: "" }), "");
assert.strictEqual(SM.q1OnLoad("", { wo: "WO-TEST0008", product: "IP-00000008|TESTDEUR" }), "IP-00000008|TESTDEUR");
assert.strictEqual(SM.q1OnLoad("handmatig dossier", { wo: "WO-TEST0008", product: "IP-00000008|TESTDEUR" }), "handmatig dossier");
assert.strictEqual(SM.version, "v2026.11.03-1");
["index.html", "sw.js", "js/app.js", "js/servicemax.js"].forEach(function (f) {
  var src = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
  assert.ok(src.indexOf("v2026.11.03-1") >= 0, f + " missing version");
});
var sw = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8");
assert.ok(sw.indexOf("skipWaiting") >= 0);
assert.ok(sw.indexOf("clients.claim") >= 0);
assert.ok(sw.indexOf("onderhoud-" + SM.version) >= 0);
assert.ok(/fetch\(req\)/.test(sw), "shell requests are network-first");
assert.ok(!/\.css/i.test(sw.slice(sw.indexOf("function isShell"))), "network-first shell is html/js, not css");
var frBlock = SM.formatBlock("fr", fr);
assert.ok(frBlock.indexOf("Données client") === 0);
assert.ok(frBlock.indexOf("Numéro d'ordre de travail: WO-TEST0003") >= 0);
assert.ok(frBlock.indexOf("Produit installé: IP-00000003|PORTE TEST") >= 0);
assert.strictEqual(SM.formatBlock("nl", SM.blank()), "");

assert.strictEqual(SM.labels.nl.scan, "Screenshot ServiceMax inlezen");
assert.strictEqual(SM.labels.fr.scan, "Lire capture ServiceMax");
assert.strictEqual(SM.labels.nl.take, "Overnemen");
assert.strictEqual(SM.labels.fr.take, "Reprendre");

var sample = SM.parse([
  "Routebeschrijving ophalen",
  "TESTSTRAAT 7, TESTSTAD 9000, Belgium",
  "Werkordernummer",
  "WO-TEST145839",
  "Onderwerp",
  "dit onderwerp mag niet mee",
  "Account",
  "TEST ACCOUNT NV",
  "Geïnstalleerd product",
  "1P-00767007|KENTAUR FTS-E02",
  "Test Persoon",
  "+32000000007"].join("\n"));
assert.strictEqual(sample.wo, "WO-TEST145839");
assert.strictEqual(sample.product, "IP-00767007|KENTAUR FTS-E02");
assert.strictEqual(SM.dossierFrom(sample), "IP-00767007|KENTAUR FTS-E02");
assert.ok(JSON.stringify(sample).indexOf("onderwerp") < 0);

console.log("servicemax tests ok");
