# Phase 4 - Migration lot 4

Date: 2026-03-24

Pages migrees vers le socle commun:

- `artefact4.html`
- `credit.html`
- `dialogue-mechant-defaite.html`
- `dialogue-mechant.html`
- `dialogue-professeur-artifact2.html`
- `dialogue-professeur-artifact3.html`
- `dialogue-professeur-victoire.html`
- `fin.html`
- `lesartefacts.html`
- `maze-win.html`
- `maze.html`
- `mini-radar.html`
- `pacman.html`
- `qr-code2.html`
- `qr-code3.html`
- `resultatjeu1.html`
- `reward-screen.html`
- `space-war.html`

Changements:

- ajout `styles/tokens.css`
- ajout `scripts/core/app-core.js`
- ajout boot standardise via `core.boot(...)`
- enregistrement SW centralise via `core.sw.register(...)`

Etat final migration pages:

- 37/37 pages avec tokens partages
- 37/37 pages avec core script partage
- 0 appel direct `navigator.serviceWorker.register(...)`
