(function initTheCampScanBridge(global) {
  "use strict";

  var DEFAULT_CONFIG = {
    ablyKey: "",
    channelPrefix: "thecamp:scan",
    sessionTtlSec: 180,
    desktopMinWidth: 980,
    mobileBaseUrl: ""
  };

  var config = mergeConfig(DEFAULT_CONFIG, global.THE_CAMP_BRIDGE_CONFIG || {});

  function mergeConfig(base, override) {
    var out = {
      ablyKey: base.ablyKey,
      channelPrefix: base.channelPrefix,
      sessionTtlSec: base.sessionTtlSec,
      desktopMinWidth: base.desktopMinWidth,
      mobileBaseUrl: base.mobileBaseUrl
    };
    if (override && typeof override.ablyKey === "string") out.ablyKey = override.ablyKey;
    if (override && typeof override.channelPrefix === "string") out.channelPrefix = override.channelPrefix;
    if (override && typeof override.sessionTtlSec === "number") out.sessionTtlSec = override.sessionTtlSec;
    if (override && typeof override.desktopMinWidth === "number") out.desktopMinWidth = override.desktopMinWidth;
    if (override && typeof override.mobileBaseUrl === "string") out.mobileBaseUrl = override.mobileBaseUrl;
    return out;
  }

  function isLocalhostHost(hostname) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  }

  function getBridgeBaseUrl() {
    var raw = config.mobileBaseUrl || "";
    if (raw) {
      try {
        return new URL(raw);
      } catch (err) {
        return null;
      }
    }

    return new URL(global.location.href);
  }

  function getBridgeLinkIssue() {
    if (config.mobileBaseUrl) {
      try {
        new URL(config.mobileBaseUrl);
      } catch (err) {
        return "mobileBaseUrl invalide dans scripts/core/bridge-config.js";
      }
      return "";
    }

    if (isLocalhostHost(global.location.hostname)) {
      return "Desktop lance sur localhost: configure mobileBaseUrl avec une URL accessible par le telephone.";
    }

    return "";
  }

  function isConfigured() {
    if (!config.ablyKey) return false;
    if (config.ablyKey.indexOf("REPLACE_") === 0) return false;
    return true;
  }

  function getConfigError() {
    if (!global.Ably) return "Librairie Ably introuvable.";
    if (!isConfigured()) return "Cle Ably non configuree (scripts/core/bridge-config.js).";
    return "";
  }

  function isLikelyMobile() {
    var ua = global.navigator && global.navigator.userAgent ? global.navigator.userAgent : "";
    var mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    var narrow = global.matchMedia && global.matchMedia("(max-width: 900px)").matches;
    return mobileUa || narrow;
  }

  function shouldUseDesktopBridge() {
    if (!global.matchMedia) return false;
    if (getBridgeParams().enabled) return false;
    var desktopQuery = global.matchMedia("(min-width: " + config.desktopMinWidth + "px)").matches;
    return desktopQuery && !isLikelyMobile();
  }

  function getBridgeParams() {
    var params = new URLSearchParams(global.location.search);
    return {
      enabled: params.get("bridge") === "1",
      sid: params.get("sid") || "",
      sec: params.get("sec") || "",
      p: params.get("p") || ""
    };
  }

  function randomHex(bytesCount) {
    var bytes = new Uint8Array(bytesCount);
    global.crypto.getRandomValues(bytes);
    var out = "";
    var i;
    for (i = 0; i < bytes.length; i += 1) {
      out += bytes[i].toString(16).padStart(2, "0");
    }
    return out;
  }

  function createDesktopSession(puzzleId) {
    var now = Date.now();
    return {
      sid: randomHex(8),
      sec: randomHex(16),
      p: puzzleId,
      exp: Math.floor((now + config.sessionTtlSec * 1000) / 1000)
    };
  }

  function buildBridgeUrl(session, extraParams) {
    var base = getBridgeBaseUrl();
    if (!base) return "";

    var url = new URL(base.toString());
    url.pathname = global.location.pathname;
    url.search = "";
    url.searchParams.set("bridge", "1");
    url.searchParams.set("sid", session.sid);
    url.searchParams.set("sec", session.sec);
    url.searchParams.set("p", session.p);

    var entries = extraParams || {};
    var key;
    for (key in entries) {
      if (!Object.prototype.hasOwnProperty.call(entries, key)) continue;
      if (entries[key] == null || entries[key] === "") continue;
      url.searchParams.set(key, String(entries[key]));
    }
    return url.toString();
  }

  function renderQr(targetElement, text) {
    if (!targetElement) return false;
    targetElement.innerHTML = "";
    if (!global.QRCode) return false;

    new global.QRCode(targetElement, {
      text: text,
      width: 220,
      height: 220,
      colorDark: "#111111",
      colorLight: "#ffffff",
      correctLevel: global.QRCode.CorrectLevel.M
    });
    return true;
  }

  async function startDesktopListener(options) {
    if (!global.Ably || !isConfigured()) {
      throw new Error(getConfigError() || "Bridge indisponible");
    }

    var opts = options || {};
    var session = opts.session;
    var onEvent = typeof opts.onEvent === "function" ? opts.onEvent : function noop() {};
    var onValidated = typeof opts.onValidated === "function" ? opts.onValidated : function noop() {};
    var settled = false;

    var client = new global.Ably.Realtime({
      key: config.ablyKey,
      clientId: "desktop-" + session.sid,
      echoMessages: false
    });

    var channelName = config.channelPrefix + ":" + session.sid;
    var channel = client.channels.get(channelName);

    var onMessage = function onMessage(msg) {
      if (settled) return;
      var data = msg && msg.data ? msg.data : {};
      if (!data || data.type !== "scan_success") return;
      if (data.sid !== session.sid) return;
      if (data.sec !== session.sec) return;
      if (data.p !== session.p) return;
      if (typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) return;

      settled = true;
      onValidated(data);
    };

    client.connection.on("connected", function onConnected() {
      onEvent({ type: "connected" });
    });

    client.connection.on("failed", function onFailed(stateChange) {
      onEvent({ type: "failed", error: stateChange && stateChange.reason ? stateChange.reason.message : "Connexion impossible" });
    });

    client.connection.on("disconnected", function onDisconnected() {
      onEvent({ type: "disconnected" });
    });

    await channel.subscribe("scan_success", onMessage);

    return {
      stop: function stop() {
        settled = true;
        try {
          channel.unsubscribe("scan_success", onMessage);
        } catch (err) {
          // ignore
        }
        try {
          client.close();
        } catch (err2) {
          // ignore
        }
      }
    };
  }

  async function publishMobileValidation(options) {
    if (!global.Ably || !isConfigured()) {
      return { ok: false, error: getConfigError() || "Bridge indisponible" };
    }

    var opts = options || {};
    var sid = opts.sid || "";
    var sec = opts.sec || "";
    var puzzleId = opts.puzzleId || "";

    if (!sid || !sec || !puzzleId) {
      return { ok: false, error: "Parametres bridge incomplets." };
    }

    var client = new global.Ably.Realtime({
      key: config.ablyKey,
      clientId: "mobile-" + randomHex(4),
      echoMessages: false,
      autoConnect: true
    });

    var channelName = config.channelPrefix + ":" + sid;
    var channel = client.channels.get(channelName);

    try {
      var now = Math.floor(Date.now() / 1000);
      var payload = {
        type: "scan_success",
        sid: sid,
        sec: sec,
        p: puzzleId,
        exp: now + 30,
        ts: now
      };
      await channel.publish("scan_success", payload);

      await new Promise(function resolveAfterRetryDelay(resolve) {
        global.setTimeout(resolve, 700);
      });

      payload.ts = Math.floor(Date.now() / 1000);
      await channel.publish("scan_success", payload);

      await new Promise(function resolveAfterSecondRetryDelay(resolve) {
        global.setTimeout(resolve, 700);
      });

      payload.ts = Math.floor(Date.now() / 1000);
      await channel.publish("scan_success", payload);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "Publication impossible" };
    } finally {
      try {
        client.close();
      } catch (closeErr) {
        // ignore
      }
    }
  }

  function setConfig(partial) {
    config = mergeConfig(config, partial || {});
  }

  global.TheCampScanBridge = {
    isConfigured: isConfigured,
    getConfigError: getConfigError,
    getBridgeParams: getBridgeParams,
    shouldUseDesktopBridge: shouldUseDesktopBridge,
    getBridgeLinkIssue: getBridgeLinkIssue,
    createDesktopSession: createDesktopSession,
    buildBridgeUrl: buildBridgeUrl,
    renderQr: renderQr,
    startDesktopListener: startDesktopListener,
    publishMobileValidation: publishMobileValidation,
    setConfig: setConfig
  };
})(window);
