# Phase 3 - Socle commun

Date: 2026-03-24

## Livrables realises

- `scripts/core/app-core.js` etendu en noyau partage.
- `styles/tokens.css` ajoute pour centraliser les tokens design.
- `style.css` branche sur les tokens via `@import "./styles/tokens.css"`.

## API disponible (`TheCampCore`)

- `boot(options)`
  - applique reduced-motion
  - peut binder automatiquement les boutons `[data-nav]`
  - peut enregistrer le service worker
  - peut activer reprise audio au premier geste utilisateur
- `navigation`
  - `transitionTo(url, { delay, bodyClass })`
  - `cinematicTransitionTo(...)` (alias)
  - `goBack(fallbackUrl, options)`
  - `bindDataNav(root)`
- `audio`
  - `resume()`
  - `tone(options)`
  - `uiConfirm()`, `uiError()`, `uiTick()`
- `storage`
  - `get/set`
  - `getJSON/setJSON`
  - `getBool/setBool`
  - `remove`
- `dom`
  - `qs/qsa`
  - `on`
  - `toggleClass`
- `sw.register(path)`
- `settings.get()` / `settings.set(name, value)`

Compatibilite legacy conservee:

- `TheCamp` reste expose avec `getSettings`, `setSetting`, `transitionTo`, `registerServiceWorker`.

## Exemple d'integration page (phase 4)

```html
<script src="scripts/core/app-core.js"></script>
<script>
  TheCampCore.boot({ autoBindNav: true, autoResumeAudio: true, registerSW: true });
  TheCampCore.navigation.transitionTo("selection-personnage.html");
</script>
```

## Tokens CSS centralises

Le fichier `styles/tokens.css` expose:

- couleurs (`--color-*`)
- typos (`--font-*`)
- rayons/ombres (`--radius-*`, `--shadow-*`)
- durees (`--duration-*`)
- safe-areas (`--safe-*`)

Des alias legacy sont gardes (`--text`, `--panel`, `--green1`, etc.) pour eviter toute regression immediate.
