(function initTheCampBridgeConfig(global) {
  "use strict";

  if (global.THE_CAMP_BRIDGE_CONFIG) return;

  global.THE_CAMP_BRIDGE_CONFIG = {
    ablyKey: "4qU0mg.kOcgeQ:OO1G7v9_o4YlEkrRmwALBCrMqLnX0vIot1JhvUzZl3c",
    channelPrefix: "thecamp:scan",
    sessionTtlSec: 180,
    desktopMinWidth: 980,
    mobileBaseUrl: ["https://the-camp-but-info.netlify.app","http://localhost:5500","https://urw-dispatched-feeling-existing.trycloudflare.com", "http://127.0.0.1:5500", "http://10.188.217.14:5500"]
  };
})(window);
