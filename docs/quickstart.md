# Quickstart

Objectif: lancer le projet en moins de 2 minutes.

## 1) Demarrer le serveur local

Depuis la racine du projet:

```bash
python3 -m http.server 5500
```

## 2) Ouvrir le jeu

Dans le navigateur:

- `http://localhost:5500`

## 3) Tester le scanner QR

- Ouvrir une page scanner (`pages/02-puzzles/scanner1.html`, etc.)
- Scanner un QR de demo (`docs/qr-codes/e1.png` a `docs/qr-codes/e4.png`)

## Notes importantes

- Aucun `npm install` n'est necessaire.
- Aucune config Ably/ngrok n'est necessaire.
- Sur smartphone, la camera web demande `https` (ou `localhost`).
- Les QR de `docs/qr-codes/` peuvent etre rescannes autant de fois que necessaire.
