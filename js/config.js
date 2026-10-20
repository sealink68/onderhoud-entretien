/* config.js – ALL fixed texts, question texts and labels (NL + FR) and endpoints.
   Change wording here; no other file contains user-facing text. */
"use strict";
var OE = window.OE = window.OE || {};
OE.CFG = {
  APP: "Onderhoud_Entretien",
  API: "https://onderhoud-api.sealink68.workers.dev",
  TRANSLATE_PROXY: "https://werkrapport-translate.sealink68.workers.dev",
  MYMEMORY: "https://api.mymemory.translated.net/get",
  MYMEMORY_DE: "sealink@hotmail.com",
  GO: "https://go.servicemax.io",
  /* iOS Shortcuts per device: they save the PDF locally ("On my iPhone/iPad › Rapport › Onderhoud_Entretien"), which ServiceMax Go
     on managed devices can see (iCloud Drive it cannot). The app picks the right one via OE.deviceKind(). */
  SHORTCUT_NAME_IPHONE: "OC_Iphone",
  SHORTCUT_NAME_IPAD: "OC_Ipad",
  SHORTCUT_INSTALL_IPHONE: "https://www.icloud.com/shortcuts/6996453996e64d18818c3d3bda1a5fab",
  SHORTCUT_INSTALL_IPAD: "https://www.icloud.com/shortcuts/05201aff0eb94a7088bff5e1c2c75edc",
  PHOTO_MAX: 1280, PHOTO_Q: 0.7, // legacy resize (OE.resizePhoto), no longer used for new photos
  ANNOT_MAX: 2000, ANNOT_Q: 0.85, ANNOT_MAXCHARS: 1400000, // annotated photo: max long side, JPEG quality, max data-URL size (~1 MB)
  DESC_MAX: 150, // optional short photo description
  WO_PREFIX: "WO-",
  SEP: "────────────────────",
  UNDERSCORES: "____________________" // exactly 20
};

/* The 8 checklist statements. kind:
   text  = "Niet juist" needs a mandatory description (photo:true -> also >= 1 photo)
   fixed = "Niet juist" only shows a fixed text, no input
   revisit = shows the revisit sentence (only once per dossier) + mandatory short description (desc:true) */
OE.QUESTIONS = [
  { kind: "text", photo: true,
    nl: "Er is geen visuele schade of beperking aan toestel bij aankomst.",
    fr: "Il n’y a aucun dommage visible ni aucune limitation de l’appareil à l’arrivée.",
    ph: { nl: "Wat zijn de schades en beperkingen? FOTO bijvoegen!", fr: "Quels sont les dommages et limitations ? Joindre une PHOTO !" } },
  { kind: "text",
    nl: "Het toestel werkte 100% bij aankomst.",
    fr: "L’appareil fonctionnait à 100 % à l’arrivée.",
    ph: { nl: "Beschrijf wat niet werkt?", fr: "Décrivez ce qui ne fonctionne pas ?" } },
  { kind: "fixed",
    nl: "Er werden GEEN onderdelen vervangen.",
    fr: "AUCUNE pièce n’a été remplacée.",
    fixed: { nl: "Zie gebruikte onderdelen.", fr: "Voir les pièces utilisées." } },
  { kind: "fixed",
    nl: "Er zijn geen extra onderdelen (parts request) te bestellen.",
    fr: "Aucune pièce supplémentaire (parts request) ne doit être commandée.",
    fixed: { nl: "Onderdelen zijn aangevraagd.", fr: "Les pièces ont été demandées." } },
  { kind: "revisit",
    nl: "Er moet GEEN herstellingswerkorder (revisit) aangevraagd worden.",
    fr: "AUCUN ordre de travail de réparation (revisit) ne doit être demandé." },
  { kind: "revisit", desc: true,
    nl: "Na onderhoud is mechanisch alles ok.",
    fr: "Après l’entretien, tout est OK sur le plan mécanique.",
    ph: { nl: "Korte beschrijving van het mechanische probleem (verplicht).", fr: "Brève description du problème mécanique (obligatoire)." } },
  { kind: "revisit", desc: true,
    nl: "Na onderhoud is elektronisch alles ok.",
    fr: "Après l’entretien, tout est OK sur le plan électronique.",
    ph: { nl: "Korte beschrijving van het elektronische probleem (verplicht).", fr: "Brève description du problème électronique (obligatoire)." } },
  { kind: "revisit", desc: true,
    nl: "Na onderhoud is het toestel 100% operationeel.",
    fr: "Après l’entretien, l’appareil est opérationnel à 100 %.",
    ph: { nl: "Korte beschrijving: wat is niet operationeel? (verplicht)", fr: "Brève description : qu’est-ce qui n’est pas opérationnel ? (obligatoire)" } }
];
OE.REVISIT = { nl: "Revisit voor herstelling is aangevraagd.", fr: "Un revisit pour réparation a été demandé." };

