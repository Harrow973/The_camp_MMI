    /* =========================
       THE CAMP — DIALOGUE LOGIC
       ========================= */

    // Routes
    const BACK_URL = "pages/00-entry/selection-personnage.html";
    const NEXT_URL = "pages/01-story/levier.html";
    const core = window.TheCampCore || window.TheCamp;

    // Elements
    const dialogueTextEl = document.getElementById("dialogueText");
    const continueBtn = document.getElementById("continueBtn");
    const tapHint = document.getElementById("tapHint");
    const characterImageEl = document.getElementById("characterImage");
    const speakerNameEl = document.getElementById("speakerName");
    const loader = document.getElementById("loader");
    const backBtn = document.getElementById("backBtn");

    // Optional: pick selected character from query string ?char=...
    const params = new URLSearchParams(window.location.search);
    const selectedChar = params.get("char"); // ex: "F military"
    // You can extend mapping if you want character-specific dialogue later.
    // For now, we keep Tony speaking.

    const dialogueLines = [
      { speaker: "Professeur Tony", tag: "Briefing initial", text: "Toi, l’étudiant ! Tu crois connaître ton IUT ? Grave erreur.", image: "img/proftalk.webp" },
      { speaker: "Professeur Tony", tag: "Archive", text: "L’IUT de la Guadeloupe cache un passé oublié…", image: "img/profcolere.webp" },
      { speaker: "Professeur Tony", tag: "Projet", text: "…que j’ai décidé de réveiller grâce à ma machine temporelle !", image: "img/profneutre.webp" },
      { speaker: "Professeur Tony", tag: "Mission", text: "Résous des énigmes, affronte des mini-jeux, et découvre l’histoire du campus.", image: "img/profsourir.webp" },
      { speaker: "Professeur Tony", tag: "Déclenchement", text: "Prêt pour le grand saut temporel ? Allez… active le levier !", image: "img/profsourir.webp" },
    ];

    let currentIndex = 0;
    let isTyping = false;
    let typingTimer = null;

    function showLoader() {
      loader.classList.add("is-visible");
      loader.setAttribute("aria-hidden", "false");
    }
    function hideLoader() {
      loader.classList.remove("is-visible");
      loader.setAttribute("aria-hidden", "true");
    }

    function cinematicTransitionTo(url) {
      if (core && core.navigation && typeof core.navigation.transitionTo === "function") {
        core.navigation.transitionTo(url, { delay: 520 });
      } else {
        document.body.classList.add("is-transitioning");
        window.setTimeout(() => { window.location.href = url; }, 520);
      }
    }

    function setContinueVisible(visible) {
      continueBtn.style.display = visible ? "inline-block" : "none";
      tapHint.classList.toggle("is-visible", visible);
    }

    function setLineUI(line) {
      speakerNameEl.textContent = line.speaker || "—";
      const tagEl = document.getElementById("sceneTag");
      tagEl.textContent = line.tag || "";
      if (line.image) {
        characterImageEl.src = line.image;
        characterImageEl.alt = line.speaker || "Personnage";
      }
    }

    function typeWriter(text, idx = 0) {
      isTyping = true;
      setContinueVisible(false);

      const speed = 26; // ms per char

      if (idx < text.length) {
        dialogueTextEl.innerHTML = text.substring(0, idx + 1) + '<span class="cursor">|</span>';
        typingTimer = window.setTimeout(() => typeWriter(text, idx + 1), speed);
      } else {
        dialogueTextEl.textContent = text;
        isTyping = false;
        setContinueVisible(true);
      }
    }

    function displayLine(i) {
      const line = dialogueLines[i];
      dialogueTextEl.textContent = "";
      setLineUI(line);
      typeWriter(line.text, 0);
    }

    function finishDialogue() {
      // End state: change button + transition to lever
      continueBtn.textContent = "Activer !";
      setContinueVisible(true);

      continueBtn.onclick = () => {
        showLoader();
        // petite latence pour “feel” cinématique
        window.setTimeout(() => {
          hideLoader();
          cinematicTransitionTo(NEXT_URL);
        }, 260);
      };
    }

    function next() {
      // If typing, skip typing
      if (isTyping) {
        window.clearTimeout(typingTimer);
        const prevLine = dialogueLines[currentIndex];
        dialogueTextEl.textContent = prevLine.text;
        isTyping = false;
        setContinueVisible(true);
        return;
      }

      // Advance
      currentIndex += 1;
      if (currentIndex >= dialogueLines.length) {
        finishDialogue();
      } else {
        displayLine(currentIndex);
      }
    }

    function back() {
      cinematicTransitionTo(BACK_URL);
    }

    // Tap anywhere on HUD or stage to advance
    document.getElementById("hud").addEventListener("click", next);
    document.querySelector(".stage").addEventListener("click", next);
    continueBtn.addEventListener("click", next);
    backBtn.addEventListener("click", back);

    // Keyboard
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "escape") back();
      if (k === "enter" || k === " ") next();
    });

    // Optional parallax
    (function setupParallax(){
      const bg = document.getElementById("bgImage");
      if (!bg) return;

      let tx = 0, ty = 0, cx = 0, cy = 0;
      const onMove = (e) => {
        const w = window.innerWidth, h = window.innerHeight;
        const x = (e.clientX / w - 0.5) * 2;
        const y = (e.clientY / h - 0.5) * 2;
        tx = x * 10;
        ty = y * 8;
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
    if (core && core.boot) {
      core.boot({ autoBindNav: false, autoResumeAudio: false });
    }
    hideLoader();
    currentIndex = 0;
    displayLine(currentIndex);
