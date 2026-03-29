    // ROUTES
    const BACK_URL = "pages/02-puzzles/enigme2.html";
    const SUCCESS_URL = "pages/02-puzzles/qr-code2.html";
    const PUZZLE_ID = "E2";
    const core = window.TheCampCore || window.TheCamp;

    // Propagation du personnage (si présent)
    const params = new URLSearchParams(window.location.search);
    const selectedCharacter = params.get("char");

    const backBtn = document.getElementById("backBtn");
    const startBtn = document.getElementById("startBtn");
    const stopBtn  = document.getElementById("stopBtn");
    const retryBtn = document.getElementById("retryBtn");
    const cameraSelect = document.getElementById("cameraSelect");
    const resultText = document.getElementById("resultText");
    const statusChip = document.getElementById("statusChip");
    const frameEl = document.getElementById("frame");
    const scanline = document.getElementById("scanline");
    const bridgeMobileBadge = document.getElementById("bridgeMobileBadge");
    const desktopBridgeEl = document.getElementById("desktopBridge");
    const bridgeQrEl = document.getElementById("bridgeQr");
    const bridgeCodeEl = document.getElementById("bridgeCode");
    const bridgeHintEl = document.getElementById("bridgeHint");
    const bridgeRefreshBtn = document.getElementById("bridgeRefreshBtn");

    const bridgeApi = window.TheCampScanBridge || null;
    const bridgeParams = bridgeApi && typeof bridgeApi.getBridgeParams === "function"
      ? bridgeApi.getBridgeParams()
      : { enabled: false, sid: "", sec: "", p: "" };
    const isBridgeMobileMode = !!bridgeParams.enabled;

    let html5Qr = null;
    let isScanning = false;
    let cameras = [];
    let selectedCameraId = "";
    let desktopBridgeListener = null;

    if (isBridgeMobileMode) {
      document.body.classList.add("is-bridge-mobile");
      if (bridgeMobileBadge) bridgeMobileBadge.hidden = false;
    }

    function setStatus(text, mode){
      statusChip.textContent = text;
      statusChip.classList.remove("ok","err");
      if (mode) statusChip.classList.add(mode);
      if (isBridgeMobileMode && bridgeMobileBadge && text) {
        bridgeMobileBadge.textContent = text;
      }
    }
    function setResult(text, mode){
      resultText.textContent = text;
      resultText.classList.remove("ok","err");
      if (mode) resultText.classList.add(mode);
      if (isBridgeMobileMode && bridgeMobileBadge && text) {
        bridgeMobileBadge.textContent = text;
      }
    }

    function setBridgeHint(text){
      if (!bridgeHintEl) return;
      bridgeHintEl.textContent = text;
    }

    function getSuccessTarget(){
      return SUCCESS_URL + (selectedCharacter ? ("?char=" + encodeURIComponent(selectedCharacter)) : "");
    }

    function redirectToSuccess(){
      const target = getSuccessTarget();
      if (desktopBridgeListener && typeof desktopBridgeListener.stop === "function") {
        desktopBridgeListener.stop();
        desktopBridgeListener = null;
      }
      if (core && core.navigation && typeof core.navigation.transitionTo === "function") {
        core.navigation.transitionTo(target, { delay: 520 });
        return;
      }
      window.location.href = target;
    }

    function isDesktopBridgeMode(){
      if (!bridgeApi || typeof bridgeApi.shouldUseDesktopBridge !== "function") return false;
      return bridgeApi.shouldUseDesktopBridge();
    }

    async function initDesktopBridge(){
      if (!isDesktopBridgeMode()) return false;

      if (desktopBridgeEl) desktopBridgeEl.hidden = false;
      document.body.classList.add("is-desktop-bridge");

      startBtn.disabled = true;
      stopBtn.disabled = true;
      retryBtn.disabled = true;
      cameraSelect.disabled = true;

      if (!bridgeApi.isConfigured()) {
        setStatus("Bridge indisponible", "err");
        setResult(bridgeApi.getConfigError(), "err");
        setBridgeHint("Configure scripts/core/bridge-config.js pour activer la sync desktop.");
        return true;
      }

      const bridgeIssue = typeof bridgeApi.getBridgeLinkIssue === "function"
        ? bridgeApi.getBridgeLinkIssue()
        : "";
      if (bridgeIssue) {
        setStatus("Lien mobile invalide", "err");
        setResult(bridgeIssue, "err");
        setBridgeHint("Mets une URL reseau/HTTPS dans mobileBaseUrl.");
        return true;
      }

      if (desktopBridgeListener && typeof desktopBridgeListener.stop === "function") {
        desktopBridgeListener.stop();
      }

      const session = bridgeApi.createDesktopSession(PUZZLE_ID);
      const bridgeUrl = bridgeApi.buildBridgeUrl(session, {
        char: selectedCharacter || ""
      });
      if (!bridgeUrl) {
        setStatus("Lien mobile invalide", "err");
        setResult("Impossible de construire l'URL mobile de liaison.", "err");
        setBridgeHint("Verifie la valeur mobileBaseUrl dans bridge-config.");
        return true;
      }
      const rendered = bridgeApi.renderQr(bridgeQrEl, bridgeUrl);

      if (bridgeCodeEl) bridgeCodeEl.textContent = bridgeUrl;
      if (!rendered) {
        setStatus("QR indisponible", "err");
        setResult("Impossible de generer le QR de liaison.", "err");
        setBridgeHint("Recharge la page ou verifie la librairie qrcode.");
        return true;
      }

      setStatus("En attente mobile", "");
      setResult("Scanne le QR desktop avec ton telephone.", "");
      setBridgeHint("Session active. Le desktop se mettra a jour apres validation mobile.");

      try {
        desktopBridgeListener = await bridgeApi.startDesktopListener({
          session,
          onEvent: ({ type, error }) => {
            if (type === "connected") {
              setStatus("Desktop connecte", "ok");
              return;
            }
            if (type === "disconnected") {
              setStatus("Connexion perdue", "err");
              setBridgeHint("Connexion interrompue. Regenerer le QR.");
              return;
            }
            if (type === "failed") {
              setStatus("Erreur bridge", "err");
              setResult(error || "Impossible de se connecter au bridge.", "err");
            }
          },
          onValidated: () => {
            setStatus("Code valide", "ok");
            setResult("Validation recue sur mobile. Passage a l'etape suivante...", "ok");
            setBridgeHint("Succes mobile confirme.");
            setTimeout(redirectToSuccess, 2600);
          }
        });
      } catch (err) {
        setStatus("Erreur bridge", "err");
        setResult(err && err.message ? err.message : "Bridge indisponible.", "err");
      }

      return true;
    }

    function cinematicTransitionTo(url){
      const destination = url + (selectedCharacter ? ("?char=" + encodeURIComponent(selectedCharacter)) : "");
      if (core && core.navigation && typeof core.navigation.transitionTo === "function") {
        core.navigation.transitionTo(destination, { delay: 520 });
      } else {
        document.body.classList.add("is-transitioning");
        setTimeout(() => {
          window.location.href = destination;
        }, 520);
      }
    }

    function isSecureContextOk(){
      if (location.protocol === "https:") return true;
      if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return true;
      return false;
    }

    async function warmupPermission(){
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
      const w = Math.min(window.innerWidth, 520);
      const size = Math.max(220, Math.min(300, Math.floor(w * 0.62)));
      return { width: size, height: size };
    }

    function clampScanline(){
      const rect = frameEl.getBoundingClientRect();
      const inset = rect.height * 0.12;
      const travel = Math.max(120, rect.height - inset*2);

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

      if (document.body.classList.contains("is-desktop-bridge")) {
        setStatus("Mode desktop", "");
        setResult("Utilise ton telephone pour scanner via le QR de liaison.", "");
        return;
      }

      if (bridgeParams.enabled) {
        if (!bridgeParams.sid || !bridgeParams.sec) {
          setStatus("Lien invalide", "err");
          setResult("Session desktop invalide. Re-scanne le QR desktop.", "err");
          return;
        }
        if (bridgeParams.p && bridgeParams.p !== PUZZLE_ID) {
          setStatus("Mauvaise enigme", "err");
          setResult("Ce lien mobile ne correspond pas a cette enigme.", "err");
          return;
        }
      }

      if (!isSecureContextOk()){
        setStatus("Contexte non sécurisé", "err");
        setResult("Caméra bloquée: ton site doit être en HTTPS (ou localhost).", "err");
        retryBtn.disabled = false;
        return;
      }

      try{
        setStatus("Demande caméra…");
        setResult("Autorisation caméra…", "");
        await warmupPermission();

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

          if (bridgeParams.enabled) {
            const published = await bridgeApi.publishMobileValidation({
              sid: bridgeParams.sid,
              sec: bridgeParams.sec,
              puzzleId: PUZZLE_ID
            });

            if (!published.ok) {
              setStatus("Sync impossible", "err");
              setResult(published.error || "Impossible de notifier le desktop.", "err");
              return;
            }

            await stopScan(true);
            setStatus("Validation envoyee", "ok");
            setResult("Desktop valide. Tu peux revenir sur l'ordinateur.", "ok");
            if (bridgeMobileBadge) {
              bridgeMobileBadge.textContent = "Validation OK. Retourne sur l'ordinateur.";
            }
            setTimeout(redirectToSuccess, 1800);
            return;
          }

          await stopScan(true);
          setResult("Code valide. Redirection...", "ok");

          setTimeout(redirectToSuccess, 650);
        };

        const onScanFailure = () => { /* silencieux */ };

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

    if (bridgeRefreshBtn) {
      bridgeRefreshBtn.addEventListener("click", async () => {
        await initDesktopBridge();
      });
    }

    cameraSelect.addEventListener("change", async (e) => {
      selectedCameraId = e.target.value || "";
      setStatus("Caméra sélectionnée", "");
      setResult(selectedCameraId ? "Changement caméra… (réessaie le scan)" : "Mode auto (arrière).", "");
      if (isScanning){
        await stopScan(true);
        await startScan();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && isScanning) stopScan(true);
    });

    // Boot
    if (bridgeParams.enabled) {
      setStatus("Mode mobile", "");
      setResult("Scanne le QR physique pour valider le desktop.", "");
      window.setTimeout(() => {
        startScan();
      }, 240);
    } else {
      setStatus("Pret", "");
      setResult("Appuie sur Demarrer le scan.", "");
    }

    initDesktopBridge();

    if (core && core.boot) {
      core.boot({ autoBindNav: false, autoResumeAudio: false });
    }
    if (core && core.sw && typeof core.sw.register === "function") {
      core.sw.register("service-worker.js");
    }
