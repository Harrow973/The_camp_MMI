    // ========= CONFIG =========
    const NEXT_URL = "pages/01-story/profdialogue.html";

    // Dialogue (reprend ton contenu, + “révélation” au bon moment)
    const lines = [
      { name:"???", badge:"Canal inconnu", text:"…Connexion établie. Vous croyez être seuls ?", img:"img/mechant.webp", fx:"intrusion" },
      { name:"???", badge:"Interférence", text:"HAHAHA ! Trop tard, explorateurs du dimanche !", img:"img/mechant3.webp", fx:"glitch" },
      { name:"???", badge:"Sabotage", text:"J’ai débranché un câble… et vous voilà coincés dans le passé pour toujours !", img:"img/mechant.webp", fx:"shake" },
      { name:"Le Méchant", badge:"Identité", text:"Il ne fallait pas réveiller les secrets de Saint-Claude.", img:"img/mechant.webp", fx:"reveal" },
      { name:"Le Méchant", badge:"Menace", text:"Bonne chance pour rentrer… si vous y arrivez.", img:"img/mechant.webp", fx:"glitch" },
      { name:"Le Méchant", badge:"Rupture", text:"Moi ? Je vais m’assurer que personne ne puisse réparer votre petite machine à remonter le temps. BAHAHAHA !", img:"img/mechant3.webp", fx:"final" }
    ];

    // ========= ELEMENTS =========
    const dialogueTextEl = document.getElementById("dialogueText");
    const continueBtn = document.getElementById("continueBtn");
    const villainImg = document.getElementById("villainImg");
    const speakerNameEl = document.getElementById("speakerName");
    const badgeEl = document.getElementById("badge");
    const stamp = document.getElementById("stamp");
    const sysState = document.getElementById("sysState");
    const stage = document.getElementById("stage");
    const hud = document.getElementById("hud");
    const flash = document.getElementById("flash");

    const glitchAImg = document.getElementById("glitchAImg");
    const glitchBImg = document.getElementById("glitchBImg");

    // ========= STATE =========
    let idx = 0;
    let isTyping = false;
    let typingTimer = null;
    let allowTapAudio = true;

    // ========= AUDIO (WebAudio: pas besoin de mp3) =========
    let audioCtx = null, master = null;
    function ensureAudio(){
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      master = audioCtx.createGain();
      master.gain.value = 0.42;
      master.connect(audioCtx.destination);
    }
    function tone(type="sine", freq=440, dur=0.07, gain=0.18){
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
      ensureAudio();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.14);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.26, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.18);
    }
    function glitchSound(){
      tone("sawtooth", 180, 0.06, 0.14);
      setTimeout(()=>tone("square", 520, 0.04, 0.10), 40);
      setTimeout(()=>tone("square", 780, 0.05, 0.08), 90);
    }
    function revealSound(){
      tone("square", 420, 0.07, 0.14);
      setTimeout(()=>tone("square", 640, 0.07, 0.12), 90);
      setTimeout(()=>tone("triangle", 880, 0.08, 0.10), 170);
    }
    function typeTick(i){
      // micro ticks aléatoires (léger)
      if (!audioCtx) return;
      if (i % 3 !== 0) return;
      const base = 240 + (i % 14) * 8;
      tone("sine", base, 0.02, 0.03);
    }

    // Start audio on first user gesture (iOS friendly)
    function armAudioOnce(){
      if (!allowTapAudio) return;
      allowTapAudio = false;
      ensureAudio();
      if (audioCtx.state === "suspended") audioCtx.resume().catch(()=>{});
      // petit “boot”
      tone("square", 220, 0.05, 0.08);
      setTimeout(()=>tone("square", 330, 0.05, 0.08), 70);
    }
    window.addEventListener("pointerdown", armAudioOnce, { once:true, passive:true });

    // ========= FX HELPERS =========
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
      thump();
    }

    function flashOnce(ms=180){
      flash.classList.add("is-on");
      setTimeout(()=>flash.classList.remove("is-on"), ms);
    }

    function setCorruption(on){
      document.body.classList.toggle("is-corrupted", on);
      sysState.textContent = on ? "SYSTÈME: CORROMPU" : "SYSTÈME: STABLE";
      stamp.classList.toggle("is-on", on);
    }

    function glitchOn(ms=520){
      document.body.classList.add("is-glitching");
      glitchSound();
      setTimeout(()=>document.body.classList.remove("is-glitching"), ms);
    }

    function swapVillain(src){
      if (!src) return;
      villainImg.src = src;
      glitchAImg.src = src;
      glitchBImg.src = src;

      // micro “pop”
      villainImg.style.filter = "drop-shadow(0 30px 70px rgba(0,0,0,0.70)) blur(0.4px)";
      setTimeout(()=>{ villainImg.style.filter = "drop-shadow(0 30px 70px rgba(0,0,0,0.70))"; }, 140);
    }

    // ========= TYPEWRITER =========
    function typeWriter(text, i=0){
      isTyping = true;
      setReady(false);

      const speed = 22; // nerveux (méchant)
      if (i < text.length){
        dialogueTextEl.innerHTML = text.substring(0, i + 1) + '<span class="cursor">|</span>';
        typeTick(i);
        typingTimer = setTimeout(() => typeWriter(text, i + 1), speed);
      } else {
        dialogueTextEl.textContent = text;
        isTyping = false;
        setReady(true);
      }
    }

    function applyLineFX(line){
      // base
      if (badgeEl) badgeEl.textContent = line.badge || "";
      speakerNameEl.textContent = line.name || "???";
      swapVillain(line.img);

      // FX by tag
      switch(line.fx){
        case "intrusion":
          setCorruption(true);
          flashOnce(140);
          tone("sine", 180, 0.08, 0.10);
          break;

        case "glitch":
          setCorruption(true);
          glitchOn(640);
          break;

        case "shake":
          setCorruption(true);
          shake();
          break;

        case "reveal":
          setCorruption(true);
          // reveal identity: “hard cut” + signature
          flashOnce(160);
          revealSound();
          glitchOn(420);
          break;

        case "final":
          setCorruption(true);
          // combo final
          shake();
          glitchOn(820);
          setTimeout(()=>flashOnce(220), 240);
          break;

        default:
          setCorruption(false);
          break;
      }
    }

    function displayLine(i){
      const line = lines[i];
      dialogueTextEl.textContent = "";
      applyLineFX(line);
      typeWriter(line.text, 0);
    }

    function finish(){
      continueBtn.textContent = "Sortir du cauchemar";
      setReady(true);

      continueBtn.onclick = () => {
        armAudioOnce();
        // “vilain → transition”
        flashOnce(180);
        tone("sawtooth", 140, 0.08, 0.12);
        setTimeout(()=>tone("triangle", 90, 0.12, 0.10), 90);

        setTimeout(() => {
          document.body.classList.add("is-transitioning");
        }, 220);

        setTimeout(() => {
          window.location.href = NEXT_URL;
        }, 760);
      };
    }

    function next(){
      armAudioOnce();

      if (isTyping){
        clearTimeout(typingTimer);
        dialogueTextEl.textContent = lines[idx].text;
        isTyping = false;
        setReady(true);
        tone("sine", 420, 0.03, 0.05);
        return;
      }

      idx += 1;
      if (idx >= lines.length){
        finish();
      } else {
        displayLine(idx);
      }
    }

    // Tap anywhere: stage + hud + button
    stage.addEventListener("click", next);
    hud.addEventListener("click", next);
    continueBtn.addEventListener("click", next);

    // Desktop keyboard
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "enter" || k === " ") next();
    });

    // Parallax léger
    (function parallax(){
      const bg = document.getElementById("bgImage");
      if (!bg) return;
      let tx=0, ty=0, cx=0, cy=0;
      const onMove = (e) => {
        const w = window.innerWidth, h = window.innerHeight;
        const x = (e.clientX / w - 0.5) * 2;
        const y = (e.clientY / h - 0.5) * 2;
        tx = x * 12; ty = y * 9;
      };
      const tick = () => {
        cx += (tx - cx) * 0.07;
        cy += (ty - cy) * 0.07;
        bg.style.transform = `translate(${cx}px, ${cy}px) scale(1.08)`;
        requestAnimationFrame(tick);
      };
      window.addEventListener("mousemove", onMove, { passive:true });
      tick();
    })();

    // Boot
    idx = 0;
    setReady(false);
    setCorruption(false);
    displayLine(idx);


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
