    const NEXT_URL = "pages/02-puzzles/enigme1.html";

    const dialogueTextEl = document.getElementById("dialogueText");
    const continueBtn = document.getElementById("continueBtn");
    const sergentImg = document.getElementById("sergentImg");
    const badgeEl = document.getElementById("badge");
    const stage = document.getElementById("stage");
    const hud = document.getElementById("hud");
    const flash = document.getElementById("flash");
    const stamp = document.getElementById("stamp");
    const bgm = document.getElementById("bgm");

    const lines = [
      { badge: "Attention", text: "C’est une caserne militaire ici ! Assez bavarder !", image: "img/pmilitairetalk.webp", shake: true },
      { badge: "Ordre", text: "Habillez-vous, soldats, et rejoignez-moi là-bas.", image: "img/pmilitaire sourire.webp", shake: false }
    ];

    let idx = 0;
    let isTyping = false;
    let typingTimer = null;

    function setReady(ready){
      continueBtn.classList.toggle("is-ready", ready);
    }

    function swapImage(src){
      if (!src) return;
      sergentImg.src = src;
      sergentImg.classList.add("is-swap");
      window.setTimeout(() => sergentImg.classList.remove("is-swap"), 260);
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

      const speed = 28; // dynamique
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
      dialogueTextEl.textContent = "";
      if (badgeEl) badgeEl.textContent = line.badge || "";
      swapImage(line.image);
      if (line.shake) shake();
      typeWriter(line.text, 0);
    }

    function finish(){
      continueBtn.textContent = "En position !";
      setReady(true);
      stamp.classList.add("is-on");

      continueBtn.onclick = () => {
        // Petit “flash + fade”
        flash.classList.add("is-on");
        window.setTimeout(() => flash.classList.remove("is-on"), 180);

        window.setTimeout(() => {
          document.body.classList.add("is-transitioning");
        }, 220);

        window.setTimeout(() => {
          window.location.href = NEXT_URL;
        }, 680);
      };
    }

    function next(){
      if (isTyping){
        window.clearTimeout(typingTimer);
        dialogueTextEl.textContent = lines[idx].text;
        isTyping = false;
        setReady(true);
        return;
      }

      idx += 1;
      if (idx >= lines.length){
        finish();
      } else {
        displayLine(idx);
      }
    }

    // Tap anywhere (HUD + stage)
    hud.addEventListener("click", next);
    stage.addEventListener("click", next);
    continueBtn.addEventListener("click", next);

    // Keyboard desktop
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "enter" || k === " ") next();
    });

    // Audio: start on first gesture (iOS)
    (function bootAudio(){
      if (!bgm) return;
      bgm.volume = 0.28;
      const tryPlay = () => bgm.play().catch(() => {});
      window.addEventListener("pointerdown", tryPlay, { once: true });
    })();

    // Parallax léger (desktop)
    (function setupParallax(){
      const bg = document.getElementById("bgImage");
      if (!bg) return;

      let tx = 0, ty = 0, cx = 0, cy = 0;
      const onMove = (e) => {
        const w = window.innerWidth, h = window.innerHeight;
        const x = (e.clientX / w - 0.5) * 2;
        const y = (e.clientY / h - 0.5) * 2;
        tx = x * 10; ty = y * 8;
      };
      const tick = () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        bg.style.transform = `translate(${cx}px, ${cy}px) scale(1.06)`;
        requestAnimationFrame(tick);
      };
      window.addEventListener("mousemove", onMove, { passive:true });
      tick();
    })();

    // Boot
    idx = 0;
    setReady(false);
    displayLine(idx);


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) {
      core.boot({ autoBindNav: false, autoResumeAudio: false });
    }
    if (core && core.sw && typeof core.sw.register === "function") {
      core.sw.register("service-worker.js");
    }