/* Short clipboard summary (Eindverslag WO). */
OE.SUMMARY = {
  nl: { ok: "Bij onderstaande toestellen werd een succesvol onderhoud uitgevoerd, waar geen mechanische- of electronische storingen werden vastgesteld en ook geen onderdelen vervangen werden.",
        rem: "Bij bovenstaande toestellen werden opmerkingen genoteerd en/of onderdelen vervangen. Alle details staan in het uitgebreide onderhoudsverslag (PDF), dat op aanvraag kan worden toegestuurd.",
        link: "Volledig verslag downloaden (30 dagen geldig): {url}",
        signer: "Ondertekenaar: {s}",
        count: "Aantal toestellen: {n}" },
  fr: { ok: "Pour les appareils ci-dessous, un entretien a été effectué avec succès : aucune panne mécanique ou électronique n’a été constatée et aucune pièce n’a été remplacée.",
        rem: "Pour les appareils ci-dessus, des remarques ont été notées et/ou des pièces ont été remplacées. Tous les détails figurent dans le rapport d’entretien détaillé (PDF), disponible sur demande.",
        link: "Télécharger le rapport complet (valable 30 jours) : {url}",
        signer: "Signataire : {s}",
        count: "Nombre d’appareils : {n}" }
};

OE.DISC = "Automatische vertaling – gelieve na te kijken / Traduction automatique – veuillez vérifier";

