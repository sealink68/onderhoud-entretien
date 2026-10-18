# Opdrachten „OC_Iphone” en „OC_Ipad” maken (iOS-app Opdrachten)

Er zijn **twee opdrachten**, één per toestel. Ze doen hetzelfde, maar bewaren de PDF **lokaal op het toestel**
(niet meer in iCloud Drive: ServiceMax Go op beheerde toestellen ziet iCloud Drive niet).

| Toestel | Naam (exact) | Kant-en-klare opdracht | Bewaart in |
|---|---|---|---|
| iPhone | `OC_Iphone` | https://www.icloud.com/shortcuts/6996453996e64d18818c3d3bda1a5fab | **Op mijn iPhone › Rapport › Onderhoud_Entretien** |
| iPad | `OC_Ipad` | https://www.icloud.com/shortcuts/05201aff0eb94a7088bff5e1c2c75edc | **Op mijn iPad › Rapport › Onderhoud_Entretien** |

> **Sneller: installeer de kant-en-klare opdracht** in plaats van ze zelf te bouwen. De knop **1. Installeer de opdracht**
> in de app (ook later via **⚙ Instellingen technieker**) herkent het toestel en opent de juiste link; op een computer of
> Android-toestel toont de app beide knoppen. Tik op *Voeg opdracht toe*. Bij `setup` maken beide opdrachten ook de map
> **Rapport › Depannage** aan (voor een latere uitbreiding van Werkrapport).
>
> **Had je al de oudere opdracht `Onderhoud_Entretien`** (bewaarde in iCloud Drive)? Installeer dan één keer de nieuwe
> opdracht voor je toestel en tik op **2. Start** om de mappen aan te maken. De oude opdracht `Onderhoud_Entretien` mag je
> verwijderen (Opdrachten › vinger op de opdracht houden › *Verwijder*).

De web-app start de opdracht van het toestel op twee manieren (naam en invoer URL-gecodeerd):

| Moment | URL die de app opent (iPhone; iPad: `name=OC_Ipad`) | Invoer |
|---|---|---|
| Eerste start (knop *Start* bij de technieker) | `shortcuts://run-shortcut?name=OC_Iphone&input=text&text=setup` | `setup` |
| Eindverslag WO verstuurd | `shortcuts://run-shortcut?name=OC_Iphone&input=text&text=WO-12345` | het WO-nummer |

Toestelherkenning in de app: iPad = `iPad` in de user agent, óf een Mac-user-agent/`MacIntel` met touch (`maxTouchPoints > 1`, iPadOS-Safari);
iPhone = `iPhone`/`iPod`; andere toestellen gebruiken `OC_Iphone`.

Bij `setup` maakt de opdracht alleen de mappen aan (`Rapport`, `Rapport/Onderhoud_Entretien` en `Rapport/Depannage`). Bij een WO-nummer downloadt ze
`https://onderhoud-api.sealink68.workers.dev/wo/<WO>/pdf`, bewaart ze die als
`Rapport/Onderhoud_Entretien/OC_<WO>.pdf` en opent ze ServiceMax Go.

## PDF toevoegen in ServiceMax

In ServiceMax Go voeg je het document toe via **Blader › Locaties › Op mijn iPhone** (of **Op mijn iPad**) **› Rapport › Onderhoud_Entretien**.
**Tip:** markeer die map één keer als favoriet in de app **Bestanden**: houd je vinger op de map › **Voeg toe aan favorieten**
(FR: *Ajouter aux favoris*). Dan staat ze bij *Favorieten* en vind je ze sneller.

> Over de namen: de Nederlandse namen van de acties verschillen soms een beetje tussen iOS-versies.
> Daarom staat de Engelse naam er telkens tussen haakjes bij. Typ in het zoekveld
> *Zoek naar apps en acties* een deel van de naam (bv. „URL”, „bestand”, „map”).

## 1. Nieuwe opdracht

