      const core = window.TheCampCore || window.TheCamp;
      if (core && core.boot) core.boot({ autoBindNav: false, autoResumeAudio: false });
      if (core && core.sw && typeof core.sw.register === "function") core.sw.register("service-worker.js");
