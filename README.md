# Onderhoud_Entretien

Web-app (NL/FR) voor onderhoudsverslagen van dormakaba-deurtechniekers in België.
Zuster-app van [Werkrapport](https://sealink68.github.io/werkrapport/), met dezelfde look & feel.

**Live (na publicatie):** https://sealink68.github.io/onderhoud-entretien/
**iOS-opdracht installeren:** https://www.icloud.com/shortcuts/ae5ae596ed7d4671870b9b685ba90f43 (ook via de knop *1. Installeer de opdracht* in de app). De opdracht bewaart in **iCloud Drive › Rapport › Onderhoud_Entretien**: aanbevolen, werkt op iPhone én iPad. Na het bewaren opent de opdracht de app ServiceMax Go.
**Backend:** Cloudflare Worker `onderhoud-api` → https://onderhoud-api.sealink68.workers.dev (bron in `../onderhoud-api/`)

## Verloop

1. Taalkeuze NL / FR.
2. Eenmalig: voornaam + achternaam van de technieker. Stap *1. Installeer de opdracht* opent de iCloud-link van de opdracht, stap *2. Start* bewaart de naam. De initialen worden daaruit afgeleid. *Start* bewaart je naam en start de iOS-opdracht met `setup` om de mappen aan te maken. Aanpassen kan later via **⚙ Instellingen technieker**.
3. Keuze: 1 toestel of meerdere toestellen. Beide keuzes volgen hetzelfde verloop; de keuze wordt alleen bewaard.
4. Werkorder: kies een bestaande WO (lijst van de worker) of maak een nieuwe aan (prefix `WO-` wordt afgedwongen). Vul daarna het dossiernummer in.
5. Acht stellingen, elk standaard **Juist**. Kies je **Niet juist**, dan verschijnt de juiste invulling: een beschrijving, een vaste tekst of *revisit*. Bij stelling 1 is minstens één foto verplicht. Foto's worden verkleind tot ±1280 px (JPEG, kwaliteit 0.7) en krijgen de naam `<WO>_<dossier>_<n>.jpg`. De revisit-zin staat maar één keer per dossier in het verslag.
6. Extra informatie (optioneel), daarna een voorbeeld met automatische vertaling. Vanuit het voorbeeld verstuur je het dossier naar centraal.
6b. *Verstuur naar centraal* zet het dossier (met foto's) in een **outbox** op het toestel en opent meteen ServiceMax Go (in dezelfde tik). Het opladen loopt verder op de achtergrond en wordt automatisch opnieuw geprobeerd (bij opstarten, terugkeren naar de app, internet terug, elke 20 s) tot de server het bevestigt. Bovenaan staat dan “1 dossier wacht op verzending” of “Verzonden ✓”. Het eindverslag waarschuwt als er op dit toestel nog dossiers wachten.
7. Drie keuzes: **Nieuw dossier**, **Eindverslag WO** of **Sluiten app**. *Sluiten app* zet de app terug op de startpagina en opent ServiceMax Go.
8. **Eindverslag WO**: toont alle dossiers van alle techniekers. Elk dossier kun je bewerken en opnieuw versturen. Bij **Verstuur** volgt eerst een bevestiging, daarna:
   - wordt de korte samenvatting (NL + FR) naar het klembord gekopieerd;
   - wordt één tweetalige PDF gemaakt (jsPDF) en opgeladen naar `/wo/<WO>/pdf`;
   - wordt de opdracht gestart: `shortcuts://run-shortcut?name=Onderhoud_Entretien&input=text&text=<WO>`;
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
js/platform.js          installatietip, klembord, ServiceMax Go, iOS-opdracht, delen/downloaden
js/ui/common.js         render-frame, header, popup
js/ui/screens.js        alle schermen
js/app.js               opstart
js/vendor/jspdf.umd.min.js  jsPDF 4.2.1 (MIT, zie jspdf.LICENSE)
icon.svg, icon-*.png, apple-touch-icon.png, favicon.ico, manifest.webmanifest
SHORTCUT.md             handleiding om de iOS-opdracht te maken
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
