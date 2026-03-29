(function initTheCampQR(global) {
  "use strict";

  var DEFAULT_CONFIG = {
    tokenPrefix: "TC1",
    issuer: "thecamp",
    maxClockSkewSec: 60,
    enforceNonceReplayProtection: true,
    usedNonceStorageKey: "tc_qr_used_nonces_v1",
    usedNonceMaxEntries: 500,
    keys: {}
  };

  var config = mergeConfig(DEFAULT_CONFIG, global.THE_CAMP_QR_CONFIG || {});
  var importedKeys = {};

  function mergeConfig(base, overrides) {
    var merged = {
      tokenPrefix: base.tokenPrefix,
      issuer: base.issuer,
      maxClockSkewSec: base.maxClockSkewSec,
      enforceNonceReplayProtection: base.enforceNonceReplayProtection,
      usedNonceStorageKey: base.usedNonceStorageKey,
      usedNonceMaxEntries: base.usedNonceMaxEntries,
      keys: {}
    };

    var baseKeys = base.keys || {};
    var overrideKeys = (overrides && overrides.keys) || {};
    var key;

    for (key in baseKeys) {
      if (Object.prototype.hasOwnProperty.call(baseKeys, key)) {
        merged.keys[key] = baseKeys[key];
      }
    }
    for (key in overrideKeys) {
      if (Object.prototype.hasOwnProperty.call(overrideKeys, key)) {
        merged.keys[key] = overrideKeys[key];
      }
    }

    if (overrides && typeof overrides.tokenPrefix === "string") merged.tokenPrefix = overrides.tokenPrefix;
    if (overrides && typeof overrides.issuer === "string") merged.issuer = overrides.issuer;
    if (overrides && typeof overrides.maxClockSkewSec === "number") merged.maxClockSkewSec = overrides.maxClockSkewSec;
    if (overrides && typeof overrides.enforceNonceReplayProtection === "boolean") merged.enforceNonceReplayProtection = overrides.enforceNonceReplayProtection;
    if (overrides && typeof overrides.usedNonceStorageKey === "string") merged.usedNonceStorageKey = overrides.usedNonceStorageKey;
    if (overrides && typeof overrides.usedNonceMaxEntries === "number") merged.usedNonceMaxEntries = overrides.usedNonceMaxEntries;

    return merged;
  }

  function toResult(ok, reason, message, payload) {
    return {
      ok: !!ok,
      reason: reason || null,
      message: message || "",
      payload: payload || null
    };
  }

  function getErrorMessage(reason) {
    var messages = {
      EMPTY_SCAN: "Aucun code QR detecte.",
      INVALID_FORMAT: "Format du QR invalide.",
      INVALID_PAYLOAD: "Contenu du QR invalide.",
      INVALID_ISSUER: "Ce QR ne provient pas de The Camp.",
      MISSING_KID: "QR invalide (kid manquant).",
      NO_KEY_FOR_KID: "Cle publique introuvable pour ce QR.",
      CRYPTO_UNAVAILABLE: "Verification cryptographique indisponible sur cet appareil.",
      BAD_SIGNATURE: "Signature du QR invalide.",
      WRONG_PUZZLE: "Ce QR appartient a une autre enigme.",
      EXPIRED: "Ce QR a expire.",
      NOT_YET_VALID: "Ce QR n'est pas encore valide.",
      REPLAYED: "Ce QR a deja ete utilise sur cet appareil.",
      INTERNAL_ERROR: "Erreur interne de verification QR."
    };
    return messages[reason] || "QR invalide.";
  }

  function base64UrlToBytes(input) {
    var normalized = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4 !== 0) normalized += "=";
    var raw = global.atob(normalized);
    var out = new Uint8Array(raw.length);
    var i;
    for (i = 0; i < raw.length; i += 1) {
      out[i] = raw.charCodeAt(i);
    }
    return out;
  }

  function bytesToText(bytes) {
    return new TextDecoder().decode(bytes);
  }

  function parseToken(token) {
    var parts = String(token || "").split(".");
    if (parts.length !== 3) return null;
    if (parts[0] !== config.tokenPrefix) return null;

    var payloadBytes;
    var sigBytes;
    var payload;

    try {
      payloadBytes = base64UrlToBytes(parts[1]);
      sigBytes = base64UrlToBytes(parts[2]);
      payload = JSON.parse(bytesToText(payloadBytes));
    } catch (err) {
      return null;
    }

    return {
      payload: payload,
      payloadBytes: payloadBytes,
      signature: sigBytes
    };
  }

  function readUsedNonces() {
    try {
      var raw = global.localStorage.getItem(config.usedNonceStorageKey);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return {};
      return parsed;
    } catch (err) {
      return {};
    }
  }

  function writeUsedNonces(map) {
    try {
      global.localStorage.setItem(config.usedNonceStorageKey, JSON.stringify(map));
      return true;
    } catch (err) {
      return false;
    }
  }

  function consumeNonce(nonceValue) {
    if (typeof nonceValue !== "string" || !nonceValue) return false;
    var nonce = nonceValue.slice(0, 128);
    var used = readUsedNonces();
    if (Object.prototype.hasOwnProperty.call(used, nonce)) return false;

    used[nonce] = Date.now();

    var keys = Object.keys(used);
    if (keys.length > config.usedNonceMaxEntries) {
      keys.sort(function sortByTs(a, b) {
        return Number(used[a]) - Number(used[b]);
      });
      var toDrop = keys.length - config.usedNonceMaxEntries;
      var i;
      for (i = 0; i < toDrop; i += 1) {
        delete used[keys[i]];
      }
    }

    writeUsedNonces(used);
    return true;
  }

  function isCryptoAvailable() {
    return !!(global.crypto && global.crypto.subtle);
  }

  function hasUsableKey(kid) {
    var jwk = config.keys[kid];
    if (!jwk) return false;
    if (!jwk.x || !jwk.y) return false;
    if (String(jwk.x).indexOf("REPLACE_") === 0 || String(jwk.y).indexOf("REPLACE_") === 0) return false;
    return true;
  }

  async function importPublicKey(kid) {
    if (importedKeys[kid]) return importedKeys[kid];
    var jwk = config.keys[kid];
    if (!jwk) return null;
    if (!jwk.x || !jwk.y || String(jwk.x).indexOf("REPLACE_") === 0 || String(jwk.y).indexOf("REPLACE_") === 0) {
      return null;
    }

    var imported = await global.crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );
    importedKeys[kid] = imported;
    return imported;
  }

  async function verifySignature(payloadBytes, signatureBytes, kid) {
    var key = await importPublicKey(kid);
    if (!key) return false;

    return global.crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      signatureBytes,
      payloadBytes
    );
  }

  async function validate(token, options) {
    try {
      if (!token) return toResult(false, "EMPTY_SCAN", getErrorMessage("EMPTY_SCAN"));

      var parsed = parseToken(token);
      if (!parsed) return toResult(false, "INVALID_FORMAT", getErrorMessage("INVALID_FORMAT"));

      var payload = parsed.payload;
      if (!payload || typeof payload !== "object") {
        return toResult(false, "INVALID_PAYLOAD", getErrorMessage("INVALID_PAYLOAD"));
      }

      if (payload.iss !== config.issuer) {
        return toResult(false, "INVALID_ISSUER", getErrorMessage("INVALID_ISSUER"));
      }

      if (!payload.kid || typeof payload.kid !== "string") {
        return toResult(false, "MISSING_KID", getErrorMessage("MISSING_KID"));
      }

      if (!hasUsableKey(payload.kid)) {
        return toResult(false, "NO_KEY_FOR_KID", getErrorMessage("NO_KEY_FOR_KID"));
      }

      if (!isCryptoAvailable()) {
        return toResult(false, "CRYPTO_UNAVAILABLE", getErrorMessage("CRYPTO_UNAVAILABLE"));
      }

      var validSig = await verifySignature(parsed.payloadBytes, parsed.signature, payload.kid);
      if (!validSig) {
        return toResult(false, "BAD_SIGNATURE", getErrorMessage("BAD_SIGNATURE"));
      }

      var expectedPuzzle = options && options.puzzleId;
      if (expectedPuzzle && payload.p !== expectedPuzzle) {
        return toResult(false, "WRONG_PUZZLE", getErrorMessage("WRONG_PUZZLE"));
      }

      var nowSec = Math.floor(Date.now() / 1000);
      var skew = Number(config.maxClockSkewSec) || 0;

      if (typeof payload.nbf === "number" && nowSec + skew < payload.nbf) {
        return toResult(false, "NOT_YET_VALID", getErrorMessage("NOT_YET_VALID"));
      }

      if (typeof payload.exp === "number" && nowSec > payload.exp + skew) {
        return toResult(false, "EXPIRED", getErrorMessage("EXPIRED"));
      }

      if (typeof payload.nonce !== "string" || !payload.nonce) {
        return toResult(false, "INVALID_PAYLOAD", getErrorMessage("INVALID_PAYLOAD"));
      }

      if (config.enforceNonceReplayProtection && !consumeNonce(payload.nonce)) {
        return toResult(false, "REPLAYED", getErrorMessage("REPLAYED"));
      }

      return toResult(true, null, "Code valide.", payload);
    } catch (err) {
      return toResult(false, "INTERNAL_ERROR", getErrorMessage("INTERNAL_ERROR"));
    }
  }

  function setConfig(partialConfig) {
    config = mergeConfig(config, partialConfig || {});
    importedKeys = {};
  }

  function getConfig() {
    return mergeConfig(DEFAULT_CONFIG, config);
  }

  global.TheCampQR = {
    validate: validate,
    setConfig: setConfig,
    getConfig: getConfig,
    getErrorMessage: getErrorMessage
  };
})(window);
