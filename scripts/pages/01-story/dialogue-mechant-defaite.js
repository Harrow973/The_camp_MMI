    // ============================================================
    // CONFIG
    // ============================================================
    const NEXT_URL = "pages/01-story/dialogue-professeur-victoire.html";

    // dialogue (tu peux réécrire librement)
    const lines = [
      {
        badge: "Signal pirate",
        text: "…Intéressant. Vous avez gagné cette fois-ci.",
        shake: false,
        glitch: true
      },
      {
        badge: "Menace",
        text: "Mais ne vous faites aucune illusion : je reviendrai. Et quand je reviendrai… le camp brûlera.",
        shake: true,
        glitch: true
      },
      {
        badge: "Interruption",
        text: "Profitez de votre victoire. Elle est provisoire.",
        shake: true,
        glitch: true
      }
    ];

    // ============================================================
    // DOM
    // ============================================================
    const dialogueTextEl = document.getElementById("dialogueText");
    const continueBtn = document.getElementById("continueBtn");
    const villainImg = document.getElementById("villainImg");
    const villainWrap = document.getElementById("villainWrap");
    const dissolve = document.getElementById("dissolve");
    const badgeEl = document.getElementById("badge");
    const stage = document.getElementById("stage");
    const hud = document.getElementById("hud");
    const flash = document.getElementById("flash");
    const stamp = document.getElementById("stamp");
    const speakerName = document.getElementById("speakerName");

    // ============================================================
    // STATE
    // ============================================================
    let idx = 0;
    let isTyping = false;
    let typingTimer = null;
    let isDissolving = false;

    // ============================================================
    // AUDIO — WebAudio SFX (glitch + vanish)
    // ============================================================
    let audioCtx = null, master = null, muted = false;
    function ensureAudio(){
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      master = audioCtx.createGain();
      master.gain.value = 0.34;
      master.connect(audioCtx.destination);
    }
    function resumeAudio(){
      try{
        ensureAudio();
        if (audioCtx.state === "suspended") audioCtx.resume().catch(()=>{});
      }catch(_){}
    }

    // small utility noise burst
    function sfxNoiseBurst(dur=0.12, gain=0.16){
      if (muted) return;
      resumeAudio();
      const t = audioCtx.currentTime;

      const bufferSize = Math.floor(audioCtx.sampleRate * dur);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i=0;i<bufferSize;i++){
        data[i] = (Math.random()*2 - 1) * (1 - i/bufferSize);
      }

      const src = audioCtx.createBufferSource();
      src.buffer = buffer;

      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t+dur);

      // bandpass to make it "radio"
      const bp = audioCtx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(900, t);
      bp.Q.setValueAtTime(1.2, t);

      src.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(t);
      src.stop(t + dur + 0.02);
    }

    function sfxBeep(type="square", f=520, dur=0.06, gain=0.12){
      if (muted) return;
      resumeAudio();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t+dur+0.02);
    }

    function sfxGlitch(){
      sfxNoiseBurst(0.10, 0.14);
      sfxBeep("square", 220, 0.05, 0.10);
      window.setTimeout(()=>sfxBeep("square", 980, 0.06, 0.08), 70);
    }

    function sfxVanish(){
      sfxNoiseBurst(0.22, 0.20);
      sfxBeep("triangle", 180, 0.10, 0.14);
      window.setTimeout(()=>sfxBeep("triangle", 90, 0.14, 0.12), 80);
      window.setTimeout(()=>sfxNoiseBurst(0.16, 0.16), 110);
    }

    // Start audio on first user gesture (iOS)
    (function bootAudio(){
      const unlock = () => { resumeAudio(); };
      window.addEventListener("pointerdown", unlock, { once:true, passive:true });
    })();

    // ============================================================
    // UI helpers
    // ============================================================
    function setReady(ready){
      continueBtn.classList.toggle("is-ready", ready);
    }

    function shake(){
      stage.classList.add("shake");
      hud.classList.add("shake");
      const clear = () => {
        stage.classList.remove("shake");
        hud.classList.remove("shake");
      };
      stage.addEventListener("animationend", clear, { once:true });
    }

    function pulseGlitchUI(){
      document.body.classList.add("glitching");
      dialogueTextEl.classList.add("glitching");
      sfxGlitch();
      window.setTimeout(()=>{
        document.body.classList.remove("glitching");
        dialogueTextEl.classList.remove("glitching");
      }, 560);
    }

    // Typewriter (with occasional glitch bursts)
    function typeWriter(text, i = 0){
      isTyping = true;
      setReady(false);

      // slight randomness feels "alive"
      const base = 22;
      const jitter = Math.floor(Math.random() * 16);
      const speed = base + jitter;

      if (i < text.length){
        const chunk = text.substring(0, i + 1);
        dialogueTextEl.innerHTML = chunk + '<span class="cursor">|</span>';

        // micro-glitch on some punctuation
        const ch = text[i];
        if (ch === "…" || ch === "!" || ch === ":" || ch === "—"){
          if (Math.random() < 0.55) pulseGlitchUI();
        }

        typingTimer = window.setTimeout(() => typeWriter(text, i + 1), speed);
      } else {
        dialogueTextEl.textContent = text;
        isTyping = false;
        setReady(true);
      }
    }

    function displayLine(i){
      const line = lines[i];
      dialogueTextEl.textContent = "";
      badgeEl.textContent = line.badge || "";

      // speaker identity style (always menacing)
      speakerName.textContent = "SAMUEL";
      speakerName.setAttribute("data-text", "SAMUEL");

      if (line.glitch) pulseGlitchUI();
      if (line.shake) shake();
      typeWriter(line.text, 0);
    }

    // ============================================================
    // 3D tilt (pointer move) — subtle, mobile safe
    // ============================================================
    (function setupTilt(){
      let raf = null;
      let tx = 0, ty = 0, cx = 0, cy = 0;

      const onMove = (e) => {
        const p = e.touches ? e.touches[0] : e;
        const w = window.innerWidth, h = window.innerHeight;
        const x = (p.clientX / w - 0.5) * 2;
        const y = (p.clientY / h - 0.5) * 2;
        tx = x; ty = y;
        if (raf) return;
        raf = requestAnimationFrame(()=>{
          raf = null;
          cx += (tx - cx) * 0.18;
          cy += (ty - cy) * 0.18;

          const rx = (-cy * 6).toFixed(2);
          const ry = (cx * 8).toFixed(2);
          stage.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
      };

      window.addEventListener("pointermove", onMove, { passive:true });
      window.addEventListener("touchmove", onMove, { passive:true });
    })();

    // ============================================================
    // PIXEL DISSOLVE (canvas) — "disparition pixel par pixel"
    // ============================================================
    function resizeDissolveCanvas(){
      const rect = villainImg.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      dissolve.width = Math.floor(rect.width * dpr);
      dissolve.height = Math.floor(rect.height * dpr);
      dissolve.style.width = rect.width + "px";
      dissolve.style.height = rect.height + "px";
      const ctx = dissolve.getContext("2d");
      ctx.setTransform(dpr,0,0,dpr,0,0);
      return { ctx, rect, dpr };
    }

    function startDissolve(){
      if (isDissolving) return;
      isDissolving = true;

      stamp.classList.add("is-on");

      // canvas visible, image hidden behind
      dissolve.style.display = "block";

      const { ctx } = resizeDissolveCanvas();
      const w = villainImg.clientWidth;
      const h = villainImg.clientHeight;

      // draw image into canvas
      ctx.clearRect(0,0,w,h);
      ctx.drawImage(villainImg, 0, 0, w, h);

      // get pixels
      let imgData = ctx.getImageData(0,0,w,h);
      let data = imgData.data;

      // build list of pixel indices to erase (only non-transparent)
      const indices = [];
      for (let y=0; y<h; y++){
        for (let x=0; x<w; x++){
          const i = (y*w + x)*4;
          const a = data[i+3];
          if (a > 8) indices.push(i);
        }
      }

      // shuffle indices for random dissolve
      for (let i=indices.length-1; i>0; i--){
        const j = Math.floor(Math.random()*(i+1));
        const t = indices[i]; indices[i] = indices[j]; indices[j] = t;
      }

      // dissolve parameters
      const total = indices.length;
      let erased = 0;

      // extra: glowing "digital burn" effect on edges
      function drawPass(batch){
        // erase batch pixels
        for (let k=0; k<batch && erased < total; k++, erased++){
          const p = indices[erased];
          // "pixel corruption": tint before vanish
          data[p+0] = Math.min(255, data[p+0] + 18); // R
          data[p+1] = Math.max(0,   data[p+1] - 12); // G
          data[p+2] = Math.min(255, data[p+2] + 22); // B
          data[p+3] = 0; // transparent = removed
        }

        // occasional horizontal glitch bars
        if (Math.random() < 0.22){
          const y = Math.floor(Math.random()*h);
          const barH = 2 + Math.floor(Math.random()*5);
          const shift = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.floor(Math.random()*18));
          const bar = ctx.getImageData(0, Math.max(0,y-barH), w, Math.min(h,barH*2));
          ctx.putImageData(bar, shift, Math.max(0,y-barH));
        }

        ctx.putImageData(imgData, 0, 0);
      }

      // big vanish fx
      sfxVanish();
      flash.classList.add("is-on");
      window.setTimeout(()=>flash.classList.remove("is-on"), 160);
      shake();
      pulseGlitchUI();

      // animate dissolve
      const start = performance.now();
      const duration = 1200; // ms
      function loop(now){
        const t = Math.min(1, (now - start) / duration);

        // batch size scales with time, starts small then explodes
        const batch = Math.floor(900 + t*t * 12000);

        drawPass(batch);

        // additional “fade out” on canvas
        dissolve.style.opacity = String(1 - t*0.95);

        if (t < 1 && erased < total){
          requestAnimationFrame(loop);
        } else {
          // cleanup and transition
          finishTransition();
        }
      }
      requestAnimationFrame(loop);
    }

    function finishTransition(){
      // fade to black then redirect
      window.setTimeout(()=>{
        document.body.classList.add("is-transitioning");
      }, 180);

      window.setTimeout(()=>{
        window.location.href = NEXT_URL;
      }, 720);
    }

    // ============================================================
    // FLOW
    // ============================================================
    function finishDialogue(){
      continueBtn.textContent = "Terminer";
      setReady(true);

      continueBtn.onclick = () => {
        // start villain vanish sequence
        startDissolve();
      };
    }

    function next(){
      if (isDissolving) return;

      if (isTyping){
        window.clearTimeout(typingTimer);
        dialogueTextEl.textContent = lines[idx].text;
        isTyping = false;
        setReady(true);
        return;
      }

      idx += 1;
      if (idx >= lines.length){
        finishDialogue();
      } else {
        displayLine(idx);
      }
    }

    // tap anywhere (HUD + stage)
    hud.addEventListener("click", next);
    stage.addEventListener("click", next);
    continueBtn.addEventListener("click", next);

    // keyboard desktop
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "enter" || k === " ") next();
    });

    // initial
    continueBtn.textContent = "Continuer";
    setReady(false);

    // ensure image loaded before interactions are too fast
    function boot(){
      displayLine(0);
    }
    if (villainImg.complete) boot();
    else villainImg.addEventListener("load", boot, { once:true });

    // keep canvas aligned
    window.addEventListener("resize", ()=>{ if (isDissolving) resizeDissolveCanvas(); }, { passive:true });


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
