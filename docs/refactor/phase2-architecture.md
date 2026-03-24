# Phase 2 - Architecture cible

Date: 2026-03-24

## Arborescence cible

```text
thecampmmi/
  pages/                  # Destination des pages HTML migrees
  assets/
    img/                  # Images communes
    audio/                # Audio commun
  styles/
    tokens.css            # Variables design globales
    base.css              # Reset/layout commun (phase 4)
    components/           # Composants partages (phase 4)
  scripts/
    core/
      app-core.js         # Noyau partage (navigation/audio/storage/helpers)
    features/             # Features transverses (dialogue, scanner, loader)
    games/                # Logique des mini-jeux
  docs/
    refactor/
      phase1-audit.md
      phase2-architecture.md
      phase3-socle.md
```

## Etat actuel

- Les dossiers `pages/`, `assets/`, `styles/`, `scripts/features/`, `scripts/games/` sont crees.
- L'existant reste compatible (aucun deplacement destructif de pages/fichiers legacy).

## Conventions retenues

- Nommage fichiers: kebab-case (`dialogue-professeur-victoire.html`).
- Variables CSS globales: prefixe `--color-*`, `--radius-*`, `--duration-*`.
- API JS partagee: namespace global unique `TheCampCore` (alias compat `TheCamp`).
- Navigation: priorite a `data-nav` + `TheCampCore.navigation.transitionTo(...)`.
- Stockage: centralise via `TheCampCore.storage` avec cles prefixees `tc_*`.

## Regles de migration (phases 4+)

1. Migrer par lot de flux fonctionnel (menu -> selection -> dialogue...).
2. Extraire d'abord les duplications stables (transition, audio UI, SW register).
3. Ne pas casser les URLs legacy pendant la migration (redirections ou doubles chemins si besoin).
4. Maintenir le gameplay identique avant d'optimiser le code.