1. Open **Opdrachten** → tabblad **Opdrachten** → **+** (rechtsboven).
2. Tik bovenaan op de naam → **Wijzig naam** → typ exact `OC_Iphone` (op een iPad: `OC_Ipad`). Hoofdletters en de underscore moeten kloppen, anders vindt de app de opdracht niet.
3. Tik op het **ⓘ-pictogram / de pijl naast de naam** → zet **Toon in deelpaneel** aan. Er verschijnt een eerste blok **Ontvang … invoer van Deelpaneel** (*Receive input from Share Sheet*).
   Tik in dat blok op het invoertype en laat alleen **Tekst** aangevinkt. Zet de optie **Indien geen invoer** op **Ga door**.
   *(De invoer van de `shortcuts://`-link komt binnen als de variabele **Opdrachtinvoer** (*Shortcut Input*).)*

## 2. Tak „setup”: alleen mappen aanmaken

4. Voeg de actie **Als** (*If*) toe.
   - Eerste veld: kies de variabele **Opdrachtinvoer**.
   - Voorwaarde: **is**.
   - Tekst: `setup` (kleine letters).
5. Sleep tussen **Als** en **Anders** de actie **Maak map aan** (*Create Folder*).
   - Tik op de locatie en kies **Op mijn iPhone** (op een iPad: **Op mijn iPad**), de hoofdmap. Niet *iCloud Drive*: ServiceMax Go op beheerde toestellen ziet iCloud Drive niet.
   - Pad: `Rapport`
6. Voeg daaronder nog een **Maak map aan** toe, zelfde locatie, pad: `Rapport/Onderhoud_Entretien`.
   Daarna (zoals in de kant-en-klare opdracht) nog een **Maak map aan**, pad `Rapport/Depannage` (voor een latere uitbreiding van Werkrapport).
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
    - Bestemming/map: tik op de map (standaard *Opdrachten*) en kies dezelfde locatie als in stap 5: **Op mijn iPhone** / **Op mijn iPad** (de hoofdmap, niet *iCloud Drive*).
    - **Subpad** (*Subpath*): `Rapport/Onderhoud_Entretien/`
    - **Vervang bestaande bestanden** / **Overschrijf als bestand bestaat** (*Overwrite If File Exists*): **AAN**.
13. Optioneel: **Toon melding** met `OC_[Opdrachtinvoer].pdf bewaard`.
14. Als laatste actie van de tak *Anders* (na *Bewaar bestand*, vóór *Einde als*): **Open app** (*Open App*) → kies **Go** (ServiceMax Go). Zo kom je na het bewaren meteen terug in ServiceMax. Deze stap hoort **niet** in de tak *setup*. *(Alternatief: **Open URL's** met `https://go.servicemax.io`.)*

De opdracht ziet er dan zo uit:

```
Ontvang Tekst-invoer van Deelpaneel (indien geen invoer: Ga door)
Als  Opdrachtinvoer  is  setup
    Maak map aan  Rapport               (Op mijn iPhone / Op mijn iPad)
    Maak map aan  Rapport/Onderhoud_Entretien
    Maak map aan  Rapport/Depannage     (voor Werkrapport)
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
2. Open in Safari `shortcuts://run-shortcut?name=OC_Iphone&input=text&text=setup` (iPad: `name=OC_Ipad`). Kijk in **Bestanden › Op mijn iPhone/iPad** of `Rapport/Onderhoud_Entretien` en `Rapport/Depannage` bestaan.
3. Verstuur in de app een eindverslag. De opdracht start en `OC_WO-….pdf` verschijnt in de map. Opnieuw versturen overschrijft het bestand.

## Opmerkingen

- Alle locaties (*Maak map aan* en *Bewaar bestand*) moeten **Op mijn iPhone** (iPhone) of **Op mijn iPad** (iPad) zijn. Daarom zijn er twee opdrachten: *Op mijn iPhone* bestaat niet op een iPad en omgekeerd.

- De eerste keer vraagt iOS toestemming: „OC_Iphone (of OC_Ipad) wil verbinding maken met onderhoud-api.sealink68.workers.dev” en „… wil toegang tot bestanden”. Kies **Sta altijd toe**.
- Bestaat de map al, dan kan **Maak map aan** een melding geven bij een nieuwe *setup*. Dat is onschuldig, want de tak stopt daarna toch.
- Werkt de opdracht niet, dan blijft in de app de knop **⬇ PDF downloaden / delen** beschikbaar. Daarmee bewaar je de PDF manueel via het deelpaneel → *Bewaar in Bestanden*.
