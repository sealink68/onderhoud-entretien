# Opdracht „Onderhoud_Entretien” maken (iOS-app Opdrachten)

> **Sneller: installeer de kant-en-klare opdracht** in plaats van ze zelf te bouwen:
> https://www.icloud.com/shortcuts/527981a49cbd4cb09a70e05ca6661274
> (ook via de knop **1. Installeer de opdracht** in de app, en later via **⚙ Instellingen technieker**).
> Deze versie maakt bij `setup` ook de extra map **iCloud Drive › Rapport › Depannage** aan (voor een latere uitbreiding van Werkrapport).
> Tik op *Voeg opdracht toe*. Controleer daarna in de acties *Maak map aan* en *Bewaar bestand* of de locatie
> op **iCloud Drive** staat (aanbevolen: werkt op iPhone én iPad). Kies ze anders één keer opnieuw. De rest van deze handleiding is alleen nodig om ze zelf te bouwen.

De web-app start deze opdracht op twee manieren:

| Moment | URL die de app opent | Invoer |
|---|---|---|
| Eerste start (knop *Start* bij de technieker) | `shortcuts://run-shortcut?name=Onderhoud_Entretien&input=text&text=setup` | `setup` |
| Eindverslag WO verstuurd | `shortcuts://run-shortcut?name=Onderhoud_Entretien&input=text&text=WO-12345` | het WO-nummer |

Bij `setup` maakt de opdracht alleen de mappen aan (`Rapport`, `Rapport/Onderhoud_Entretien` en, in de kant-en-klare opdracht, ook `Rapport/Depannage`). Bij een WO-nummer downloadt ze
`https://onderhoud-api.sealink68.workers.dev/wo/<WO>/pdf` en bewaart ze die als
`Rapport/Onderhoud_Entretien/OC_<WO>.pdf`.

> Over de namen: de Nederlandse namen van de acties verschillen soms een beetje tussen iOS-versies.
> Daarom staat de Engelse naam er telkens tussen haakjes bij. Typ in het zoekveld
> *Zoek naar apps en acties* een deel van de naam (bv. „URL”, „bestand”, „map”).

## 1. Nieuwe opdracht

1. Open **Opdrachten** → tabblad **Opdrachten** → **+** (rechtsboven).
2. Tik bovenaan op de naam → **Wijzig naam** → typ exact `Onderhoud_Entretien`. Hoofdletters en de underscore moeten kloppen, anders vindt de app de opdracht niet.
3. Tik op het **ⓘ-pictogram / de pijl naast de naam** → zet **Toon in deelpaneel** aan. Er verschijnt een eerste blok **Ontvang … invoer van Deelpaneel** (*Receive input from Share Sheet*).
   Tik in dat blok op het invoertype en laat alleen **Tekst** aangevinkt. Zet de optie **Indien geen invoer** op **Ga door**.
   *(De invoer van de `shortcuts://`-link komt binnen als de variabele **Opdrachtinvoer** (*Shortcut Input*).)*

## 2. Tak „setup”: alleen mappen aanmaken

4. Voeg de actie **Als** (*If*) toe.
   - Eerste veld: kies de variabele **Opdrachtinvoer**.
   - Voorwaarde: **is**.
   - Tekst: `setup` (kleine letters).
5. Sleep tussen **Als** en **Anders** de actie **Maak map aan** (*Create Folder*).
   - Tik op de locatie en kies **iCloud Drive** (de hoofdmap). **Aanbevolen**: zo werkt de opdracht op iPhone én iPad. Gebruik *Op mijn iPhone* liever niet: die locatie is aan één toestel gebonden en bestaat niet op een iPad.
   - Pad: `Rapport`
6. Voeg daaronder nog een **Maak map aan** toe, zelfde locatie, pad: `Rapport/Onderhoud_Entretien`.
   Optioneel (zoals in de kant-en-klare opdracht): nog een **Maak map aan**, pad `Rapport/Depannage` (voor een latere uitbreiding van Werkrapport).
7. Optioneel: **Toon melding** (*Show Notification*) met de tekst `Mappen klaar / Dossiers prêts`.
8. Voeg als laatste in deze tak **Stop deze opdracht** (*Stop This Shortcut*) toe.

## 3. Tak „Anders”: PDF ophalen en bewaren

