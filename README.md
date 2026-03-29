# The Camp - Guide projet

Ce README explique comment lancer le projet rapidement, puis ou modifier le code.

## Demarrage ultra simple (2 minutes)

Prerequis minimaux:

- `python3` installe
- un navigateur moderne (Chrome, Edge, Safari)

Depuis la racine du projet:

```bash
python3 -m http.server 5500
```

Puis ouvrir:

- `http://localhost:5500`

Important:

- Aucun `npm install` n'est necessaire.
- Aucune cle Ably n'est necessaire (bridge desactive).
- Le scanner QR marche en local sur desktop avec webcam.
- Sur smartphone, la camera demande une URL `https` (ou `localhost`).

Pour une version encore plus courte, voir `docs/quickstart.md`.

## QR de demo prets a l'emploi

- Les QR de demo sont deja fournis dans `docs/qr-codes/e1.png` a `docs/qr-codes/e4.png`.
- Tu peux imprimer directement `docs/qr-codes/print-a4.html`.
- Les QR de demo peuvent etre rescannes sans limite sur le meme appareil.

## Arborescence (source of truth)

```text
thecampmmi/
  index.html                      # entree unique (menu)
  style.css                       # style du menu d'accueil
  manifest.json                   # PWA manifest
  service-worker.js               # cache offline

  pages/
    00-entry/
      selection-personnage.html
    01-story/
      dialogue.html
      levier.html
      dialogue-mechant.html
      dialogue-mechant-defaite.html
      profdialogue.html
      sergent-dialogue.html
      dialogue-professeur-artifact2.html
      dialogue-professeur-artifact3.html
      dialogue-professeur-victoire.html
    02-puzzles/
      enigme1.html
      enigme2.html
      enigme3.html
      enigme4.html
      scanner1.html
      scanner2.html
      scanner3.html
      scanner4.html
      qr-code1.html
      qr-code2.html
      qr-code3.html
      qr-code4.html
    03-games/
      maze.html
      maze-win.html
      mini-radar.html
      pacman.html
      space-war.html
    04-progression/
      resultatjeu1.html
      hopital-intro.html
      hopital1.html
      artefact2.html
      artefact4.html
      reward-screen.html
      lesartefacts.html
    05-ending/
      fin.html
      credit.html

  styles/
    tokens.css                    # design tokens globaux
    components/
      reset.css                   # reset commun
      backdrop.css                # fond/grain commun
      transitions.css             # transition/flash/fade communs
    pages/
      entry/*.css
      story/*.css
      puzzles/*.css
      games/*.css
      progression/*.css
      ending/*.css

  scripts/
    core/
      app-core.js                 # API commune (navigation/audio/storage/dom/sw)
      bridge-config.js            # (optionnel) ancien bridge desktop <-> mobile
      scan-bridge.js              # (optionnel) ancien bridge de sync mobile
      qr-config.js                # config validation QR signee (issuer/cles publiques)
      qr-validator.js             # validateur QR signe (format/signature/nonce)
    tools/
      generate-qr-keys.js         # genere paire de cles P-256 (JWK)
      sign-qr-token.js            # signe un payload et renvoie un token TC1
    pages/
      index.js
      00-entry/*.js
      01-story/*.js
      02-puzzles/*.js
      03-games/*.js
      04-progression/*.js
      05-ending/*.js
    features/                     # reserve pour modules transverses
    games/                        # reserve pour moteurs mini-jeux

  img/                            # assets image
  audio/                          # assets audio
  docs/
    architecture-map.md           # carte architecture detaillee
    qa-checklist.md               # checklist manuelle de verification runtime
    qr-signature.md               # procedure avancee de generation/validation QR
    quickstart.md                 # demarrage en 2 minutes
    qr-codes/                     # QR de demo pre-generes (png + planche A4)
    refactor/*.md                 # historique des phases
```

## Ou modifier selon le besoin

- Modifier le menu principal: `index.html`, `style.css`, `scripts/pages/index.js`.
- Modifier une page narrative: `pages/01-story/*.html`, `styles/pages/story/*.css`, `scripts/pages/01-story/*.js`.
- Modifier enigmes/scanners/QR: `pages/02-puzzles/*` + CSS/JS correspondants.
- Modifier mini-jeux: `pages/03-games/*` + CSS/JS correspondants.
- Modifier progression: `pages/04-progression/*` + CSS/JS correspondants.
- Modifier fin/credits: `pages/05-ending/*` + CSS/JS correspondants.
- Modifier logique commune: `scripts/core/app-core.js`.
- Modifier validation QR signee: `scripts/core/qr-config.js`, `scripts/core/qr-validator.js`.
- Sync desktop/mobile (bridge Ably) desactivee par defaut pour simplifier l'installation.
- Modifier theme global: `styles/tokens.css`.
- Modifier transitions/backdrop communs: `styles/components/transitions.css`, `styles/components/backdrop.css`.
- Modifier PWA: `manifest.json`, `service-worker.js`.

## Conventions techniques

- Dans `pages/*/*.html`, garder `<base href="../../" />`.
- Eviter le CSS inline: utiliser `styles/pages/<lot>/<page>.css`.
- Eviter le JS inline: utiliser `scripts/pages/<lot>/<page>.js`.
- Favoriser la mutualisation dans `styles/components/` et `scripts/features/`.

## Etat actuel

- 0 bloc `<style>` inline dans les pages actives.
- 0 bloc `<script>` inline dans les pages actives.
- 0 reference locale manquante (HTML/CSS/images/scripts).

## Verification fonctionnelle

- Utiliser la checklist complete: `docs/qa-checklist.md`.

## QR codes signes (scanner)

- Les pages scanner (`pages/02-puzzles/scanner1.html` a `pages/02-puzzles/scanner4.html`) valident maintenant des tokens signes.
- Format attendu: `TC1.<payload_b64url>.<signature_b64url>`.
- Signature: ECDSA P-256 SHA-256 en format `r||s` (`ieee-p1363`, 64 bytes).
- Le payload doit inclure au minimum: `iss`, `kid`, `p`, `nonce`.

Generation locale (avance):

```bash
# 1) generer une paire de cles JWK
node scripts/tools/generate-qr-keys.js > qr-keys.json

# 2) generer un token signe pour une enigme
node scripts/tools/sign-qr-token.js --private-key private-jwk.json --puzzle E1
```

Details et exemples complets: `docs/qr-signature.md`.

## Scanner simplifie (sans Ably)

- Le scanner fonctionne maintenant sans bridge temps reel desktop/mobile.
- Aucune cle Ably ni tunnel ngrok n'est necessaire pour lancer le projet.
- Le scan se fait directement sur l'appareil qui ouvre `pages/02-puzzles/scanner*.html`.
- Le mode demo autorise les rescans repetes des QR de `docs/qr-codes/`.

## Verification statique rapide

- Lancer le script d'integrite:

```bash
python3 scripts/check-project.py
```

- Le script verifie:
  - absence de `<style>` inline sur les pages actives
  - absence de `<script>` inline sur les pages actives
  - references locales HTML resolues
  - imports/url CSS resolus
  - syntaxe JS (`node --check`) sur `scripts/**/*.js`
