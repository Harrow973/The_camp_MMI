(function initTheCampQRConfig(global) {
  "use strict";

  if (global.THE_CAMP_QR_CONFIG) return;

  global.THE_CAMP_QR_CONFIG = {
    tokenPrefix: "TC1",
    issuer: "thecamp",
    maxClockSkewSec: 60,
    usedNonceStorageKey: "tc_qr_used_nonces_v1",
    usedNonceMaxEntries: 500,
    keys: {
      k1: {
        kty: "EC",
        crv: "P-256",
        x: "MZ__9Fum9cHPAXnUw9UYpF9mSWmo1K7_C6bvtUFJ8CE",
        y: "ujX4raCw9nyfjVCtMU7BoIU7u6C2C1QD3-ym48XwaRc",
        ext: true,
        key_ops: ["verify"]
      }
    }
  };
})(window);
