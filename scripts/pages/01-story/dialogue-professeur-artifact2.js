    // ✅ Redirection demandée : énigme 3 (scan QR)
    const NEXT_URL = "pages/02-puzzles/enigme3.html";

    const dialogueTextEl = document.getElementById("dialogueText");
    const continueBtn = document.getElementById("continueBtn");
    const stage = document.getElementById("stage");
    const hud = document.getElementById("hud");
    const flash = document.getElementById("flash");
    const loader = document.getElementById("loader");

    const sfxPaper = document.getElementById("sfxPaper");
    const sfxInk = document.getElementById("sfxInk");

    const dialogueLine = "Super, on approche du but ! Nous allons maintenant scanner un nouveau code pour continuer.";

    let isTyping = false;
    let typingTimer = null;
    let audioArmed = false;
    let finished = false;

    function safePlay(aud, {volume=0.6, restart=true} = {}){
      if (!aud) return;
      try{
        aud.volume = volume;
        if (restart) aud.currentTime = 0;
        const p = aud.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }catch(e){}
    }

    // iOS: arm audio on first gesture
    function armAudio(){
      if (audioArmed) return;
      audioArmed = true;
      safePlay(sfxPaper, {volume:0.30});
    }
    window.addEventListener("pointerdown", armAudio, { once:true });

    function showLoader(on){
      if (!loader) return;
      loader.classList.toggle("is-on", !!on);
      loader.setAttribute("aria-hidden", (!on).toString());
    }
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) showLoader(false);
    });

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

    function typeWriter(text, i = 0){
      isTyping = true;
      setReady(false);

      const speed = 32;
      if (i < text.length){
        dialogueTextEl.innerHTML = text.substring(0, i + 1) + '<span class="cursor">|</span>';
        typingTimer = window.setTimeout(() => typeWriter(text, i + 1), speed);
      } else {
        dialogueTextEl.textContent = text;
        isTyping = false;
        setReady(true);
      }
    }

    function goNext(){
      if (finished) return;
      finished = true;

      safePlay(sfxInk, {volume:0.45});
      shake();

      flash.classList.add("is-on");
      window.setTimeout(() => flash.classList.remove("is-on"), 160);

      window.setTimeout(() => document.body.classList.add("is-transitioning"), 220);
      window.setTimeout(() => showLoader(true), 360);

      window.setTimeout(() => {
        window.location.href = NEXT_URL;
      }, 760);
    }

    function next(){
      if (isTyping){
        window.clearTimeout(typingTimer);
        dialogueTextEl.textContent = dialogueLine;
        isTyping = false;
        setReady(true);
        return;
      }
      // Une seule ligne : le prochain clic lance la redirection.
      continueBtn.textContent = "Scanner le QR";
      setReady(true);
      goNext();
    }

    // Tap anywhere (HUD + stage) + bouton
    hud.addEventListener("click", next);
    stage.addEventListener("click", next);
    continueBtn.addEventListener("click", next);

    // Keyboard desktop
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "enter" || k === " ") next();
    });

    // Boot
    setReady(false);
    typeWriter(dialogueLine, 0);


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
