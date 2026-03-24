    // ROUTES
    const BACK_URL = "pages/01-story/dialogue-professeur-artifact3.html";
    const NEXT_URL = "pages/02-puzzles/scanner4.html";
    const core = window.TheCampCore || window.TheCamp;

    const backBtn = document.getElementById("backBtn");
    const scanBtn = document.getElementById("scanBtn");
    const flash = document.getElementById("flash");
    const warp = document.getElementById("warp");
    const target = document.getElementById("target");

    function cinematicTransitionTo(url){
      if (core && core.navigation && typeof core.navigation.transitionTo === "function") {
        core.navigation.transitionTo(url, { delay: 520 });
      } else {
        document.body.classList.add("is-transitioning");
        window.setTimeout(() => { window.location.href = url; }, 520);
      }
    }

    // Ripple effect inside button
    function rippleAt(btn, x, y){
      const r = document.createElement("span");
      r.className = "ripple is-anim";
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      r.style.width = r.style.height = size + "px";
      r.style.left = (x - rect.left - size/2) + "px";
      r.style.top  = (y - rect.top  - size/2) + "px";
      btn.appendChild(r);
      r.addEventListener("animationend", () => r.remove(), { once:true });
    }

    function goScan(){
      // petit “alert shake”
      document.body.classList.add("is-alert");
      window.setTimeout(() => document.body.classList.remove("is-alert"), 520);

      // warp + flash + fade
      warp.classList.add("is-on");
      document.body.classList.add("is-warping");

      window.setTimeout(() => {
        flash.classList.add("is-on");
        window.setTimeout(() => flash.classList.remove("is-on"), 160);
      }, 220);

      window.setTimeout(() => {
        document.body.classList.add("is-transitioning");
      }, 520);

      window.setTimeout(() => {
        window.location.href = NEXT_URL;
      }, 980);
    }

    backBtn.addEventListener("click", () => cinematicTransitionTo(BACK_URL));

    scanBtn.addEventListener("click", (e) => {
      rippleAt(scanBtn, e.clientX, e.clientY);
      goScan();
    });

    // Tap on image also triggers “scan” (mobile friendly)
    target.addEventListener("click", () => goScan());

    // Parallax background (desktop)
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

    if (core && core.boot) {
      core.boot({ autoBindNav: false, autoResumeAudio: false });
    }
    if (core && core.sw && typeof core.sw.register === "function") {
      core.sw.register("service-worker.js");
    }
