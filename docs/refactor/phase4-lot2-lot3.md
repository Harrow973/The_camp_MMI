# Phase 4 - Migration lots 2 et 3

Date: 2026-03-24

## Lot 2 (levier + enigmes + scanners)

Pages migrees:

- `levier.html`
- `enigme1.html`, `enigme2.html`, `enigme3.html`, `enigme4.html`
- `scanner1.html`, `scanner2.html`, `scanner3.html`, `scanner4.html`

Changements:

- ajout `styles/tokens.css`
- ajout `scripts/core/app-core.js`
- migration de `cinematicTransitionTo` vers `core.navigation.transitionTo(...)` (avec fallback)
- migration SW vers `core.sw.register(...)`

## Lot 3 (dialogues/chapitres relies)

Pages migrees:

- `sergent-dialogue.html`
- `profdialogue.html`
- `hopital-intro.html`
- `hopital1.html`
- `qr-code1.html`
- `qr-code4.html`
- `artefact2.html`

Changements:

- ajout `styles/tokens.css`
- ajout `scripts/core/app-core.js`
- remplacement des scripts SW locaux par `core.sw.register(...)`
- standardisation du boot page via `core.boot(...)`
