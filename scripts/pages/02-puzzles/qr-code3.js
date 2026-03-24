    // ====== CONFIG ======
    const NEXT_RESULT_URL = "pages/01-story/dialogue-professeur-artifact3.html"; // change vers ta page à toi si besoin

    // ====== TUNING ======
    const MEMO_ON_MS  = 420;  // durée du clignotement (plus grand = plus lent)
    const MEMO_OFF_MS = 170;  // pause entre deux clignotements
    const SPARK_VISIBILITY = 1.65; // 1.0 = normal, 1.5/2.0 = plus visible

    const countdown = document.getElementById("countdown");
    const countBig = document.getElementById("countBig");
    const countSub = document.getElementById("countSub");

    const FAILURE_TITLE = "ÉCHEC — DÉTONATION";
    const FAILURE_LINE  = "Le temps est écoulé. Mission compromise.";


    // ====== Elements ======
    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d", { alpha: true });
    const stage = document.getElementById("stage");
    const toast = document.getElementById("toast");
    const stamp = document.getElementById("stamp");
    const flash = document.getElementById("flash");

    const statusText = document.getElementById("statusText");
    const modeKey = document.getElementById("modeKey");
    const modeVal = document.getElementById("modeVal");
    const hint = document.getElementById("hint");

    const chipEls = [document.getElementById("chip0"), document.getElementById("chip1"), document.getElementById("chip2")];

    const wireA = document.getElementById("wireA");
    const wireB = document.getElementById("wireB");
    const wireC = document.getElementById("wireC");
    const wireBtns = { A: wireA, B: wireB, C: wireC };

    const timeVal = document.getElementById("timeVal");
    const roundVal = document.getElementById("roundVal");
    const mistakeVal = document.getElementById("mistakeVal");
    const startBtn = document.getElementById("startBtn");
    const muteBtn = document.getElementById("muteBtn");

    const debriefOverlay = document.getElementById("debriefOverlay");
    const finalTimeEl = document.getElementById("finalTime");
    const finalMistakesEl = document.getElementById("finalMistakes");
    const finalGradeEl = document.getElementById("finalGrade");
    const finalRewardEl = document.getElementById("finalReward");
    const rewardDescEl = document.getElementById("rewardDesc");
    const medalGlyphEl = document.getElementById("medalGlyph");
    const retryBtn = document.getElementById("retryBtn");
    const resultBtn = document.getElementById("resultBtn");

    // ====== Hi-DPI ======
    function resize(){
      const rect = stage.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      // canvas area is inside .wiresArea; take its rect
      const ca = canvas.getBoundingClientRect();
      canvas.width = Math.floor(ca.width * dpr);
      canvas.height = Math.floor(ca.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize, { passive:true });
    setTimeout(resize, 0);

    // ====== Audio (WebAudio) ======
    let audioCtx = null, master = null, muted = false;
    function ensureAudio(){
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      master = audioCtx.createGain();
      master.gain.value = 0.35;
      master.connect(audioCtx.destination);
    }
    function tone(type="sine", freq=440, dur=0.07, gain=0.14){
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
    function zap(){
      tone("square", 680, 0.05, 0.12);
      setTimeout(()=>tone("square", 980, 0.04, 0.10), 50);
    }
    function clicky(){
      tone("sine", 520, 0.03, 0.06);
    }
    function fail(){
      tone("sawtooth", 160, 0.10, 0.14);
      setTimeout(()=>tone("sawtooth", 120, 0.12, 0.12), 60);
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

    // Start audio on first gesture
    window.addEventListener("pointerdown", () => {
      ensureAudio();
      if (audioCtx?.state === "suspended") audioCtx.resume().catch(()=>{});
    }, { once:true, passive:true });

    // ====== FX helpers ======
    function showToast(text){
      toast.textContent = text;
      toast.classList.add("is-on");
      setTimeout(()=>toast.classList.remove("is-on"), 900);
    }
    function flashOnce(ms=180){
      flash.classList.add("is-on");
      setTimeout(()=>flash.classList.remove("is-on"), ms);
    }
    function setLive(on){
      document.body.classList.toggle("is-live", on);
      stamp.classList.toggle("is-on", on);
    }
    function wireHot(key, on){
      const el = wireBtns[key];
      if (!el) return;
      el.classList.toggle("is-hot", on);
    }
    function chipPulse(letter){
      // A/B/C mapped to chips visually; highlight target chip
      const map = { A:0, B:1, C:2 };
      const i = map[letter];
      const el = chipEls[i];
      if (!el) return;
      el.classList.add("is-on");
      setTimeout(()=>el.classList.remove("is-on"), 180);
    }

    // ====== Game State ======
    let running = false;
    let mode = "idle"; // idle | show | input | done
    let timeLeft = 25_000;

    let round = 1;
    const roundsTotal = 3;

    let mistakes = 0;
    let seq = [];
    let inputIdx = 0;

    // Visual state for wires
    const wires = [
      { key:"A", x:0.18, colA:"rgba(240,173,78,0.95)", colB:"rgba(240,173,78,0.10)" },
      { key:"B", x:0.50, colA:"rgba(53,201,195,0.95)", colB:"rgba(53,201,195,0.10)" },
      { key:"C", x:0.82, colA:"rgba(228,87,87,0.95)", colB:"rgba(228,87,87,0.10)" },
    ];

    const particles = [];

    function rnd(min,max){ return Math.random()*(max-min)+min; }
    function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

    function resetGame(){
      running = false;
      mode = "idle";
      timeLeft = 25_000;

      round = 1;
      mistakes = 0;
      seq = [];
      inputIdx = 0;

      particles.length = 0;

      syncHUD();
      setLive(false);

      statusText.textContent = "ARME: EN ATTENTE";
      modeKey.textContent = "Indice";
      modeVal.textContent = "Observe la séquence";
      hint.innerHTML = `Mission: mémorise puis reproduis l’ordre des fils. Chaque erreur fait monter la <b>tension</b>.`;
      startBtn.textContent = "Démarrer";
    }

    function syncHUD(){
      const s = Math.max(0, Math.ceil(timeLeft/1000));
      const mm = String(Math.floor(s/60)).padStart(2,"0");
      const ss = String(s%60).padStart(2,"0");
      timeVal.textContent = `${mm}:${ss}`;
      roundVal.textContent = `${round}/${roundsTotal}`;
      mistakeVal.textContent = String(mistakes);
    }

    function genSequence(len){
      const letters = ["A","B","C"];
      const out = [];
      let last = null;
      for (let i=0;i<len;i++){
        let pick = letters[Math.floor(Math.random()*letters.length)];
        if (pick === last) pick = letters[(letters.indexOf(pick)+1)%3];
        out.push(pick);
        last = pick;
      }
      return out;
    }

    async function showSequence(){
      mode = "show";
      modeKey.textContent = "Indice";
      modeVal.textContent = "Mémorisation";
      statusText.textContent = "ARME: ANALYSE";
      showToast("SÉQUENCE — MÉMORISE");
      clicky();

      // lock input during show
      for (const k of ["A","B","C"]) wireBtns[k].disabled = true;

      // pulse each element
      for (let i=0;i<seq.length;i++){
        const k = seq[i];
        chipPulse(k);
        wireHot(k, true);
        zap();
        spark(k, 0.9);
        await wait(MEMO_ON_MS);
        wireHot(k, false);
        await wait(MEMO_OFF_MS);
      }

      // back to input
      for (const k of ["A","B","C"]) wireBtns[k].disabled = false;
      mode = "input";
      modeKey.textContent = "Action";
      modeVal.textContent = "Reproduis l'ordre";
      statusText.textContent = "ARME: ACTIVE";
      showToast("À TOI — COUPE !");
      clicky();
    }

    function wait(ms){ return new Promise(r=>setTimeout(r, ms)); }

    function tensionLevel(){
      // tension rises with mistakes + late time
      const t = 1 - clamp(timeLeft / 25_000, 0, 1);
      return clamp(0.15 + mistakes*0.25 + t*0.55, 0.15, 1.0);
    }

   function spark(letter, intensity=1){
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      const mapX = { A:0.18, B:0.50, C:0.82 }[letter] ?? 0.5;
      const x = w * mapX + rnd(-12, 12);
      const y = h * 0.50 + rnd(-40, 40);

      const colors = {
        A: { core:"rgba(240,173,78,0.95)", glow:"rgba(240,173,78,0.35)" },
        B: { core:"rgba(53,201,195,0.95)", glow:"rgba(53,201,195,0.35)" },
        C: { core:"rgba(228,87,87,0.95)", glow:"rgba(228,87,87,0.38)" },
      };
      const col = colors[letter] || colors.A;

      const vis = SPARK_VISIBILITY;
      const n = Math.floor(26 * intensity * vis); // + de particules

      for (let i=0;i<n;i++){
        const ang = rnd(0, Math.PI*2);
        const sp = rnd(70, 260) * intensity * (0.9 + 0.35*vis);
        particles.push({
          x, y,
          vx: Math.cos(ang)*sp,
          vy: Math.sin(ang)*sp,
          life: rnd(260, 700) * (0.85 + 0.25*vis),
          born: performance.now(),
          kind: letter,
          size: rnd(1.8, 3.6) * (0.9 + 0.35*vis),
          core: col.core,
          glow: col.glow,
        });
      }
    }


    function onWireTap(letter){
      if (!running) return;
      if (mode !== "input") return;

      clicky();
      wireHot(letter, true);
      setTimeout(()=>wireHot(letter,false), 140);

      const expected = seq[inputIdx];
      if (letter === expected){
        // good
        zap();
        spark(letter, 1.05);
        showToast(`OK — ${inputIdx+1}/${seq.length}`);
        inputIdx += 1;

        // little reward time
        timeLeft = Math.min(25_000, timeLeft + 450);

        if (inputIdx >= seq.length){
          // round success
          thump();
          flashOnce(140);
          showToast("SÉQUENCE VALIDÉE");
          nextRound();
        }
      } else {
        // fail
        mistakes += 1;
        fail();
        spark(letter, 0.65);
        showToast("MAUVAIS FIL !");
        inputIdx = Math.max(0, inputIdx - 1); // punition soft
      }

      syncHUD();
    }

    async function nextRound(){
      mode = "done";
      for (const k of ["A","B","C"]) wireBtns[k].disabled = true;

      await wait(800);

      if (round >= roundsTotal){
        endGame(true);
        return;
      }

      round += 1;
      inputIdx = 0;

      // difficulty: sequence length increases
      const len = 3 + (round-1)*1; // 3,4,5
      seq = genSequence(len);

      roundVal.textContent = `${round}/${roundsTotal}`;
      modeKey.textContent = "Indice";
      modeVal.textContent = "Observe…";
      showToast(`ROUND ${round} — MENACE +`);
      // tiny “level up”
      tone("square", 620, 0.07, 0.18);
      setTimeout(()=>tone("square", 820, 0.07, 0.14), 90);

      for (const k of ["A","B","C"]) wireBtns[k].disabled = false;
      await wait(500);
      await showSequence();
    }

    async function runCountdown(){
      countdown.classList.add("is-on");
      countdown.setAttribute("aria-hidden", "false");

      const steps = [
        { n: "3", sub: "Stabilisation du circuit…" },
        { n: "2", sub: "Lecture des tensions…" },
        { n: "1", sub: "Positionne tes doigts." },
        { n: "GO", sub: "Désamorçage en cours !" }
      ];

      for (let i=0;i<steps.length;i++){
        countBig.textContent = steps[i].n;
        countSub.textContent = steps[i].sub;

        // sound + micro flash
        if (steps[i].n === "GO"){
          tone("square", 880, 0.08, 0.18);
          flashOnce(140);
        } else {
          tone("square", 420, 0.06, 0.12);
        }

        // petit rebond visuel
        countBig.style.transform = "scale(1.06)";
        setTimeout(()=>countBig.style.transform = "scale(1.0)", 120);

        await wait(800); // vitesse du countdown (augmente pour plus lent)
      }

      startBtn.disabled = false;
      startBtn.style.opacity = "1";

      countdown.classList.remove("is-on");
      countdown.setAttribute("aria-hidden", "true");
    }


    function startGame(){
      startBtn.disabled = true;
      startBtn.style.opacity = "0.75";
      debriefOverlay.classList.remove("is-on");
      debriefOverlay.setAttribute("aria-hidden","true");

      resetGame();
      running = true;
      setLive(true);

      // initial sequence
      seq = genSequence(3);
      inputIdx = 0;

      startBtn.textContent = "Recommencer";
      hint.innerHTML = `Objectif: zéro erreur. La <b>tension</b> monte si tu te trompes ou si tu traînes.`;
      showToast("MISSION LANCÉE");
      tone("square", 440, 0.07, 0.14);
      setTimeout(()=>tone("square", 660, 0.07, 0.14), 120);
      setTimeout(()=>tone("square", 880, 0.08, 0.18), 240);

      // show sequence then enable input
      (async () => {
        await runCountdown();
        await wait(180); // petite respiration (optionnel)
        await showSequence();
      })().catch(()=>{});

      lastTs = performance.now();
      requestAnimationFrame(loop);
    }

    function computeGradePack(){
      // Better grade if fewer mistakes and more remaining time
      const secLeft = Math.ceil(timeLeft/1000);
      const score = secLeft*10 - mistakes*25; // simple rating
      const tiers = [
        { min: -9999, grade:"Recrue", glyph:"•", reward:"Ration de survie", credits: 20 },
        { min: 40,    grade:"Soldat", glyph:"◆", reward:"Pince isolée",      credits: 45 },
        { min: 90,    grade:"Caporal",glyph:"▲", reward:"Kit sabotage",      credits: 70 },
        { min: 130,   grade:"Sergent",glyph:"★", reward:"Accès sécurisé",    credits: 110 },
        { min: 170,   grade:"Commando",glyph:"✦",reward:"Bypass terminal",   credits: 160 }
      ];
      let pick = tiers[0];
      for (const t of tiers){ if (score >= t.min) pick = t; }
      return pick;
    }

    function openDebrief(success){
      const secLeft = Math.max(0, Math.ceil(timeLeft/1000));

      // pack seulement si succès, sinon récompense zéro
      const pack = success ? computeGradePack() : {
        grade: "Échec",
        glyph: "✖",
        reward: "Aucune",
        credits: 0
      };

      // Texte + stats
      finalTimeEl.textContent = success ? `${secLeft}s` : "0s";
      finalMistakesEl.textContent = String(mistakes);
      finalGradeEl.textContent = (success ? pack.grade : "ÉCHEC").toUpperCase();
      medalGlyphEl.textContent = pack.glyph;
      finalRewardEl.textContent = success ? pack.reward : "Aucune";

      rewardDescEl.innerHTML = success
        ? `Analyse: vous gagnez <b>+${pack.credits} crédits</b> et un accès au <b>prochain secteur</b>.`
        : `Alerte: <b>temps écoulé</b>. ${FAILURE_LINE}`;

      // Change le titre de la carte (optionnel mais plus logique)
      const cardTitle = document.querySelector(".cardTitle");
      if (cardTitle){
        cardTitle.textContent = success ? "Débrief — Désamorçage" : FAILURE_TITLE;
      }

      // Bouton "Continuer" : interdit en échec
      if (!success){
        resultBtn.textContent = "Réessayer";
        resultBtn.onclick = () => {
          tone("sine", 520, 0.06, 0.12);
          startGame();
        };
      } else {
        resultBtn.textContent = "Continuer";
        resultBtn.onclick = () => {
          tone("triangle", 720, 0.08, 0.14);
          flashOnce(160);
          setTimeout(()=>document.body.classList.add("is-transitioning"), 220);
          setTimeout(()=>{ window.location.href = NEXT_RESULT_URL; }, 760);
        };
      }

      // Persistance : stocke bien success 0/1
      localStorage.setItem("wirecut_success", String(success ? 1 : 0));
      localStorage.setItem("wirecut_timeLeft", String(secLeft));
      localStorage.setItem("wirecut_mistakes", String(mistakes));
      localStorage.setItem("wirecut_grade", String(pack.grade));
      localStorage.setItem("wirecut_reward", String(pack.reward));
      localStorage.setItem("wirecut_credits", String(pack.credits));

      debriefOverlay.classList.add("is-on");
      debriefOverlay.setAttribute("aria-hidden","false");
    }


    function endGame(success){
      running = false;
      mode = "idle";
      setLive(false);

      // lock input
      for (const k of ["A","B","C"]) wireBtns[k].disabled = true;

      if (success){
        statusText.textContent = "ARME: DÉSACTIVÉE";
        showToast("DÉSAMORÇAGE RÉUSSI");
        thump();
        flashOnce(160);
      } else {
        statusText.textContent = "ARME: ÉCHEC";
        showToast("TEMPS ÉCOULÉ — ÉCHEC");
        fail();
        flashOnce(240);
      }

      openDebrief(success);
    }


    // ====== Loop & Draw ======
    let lastTs = 0;

    function update(dt, now){
      if (!running) return;

      timeLeft -= dt*1000;
      if (timeLeft <= 0){
        timeLeft = 0;
        syncHUD();
        endGame(false);
        return;
      }

      // remove particles
      for (let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        const age = now - p.born;
        if (age > p.life){ particles.splice(i,1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.985;
        p.vy *= 0.985;
      }

      syncHUD();
    }

    function draw(now){
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0,0,w,h);

      // base glow from tension
      const tl = tensionLevel();

      // subtle screen shake with tension
      const sx = (Math.random()-0.5) * 5 * tl;
      const sy = (Math.random()-0.5) * 5 * tl;

      ctx.save();
      ctx.translate(sx, sy);

      // board vignette
      ctx.save();
      const g0 = ctx.createRadialGradient(w*0.5, h*0.35, 10, w*0.5, h*0.5, Math.max(w,h)*0.65);
      g0.addColorStop(0, `rgba(107,142,35,${0.18*tl})`);
      g0.addColorStop(0.55, "rgba(0,0,0,0)");
      g0.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = g0;
      ctx.fillRect(0,0,w,h);
      ctx.restore();

      // wires (3 vertical) + nodes
      for (const wire of wires){
        const x = w * wire.x;
        // glow
        ctx.save();
        ctx.globalAlpha = 0.30 + 0.25*tl;
        const g = ctx.createLinearGradient(x, 0, x, h);
        g.addColorStop(0, wire.colB);
        g.addColorStop(0.5, wire.colA);
        g.addColorStop(1, wire.colB);
        ctx.strokeStyle = g;
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, h*0.12);
        ctx.lineTo(x, h*0.88);
        ctx.stroke();
        ctx.restore();

        // core
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = wire.colA;
        ctx.lineWidth = 3.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, h*0.12);
        ctx.lineTo(x, h*0.88);
        ctx.stroke();
        ctx.restore();

        // endpoints
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "rgba(240,245,240,0.70)";
        ctx.beginPath(); ctx.arc(x, h*0.12, 5.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, h*0.88, 5.2, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }

      // hazard sparks drifting
      if (running && mode === "input" && tl > 0.55 && Math.random() < 0.10*tl){
        const pick = ["A","B","C"][Math.floor(Math.random()*3)];
        spark(pick, 0.40 + 0.60*tl);
      }

      // particles
      // particles (plus visibles + glow coloré)
      for (const p of particles){
        const age = now - p.born;
        const k = 1 - age / p.life;

        // halo
        ctx.save();
        ctx.globalAlpha = (0.35 * k);
        ctx.fillStyle = p.glow || "rgba(240,245,240,0.22)";
        const r = (p.size || 2.4) * 4.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        // noyau
        ctx.save();
        ctx.globalAlpha = (0.85 * k);
        ctx.fillStyle = p.core || "rgba(240,245,240,0.92)";
        const s = (p.size || 2.4);
        ctx.fillRect(p.x - s*0.5, p.y - s*0.5, s, s);
        ctx.restore();
      }


      // subtle scanline band
      if (running){
        const y = (now * 0.06) % (h + 120) - 60;
        ctx.save();
        ctx.globalAlpha = 0.10 + 0.08*tl;
        const gg = ctx.createLinearGradient(0, y-30, 0, y+30);
        gg.addColorStop(0, "rgba(255,255,255,0)");
        gg.addColorStop(0.5, "rgba(240,173,78,0.22)");
        gg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gg;
        ctx.fillRect(0, y-40, w, 80);
        ctx.restore();
      }

      ctx.restore();
    }

    function loop(ts){
      if (!running){
        draw(performance.now());
        return;
      }
      const now = ts;
      const dt = Math.min(0.033, (ts - lastTs)/1000 || 0);
      lastTs = ts;
      update(dt, now);
      draw(now);
      requestAnimationFrame(loop);
    }

    // ====== Bindings ======
    function bindWire(el, letter){
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault?.();
        ensureAudio();
        if (audioCtx?.state === "suspended") audioCtx.resume().catch(()=>{});
        onWireTap(letter);
      }, { passive:false });
    }
    bindWire(wireA, "A");
    bindWire(wireB, "B");
    bindWire(wireC, "C");

    startBtn.addEventListener("click", () => {
      ensureAudio();
      if (audioCtx?.state === "suspended") audioCtx.resume().catch(()=>{});
      startGame();
    });

    muteBtn.addEventListener("click", () => {
      muted = !muted;
      muteBtn.textContent = muted ? "Son: OFF" : "Son: ON";
      if (!muted) tone("sine", 520, 0.07, 0.14);
    });

    retryBtn.addEventListener("click", () => {
      ensureAudio();
      if (audioCtx?.state === "suspended") audioCtx.resume().catch(()=>{});
      tone("sine", 520, 0.06, 0.12);
      startGame();
    });

    // Prevent double-tap zoom (best effort)
    let lastTouch = 0;
    document.addEventListener("touchend", (e) => {
      const now = Date.now();
      if (now - lastTouch <= 240) e.preventDefault();
      lastTouch = now;
    }, { passive:false });

    // Boot
    resetGame();
    setTimeout(resize, 20);
    draw(performance.now());


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
