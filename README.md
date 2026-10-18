# Onderhoud_Entretien

Web-app (NL/FR) voor onderhoudsverslagen van dormakaba-deurtechniekers in België.
Zuster-app van [Werkrapport](https://sealink68.github.io/werkrapport/), met dezelfde look & feel.

**Live (na publicatie):** https://sealink68.github.io/onderhoud-entretien/
**iOS-opdrachten installeren** (ook via de knop *1. Installeer de opdracht* in de app, die zelf het toestel herkent):

| Toestel | Naam opdracht | Installatielink | Bewaart in |
|---|---|---|---|
| iPhone | `OC_Iphone` | https://www.icloud.com/shortcuts/6996453996e64d18818c3d3bda1a5fab | **Op mijn iPhone › Rapport › Onderhoud_Entretien** |
| iPad | `OC_Ipad` | https://www.icloud.com/shortcuts/05201aff0eb94a7088bff5e1c2c75edc | **Op mijn iPad › Rapport › Onderhoud_Entretien** |

De opdrachten bewaren de PDF **lokaal op het toestel** en niet meer in iCloud Drive, omdat ServiceMax Go op beheerde toestellen iCloud Drive niet ziet. Bij `setup` maken ze ook de map **Rapport › Depannage** aan (voor een latere uitbreiding van Werkrapport). Na het bewaren opent de opdracht ServiceMax Go. In ServiceMax voeg je de PDF toe via **Blader › Locaties › Op mijn iPhone/iPad › Rapport › Onderhoud_Entretien**. Tip: markeer die map één keer als favoriet in **Bestanden** (vinger op de map houden › *Voeg toe aan favorieten*).

**Toestelherkenning** (`OE.deviceKind()` in `js/platform.js`): iPad = `iPad` in de user agent, óf een Mac-UA/`navigator.platform === "MacIntel"` met `navigator.maxTouchPoints > 1` (iPadOS-Safari doet zich als Mac voor); iPhone = `iPhone`/`iPod` in de UA. Andere toestellen (desktop, Android) gebruiken de iPhone-opdracht om te starten; het techniekerscherm toont daar beide installatieknoppen (iPhone en iPad).

**Wie al een oudere opdracht heeft** (`Onderhoud_Entretien`, bewaarde in iCloud Drive): installeer één keer de nieuwe opdracht via *1. Installeer de opdracht*, tik daarna op *Start* (⚙ Instellingen technieker › *2. Start*) om de mappen aan te maken. De oude opdracht `Onderhoud_Entretien` mag je verwijderen.

**Backend:** Cloudflare Worker `onderhoud-api` → https://onderhoud-api.sealink68.workers.dev (bron in `../onderhoud-api/`)

## Verloop

1. Taalkeuze NL / FR.
2. Eenmalig: voornaam + achternaam van de technieker. Stap *1. Installeer de opdracht* opent de installatielink van de opdracht voor dit toestel (iPhone of iPad), stap *2. Start* bewaart de naam. De initialen worden daaruit afgeleid. *Start* bewaart je naam en start de iOS-opdracht met `setup` om de mappen aan te maken. Aanpassen kan later via **⚙ Instellingen technieker**.
3. Keuze: 1 toestel of meerdere toestellen. Beide keuzes volgen hetzelfde verloop; de keuze wordt alleen bewaard.
4. Werkorder: kies een bestaande WO (lijst van de worker) of maak een nieuwe aan (prefix `WO-` wordt afgedwongen). Vul daarna het dossiernummer in.
5. Acht stellingen, elk standaard **Juist**. Kies je **Niet juist**, dan verschijnt de juiste invulling: een beschrijving, een vaste tekst of *revisit*. Bij stelling 1 is minstens één foto verplicht. Na elke foto (camera of bibliotheek) opent meteen een tekeneditor op volledig scherm (pijl, cirkel/ellips, rechthoek, vrij tekenen, maatlijn met label, tekst; 5 kleuren, 3 diktes, ongedaan maken, alles wissen, Annuleren/Klaar), daarna een optionele korte beschrijving (max. 150 tekens). Alleen de bewerkte versie wordt bewaard (max. 2000 px lange zijde, JPEG ±0.85) met de naam `<WO>_<dossier>_<n>.jpg`; de beschrijving staat in het dossier (`answers[i].photoDesc`) en komt, automatisch vertaald, onder de foto in de PDF. De revisit-zin staat maar één keer per dossier in het verslag.
6. Extra informatie (optioneel), daarna een voorbeeld met automatische vertaling. Vanuit het voorbeeld verstuur je het dossier naar centraal.
6b. *Verstuur naar centraal* zet het dossier (met foto's) in een **outbox** op het toestel en opent meteen ServiceMax Go (in dezelfde tik). Het opladen loopt verder op de achtergrond en wordt automatisch opnieuw geprobeerd (bij opstarten, terugkeren naar de app, internet terug, elke 20 s) tot de server het bevestigt. Bovenaan staat dan “1 dossier wacht op verzending” of “Verzonden ✓”. Het eindverslag waarschuwt als er op dit toestel nog dossiers wachten.
7. Drie keuzes: **Nieuw dossier**, **Eindverslag WO** of **Sluiten app**. *Sluiten app* zet de app terug op de startpagina en opent ServiceMax Go.
8. **Eindverslag WO**: toont alle dossiers van alle techniekers. Elk dossier kun je bewerken en opnieuw versturen. Bij **Verstuur** volgt eerst een bevestiging, daarna:
   - wordt de korte samenvatting (NL + FR) naar het klembord gekopieerd;
   - wordt één tweetalige PDF gemaakt (jsPDF) en opgeladen naar `/wo/<WO>/pdf`;
   - wordt de opdracht van dit toestel gestart: `shortcuts://run-shortcut?name=OC_Iphone&input=text&text=<WO>` (iPad: `name=OC_Ipad`; naam en WO URL-gecodeerd);
   - blijven er reserveknoppen beschikbaar: opdracht opnieuw starten, PDF downloaden/delen en samenvatting opnieuw kopiëren.

Alles wat je aan het invullen bent, wordt in `localStorage` bewaard. Herladen kost dus niets.

## Structuur

```
index.html              opmaak + volgorde van de scripts (geen build-stap)
css/style.css           stijl (Werkrapport-basis + uitbreidingen)
js/config.js            ALLE teksten NL/FR: stellingen, vaste teksten, labels, samenvatting, PDF + endpoints
js/i18n.js              taalhulpjes, initialen
js/storage.js           localStorage-status (instellingen + lopend dossier)
js/api.js               calls naar de worker
js/translate.js         vertaling (werkrapport-translate proxy, terugval op MyMemory)
js/photos.js            verkleinen/benoemen/opladen van foto's
js/outbox.js            persistente verzendwachtrij (outbox) + status
js/report.js            dossier → rijen/tekst per taal (revisit één keer)
js/summary.js           korte klembord-samenvatting
js/pdf.js               tweetalige WO-PDF
js/platform.js          toestelherkenning (iPhone/iPad), installatietip, klembord, ServiceMax Go, iOS-opdracht, delen/downloaden
js/ui/common.js         render-frame, header, popup
js/ui/screens.js        alle schermen
js/app.js               opstart
js/vendor/jspdf.umd.min.js  jsPDF 4.2.1 (MIT, zie jspdf.LICENSE)
icon.svg, icon-*.png, apple-touch-icon.png, favicon.ico, manifest.webmanifest
SHORTCUT.md             handleiding om de iOS-opdrachten (OC_Iphone/OC_Ipad) te maken
screens/                schermafbeeldingen + voorbeeld-PDF/samenvatting uit de test
```

Teksten aanpassen doe je **alleen in `js/config.js`**.

## Backend-endpoints (geen authenticatie, met opzet)

| Methode | Pad | Doel |
|---|---|---|
| GET | `/wos` | recente/open WO's (laatste 60 dagen, max. 100) |
| POST | `/wo` `{wo}` | WO aanmaken (idempotent) |
| GET | `/wo/<WO>` | WO met alle dossiers |
| PUT | `/wo/<WO>/dossier/<DN>` | dossier aanmaken/overschrijven (max. 256 KB JSON) |
| GET/DELETE | `/wo/<WO>/dossier/<DN>` | dossier lezen/verwijderen |
| PUT/GET | `/wo/<WO>/photo/<naam>.jpg` | foto (JPEG, max. 3 MB, max. 200 per WO) |
| PUT/GET | `/wo/<WO>/pdf` | eind-PDF (max. 24 MB). GET is publiek en stabiel (wordt door de opdracht gebruikt) |

CORS: `https://sealink68.github.io` en `http://localhost:*`. Verzoeken zonder `Origin` (curl, iOS-opdracht) zijn toegestaan.
Limiet per IP: 300 leesverzoeken en 120 schrijfverzoeken per minuut. Opslag gebeurt in KV, omdat R2 niet geactiveerd is op het account.

## Publiceren

Maak de repo `sealink68/onderhoud-entretien` aan en push `main`. De workflow `.github/workflows/pages.yml` publiceert de site.
Kies eventueel bij **Settings → Pages → Source** de optie **GitHub Actions**.

## Testen

`/workspace/test_onderhoud.py` (Playwright, headless Chromium, 390×844) doorloopt het volledige verloop met 2 dossiers.
Serveer de map eerst lokaal, bv. `python3 -m http.server 8817 --bind 127.0.0.1`.
`tests/test_annot.py` test de foto-editor en de fotobeschrijving (iPhone 13 portret/landschap en iPad, backend en vertaling volledig gemockt) en schrijft screenshots naar `screens_annot/`.
