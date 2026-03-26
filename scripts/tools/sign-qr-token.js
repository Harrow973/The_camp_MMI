#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");

function toBase64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function parseArgs(argv) {
  const args = {
    kid: "k1",
    issuer: "thecamp",
    prefix: "TC1",
    expiresInSec: null,
    nbfDelaySec: null
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;

    const key = token.slice(2);
    const next = argv[i + 1];

    if (key === "help") {
      args.help = true;
      continue;
    }

    if (next == null || next.startsWith("--")) {
      throw new Error("Missing value for --" + key);
    }

    args[key] = next;
    i += 1;
  }

  return args;
}

function printHelp() {
  const lines = [
    "Usage:",
    "  node scripts/tools/sign-qr-token.js --private-key private-jwk.json --puzzle E1 [options]",
    "",
    "Required:",
    "  --private-key   Path to EC private JWK JSON file",
    "  --puzzle        Puzzle id (E1, E2, E3, E4)",
    "",
    "Optional:",
    "  --kid           Key id included in payload (default: k1)",
    "  --issuer        Payload issuer (default: thecamp)",
    "  --prefix        Token prefix (default: TC1)",
    "  --nonce         Force nonce value (default: randomUUID)",
    "  --expires-in    Expiration in seconds from now (default: none)",
    "  --nbf-delay     Not-before delay in seconds from now (default: none)",
    "",
    "Output:",
    "  Prints a JSON object containing payload and signed token"
  ];
  process.stdout.write(lines.join("\n") + "\n");
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  if (!args["private-key"]) {
    throw new Error("--private-key is required");
  }
  if (!args.puzzle) {
    throw new Error("--puzzle is required");
  }

  const privateKeyRaw = fs.readFileSync(args["private-key"], "utf8");
  const privateJwk = JSON.parse(privateKeyRaw);

  const privateKey = crypto.createPrivateKey({
    key: privateJwk,
    format: "jwk"
  });

  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    iss: args.issuer,
    kid: args.kid,
    p: args.puzzle,
    nonce: args.nonce || crypto.randomUUID()
  };

  if (args["nbf-delay"] != null) {
    const delay = Number(args["nbf-delay"]);
    if (!Number.isFinite(delay) || delay < 0) {
      throw new Error("--nbf-delay must be a positive number");
    }
    payload.nbf = nowSec + Math.floor(delay);
  }

  if (args["expires-in"] != null) {
    const ttl = Number(args["expires-in"]);
    if (!Number.isFinite(ttl) || ttl <= 0) {
      throw new Error("--expires-in must be a positive number");
    }
    payload.exp = nowSec + Math.floor(ttl);
  }

  const payloadBytes = Buffer.from(JSON.stringify(payload), "utf8");
  const signatureRaw = crypto.sign("sha256", payloadBytes, {
    key: privateKey,
    dsaEncoding: "ieee-p1363"
  });

  const payloadB64 = toBase64Url(payloadBytes);
  const sigB64 = toBase64Url(signatureRaw);
  const token = [args.prefix, payloadB64, sigB64].join(".");

  process.stdout.write(JSON.stringify({ payload, token }, null, 2) + "\n");
}

try {
  main();
} catch (err) {
  process.stderr.write("Error: " + err.message + "\n");
  process.exitCode = 1;
}
