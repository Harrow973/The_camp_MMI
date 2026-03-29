# QR signature setup

Scanner pages require signed QR tokens.

This document is for advanced usage (custom key rotation, custom tokens).

For the simplest run, use the pre-generated demo QR images in `docs/qr-codes/`.

## Token format

- Format: `TC1.<payload_b64url>.<signature_b64url>`
- Payload is UTF-8 JSON, example:

```json
{"iss":"thecamp","kid":"k1","p":"E2","nonce":"abc-123"}
```

Supported payload fields:

- `iss` (required): issuer, must be `thecamp`
- `kid` (required): key id used to pick public key
- `p` (required): puzzle id (`E1`, `E2`, `E3`, `E4`)
- `nonce` (required): unique value carried in payload (anti-replay optional by config)
- `nbf` (optional): not-before unix timestamp (seconds)
- `exp` (optional): expiration unix timestamp (seconds)

Signature format:

- ECDSA P-256 SHA-256
- Signature bytes are raw `r||s` (`ieee-p1363`, 64 bytes), then base64url encoded

## Public key config

Edit `scripts/core/qr-config.js` and replace:

- `keys.k1.x`
- `keys.k1.y`

With your P-256 public key coordinates (base64url, no padding).

## Generate keys and tokens (Node)

1. Generate a new key pair:

```bash
node scripts/tools/generate-qr-keys.js > qr-keys.json
```

2. Split the output into 2 files:

- keep `privateJwk` in a private file outside the web app (example: `private-jwk.json`)
- copy `publicJwk.x` and `publicJwk.y` into `scripts/core/qr-config.js` under `keys.k1`

3. Generate a signed token for one puzzle:

```bash
node scripts/tools/sign-qr-token.js --private-key private-jwk.json --puzzle E1
```

Optional expiration example (1 hour):

```bash
node scripts/tools/sign-qr-token.js --private-key private-jwk.json --puzzle E2 --expires-in 3600
```

The script prints JSON with `token`. Use that value as the QR content.

## Runtime files

- Validator: `scripts/core/qr-validator.js`
- Scanner integration: `scripts/pages/02-puzzles/scanner1.js` to `scripts/pages/02-puzzles/scanner4.js`

## Replay protection mode

- Demo mode (default in this repository): `enforceNonceReplayProtection: false` in `scripts/core/qr-config.js`
- Strict mode (recommended for production): set `enforceNonceReplayProtection: true`
