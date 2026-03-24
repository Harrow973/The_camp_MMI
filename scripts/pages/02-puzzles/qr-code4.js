    // === Navigation ===
    const NEXT_URL = "pages/03-games/space-war.html";

    // === UI refs ===
    const stage = document.getElementById("stage");
    const hud = document.getElementById("hud");
    const flash = document.getElementById("flash");
    const stamp = document.getElementById("stamp");
    const villainImg = document.getElementById("villainImg");
    const dialogueTextEl = document.getElementById("dialogueText");
    const continueBtn = document.getElementById("continueBtn");

    // === Dialogue (tu peux ajouter des lignes facilement) ===
    const lines = [
      {
        badge: "Menace",
        text: "Vous pensiez vous en sortir ? Ce dernier artefact est à moi.",
        shake: true
      },
      {
        badge: "Ultimatum",
        text: "Préparez-vous à m’affronter.",
        shake: false
      }
    ];

    let idx = 0;
    let isTyping = false;
    let typingTimer = null;

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

    // === Micro SFX (sans fichiers) ===
    let audioCtx = null, master = null;
    function ensureAudio(){
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      master = audioCtx.createGain();
      master.gain.value = 0.34;
      master.connect(audioCtx.destination);
    }
    function stab(freq=180, dur=0.11, gain=0.20){
      try{
        ensureAudio();
        const t = audioCtx.currentTime;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(freq, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(60, freq*0.55), t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + dur + 0.02);
      }catch(_){}
    }
    function clickBeep(freq=520, dur=0.06, gain=0.10){
      try{
        ensureAudio();
        const t = audioCtx.currentTime;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "square";
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + dur + 0.02);
      }catch(_){}
    }

    function typeWriter(text, i = 0){
      isTyping = true;
      setReady(false);

      const speed = 26; // proche de tes autres dialogues
      if (i < text.length){
        dialogueTextEl.innerHTML = text.substring(0, i + 1) + '<span class="cursor">|</span>';
        typingTimer = window.setTimeout(() => typeWriter(text, i + 1), speed);
      } else {
        dialogueTextEl.textContent = text;
        isTyping = false;
        setReady(true);
      }
    }

    function displayLine(i){
      const line = lines[i];
      document.getElementById("badge").textContent = line.badge || "";
      dialogueTextEl.textContent = "";
      if (line.shake) shake();
      typeWriter(line.text, 0);
    }

    function finish(){
      continueBtn.textContent = "Affronter";
      setReady(true);
      stamp.classList.add("is-on");

      continueBtn.onclick = () => {
        clickBeep(620, 0.06, 0.12);

        flash.classList.add("is-on");
        window.setTimeout(() => flash.classList.remove("is-on"), 220);

        window.setTimeout(() => document.body.classList.add("is-transitioning"), 220);
        window.setTimeout(() => window.location.href = NEXT_URL, 680);
      };
    }

    function next(){
      // Reprise audio iOS au 1er geste
      if (!audioCtx){
        try{ ensureAudio(); }catch(_){}
      } else if (audioCtx.state === "suspended"){
        audioCtx.resume().catch(()=>{});
      }

      if (isTyping){
        window.clearTimeout(typingTimer);
        dialogueTextEl.textContent = lines[idx].text;
        isTyping = false;
        setReady(true);
        return;
      }

      clickBeep(520, 0.05, 0.10);

      idx += 1;
      if (idx >= lines.length){
        finish();
      } else {
        displayLine(idx);
      }
    }

    // Tap anywhere
    hud.addEventListener("click", next);
    stage.addEventListener("click", next);
    continueBtn.addEventListener("click", next);

    // Keyboard desktop
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "enter" || k === " ") next();
    });

    // Boot cinematic: flash + shake + pop
    (function boot(){
      setReady(false);

      flash.classList.add("is-on");
      window.setTimeout(() => flash.classList.remove("is-on"), 220);

      window.setTimeout(() => {
        shake();
        stab(190, 0.11, 0.18);
        villainImg.classList.add("is-pop");
        window.setTimeout(() => villainImg.classList.remove("is-pop"), 650);
      }, 170);

      window.setTimeout(() => {
        idx = 0;
        displayLine(idx);
      }, 520);
    })();

    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) {
      core.boot({ autoBindNav: false, autoResumeAudio: false });
    }
    if (core && core.sw && typeof core.sw.register === "function") {
      core.sw.register("service-worker.js");
    }
