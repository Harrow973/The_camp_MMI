    const NEXT_URL = "pages/04-progression/reward-screen.html";

    const dialogueTextEl = document.getElementById("dialogueText");
    const continueBtn = document.getElementById("continueBtn");
    const doctorImg = document.getElementById("doctorImg");
    const badgeEl = document.getElementById("badge");
    const flash = document.getElementById("flash");
    const stamp = document.getElementById("stamp");
    const loader = document.getElementById("loader");

    // Même contenu que ta page actuelle
    const lines = [
      { badge: "Récompense", text: "Merci de m’avoir aidé. Tenez, pour vous récompenser.", image: "img/phopital sourire.webp" }
    ];

    let idx = 0;
    let isTyping = false;
    let typingTimer = null;

    function setReady(ready){
      continueBtn.classList.toggle("is-ready", ready);
    }

    function showLoader(on){
      if (!loader) return;
      loader.classList.toggle("is-on", !!on);
      loader.setAttribute("aria-hidden", (!on).toString());
    }

    // iOS bfcache
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) showLoader(false);
    });

    function swapImage(src){
      if (!src || !doctorImg) return;
      doctorImg.src = src;
      doctorImg.classList.add("is-swap");
      window.setTimeout(() => doctorImg.classList.remove("is-swap"), 260);
    }

    function typeWriter(text, i = 0){
      isTyping = true;
      setReady(false);

      const speed = 28; // dynamique (proche du style sergent)
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
      typeWriter(line.text, 0);
    }

    function finish(){
      continueBtn.textContent = "Récupérer";
      setReady(true);
      stamp.classList.add("is-on");

      continueBtn.onclick = () => {
        // flash + fade + loader (premium)
        flash.classList.add("is-on");
        window.setTimeout(() => flash.classList.remove("is-on"), 180);

        window.setTimeout(() => document.body.classList.add("is-transitioning"), 220);
        window.setTimeout(() => showLoader(true), 360);

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

    // Tap anywhere (HUD + stage) + bouton
    document.getElementById("hud").addEventListener("click", next);
    document.getElementById("stage").addEventListener("click", next);
    continueBtn.addEventListener("click", next);

    // Keyboard desktop
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "enter" || k === " ") next();
    });

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
