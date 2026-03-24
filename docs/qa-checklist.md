# QA checklist (manuelle)

Date: 2026-03-24

Objectif: verifier le bon fonctionnement runtime dans le navigateur (au-dela des checks statiques).

## Preparation

- Lancer en local:

```bash
python3 -m http.server 5500
```

- Ouvrir `http://localhost:5500`.
- Vider les caches navigateur si besoin (apres changements SW/CSS/JS).

## Checklist globale

- [ ] Le menu (`index.html`) s'affiche correctement (desktop + mobile).
- [ ] Les boutons Jouer/Credits naviguent vers les pages attendues.
- [ ] Aucune erreur rouge dans la console navigateur.
- [ ] Les transitions de page (`is-transitioning`) sont visibles et non bloquees.
- [ ] Les polices Google se chargent correctement.
- [ ] Le son UI fonctionne quand non mute (et ne bloque pas la navigation).

## Parcours principal (end-to-end)

- [ ] `index` -> `pages/00-entry/selection-personnage.html`
- [ ] `pages/00-entry/selection-personnage.html` -> `pages/01-story/dialogue.html`
- [ ] `pages/01-story/dialogue.html` -> `pages/01-story/levier.html`
- [ ] `pages/01-story/levier.html` -> `pages/01-story/dialogue-mechant.html`
- [ ] `pages/01-story/dialogue-mechant.html` -> `pages/01-story/profdialogue.html`
- [ ] `pages/01-story/profdialogue.html` -> `pages/01-story/sergent-dialogue.html`
- [ ] `pages/01-story/sergent-dialogue.html` -> `pages/02-puzzles/enigme1.html`
- [ ] `pages/02-puzzles/enigme1.html` -> `pages/02-puzzles/scanner1.html`
- [ ] `pages/02-puzzles/scanner1.html` -> `pages/02-puzzles/qr-code1.html`
- [ ] `pages/02-puzzles/qr-code1.html` -> `pages/03-games/mini-radar.html`
- [ ] `pages/03-games/mini-radar.html` -> `pages/04-progression/resultatjeu1.html`
- [ ] `pages/04-progression/resultatjeu1.html` -> `pages/04-progression/hopital-intro.html`
- [ ] `pages/04-progression/hopital-intro.html` -> `pages/03-games/maze.html`
- [ ] `pages/03-games/maze.html` -> `pages/04-progression/hopital1.html`
- [ ] `pages/04-progression/hopital1.html` -> `pages/02-puzzles/enigme2.html`
- [ ] `pages/02-puzzles/enigme2.html` -> `pages/02-puzzles/scanner2.html`
- [ ] `pages/02-puzzles/scanner2.html` -> `pages/02-puzzles/qr-code2.html`
- [ ] `pages/02-puzzles/qr-code2.html` -> `pages/04-progression/artefact2.html`
- [ ] `pages/04-progression/artefact2.html` -> `pages/04-progression/reward-screen.html`
- [ ] `pages/04-progression/reward-screen.html` -> `pages/01-story/dialogue-professeur-artifact2.html`
- [ ] `pages/01-story/dialogue-professeur-artifact2.html` -> `pages/02-puzzles/enigme3.html`
- [ ] `pages/02-puzzles/enigme3.html` -> `pages/02-puzzles/scanner3.html`
- [ ] `pages/02-puzzles/scanner3.html` -> `pages/02-puzzles/qr-code3.html`
- [ ] `pages/02-puzzles/qr-code3.html` -> `pages/01-story/dialogue-professeur-artifact3.html`
- [ ] `pages/01-story/dialogue-professeur-artifact3.html` -> `pages/02-puzzles/enigme4.html`
- [ ] `pages/02-puzzles/enigme4.html` -> `pages/02-puzzles/scanner4.html`
- [ ] `pages/02-puzzles/scanner4.html` -> `pages/02-puzzles/qr-code4.html`
- [ ] `pages/02-puzzles/qr-code4.html` -> `pages/03-games/space-war.html`
- [ ] `pages/03-games/space-war.html` -> `pages/01-story/dialogue-mechant-defaite.html`
- [ ] `pages/01-story/dialogue-mechant-defaite.html` -> `pages/01-story/dialogue-professeur-victoire.html`
- [ ] `pages/01-story/dialogue-professeur-victoire.html` -> `pages/04-progression/artefact4.html`
- [ ] `pages/04-progression/artefact4.html` -> `pages/04-progression/lesartefacts.html`
- [ ] `pages/04-progression/lesartefacts.html` -> `pages/05-ending/fin.html`
- [ ] `pages/05-ending/fin.html` -> `pages/05-ending/credit.html`

## Pages mini-jeux (focus)

- [ ] `pages/03-games/maze.html` (controle tactile/clavier, victoire)
- [ ] `pages/03-games/mini-radar.html` (game loop, result)
- [ ] `pages/03-games/pacman.html` (demarrage, collisions, score)
- [ ] `pages/03-games/space-war.html` (controls, victoire/defaite)

## Scanner / camera

- [ ] `pages/02-puzzles/scanner1.html` a `pages/02-puzzles/scanner4.html` ouvrent la camera si autorisee.
- [ ] Les messages d'erreur permission/camera absente s'affichent correctement.
- [ ] Le flux de redirection succes marche apres scan.

## PWA / offline

- [ ] Le service worker s'enregistre sans erreur.
- [ ] Le manifest est detecte par le navigateur.
- [ ] Test offline simple: charger `index.html` puis couper le reseau et verifier le fallback attendu.

## Responsive

- [ ] Test mobile portrait.
- [ ] Test mobile paysage.
- [ ] Test desktop largeur >= 1280.

## Criteres de sortie

- [ ] 0 erreur console bloquante.
- [ ] 0 page blanche.
- [ ] 0 lien mort dans le parcours principal.
- [ ] 0 regression gameplay bloquante.