/* UI texts. */
OE.T = {
  nl: {
    title: "Onderhoud", back: "Terug", next: "Volgende", yes: "Ja", no: "Nee", cancel: "Annuleren",
    langH: "Kies je taal", langP: "Choisissez votre langue",
    langNl: "Onderhoudsverslag · met Franse vertaling", langFr: "Rapport d’entretien",
    techH: "Technieker", techP: "Eenmalig in te vullen. Je initialen worden afgeleid uit je naam.",
    first: "Voornaam", last: "Achternaam", firstPh: "bv. Joachim", lastPh: "bv. Lust", initials: "Initialen",
    techInstall: "1. Installeer de opdracht", techInstallFor: "1. Installeer de opdracht voor {dev}", techStart: "2. Start (mappen aanmaken)", techSave: "Opslaan",
    techNote: "Installeer eerst de opdracht ‘{sc}’ (stap 1). ‘Start’ bewaart je naam en start de opdracht één keer om de mappen Rapport/Onderhoud_Entretien en Rapport/Depannage aan te maken in Op mijn {dev}. Had je al een oudere opdracht? Installeer dan één keer de nieuwe; de oude ‘Onderhoud_Entretien’ mag je verwijderen.",
    settings: "⚙ Instellingen technieker",
    modeH: "Aantal toestellen", mode1: "1 toestel", modeN: "Meerdere toestellen",
    mode1s: "Eén dossier in deze werkorder", modeNs: "Meerdere dossiers in één werkorder",
    woH: "Werkorder & dossier", woExisting: "Bestaande werkorder", woNew: "Nieuwe werkorder", woNewPh: "nummer",
    woSearchBtn: "🔍 Zoek bestaande werkorder", woSearchHide: "Lijst verbergen", woExistsHint: "Deze werkorder bestaat al. Kies ze in de lijst hieronder (tik erop) in plaats van ze opnieuw aan te maken.", finalCount: "Het eindverslag bevat {n} dossier(s) / toestel(len) (laatste stand van de server).", finalStale: "Na het laatste eindverslag werd een dossier toegevoegd. Het eindverslag moet opnieuw gemaakt worden (‘Verstuur eindverslag’).", finalChecking: "Laatste stand van de server ophalen…", finalChanged: "De werkorder is intussen gewijzigd: het eindverslag bevat nu {n} dossier(s). Controleer en tik opnieuw op ‘Verstuur eindverslag’.", sentStale: "Er bestond al een eindverslag voor deze werkorder. Maak het eindverslag opnieuw (‘Eindverslag WO’).", woSearch: "Zoek WO-nummer…", woNotFound: "Geen WO gevonden", woNoneYet: "Nog geen WO’s", woChange: "Wijzig", woLoading: "Werkorders laden…", woNone: "Geen open werkorders gevonden.", woErr: "Werkorders konden niet geladen worden.",
    woReload: "↻ Vernieuwen", dossiers: "dossiers", dossier: "Dossiernummer", dossierPh: "Plak hier het dossiernummer uit ServiceMax.",
    finalBtn: "Preview eindverslag", sendInterim: "Verstuur tussenverslag", saveToFinal: "Opslaan › eindverslag", closeAsk: "Verslag niet opslaan/versturen?", sgnLbl: "Naam ondertekenaar (klant/verantwoordelijke)", sgnHint: "Enkel de naam. De handtekening gebeurt in ServiceMax.", allInQ: "Zijn alle verslagen binnen?", allInYes: "Ja, alle verslagen van alle techniekers zijn binnen.", allInNeed: "Bevestig eerst dat alle verslagen binnen zijn.", finalQueue: "Dossier wordt verstuurd…",
    qOf: "Stelling {a} van {b}", yesT: "Juist", noT: "Niet juist", desc: "Beschrijving",
    photoAdd: "📷 Foto nemen", photoLib: "🖼 Uit bibliotheek", photoNeed: "Minstens 1 foto is verplicht.",
    needText: "Vul de beschrijving in.", needWo: "Kies of vul een werkorder in.", needDossier: "Vul het dossiernummer in.",
    needName: "Vul voornaam en achternaam in.", woInvalid: "WO-nummer is te lang (max. 100 tekens).", dnInvalid: "Dossiernummer is te lang (max. 100 tekens).",
    extraH: "Extra informatie", extraPh: "Optioneel: extra info voor dit dossier.", sendDossier: "Verstuur dossier",
    prevH: "Voorbeeld dossier", sendCentral: "✓ Verstuur naar centraal", showReport: "Toon verslag", hideReport: "Verberg verslag",
    edit: "Bewerken", translating: "Bezig met vertalen…", sending: "Bezig met versturen…", sendErr: "Versturen mislukt – controleer je internetverbinding en probeer opnieuw.",
    trerr: "Vertaling mislukt – de originele tekst wordt gebruikt en gemarkeerd.", retr: "↻ Opnieuw vertalen", untr: "[niet vertaald]", trl: "Vertaling",
    sentH: "Dossier verstuurd", sentP: "Dossier {d} is opgeslagen onder {w}.",
    newDossier: "Nieuw dossier", closeApp: "Sluiten app",
    finalH: "Eindverslag", finalLoading: "Dossiers laden…", finalNone: "Nog geen dossiers in deze werkorder.",
    finalSend: "✓ Verstuur eindverslag", finalConfirm: "Zijn alle verslagen van alle techniekers via de app ingevuld en verstuurd?",
    pdfBusy: "PDF wordt gemaakt en opgeladen…", pdfOk: "PDF opgeladen. De korte samenvatting staat op het klembord.",
    pdfErr: "PDF maken/opladen mislukt.", copyFail: "Kopiëren naar klembord mislukt.",
    runShortcut: "▶ Bewaar PDF (opdracht starten)", pdfNext: "Tik nu op ‘▶ Bewaar PDF (opdracht starten)’: de opdracht bewaart de PDF op je toestel en opent ServiceMax Go.", photoDel: "Foto verwijderen", photoDelAsk: "Deze foto verwijderen?", pdfDl: "⬇ PDF downloaden / delen", copyAgain: "Samenvatting opnieuw kopiëren",
    allOk: "Alles juist", remarks: "Opmerkingen", tech: "Technieker", extra: "Extra info", empty: "(leeg)",
    single: "1 toestel", multi: "Meerdere toestellen", editing: "Je bewerkt een bestaand dossier.",
    anTitle: "Foto bewerken", anLoading: "Foto laden…", anCancel: "Annuleren", anDone: "Klaar", anOk: "OK", anUndo: "Ongedaan maken", anClear: "Alles wissen",
    anArrow: "Pijl", anEllipse: "Cirkel / ellips", anRect: "Rechthoek", anPen: "Vrij tekenen", anDim: "Maatlijn", anText: "Tekst",
    anRed: "Rood", anYellow: "Geel", anBlue: "Blauw", anWhite: "Wit", anBlack: "Zwart", anThin: "Dun", anMid: "Middel", anThick: "Dik",
    anDimAsk: "Maat (bv. 1250 mm)", anTextAsk: "Tekst",
    descH: "Korte beschrijving (optioneel)", descPh: "bv. kras onderaan op het deurblad", descSkip: "Overslaan", descDone: "Klaar",
    signerH: "Verantwoordelijke ondertekenaar", signerPh: "Naam van de klant/verantwoordelijke ter plaatse", signerNeed: "Vul de naam van de ondertekenaar in.", ok: "OK", photoErr: "Foto kon niet verwerkt worden.", obxOne: "1 dossier wacht op verzending", obxMany: "{n} dossiers wachten op verzending", obxRetry: "Opnieuw", obxOk: "Verzonden ✓", sentWait: "Wacht op verzending… (gaat automatisch verder)", sentDone: "Verzonden naar centraal ✓", finalOutbox: "Let op: op dit toestel wachten nog {n} dossier(s) op verzending. Wacht tot ze verzonden zijn (internet nodig) voor je het eindverslag verstuurt.", storeFull: "Opslag vol – dossier kon niet bewaard worden. Verwijder foto’s en probeer opnieuw.", revisitOnce: "(Komt maar één keer in het verslag.)", sentOver: "Bestaand dossier overschreven.", prevNote: "Controleer en verstuur naar centraal.", dossiersIn: "Dossiers in {w}"
  },
  fr: {
    title: "Entretien", back: "Retour", next: "Suivant", yes: "Oui", no: "Non", cancel: "Annuler",
    langH: "Choisissez votre langue", langP: "Kies je taal",
    langNl: "Onderhoudsverslag · met Franse vertaling", langFr: "Rapport d’entretien",
    techH: "Technicien", techP: "À remplir une seule fois. Vos initiales sont dérivées de votre nom.",
    first: "Prénom", last: "Nom", firstPh: "p. ex. Joachim", lastPh: "p. ex. Lust", initials: "Initiales",
    techInstall: "1. Installer le raccourci", techInstallFor: "1. Installer le raccourci pour {dev}", techStart: "2. Démarrer (créer les dossiers)", techSave: "Enregistrer",
    techNote: "Installez d’abord le raccourci « {sc} » (étape 1). « Démarrer » enregistre votre nom et lance une fois le raccourci pour créer les dossiers Rapport/Onderhoud_Entretien et Rapport/Depannage dans Sur mon {dev}. Vous aviez déjà un ancien raccourci ? Installez une fois le nouveau ; l’ancien « Onderhoud_Entretien » peut être supprimé.",
    settings: "⚙ Paramètres technicien",
    modeH: "Nombre d’appareils", mode1: "1 appareil", modeN: "Plusieurs appareils",
    mode1s: "Un seul dossier dans cet ordre de travail", modeNs: "Plusieurs dossiers dans un ordre de travail",
    woH: "Ordre de travail & dossier", woExisting: "Ordre de travail existant", woNew: "Nouvel ordre de travail", woNewPh: "numéro",
    woSearchBtn: "🔍 Rechercher un ordre existant", woSearchHide: "Masquer la liste", woExistsHint: "Cet ordre de travail existe déjà. Choisissez-le dans la liste ci-dessous (touchez-le) au lieu de le recréer.", finalCount: "Le rapport final contient {n} dossier(s) / appareil(s) (état actuel du serveur).", finalStale: "Un dossier a été ajouté après le dernier rapport final. Le rapport final doit être refait (« Envoyer le rapport final »).", finalChecking: "Récupération de l’état actuel du serveur…", finalChanged: "L’ordre de travail a changé entre-temps : le rapport final contient maintenant {n} dossier(s). Vérifiez et touchez à nouveau « Envoyer le rapport final ».", sentStale: "Un rapport final existait déjà pour cet ordre de travail. Refaites le rapport final (« Rapport final WO »).", woSearch: "Rechercher un n° WO…", woNotFound: "Aucun WO trouvé", woNoneYet: "Pas encore de WO", woChange: "Modifier", woLoading: "Chargement des ordres de travail…", woNone: "Aucun ordre de travail ouvert.", woErr: "Impossible de charger les ordres de travail.",
    woReload: "↻ Actualiser", dossiers: "dossiers", dossier: "Numéro de dossier", dossierPh: "Collez ici le numéro de dossier de ServiceMax.",
    finalBtn: "Aperçu du rapport final", sendInterim: "Envoyer le rapport intermédiaire", saveToFinal: "Enregistrer › rapport final", closeAsk: "Ne pas enregistrer/envoyer le rapport ?", sgnLbl: "Nom du signataire (client/responsable)", sgnHint: "Nom uniquement. La signature se fait dans ServiceMax.", allInQ: "Tous les rapports sont-ils arrivés ?", allInYes: "Oui, tous les rapports de tous les techniciens sont arrivés.", allInNeed: "Confirmez d’abord que tous les rapports sont arrivés.", finalQueue: "Envoi du dossier…",
    qOf: "Énoncé {a} sur {b}", yesT: "Correct", noT: "Incorrect", desc: "Description",
    photoAdd: "📷 Prendre une photo", photoLib: "🖼 Depuis la photothèque", photoNeed: "Au moins 1 photo est obligatoire.",
    needText: "Veuillez remplir la description.", needWo: "Choisissez ou saisissez un ordre de travail.", needDossier: "Veuillez saisir le numéro de dossier.",
    needName: "Veuillez saisir le prénom et le nom.", woInvalid: "Numéro WO trop long (max. 100 caractères).", dnInvalid: "Numéro de dossier trop long (max. 100 caractères).",
    extraH: "Informations complémentaires", extraPh: "Optionnel : informations complémentaires pour ce dossier.", sendDossier: "Envoyer le dossier",
    prevH: "Aperçu du dossier", sendCentral: "✓ Envoyer à la centrale", showReport: "Afficher le rapport", hideReport: "Masquer le rapport",
    edit: "Modifier", translating: "Traduction en cours…", sending: "Envoi en cours…", sendErr: "Échec de l’envoi – vérifiez votre connexion internet et réessayez.",
    trerr: "La traduction a échoué – le texte original est utilisé et marqué.", retr: "↻ Retraduire", untr: "[non traduit]", trl: "Traduction",
    sentH: "Dossier envoyé", sentP: "Le dossier {d} est enregistré sous {w}.",
    newDossier: "Nouveau dossier", closeApp: "Fermer l’app",
    finalH: "Rapport final", finalLoading: "Chargement des dossiers…", finalNone: "Pas encore de dossiers dans cet ordre de travail.",
    finalSend: "✓ Envoyer le rapport final", finalConfirm: "Tous les rapports de tous les techniciens ont-ils été remplis et envoyés via l’app ?",
    pdfBusy: "Création et envoi du PDF…", pdfOk: "PDF envoyé. Le résumé court est dans le presse-papiers.",
    pdfErr: "Échec de la création/de l’envoi du PDF.", copyFail: "Échec de la copie dans le presse-papiers.",
    runShortcut: "▶ Enregistrer le PDF (lancer le raccourci)", pdfNext: "Touchez maintenant « ▶ Enregistrer le PDF (lancer le raccourci) » : le raccourci enregistre le PDF sur votre appareil et ouvre ServiceMax Go.", photoDel: "Supprimer la photo", photoDelAsk: "Supprimer cette photo ?", pdfDl: "⬇ Télécharger / partager le PDF", copyAgain: "Copier à nouveau le résumé",
    allOk: "Tout correct", remarks: "Remarques", tech: "Technicien", extra: "Infos compl.", empty: "(vide)",
    single: "1 appareil", multi: "Plusieurs appareils", editing: "Vous modifiez un dossier existant.",
    anTitle: "Annoter la photo", anLoading: "Chargement de la photo…", anCancel: "Annuler", anDone: "Terminé", anOk: "OK", anUndo: "Défaire", anClear: "Tout effacer",
    anArrow: "Flèche", anEllipse: "Cercle / ellipse", anRect: "Rectangle", anPen: "Dessin libre", anDim: "Cote", anText: "Texte",
    anRed: "Rouge", anYellow: "Jaune", anBlue: "Bleu", anWhite: "Blanc", anBlack: "Noir", anThin: "Fin", anMid: "Moyen", anThick: "Épais",
    anDimAsk: "Cote (p. ex. 1250 mm)", anTextAsk: "Texte",
    descH: "Brève description (facultatif)", descPh: "p. ex. rayure en bas du vantail", descSkip: "Passer", descDone: "Terminé",
    signerH: "Signataire responsable", signerPh: "Nom du client/responsable sur place", signerNeed: "Veuillez saisir le nom du signataire.", ok: "OK", photoErr: "La photo n’a pas pu être traitée.", obxOne: "1 dossier en attente d’envoi", obxMany: "{n} dossiers en attente d’envoi", obxRetry: "Réessayer", obxOk: "Envoyé ✓", sentWait: "En attente d’envoi… (continue automatiquement)", sentDone: "Envoyé à la centrale ✓", finalOutbox: "Attention : {n} dossier(s) de cet appareil attendent encore l’envoi. Attendez qu’ils soient envoyés (internet requis) avant d’envoyer le rapport final.", storeFull: "Mémoire pleine – le dossier n’a pas pu être enregistré. Supprimez des photos et réessayez.", revisitOnce: "(N’apparaît qu’une seule fois dans le rapport.)", sentOver: "Dossier existant remplacé.", prevNote: "Vérifiez puis envoyez à la centrale.", dossiersIn: "Dossiers dans {w}"
  }
};

