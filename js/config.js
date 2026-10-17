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
  SHORTCUT: "Onderhoud_Entretien",
  SHORTCUT_INSTALL: "https://www.icloud.com/shortcuts/a70777546d224795bd690d29c15c8788", // iCloud link to install the Shortcut
  PHOTO_MAX: 1280, PHOTO_Q: 0.7,
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
        link: "Volledig verslag downloaden (30 dagen geldig): {url}" },
  fr: { ok: "Pour les appareils ci-dessous, un entretien a été effectué avec succès : aucune panne mécanique ou électronique n’a été constatée et aucune pièce n’a été remplacée.",
        rem: "Pour les appareils ci-dessus, des remarques ont été notées et/ou des pièces ont été remplacées. Tous les détails figurent dans le rapport d’entretien détaillé (PDF), disponible sur demande.",
        link: "Télécharger le rapport complet (valable 30 jours) : {url}" }
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
    techInstall: "1. Installeer de opdracht", techStart: "2. Start (mappen aanmaken)", techSave: "Opslaan",
    techNote: "Installeer eerst de opdracht ‘Onderhoud_Entretien’ (stap 1). ‘Start’ bewaart je naam en start de Opdracht ‘Onderhoud_Entretien’ één keer om de mappen Rapport/Onderhoud_Entretien aan te maken.",
    settings: "⚙ Instellingen technieker",
    modeH: "Aantal toestellen", mode1: "1 toestel", modeN: "Meerdere toestellen",
    mode1s: "Eén dossier in deze werkorder", modeNs: "Meerdere dossiers in één werkorder",
    woH: "Werkorder & dossier", woExisting: "Bestaande werkorder", woNew: "Nieuwe werkorder", woNewPh: "nummer",
    woLoading: "Werkorders laden…", woNone: "Geen open werkorders gevonden.", woErr: "Werkorders konden niet geladen worden.",
    woReload: "↻ Vernieuwen", dossiers: "dossiers", dossier: "Dossiernummer", dossierPh: "Plak hier het dossiernummer uit ServiceMax.",
    finalBtn: "Eindverslag WO",
    qOf: "Stelling {a} van {b}", yesT: "Juist", noT: "Niet juist", desc: "Beschrijving",
    photoAdd: "📷 Foto nemen", photoLib: "🖼 Uit bibliotheek", photoNeed: "Minstens 1 foto is verplicht.",
    needText: "Vul de beschrijving in.", needWo: "Kies of vul een werkorder in.", needDossier: "Vul het dossiernummer in.",
    needName: "Vul voornaam en achternaam in.", woInvalid: "Ongeldig WO-nummer (enkel letters, cijfers, - _ .).", dnInvalid: "Ongeldig dossiernummer (enkel letters, cijfers, - _ .).",
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
    runShortcut: "▶ Opdracht opnieuw starten", pdfDl: "⬇ PDF downloaden / delen", copyAgain: "Samenvatting opnieuw kopiëren",
    allOk: "Alles juist", remarks: "Opmerkingen", tech: "Technieker", extra: "Extra info", empty: "(leeg)",
    single: "1 toestel", multi: "Meerdere toestellen", editing: "Je bewerkt een bestaand dossier.",
    photoErr: "Foto kon niet verwerkt worden.", revisitOnce: "(Komt maar één keer in het verslag.)", sentOver: "Bestaand dossier overschreven.", prevNote: "Controleer en verstuur naar centraal.", dossiersIn: "Dossiers in {w}"
  },
  fr: {
    title: "Entretien", back: "Retour", next: "Suivant", yes: "Oui", no: "Non", cancel: "Annuler",
    langH: "Choisissez votre langue", langP: "Kies je taal",
    langNl: "Onderhoudsverslag · met Franse vertaling", langFr: "Rapport d’entretien",
    techH: "Technicien", techP: "À remplir une seule fois. Vos initiales sont dérivées de votre nom.",
    first: "Prénom", last: "Nom", firstPh: "p. ex. Joachim", lastPh: "p. ex. Lust", initials: "Initiales",
    techInstall: "1. Installer le raccourci", techStart: "2. Démarrer (créer les dossiers)", techSave: "Enregistrer",
    techNote: "Installez d’abord le raccourci « Onderhoud_Entretien » (étape 1). « Démarrer » enregistre votre nom et lance une fois le raccourci « Onderhoud_Entretien » pour créer les dossiers Rapport/Onderhoud_Entretien.",
    settings: "⚙ Paramètres technicien",
    modeH: "Nombre d’appareils", mode1: "Un appareil", modeN: "Plusieurs appareils",
    mode1s: "Un seul dossier dans cet ordre de travail", modeNs: "Plusieurs dossiers dans un ordre de travail",
    woH: "Ordre de travail & dossier", woExisting: "Ordre de travail existant", woNew: "Nouvel ordre de travail", woNewPh: "numéro",
    woLoading: "Chargement des ordres de travail…", woNone: "Aucun ordre de travail ouvert.", woErr: "Impossible de charger les ordres de travail.",
    woReload: "↻ Actualiser", dossiers: "dossiers", dossier: "Numéro de dossier", dossierPh: "Collez ici le numéro de dossier de ServiceMax.",
    finalBtn: "Rapport final WO",
    qOf: "Énoncé {a} sur {b}", yesT: "Correct", noT: "Incorrect", desc: "Description",
    photoAdd: "📷 Prendre une photo", photoLib: "🖼 Depuis la photothèque", photoNeed: "Au moins 1 photo est obligatoire.",
    needText: "Veuillez remplir la description.", needWo: "Choisissez ou saisissez un ordre de travail.", needDossier: "Veuillez saisir le numéro de dossier.",
    needName: "Veuillez saisir le prénom et le nom.", woInvalid: "Numéro WO invalide (lettres, chiffres, - _ . uniquement).", dnInvalid: "Numéro de dossier invalide (lettres, chiffres, - _ . uniquement).",
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
    runShortcut: "▶ Relancer le raccourci", pdfDl: "⬇ Télécharger / partager le PDF", copyAgain: "Copier à nouveau le résumé",
    allOk: "Tout correct", remarks: "Remarques", tech: "Technicien", extra: "Infos compl.", empty: "(vide)",
    single: "Un appareil", multi: "Plusieurs appareils", editing: "Vous modifiez un dossier existant.",
    photoErr: "La photo n’a pas pu être traitée.", revisitOnce: "(N’apparaît qu’une seule fois dans le rapport.)", sentOver: "Dossier existant remplacé.", prevNote: "Vérifiez puis envoyez à la centrale.", dossiersIn: "Dossiers dans {w}"
  }
};

/* PDF texts (always bilingual NL / FR). */
OE.PDFT = {
  title: "Onderhoudsverslag / Rapport d’entretien",
  wo: "Werkorder / Ordre de travail", date: "Datum / Date", techs: "Techniekers / Techniciens",
  dossier: "Dossier", tech: "Technieker / Technicien", sent: "Verstuurd / Envoyé",
  mode: { single: "1 toestel / Un appareil", multi: "Meerdere toestellen / Plusieurs appareils" },
  yes: "Juist / Correct", no: "Niet juist / Incorrect",
  extra: "Extra informatie / Informations complémentaires", photos: "Foto’s / Photos",
  page: "Pagina / Page", none: "—"
};
