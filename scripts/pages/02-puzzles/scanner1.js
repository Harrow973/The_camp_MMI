    // ROUTES
    const BACK_URL = "pages/02-puzzles/enigme1.html";
    const SUCCESS_URL = "pages/02-puzzles/qr-code1.html"; // ta redirection actuelle :contentReference[oaicite:1]{index=1}
    const PUZZLE_ID = "E1";
    const core = window.TheCampCore || window.TheCamp;

    const backBtn = document.getElementById("backBtn");
    const startBtn = document.getElementById("startBtn");
    const stopBtn  = document.getElementById("stopBtn");
    const retryBtn = document.getElementById("retryBtn");
    const cameraSelect = document.getElementById("cameraSelect");
    const resultText = document.getElementById("resultText");
    const statusChip = document.getElementById("statusChip");
    const frameEl = document.getElementById("frame");
    const scanline = document.getElementById("scanline");

    let html5Qr = null;
    let isScanning = false;
    let cameras = [];
    let selectedCameraId = "";

    function setStatus(text, mode){
      statusChip.textContent = text;
      statusChip.classList.remove("ok","err");
      if (mode) statusChip.classList.add(mode);
    }
    function setResult(text, mode){
      resultText.textContent = text;
      resultText.classList.remove("ok","err");
      if (mode) resultText.classList.add(mode);
    }

    function cinematicTransitionTo(url){
      if (core && core.navigation && typeof core.navigation.transitionTo === "function") {
        core.navigation.transitionTo(url, { delay: 520 });
      } else {
        document.body.classList.add("is-transitioning");
        setTimeout(() => window.location.href = url, 520);
      }
    }

    function isSecureContextOk(){
      // HTTPS obligatoire pour getUserMedia (sauf localhost).
      if (location.protocol === "https:") return true;
      if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return true;
      return false;
    }

    async function warmupPermission(){
      // Petit test direct getUserMedia pour afficher une erreur claire
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
        throw new Error("mediaDevices/getUserMedia non supporté (navigateur).");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach(t => t.stop());
    }

    async function loadCameras(){
      cameras = await Html5Qrcode.getCameras();
      cameraSelect.innerHTML = "";
      const optAuto = document.createElement("option");
      optAuto.value = "";
      optAuto.textContent = "Caméra : auto (arrière)";
      cameraSelect.appendChild(optAuto);

      cameras.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.label || `Camera ${c.id}`;
        cameraSelect.appendChild(opt);
      });

      cameraSelect.disabled = cameras.length === 0;
      setStatus(cameras.length ? "Caméras détectées" : "Aucune caméra", cameras.length ? "ok" : "err");
    }

    function computeQrbox(){
      // qrbox adaptatif à la taille de l'écran
      const w = Math.min(window.innerWidth, 520);
      const size = Math.max(220, Math.min(300, Math.floor(w * 0.62)));
      return { width: size, height: size };
    }

    function clampScanline(){
      // Ajuste l’animation de scanline à la hauteur réelle du container
      const rect = frameEl.getBoundingClientRect();
      const inset = rect.height * 0.12;
      const travel = Math.max(120, rect.height - inset*2);
      scanline.style.animation = "none";
      // relance
      void scanline.offsetHeight;
      scanline.style.animation = `scanlineMove 1400ms linear infinite`;
      // inject keyframes dynamiques via style element
      let styleEl = document.getElementById("dynScanStyle");
      if (!styleEl){
        styleEl = document.createElement("style");
        styleEl.id = "dynScanStyle";
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        @keyframes scanlineMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(${travel}px); }
        }
      `;
    }

    async function startScan(){
      if (isScanning) return;

      if (!isSecureContextOk()){
        setStatus("Contexte non sécurisé", "err");
        setResult("Caméra bloquée: ton site doit être en HTTPS (ou localhost).", "err");
        retryBtn.disabled = false;
        return;
      }

      try{
        setStatus("Demande caméra…");
        setResult("Autorisation caméra…", "");
        await warmupPermission(); // force un prompt iOS propre

        await loadCameras();

        html5Qr = html5Qr || new Html5Qrcode("qr-reader");

        const config = {
          fps: 12,
          qrbox: computeQrbox(),
          aspectRatio: 1.0,
          disableFlip: true
        };

        const onScanSuccess = async (decodedText) => {
          if (!decodedText) return;

          if (!window.TheCampQR || typeof window.TheCampQR.validate !== "function") {
            setStatus("Erreur validation", "err");
            setResult("Validateur QR indisponible.", "err");
            return;
          }

          const validation = await window.TheCampQR.validate(decodedText, { puzzleId: PUZZLE_ID });
          if (!validation.ok) {
            setStatus("Code invalide", "err");
            setResult(validation.message || "QR invalide.", "err");
            return;
          }

          setResult("Code detecte et verifie.", "ok");
          setStatus("Code valide", "ok");

          // Stop propre puis redirige
          await stopScan(true);
          setResult("Code valide. Redirection...", "ok");
          setTimeout(() => window.location.href = SUCCESS_URL, 650);
        };

        const onScanFailure = () => { /* silencieux */ };

        // Choix caméra : si sélection, on prend l'id, sinon facingMode arrière.
        const cameraConfig = selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: "environment" };

        document.body.classList.add("is-scanning");
        clampScanline();

        await html5Qr.start(cameraConfig, config, onScanSuccess, onScanFailure);

        isScanning = true;
        setStatus("Scan actif", "ok");
        setResult("Vise le QR code dans le cadre.", "");
        startBtn.disabled = true;
        stopBtn.disabled = false;
        retryBtn.disabled = false;
      } catch (err){
        document.body.classList.remove("is-scanning");

        // Erreurs iOS fréquentes
        const msg = (err && err.message) ? err.message : String(err);

        setStatus("Erreur caméra", "err");

        if (msg.includes("NotAllowedError") || msg.toLowerCase().includes("permission")){
          setResult("Permission refusée. Vérifie Safari > Réglages du site > Caméra.", "err");
        } else if (msg.includes("NotFoundError")){
          setResult("Aucune caméra trouvée sur l’appareil.", "err");
        } else if (msg.includes("NotReadableError")){
          setResult("Caméra occupée (FaceTime/une autre app). Ferme tout puis réessaie.", "err");
        } else if (msg.includes("OverconstrainedError")){
          setResult("Caméra demandée indisponible. Change de caméra via la liste.", "err");
        } else {
          setResult(`Impossible d’accéder à la caméra : ${msg}`, "err");
        }

        startBtn.disabled = false;
        stopBtn.disabled = true;
        retryBtn.disabled = false;
      }
    }

    async function stopScan(silent){
      try{
        if (html5Qr && isScanning){
          await html5Qr.stop();
          await html5Qr.clear();
        }
      } catch(e){
        // ignore
      } finally {
        isScanning = false;
        document.body.classList.remove("is-scanning");
        startBtn.disabled = false;
        stopBtn.disabled = true;
        retryBtn.disabled = false;
        if (!silent){
          setStatus("Arrêté", "");
          setResult("Scan arrêté.", "");
        }
      }
    }

    // Events
    backBtn.addEventListener("click", () => cinematicTransitionTo(BACK_URL));
    startBtn.addEventListener("click", startScan);
    stopBtn.addEventListener("click", () => stopScan(false));
    retryBtn.addEventListener("click", async () => {
      await stopScan(true);
      await startScan();
    });

    cameraSelect.addEventListener("change", async (e) => {
      selectedCameraId = e.target.value || "";
      setStatus("Caméra sélectionnée", "");
      setResult(selectedCameraId ? "Changement caméra… (réessaie le scan)" : "Mode auto (arrière).", "");
      if (isScanning){
        await stopScan(true);
        await startScan();
      }
    });

    // Important iOS: stop camera when tab hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && isScanning) stopScan(true);
    });

    // Boot message only (no auto-start)
    setStatus("Prêt", "");
    setResult("Appuie sur “Démarrer le scan”.", "");

    if (core && core.boot) {
      core.boot({ autoBindNav: false, autoResumeAudio: false });
    }
    if (core && core.sw && typeof core.sw.register === "function") {
      core.sw.register("service-worker.js");
    }
