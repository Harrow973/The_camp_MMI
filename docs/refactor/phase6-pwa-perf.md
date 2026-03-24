# Phase 6 - PWA et performance

Date: 2026-03-24

## Decisions appliquees

- Option retenue: conserver la strategie PWA et l'implanter de maniere progressive.
- Uniformisation technique: les pages migrees n'appellent plus `navigator.serviceWorker.register(...)` directement.
- Les pages migrees passent par `TheCampCore.sw.register("service-worker.js")`.

## Etat actuel

- Pages HTML totales: 37
- Pages migrees avec `scripts/core/app-core.js`: 37
- Pages migrees avec `styles/tokens.css`: 37
- Appels directs SW dans HTML: 0 (retire sur les pages modifiees)
- Cache SW mis a jour: `thecamp-v2` avec app shell minimal (`index.html`, `pages/selection-personnage.html`, `pages/credit.html`, `style.css`, `styles/tokens.css`, `scripts/core/app-core.js`).

Note de structure:

- 36 pages applicatives sont deplacees dans `pages/`.
- les stubs de redirection racine ont ete supprimes dans la phase de nettoyage.
- `index.html` reste en racine comme point d'entree principal.

## Suite recommandee (phase 6 bis)

- Etendre `APP_SHELL` du `service-worker.js` selon les flux reels et les assets critiques.
- Ajouter une strategie de versionnement du cache (ex: `thecamp-v2`) lors du prochain lot.
- Ajouter un test offline manuel sur les lots de pages deja migrees vers `pages/`.
