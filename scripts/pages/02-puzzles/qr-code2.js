    // ============================================================
    // CONFIG
    // ============================================================
    const NEXT_URL = "pages/04-progression/artefact2.html";

    // Physics
    const GRAVITY = 2450;
    const MOVE_SPEED = 540;
    const AIR_CONTROL = 0.86;
    const JUMP_V = 900;
    const COYOTE = 0.10;
    const JUMP_BUFFER = 0.12;

    // Camera comfort (évite “coller” aux boutons)
    const BOTTOM_COMFORT_PX = 295;   // réserve visuelle en bas
    const CAMERA_LIFT_PX = -100;      // remonte le perso dans le cadre
	// Zoom caméra ( < 1 = dézoom, > 1 = zoom)
	const CAMERA_ZOOM = 0.72; // essaie 0.78 à 0.88 selon ton ressenti


    // Tiles
    const TILE = 44;
    const DPR = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));

    // Enemies (Mario-like)
    const ENEMY_SPEED = 95;
    const ENEMY_BOUNCE_Y = 520;      // petit rebond quand tu écrases
    const STOMP_WINDOW = 120;        // vitesse verticale minimum pour stomper

    // ============================================================
    // DOM
    // ============================================================
    const stage = document.getElementById("stage");
    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d", { alpha:true });

    const statusText = document.getElementById("statusText");
    const toast = document.getElementById("toast");
    const timeVal = document.getElementById("timeVal");

    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");
    const jumpBtn = document.getElementById("jumpBtn");

    const tutorialOverlay = document.getElementById("tutorialOverlay");
    const okBtn = document.getElementById("okBtn");
    const muteGhost = document.getElementById("muteGhost");

    const victoryOverlay = document.getElementById("victoryOverlay");
    const flash = document.getElementById("flash");
    const bar = document.getElementById("bar");

    // ============================================================
    // HARD ANTI-ZOOM (iOS)
    // ============================================================
    document.addEventListener("gesturestart", (e)=>e.preventDefault(), { passive:false });
    document.addEventListener("gesturechange",(e)=>e.preventDefault(), { passive:false });
    document.addEventListener("gestureend",   (e)=>e.preventDefault(), { passive:false });
    document.addEventListener("dblclick",     (e)=>e.preventDefault(), { passive:false });

    // Empêche scroll/zoom accidental
    document.addEventListener("touchmove", (e)=>{ e.preventDefault(); }, { passive:false });

    // ============================================================
    // UTIL
    // ============================================================
    const clamp = (v,a,b)=>Math.max(a, Math.min(b, v));
    const lerp  = (a,b,t)=>a + (b-a)*t;
    const rnd   = (a,b)=>Math.random()*(b-a)+a;

    function showToast(text){
      toast.textContent = text;
      toast.classList.add("is-on");
      window.setTimeout(()=>toast.classList.remove("is-on"), 850);
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
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    window.addEventListener("resize", resize, { passive:true });
    resize();

    // ============================================================
    // AUDIO (WebAudio)
    // ============================================================
    let audioCtx=null, master=null, muted=false;

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
    function sfx(type, freq, dur, gain){
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
    const sfxJump = ()=>{ sfx("square", 740, 0.07, 0.16); setTimeout(()=>sfx("square", 980, 0.05, 0.12), 55); };
    const sfxLand = ()=>{ sfx("triangle", 180, 0.05, 0.14); };
    const sfxHit  = ()=>{ sfx("sawtooth", 140, 0.10, 0.20); setTimeout(()=>sfx("triangle", 90, 0.10, 0.12), 60); };
    const sfxStomp= ()=>{ sfx("square", 520, 0.06, 0.18); setTimeout(()=>sfx("square", 320, 0.06, 0.14), 55); };
    const sfxWin  = ()=>{ sfx("square", 660, 0.08, 0.18); setTimeout(()=>sfx("square", 880, 0.08, 0.16), 90); setTimeout(()=>sfx("square", 1180,0.10, 0.14), 180); };

    // ============================================================
    // INPUT
    // ============================================================
    const input = { left:false, right:false, jump:false, jumpPressed:false };

    function bindHold(btn, key){
      btn.addEventListener("pointerdown",(e)=>{ resumeAudio(); input[key]=true; if(key==="jump") input.jumpPressed=true; e.preventDefault(); }, { passive:false });
      btn.addEventListener("pointerup",(e)=>{ input[key]=false; e.preventDefault(); }, { passive:false });
      btn.addEventListener("pointercancel",(e)=>{ input[key]=false; e.preventDefault(); }, { passive:false });
      btn.addEventListener("pointermove",(e)=>{ e.preventDefault(); }, { passive:false });
    }
    bindHold(leftBtn,"left");
    bindHold(rightBtn,"right");
    bindHold(jumpBtn,"jump");

    window.addEventListener("keydown",(e)=>{
      const k = e.key.toLowerCase();
      if (k==="arrowleft"||k==="a") input.left=true;
      if (k==="arrowright"||k==="d") input.right=true;
      if (k===" "||k==="enter"||k==="arrowup"||k==="w"){ input.jump=true; input.jumpPressed=true; }
    });
    window.addEventListener("keyup",(e)=>{
      const k = e.key.toLowerCase();
      if (k==="arrowleft"||k==="a") input.left=false;
      if (k==="arrowright"||k==="d") input.right=false;
      if (k===" "||k==="enter"||k==="arrowup"||k==="w") input.jump=false;
    });

    // ============================================================
    // WORLD — LONGER LEVEL (0 empty, 1 solid, 2 danger)
    // ============================================================
    const level = [
      "0000000000000000000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000111000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000001111000000000000",
      "0000000000000011110000000000000000000000111100000000000000000000",
      "0000000000000000000000000000001110000000000000000000000000111100",
      "0000000000111100000000000000000000000000000000000000000000000000",
      "0000000000000000000000111100000000000000000011110000000000000000",
      "0000000000000000000000000000000022222200000000000000000000000000",
      "0000001111000000000000000000000000000000000000000011111000000000",
      "0000000000000000111100000000000000111100000000000000000000000000",
      "0000000000000000000000000011110000000000000000111100000000000000",
      "0000000000001111000000000000000000000000000000000000001111000000",
      "0000000000000000000000000000000000111100000000000000000000000000",
      "0000000000111100000000000000111100000000000011110000000000000000",
      "1111111111111111111111111111111111111111111111111111111111111111"
    ];
    const H = level.length;
    const W = level[0].length;

    // Goal near the end
    const goal = { x: (W-4)*TILE + TILE*0.5, y: (H-3)*TILE - TILE*0.55, r: 18 };

    function worldPxW(){ return W*TILE; }
    function worldPxH(){ return H*TILE; }

    // ============================================================
    // ENTITIES
    // ============================================================
    const player = {
      x: TILE*2, y: TILE*9,   // spawn higher
      vx: 0, vy: 0,
      w: 24, h: 30,
      onGround: false,
      coyote: 0,
      jumpBuffer: 0,
      face: 1,
      hurt: 0
    };

    // Enemies (Mario-like goombas)
    const enemies = [];
    function spawnEnemy(tx, ty){
      enemies.push({
        x: tx*TILE + 10,
        y: ty*TILE + (TILE - 26),
        w: 26,
        h: 22,
        vx: (Math.random() < 0.5 ? -1 : 1) * ENEMY_SPEED,
        alive: true,
        squish: 0
      });
    }

    // Place enemies on some platforms
    spawnEnemy(14, 15);
    spawnEnemy(22, 15);
    spawnEnemy(30, 15);
    spawnEnemy(40, 15);
    spawnEnemy(48, 15);
    spawnEnemy(56, 15);
    spawnEnemy(34, 10);
    spawnEnemy(10, 10);

    const fx = { t:0, shake:0, flash:0 };
    const particles = [];
    const stars = [];
    function resetStars(){
      stars.length = 0;
      for(let i=0;i<160;i++){
        stars.push({ x: Math.random(), y: Math.random(), z: rnd(0.2,1.0), s: rnd(0.3,1.2) });
      }
    }
    resetStars();

    function burst(x,y, n=18, sp=320){
      for(let i=0;i<n;i++){
        const a = rnd(0, Math.PI*2);
        const v = rnd(0.35,1.0)*sp;
        particles.push({
          x, y,
          vx: Math.cos(a)*v,
          vy: Math.sin(a)*v,
          life: rnd(0.25,0.65),
          born: fx.t,
          size: rnd(1.6,3.2)
        });
      }
    }

    // Camera
    const cam = { x:0, y:0 };

    // ============================================================
    // COLLISION HELPERS
    // ============================================================
    function tileAt(tx, ty){
      if (tx<0 || ty<0 || tx>=W || ty>=H) return "1";
      return level[ty][tx];
    }
    function isSolid(t){ return t==="1"; }
    function isDanger(t){ return t==="2"; }

    function rectVsTiles(x,y,w,h, predicate){
      const x0 = Math.floor(x / TILE);
      const y0 = Math.floor(y / TILE);
      const x1 = Math.floor((x+w) / TILE);
      const y1 = Math.floor((y+h) / TILE);
      for(let ty=y0; ty<=y1; ty++){
        for(let tx=x0; tx<=x1; tx++){
          const t = tileAt(tx,ty);
          if (predicate(t)) return {tx,ty,t};
        }
      }
      return null;
    }

    function aabb(ax,ay,aw,ah, bx,by,bw,bh){
      return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
    }

    // ============================================================
    // GAME FLOW
    // ============================================================
    let running = false;
    let lastTs = 0;
    let elapsed = 0;
    let won = false;

    function startGame(){
      tutorialOverlay.classList.add("is-off");
      statusText.textContent = "SYSTÈME: ACTIF";
      running = true;
      lastTs = performance.now();
      showToast("MISSION LANCÉE");
      requestAnimationFrame(loop);
    }

    function resetGame(){
      player.x = TILE*2;
      player.y = TILE*9;
      player.vx = 0; player.vy = 0;
      player.onGround = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.face = 1;
      player.hurt = 0;

      // revive enemies
      for (const e of enemies){
        e.alive = true;
        e.squish = 0;
      }

      particles.length = 0;
      fx.shake = 0;
      fx.flash = 0;

      elapsed = 0;
      won = false;
      statusText.textContent = "SYSTÈME: PRÊT";
      syncHUD();
      draw();
    }

    function syncHUD(){
      timeVal.textContent = mmss(elapsed);
    }

    function damage(){
      if (player.hurt > 0) return;
      player.hurt = 0.85;

      fx.shake = Math.max(fx.shake, 1.0);
      fx.flash = Math.max(fx.flash, 0.75);

      sfxHit();
      showToast("IMPACT — RECOMMENCE !");
      burst(player.x+player.w/2, player.y+player.h/2, 24, 420);

      // respawn
      player.vx = 0; player.vy = 0;
      player.x = TILE*2;
      player.y = TILE*9;
    }

    function win(){
      if (won) return;
      won = true;
      running = false;

      sfxWin();
      fx.flash = 1.0;
      fx.shake = 1.0;
      burst(goal.x, goal.y, 90, 720);

      flash.classList.add("is-on");
      setTimeout(()=>flash.classList.remove("is-on"), 180);

      victoryOverlay.classList.add("is-on");
      statusText.textContent = "SYSTÈME: VALIDÉ";

      let t0 = performance.now();
      const dur = 1250;
      const tick = (now)=>{
        const t = clamp((now - t0)/dur, 0, 1);
        const p = 100 * (1 - Math.pow(1 - t, 2.6));
        bar.style.width = p.toFixed(1) + "%";
        if (t < 1){
          requestAnimationFrame(tick);
        } else {
          setTimeout(()=>{ window.location.href = NEXT_URL; }, 420);
        }
      };
      requestAnimationFrame(tick);
    }

    // ============================================================
    // UPDATE
    // ============================================================
    function update(dt){
      fx.t += dt;
      elapsed += dt;

      player.hurt = Math.max(0, player.hurt - dt);
      fx.shake = Math.max(0, fx.shake - dt*1.9);
      fx.flash = Math.max(0, fx.flash - dt*2.2);

      // input dir
      const dir = (input.right?1:0) - (input.left?1:0);
      if (dir !== 0) player.face = dir;

      const accel = player.onGround ? 22 : (22 * AIR_CONTROL);
      const targetVx = dir * MOVE_SPEED;
      player.vx = lerp(player.vx, targetVx, clamp(dt*accel, 0, 1));

      // jump buffer + coyote
      if (input.jumpPressed){
        player.jumpBuffer = JUMP_BUFFER;
        input.jumpPressed = false;
      } else {
        player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
      }
      player.coyote = player.onGround ? COYOTE : Math.max(0, player.coyote - dt);

      if (player.jumpBuffer > 0 && player.coyote > 0){
        player.vy = -JUMP_V;
        player.onGround = false;
        player.jumpBuffer = 0;
        player.coyote = 0;
        sfxJump();
        burst(player.x + player.w/2, player.y + player.h, 10, 260);
      }

      // gravity
      player.vy += GRAVITY * dt;
      player.vy = Math.min(player.vy, 1800);

      // move X
      player.x += player.vx * dt;
      {
        const hit = rectVsTiles(player.x, player.y, player.w, player.h, isSolid);
        if (hit){
          if (player.vx > 0) player.x = hit.tx*TILE - player.w - 0.01;
          else if (player.vx < 0) player.x = (hit.tx+1)*TILE + 0.01;
          player.vx = 0;
          fx.shake = Math.max(fx.shake, 0.25);
        }
      }

      // move Y
      player.y += player.vy * dt;
      const wasGround = player.onGround;
      player.onGround = false;
      {
        const hit = rectVsTiles(player.x, player.y, player.w, player.h, isSolid);
        if (hit){
          if (player.vy > 0){
            player.y = hit.ty*TILE - player.h - 0.01;
            player.vy = 0;
            player.onGround = true;
            if (!wasGround) sfxLand();
          } else if (player.vy < 0){
            player.y = (hit.ty+1)*TILE + 0.01;
            player.vy = 0;
            fx.shake = Math.max(fx.shake, 0.22);
          }
        }
      }

      // danger tiles
      if (rectVsTiles(player.x, player.y, player.w, player.h, isDanger)) damage();

      // enemies movement + collisions
      for (const e of enemies){
        if (!e.alive){
          e.squish = Math.max(0, e.squish - dt*2.0);
          continue;
        }

        // move
        e.x += e.vx * dt;

        // wall/edge detect: turn around if hitting solid OR no ground ahead
        const feetY = e.y + e.h + 1;
        const frontX = (e.vx > 0) ? (e.x + e.w + 2) : (e.x - 2);
        const txFront = Math.floor(frontX / TILE);
        const tyFeet  = Math.floor(feetY / TILE);

        const wall = isSolid(tileAt(txFront, Math.floor((e.y + e.h*0.6)/TILE)));
        const noGroundAhead = !isSolid(tileAt(txFront, tyFeet));

        if (wall || noGroundAhead){
          e.vx *= -1;
        }

        // keep on ground (simple): if tile below empty, fall slightly then clamp by collision
        e.y += 700 * dt;
        const ehit = rectVsTiles(e.x, e.y, e.w, e.h, isSolid);
        if (ehit){
          e.y = ehit.ty*TILE - e.h - 0.01;
        }

        // player collision
        if (aabb(player.x,player.y,player.w,player.h, e.x,e.y,e.w,e.h)){
          const playerBottom = player.y + player.h;
          const enemyTop = e.y;
          const falling = player.vy > STOMP_WINDOW;

          // stomp if player coming from above
          if (falling && (playerBottom - enemyTop) < 14){
            e.alive = false;
            e.squish = 0.35;
            fx.shake = Math.max(fx.shake, 0.55);
            fx.flash = Math.max(fx.flash, 0.25);
            sfxStomp();
            showToast("STOMP — CIBLE NEUTRALISÉE");
            burst(e.x + e.w/2, e.y + e.h/2, 22, 460);

            player.vy = -ENEMY_BOUNCE_Y; // bounce
          } else {
            damage();
          }
        }

        // enemy danger overlap (optional): if they touch danger, reverse
        if (rectVsTiles(e.x, e.y, e.w, e.h, isDanger)){
          e.vx *= -1;
        }
      }

      // particles
      for(let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        const age = fx.t - p.born;
        if (age > p.life){ particles.splice(i,1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.985;
        p.vy *= 0.985;
      }

      // goal
      const px = player.x + player.w/2;
      const py = player.y + player.h/2;
      const dx = px - goal.x, dy = py - goal.y;
      if ((dx*dx + dy*dy) <= (goal.r + 14)*(goal.r + 14)){
        win();
        return;
      }

      // camera follow (smooth) + bottom comfort
// Taille "visible" en coordonnées monde (impactée par le zoom)
	  const viewW = stage.clientWidth / CAMERA_ZOOM;
	  const viewH = stage.clientHeight / CAMERA_ZOOM;


      const targetCamX = clamp(px - viewW*0.05, 0, worldPxW() - viewW);

      // On remonte la scène: comfort bas + lift constant
      const desiredY = (py - viewH*0.56) - CAMERA_LIFT_PX;
      const maxCamY = Math.max(0, worldPxH() - (viewH - BOTTOM_COMFORT_PX));
      const targetCamY = clamp(desiredY, 0, maxCamY);

      cam.x = lerp(cam.x, targetCamX, clamp(dt*12, 0, 1));
      cam.y = lerp(cam.y, targetCamY, clamp(dt*12, 0, 1));

      syncHUD();
    }

    // ============================================================
    // DRAW
    // ============================================================
    function draw(){
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      ctx.clearRect(0,0,w,h);

      if (fx.flash > 0){
        ctx.save();
        ctx.globalAlpha = 0.18 * fx.flash;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0,0,w,h);
        ctx.restore();
      }

      const sh = fx.shake;
      const sx = (Math.random()-0.5) * 10 * sh;
      const sy = (Math.random()-0.5) * 10 * sh;

      ctx.save();

		// Zoom centré sur l’écran
	  ctx.translate(w * 0.5, h * 0.5);
	  ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);
	  ctx.translate(-w * 0.5, -h * 0.5);

		// Puis caméra (monde -> écran)
      ctx.translate(-cam.x + sx, -cam.y + sy);


      // culling tiles
      const x0 = Math.floor(cam.x / TILE) - 2;
      const y0 = Math.floor(cam.y / TILE) - 2;
      const x1 = Math.floor((cam.x + w) / TILE) + 2;
      const y1 = Math.floor((cam.y + h) / TILE) + 2;

      for(let ty=y0; ty<=y1; ty++){
        for(let tx=x0; tx<=x1; tx++){
          const t = tileAt(tx,ty);
          const x = tx*TILE;
          const y = ty*TILE;

          if (t==="1"){
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.28)";
            ctx.fillRect(x, y, TILE, TILE);

            ctx.strokeStyle = "rgba(255,255,255,0.10)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x+0.5, y+0.5, TILE-1, TILE-1);

            ctx.fillStyle = "rgba(107,142,35,0.20)";
            ctx.fillRect(x+2, y+2, TILE-4, 6);

            ctx.fillStyle = "rgba(240,245,240,0.18)";
            ctx.fillRect(x+6, y+10, 2, 2);
            ctx.fillRect(x+TILE-8, y+10, 2, 2);
            ctx.restore();
          } else if (t==="2"){
            const pulse = 0.45 + 0.35*Math.sin(fx.t*6 + tx*0.7);
            ctx.save();
            ctx.fillStyle = `rgba(228,87,87,${0.22 + 0.18*pulse})`;
            ctx.fillRect(x, y, TILE, TILE);
            ctx.strokeStyle = `rgba(228,87,87,${0.32 + 0.25*pulse})`;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(x+0.6, y+0.6, TILE-1.2, TILE-1.2);
            ctx.globalAlpha = 0.18 + 0.12*pulse;
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.fillRect(x+6, y+TILE*0.35, TILE-12, 2);
            ctx.restore();
          }
        }
      }

      // goal artefact
      {
        const bob = Math.sin(fx.t*3.2) * 6;
        const gx = goal.x, gy = goal.y + bob;

        ctx.save();
        const g = ctx.createRadialGradient(gx, gy, 6, gx, gy, 56);
        g.addColorStop(0, "rgba(240,173,78,0.38)");
        g.addColorStop(0.55, "rgba(0,240,255,0.16)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(gx, gy, 56, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = "rgba(0,0,0,0.26)";
        ctx.beginPath(); ctx.roundRect(gx-18, gy-18, 36, 36, 10); ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.14)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "rgba(240,173,78,0.92)";
        ctx.font = "900 18px Orbitron, sans-serif";
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("◈", gx, gy+1);

        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "rgba(0,240,255,0.9)";
        ctx.fillRect(gx-18, gy-4 + (Math.sin(fx.t*5)*3), 36, 2);
        ctx.restore();
      }

      // enemies
      for (const e of enemies){
        const cx = e.x, cy = e.y;
        ctx.save();

        if (!e.alive){
          // squished
          const s = 1 - (e.squish*0.9);
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = "rgba(0,0,0,0.28)";
          ctx.beginPath(); ctx.roundRect(cx, cy + e.h*(1-s), e.w, e.h*s, 8); ctx.fill();
          ctx.restore();
          continue;
        }

        // shadow
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.beginPath();
        ctx.ellipse(cx+e.w/2, cy+e.h+10, 18, 6, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // body (goomba-like)
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath(); ctx.roundRect(cx, cy, e.w, e.h, 8); ctx.fill();

        const pulse = 0.55 + 0.45*Math.sin(fx.t*7 + cx*0.02);
        ctx.fillStyle = `rgba(240,173,78,${0.24 + 0.20*pulse})`;
        ctx.beginPath(); ctx.roundRect(cx+2, cy+2, e.w-4, e.h-4, 7); ctx.fill();

        // eyes
        ctx.fillStyle = "rgba(240,245,240,0.90)";
        ctx.fillRect(cx+7, cy+7, 5, 5);
        ctx.fillRect(cx+e.w-12, cy+7, 5, 5);

        // angry brow
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "rgba(228,87,87,0.95)";
        ctx.fillRect(cx+6, cy+5, e.w-12, 2);
        ctx.globalAlpha = 1;

        // outline
        ctx.strokeStyle = "rgba(255,255,255,0.14)";
        ctx.lineWidth = 1.1;
        ctx.strokeRect(cx+0.6, cy+0.6, e.w-1.2, e.h-1.2);

        ctx.restore();
      }

      // player
      {
        const px = player.x;
        const py = player.y;

        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.beginPath();
        const shW = 26 + Math.min(18, Math.abs(player.vx)*0.02);
        ctx.ellipse(px+player.w/2, py+player.h+10, shW, 7, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;

        const hurtPulse = (player.hurt>0) ? (0.55 + 0.45*Math.sin(fx.t*26)) : 0;
        const bodyFill = (player.hurt>0) ? `rgba(228,87,87,${0.40 + 0.35*hurtPulse})` : "rgba(0,240,255,0.20)";

        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath();
        ctx.roundRect(px, py, player.w, player.h, 8);
        ctx.fill();

        ctx.fillStyle = bodyFill;
        ctx.beginPath();
        ctx.roundRect(px+2, py+2, player.w-4, player.h-4, 7);
        ctx.fill();

        ctx.fillStyle = "rgba(240,245,240,0.78)";
        ctx.fillRect(px+4, py+10, player.w-8, 2);

        ctx.strokeStyle = "rgba(255,255,255,0.14)";
        ctx.lineWidth = 1.1;
        ctx.strokeRect(px+0.6, py+0.6, player.w-1.2, player.h-1.2);

        ctx.fillStyle = "rgba(240,173,78,0.9)";
        if (player.face > 0) ctx.fillRect(px+player.w-4, py+8, 2, player.h-16);
        else ctx.fillRect(px+2, py+8, 2, player.h-16);

        ctx.restore();
      }

      // particles
      for(const p of particles){
        const age = fx.t - p.born;
        const t = clamp(age / p.life, 0, 1);
        const a = (1 - t);
        ctx.save();
        ctx.globalAlpha = 0.75 * a;
        ctx.fillStyle = "rgba(240,245,240,0.92)";
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }

      ctx.restore();

      // vignette + scanline foreground
      ctx.save();
      const vg = ctx.createRadialGradient(w*0.5, h*0.45, Math.min(w,h)*0.15, w*0.5, h*0.5, Math.max(w,h)*0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = vg;
      ctx.fillRect(0,0,w,h);

      ctx.globalAlpha = 0.06;
      ctx.fillStyle = "rgba(0,240,255,0.9)";
      const scanY = (Math.sin(fx.t*1.6)*0.5+0.5) * h;
      ctx.fillRect(0, scanY, w, 2);
      ctx.restore();
    }

    // roundRect polyfill
    if (!CanvasRenderingContext2D.prototype.roundRect){
      CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
        r = Math.min(r, w/2, h/2);
        this.beginPath();
        this.moveTo(x+r,y);
        this.arcTo(x+w,y, x+w,y+h, r);
        this.arcTo(x+w,y+h, x,y+h, r);
        this.arcTo(x,y+h, x,y, r);
        this.arcTo(x,y, x+w,y, r);
        this.closePath();
        return this;
      };
    }

    // ============================================================
    // LOOP
    // ============================================================
    function loop(ts){
      if (!running) return;
      const dt = Math.min(0.033, (ts - lastTs)/1000);
      lastTs = ts;
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }

    // ============================================================
    // UI
    // ============================================================
    okBtn.addEventListener("click", ()=> startGame());

    muteGhost.addEventListener("click", ()=>{
      resumeAudio();
      muted = !muted;
      muteGhost.textContent = muted ? "Son: OFF" : "Son: ON";
      showToast(muted ? "SON COUPÉ" : "SON ACTIVÉ");
    });

    window.addEventListener("pointerdown", ()=>resumeAudio(), { once:true });

    // Boot
    resetGame();
    statusText.textContent = "SYSTÈME: EN ATTENTE";
    showToast("BRIEFING…");


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
