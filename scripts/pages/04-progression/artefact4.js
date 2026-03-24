    // ============================================================
    // CONFIG
    // ============================================================
    const NEXT_URL = "pages/04-progression/lesartefacts.html";

    // ============================================================
    // DOM
    // ============================================================
    const stage = document.getElementById("stage");
    const artifactWrap = document.getElementById("artifactWrap");
    const artifactImg = document.getElementById("artifactImg");
    const dissolve = document.getElementById("dissolve");
    const fx = document.getElementById("fx");
    const shock = document.getElementById("shock");

    const flash = document.getElementById("flash");
    const loader = document.getElementById("loader");

    const hudText = document.getElementById("hudText");
    const pill = document.getElementById("pill");
    const hint = document.getElementById("hint");

    const collectBtn = document.getElementById("collectBtn");
    const soundBtn = document.getElementById("soundBtn");

    const intro = document.getElementById("intro");
    const introOk = document.getElementById("introOk");
    const introMute = document.getElementById("introMute");

    // ============================================================
    // AUDIO (WebAudio) — iOS safe
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

    function sfxNoiseBurst(dur=0.12, gain=0.16, center=900){
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

      const bp = audioCtx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(center, t);
      bp.Q.setValueAtTime(1.15, t);

      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t+dur);

      src.connect(bp);
      bp.connect(g);
      g.connect(master);

      src.start(t);
      src.stop(t + dur + 0.02);
    }

    function sfxPickup(){
      sfxBeep("square", 740, 0.07, 0.14);
      setTimeout(()=>sfxBeep("square", 980, 0.07, 0.12), 90);
      setTimeout(()=>sfxBeep("triangle", 1220, 0.08, 0.10), 160);
    }

    function sfxCharge(){
      // rising + subtle noise
      if (muted) return;
      resumeAudio();
      const t = audioCtx.currentTime;

      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(920, t+0.55);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t+0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.60);

      o.connect(g); g.connect(master);
      o.start(t); o.stop(t+0.62);

      setTimeout(()=>sfxNoiseBurst(0.18, 0.12, 700), 180);
    }

    function sfxImpact(){
      sfxNoiseBurst(0.16, 0.20, 820);
      sfxBeep("triangle", 180, 0.10, 0.14);
      setTimeout(()=>sfxBeep("triangle", 90, 0.14, 0.12), 80);
    }

    function sfxWarpOut(){
      sfxNoiseBurst(0.22, 0.22, 1000);
      sfxBeep("square", 620, 0.07, 0.10);
      setTimeout(()=>sfxBeep("square", 320, 0.09, 0.10), 80);
    }

    // unlock audio on first gesture
    window.addEventListener("pointerdown", () => resumeAudio(), { once:true, passive:true });

    // ============================================================
    // VISUAL HELPERS
    // ============================================================
    function pulseGlitch(){
      document.body.classList.add("glitching");
      setTimeout(()=>document.body.classList.remove("glitching"), 560);
    }
    function flashBang(){
      flash.classList.add("is-on");
      setTimeout(()=>flash.classList.remove("is-on"), 160);
    }
    function showLoader(){
      loader.classList.add("is-on");
    }
    function hideLoader(){
      loader.classList.remove("is-on");
    }
    window.addEventListener("pageshow", (e)=>{ if (e.persisted) hideLoader(); });

    // ============================================================
    // 3D TILT (finger) — smooth + safe
    // ============================================================
    (function setupTilt(){
      let raf = null;
      let tx=0, ty=0, cx=0, cy=0;

      const onMove = (e) => {
        const p = e.touches ? e.touches[0] : e;
        const w = window.innerWidth, h = window.innerHeight;
        tx = (p.clientX / w - 0.5) * 2;
        ty = (p.clientY / h - 0.5) * 2;

        if (raf) return;
        raf = requestAnimationFrame(()=>{
          raf = null;
          cx += (tx - cx) * 0.18;
          cy += (ty - cy) * 0.18;

          const rx = (-cy * 10).toFixed(2);
          const ry = (cx * 14).toFixed(2);
          artifactWrap.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(6px)`;
        });
      };

      window.addEventListener("pointermove", onMove, { passive:true });
      window.addEventListener("touchmove", onMove, { passive:true });
    })();

    // ============================================================
    // CANVAS FX: Particles + Pixel dissolve
    // ============================================================
    function setupCanvasToMatch(el, canvas){
      const rect = el.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr,0,0,dpr,0,0);
      return { ctx, w: rect.width, h: rect.height, dpr };
    }

    // simple particle engine
    let particles = [];
    function spawnBurst(w, h, intensity=1){
      const n = Math.floor(70 * intensity);
      for (let i=0;i<n;i++){
        const a = Math.random() * Math.PI * 2;
        const sp = (80 + Math.random()*360) * intensity;
        particles.push({
          x: w*0.5 + (Math.random()-0.5)*18,
          y: h*0.5 + (Math.random()-0.5)*18,
          vx: Math.cos(a)*sp,
          vy: Math.sin(a)*sp,
          life: 0.35 + Math.random()*0.55,
          age: 0,
          r: 1.2 + Math.random()*2.4,
          hue: Math.random() < 0.5 ? "cyan" : "amber"
        });
      }
    }

    function drawParticles(ctx, w, h, dt){
      ctx.clearRect(0,0,w,h);

      // subtle additive glow
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      particles = particles.filter(p => (p.age += dt) < p.life);
      for (const p of particles){
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.985;
        p.vy *= 0.985;

        const t = p.age / p.life;
        const alpha = (1 - t) * 0.9;

        ctx.globalAlpha = alpha;

        let fill = "rgba(0,240,255,0.85)";
        if (p.hue === "amber") fill = "rgba(240,173,78,0.85)";
        ctx.fillStyle = fill;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r*(1+0.6*t), 0, Math.PI*2);
        ctx.fill();
      }

      ctx.restore();
    }

    function runParticles(el){
      fx.style.display = "block";
      const { ctx, w, h } = setupCanvasToMatch(el, fx);
      let last = performance.now();
      function loop(now){
        const dt = Math.min(0.05, (now-last)/1000);
        last = now;
        drawParticles(ctx, w, h, dt);
        if (particles.length > 0) requestAnimationFrame(loop);
        else fx.style.display = "none";
      }
      requestAnimationFrame(loop);
    }

    function pixelDissolve(){
      dissolve.style.display = "block";

      const { ctx, w, h } = setupCanvasToMatch(artifactWrap, dissolve);

      // draw artifact image at center in canvas space
      ctx.clearRect(0,0,w,h);

      // compute draw rect keeping aspect ratio
      const imgW = artifactImg.naturalWidth || 512;
      const imgH = artifactImg.naturalHeight || 512;
      const scale = Math.min((w*0.65)/imgW, (h*0.65)/imgH);
      const dw = imgW * scale;
      const dh = imgH * scale;
      const dx = (w - dw)/2;
      const dy = (h - dh)/2;

      ctx.drawImage(artifactImg, dx, dy, dw, dh);

      let imgData = ctx.getImageData(0,0,w,h);
      let data = imgData.data;

      // list opaque pixels
      const indices = [];
      for (let y=0;y<h;y++){
        for (let x=0;x<w;x++){
          const i = (y*w + x)*4;
          if (data[i+3] > 10) indices.push(i);
        }
      }

      // shuffle
      for (let i=indices.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        const t = indices[i]; indices[i] = indices[j]; indices[j] = t;
      }

      let erased = 0;
      const total = indices.length;
      const start = performance.now();
      const duration = 1050;

      function pass(batch){
        for (let k=0;k<batch && erased<total;k++,erased++){
          const p = indices[erased];
          // corruption tint before vanish
          data[p+0] = Math.min(255, data[p+0] + 22);
          data[p+1] = Math.max(0,   data[p+1] - 10);
          data[p+2] = Math.min(255, data[p+2] + 26);
          data[p+3] = 0;
        }

        // glitch bars
        if (Math.random() < 0.20){
          const yy = Math.floor(Math.random()*h);
          const barH = 2 + Math.floor(Math.random()*6);
          const shift = (Math.random()<0.5?-1:1) * (6 + Math.floor(Math.random()*18));
          const bar = ctx.getImageData(0, Math.max(0,yy-barH), w, Math.min(h,barH*2));
          ctx.putImageData(bar, shift, Math.max(0,yy-barH));
        }

        ctx.putImageData(imgData, 0, 0);
      }

      function loop(now){
        const t = Math.min(1, (now-start)/duration);
        const batch = Math.floor(700 + (t*t)*12000);
        pass(batch);

        dissolve.style.opacity = String(1 - t*0.95);

        if (t < 1 && erased < total){
          requestAnimationFrame(loop);
        } else {
          dissolve.style.opacity = "0";
        }
      }
      requestAnimationFrame(loop);
    }

    // ============================================================
    // FLOW: Intro -> Collect -> Redirect
    // ============================================================
    let collected = false;

    function setSoundLabel(){
      soundBtn.textContent = muted ? "Son: OFF" : "Son: ON";
      introMute.textContent = muted ? "Son: OFF" : "Son: ON";
    }
    setSoundLabel();

    soundBtn.addEventListener("click", ()=>{
      resumeAudio();
      muted = !muted;
      setSoundLabel();
      if (!muted) sfxBeep("square", 520, 0.06, 0.10);
    });

    introMute.addEventListener("click", ()=>{
      resumeAudio();
      muted = !muted;
      setSoundLabel();
      if (!muted) sfxBeep("square", 520, 0.06, 0.10);
    });

    introOk.addEventListener("click", ()=>{
      resumeAudio();
      intro.classList.add("is-off");
      // tiny "ready" sound
      if (!muted){
        sfxBeep("square", 620, 0.06, 0.10);
        setTimeout(()=>sfxBeep("square", 820, 0.06, 0.09), 80);
      }
    });

    function collect(){
      if (collected) return;
      collected = true;

      resumeAudio();

      pill.textContent = "Absorption en cours";
      hudText.textContent = "Verrouillage de l’artefact… maintien du signal.";
      hint.textContent = "Séquence finale…";

      // Cinematic sequence
      pulseGlitch();
      sfxCharge();

      // shockwave + flash
      shock.classList.remove("is-on"); // reset
      void shock.offsetWidth;
      shock.classList.add("is-on");
      flashBang();

      // particles
      const rect = artifactWrap.getBoundingClientRect();
      spawnBurst(rect.width, rect.height, 1.0);
      runParticles(artifactWrap);

      // pixel dissolve
      setTimeout(()=>{
        sfxPickup();
        pulseGlitch();
        pixelDissolve();
        artifactImg.style.opacity = "0";
      }, 420);

      // impact
      setTimeout(()=>{
        sfxImpact();
        flashBang();
      }, 720);

      // warp-out to next
      setTimeout(()=>{
        sfxWarpOut();
        document.body.classList.add("is-transitioning");
      }, 980);

      setTimeout(()=>{
        showLoader();
        window.location.href = NEXT_URL;
      }, 1460);
    }

    // tap on artifact OR button OR stage
    artifactWrap.addEventListener("click", collect);
    collectBtn.addEventListener("click", collect);
    stage.addEventListener("click", (e)=>{
      // avoid double triggering when clicking the button area
      const target = e.target;
      if (target === collectBtn || target === soundBtn) return;
      // allow stage tap to feel "mobile"
      collect();
    });

    // keep canvases aligned on resize
    window.addEventListener("resize", ()=>{
      if (dissolve.style.display === "block") setupCanvasToMatch(artifactWrap, dissolve);
      if (fx.style.display === "block") setupCanvasToMatch(artifactWrap, fx);
    }, { passive:true });

    // Ensure image loaded for dissolve quality
    if (!artifactImg.complete){
      artifactImg.addEventListener("load", ()=>{}, { once:true });
    }


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
