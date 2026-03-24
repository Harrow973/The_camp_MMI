    const NEXT_RESULT_URL = "pages/04-progression/resultatjeu1.html";

    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d", { alpha: true });
    const stage = document.getElementById("stage");

    const timeVal = document.getElementById("timeVal");
    const scoreVal = document.getElementById("scoreVal");
    const comboVal = document.getElementById("comboVal");
    const startBtn = document.getElementById("startBtn");
    const muteBtn = document.getElementById("muteBtn");
    const statusText = document.getElementById("statusText");
    const toast = document.getElementById("toast");
    const hint = document.getElementById("hint");

    // Debrief overlay
    const debriefOverlay = document.getElementById("debriefOverlay");
    const finalScoreEl = document.getElementById("finalScore");
    const finalComboEl = document.getElementById("finalCombo");
    const finalGradeEl = document.getElementById("finalGrade");
    const finalRewardEl = document.getElementById("finalReward");
    const rewardDescEl = document.getElementById("rewardDesc");
    const medalGlyphEl = document.getElementById("medalGlyph");
    const retryBtn = document.getElementById("retryBtn");
    const resultBtn = document.getElementById("resultBtn");

    // High-DPI
    function resize(){
      const rect = stage.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize, { passive:true });
    resize();

    // Audio
    let audioCtx = null, master = null, muted = false;
    function ensureAudio(){
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      master = audioCtx.createGain();
      master.gain.value = 0.35;
      master.connect(audioCtx.destination);
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
    function thump(){
      if (muted) return;
      ensureAudio();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.16);
    }
    function failSound(){
      beep("sawtooth", 160, 0.10, 0.16);
      beep("sawtooth", 120, 0.12, 0.14);
    }

    // State
    let running = false;
    let lastTs = 0;

    const state = {
      timeLeft: 30_000,
      score: 0,
      combo: 1,
      bestCombo: 1,
      sweep: 0,
      sweepSpeed: 1.35,
      sweepWidth: 0.38,
      level: 1,
      spawnRate: 0.85,
      maxTargets: 6,
      shake: 0,
      flash: 0,
    };

    const targets = [];
    const particles = [];

    function rnd(min,max){ return Math.random()*(max-min)+min; }
    function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

    function resetGame(){
      targets.length = 0;
      particles.length = 0;

      state.timeLeft = 30_000;
      state.score = 0;
      state.combo = 1;
      state.bestCombo = 1;

      state.sweep = -Math.PI * 0.5;
      state.sweepSpeed = 1.35;
      state.sweepWidth = 0.38;

      state.level = 1;
      state.spawnRate = 0.85;
      state.maxTargets = 6;

      state.shake = 0;
      state.flash = 0;

      syncHUD();
    }

    function syncHUD(){
      const s = Math.max(0, Math.ceil(state.timeLeft/1000));
      const mm = String(Math.floor(s/60)).padStart(2,"0");
      const ss = String(s%60).padStart(2,"0");
      timeVal.textContent = `${mm}:${ss}`;
      scoreVal.textContent = String(state.score);
      comboVal.textContent = `x${state.combo}`;
    }

    function spawnTarget(){
      if (targets.length >= state.maxTargets) return;
      const a = rnd(-Math.PI, Math.PI);
      const r = rnd(0.18, 0.95);
      const size = rnd(10, 18);
      const ttl = rnd(2200, 3800) - (state.level-1) * 120;
      targets.push({ a, r, size, born: performance.now(), ttl: Math.max(900, ttl), hit:false, pulse:rnd(0, Math.PI*2) });
    }

    function levelUpIfNeeded(){
      const newLevel = 1 + Math.floor(state.score / 350);
      if (newLevel !== state.level){
        state.level = newLevel;
        state.sweepSpeed = 1.35 + (state.level-1) * 0.18;
        state.spawnRate = 0.85 + (state.level-1) * 0.12;
        state.maxTargets = clamp(6 + (state.level-1), 6, 12);
        state.sweepWidth = clamp(0.38 - (state.level-1)*0.015, 0.26, 0.38);
        state.flash = 1;
        beep("square", 620, 0.08, 0.22);
        beep("square", 820, 0.08, 0.16);
        showToast(`NIVEAU ${state.level} — MENACE +`);
      }
    }

    function getCenter(){
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const cx = w/2;
      const cy = h/2;
      const rad = Math.min(w,h) * 0.43;
      return { cx, cy, rad, w, h };
    }

    function polarToXY(a, r){
      const { cx, cy, rad } = getCenter();
      return { x: cx + Math.cos(a) * rad * r, y: cy + Math.sin(a) * rad * r };
    }

    function angleDiff(a,b){
      let d = a - b;
      while (d > Math.PI) d -= Math.PI*2;
      while (d < -Math.PI) d += Math.PI*2;
      return d;
    }
    function isVisible(t){
      return Math.abs(angleDiff(t.a, state.sweep)) <= state.sweepWidth;
    }

    function burst(x,y, intensity=1){
      const n = Math.floor(18 * intensity);
      for (let i=0;i<n;i++){
        const ang = rnd(0, Math.PI*2);
        const sp = rnd(40, 160) * intensity;
        particles.push({ x,y, vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp, life: rnd(220, 520), born: performance.now() });
      }
    }

    function showToast(text){
      toast.textContent = text;
      toast.classList.add("is-on");
      window.setTimeout(() => toast.classList.remove("is-on"), 900);
    }

    function touchToCanvasXY(e){
      const rect = canvas.getBoundingClientRect();
      let x, y;
      if (e.touches && e.touches[0]){
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      return { x, y };
    }

    function handleTap(e){
      e.preventDefault?.();
      ensureAudio();
      if (audioCtx?.state === "suspended") audioCtx.resume().catch(()=>{});
      if (!running) return;

      const p = touchToCanvasXY(e);
      const { cx, cy, rad } = getCenter();
      const dist = Math.hypot(p.x - cx, p.y - cy);
      if (dist > rad*1.05){ miss(); return; }

      let best=null, bestD=Infinity;
      for (const t of targets){
        if (t.hit) continue;
        if (!isVisible(t)) continue;
        const xy = polarToXY(t.a, t.r);
        const d = Math.hypot(p.x - xy.x, p.y - xy.y);
        const hitRadius = t.size * 1.35;
        if (d <= hitRadius && d < bestD){ best=t; bestD=d; }
      }
      if (best) hit(best, p.x, p.y);
      else miss();
    }

    function hit(t, x, y){
      t.hit = true;

      const base = 50;
      const comboBonus = 18 * (state.combo - 1);
      const lvlBonus = 6 * (state.level - 1);
      const gain = base + comboBonus + lvlBonus;

      state.score += gain;
      state.combo = clamp(state.combo + 1, 1, 12);
      state.bestCombo = Math.max(state.bestCombo, state.combo);

      state.shake = 1;
      state.flash = 0.6;

      beep("sine", 520 + state.combo*18, 0.07, 0.18);
      beep("triangle", 760 + state.level*12, 0.06, 0.12);

      burst(x, y, clamp(0.9 + state.combo*0.06, 0.9, 1.6));
      showToast(`VERROUILLÉ +${gain}`);

      levelUpIfNeeded();
      syncHUD();
    }

    function miss(){
      state.combo = clamp(state.combo - 1, 1, 12);
      state.shake = Math.max(state.shake, 0.55);
      state.flash = Math.max(state.flash, 0.25);
      failSound();
      showToast("TIR À VIDE — DISCIPLINE !");
      syncHUD();
    }

    stage.addEventListener("pointerdown", handleTap, { passive:false });

    let spawnAcc = 0;

    function update(dt, now){
      state.timeLeft -= dt * 1000;
      if (state.timeLeft <= 0){
        state.timeLeft = 0;
        endGame();
        return;
      }

      state.sweep += state.sweepSpeed * dt;
      if (state.sweep > Math.PI) state.sweep -= Math.PI*2;

      spawnAcc += dt * state.spawnRate;
      while (spawnAcc >= 1){ spawnAcc -= 1; spawnTarget(); }

      for (const t of targets){
        if (t.hit) continue;
        const age = now - t.born;
        if (age > t.ttl){
          t.hit = true;
          state.combo = clamp(state.combo - 1, 1, 12);
          failSound();
          showToast("SIGNAL PERDU !");
        }
        t.pulse += dt * 5.2;
      }

      for (let i=targets.length-1;i>=0;i--){
        if (targets[i].hit) targets.splice(i,1);
      }

      for (let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        const age = now - p.born;
        if (age > p.life){ particles.splice(i,1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.985;
        p.vy *= 0.985;
      }

      state.shake = Math.max(0, state.shake - dt * 1.6);
      state.flash = Math.max(0, state.flash - dt * 1.8);

      syncHUD();
    }

    function draw(now){
      const { w, h, cx, cy, rad } = getCenter();
      ctx.clearRect(0,0,w,h);

      if (state.flash > 0){
        ctx.save();
        ctx.globalAlpha = 0.20 * state.flash;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0,0,w,h);
        ctx.restore();
      }

      const sh = state.shake;
      const sx = (Math.random()-0.5) * 10 * sh;
      const sy = (Math.random()-0.5) * 10 * sh;

      ctx.save();
      ctx.translate(sx, sy);

      // glow
      ctx.save();
      ctx.globalAlpha = 0.22;
      const g0 = ctx.createRadialGradient(cx, cy, rad*0.2, cx, cy, rad*1.02);
      g0.addColorStop(0, "rgba(107,142,35,0.35)");
      g0.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g0;
      ctx.beginPath(); ctx.arc(cx, cy, rad*1.04, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      // disk
      ctx.save();
      ctx.globalAlpha = 0.95;
      const g1 = ctx.createRadialGradient(cx,cy,rad*0.1,cx,cy,rad);
      g1.addColorStop(0, "rgba(8,10,8,0.50)");
      g1.addColorStop(1, "rgba(0,0,0,0.72)");
      ctx.fillStyle = g1;
      ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2); ctx.fill();
      ctx.restore();

      // grid
      ctx.save();
      ctx.strokeStyle = "rgba(240,245,240,0.10)";
      ctx.lineWidth = 1;
      for (let i=1;i<=4;i++){
        ctx.beginPath();
        ctx.arc(cx,cy,rad*(i/4),0,Math.PI*2);
        ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(cx-rad,cy); ctx.lineTo(cx+rad,cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx,cy-rad); ctx.lineTo(cx,cy+rad); ctx.stroke();
      ctx.restore();

      // sweep
      ctx.save();
      const sweep = state.sweep;
      const wdg = state.sweepWidth;
      const grad = ctx.createRadialGradient(cx,cy,0,cx,cy,rad);
      grad.addColorStop(0, "rgba(107,142,35,0.00)");
      grad.addColorStop(0.15, "rgba(107,142,35,0.08)");
      grad.addColorStop(1, "rgba(107,142,35,0.00)");
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,rad, sweep-wdg, sweep+wdg);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(107,142,35,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx + Math.cos(sweep)*rad, cy + Math.sin(sweep)*rad);
      ctx.stroke();
      ctx.restore();

      // targets
      for (const t of targets){
        const xy = polarToXY(t.a, t.r);
        const vis = isVisible(t);
        const p = 0.5 + 0.5*Math.sin(t.pulse);
        const baseAlpha = vis ? (0.75 + 0.20*p) : 0.08;

        ctx.save();
        ctx.globalAlpha = baseAlpha * (vis ? 1 : 0.7);
        const glow = ctx.createRadialGradient(xy.x,xy.y,0,xy.x,xy.y,t.size*2.2);
        glow.addColorStop(0, "rgba(240,173,78,0.85)");
        glow.addColorStop(1, "rgba(240,173,78,0.0)");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(xy.x,xy.y,t.size*2.2,0,Math.PI*2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = baseAlpha;
        ctx.fillStyle = vis ? "rgba(240,173,78,0.92)" : "rgba(240,173,78,0.40)";
        ctx.beginPath();
        ctx.arc(xy.x,xy.y, t.size*(vis?0.55:0.35), 0, Math.PI*2);
        ctx.fill();

        if (vis){
          ctx.strokeStyle = "rgba(240,245,240,0.55)";
          ctx.lineWidth = 1.2;
          const rr = t.size*1.15;
          ctx.beginPath(); ctx.arc(xy.x,xy.y, rr, 0, Math.PI*2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(xy.x-rr,xy.y); ctx.lineTo(xy.x+rr,xy.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(xy.x,xy.y-rr); ctx.lineTo(xy.x,xy.y+rr); ctx.stroke();
        }
        ctx.restore();
      }

      // particles
      for (const p of particles){
        const age = now - p.born;
        const k = 1 - age / p.life;
        ctx.save();
        ctx.globalAlpha = 0.55 * k;
        ctx.fillStyle = "rgba(240,245,240,0.9)";
        ctx.fillRect(p.x, p.y, 2.2, 2.2);
        ctx.restore();
      }

      // ring
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2); ctx.stroke();
      ctx.restore();

      // inside HUD
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = "rgba(240,245,240,0.85)";
      ctx.font = "700 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.fillText(`LVL ${state.level}`, cx - rad + 14, cy - rad + 22);
      ctx.fillText(`SPD ${(state.sweepSpeed).toFixed(2)}`, cx - rad + 14, cy - rad + 40);
      ctx.restore();

      ctx.restore();
    }

    function loop(ts){
      if (!running) return;
      const now = ts;
      const dt = Math.min(0.033, (ts - lastTs) / 1000 || 0);
      lastTs = ts;
      update(dt, now);
      draw(now);
      requestAnimationFrame(loop);
    }

    function computeGradeAndReward(score){
      // Ajuste librement ces seuils
      const tiers = [
        { min: 0,    grade: "Recrue",   glyph:"•", reward:"Ration de survie", credits: 20 },
        { min: 450,  grade: "Soldat",   glyph:"◆", reward:"Kit tactique",     credits: 45 },
        { min: 900,  grade: "Caporal",  glyph:"▲", reward:"Badge discipline", credits: 70 },
        { min: 1400, grade: "Sergent",  glyph:"★", reward:"Renfort radio",    credits: 110 },
        { min: 2000, grade: "Commando", glyph:"✦", reward:"Accès Secteur X",  credits: 160 }
      ];
      let pick = tiers[0];
      for (const t of tiers){ if (score >= t.min) pick = t; }
      return pick;
    }

    function openDebrief(){
      const pack = computeGradeAndReward(state.score);

      finalScoreEl.textContent = String(state.score);
      finalComboEl.textContent = `x${state.bestCombo}`;
      finalGradeEl.textContent = pack.grade.toUpperCase();
      medalGlyphEl.textContent = pack.glyph;
      finalRewardEl.textContent = pack.reward;
      rewardDescEl.innerHTML =
        `Analyse: vous gagnez <b>+${pack.credits} crédits</b> et un accès au <b>prochain secteur</b>.`;

      debriefOverlay.classList.add("is-on");
      debriefOverlay.setAttribute("aria-hidden", "false");

      // Persistance pour resultatjeu1.html
      localStorage.setItem("lastDefenseScore", String(state.score));
      localStorage.setItem("lastDefenseBestCombo", String(state.bestCombo));
      localStorage.setItem("lastDefenseLevel", String(state.level));
      localStorage.setItem("lastDefenseGrade", pack.grade);
      localStorage.setItem("lastDefenseReward", pack.reward);
      localStorage.setItem("lastDefenseCredits", String(pack.credits));
    }

    function startGame(){
      ensureAudio();
      if (audioCtx?.state === "suspended") audioCtx.resume().catch(()=>{});

      debriefOverlay.classList.remove("is-on");
      debriefOverlay.setAttribute("aria-hidden", "true");

      resetGame();
      running = true;
      lastTs = performance.now();
      spawnAcc = 0;

      statusText.textContent = "ARMEMENT: ACTIF";
      hint.innerHTML = `Objectif: verrouille un maximum de signaux. <b>Plus ton combo est haut</b>, plus tu scores.`;
      startBtn.textContent = "Recommencer";

      beep("square", 440, 0.07, 0.14);
      window.setTimeout(()=>beep("square", 660, 0.07, 0.14), 120);
      window.setTimeout(()=>beep("square", 880, 0.08, 0.18), 240);

      showToast("MISSION LANCÉE");
      requestAnimationFrame(loop);
    }

    function endGame(){
      running = false;
      statusText.textContent = "ARMEMENT: TERMINÉ";
      thump();
      showToast(`FIN — SCORE ${state.score}`);
      hint.innerHTML =
        `Debrief: Score <b>${state.score}</b> — Meilleur combo <b>x${state.bestCombo}</b>.`;
      draw(performance.now());

      // Affiche l'écran fin
      window.setTimeout(openDebrief, 350);
    }

    startBtn.addEventListener("click", startGame);

    muteBtn.addEventListener("click", () => {
      muted = !muted;
      muteBtn.textContent = muted ? "Son: OFF" : "Son: ON";
      if (!muted) beep("sine", 520, 0.07, 0.14);
    });

    retryBtn.addEventListener("click", () => {
      beep("sine", 520, 0.06, 0.12);
      startGame();
    });

    resultBtn.addEventListener("click", () => {
      beep("triangle", 720, 0.08, 0.14);
      // transition simple
      document.body.style.opacity = "0.6";
      window.setTimeout(() => {
        window.location.href = NEXT_RESULT_URL;
      }, 220);
    });

    // Prevent double-tap zoom (best effort)
    let lastTouch = 0;
    document.addEventListener("touchend", (e) => {
      const now = Date.now();
      if (now - lastTouch <= 240) e.preventDefault();
      lastTouch = now;
    }, { passive:false });

    resetGame();
    draw(performance.now());


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
