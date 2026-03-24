# Phase 5 - Qualite et robustesse

Date: 2026-03-24

## Actions realisees

- Migration des pages critiques vers le socle commun (`TheCampCore`) pour la navigation et le boot.
- Suppression des appels directs `navigator.serviceWorker.register(...)` dans les pages HTML migrees, remplaces par `core.sw.register(...)`.
- Verification de references locales manquantes dans les pages HTML.
- Correction de 10 references audio invalides:
  - `profdialogue.html` -> `audio/chill.mp3`
  - `sergent-dialogue.html` -> `audio/chill.mp3`
  - `hopital1.html` -> `audio/chill.mp3`
  - `dialogue-professeur-artifact2.html` -> `audio/chill.mp3` (2 sources)
  - `reward-screen.html` -> `audio/chill.mp3` (5 sources)

## Etat des references detectees

References locales restantes:

- Aucune reference locale manquante detectee dans les pages HTML.

## Verifications fonctionnelles cibles

- Navigation lot 1 + lot 2 intacte (back/next/transitions).
- Scanner: fallback erreurs camera deja present (permission/not found/not readable).
- Service worker: enregistrement centralise sur les pages migrees.