/* PDF texts (always bilingual NL / FR). */
OE.PDFT = {
  title: "Onderhoudsverslag / Rapport d’entretien",
  wo: "Werkorder / Ordre de travail", signer: "Ondertekenaar / Signataire", date: "Datum / Date", techs: "Techniekers / Techniciens",
  dossier: "Dossier", tech: "Technieker / Technicien", sent: "Verstuurd / Envoyé",
  mode: { single: "1 toestel / 1 appareil", multi: "Meerdere toestellen / Plusieurs appareils" },
  yes: "Juist / Correct", no: "Niet juist / Incorrect",
  extra: "Extra informatie / Informations complémentaires", photos: "Foto’s / Photos",
  page: "Pagina / Page", none: "—"
};

/* Per-screen help (the ? button top right). Keys = screen names. Plain text; "• " lines become bullets. */
OE.HELP = {
  nl: {
    title: "Help", close: "Sluiten",
    lang: ["Kies de taal waarin je de app gebruikt en het verslag invult.", "• Nederlands: de verslagen worden automatisch naar het Frans vertaald.", "• Français: de verslagen worden automatisch naar het Nederlands vertaald.", "• Later wisselen kan bovenaan met NL / FR."],
    tech: ["Vul je voornaam en achternaam in; je initialen worden er automatisch uit afgeleid. Je naam staat op elk dossier.", "• Stap 1 – Installeer de opdracht ‘{sc}’ in de app Opdrachten (Shortcuts). De app kiest zelf de juiste opdracht voor je iPhone of iPad.", "• Stap 2 – Start: bewaart je naam en start de opdracht één keer om de mappen Rapport/Onderhoud_Entretien en Rapport/Depannage aan te maken in Bestanden › Op mijn {dev}.", "• Had je al een oudere opdracht? Installeer dan één keer de nieuwe opdracht ‘{sc}’ via stap 1. De oude opdracht ‘Onderhoud_Entretien’ mag je verwijderen (Opdrachten › houd je vinger erop › Verwijder).", "• Wijzigen kan later via ‘⚙ Instellingen technieker’."],
    mode: ["• 1 toestel: één dossier in deze werkorder.", "• Meerdere toestellen: meerdere dossiers (één per toestel) in dezelfde werkorder.", "Via ‘⚙ Instellingen technieker’ pas je je naam aan of installeer/start je de opdracht opnieuw."],
    wo: ["• Bestaande werkorder: tik op ‘🔍 Zoek bestaande werkorder’, zoek op (een deel van) het WO-nummer en tik het aan in de lijst. ‘↻ Vernieuwen’ laadt de lijst opnieuw.", "• Nieuwe werkorder: vul het nummer in na het vaste voorvoegsel WO-. Bestaat dat nummer al, dan verschijnt de lijst automatisch met een melding: kies de werkorder dan in de lijst.", "• Alle tekens zijn toegelaten; spaties worden _ .", "• Dossiernummer: plak het dossiernummer uit ServiceMax (verplicht, max. 100 tekens). Een bestaand dossiernummer wordt overschreven."],
    q: ["Het verslag bevat 8 stellingen; standaard staat elke stelling op ‘Juist’.", "• Tik ‘Niet juist’ als het niet klopt: dan vraagt de app een beschrijving of toont ze een vaste tekst.", "• Stelling 1 (schade bij aankomst) op ‘Niet juist’: minstens 1 foto is verplicht.", "• Na elke foto opent een tekenscherm: pijl, cirkel, rechthoek, vrij tekenen, maatlijn (met maat, bv. 1250 mm) en tekst; 5 kleuren en 3 diktes. ↶ maakt ongedaan, 🗑 wist alles. ‘Annuleren’ voegt de foto niet toe, ‘Klaar’ wel.", "• Daarna kun je een korte beschrijving (optioneel, max. 150 tekens) toevoegen; die komt, automatisch vertaald, onder de foto in de PDF. Alleen de bewerkte foto wordt bewaard; achteraf bewerken kan niet (wel verwijderen met ×).", "• Met Terug / Volgende ga je door de stellingen."],
    extra: ["Optioneel: noteer hier extra informatie voor dit dossier.", "Tik daarna op ‘Verstuur dossier’ om het voorbeeld te zien."],
    preview: ["Controleer het dossier en de automatische vertaling. Met ‹ Terug pas je iets aan.", "• ‘✓ Verstuur tussenverslag’ (normale weg): het dossier van deze deur gaat naar centraal (wachtrij, ook zonder internet) en ServiceMax Go opent.", "• ‘📄 Preview eindverslag’: het dossier wordt eerst verstuurd (wachtrij), daarna opent het eindverslag van de hele WO. Zo gaat er geen deur verloren.", "• Bewerk je een dossier vanuit het eindverslag? Dan staat hier ‘💾 Opslaan › eindverslag’.", "• ‘Sluiten app’ (grijs, onderaan) enkel als je dit verslag NIET wilt opslaan of versturen; de app vraagt eerst bevestiging."],
    sent: ["• Nieuw dossier: volgend toestel in dezelfde werkorder (WO blijft behouden).", "• Preview eindverslag: overzicht en eindverslag van alle dossiers in deze WO.", "• ‘Sluiten app’ (grijs): terug naar de start zonder verder iets te doen.", "Zolang ‘Wacht op verzending’ staat, is het dossier nog niet verzonden (internet nodig)."],
    final: ["Overzicht van alle dossiers in deze WO. Tik ‘✎ Bewerken’ bij een dossier om de antwoorden aan te passen; ‘💾 Opslaan › eindverslag’ stuurt de wijziging naar de server.", "• Vul de naam van de ondertekenaar in (alleen de naam; de handtekening gebeurt in ServiceMax).", "• Vink ‘Zijn alle verslagen binnen?’ aan als alle techniekers hun deuren verstuurd hebben.", "• ‘✓ Verstuur eindverslag’ haalt eerst de laatste stand van de server op; daarna wordt de PDF gemaakt en opgeladen en de korte samenvatting naar het klembord gekopieerd.", "• Werd er na het eindverslag nog een dossier toegevoegd, dan verschijnt een melding: maak het eindverslag dan opnieuw.", "• Na het opladen tik je op ‘▶ Bewaar PDF (opdracht starten)’. De PDF wordt dan via de opdracht bewaard in Op mijn {dev} › Rapport › Onderhoud_Entretien (OC_<WO>.pdf).", "• In ServiceMax voeg je de PDF toe via Blader › Locaties › Op mijn {dev} › Rapport › Onderhoud_Entretien.", "• Tip: markeer die map één keer als favoriet in de app Bestanden (houd je vinger op de map › Voeg toe aan favorieten).", "• De downloadlink in de samenvatting is 30 dagen geldig."]
  },
  fr: {
    title: "Aide", close: "Fermer",
    lang: ["Choisissez la langue dans laquelle vous utilisez l’application et remplissez le rapport.", "• Français : les rapports sont traduits automatiquement en néerlandais.", "• Nederlands : les rapports sont traduits automatiquement en français.", "• Vous pouvez changer plus tard en haut avec NL / FR."],
    tech: ["Saisissez votre prénom et votre nom ; vos initiales en sont déduites automatiquement. Votre nom figure sur chaque dossier.", "• Étape 1 – Installez le raccourci « {sc} » dans l’app Raccourcis. L’app choisit elle-même le bon raccourci pour votre iPhone ou iPad.", "• Étape 2 – Démarrer : enregistre votre nom et lance une fois le raccourci pour créer les dossiers Rapport/Onderhoud_Entretien et Rapport/Depannage dans Fichiers › Sur mon {dev}.", "• Vous aviez déjà un ancien raccourci ? Installez une fois le nouveau raccourci « {sc} » via l’étape 1. L’ancien raccourci « Onderhoud_Entretien » peut être supprimé (Raccourcis › maintenez le doigt dessus › Supprimer).", "• Vous pouvez modifier cela plus tard via « ⚙ Paramètres technicien »."],
    mode: ["• 1 appareil : un seul dossier dans cet ordre de travail.", "• Plusieurs appareils : plusieurs dossiers (un par appareil) dans le même ordre de travail.", "Via « ⚙ Paramètres technicien », vous modifiez votre nom ou réinstallez/relancez le raccourci."],
    wo: ["• Ordre de travail existant : touchez « 🔍 Rechercher un ordre existant », recherchez (une partie du) numéro WO et touchez-le dans la liste. « ↻ Actualiser » recharge la liste.", "• Nouvel ordre de travail : saisissez le numéro après le préfixe fixe WO-. Si ce numéro existe déjà, la liste s’affiche automatiquement avec un message : choisissez alors l’ordre dans la liste.", "• Tous les caractères sont autorisés ; les espaces deviennent _ .", "• Numéro de dossier : collez le numéro de dossier de ServiceMax (obligatoire, 100 caractères max.). Un numéro de dossier existant est écrasé."],
    q: ["Le rapport contient 8 énoncés ; par défaut, chacun est sur « Correct ».", "• Touchez « Incorrect » si ce n’est pas le cas : l’application demande alors une description ou affiche un texte fixe.", "• Énoncé 1 (dommages à l’arrivée) sur « Incorrect » : au moins 1 photo est obligatoire.", "• Après chaque photo, un écran de dessin s’ouvre : flèche, cercle, rectangle, dessin libre, cote (avec mesure, p. ex. 1250 mm) et texte ; 5 couleurs et 3 épaisseurs. ↶ défait, 🗑 efface tout. « Annuler » n’ajoute pas la photo, « Terminé » l’ajoute.", "• Vous pouvez ensuite ajouter une brève description (facultatif, 150 caractères max.) ; elle figure, traduite automatiquement, sous la photo dans le PDF. Seule la photo annotée est conservée ; elle ne peut plus être modifiée ensuite (mais bien supprimée avec ×).", "• Retour / Suivant permettent de parcourir les énoncés."],
    extra: ["Facultatif : notez ici des informations supplémentaires pour ce dossier.", "Touchez ensuite « Envoyer le dossier » pour voir l’aperçu."],
    preview: ["Vérifiez le dossier et la traduction automatique. Avec ‹ Retour, vous corrigez quelque chose.", "• « ✓ Envoyer le rapport intermédiaire » (voie normale) : le dossier de cette porte part à la centrale (file d’attente, même sans Internet) et ServiceMax Go s’ouvre.", "• « 📄 Aperçu du rapport final » : le dossier est d’abord envoyé (file d’attente), puis le rapport final de tout le WO s’ouvre. Aucune porte ne peut ainsi se perdre.", "• Vous modifiez un dossier depuis le rapport final ? Le bouton est alors « 💾 Enregistrer › rapport final ».", "• « Fermer l’app » (gris, en bas) uniquement si vous ne voulez PAS enregistrer ni envoyer ce rapport ; l’app demande d’abord confirmation."],
    sent: ["• Nouveau dossier : appareil suivant dans le même ordre de travail (le WO est conservé).", "• Aperçu du rapport final : aperçu et rapport final de tous les dossiers de ce WO.", "• « Fermer l’app » (gris) : retour au début sans rien faire d’autre.", "Tant que « En attente d’envoi » est affiché, le dossier n’est pas encore envoyé (Internet requis)."],
    final: ["Aperçu de tous les dossiers de ce WO. Touchez « ✎ Modifier » sous un dossier pour corriger les réponses ; « 💾 Enregistrer › rapport final » envoie la modification au serveur.", "• Saisissez le nom du signataire (nom uniquement ; la signature se fait dans ServiceMax).", "• Cochez « Tous les rapports sont-ils arrivés ? » quand tous les techniciens ont envoyé leurs portes.", "• « ✓ Envoyer le rapport final » récupère d’abord l’état actuel du serveur ; ensuite le PDF est créé et envoyé et le court résumé est copié dans le presse-papiers.", "• Si un dossier a été ajouté après le rapport final, un message s’affiche : refaites alors le rapport final.", "• Après l’envoi, touchez « ▶ Enregistrer le PDF (lancer le raccourci) ». Le PDF est alors enregistré via le raccourci dans Sur mon {dev} › Rapport › Onderhoud_Entretien (OC_<WO>.pdf).", "• Dans ServiceMax, ajoutez le PDF via Parcourir › Emplacements › Sur mon {dev} › Rapport › Onderhoud_Entretien.", "• Astuce : marquez ce dossier une fois comme favori dans l’app Fichiers (maintenez le doigt sur le dossier › Ajouter aux favoris).", "• Le lien de téléchargement dans le résumé est valable 30 jours."]
  }
};
