    // ==========================
    // CONFIG
    // ==========================
    const NEXT_URL = "pages/05-ending/credit.html";

    // Texte "fin" (tu peux ajuster)
    const lines = [
      { tag: "Transmission", text: "Voilà. L’histoire de Saint-Claude est maintenant restaurée.", mood: "calm" },
      { tag: "Mémoire", text: "Vous la connaissez mieux que quiconque. Et ça… c’est rare.", mood: "warm" },
      { tag: "Remerciements", text: "Merci de m’avoir aidé. Votre mission a compté.", mood: "warm" },
      { tag: "Teaser", text: "Gardez votre téléphone près de vous… de nouvelles aventures arrivent.", mood: "hype" },
      { tag: "Clôture", text: "Fin de transmission.", mood: "end" }
    ];

    // ==========================
    // ELEMENTS
    // ==========================
    const stage = document.getElementById("stage");
    const hud = document.getElementById("hud");
    const textEl = document.getElementById("text");
    const btn = document.getElementById("btn");
    const tagEl = document.getElementById("tag");
    const hintTap = document.getElementById("hintTap");
    const stamp = document.getElementById("stamp");
    const teaser = document.getElementById("teaser");
    const flash = document.getElementById("flash");
    const profWrap = document.getElementById("profWrap");
    const profImg = document.getElementById("profImg");
    const bgImg = document.getElementById("bgImg");
    const status = document.getElementById("status");

    // Canvas FX
    const canvas = document.getElementById("fx");
    const ctx = canvas.getContext("2d", { alpha:true });

    // ==========================
    // AUDIO (procedural, no file needed)
    // ==========================
    let audioCtx = null, master = null, muted = false;

    function ensureAudio(){
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      master = audioCtx.createGain();
      master.gain.value = 0.35;
      master.connect(audioCtx.destination);
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
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.28);
    }

    function thump(){
      if (muted) return;
      ensureAudio();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(54, t + 0.14);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.18);
    }

    // ==========================
    // PARTICLES / FX
    // ==========================
    const particles = [];
    const shards = [];
    let lastTs = 0;

    function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }
    function rnd(a,b){ return Math.random()*(b-a)+a; }

    function resize(){
      const rect = stage.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2.25, window.devicePixelRatio || 1));
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    window.addEventListener("resize", resize, { passive:true });

    function spawnAmbient(){
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      // petites lucioles / étincelles
      for (let i=0;i<22;i++){
        particles.push({
          x: rnd(0,w),
          y: rnd(0,h),
          vx: rnd(-10,10),
          vy: rnd(-16,-4),
          r: rnd(0.8, 2.0),
          a: rnd(0.12, 0.34),
          born: performance.now(),
          life: rnd(2200, 5200),
          hue: Math.random() < 0.55 ? "olive" : "amber"
        });
      }
    }

    function burst(x,y, power=1){
      const n = Math.floor(36 * power);
      for (let i=0;i<n;i++){
        const ang = rnd(0, Math.PI*2);
        const sp = rnd(40, 220) * power;
        shards.push({
          x,y,
          vx: Math.cos(ang)*sp,
          vy: Math.sin(ang)*sp,
          s: rnd(1.2, 3.0),
          a: rnd(0.18, 0.55),
          born: performance.now(),
          life: rnd(420, 900),
          kind: Math.random()<0.7 ? "amber" : "white"
        });
      }
    }

    function drawFX(ts){
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      ctx.clearRect(0,0,w,h);

      // Soft glow vignette inside stage
      ctx.save();
      const g = ctx.createRadialGradient(w*0.5, h*0.55, 0, w*0.5, h*0.55, Math.min(w,h)*0.55);
      g.addColorStop(0, "rgba(107,142,35,0.10)");
      g.addColorStop(0.55, "rgba(240,173,78,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0.0)");
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);
      ctx.restore();

      // Ambient particles
      for (let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        const age = ts - p.born;
        if (age > p.life){ particles.splice(i,1); continue; }
        const k = 1 - age / p.life;

        p.x += p.vx * (1/60);
        p.y += p.vy * (1/60);
        p.vy += 6 * (1/60);

        const alpha = p.a * k;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = (p.hue === "olive")
          ? "rgba(107,142,35,0.95)"
          : "rgba(240,173,78,0.95)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r*(0.7 + 0.6*Math.sin(age/180)), 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }

      // Shards burst
      for (let i=shards.length-1;i>=0;i--){
        const s = shards[i];
        const age = ts - s.born;
        if (age > s.life){ shards.splice(i,1); continue; }
        const k = 1 - age / s.life;

        s.x += s.vx * (1/60);
        s.y += s.vy * (1/60);
        s.vy += 26 * (1/60);
        s.vx *= 0.985;
        s.vy *= 0.985;

        ctx.save();
        ctx.globalAlpha = s.a * k;
        ctx.fillStyle = s.kind === "amber" ? "rgba(240,173,78,0.92)" : "rgba(240,245,240,0.88)";
        ctx.fillRect(s.x, s.y, s.s, s.s);
        ctx.restore();
      }
    }

    function loop(ts){
      if (!lastTs) lastTs = ts;
      drawFX(ts);
      requestAnimationFrame(loop);
    }

    // ==========================
    // CINEMATIC / TYPEWRITER
    // ==========================
    let idx = 0;
    let typing = false;
    let timer = null;
    let canAdvance = false;

    function setReady(ready){
      canAdvance = ready;
      btn.classList.toggle("is-ready", ready);
      hintTap.classList.toggle("is-on", ready);
    }

    function typeWriter(text, i=0){
      typing = true;
      setReady(false);

      const speed = 26; // dynamique / premium
      if (i < text.length){
        // micro “radio jitter” rare
        if (Math.random() < 0.03) hud.classList.add("shake");
        textEl.innerHTML = text.substring(0, i+1) + '<span class="cursor">|</span>';
        timer = window.setTimeout(() => {
          hud.classList.remove("shake");
          typeWriter(text, i+1);
        }, speed);
      } else {
        textEl.textContent = text;
        typing = false;
        setReady(true);
      }
    }

    function moodFX(mood){
      // Ajuste l’ambiance sur chaque ligne
      profImg.classList.remove("is-on");
      profWrap.classList.remove("shake");
      profImg.classList.remove("is-on");

      if (mood === "calm"){
        profImg.classList.remove("is-on");
      }
      if (mood === "warm"){
        // halo + petit flash
        flash.classList.add("is-on");
        window.setTimeout(()=>flash.classList.remove("is-on"), 140);
        beep("sine", 520, 0.06, 0.12);
      }
      if (mood === "hype"){
        // glitch + shake + burst
        profImg.classList.add("is-on");
        profWrap.classList.add("shake");
        whoosh();
        burst(stage.clientWidth*0.5, stage.clientHeight*0.55, 1.1);
        window.setTimeout(()=>profWrap.classList.remove("shake"), 520);
      }
      if (mood === "end"){
        // scellé + teaser
        stamp.classList.add("is-on");
        teaser.classList.add("is-on");
        status.textContent = "TRANSMISSION: FERMÉE";
        thump();
        burst(stage.clientWidth*0.5, stage.clientHeight*0.45, 1.4);
      }
    }

    function showLine(i){
      const L = lines[i];
      tagEl.textContent = L.tag || "";
      textEl.textContent = "";
      moodFX(L.mood);
      beep("triangle", 660 + i*30, 0.05, 0.10);
      typeWriter(L.text, 0);
    }

    function skipTyping(){
      window.clearTimeout(timer);
      textEl.textContent = lines[idx].text;
      typing = false;
      setReady(true);
    }

    function finalCinematicExit(){
      // 1) Flash + glitch intensif
      flash.classList.add("is-on");
      profImg.classList.add("is-on");
      whoosh();

      // 2) "Ascension" + disparition (prof s’évapore + particules)
      const w = stage.clientWidth, h = stage.clientHeight;
      burst(w*0.5, h*0.62, 1.6);

      profWrap.animate([
        { transform: "translateY(0) rotateX(0deg) rotateY(0deg) scale(1)", filter:"drop-shadow(0 34px 70px rgba(0,0,0,0.70))", opacity: 1 },
        { transform: "translateY(-18px) rotateX(10deg) rotateY(-10deg) scale(1.02)", opacity: 1 },
        { transform: "translateY(-90px) rotateX(24deg) rotateY(16deg) scale(1.05)", filter:"blur(1.5px) drop-shadow(0 40px 120px rgba(0,0,0,0.82))", opacity: 0.78 },
        { transform: "translateY(-160px) rotateX(34deg) rotateY(28deg) scale(1.08)", filter:"blur(3px) drop-shadow(0 40px 140px rgba(0,0,0,0.90))", opacity: 0 }
      ], { duration: 980, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" });

      // 3) Background slow zoom + fade out
      bgImg.animate([
        { transform: "scale(1.08) translate(0,0)" },
        { transform: "scale(1.15) translate(-6px, 4px)" }
      ], { duration: 1100, easing: "ease-in-out", fill:"forwards" });

      window.setTimeout(()=>flash.classList.remove("is-on"), 180);

      window.setTimeout(() => {
        document.body.classList.add("is-out");
      }, 520);

      window.setTimeout(() => {
        window.location.href = NEXT_URL;
      }, 1180);
    }

    function next(){
      // assure audio on first interaction (iOS)
      ensureAudio();
      if (audioCtx?.state === "suspended") audioCtx.resume().catch(()=>{});

      if (typing){ skipTyping(); return; }
      if (!canAdvance) return;

      idx += 1;
      if (idx >= lines.length){
        setReady(false);
        btn.textContent = "Crédits";
        finalCinematicExit();
      } else {
        showLine(idx);
        if (idx === lines.length - 1){
          btn.textContent = "Clôturer";
        }
      }
    }

    // ==========================
    // PARALLAX (léger)
    // ==========================
    (function parallax(){
      let tx=0, ty=0, cx=0, cy=0;
      const onMove = (e) => {
        const w = window.innerWidth, h = window.innerHeight;
        const x = ((e.clientX||w/2)/w - 0.5) * 2;
        const y = ((e.clientY||h/2)/h - 0.5) * 2;
        tx = x * 10; ty = y * 8;
      };
      const tick = () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        bgImg.style.transform = `translate(${cx}px, ${cy}px) scale(1.08)`;
        requestAnimationFrame(tick);
      };
      window.addEventListener("mousemove", onMove, { passive:true });
      window.addEventListener("pointermove", onMove, { passive:true });
      tick();
    })();

    // ==========================
    // INPUTS
    // ==========================
    stage.addEventListener("click", next);
    hud.addEventListener("click", next);
    btn.addEventListener("click", next);

    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "enter" || k === " ") next();
    });

    // Prevent double-tap zoom (best effort)
    let lastTouch = 0;
    document.addEventListener("touchend", (e) => {
      const now = Date.now();
      if (now - lastTouch <= 240) e.preventDefault();
      lastTouch = now;
    }, { passive:false });

    // ==========================
    // BOOT
    // ==========================
    resize();
    spawnAmbient();
    window.setInterval(spawnAmbient, 1400);
    requestAnimationFrame(loop);

    idx = 0;
    btn.textContent = "Fin";
    setReady(false);
    showLine(idx);

    // after first line ready, show "tap hint" earlier
    window.setTimeout(()=>hintTap.classList.add("is-on"), 900);


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
