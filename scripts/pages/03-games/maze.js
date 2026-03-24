    // ============================================================
    // ANTI-ZOOM iOS/SAFARI (double tap / pinch / gestures)
    // ============================================================
    // 1) stop dblclick zoom
    document.addEventListener("dblclick", (e) => {
      e.preventDefault();
    }, { passive:false });

    // 2) stop iOS gesture zoom (pinch)
    ["gesturestart","gesturechange","gestureend"].forEach(evt => {
      document.addEventListener(evt, (e) => e.preventDefault(), { passive:false });
    });

    // 3) stop double-tap zoom on iOS (touchend trick)
    let lastTouchEnd = 0;
    document.addEventListener("touchend", (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    }, { passive:false });

    // 4) block scroll bounce
    document.addEventListener("touchmove", (e) => e.preventDefault(), { passive:false });

    // ============================================================
    // CONFIG
    // ============================================================
    const NEXT_URL = "pages/04-progression/hopital1.html"; // change si besoin

    // Labyrinthe FIXE (17x17) — solvable (clés + sortie atteignables)
    // 1 = mur, 0 = chemin, 2 = sortie
    const GRID = [
      "11111111111111111",
      "10000000000000001",
      "10111101111101101",
      "10100001000101001",
      "10101111010101101",
      "10101000010100001",
      "10101011110111101",
      "10001010000000101",
      "11101010111110101",
      "10000010100000101",
      "10111110101111101",
      "10100000101000001",
      "10101111101011101",
      "10100000001000001",
      "10111111101111101",
      "10000000000000021",
      "11111111111111111",
    ].map(r => r.split("").map(n => Number(n)));

    const START = { x: 1, y: 1 };
    const EXIT  = { x: 15, y: 15 }; // cellule "2"

    // 3 clés FIXES (toutes atteignables)
    const KEY_POS = [
      { x: 9,  y: 1  },
      { x: 1,  y: 9  },
      { x: 13, y: 13 }
    ];

    const DPR = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));

    // ============================================================
    // DOM
    // ============================================================
    const stage = document.getElementById("stage");
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d", { alpha:true });

    const toast = document.getElementById("toast");
    const statusText = document.getElementById("statusText");

    const keysVal = document.getElementById("keysVal");
    const timeVal = document.getElementById("timeVal");
    const exitState = document.getElementById("exitState");

    const upBtn = document.getElementById("up");
    const leftBtn = document.getElementById("left");
    const downBtn = document.getElementById("down");
    const rightBtn = document.getElementById("right");

    const flash = document.getElementById("flash");

    const endOverlay = document.getElementById("endOverlay");
    const endTime = document.getElementById("endTime");
    const endKeys = document.getElementById("endKeys");
    const retryBtn = document.getElementById("retryBtn");
    const nextBtn = document.getElementById("nextBtn");

    // ============================================================
    // STATE
    // ============================================================
    const maze = GRID;
    const size = maze.length;

    let player = { x: START.x, y: START.y };
    let keys = KEY_POS.map(k => ({...k}));
    let keysCollected = 0;
    let exitUnlocked = false;

    let seconds = 0;
    let timer = null;

    let locked = false;

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
      draw();
    }
    window.addEventListener("resize", resize, { passive:true });
    resize();

    // ============================================================
    // AUDIO
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
    function beep(type="square", freq=520, dur=0.06, gain=0.12){
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
    function sfxStep(){ beep("triangle", 420, 0.05, 0.10); }
    function sfxBump(){ beep("sawtooth", 160, 0.08, 0.12); beep("triangle", 110, 0.12, 0.10); }
    function sfxKey(){ beep("square", 740, 0.07, 0.16); setTimeout(()=>beep("square", 980, 0.07, 0.14), 90); }
    function sfxUnlock(){ beep("square", 520, 0.08, 0.18); setTimeout(()=>beep("square", 820, 0.08, 0.14), 100); }
    function sfxWin(){
      beep("sine", 523.25, 0.09, 0.16);
      setTimeout(()=>beep("sine", 659.25, 0.09, 0.14), 70);
      setTimeout(()=>beep("sine", 783.99, 0.10, 0.14), 140);
      setTimeout(()=>beep("sine", 1046.5, 0.12, 0.16), 210);
    }

    window.addEventListener("pointerdown", () => resumeAudio(), { once:true });

    // ============================================================
    // UI HELPERS
    // ============================================================
    function showToast(text){
      toast.textContent = text;
      toast.classList.add("is-on");
      window.setTimeout(() => toast.classList.remove("is-on"), 850);
    }
    function flashFX(){
      flash.classList.add("is-on");
      setTimeout(()=>flash.classList.remove("is-on"), 180);
    }
    function syncHUD(){
      keysVal.textContent = String(keysCollected).padStart(2,"0");
      timeVal.textContent = String(seconds).padStart(2,"0");
      exitState.textContent = exitUnlocked ? "OUVERTE" : "VERROUILLÉE";
      exitState.style.color = exitUnlocked ? "rgba(0,240,255,0.92)" : "rgba(240,173,78,0.92)";
    }

    // ============================================================
    // DRAW
    // ============================================================
    function roundRect(x,y,w,h,r){
      const rr = Math.min(r, w/2, h/2);
      ctx.beginPath();
      ctx.moveTo(x+rr, y);
      ctx.arcTo(x+w, y, x+w, y+h, rr);
      ctx.arcTo(x+w, y+h, x, y+h, rr);
      ctx.arcTo(x, y+h, x, y, rr);
      ctx.arcTo(x, y, x+w, y, rr);
      ctx.closePath();
    }

    function draw(){
      const w = stage.clientWidth;
      const h = stage.clientHeight;

      ctx.clearRect(0,0,w,h);

      const pad = 12;
      const usable = Math.min(w, h) - pad*2;
      const cell = usable / size;

      const ox = Math.floor((w - cell*size)/2);
      const oy = Math.floor((h - cell*size)/2);

      // plate
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      roundRect(ox-8, oy-8, cell*size+16, cell*size+16, 14);
      ctx.fill();
      ctx.restore();

      // maze
      for (let y=0; y<size; y++){
        for (let x=0; x<size; x++){
          const v = maze[y][x];
          const px = ox + x*cell;
          const py = oy + y*cell;

          if (v === 1){
            ctx.fillStyle = "rgba(255,255,255,0.10)";
            ctx.fillRect(px+1, py+1, cell-2, cell-2);
            ctx.strokeStyle = "rgba(0,240,255,0.07)";
            ctx.strokeRect(px+1, py+1, cell-2, cell-2);
          } else {
            ctx.fillStyle = "rgba(0,0,0,0.10)";
            ctx.fillRect(px, py, cell, cell);
          }

          if (v === 2){
            ctx.save();
            ctx.fillStyle = exitUnlocked ? "rgba(0,240,255,0.14)" : "rgba(228,87,87,0.16)";
            ctx.fillRect(px, py, cell, cell);

            ctx.lineWidth = 2;
            ctx.strokeStyle = exitUnlocked ? "rgba(0,240,255,0.85)" : "rgba(228,87,87,0.80)";
            ctx.strokeRect(px+2, py+2, cell-4, cell-4);

            ctx.globalAlpha = 0.55;
            ctx.fillStyle = exitUnlocked ? "rgba(240,173,78,0.38)" : "rgba(255,255,255,0.10)";
            ctx.beginPath();
            ctx.arc(px+cell*0.5, py+cell*0.5, cell*0.18, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // keys
      for (const k of keys){
        const px = ox + k.x*cell + cell*0.5;
        const py = oy + k.y*cell + cell*0.5;
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = "rgba(240,173,78,0.65)";
        ctx.fillStyle = "rgba(240,173,78,0.95)";
        ctx.beginPath();
        ctx.arc(px, py, cell*0.18, 0, Math.PI*2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.arc(px - cell*0.05, py - cell*0.06, cell*0.06, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }

      // player
      {
        const px = ox + player.x*cell + cell*0.5;
        const py = oy + player.y*cell + cell*0.5;
        ctx.save();
        ctx.shadowBlur = 22;
        ctx.shadowColor = "rgba(0,240,255,0.60)";
        ctx.fillStyle = "rgba(0,240,255,0.92)";
        ctx.beginPath();
        ctx.arc(px, py, cell*0.22, 0, Math.PI*2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.26)";
        ctx.beginPath();
        ctx.arc(px, py, cell*0.30, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }

      // border
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      roundRect(ox-8, oy-8, cell*size+16, cell*size+16, 14);
      ctx.stroke();
      ctx.restore();
    }

    // ============================================================
    // GAME
    // ============================================================
    function isWalkable(x,y){
      if (x<0 || y<0 || x>=size || y>=size) return false;
      const v = maze[y][x];
      return (v === 0 || v === 2);
    }

    function move(dx,dy){
      if (locked) return;

      const nx = player.x + dx;
      const ny = player.y + dy;

      if (!isWalkable(nx,ny)){
        sfxBump();
        showToast("MUR — BLOQUÉ");
        return;
      }

      // exit locked
      if (maze[ny][nx] === 2 && !exitUnlocked){
        sfxBump();
        showToast("SORTIE — CLÉS REQUISES");
        return;
      }

      player.x = nx;
      player.y = ny;
      sfxStep();

      // pickup key
      const before = keys.length;
      keys = keys.filter(k => !(k.x === player.x && k.y === player.y));
      if (keys.length !== before){
        keysCollected++;
        sfxKey();
        flashFX();
        showToast("CLÉ SÉCURISÉE");
        if (keysCollected >= 3){
          exitUnlocked = true;
          sfxUnlock();
          showToast("SORTIE — DÉVERROUILLÉE");
        }
      }

      // win
      if (maze[player.y][player.x] === 2 && exitUnlocked){
        win();
        return;
      }

      syncHUD();
      draw();
    }

    function win(){
      locked = true;
      statusText.textContent = "SYSTÈME: TERMINÉ";
      sfxWin();
      flashFX();
      showToast("EXTRACTION RÉUSSIE");

      clearInterval(timer);

      endTime.textContent = String(seconds).padStart(2,"0");
      endKeys.textContent = String(keysCollected).padStart(2,"0");
      endOverlay.classList.add("is-on");
      endOverlay.setAttribute("aria-hidden", "false");
    }

    function cinematicRedirect(url){
      flashFX();
      setTimeout(() => document.body.classList.add("is-transitioning"), 220);
      setTimeout(() => { window.location.href = url; }, 680);
    }

    function reset(){
      locked = false;
      player = { x: START.x, y: START.y };
      keys = KEY_POS.map(k => ({...k}));
      keysCollected = 0;
      exitUnlocked = false;
      seconds = 0;

      statusText.textContent = "SYSTÈME: ACTIF";
      endOverlay.classList.remove("is-on");
      endOverlay.setAttribute("aria-hidden", "true");

      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (!locked){
          seconds++;
          syncHUD();
        }
      }, 1000);

      syncHUD();
      draw();
      showToast("OBJECTIF: 3 CLÉS");
    }

    // ============================================================
    // INPUT (flèches)
    // ============================================================
    function bindPress(el, dx, dy){
      el.addEventListener("pointerdown", (e) => {
        resumeAudio();
        e.preventDefault();
        move(dx,dy);
      }, { passive:false });

      el.addEventListener("pointermove", (e)=>e.preventDefault(), { passive:false });
      el.addEventListener("pointerup", (e)=>e.preventDefault(), { passive:false });
      el.addEventListener("pointercancel", (e)=>e.preventDefault(), { passive:false });
    }

    bindPress(upBtn, 0,-1);
    bindPress(downBtn, 0, 1);
    bindPress(leftBtn,-1, 0);
    bindPress(rightBtn, 1, 0);

    window.addEventListener("keydown", (e) => {
      if (locked) return;
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") move(0,-1);
      if (k === "arrowdown" || k === "s") move(0, 1);
      if (k === "arrowleft" || k === "a") move(-1,0);
      if (k === "arrowright" || k === "d") move(1, 0);
    });

    // End buttons
    retryBtn.addEventListener("click", () => reset());
    nextBtn.addEventListener("click", () => cinematicRedirect(NEXT_URL));

    // ============================================================
    // BOOT
    // ============================================================
    syncHUD();
    reset();


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
