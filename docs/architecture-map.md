# Architecture map

Date: 2026-03-24

## Arborescence explicite (source of truth)

```text
thecampmmi/
  index.html                     # entree unique (menu principal)
  style.css                      # style du menu principal
  manifest.json                  # metadonnees PWA
  service-worker.js              # cache offline

  pages/
    00-entry/                    # entree
      selection-personnage.html
    01-story/                    # scenes narratif
      dialogue*.html
      levier.html
      profdialogue.html
      sergent-dialogue.html
    02-puzzles/                  # enigmes + scanner + QR
      enigme*.html
      scanner*.html
      qr-code*.html
    03-games/                    # mini-jeux
      maze*.html
      mini-radar.html
      pacman.html
      space-war.html
    04-progression/              # progression narrative
      resultatjeu1.html
      hopital*.html
      artefact*.html
      reward-screen.html
      lesartefacts.html
    05-ending/                   # fin
      fin.html
      credit.html


  scripts/
    core/
      app-core.js                # navigation/audio/storage/dom/sw
    pages/                       # scripts extraits des pages HTML
      index.js
      <lot>/<page>.js
    features/                    # reserve (pas encore peuple)
    games/                       # reserve (pas encore peuple)

  styles/
    tokens.css                   # variables design globales
    components/
      reset.css                  # reset commun partage
    pages/                       # styles page-specifiques (1 fichier par page)
      entry/
      story/
      puzzles/
      games/
      progression/
      ending/

  img/                           # images du jeu
  audio/                         # audio du jeu (actuel: chill.mp3)
  docs/
    architecture-map.md          # ce document
    qa-checklist.md              # checklist de verification runtime
    refactor/*.md                # historique de migration
```

## Ou chercher selon le type de modification

- Modifier le menu principal: `index.html`, `style.css`.
- Modifier le theme global (couleurs, rayons, durees, reduced-motion): `styles/tokens.css`.
- Modifier la logique partagee (transitions, storage, audio UI, SW register): `scripts/core/app-core.js`.
- Modifier une scene/page precise: `pages/<lot>/<nom-page>.html`.
- Modifier le comportement scanner QR camera: `pages/02-puzzles/scanner1.html` a `pages/02-puzzles/scanner4.html`.
- Modifier les mini-jeux: `pages/03-games/maze.html`, `pages/03-games/mini-radar.html`, `pages/03-games/pacman.html`, `pages/03-games/space-war.html`.
- Modifier la PWA/offline: `manifest.json`, `service-worker.js`.
- Modifier les medias: `img/*`, `audio/*`.

## Flux principal (resume)

- `index.html` -> `pages/00-entry/selection-personnage.html` -> `pages/01-story/dialogue.html` -> `pages/01-story/levier.html`
- -> `pages/01-story/dialogue-mechant.html` -> `pages/01-story/profdialogue.html` -> `pages/01-story/sergent-dialogue.html`
- -> `pages/02-puzzles/enigme1.html` -> `pages/02-puzzles/scanner1.html` -> `pages/02-puzzles/qr-code1.html` -> `pages/03-games/mini-radar.html`
- -> `pages/04-progression/resultatjeu1.html` -> `pages/04-progression/hopital-intro.html` -> `pages/03-games/maze.html` -> `pages/04-progression/hopital1.html`
- -> `pages/02-puzzles/enigme2.html` -> `pages/02-puzzles/scanner2.html` -> `pages/02-puzzles/qr-code2.html` -> `pages/04-progression/artefact2.html`
- -> `pages/04-progression/reward-screen.html` -> `pages/01-story/dialogue-professeur-artifact2.html`
- -> `pages/02-puzzles/enigme3.html` -> `pages/02-puzzles/scanner3.html` -> `pages/02-puzzles/qr-code3.html` -> `pages/01-story/dialogue-professeur-artifact3.html`
- -> `pages/02-puzzles/enigme4.html` -> `pages/02-puzzles/scanner4.html` -> `pages/02-puzzles/qr-code4.html` -> `pages/03-games/space-war.html`
- -> `pages/01-story/dialogue-mechant-defaite.html` -> `pages/01-story/dialogue-professeur-victoire.html`
- -> `pages/04-progression/artefact4.html` -> `pages/04-progression/lesartefacts.html` -> `pages/05-ending/fin.html` -> `pages/05-ending/credit.html`

## Regles pratiques pour eviter de se perdre

- Toute nouvelle page doit etre creee dans `pages/<lot>/`.
- Conserver `<base href="../../" />` dans les pages de sous-dossier.
- Garder les liens HTML au format racine `pages/<lot>/<cible>.html`.
- Garder les styles specifiques dans `styles/pages/<lot>/<page>.css`.

## Etat compatibilite

- Les routeurs de compatibilite `pages/*.html` ont ete supprimes.
- Les liens pointent desormais directement vers les pages groupees (`pages/<lot>/<page>.html`).

## Etat CSS

- Extraction CSS inline terminee sur les pages groupees (`pages/*/*.html`).
- Chaque page groupee charge son fichier dedie dans `styles/pages/<lot>/`.
- Chaque CSS de page importe `styles/components/reset.css` pour factoriser le reset de base.
- Factorisation composant commencee: `styles/components/backdrop.css`, `styles/components/transitions.css`.

## Etat JS

- Extraction JS inline terminee sur `index.html` et `pages/*/*.html`.
- Les scripts de page sont dans `scripts/pages/` (1 fichier JS par page).
- Eviter d'ajouter de nouvelles logiques inline dupliquees: preferer `app-core.js`.

## Nettoyage applique

- `menu.js` supprime (fichier legacy non reference)
- `selection.js` supprime (fichier legacy non reference)
- fichiers `.DS_Store` supprimes (`./`, `audio/`, `img/`)
- assets image non references supprimes
