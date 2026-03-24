    /* =========================
       Crédit "jeu vidéo" mobile
       - Défilement automatique
       - Fond étoiles (canvas)
       - Micro SFX (optionnel) + toggle
       - Vitesse (x1 / x1.6 / x2.2)
       - Pause par appui long
       ========================= */

    // ---- Helpers
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    // ---- Back to home (change the URL here if needed)
    const HOME_URL = "index.html";
    document.getElementById("backHome").addEventListener("click", () => {
      // petite transition
      document.body.style.transition = "filter .25s ease, transform .25s ease";
      document.body.style.filter = "brightness(1.15)";
      document.body.style.transform = "scale(1.01)";
      setTimeout(() => window.location.href = HOME_URL, 160);
    });

    // ---- Track rolling logic
    const track = document.getElementById("track");
    const statusText = document.getElementById("statusText");
    const finalCard = document.getElementById("finalCard");

    let speedMode = "normal";
    const speedMap = { normal: 38, fast: 60, ultra: 84 }; // px/sec baseline (mobile friendly)
    let pxPerSec = speedMap[speedMode];

    let y = 0;               // current translateY
    let running = true;
    let lastTs = null;
    let introBoost = 1.0;
    let introTimer = 0; // secondes


    function layoutReset(){
      const viewportH = document.querySelector(".creditsViewport").clientHeight;

      // Avant : viewportH + 30  (trop bas)
      // Maintenant : démarre à ~20% du viewport => arrive très vite
      y = viewportH * 0;

      track.style.transform = `translate3d(0, ${y}px, 0)`;
      statusText.textContent = "Défilement en cours";
    }


    function isFinalVisible(){
      const vp = document.querySelector(".creditsViewport").getBoundingClientRect();
      const fc = finalCard.getBoundingClientRect();
      // final card center enters viewport
      const center = (fc.top + fc.bottom) / 2;
      return center > vp.top && center < vp.bottom;
    }

    function tick(ts){
      if(!lastTs) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      if(running){
        y -= pxPerSec * dt;
        track.style.transform = `translate3d(0, ${y}px, 0)`;

        // When the credits fully passed, loop gracefully
        const trackRect = track.getBoundingClientRect();
        const viewportRect = document.querySelector(".creditsViewport").getBoundingClientRect();
        if(trackRect.bottom < viewportRect.top - 40){
          // loop
          layoutReset();
          // small “whoosh” if sound on
          sfx.whoosh();
        }

        // Hype moment when final becomes visible
        if(isFinalVisible()){
          statusText.textContent = "Final — merci !";
          // subtle title pulse once
          pulseTitleOnce();
        }
      }

      requestAnimationFrame(tick);
    }

    // Start
    layoutReset();
    window.addEventListener("resize", () => {
      // keep relative positioning on resize
      layoutReset();
    });
    requestAnimationFrame(tick);

    // ---- Speed toggle
    const toggleSpeedBtn = document.getElementById("toggleSpeed");
    toggleSpeedBtn.addEventListener("click", () => {
      const order = ["normal", "fast", "ultra"];
      const idx = order.indexOf(speedMode);
      speedMode = order[(idx + 1) % order.length];
      pxPerSec = speedMap[speedMode];

      const label = speedMode === "normal" ? "x1" : speedMode === "fast" ? "x1.6" : "x2.2";
      toggleSpeedBtn.textContent = label;
      sfx.click();
    });
    // show initial label
    toggleSpeedBtn.textContent = "x1";

    // ---- Pause by long press anywhere on panel
    const panel = document.querySelector(".panel");
    let pressTimer = null;

    function setRunning(on){
      running = on;
      statusText.textContent = on ? "Défilement en cours" : "Pause";
      panel.style.filter = on ? "none" : "brightness(1.12)";
    }

    panel.addEventListener("pointerdown", (e) => {
      // long press to pause/resume
      pressTimer = setTimeout(() => {
        setRunning(!running);
        sfx.toggle();
      }, 260);
    });
    panel.addEventListener("pointerup", () => {
      if(pressTimer) clearTimeout(pressTimer);
      pressTimer = null;
    });
    panel.addEventListener("pointercancel", () => {
      if(pressTimer) clearTimeout(pressTimer);
      pressTimer = null;
    });

    // ---- Title pulse (once when final visible)
    let pulsed = false;
    function pulseTitleOnce(){
      if(pulsed) return;
      pulsed = true;
      const title = document.getElementById("gameTitle");
      title.animate([
        { transform: "scale(1)", filter:"drop-shadow(0 10px 40px rgba(0,0,0,.55))" },
        { transform: "scale(1.03)", filter:"drop-shadow(0 18px 60px rgba(34,211,238,.22))" },
        { transform: "scale(1)", filter:"drop-shadow(0 10px 40px rgba(0,0,0,.55))" },
      ], { duration: 900, easing: "cubic-bezier(.2,.8,.2,1)" });

      // small sparkle sfx if enabled
      sfx.sparkle();
      setTimeout(() => { pulsed = false; }, 2200);
    }

    // ---- Stars (canvas)
    const canvas = document.getElementById("stars");
    const ctx = canvas.getContext("2d", { alpha: true });

    let W=0, H=0, DPR=1;
    const stars = [];
    const STAR_COUNT = 140;

    function resizeCanvas(){
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.floor(window.innerWidth * DPR);
      H = Math.floor(window.innerHeight * DPR);
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      stars.length = 0;
      for(let i=0;i<STAR_COUNT;i++){
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: (Math.random() * 1.4 + 0.35) * DPR,
          v: (Math.random() * 0.55 + 0.15) * DPR,
          a: Math.random() * 0.65 + 0.25,
          tw: Math.random() * 0.8 + 0.2,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let starLast = performance.now();
    function starsTick(t){
      const dt = Math.min((t - starLast)/1000, 0.05);
      starLast = t;

      ctx.clearRect(0,0,W,H);

      // soft nebula blobs
      ctx.globalCompositeOperation = "lighter";
      const g1 = ctx.createRadialGradient(W*0.22, H*0.18, 0, W*0.22, H*0.18, Math.max(W,H)*0.38);
      g1.addColorStop(0, "rgba(139,92,246,0.08)");
      g1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0,0,W,H);

      const g2 = ctx.createRadialGradient(W*0.82, H*0.22, 0, W*0.82, H*0.22, Math.max(W,H)*0.33);
      g2.addColorStop(0, "rgba(34,211,238,0.06)");
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0,0,W,H);

      // stars
      for(const s of stars){
        s.y += s.v * dt * 60;
        if(s.y > H + 20) { s.y = -20; s.x = Math.random() * W; }

        // twinkle
        s.phase += dt * (0.9 + s.tw);
        const tw = 0.55 + 0.45 * Math.sin(s.phase);

        ctx.globalAlpha = clamp(s.a * tw, 0, 1);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = "rgba(244,241,255,1)";
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      requestAnimationFrame(starsTick);
    }
    requestAnimationFrame(starsTick);

    // ---- Optional SFX (WebAudio) with toggle
    const soundBtn = document.getElementById("toggleSound");

    let audioCtx = null;
    let soundOn = false;

    function ensureAudio(){
      if(audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    function beep({type="sine", freq=440, dur=0.07, gain=0.05, detune=0} = {}){
      if(!soundOn) return;
      ensureAudio();
      const t0 = audioCtx.currentTime;

      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();

      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      o.connect(g).connect(audioCtx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    }

    function noiseWhoosh(dur=0.16, gain=0.05){
      if(!soundOn) return;
      ensureAudio();
      const t0 = audioCtx.currentTime;

      const bufferSize = Math.floor(audioCtx.sampleRate * dur);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for(let i=0;i<bufferSize;i++){
        // pink-ish noise approximation (quick)
        data[i] = (Math.random()*2-1) * (1 - i/bufferSize);
      }

      const src = audioCtx.createBufferSource();
      src.buffer = buffer;

      const biquad = audioCtx.createBiquadFilter();
      biquad.type = "lowpass";
      biquad.frequency.setValueAtTime(1200, t0);

      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      src.connect(biquad).connect(g).connect(audioCtx.destination);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    }

    const sfx = {
      click(){ beep({ type:"triangle", freq:520, dur:0.055, gain:0.045 }); },
      toggle(){ beep({ type:"sine", freq:360, dur:0.075, gain:0.05 }); beep({ type:"sine", freq:520, dur:0.07, gain:0.035, detune:8 }); },
      sparkle(){
        beep({ type:"sine", freq:740, dur:0.06, gain:0.04 });
        beep({ type:"sine", freq:980, dur:0.055, gain:0.03, detune:-6 });
      },
      whoosh(){ noiseWhoosh(0.18, 0.05); },
    };

    soundBtn.addEventListener("click", async () => {
      soundOn = !soundOn;
      soundBtn.dataset.on = String(soundOn);

      // On iOS, audio context may need a user gesture to resume
      try{
        ensureAudio();
        if(audioCtx.state === "suspended") await audioCtx.resume();
      }catch(e){ /* ignore */ }

      if(soundOn){
        soundBtn.textContent = "🔈";
        sfx.toggle();
      }else{
        soundBtn.textContent = "🔊";
      }
    });

    // ---- Prevent double-tap zoom / accidental gestures (best-effort)
    // (viewport already has user-scalable=1; we also reduce zoom issues via touch-action)
    let lastTouchEnd = 0;
    document.addEventListener("touchend", (e) => {
      const now = Date.now();
      if(now - lastTouchEnd <= 260){
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive:false });


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
