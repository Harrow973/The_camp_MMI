    // ROUTES
    const NEXT_URL = "pages/01-story/sergent-dialogue.html";

    // UI
    const dialogueTextEl = document.getElementById("dialogueText");
    const continueBtn = document.getElementById("continueBtn");
    const profImg = document.getElementById("profImg");
    const badgeEl = document.getElementById("badge");
    const stage = document.getElementById("stage");
    const hud = document.getElementById("hud");
    const flash = document.getElementById("flash");
    const bgm = document.getElementById("bgm");

    const lines = [
      { badge: "Choc",   text: "Par tous les circuits ! Samuel a débranché la machine… On est coincés en 1891.", image: "img/profcolere.webp" },
      { badge: "Analyse",text: "Mais il y a encore un espoir : 4 artefacts temporels sont cachés dans différentes époques de Saint-Claude.", image: "img/profneutre.webp" },
      { badge: "Plan",   text: "Si on les retrouve, on pourra rouvrir le portail vers le présent.", image: "img/proftalk.webp" },
      { badge: "Action", text: "Retrouvons-les !", image: "img/profsourir.webp" }
    ];

    let idx = 0;
    let isTyping = false;
    let typingTimer = null;

    function setContinueReady(ready){
      continueBtn.classList.toggle("is-ready", ready);
    }

    function triggerSwap(){
      profImg.classList.add("is-swap");
      window.setTimeout(() => profImg.classList.remove("is-swap"), 280);
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
      setContinueReady(false);

      const speed = 28; // rapide mais lisible mobile
      if (i < text.length){
        dialogueTextEl.innerHTML = text.substring(0, i + 1) + '<span class="cursor">|</span>';
        typingTimer = window.setTimeout(() => typeWriter(text, i + 1), speed);
      } else {
        dialogueTextEl.textContent = text;
        isTyping = false;
        setContinueReady(true);
      }
    }

    function displayLine(i){
      const line = lines[i];
      dialogueTextEl.textContent = "";
      if (badgeEl) badgeEl.textContent = line.badge || "";
      if (line.image){
        profImg.src = line.image;
        triggerSwap();
      }
      typeWriter(line.text, 0);
    }

    function finish(){
      continueBtn.textContent = "Compris !";
      setContinueReady(true);

      continueBtn.onclick = () => {
        // Shake + flash + fade
        shake();
        flash.classList.add("is-on");
        window.setTimeout(() => flash.classList.remove("is-on"), 180);

        window.setTimeout(() => {
          document.body.classList.add("is-transitioning");
        }, 260);

        window.setTimeout(() => {
          window.location.href = NEXT_URL;
        }, 720);
      };
    }

    function next(){
      if (isTyping){
        window.clearTimeout(typingTimer);
        dialogueTextEl.textContent = lines[idx].text;
        isTyping = false;
        setContinueReady(true);
        return;
      }

      idx += 1;
      if (idx >= lines.length){
        finish();
      } else {
        displayLine(idx);
      }
    }

    // Click to advance (HUD + stage)
    hud.addEventListener("click", next);
    stage.addEventListener("click", next);
    continueBtn.addEventListener("click", next);

    // Keyboard (desktop)
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "enter" || k === " ") next();
    });

    // Audio: iOS bloque l’autoplay -> on démarre au premier tap
    (function bootAudio(){
      if (!bgm) return;
      bgm.volume = 0.30;
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
    setContinueReady(false);
    displayLine(idx);


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) {
      core.boot({ autoBindNav: false, autoResumeAudio: false });
    }
    if (core && core.sw && typeof core.sw.register === "function") {
      core.sw.register("service-worker.js");
    }
