    const NEXT_URL = 'pages/01-story/dialogue-professeur-artifact2.html';

    const bg = document.getElementById('bgImage');
    const stage = document.getElementById('stage');
    const artifactWrap = document.getElementById('artifactWrap');
    const collectBtn = document.getElementById('collectBtn');
    const flash = document.getElementById('flash');
    const loader = document.getElementById('loader');

    const sfxWhoosh = document.getElementById('sfxWhoosh');
    const sfxHum = document.getElementById('sfxHum');
    const sfxSparkle = document.getElementById('sfxSparkle');
    const sfxBoom = document.getElementById('sfxBoom');
    const sfxClick = document.getElementById('sfxClick');

    let collected = false;
    let audioArmed = false;

    function showLoader(on){
      if (!loader) return;
      loader.classList.toggle('is-on', !!on);
      loader.setAttribute('aria-hidden', (!on).toString());
    }
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) showLoader(false);
    });

    function safePlay(aud, {volume=0.6, restart=true} = {}){
      if (!aud) return;
      try{
        aud.volume = volume;
        if (restart) aud.currentTime = 0;
        const p = aud.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }catch(e){}
    }

    // iOS: arm audio on first user gesture
    function armAudio(){
      if (audioArmed) return;
      audioArmed = true;
      safePlay(sfxWhoosh, {volume:0.55});
      // Ambient hum subtle
      if (sfxHum){
        sfxHum.volume = 0.18;
        const p = sfxHum.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    }
    window.addEventListener('pointerdown', armAudio, { once:true });

    // Parallax (desktop + mobile slight using deviceorientation not added to avoid permission friction)
    (function parallax(){
      if (!bg) return;
      let tx=0, ty=0, cx=0, cy=0;
      const onMove = (e) => {
        const w = window.innerWidth, h = window.innerHeight;
        const x = (e.clientX / w - 0.5) * 2;
        const y = (e.clientY / h - 0.5) * 2;
        tx = x * 10; ty = y * 8;
      };
      const tick = () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        bg.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(1.08)`;
        requestAnimationFrame(tick);
      };
      window.addEventListener('mousemove', onMove, { passive:true });
      tick();
    })();

    // ===== Particles FX (canvas) =====
    const canvas = document.getElementById('fx');
    const ctx = canvas ? canvas.getContext('2d') : null;
    let W=0,H=0, dpr=1;
    const particles = [];

    function resize(){
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.floor(rect.width * dpr);
      H = Math.floor(rect.height * dpr);
      canvas.width = W;
      canvas.height = H;
    }
    window.addEventListener('resize', resize);
    resize();

    function spawnBurst(x, y, count=70){
      if (!ctx) return;
      for (let i=0;i<count;i++){
        const a = Math.random()*Math.PI*2;
        const sp = 1.8 + Math.random()*6.2;
        particles.push({
          x, y,
          vx: Math.cos(a)*sp,
          vy: Math.sin(a)*sp - (0.8 + Math.random()*1.6),
          life: 34 + Math.random()*22,
          size: 1.2 + Math.random()*2.6
        });
      }
    }

    function tickFx(){
      if (!ctx || !canvas) return requestAnimationFrame(tickFx);
      ctx.clearRect(0,0,W,H);

      // soft additive look
      ctx.globalCompositeOperation = 'lighter';

      for (let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        p.life -= 1;
        p.x += p.vx * dpr;
        p.y += p.vy * dpr;
        p.vx *= 0.985;
        p.vy = (p.vy * 0.985) + (0.10*dpr); // gravity

        const alpha = Math.max(0, Math.min(1, p.life/40));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size*dpr, 0, Math.PI*2);
        ctx.fillStyle = `rgba(173,216,230,${alpha})`;
        ctx.fill();

        if (p.life <= 0) particles.splice(i,1);
      }

      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(tickFx);
    }
    tickFx();

    function centerOfArtifact(){
      const rect = artifactWrap.getBoundingClientRect();
      const srect = stage.getBoundingClientRect();
      // coords relative to canvas (stage)
      const cx = (rect.left - srect.left + rect.width/2) * dpr;
      const cy = (rect.top - srect.top + rect.height/2) * dpr;
      return {cx, cy};
    }

    function shakeOnce(){
      stage.classList.add('shake');
      window.setTimeout(() => stage.classList.remove('shake'), 560);
    }

    function doCollect(){
      if (collected) return;
      collected = true;

      collectBtn.disabled = true;
      document.body.classList.add('is-collected');

      // SFX
      safePlay(sfxClick, {volume:0.55});
      safePlay(sfxSparkle, {volume:0.75});
      window.setTimeout(() => safePlay(sfxBoom, {volume:0.60}), 120);

      // Particles burst
      const {cx, cy} = centerOfArtifact();
      spawnBurst(cx, cy, 90);
      window.setTimeout(() => spawnBurst(cx, cy, 60), 120);

      // Shake + flash
      shakeOnce();
      flash.classList.add('is-on');
      window.setTimeout(() => flash.classList.remove('is-on'), 180);

      // Transition out
      window.setTimeout(() => document.body.classList.add('is-transitioning'), 260);
      window.setTimeout(() => showLoader(true), 420);

      window.setTimeout(() => {
        window.location.href = NEXT_URL;
      }, 820);
    }

    // Collect actions
    artifactWrap.addEventListener('click', () => { armAudio(); doCollect(); }, { passive:true });
    collectBtn.addEventListener('click', () => { armAudio(); doCollect(); });

    // Optional: tap anywhere on stage also collects (feel “arcade”)
    stage.addEventListener('click', (e) => {
      // avoid double trigger if already collected
      if (collected) return;
      // if click is not on button area, collect as well
      if (!e.target.closest('#collectBtn')) { armAudio(); doCollect(); }
    });

    // Keyboard desktop
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'enter' || k === ' ') { armAudio(); doCollect(); }
    });


    const core = window.TheCampCore || window.TheCamp;
    if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
    if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