9. Zet tussen **Anders** en **Einde als** de actie **URL**. Typ:
   `https://onderhoud-api.sealink68.workers.dev/wo/` → voeg de variabele **Opdrachtinvoer** in → typ verder `/pdf`.
   Resultaat: `https://onderhoud-api.sealink68.workers.dev/wo/[Opdrachtinvoer]/pdf`
10. Voeg **Haal inhoud van URL op** (*Get Contents of URL*) toe. De invoer is automatisch de URL hierboven. Laat de methode op **GET** staan.
11. Voeg **Wijzig naam** / **Stel naam in** (*Set Name*) toe:
    - Wat: **Inhoud van URL**.
    - Naam: `OC_` + variabele **Opdrachtinvoer** + `.pdf`  →  `OC_[Opdrachtinvoer].pdf`
12. Voeg **Bewaar bestand** (*Save File*) toe:
    - Bestand: het resultaat van stap 11 (**Bestand met naam** / *Renamed Item*).
    - Tik op **Toon meer** (pijltje).
    - **Vraag waar te bewaren** (*Ask Where to Save*): **UIT**.
    - Bestemming/map: tik op de map (standaard *Opdrachten*) en kies dezelfde locatie als in stap 5: **iCloud Drive** (de hoofdmap, niet *Op mijn iPhone*).
    - **Subpad** (*Subpath*): `Rapport/Onderhoud_Entretien/`
    - **Vervang bestaande bestanden** / **Overschrijf als bestand bestaat** (*Overwrite If File Exists*): **AAN**.
13. Optioneel: **Toon melding** met `OC_[Opdrachtinvoer].pdf bewaard`.
14. Als laatste actie van de tak *Anders* (na *Bewaar bestand*, vóór *Einde als*): **Open app** (*Open App*) → kies **Go** (ServiceMax Go). Zo kom je na het bewaren meteen terug in ServiceMax. Deze stap hoort **niet** in de tak *setup*. *(Alternatief: **Open URL's** met `https://go.servicemax.io`.)*

De opdracht ziet er dan zo uit:

```
Ontvang Tekst-invoer van Deelpaneel (indien geen invoer: Ga door)
Als  Opdrachtinvoer  is  setup
    Maak map aan  Rapport               (iCloud Drive)
    Maak map aan  Rapport/Onderhoud_Entretien
    Maak map aan  Rapport/Depannage     (kant-en-klare opdracht; voor Werkrapport)
    Toon melding  Mappen klaar
    Stop deze opdracht
Anders
    URL  https://onderhoud-api.sealink68.workers.dev/wo/[Opdrachtinvoer]/pdf
    Haal inhoud van URL op
    Stel naam in  Inhoud van URL  →  OC_[Opdrachtinvoer].pdf
    Bewaar bestand  (Vraag waar: uit · Subpad: Rapport/Onderhoud_Entretien/ · Overschrijven: aan)
    Toon melding  OC_[Opdrachtinvoer].pdf bewaard
    Open app  Go (ServiceMax)
Einde als
```

## 4. Testen

1. Tik op ▶ in de opdracht. Kies bij de vraag om invoer niets: de opdracht volgt de tak *Anders* en geeft een fout (geen WO). Dat is normaal.
2. Open in Safari `shortcuts://run-shortcut?name=Onderhoud_Entretien&input=text&text=setup`. Kijk in **Bestanden** of `Rapport/Onderhoud_Entretien` bestaat.
3. Verstuur in de app een eindverslag. De opdracht start en `OC_WO-….pdf` verschijnt in de map. Opnieuw versturen overschrijft het bestand.

## Opmerkingen

- Alle drie de locaties (2× *Maak map aan* en *Bewaar bestand*) moeten **iCloud Drive** zijn. Op iPad bestaat *Op mijn iPhone* niet; een actie die daar nog naar wijst, mislukt.

- De eerste keer vraagt iOS toestemming: „Onderhoud_Entretien wil verbinding maken met onderhoud-api.sealink68.workers.dev” en „… wil toegang tot bestanden”. Kies **Sta altijd toe**.
- Bestaat de map al, dan kan **Maak map aan** een melding geven bij een nieuwe *setup*. Dat is onschuldig, want de tak stopt daarna toch.
- Werkt de opdracht niet, dan blijft in de app de knop **⬇ PDF downloaden / delen** beschikbaar. Daarmee bewaar je de PDF manueel via het deelpaneel → *Bewaar in Bestanden*.
