(function initTheCampCore(global) {
  "use strict";

  var STORAGE_KEYS = {
    muted: "tc_muted",
    reducedMotion: "tc_reduced_motion"
  };

  var _audioContext = null;

  function safeParseJSON(raw) {
    if (raw == null || raw === "") return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function readStoredBool(key) {
    var raw = null;
    try {
      raw = global.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;
    return null;
  }

  function applyReducedMotionSetting() {
    var stored = readStoredBool(STORAGE_KEYS.reducedMotion);
    var prefersReduced = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var shouldReduce = stored === null ? !!prefersReduced : stored;
    document.documentElement.classList.toggle("reduced-motion", shouldReduce);
    return shouldReduce;
  }

  var Storage = {
    get: function get(key, fallback) {
      try {
        var value = global.localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (err) {
        return fallback;
      }
    },
    set: function set(key, value) {
      try {
        global.localStorage.setItem(key, String(value));
        return true;
      } catch (err) {
        return false;
      }
    },
    getJSON: function getJSON(key, fallback) {
      var parsed = safeParseJSON(Storage.get(key, null));
      return parsed === null ? fallback : parsed;
    },
    setJSON: function setJSON(key, value) {
      try {
        global.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        return false;
      }
    },
    getBool: function getBool(key, fallback) {
      var value = readStoredBool(key);
      return value === null ? !!fallback : value;
    },
    setBool: function setBool(key, value) {
      return Storage.set(key, value ? "1" : "0");
    },
    remove: function remove(key) {
      try {
        global.localStorage.removeItem(key);
        return true;
      } catch (err) {
        return false;
      }
    }
  };

  var DOM = {
    qs: function qs(selector, root) {
      return (root || document).querySelector(selector);
    },
    qsa: function qsa(selector, root) {
      return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    },
    on: function on(target, eventName, handler, options) {
      if (!target || !eventName || !handler) return function noop() {};
      target.addEventListener(eventName, handler, options || false);
      return function off() {
        target.removeEventListener(eventName, handler, options || false);
      };
    },
    toggleClass: function toggleClass(target, className, enabled) {
      if (!target || !className) return;
      target.classList.toggle(className, !!enabled);
    }
  };

  function getAudioContext() {
    var AudioContextCtor = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!_audioContext) {
      try {
        _audioContext = new AudioContextCtor();
      } catch (err) {
        _audioContext = null;
      }
    }
    return _audioContext;
  }

  function resumeAudio() {
    var ctx = getAudioContext();
    if (!ctx) return Promise.resolve(false);
    if (ctx.state === "running") return Promise.resolve(true);
    return ctx.resume().then(function onResumed() {
      return true;
    }).catch(function onError() {
      return false;
    });
  }

  function tone(options) {
    var settings = getSettings();
    if (settings.muted) return;

    var ctx = getAudioContext();
    if (!ctx) return;

    var opts = options || {};
    var now = ctx.currentTime;
    var attack = typeof opts.attack === "number" ? opts.attack : 0.003;
    var release = typeof opts.release === "number" ? opts.release : 0.06;
    var duration = typeof opts.duration === "number" ? opts.duration : 0.08;
    var volume = typeof opts.volume === "number" ? opts.volume : 0.05;

    var gain = ctx.createGain();
    var osc = ctx.createOscillator();
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(typeof opts.frequency === "number" ? opts.frequency : 440, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.linearRampToValueAtTime(0, now + duration + release);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + release + 0.01);
  }

  var Audio = {
    getContext: getAudioContext,
    resume: resumeAudio,
    tone: tone,
    uiConfirm: function uiConfirm() {
      tone({ frequency: 680, type: "triangle", duration: 0.07, volume: 0.04 });
    },
    uiError: function uiError() {
      tone({ frequency: 170, type: "sawtooth", duration: 0.12, volume: 0.045 });
    },
    uiTick: function uiTick() {
      tone({ frequency: 520, type: "square", duration: 0.03, volume: 0.03 });
    }
  };

  function transitionTo(url, options) {
    if (!url) return;
    var opts = options || {};
    var delay = typeof opts.delay === "number" ? opts.delay : 520;
    var bodyClass = opts.bodyClass || "is-transitioning";

    if (document.body) {
      document.body.classList.add(bodyClass);
    }
    global.setTimeout(function goToPage() {
      global.location.href = url;
    }, delay);
  }

  var Navigation = {
    transitionTo: transitionTo,
    cinematicTransitionTo: transitionTo,
    goBack: function goBack(fallbackUrl, options) {
      if (document.referrer) {
        global.history.back();
        return;
      }
      if (fallbackUrl) {
        transitionTo(fallbackUrl, options);
      }
    },
    bindDataNav: function bindDataNav(root) {
      var base = root || document;
      var nodes = DOM.qsa("[data-nav]", base);

      nodes.forEach(function each(node) {
        if (node.__tcNavBound) return;
        node.__tcNavBound = true;

        DOM.on(node, "click", function onClick(event) {
          event.preventDefault();
          var target = node.getAttribute("data-nav");
          if (!target) return;

          var delay = Number(node.getAttribute("data-delay"));
          Audio.uiConfirm();
          transitionTo(target, { delay: isNaN(delay) ? 520 : delay });
        });
      });
    }
  };

  function setSetting(name, value) {
    if (name === "muted") {
      Storage.setBool(STORAGE_KEYS.muted, !!value);
      return;
    }

    if (name === "reducedMotion") {
      Storage.setBool(STORAGE_KEYS.reducedMotion, !!value);
      applyReducedMotionSetting();
    }
  }

  function getSettings() {
    return {
      muted: Storage.getBool(STORAGE_KEYS.muted, false),
      reducedMotion: applyReducedMotionSetting()
    };
  }

  function registerServiceWorker(swPath) {
    var path = swPath || "service-worker.js";
    if (!("serviceWorker" in navigator)) {
      return Promise.resolve(false);
    }

    return navigator.serviceWorker.register(path)
      .then(function onOk() { return true; })
      .catch(function onError() { return false; });
  }

  function boot(options) {
    var opts = options || {};
    applyReducedMotionSetting();

    if (opts.autoBindNav !== false) {
      Navigation.bindDataNav(document);
    }

    if (opts.autoResumeAudio) {
      DOM.on(document, "pointerdown", resumeAudio, { once: true });
      DOM.on(document, "keydown", resumeAudio, { once: true });
    }

    if (opts.registerSW) {
      registerServiceWorker(typeof opts.registerSW === "string" ? opts.registerSW : "service-worker.js");
    }
  }

  var API = {
    boot: boot,
    settings: {
      get: getSettings,
      set: setSetting
    },
    storage: Storage,
    dom: DOM,
    audio: Audio,
    navigation: Navigation,
    sw: {
      register: registerServiceWorker
    },

    getSettings: getSettings,
    setSetting: setSetting,
    transitionTo: transitionTo,
    registerServiceWorker: registerServiceWorker
  };

  global.TheCampCore = global.TheCampCore || API;
  global.TheCamp = global.TheCamp || API;

  applyReducedMotionSetting();
})(window);
