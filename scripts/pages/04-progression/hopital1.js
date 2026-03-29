    const NEXT_URL = "pages/02-puzzles/enigme2.html";

    const dialogueTextEl = document.getElementById("dialogueText");
    const continueBtn = document.getElementById("continueBtn");
    const characterImage = document.getElementById("characterImage");
    const badgeEl = document.getElementById("badge");
    const stage = document.getElementById("stage");
    const hud = document.getElementById("hud");
    const flash = document.getElementById("flash");
    const stamp = document.getElementById("stamp");
    const bgm = document.getElementById("bgm");
    const loader = document.getElementById("loader");

    const lines = [
      {
        badge: "Triage",
        text: "Que faites-vous ici ?",
        image: "img/phopital colere.webp",
        shake: true
      },
      {
        badge: "Consigne",
        text: "Allez chercher vos blouses. Les patients vous attendent.",
        image: "img/phopital colere.webp",
        shake: false
      }
    ];

    let idx = 0;
    let isTyping = false;
    let typingTimer = null;

    function showLoader(){ if (loader) loader.classList.add("visible"); }
    function hideLoader(){ if (loader) loader.classList.remove("visible"); }
    window.addEventListener("pageshow", (event) => { if (event.persisted) hideLoader(); });

    function setReady(ready){
      continueBtn.classList.toggle("is-ready", ready);
    }

    function swapImage(src){
      if (!src || !characterImage) return;
      characterImage.src = src;
      characterImage.classList.add("is-swap");
      window.setTimeout(() => characterImage.classList.remove("is-swap"), 260);
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

      const speed = 30; // un peu plus sec
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
      continueBtn.textContent = "Rejoindre le service";
      setReady(true);
      stamp.classList.add("is-on");

      continueBtn.onclick = () => {
        flash.classList.add("is-on");
        window.setTimeout(() => flash.classList.remove("is-on"), 170);

        window.setTimeout(() => document.body.classList.add("is-transitioning"), 220);

        showLoader();
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
      bgm.volume = 0.26;
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
        tx = x * 9; ty = y * 7;
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
