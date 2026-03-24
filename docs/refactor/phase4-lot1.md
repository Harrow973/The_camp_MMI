# Phase 4 - Migration Lot 1

Date: 2026-03-24

Pages migrees:

- `index.html`
- `selection-personnage.html`
- `dialogue.html`

## Changements appliques

- Ajout du chargement du noyau partage via `scripts/core/app-core.js`.
- Ajout du chargement des tokens CSS via `styles/tokens.css`.
- Remplacement des transitions locales par `TheCampCore.navigation.transitionTo(...)` avec fallback legacy si le core est indisponible.
- Standardisation du boot minimal via `TheCampCore.boot({ autoBindNav: false, autoResumeAudio: false })`.
- Sur `index.html`, enregistrement service worker migre vers `TheCampCore.sw.register(...)`.

## Duplication reduite sur ce lot

- Suppression des transitions de navigation hardcodees (re-implementees localement) au profit du socle commun.
- Suppression du bloc d'enregistrement SW redondant sur la page d'accueil.

## Compatibilite

- Les comportements gameplay/UI existants sont conserves.
- Un fallback local est maintenu dans chaque page pour eviter toute regression pendant la migration hybride.

## Etape suivante recommandee

Migrer le lot 2 (`levier.html`, `enigme1-4.html`, `scanner1-4.html`) pour supprimer la majorite des duplications de `cinematicTransitionTo`.
