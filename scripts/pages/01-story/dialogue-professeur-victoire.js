    // ============================================================
    // CONFIG
    // ============================================================
    const NEXT_URL = "pages/04-progression/artefact4.html";
    const dialogue =
      "Vous avez vaincu Samuel, sauvé notre histoire, et restauré la machine. Voici votre récompense… et bienvenue chez vous !";

    // ============================================================
    // DOM
    // ============================================================
    const dialogueTextEl = document.getElementById("dialogueText");
    const continueBtn = document.getElementById("continueBtn");
    const stage = document.getElementById("stage");
    const hud = document.getElementById("hud");
    const flash = document.getElementById("flash");
    const stamp = document.getElementById("stamp");

    // ============================================================
    // STATE
    // ============================================================
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

    function typeWriter(text, i = 0){
      isTyping = true;
      setReady(false);

      const speed = 28; // un poil plus dynamique que l'ancien
      if (i < text.length){
        dialogueTextEl.innerHTML = text.substring(0, i + 1) + '<span class="cursor">|</span>';
        typingTimer = window.setTimeout(() => typeWriter(text, i + 1), speed);
      } else {
        dialogueTextEl.textContent = text;
        isTyping = false;
        setReady(true);
        stamp.classList.add("is-on");
        // petite “punchline” victoire
        shake();
      }
    }

    function goNext(){
      flash.classList.add("is-on");
      window.setTimeout(() => flash.classList.remove("is-on"), 180);

      window.setTimeout(() => {
        document.body.classList.add("is-transitioning");
      }, 220);

      window.setTimeout(() => {
        window.location.href = NEXT_URL;
      }, 680);
    }

    function next(){
      if (isTyping){
        window.clearTimeout(typingTimer);
        dialogueTextEl.textContent = dialogue;
        isTyping = false;
        setReady(true);
        stamp.classList.add("is-on");
        shake();
        return;
      }
      goNext();
    }

    // Tap anywhere (HUD + stage) like your other remasters
    hud.addEventListener("click", next);
    stage.addEventListener("click", next);
    continueBtn.addEventListener("click", next);

    // Keyboard desktop
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "enter" || k === " ") next();
    });

    // boot
    setReady(false);
    typeWriter(dialogue, 0);


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
