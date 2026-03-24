    // ====== CONFIG ======
    const NEXT_URL = "pages/02-puzzles/enigme4.html"; // <- change ici si besoin
    const ARTIFACT_SRC = "img/artifact3_icon.webp"; // <- change si ton nom diffère

    // conserver ?char=... etc.
    const sp = new URLSearchParams(location.search);
    const nextHref = NEXT_URL + (sp.toString() ? `?${sp.toString()}` : "");

    // ====== DOM ======
    const artifact = document.getElementById("artifact");
    const statusEl = document.getElementById("status");
    const lineEl = document.getElementById("line");
    const btn = document.getElementById("btn");
    const muteBtn = document.getElementById("mute");
    const flash = document.getElementById("flash");
    const glitch = document.getElementById("glitch");

    artifact.src = ARTIFACT_SRC;

    // ====== Anti double-tap zoom (iOS best effort) ======
    let lastTouch = 0;
    document.addEventListener("touchend", (e) => {
      const now = Date.now();
      if (now - lastTouch <= 240) e.preventDefault();
      lastTouch = now;
    }, { passive:false });

    // ====== Audio (WebAudio) ======
    let audioCtx=null, master=null, muted=false;
    function ensureAudio(){
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      master = audioCtx.createGain();
      master.gain.value = 0.32;
      master.connect(audioCtx.destination);
    }
    function resumeAudio(){
      ensureAudio();
      if (audioCtx.state === "suspended") audioCtx.resume().catch(()=>{});
    }
    function beep(type="sine", freq=440, dur=0.08, gain=0.16){
      if (muted) return;
      ensureAudio();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t+dur+0.02);
    }
    function thump(){
      if (muted) return;
      ensureAudio();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(170, t);
      o.frequency.exponentialRampToValueAtTime(58, t+0.14);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.26, t+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.18);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t+0.22);
    }
    function warp(){
      if (muted) return;
      ensureAudio();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const f = audioCtx.createBiquadFilter();

      o.type = "sawtooth";
      o.frequency.setValueAtTime(240, t);
      o.frequency.exponentialRampToValueAtTime(1200, t+0.22);
      o.frequency.exponentialRampToValueAtTime(160, t+0.55);

      f.type = "lowpass";
      f.frequency.setValueAtTime(900, t);
      f.frequency.exponentialRampToValueAtTime(2400, t+0.20);
      f.frequency.exponentialRampToValueAtTime(700, t+0.60);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.60);

      o.connect(f); f.connect(g); g.connect(master);
      o.start(t); o.stop(t+0.64);
    }

    window.addEventListener("pointerdown", resumeAudio, { once:true });

    muteBtn.addEventListener("click", () => {
      muted = !muted;
      muteBtn.textContent = muted ? "Son: OFF" : "Son: ON";
      if (!muted) beep("sine", 520, 0.07, 0.12);
    });

    // ====== FX helpers ======
    function flashFX(){
      flash.classList.add("on");
      setTimeout(()=>flash.classList.remove("on"), 160);
    }
    function glitchFX(){
      glitch.classList.add("on");
      setTimeout(()=>glitch.classList.remove("on"), 460);
    }
    function vibrate(ms){ try{ navigator.vibrate?.(ms); }catch(_){ } }

    // ====== Particules (simple, stable) ======
    const canvas = document.getElementById("pfx");
    const ctx = canvas.getContext("2d", { alpha:true });
    let dpr = 1;
    const parts = [];

    function resize(){
      dpr = Math.max(1, Math.min(2.5, devicePixelRatio || 1));
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    addEventListener("resize", resize, { passive:true });
    resize();

    function rnd(min,max){ return Math.random()*(max-min)+min; }

    function burst(x,y, n=70){
      for (let i=0;i<n;i++){
        const a = rnd(0, Math.PI*2);
        const s = rnd(60, 320);
        parts.push({
          x,y,
          vx: Math.cos(a)*s,
          vy: Math.sin(a)*s,
          born: performance.now(),
          life: rnd(340, 900),
          size: rnd(1.2, 3.2),
          c: Math.random()<0.68 ? "rgba(240,173,78,0.95)" : "rgba(93,173,226,0.88)"
        });
      }
    }

    function tick(t){
      ctx.clearRect(0,0,innerWidth,innerHeight);

      for (let i=parts.length-1;i>=0;i--){
        const p = parts[i];
        const age = t - p.born;
        if (age > p.life){ parts.splice(i,1); continue; }

        const k = 1 - age/p.life;
        p.x += (p.vx/60);
        p.y += (p.vy/60);
        p.vx *= 0.985; p.vy *= 0.985;

        ctx.save();
        ctx.globalAlpha = 0.75 * k;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    function centerOf(el){
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width/2, y: r.top + r.height/2 };
    }

    // ====== Collect flow ======
    let collected = false;

    function collect(){
      if (collected) return;
      collected = true;

      resumeAudio();
      statusEl.textContent = "OBJET: SÉCURISÉ";
      lineEl.textContent = "Extraction terminée. On bouge, maintenant.";
      btn.textContent = "Transfert…";
      btn.disabled = true;
      artifact.style.pointerEvents = "none";

      // FX
      thump();
      warp();
      flashFX();
      glitchFX();
      vibrate(28);

      const p = centerOf(artifact);
      burst(p.x, p.y, 120);

      artifact.classList.add("collect");

      setTimeout(() => {
        document.body.classList.add("out");
      }, 260);

      setTimeout(() => {
        location.href = nextHref;
      }, 760);
    }

    artifact.addEventListener("pointerdown", (e) => {
      e.preventDefault?.();
      collect();
    }, { passive:false });

    btn.addEventListener("click", (e) => {
      e.preventDefault?.();
      collect();
    });


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
