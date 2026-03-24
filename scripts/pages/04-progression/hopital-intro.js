    // Redirection identique à ta page d'origine
    const NEXT_URL = "pages/03-games/maze.html";

    const dialogueTextEl = document.getElementById("dialogueText");
    const continueBtn = document.getElementById("continueBtn");
    const characterImg = document.getElementById("characterImg");
    const badgeEl = document.getElementById("badge");
    const stage = document.getElementById("stage");
    const hud = document.getElementById("hud");
    const flash = document.getElementById("flash");
    const loader = document.getElementById("loader");
    const bgImage = document.getElementById("bgImage");

    const line = "Zut, la machine déconne ! Elle nous a téléportés dans les catacombes du premier hôpital public de Guadeloupe, en 1996. Essayons d’en sortir !";

    let isTyping = false;
    let typingTimer = null;

    function showLoader(){ if (loader) loader.classList.add("visible"); }
    function hideLoader(){ if (loader) loader.classList.remove("visible"); }
    window.addEventListener("pageshow", (event) => { if (event.persisted) hideLoader(); });

    function setReady(ready){
      continueBtn.classList.toggle("is-ready", ready);
    }

    function swapImage(src){
      if (!src) return;
      characterImg.src = src;
      characterImg.classList.add("is-swap");
      window.setTimeout(() => characterImg.classList.remove("is-swap"), 260);
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

      const speed = 32; // un peu plus “tendu”/horreur légère
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
      // Petit flash + fade
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
        dialogueTextEl.textContent = line;
        isTyping = false;
        setReady(true);
        return;
      }
      showLoader();
      // micro-latence contrôlée (comme ta version)
      window.setTimeout(goNext, 300);
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

    // Parallax léger (desktop)
    (function setupParallax(){
      if (!bgImage) return;

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
        bgImage.style.transform = `translate(${cx}px, ${cy}px) scale(1.06)`;
        requestAnimationFrame(tick);
      };
      window.addEventListener("mousemove", onMove, { passive:true });
      tick();
    })();

    // Boot
    setReady(false);
    swapImage("img/profneutre.webp");
    shake(); // petit impact à l'entrée (optionnel)
    typeWriter(line, 0);


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) {
      core.boot({ autoBindNav: false, autoResumeAudio: false });
    }
    if (core && core.sw && typeof core.sw.register === "function") {
      core.sw.register("service-worker.js");
    }
