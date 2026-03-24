# Pages

Point d'entree global:

- `../index.html`

Organisation actuelle:

- `00-entry/` : entree narrative
- `01-story/` : dialogues et scenes narratif
- `02-puzzles/` : enigmes, scanners, QR
- `03-games/` : mini-jeux
- `04-progression/` : ecrans de progression et transitions chapitre
- `05-ending/` : fin et credits

Fichiers a modifier:

- Les fichiers reels sont uniquement dans les sous-dossiers ci-dessus.
- Il n'y a plus de routeurs `pages/*.html` de compatibilite.

Regles:

- Dans les pages reelles, garder `<base href="../../" />`.
- Referencer les assets partages via chemins racine (`styles/...`, `scripts/...`, `img/...`, `audio/...`, `pages/...`).
- Stocker le CSS de page dans `styles/pages/<lot>/<page>.css` (pas de gros bloc `<style>` inline).
- Dans `styles/pages/<lot>/<page>.css`, importer `@import url("../../components/reset.css");` en tete de fichier.
- Stocker le JS de page dans `scripts/pages/<lot>/<page>.script*.js` (pas de gros bloc `<script>` inline).
