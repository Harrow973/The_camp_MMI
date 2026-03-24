    // ===== CONFIG =====
    const NEXT_URL = "pages/05-ending/fin.html";

    // Si tu veux auto-lancer sans clic (ex: après collecte), mets true
    const AUTO_START = false;

    // ===== DOM =====
    const statusText = document.getElementById("statusText");
    const msg = document.getElementById("msg");
    const startBtn = document.getElementById("startBtn");
    const muteBtn = document.getElementById("muteBtn");

    const orbitWrap = document.getElementById("orbitWrap");
    const a1 = document.getElementById("a1");
    const a2 = document.getElementById("a2");
    const a3 = document.getElementById("a3");
    const a4 = document.getElementById("a4");

    const flash = document.getElementById("flash");
    const shock = document.getElementById("shock");
    const glitch = document.getElementById("glitch");

    const loading = document.getElementById("loading");
    const barFill = document.getElementById("barFill");
    const loadPct = document.getElementById("loadPct");
    const loadLeft = document.getElementById("loadLeft");
    const loadHint = document.getElementById("loadHint");

    // ===== Audio (WebAudio, iOS-safe: start on gesture) =====
    let audioCtx = null, master = null;
    let muted = false;

    function ensureAudio(){
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      master = audioCtx.createGain();
      master.gain.value = 0.38;
      master.connect(audioCtx.destination);
    }

    function setMuted(m){
      muted = m;
      muteBtn.textContent = muted ? "Son: OFF" : "Son: ON";
      if (!muted) blip(640, 0.06, "sine", 0.14);
    }

    function blip(freq=440, dur=0.08, type="sine", gain=0.18){
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
      const n = audioCtx.createBiquadFilter();
      const g = audioCtx.createGain();

      o.type = "sawtooth";
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(80, t + 0.35);

      n.type = "lowpass";
      n.frequency.setValueAtTime(900, t);
      n.frequency.exponentialRampToValueAtTime(280, t + 0.35);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);

      o.connect(n); n.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.42);
    }

    function clink(){
      blip(980, 0.05, "triangle", 0.16);
      window.setTimeout(() => blip(740, 0.06, "triangle", 0.12), 35);
    }

    function charge(){
      if (muted) return;
      ensureAudio();
      const t = audioCtx.currentTime;

      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();

      o.type = "square";
      o.frequency.setValueAtTime(240, t);
      o.frequency.exponentialRampToValueAtTime(920, t + 0.55);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.20, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);

      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.62);
    }

    function boom(){
      if (muted) return;
      ensureAudio();
      const t = audioCtx.currentTime;

      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.18);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.34, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.24);

      // spark
      window.setTimeout(() => blip(1200, 0.05, "sine", 0.12), 60);
    }

    // ===== Helpers =====
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    function fxFlash(){
      flash.classList.remove("is-on");
      void flash.offsetWidth;
      flash.classList.add("is-on");
    }
    function fxShock(){
      shock.classList.remove("is-on");
      void shock.offsetWidth;
      shock.classList.add("is-on");
    }
    function fxGlitch(){
      glitch.classList.remove("is-on");
      void glitch.offsetWidth;
      glitch.classList.add("is-on");
    }

    function setReady(ready){
      startBtn.classList.toggle("is-ready", ready);
    }

    // ===== Timeline =====
    let started = false;

    async function runSequence(){
      if (started) return;
      started = true;

      ensureAudio();
      if (audioCtx?.state === "suspended") { try{ await audioCtx.resume(); }catch{} }

      setReady(false);
      statusText.textContent = "NEXUS: ALIGNEMENT";
      msg.textContent = "Alignement des quatre signatures…";

      // Appear
      [a1,a2,a3,a4].forEach(img => img.classList.add("is-in"));
      blip(520, 0.07, "square", 0.14);
      await wait(140);
      blip(660, 0.07, "square", 0.14);
      await wait(140);
      blip(880, 0.08, "square", 0.18);

      // Orbit
      whoosh();
      orbitWrap.classList.add("is-orbiting");
      msg.textContent = "Capture magnétique active. Stabilisation en cours…";
      await wait(1200);

      // Snap into quadrant positions
      orbitWrap.classList.remove("is-orbiting");
      orbitWrap.classList.add("is-snapping");
      clink(); fxGlitch();
      await wait(240);
      clink();
      await wait(420);

      // Charge-up + fuse pull
      statusText.textContent = "NEXUS: SYNCHRO";
      msg.textContent = "Synchronisation des reliques… Prépare-toi.";
      charge();
      orbitWrap.classList.add("is-fusing");
      fxGlitch();
      await wait(520);

      // Big fusion moment
      fxFlash(); fxShock();
      boom();
      statusText.textContent = "NEXUS: FUSION";
      msg.textContent = "Fusion confirmée. Ouverture du passage…";
      await wait(480);

      // Transition to loading
      await showLoadingAndGo();
    }

    async function showLoadingAndGo(){
      loading.classList.add("is-on");
      loading.setAttribute("aria-hidden", "false");

      let p = 0;
      const steps = [
        { to: 22, label:"VERROUILLAGE", hint:"Scellement des 4 artéfacts…" },
        { to: 46, label:"CANAL",       hint:"Canalisation de l’énergie…" },
        { to: 72, label:"PORTAIL",     hint:"Ouverture du passage final…" },
        { to: 100,label:"TRANSFERT",   hint:"Transfert de mission…" }
      ];

      for (const s of steps){
        loadLeft.textContent = s.label;
        loadHint.textContent = s.hint;

        const target = s.to;
        while (p < target){
          p += Math.max(1, Math.round((target - p) * 0.18));
          p = Math.min(p, target);
          barFill.style.width = p + "%";
          loadPct.textContent = p + "%";

          // micro SFX “data”
          if (p % 9 === 0) blip(920 + (p*2), 0.03, "sine", 0.08);
          if (p % 17 === 0) fxGlitch();

          await wait(180);
        }

        clink();
        await wait(220);
      }

      // final hit
      fxFlash();
      boom();
      await wait(260);

      window.location.href = NEXT_URL;
    }

    // ===== Controls =====
    startBtn.addEventListener("click", runSequence);

    muteBtn.addEventListener("click", async () => {
      ensureAudio();
      if (audioCtx?.state === "suspended") { try{ await audioCtx.resume(); }catch{} }
      setMuted(!muted);
    });

    // iOS: resume audio on any gesture
    window.addEventListener("pointerdown", () => {
      ensureAudio();
      if (audioCtx?.state === "suspended") audioCtx.resume().catch(()=>{});
    }, { once:true });

    // Boot
    setReady(true);
    setMuted(false);

    if (AUTO_START){
      // petit délai pour laisser le layout se poser
      window.setTimeout(() => runSequence(), 240);
    }


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
