# Phase 1 - Audit et cartographie

Date: 2026-03-24

## Vue d'ensemble

- Pages HTML: 37
- Lignes HTML cumulees: 26627
- Pages avec CSS inline (`<style>`): 36/37
- Pages avec JS inline (`<script>`): 36/37
- Pages qui chargent `style.css`: 2 (`index.html`, `maze-win.html`)
- Pages qui referencent `manifest.json`: 18/37
- Pages qui referencent `service-worker.js`: 16/37

## Points structurants observes

- Le projet est majoritairement compose de pages autonomes (inline CSS/JS) avec logique locale.
- La duplication est forte sur les patterns de transition, d'audio WebAudio et de navigation back/next.
- `cinematicTransitionTo` est redefine dans 10 pages (`dialogue.html`, `enigme1-4.html`, `levier.html`, `scanner1-4.html`).
- Fonctions frequemment dupliquees (>= 8 pages): `ensureAudio`, `setupParallax`, `typeWriter`, `next`, `setReady`, `cinematicTransitionTo`, `shake`.

## Cartographie des routes detectees

Flux principal detecte (sans mini-jeux alternatifs):

1. `index.html` -> `selection-personnage.html`
2. `selection-personnage.html` -> `dialogue.html`
3. `dialogue.html` -> `levier.html`
4. `levier.html` -> `dialogue-mechant.html`
5. `dialogue-mechant.html` -> `profdialogue.html`
6. `profdialogue.html` -> `sergent-dialogue.html`
7. `sergent-dialogue.html` -> `enigme1.html` -> `scanner1.html` -> `qr-code1.html`
8. `resultatjeu1.html` -> `hopital-intro.html` -> `maze.html`/`maze-win.html` -> `hopital1.html`
9. `hopital1.html` -> `enigme2.html` -> `scanner2.html` -> `qr-code2.html` -> `artefact2.html` -> `reward-screen.html`
10. `reward-screen.html` -> `dialogue-professeur-artifact2.html` -> `enigme3.html` -> `scanner3.html` -> `qr-code3.html`
11. `dialogue-professeur-victoire.html` -> `artefact4.html` -> `lesartefacts.html` -> `fin.html` -> `credit.html`

Mini-jeux/pages satellites identifies:

- `mini-radar.html`, `pacman.html`, `space-war.html`, `dialogue-mechant-defaite.html`, `qr-code4.html`.

## Fichiers lourds (top 8)

1. `space-war.html` (1570 lignes)
2. `qr-code3.html` (1442 lignes)
3. `qr-code2.html` (1370 lignes)
4. `artefact4.html` (1041 lignes)
5. `resultatjeu1.html` (1041 lignes)
6. `mini-radar.html` (997 lignes)
7. `maze.html` (955 lignes)
8. `fin.html` (933 lignes)

## Risques techniques

- Divergence de comportements entre pages qui implementent la meme feature.
- Maintenance couteuse: correction d'un bug = N modifications manuelles.
- Cohabitation partielle PWA (manifest + SW sur un sous-ensemble de pages).
- Potentiel de regressions navigation plus eleve (URLs hardcodees en de multiples endroits).

## Decision pour la suite

- Refactorisation progressive confirmee (pas de big-bang).
- Priorite migration: transition/navigation/audio/shared helpers avant extraction des mini-jeux.
