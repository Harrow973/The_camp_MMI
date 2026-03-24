    // ============================================================
    // CONFIG
    // ============================================================
    const NEXT_URL = "pages/01-story/dialogue-mechant-defaite.html";

    // gameplay
    const BASE_LIVES = 3;
    const PLAYER_SPEED = 520;            // px/sec
    const PLAYER_FRICTION = 12.0;        // smoothing
    const FIRE_RATE = 8.2;               // tirs/sec (base)
    const BULLET_SPEED = 820;            // px/sec
    const BULLET_LIFE = 1.25;            // sec
    const ENEMY_BASE_SPEED = 120;        // px/sec
    const ENEMY_SPAWN_BASE = 1.00;       // spawns/sec
    const ENEMY_HP_BASE = 1;
    const WAVE_TIME = 16;                // sec avant +1 vague
    const HIT_INVULN = 0.85;             // sec invuln après hit

    // powerups
    const POWER_SPAWN_EVERY = 8.5;       // sec (approx)
    const POWER_FALL_SPEED = 160;        // px/sec
    const SHIELD_DURATION = 4.0;         // sec
    const RAPID_DURATION  = 5.0;         // sec
    const DOUBLE_DURATION = 5.0;         // sec

    // rendering
    const DPR = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));

    // ============================================================
    // DOM
    // ============================================================
    const stage = document.getElementById("stage");
    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d", { alpha:true });

    const toast = document.getElementById("toast");
    const statusText = document.getElementById("statusText");

    const livesVal = document.getElementById("livesVal");
    const scoreVal = document.getElementById("scoreVal");
    const waveVal  = document.getElementById("waveVal");

    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");
    const fireBtn = document.getElementById("fireBtn");

    const tutorialOverlay = document.getElementById("tutorialOverlay");
    const okBtn = document.getElementById("okBtn");
    const muteGhost = document.getElementById("muteGhost");

    const summaryOverlay = document.getElementById("summaryOverlay");
    const finalScore = document.getElementById("finalScore");
    const finalAcc   = document.getElementById("finalAcc");
    const finalKills = document.getElementById("finalKills");
    const finalWave  = document.getElementById("finalWave");
    const finalGrade = document.getElementById("finalGrade");
    const medalGlyph = document.getElementById("medalGlyph");
    const finalTime  = document.getElementById("finalTime");
    const rewardDesc = document.getElementById("rewardDesc");
    const retryBtn   = document.getElementById("retryBtn");
    const nextBtn    = document.getElementById("nextBtn");

    const flash = document.getElementById("flash");

    // ============================================================
    // UTIL
    // ============================================================
    const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
    const rnd = (a,b) => Math.random()*(b-a)+a;
    const lerp = (a,b,t) => a + (b-a)*t;

    function showToast(text){
      toast.textContent = text;
      toast.classList.add("is-on");
      window.setTimeout(() => toast.classList.remove("is-on"), 850);
    }
    function mmss(sec){
      const s = Math.max(0, Math.floor(sec));
      const mm = String(Math.floor(s/60)).padStart(2,"0");
      const ss = String(s%60).padStart(2,"0");
      return `${mm}:${ss}`;
    }

    // ============================================================
    // RESIZE
    // ============================================================
    function resize(){
      const rect = stage.getBoundingClientRect();
      canvas.width  = Math.floor(rect.width * DPR);
      canvas.height = Math.floor(rect.height * DPR);
      canvas.style.width  = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    window.addEventListener("resize", resize, { passive:true });
    resize();

    // ============================================================
    // AUDIO (auto on first gesture)
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
    function sfxBeep(type="square", freq=520, dur=0.06, gain=0.12){
      if (muted) return;
      resumeAudio();
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
    function sfxShot(){
      if (muted) return;
      resumeAudio();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(920, t);
      o.frequency.exponentialRampToValueAtTime(420, t+0.06);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.07);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t+0.09);
    }
    function sfxHit(){
      sfxBeep("triangle", 220, 0.09, 0.18);
      sfxBeep("triangle", 140, 0.12, 0.14);
    }
    function sfxExplode(){
      if (muted) return;
      resumeAudio();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(60, t+0.14);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.16);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t+0.18);
    }
    function sfxPower(){
      sfxBeep("square", 740, 0.07, 0.16);
      window.setTimeout(()=>sfxBeep("square", 980, 0.07, 0.14), 90);
    }
    function bindHold(btn, key){
      btn.addEventListener("pointerdown", (e)=>{ resumeAudio(); input[key] = true; e.preventDefault(); }, { passive:false });
      btn.addEventListener("pointermove", (e)=>{ e.preventDefault(); }, { passive:false }); // ✅ empêche drag/selection
      btn.addEventListener("pointerup",   (e)=>{ input[key] = false; e.preventDefault(); }, { passive:false });
      btn.addEventListener("pointercancel",(e)=>{ input[key] = false; e.preventDefault(); }, { passive:false });
    }

    // ============================================================
    // GAME STATE
    // ============================================================
    let running = false;
    let lastTs = 0;

    const world = {
      w: 0, h: 0,
      gameTime: 0,
      lives: BASE_LIVES,
      score: 0,
      wave: 1,
      kills: 0,
      shots: 0,
      hits: 0,
      invuln: 0,

      shake: 0,
      flash: 0,

      spawnAcc: 0,
      waveAcc: 0,
      fireAcc: 0,

      powerAcc: 0,          // timer spawn
      powerActive: null,    // {type, tLeft}
      shieldLeft: 0,
      rapidLeft: 0,
      doubleLeft: 0,
    };

    const player = { x:0, y:0, vx:0, vy:0, r:16 };
    const bullets = [];
    const enemies = [];
    const particles = [];
    const stars = [];
    const powerups = []; // falling pickups

    function resetStars(){
      stars.length = 0;
      for (let i=0;i<120;i++){
        stars.push({ x: Math.random(), y: Math.random(), z: rnd(0.2,1.0), s: rnd(0.3,1.2) });
      }
    }
    resetStars();

    function resetGame(){
      bullets.length = 0;
      enemies.length = 0;
      particles.length = 0;
      powerups.length = 0;

      world.gameTime = 0;
      world.lives = BASE_LIVES;
      world.score = 0;
      world.wave = 1;
      world.kills = 0;
      world.shots = 0;
      world.hits = 0;
      world.invuln = 0;

      world.shake = 0;
      world.flash = 0;

      world.spawnAcc = 0;
      world.waveAcc = 0;
      world.fireAcc = 0;

      world.powerAcc = 0;
      world.shieldLeft = 0;
      world.rapidLeft = 0;
      world.doubleLeft = 0;

      const rect = stage.getBoundingClientRect();
      world.w = rect.width;
      world.h = rect.height;

      player.x = world.w * 0.5;
      player.y = world.h * 0.82;
      player.vx = 0;
      player.vy = 0;

      statusText.textContent = "SYSTÈME: PRÊT";
      syncHUD();
      draw(0);
    }

    function syncHUD(){
      livesVal.textContent = String(world.lives).padStart(2,"0");
      scoreVal.textContent = String(world.score);
      waveVal.textContent  = String(world.wave);
    }

    // ============================================================
    // INPUT (left/right + fire)
    // ============================================================
    const input = { left:false, right:false, firing:false };

    function bindHold(btn, key){
      btn.addEventListener("pointerdown", (e)=>{ resumeAudio(); input[key] = true; e.preventDefault?.(); }, { passive:false });
      btn.addEventListener("pointerup",   (e)=>{ input[key] = false; e.preventDefault?.(); }, { passive:false });
      btn.addEventListener("pointercancel",(e)=>{ input[key] = false; e.preventDefault?.(); }, { passive:false });
      btn.addEventListener("pointerleave",(e)=>{ /* keep state */ }, { passive:true });
    }
    bindHold(leftBtn, "left");
    bindHold(rightBtn, "right");
    bindHold(fireBtn, "firing");

    // keyboard desktop
    window.addEventListener("keydown", (e)=>{
      const k = e.key.toLowerCase();
      if (k==="arrowleft" || k==="a") input.left = true;
      if (k==="arrowright"|| k==="d") input.right = true;
      if (k===" " || k==="enter") input.firing = true;
    });
    window.addEventListener("keyup", (e)=>{
      const k = e.key.toLowerCase();
      if (k==="arrowleft" || k==="a") input.left = false;
      if (k==="arrowright"|| k==="d") input.right = false;
      if (k===" " || k==="enter") input.firing = false;
    });

    // ============================================================
    // SPAWN / PARTICLES / POWERUPS
    // ============================================================
    function spawnEnemy(){
      const pad = 26;
      enemies.push({
        x: rnd(pad, world.w - pad),
        y: -rnd(30, 160),
        vx: rnd(-24, 24),
        vy: ENEMY_BASE_SPEED + (world.wave-1)*12,
        r: rnd(14, 20),
        hp: ENEMY_HP_BASE + Math.floor((world.wave-1)/3),
        t: 0
      });
    }

    // Power-up types: SHIELD, RAPID, DOUBLE, HEAL
    function spawnPowerUp(){
      const types = ["SHIELD","RAPID","DOUBLE","HEAL"];
      // pondération: heal un peu plus rare
      const roll = Math.random();
      let type = "RAPID";
      if (roll < 0.26) type = "SHIELD";
      else if (roll < 0.54) type = "RAPID";
      else if (roll < 0.82) type = "DOUBLE";
      else type = "HEAL";

      const pad = 26;
      powerups.push({
        type,
        x: rnd(pad, world.w - pad),
        y: -rnd(40, 120),
        r: 16,
        vy: POWER_FALL_SPEED,
        spin: rnd(0, Math.PI*2),
      });
    }

    function burst(x,y, intensity=1){
      const n = Math.floor(18*intensity);
      for (let i=0;i<n;i++){
        const a = rnd(0, Math.PI*2);
        const sp = rnd(70, 240) * intensity;
        particles.push({
          x, y,
          vx: Math.cos(a)*sp,
          vy: Math.sin(a)*sp,
          life: rnd(0.25, 0.65),
          born: world.gameTime,
          size: rnd(1.6, 2.8)
        });
      }
    }

    function applyPower(type){
      sfxPower();
      world.flash = Math.max(world.flash, 0.35);
      world.shake = Math.max(world.shake, 0.25);

      if (type === "SHIELD"){
        world.shieldLeft = SHIELD_DURATION;
        showToast("POWER-UP: SHIELD");
      } else if (type === "RAPID"){
        world.rapidLeft = RAPID_DURATION;
        showToast("POWER-UP: RAPID FIRE");
      } else if (type === "DOUBLE"){
        world.doubleLeft = DOUBLE_DURATION;
        showToast("POWER-UP: DOUBLE SHOT");
      } else if (type === "HEAL"){
        world.lives = clamp(world.lives + 1, 0, 5);
        showToast("POWER-UP: +1 VIE");
        syncHUD();
      }
    }

    // ============================================================
    // COLLISIONS
    // ============================================================
    function collideCircle(ax,ay,ar, bx,by,br){
      const dx = ax-bx, dy = ay-by;
      const rr = ar+br;
      return (dx*dx + dy*dy) <= rr*rr;
    }

    function damagePlayer(){
      // Shield actif = ignore
      if (world.shieldLeft > 0) return;
      if (world.invuln > 0) return;

      world.lives -= 1;
      world.invuln = HIT_INVULN;

      world.shake = Math.max(world.shake, 1.0);
      world.flash = Math.max(world.flash, 0.7);

      sfxHit();
      showToast("IMPACT — DISCIPLINE !");
      syncHUD();

      if (world.lives <= 0){
        endGame();
      }
    }

    // ============================================================
    // GAME LOOP
    // ============================================================
    function startAfterTutorial(){
      tutorialOverlay.classList.add("is-off");
      statusText.textContent = "SYSTÈME: ACTIF";
      running = true;
      lastTs = performance.now();
      showToast("MISSION LANCÉE");
      requestAnimationFrame(loop);
    }

    function endGame(){
      running = false;
      statusText.textContent = "SYSTÈME: TERMINÉ";
      sfxExplode();
      showToast(`FIN — SCORE ${world.score}`);
      openSummary();
    }

    function update(dt){
      world.gameTime += dt;

      const rect = stage.getBoundingClientRect();
      world.w = rect.width;
      world.h = rect.height;

      // power timers
      world.shieldLeft = Math.max(0, world.shieldLeft - dt);
      world.rapidLeft  = Math.max(0, world.rapidLeft - dt);
      world.doubleLeft = Math.max(0, world.doubleLeft - dt);

      // player movement
      const dir = (input.right?1:0) - (input.left?1:0);
      const targetVx = dir * PLAYER_SPEED;

      player.vx = lerp(player.vx, targetVx, clamp(dt * PLAYER_FRICTION, 0, 1));
      player.x += player.vx * dt;

      const pad = 18;
      player.x = clamp(player.x, pad, world.w - pad);

      // wave progression
      world.waveAcc += dt;
      if (world.waveAcc >= WAVE_TIME){
        world.waveAcc = 0;
        world.wave += 1;
        world.flash = Math.max(world.flash, 0.45);
        sfxBeep("square", 620, 0.08, 0.22);
        sfxBeep("square", 820, 0.08, 0.16);
        showToast(`VAGUE ${world.wave} — MENACE +`);
      }

      // spawn enemies
      const spawnRate = ENEMY_SPAWN_BASE + (world.wave-1) * 0.10;
      world.spawnAcc += dt * spawnRate;
      while (world.spawnAcc >= 1){
        world.spawnAcc -= 1;
        spawnEnemy();
      }

      // spawn powerups
      world.powerAcc += dt;
      // jitter pour éviter des spawns “métronomes”
      if (world.powerAcc >= POWER_SPAWN_EVERY + rnd(-1.0, 1.0)){
        world.powerAcc = 0;
        spawnPowerUp();
      }

      // firing (cadence modifiée par Rapid)
      const rapidMul = (world.rapidLeft > 0) ? 1.85 : 1.0;
      const effectiveFireRate = FIRE_RATE * rapidMul;

      if (input.firing){
        world.fireAcc += dt * effectiveFireRate;
        while (world.fireAcc >= 1){
          world.fireAcc -= 1;

          const doubleOn = (world.doubleLeft > 0);
          const spread = doubleOn ? 62 : 0;

          const shots = doubleOn ? [
            { x: player.x - spread*0.12, vx: -spread },
            { x: player.x + spread*0.12, vx:  spread },
          ] : [
            { x: player.x, vx: 0 }
          ];

          for (const s of shots){
            bullets.push({
              x: s.x,
              y: player.y - player.r - 6,
              vx: s.vx,
              vy: -BULLET_SPEED,
              r: 3,
              life: BULLET_LIFE,
              born: world.gameTime
            });
            world.shots += 1;
          }

          sfxShot();
          world.flash = Math.max(world.flash, 0.12);
        }
      } else {
        world.fireAcc = Math.min(world.fireAcc, 0.4);
      }

      // update bullets
      for (let i=bullets.length-1;i>=0;i--){
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if ((world.gameTime - b.born) > b.life || b.y < -40 || b.x < -40 || b.x > world.w+40){
          bullets.splice(i,1);
        }
      }

      // update enemies
      for (let i=enemies.length-1;i>=0;i--){
        const e = enemies[i];
        e.t += dt;
        e.x += Math.sin(e.t*1.2) * e.vx * dt;
        e.y += e.vy * dt;
        if (e.y > world.h + 80){
          enemies.splice(i,1);
        }
      }

      // update powerups
      for (let i=powerups.length-1;i>=0;i--){
        const p = powerups[i];
        p.y += p.vy * dt;
        p.spin += dt * 3.2;
        if (p.y > world.h + 80){
          powerups.splice(i,1);
        }
      }

      // collisions bullets/enemies
      for (let bi=bullets.length-1; bi>=0; bi--){
        const b = bullets[bi];
        let hit = false;
        for (let ei=enemies.length-1; ei>=0; ei--){
          const e = enemies[ei];
          if (collideCircle(b.x,b.y,b.r, e.x,e.y,e.r)){
            hit = true;
            world.hits += 1;
            e.hp -= 1;

            burst(e.x, e.y, 1.05);
            world.shake = Math.max(world.shake, 0.35);
            world.flash = Math.max(world.flash, 0.35);

            if (e.hp <= 0){
              enemies.splice(ei,1);
              world.kills += 1;
              world.score += 90 + Math.floor((world.wave-1)*12);
              sfxExplode();
              showToast(`DRONE DÉTRUIT +${90 + Math.floor((world.wave-1)*12)}`);
            } else {
              world.score += 18;
              sfxBeep("sine", 640, 0.05, 0.10);
            }
            break;
          }
        }
        if (hit){
          bullets.splice(bi,1);
        }
      }

      // collisions powerup/player
      for (let i=powerups.length-1;i>=0;i--){
        const p = powerups[i];
        if (collideCircle(player.x, player.y, player.r*1.25, p.x, p.y, p.r)){
          powerups.splice(i,1);
          burst(p.x, p.y, 0.9);
          applyPower(p.type);
        }
      }

      // collisions enemies/player
      for (let ei=enemies.length-1; ei>=0; ei--){
        const e = enemies[ei];
        if (collideCircle(player.x,player.y,player.r, e.x,e.y,e.r)){
          enemies.splice(ei,1);
          burst(e.x, e.y, 1.2);
          damagePlayer();
        }
      }

      // particles
      for (let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        const age = world.gameTime - p.born;
        if (age > p.life){ particles.splice(i,1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.985;
        p.vy *= 0.985;
      }

      // invuln / effects
      world.invuln = Math.max(0, world.invuln - dt);
      world.shake = Math.max(0, world.shake - dt*1.6);
      world.flash = Math.max(0, world.flash - dt*1.8);

      syncHUD();
    }

    function draw(ts){
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      ctx.clearRect(0,0,w,h);

      if (world.flash > 0){
        ctx.save();
        ctx.globalAlpha = 0.18 * world.flash;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0,0,w,h);
        ctx.restore();
      }

      const sh = world.shake;
      const sx = (Math.random()-0.5) * 10 * sh;
      const sy = (Math.random()-0.5) * 10 * sh;

      ctx.save();
      ctx.translate(sx, sy);

      // stars
      ctx.save();
      for (const s of stars){
        const px = (s.x * w + (world.gameTime*18*s.z)) % (w+20) - 10;
        const py = (s.y * h + (world.gameTime*36*s.z)) % (h+20) - 10;
        ctx.globalAlpha = 0.12 + 0.25*s.z;
        ctx.fillStyle = "rgba(240,245,240,0.9)";
        ctx.fillRect(px, py, s.s, s.s);
      }
      ctx.restore();

      // player render
      const inv = (world.invuln > 0);
      const blink = inv ? (Math.sin(world.gameTime*22) > 0 ? 0.25 : 1.0) : 1.0;

      // shield ring
      if (world.shieldLeft > 0){
        ctx.save();
        const pulse = 0.6 + 0.4*Math.sin(world.gameTime*8);
        ctx.globalAlpha = 0.35 + 0.25*pulse;
        ctx.strokeStyle = "rgba(107,142,35,0.92)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r*2.2 + 4*pulse, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }

      // player halo
      ctx.save();
      ctx.globalAlpha = 0.22 * blink;
      const g = ctx.createRadialGradient(player.x,player.y,0,player.x,player.y,player.r*3.2);
      g.addColorStop(0, "rgba(0,240,255,0.55)");
      g.addColorStop(1, "rgba(0,240,255,0.0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(player.x,player.y,player.r*3.2,0,Math.PI*2); ctx.fill();
      ctx.restore();

      // ship
      ctx.save();
      ctx.globalAlpha = 0.95 * blink;
      ctx.fillStyle = "rgba(0,240,255,0.92)";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - player.r);
      ctx.lineTo(player.x - player.r*0.85, player.y + player.r*0.95);
      ctx.lineTo(player.x + player.r*0.85, player.y + player.r*0.95);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(240,245,240,0.35)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // bullets + trail
      for (const b of bullets){
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = "rgba(0,240,255,0.92)";
        ctx.fillRect(b.x-4.6, b.y-16, 9.2, 22);
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = "rgba(240,245,240,0.92)";
        ctx.fillRect(b.x-1.2, b.y-10, 2.4, 14);
        ctx.restore();
      }

      // enemies
      for (const e of enemies){
        ctx.save();
        ctx.globalAlpha = 0.22;
        const gg = ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r*2.6);
        gg.addColorStop(0, "rgba(240,173,78,0.65)");
        gg.addColorStop(1, "rgba(240,173,78,0.0)");
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(e.x,e.y,e.r*2.6,0,Math.PI*2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = "rgba(240,173,78,0.92)";
        ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = "rgba(240,245,240,0.30)";
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.stroke();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = "rgba(240,245,240,0.35)";
        ctx.beginPath(); ctx.moveTo(e.x-e.r, e.y); ctx.lineTo(e.x+e.r, e.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(e.x, e.y-e.r); ctx.lineTo(e.x, e.y+e.r); ctx.stroke();
        ctx.restore();
      }

      // powerups
      for (const p of powerups){
        let col = "rgba(0,240,255,0.92)";
        let label = "P";
        if (p.type === "SHIELD"){ col = "rgba(107,142,35,0.92)"; label="S"; }
        if (p.type === "RAPID"){ col = "rgba(240,173,78,0.92)"; label="R"; }
        if (p.type === "DOUBLE"){ col = "rgba(0,240,255,0.92)"; label="D"; }
        if (p.type === "HEAL"){ col = "rgba(228,87,87,0.92)"; label="+"; }

        // glow
        ctx.save();
        ctx.globalAlpha = 0.22;
        const rg = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2.8);
        rg.addColorStop(0, col.replace("0.92","0.65"));
        rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2.8,0,Math.PI*2); ctx.fill();
        ctx.restore();

        // core
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = "rgba(240,245,240,0.30)";
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.stroke();

        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.font = "900 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, p.x, p.y + 0.5);
        ctx.restore();
      }

      // particles
      for (const p of particles){
        const age = world.gameTime - p.born;
        const k = 1 - age / p.life;
        ctx.save();
        ctx.globalAlpha = 0.55 * k;
        ctx.fillStyle = "rgba(240,245,240,0.92)";
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }

      // tiny status
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "rgba(240,245,240,0.85)";
      ctx.font = "700 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      const flags = [
        world.shieldLeft>0 ? `SHIELD ${world.shieldLeft.toFixed(1)}s` : null,
        world.rapidLeft>0 ? `RAPID ${world.rapidLeft.toFixed(1)}s` : null,
        world.doubleLeft>0 ? `DOUBLE ${world.doubleLeft.toFixed(1)}s` : null,
      ].filter(Boolean).join(" | ");
      if (flags) ctx.fillText(flags, 14, 22);
      ctx.restore();

      ctx.restore(); // shake
    }

    function loop(ts){
      if (!running) return;
      const dt = Math.min(0.033, (ts - lastTs) / 1000 || 0);
      lastTs = ts;

      update(dt);
      draw(ts);
      requestAnimationFrame(loop);
    }

    // ============================================================
    // SUMMARY + GRADE + TRANSITION
    // ============================================================
    function computeGrade(pack){
      const { score, acc, wave } = pack;
      const value = score + Math.floor(acc*8) + wave*35;
      const tiers = [
        { min: 0,    grade:"Recrue",   glyph:"•" },
        { min: 650,  grade:"Soldat",   glyph:"◆" },
        { min: 1400, grade:"Caporal",  glyph:"▲" },
        { min: 2300, grade:"Sergent",  glyph:"★" },
        { min: 3400, grade:"Commando", glyph:"✦" }
      ];
      let pick = tiers[0];
      for (const t of tiers){ if (value >= t.min) pick = t; }
      return pick;
    }

    function openSummary(){
      const acc = world.shots > 0 ? Math.round((world.hits / world.shots)*100) : 0;
      const pack = { score: world.score, acc, kills: world.kills, wave: world.wave, time: Math.floor(world.gameTime) };
      const grade = computeGrade(pack);

      finalScore.textContent = String(pack.score);
      finalAcc.textContent = `${pack.acc}%`;
      finalKills.textContent = String(pack.kills);
      finalWave.textContent = String(pack.wave);
      finalGrade.textContent = grade.grade.toUpperCase();
      medalGlyph.textContent = grade.glyph;
      finalTime.textContent = mmss(pack.time);

      rewardDesc.innerHTML = `Analyse: mission validée. Accès au <b>briefing</b> de victoire.`;

      localStorage.setItem("lastSpaceWarScore", String(pack.score));
      localStorage.setItem("lastSpaceWarAcc", String(pack.acc));
      localStorage.setItem("lastSpaceWarKills", String(pack.kills));
      localStorage.setItem("lastSpaceWarWave", String(pack.wave));
      localStorage.setItem("lastSpaceWarTime", String(pack.time));
      localStorage.setItem("lastSpaceWarGrade", grade.grade);

      summaryOverlay.classList.add("is-on");
      summaryOverlay.setAttribute("aria-hidden","false");

      flash.classList.add("is-on");
      window.setTimeout(()=>flash.classList.remove("is-on"), 180);
    }

    function goNext(){
      sfxBeep("triangle", 720, 0.08, 0.14);
      flash.classList.add("is-on");
      window.setTimeout(()=>flash.classList.remove("is-on"), 180);

      window.setTimeout(()=>document.body.classList.add("is-transitioning"), 220);
      window.setTimeout(()=>{ window.location.href = NEXT_URL; }, 680);
    }

    retryBtn.addEventListener("click", ()=>{
      sfxBeep("sine", 520, 0.06, 0.12);
      summaryOverlay.classList.remove("is-on");
      summaryOverlay.setAttribute("aria-hidden","true");
      resetGame();
      // retour tuto rapide (style)
      tutorialOverlay.classList.remove("is-off");
      statusText.textContent = "SYSTÈME: EN ATTENTE";
      showToast("REBOOT — BRIEFING");
    });
    nextBtn.addEventListener("click", goNext);

    // Bloque double-tap / double-click zoom + pinch gestures (iOS Safari)
    document.addEventListener("dblclick", (e) => e.preventDefault(), { passive: false });
    document.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false });
    document.addEventListener("gesturechange", (e) => e.preventDefault(), { passive: false });
    document.addEventListener("gestureend", (e) => e.preventDefault(), { passive: false });


    // ============================================================
    // BOOT / TUTO
    // ============================================================
    function bootFlash(){
      flash.classList.add("is-on");
      window.setTimeout(()=>flash.classList.remove("is-on"), 200);
    }

    okBtn.addEventListener("click", ()=>{
      resumeAudio();
      sfxBeep("square", 520, 0.07, 0.14);
      bootFlash();
      window.setTimeout(startAfterTutorial, 220);
    });

    // “ghost” button: utile pour iOS (débloquer audio)
    muteGhost.addEventListener("click", ()=>{
      resumeAudio();
      sfxBeep("sine", 520, 0.07, 0.14);
      showToast("AUDIO ARMÉ");
    });

    // Pause si onglet caché
    document.addEventListener("visibilitychange", ()=>{
      if (document.hidden){
        if (running){
          running = false;
          statusText.textContent = "SYSTÈME: PAUSE";
        }
      } else {
        // reprends uniquement si jeu déjà lancé et pas summary
        if (!tutorialOverlay.classList.contains("is-off")) return;
        if (summaryOverlay.classList.contains("is-on")) return;
        if (!running){
          running = true;
          lastTs = performance.now();
          statusText.textContent = "SYSTÈME: ACTIF";
          requestAnimationFrame(loop);
        }
      }
    });



    // Position fixe player y après resize
    function syncPlayerY(){
      const rect = stage.getBoundingClientRect();
      world.w = rect.width; world.h = rect.height;
      player.y = world.h * 0.82;
      player.x = clamp(player.x, 18, world.w-18);
    }
    window.addEventListener("resize", syncPlayerY, { passive:true });

    // Boot
    resetGame();
    syncPlayerY();
    showToast("BRIEFING EN COURS");
    bootFlash();


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
