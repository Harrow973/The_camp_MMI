    /* =========================
       THE CAMP — HOME REMASTER
       ========================= */

    // Change ces URLs selon tes vraies pages
    const PLAY_URL = "pages/00-entry/selection-personnage.html";
    const CREDITS_URL = "pages/05-ending/credit.html";
    const core = window.TheCampCore || window.TheCamp;

    const intro = document.getElementById("intro");
    const introFill = document.getElementById("introFill");
    const introLine = document.getElementById("introLine");
    const introSig  = document.getElementById("introSig");
    const introHint = document.getElementById("introHint");
    const skipBtn   = document.getElementById("skipBtn");
    const flash = document.getElementById("flash");

    const statusText = document.getElementById("statusText");
    const tipBox = document.getElementById("tipBox");

    const tips = [
      "Reste mobile, reste vivant.",
      "Observe avant d’attaquer.",
      "Un bon timing vaut une armée.",
      "La discipline fait gagner des secondes.",
      "Si tu entends le silence… c’est déjà trop tard."
    ];

    /* ---------- Parallax (léger) ---------- */
    (function setupParallax(){
      const bg = document.getElementById("bgImage");
      if (!bg) return;

      let tx = 0, ty = 0, cx = 0, cy = 0;
      const onMove = (e) => {
        const w = window.innerWidth, h = window.innerHeight;
        const x = (e.clientX / w - 0.5) * 2;
        const y = (e.clientY / h - 0.5) * 2;
        tx = x * 10; ty = y * 8;
      };
      const tick = () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        bg.style.transform = `translate(${cx}px, ${cy}px) scale(1.06)`;
        requestAnimationFrame(tick);
      };
      window.addEventListener("mousemove", onMove, { passive:true });
      tick();
    })();

    /* ---------- WebAudio SFX (iOS friendly) ---------- */
    let audioCtx = null, master = null, muted = true;

    function ensureAudio(){
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      master = audioCtx.createGain();
      master.gain.value = 0.45;
      master.connect(audioCtx.destination);
    }

    function resumeAudio(){
      ensureAudio();
      if (audioCtx.state === "suspended") audioCtx.resume().catch(()=>{});
      muted = false;
      introHint.textContent = "Son activé.";
      setTimeout(() => (introHint.textContent = "Chargement du système tactique…"), 900);
    }

    function beep(type="sine", freq=440, dur=0.08, gain=0.18){
      if (muted) return;
      ensureAudio();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.02);
    }

    function whoosh(){
      if (muted) return;
      ensureAudio();
      const t = audioCtx.currentTime;

      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(820, t + 0.22);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.20, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.30);
    }

    function click(){
      beep("square", 520, 0.05, 0.14);
      setTimeout(() => beep("square", 740, 0.05, 0.10), 60);
    }

    function errorBuzz(){
      beep("sawtooth", 160, 0.10, 0.16);
      setTimeout(() => beep("sawtooth", 120, 0.12, 0.14), 80);
    }

    // Active audio sur 1ère interaction
    window.addEventListener("pointerdown", resumeAudio, { once:true });

    /* ---------- Intro boot sequence ---------- */
    const bootLines = [
      "Calibration du champ visuel…",
      "Chargement des protocoles…",
      "Synchronisation HUD / Safe-Area…",
      "Verrouillage interface…",
      "Système prêt. Déploiement."
    ];

    function randSig(){
      const a = Math.floor(100 + Math.random() * 900);
      const b = Math.floor(10 + Math.random() * 90);
      return `SIGNAL: ${a}.${b} MHz`;
    }

    function setTip(){
      tipBox.textContent = tips[Math.floor(Math.random()*tips.length)];
    }

    function revealMenu(){
      // petit flash + fade-out
      flash.classList.add("is-on");
      setTimeout(() => flash.classList.remove("is-on"), 160);

      intro.classList.add("intro--out");
      setTimeout(() => {
        intro.style.display = "none";
        intro.setAttribute("aria-hidden", "true");
        document.body.classList.remove("is-loading");
        document.body.classList.add("is-ready");
        statusText.textContent = "Système prêt";
        setTip();
        whoosh();
      }, 520);
    }

    function boot(){
      let p = 0;
      let li = 0;
      statusText.textContent = "Initialisation…";
      introSig.textContent = randSig();

      const tick = () => {
        p += 0.65 + Math.random() * 1.35; // vibe organique
        p = Math.min(100, p);

        introFill.style.width = p.toFixed(1) + "%";
        introFill.parentElement.setAttribute("aria-valuenow", String(Math.floor(p)));

        if (p > 10 && li === 0){ introLine.textContent = bootLines[li++]; beep("triangle", 420, 0.06, 0.10); }
        if (p > 28 && li === 1){ introLine.textContent = bootLines[li++]; beep("triangle", 520, 0.06, 0.10); }
        if (p > 48 && li === 2){ introLine.textContent = bootLines[li++]; beep("triangle", 640, 0.06, 0.10); }
        if (p > 70 && li === 3){ introLine.textContent = bootLines[li++]; beep("triangle", 760, 0.06, 0.10); }
        if (p > 90 && li === 4){ introLine.textContent = bootLines[li++]; beep("square", 880, 0.08, 0.14); }

        if (Math.random() < 0.08) introSig.textContent = randSig();

        if (p < 100){
          requestAnimationFrame(tick);
        } else {
          introLine.textContent = "Système prêt. Appuie sur Jouer.";
          introHint.textContent = muted ? "Touche l’écran pour activer le son." : "Son activé.";
          setTimeout(revealMenu, 520);
        }
      };

      requestAnimationFrame(tick);
    }

    skipBtn.addEventListener("click", () => {
      if (!muted) click();
      revealMenu();
    });

    // Lancement auto de l'intro
    setTimeout(boot, 120);

    /* ---------- Menu actions + transitions ---------- */
    function transitionTo(url){
      if (!url) { errorBuzz(); return; }

      if (!muted) whoosh();
      flash.classList.add("is-on");
      setTimeout(() => flash.classList.remove("is-on"), 160);

      if (core && core.navigation && typeof core.navigation.transitionTo === "function") {
        core.navigation.transitionTo(url, { delay: 620 });
      } else {
        document.body.classList.add("is-transitioning");
        setTimeout(() => { window.location.href = url; }, 620);
      }
    }

    function ripple(btn){
      const r = btn.querySelector(".btn__ripple");
      if (!r) return;
      r.classList.remove("is-on");
      // force reflow
      void r.offsetWidth;
      r.classList.add("is-on");
    }

    document.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("pointerenter", () => { if (!muted) beep("sine", 520, 0.05, 0.08); }, { passive:true });
      btn.addEventListener("click", () => {
        ripple(btn);
        if (!muted) click();

        const a = btn.getAttribute("data-action");
        if (a === "play") transitionTo(PLAY_URL);
        else if (a === "credits") transitionTo(CREDITS_URL);
        else errorBuzz();
      });
    });

    // Keyboard desktop
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "enter") transitionTo(PLAY_URL);
      if (k === "c") transitionTo(CREDITS_URL);
    });

    if (core && core.boot) {
      core.boot({ autoBindNav: false, autoResumeAudio: false });
    }
    if (core && core.sw && typeof core.sw.register === "function") {
      core.sw.register("service-worker.js")
        .then((ok) => {
          if (ok) console.log("SW enregistre");
          else console.warn("SW non enregistre");
        });
    }
