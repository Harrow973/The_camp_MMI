# Scripts Pages

Ce dossier contient les scripts extraits des pages HTML.

Organisation:

- `scripts/pages/index.js` pour `index.html`
- `scripts/pages/<lot>/<page>.js` pour `pages/<lot>/<page>.html`

Convention:

- Un seul fichier JS par page.
- Le comportement historique est preserve (fusion des anciens blocs inline dans l'ordre d'origine).
- Les fonctions communes doivent progressivement migrer vers `scripts/features/`.
