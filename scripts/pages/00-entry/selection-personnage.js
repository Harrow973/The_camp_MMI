  // =====================
  // CONFIG
  // =====================
  const NEXT_URL = "pages/01-story/dialogue.html"; // change ici si besoin
  const BACK_URL = "index.html";
  const core = window.TheCampCore || window.TheCamp;

  function goTo(url, delay = 520){
    if (core && core.navigation && typeof core.navigation.transitionTo === "function") {
      core.navigation.transitionTo(url, { delay });
    } else {
      document.body.classList.add("is-transitioning");
      window.setTimeout(() => { window.location.href = url; }, delay);
    }
  }

  const startBtn = document.getElementById("startBtn");
  const backBtn  = document.getElementById("backBtn");
  const loading  = document.getElementById("loading");
  const barFill  = document.getElementById("barFill");
  const pctEl    = document.getElementById("pct");
  const statusEl = document.getElementById("status");
  const loadSub  = document.getElementById("loadSub");
  const shardsEl = document.getElementById("shards");

  // =====================
  // WebAudio (SFX)
  // =====================
  let audioCtx = null, master = null;
  function ensureAudio(){
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain();
    master.gain.value = 0.35;
    master.connect(audioCtx.destination);
  }
  function sfxBeep(type="square", f=520, dur=0.07, gain=0.16){
    ensureAudio();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function sfxWhoosh(){
    ensureAudio();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(760, t + 0.14);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.18);
  }
  function sfxThump(){
    ensureAudio();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(62, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.20, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.16);
  }

  async function resumeAudioIfNeeded(){
    ensureAudio();
    if (audioCtx && audioCtx.state === "suspended"){
      try { await audioCtx.resume(); } catch(e){}
    }
  }

  // =====================
  // Shards (FX visuels)
  // =====================
  function spawnShards(count=18){
    shardsEl.innerHTML = "";
    const w = window.innerWidth;
    for (let i=0;i<count;i++){
      const d = document.createElement("div");
      d.className = "shard";
      const x = Math.floor(Math.random() * (w - 20)) + "px";
      const dx = (Math.random() * 140 - 70).toFixed(0) + "px";
      const delay = (Math.random() * 0.9).toFixed(2) + "s";
      const dur = (1.2 + Math.random() * 1.4).toFixed(2) + "s";
      d.style.setProperty("--x", x);
      d.style.setProperty("--dx", dx);
      d.style.animationDelay = delay;
      d.style.animationDuration = dur;
      // variation couleur
      const isAmber = Math.random() > 0.72;
      d.style.background = isAmber ? "rgba(240,173,78,0.22)" : "rgba(107,142,35,0.22)";
      shardsEl.appendChild(d);
    }
  }

  // =====================
  // Loading sequence (barre + textes + SFX)
  // =====================
  let loadingTimer = null;

  function setLoading(on){
    loading.classList.toggle("is-on", on);
    loading.setAttribute("aria-hidden", on ? "false" : "true");
  }

  function runLoadingThenGo(){
    // Séquence stylée, mais pas trop longue
    const steps = [
      { p: 18,  sub:"Synchronisation…", status:"Chargement des modules",    sfx: () => sfxBeep("square", 520) },
      { p: 42,  sub:"Vérification…",    status:"Calibration du protocole",  sfx: () => sfxBeep("square", 660) },
      { p: 68,  sub:"Armement…",        status:"Préparation du terrain",    sfx: () => sfxBeep("triangle", 720) },
      { p: 88,  sub:"Connexion…",       status:"Verrouillage de mission",   sfx: () => sfxBeep("triangle", 840) },
      { p: 100, sub:"GO",               status:"Déploiement",               sfx: () => { sfxThump(); sfxWhoosh(); } },
    ];

    let i = 0;
    function applyStep(){
      const st = steps[i];
      barFill.style.width = st.p + "%";
      pctEl.textContent = st.p + "%";
      loadSub.textContent = st.sub;
      statusEl.textContent = st.status;
      st.sfx?.();

      i++;
      if (i >= steps.length){
        // Transition cinématique vers la page suivante
        goTo(NEXT_URL, 520);
        return;
      }
      loadingTimer = window.setTimeout(applyStep, 360 + i*90);
    }

    applyStep();
  }

  // =====================
  // Events
  // =====================
  backBtn.addEventListener("click", async () => {
    await resumeAudioIfNeeded();
    sfxBeep("sine", 380, 0.06, 0.12);
    goTo(BACK_URL, 520);
  });

  startBtn.addEventListener("click", async () => {
    // important iOS: audio uniquement sur interaction
    await resumeAudioIfNeeded();

    // FX + Loading
    sfxBeep("square", 440, 0.07, 0.14);
    window.setTimeout(() => sfxBeep("square", 660, 0.07, 0.14), 110);
    window.setTimeout(() => sfxBeep("square", 880, 0.08, 0.18), 220);

    setLoading(true);
    spawnShards(20);
    barFill.style.width = "0%";
    pctEl.textContent = "0%";
    loadSub.textContent = "Synchronisation…";
    statusEl.textContent = "Préparation du briefing";

    // évite les doubles clics
    startBtn.disabled = true;
    startBtn.style.opacity = "0.85";

    // run
    window.clearTimeout(loadingTimer);
    window.setTimeout(runLoadingThenGo, 120);
  }, { passive:true });

  // “Best effort” anti double-tap zoom
  let lastTouch = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouch <= 240) e.preventDefault();
    lastTouch = now;
  }, { passive:false });

  if (core && core.boot) {
    core.boot({ autoBindNav: false, autoResumeAudio: false });
  }
