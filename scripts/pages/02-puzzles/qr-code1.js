    // Page suivante (défense)
    const NEXT_URL = "pages/03-games/mini-radar.html";

    const dialogueTextEl = document.getElementById("dialogueText");
    const continueBtn = document.getElementById("continueBtn");
    const characterImg = document.getElementById("characterImg");
    const speakerNameEl = document.getElementById("speakerName");
    const badgeEl = document.getElementById("badge");
    const stage = document.getElementById("stage");
    const hud = document.getElementById("hud");
    const flash = document.getElementById("flash");
    const stamp = document.getElementById("stamp");
    const loader = document.getElementById("loader");

    // Script: Prof -> Prof -> Prof -> (tampon) -> Sergent (shake) -> bouton final = redirection
    const lines = [
      { speaker: "Professeur Tony", badge: "Félicitations", text: "Excellent travail ! Vous avez trouvé le premier artefact-balise !", image: "img/profsourir.webp", shake: false, stamp: false },
      { speaker: "Professeur Tony", badge: "Objectif",       text: "Il nous en reste encore 3 à trouver. Ne perdons pas de temps !",          image: "img/profneutre.webp", shake: false, stamp: false },
      { speaker: "Professeur Tony", badge: "Scan",           text: "Je détecte la prochaine signature énergétique... Préparez-vous !",        image: "img/proftalk.webp",   shake: false, stamp: true  },
      { speaker: "Sergent-Chef",    badge: "Alerte",         text: "On est attaqué, venez défendre la base !",                               image: "img/pmilitaire colere.webp", shake: true, stamp: false, final: true }
    ];

    let idx = 0;
    let isTyping = false;
    let typingTimer = null;

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

      const speed = 28;
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
      speakerNameEl.textContent = line.speaker || "";
      if (badgeEl) badgeEl.textContent = line.badge || "";
      swapImage(line.image);

      if (line.stamp) stamp.classList.add("is-on");
      else stamp.classList.remove("is-on");

      if (line.shake) shake();

      typeWriter(line.text, 0);

      // Si c’est la ligne finale, le bouton devient “À la défense !”
      if (line.final){
        // On ajuste le label à la fin de la frappe (petit hook)
        const checkDone = window.setInterval(() => {
          if (!isTyping){
            window.clearInterval(checkDone);
            continueBtn.textContent = "À la défense !";
          }
        }, 30);
      } else {
        continueBtn.textContent = "Continuer";
      }
    }

    function goNext(){
      if (isTyping){
        window.clearTimeout(typingTimer);
        dialogueTextEl.textContent = lines[idx].text;
        isTyping = false;
        setReady(true);

        if (lines[idx].final) continueBtn.textContent = "À la défense !";
        return;
      }

      // Si on est sur la ligne finale, on part
      if (lines[idx].final){
        // Flash + fade + loader
        flash.classList.add("is-on");
        window.setTimeout(() => flash.classList.remove("is-on"), 180);

        window.setTimeout(() => document.body.classList.add("is-transitioning"), 220);
        window.setTimeout(() => {
          loader.classList.add("is-on");
          window.location.href = NEXT_URL;
        }, 520);
        return;
      }

      // Avance
      idx = Math.min(idx + 1, lines.length - 1);
      displayLine(idx);
    }

    // Tap anywhere (HUD + stage) + bouton
    hud.addEventListener("click", goNext);
    stage.addEventListener("click", goNext);
    continueBtn.addEventListener("click", goNext);

    // Keyboard desktop
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "enter" || k === " ") goNext();
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

    // Loader safety (retour navigateur)
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) loader.classList.remove("is-on");
    });

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
