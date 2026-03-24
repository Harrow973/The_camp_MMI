# Phase 7 - Documentation et handover

Date: 2026-03-24

## Conventions de base

- HTML pages: garder les noms en kebab-case.
- CSS global: definir les variables dans `styles/tokens.css`.
- JS transverse: exposer les utilitaires via `TheCampCore` (`navigation`, `audio`, `storage`, `dom`, `sw`).
- Transitions: utiliser `TheCampCore.navigation.transitionTo(...)`.
- Service worker: utiliser `TheCampCore.sw.register(...)`.

## Checklist "ajouter une nouvelle page"

1. Ajouter `<link rel="stylesheet" href="styles/tokens.css">` dans le `<head>`.
2. Si PWA souhaitee, ajouter `<link rel="manifest" href="manifest.json">`.
3. Ajouter `scripts/core/app-core.js` avant le script principal.
4. Appeler `core.boot({ autoBindNav: false, autoResumeAudio: false })`.
5. Utiliser `core.navigation.transitionTo(...)` pour les redirections.
6. Enregistrer SW via `core.sw.register("service-worker.js")` si la page est dans le scope offline.
7. Verifier les liens locaux (images/audio/scripts) avant livraison.

## Strategie de deplacement des fichiers

- Le deplacement physique vers `pages/` a commence (lot A).
- Critere de depart atteint: migration core/tokens complete + 0 lien mort local detecte.
- Plan de move:
  - lot A: pages statiques/credits
  - lot B: flux principal narratif
  - lot C: mini-jeux

Etat lot A:

- pages deplacees: `pages/credit.html`, `pages/maze-win.html`
- stubs de compatibilite en racine: `credit.html`, `maze-win.html`

Etat lot B (termine):

- pages deplacees: `pages/selection-personnage.html`, `pages/dialogue.html`, `pages/levier.html`, `pages/dialogue-mechant.html`, `pages/profdialogue.html`, `pages/sergent-dialogue.html`, `pages/enigme1.html`, `pages/enigme2.html`, `pages/enigme3.html`, `pages/enigme4.html`, `pages/scanner1.html`, `pages/scanner2.html`, `pages/scanner3.html`, `pages/scanner4.html`, `pages/qr-code1.html`, `pages/resultatjeu1.html`, `pages/hopital-intro.html`, `pages/hopital1.html`
- stubs de compatibilite en racine crees pour chacune de ces pages.

Nettoyage routing:

- les pages deplacees pointent directement vers `pages/...` pour eviter les redirections intermediaires via stubs.

Etat lot C (termine):

- pages deplacees: `pages/artefact2.html`, `pages/artefact4.html`, `pages/dialogue-mechant-defaite.html`, `pages/dialogue-professeur-artifact2.html`, `pages/dialogue-professeur-artifact3.html`, `pages/dialogue-professeur-victoire.html`, `pages/fin.html`, `pages/lesartefacts.html`, `pages/maze.html`, `pages/mini-radar.html`, `pages/pacman.html`, `pages/qr-code2.html`, `pages/qr-code3.html`, `pages/qr-code4.html`, `pages/reward-screen.html`, `pages/space-war.html`
- stubs de compatibilite en racine crees pour chacune de ces pages.

Etat global:

- page d'entree conservee en racine: `index.html`
- autres pages du jeu deplacees dans `pages/`.
- redirections de compatibilite racine supprimees pendant le nettoyage final.

Methode de migration sans casse:

- deplacer la page cible vers `pages/`.
- conserver un stub en racine qui redirige vers `pages/...`.
- ajouter `<base href="../">` dans la page deplacee pour conserver les chemins relatifs existants.
