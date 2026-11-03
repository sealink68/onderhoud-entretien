"use strict";
var fs = require("fs"), vm = require("vm"), assert = require("assert"), path = require("path");
var sandbox = { window: { OE: {} }, navigator: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)", platform: "iPhone", maxTouchPoints: 5 } };
sandbox.window.OE.CFG = { WO_PREFIX: "WO-", SHORTCUT_NAME_IPHONE: "OC_Iphone", SHORTCUT_NAME_IPAD: "OC_Ipad" };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "photos.js"), "utf8"), sandbox, { filename: "js/photos.js" });
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "platform.js"), "utf8"), sandbox, { filename: "js/platform.js" });
var OE = sandbox.window.OE;

assert.strictEqual(OE.safeFile("IP-00767007|KENTAUR FTS-E02"), "IP-00767007_KENTAUR FTS-E02");
assert.strictEqual(OE.safeFile(' a/b\\c:d*e?f"g<h>i|j '), "a_b_c_d_e_f_g_h_i_j");
assert.strictEqual(OE.safeFile("foo..."), "foo");
assert.strictEqual(OE.safeFile("  ..bar..  "), "bar");
assert.strictEqual(OE.safeFile("a||b"), "a_b");
assert.strictEqual(OE.safeFile("ü (ok)"), "ü (ok)");
assert.strictEqual(OE.safeFile("\u0001hide\u007F"), "hide");

assert.strictEqual(OE.fileToken("IP-00767007|KENTAUR FTS-E02"), "IP-00767007_KENTAUR_FTS-E02");
assert.strictEqual(OE.fileToken("WO-00536220"), "WO-00536220");
assert.strictEqual(OE.fileToken("WO-TEST0001"), "WO-TEST0001");
assert.strictEqual(OE.fileToken("  |  "), "");
assert.strictEqual(OE.fileToken(""), "");

sandbox.window.OE.S = { wo: "", woIsNew: true, woNewTxt: "00536220", client: { wo: "WO-OLD" } };
sandbox.window.OE.mem = {};
assert.strictEqual(OE.shortcutWO(), "WO-00536220");
sandbox.window.OE.S.wo = "WO-00536220";
sandbox.window.OE.S.woIsNew = false;
assert.strictEqual(OE.shortcutUrl("WO-00536220"), "shortcuts://run-shortcut?name=OC_Iphone&input=text&text=WO-00536220");
assert.strictEqual(OE.shortcutUrl("IP-00767007|KENTAUR FTS-E02"), "shortcuts://run-shortcut?name=OC_Iphone&input=text&text=IP-00767007_KENTAUR_FTS-E02");
assert.strictEqual(OE.shortcutUrl("setup"), "shortcuts://run-shortcut?name=OC_Iphone&input=text&text=setup");
assert.strictEqual(OE.shortcutUrl(""), "shortcuts://run-shortcut?name=OC_Iphone");
assert.ok(OE.shortcutUrl("WO-00536220").indexOf("|") < 0);
assert.ok(OE.shortcutUrl("WO-00536220").indexOf("OC_.pdf") < 0);

console.log("safefile tests ok");
