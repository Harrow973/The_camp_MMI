#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");

const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "prime256v1"
});

const privateJwk = privateKey.export({ format: "jwk" });
const publicJwk = publicKey.export({ format: "jwk" });

const output = {
  kid: process.argv[2] || "k1",
  publicJwk: {
    kty: publicJwk.kty,
    crv: publicJwk.crv,
    x: publicJwk.x,
    y: publicJwk.y,
    ext: true,
    key_ops: ["verify"]
  },
  privateJwk
};

process.stdout.write(JSON.stringify(output, null, 2) + "\n");
