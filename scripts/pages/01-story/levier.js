    // Routes
    const BACK_URL = "pages/01-story/dialogue.html";
    const NEXT_URL = "pages/01-story/dialogue-mechant.html";
    const core = window.TheCampCore || window.TheCamp;

    const backBtn = document.getElementById("backBtn");
    const leverWrap = document.getElementById("leverWrap");
    const activateBtn = document.getElementById("activateBtn");
    const portal = document.getElementById("portal");
    const pulseHint = document.getElementById("pulseHint");

    let activated = false;

    function cinematicTransitionTo(url){
      if (core && core.navigation && typeof core.navigation.transitionTo === "function") {
        core.navigation.transitionTo(url, { delay: 520 });
      } else {
        document.body.classList.add("is-transitioning");
        window.setTimeout(() => { window.location.href = url; }, 520);
      }
    }

    function activate(){
      if (activated) return;
      activated = true;

      // UI locks
      pulseHint.style.opacity = "0";
      pulseHint.style.transform = "translateY(2px)";
      portal.classList.add("is-on");

      // Start animation timeline
      document.body.classList.add("is-activating");

      // At ~1.25s: fade to black
      window.setTimeout(() => {
        document.body.classList.add("is-transitioning");
      }, 1250);

      // At ~1.7s: navigate
      window.setTimeout(() => {
        window.location.href = NEXT_URL;
      }, 1700);
    }

    backBtn.addEventListener("click", () => cinematicTransitionTo(BACK_URL));
    leverWrap.addEventListener("click", activate);
    activateBtn.addEventListener("click", activate);

    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "escape") cinematicTransitionTo(BACK_URL);
      if (k === "enter" || k === " ") activate();
    });

    // Optional parallax (desktop)
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

    if (core && core.boot) {
      core.boot({ autoBindNav: false, autoResumeAudio: false });
    }
