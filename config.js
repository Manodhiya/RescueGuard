/* RescueGuard settings. The token can also be pasted in the web page. */
const CONFIG = {
  TOKEN: "PASTE_YOUR_BLYNK_AUTH_TOKEN_HERE",
  SERVER: "blynk.cloud",          // India users can also try "blr1.blynk.cloud"
  PINS: {                         // matches your ESP32 code
    temp:      "V0",
    gasStatus: "V1",
    gasLevel:  "V2",
    fall:      "V3",
    sos:       "V4",
    overall:   "V5"
  },
  TEMP_WARN: 40,                  // same as your ESP32 thresholds
  TEMP_EMERGENCY: 50,
  POLL_MS: 1000,
  LATCH_MS: 15000                 // keep fall / SOS alerts on screen this long
};
/* ===================================== */
