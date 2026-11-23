# Opdrachten „OC_Iphone” en „OC_Ipad”

Eén map **Rapport** op het toestel, voor Onderhoud én Werkrapport. Geen submappen
`Onderhoud_Entretien` of `Depannage`. De opdracht maakt die map niet zelf aan.

| Toestel | Naam (exact) | Installatielink | Bewaart in |
|---|---|---|---|
| iPhone | `OC_Iphone` | https://www.icloud.com/shortcuts/d979d5b6e6074467875a5a8a695190be | **Op mijn iPhone › Rapport** |
| iPad | `OC_Ipad` | https://www.icloud.com/shortcuts/fa8c5eb7f1834e118e63b74bcfefefa8 | **Op mijn iPad › Rapport** |

De knop **1. Installeer de opdracht** in de app opent de juiste link. Tik op *Voeg opdracht toe*.
De namen `OC_Iphone` en `OC_Ipad` zijn hetzelfde gebleven, dus `shortcuts://run-shortcut?name=…` blijft werken.

## Map Rapport (eenmalig, zelf)

1. Open **Bestanden** (FR: *Fichiers*).
2. Ga naar **Op mijn iPhone** of **Op mijn iPad** (FR: *Sur mon iPhone* / *Sur mon iPad*).
3. Houd een lege plek ingedrukt › **Nieuwe map** (FR: *Nouveau dossier*).
4. Noem de map `Rapport`.

## PDF bewaren

De web-app start de opdracht na het eindverslag:

`shortcuts://run-shortcut?name=OC_Iphone&input=text&text=<WO>`

(iPad: `name=OC_Ipad`). De invoer is het WO-nummer.

De opdracht downloadt `https://onderhoud-api.sealink68.workers.dev/wo/<WO>/pdf`, noemt het bestand
`OC_<WO>.pdf` en opent **Bewaar bestand** met **Vraag waar te bewaren** aan. Er is geen actie **Maak map aan**.

De eerste keer kies je **Op mijn iPhone/iPad › Rapport**. Daarna onthoudt de opdracht die plek meestal.
Daarna opent ze ServiceMax Go.

In ServiceMax: **Blader › Locaties › Op mijn iPhone** (of **Op mijn iPad**) **› Rapport**.
Tip: houd de map ingedrukt › **Voeg toe aan favorieten**.

Oude PDF’s wis je zelf af en toe (bijvoorbeeld ouder dan 60 dagen):
**Bestanden › Op mijn iPhone › Rapport › Selecteer › Verwijder**
(FR: *Fichiers › Sur mon iPhone › Rapport › Sélectionner › Supprimer*).

## Zelf bouwen (alleen als de installatielink niet lukt)

1. Nieuwe opdracht, naam exact `OC_Iphone` of `OC_Ipad`.
2. **Ontvang Tekst** van het deelpaneel. Indien geen invoer: **Ga door**.
3. **URL**: `https://onderhoud-api.sealink68.workers.dev/wo/` + variabele **Opdrachtinvoer** + `/pdf`.
4. **Haal inhoud van URL op**.
5. **Stel naam in**: `OC_` + **Opdrachtinvoer** + `.pdf`.
6. **Bewaar bestand**: **Vraag waar te bewaren** **AAN**. Geen subpad naar een andere map, geen **Maak map aan**.
7. **Open app** → **Go** (ServiceMax Go).

Geen tak `setup`. De app start de opdracht niet meer met `text=setup`.
