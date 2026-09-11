const MODEL_URL =
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const statusEl = document.getElementById("status");
const memeWrap = document.getElementById("memeWrap");
const scoresEl = document.getElementById("scores");
const soundToggle = document.getElementById("soundToggle");

let pose = null;
let hands = null;
let latestPoseLandmarks = null;
let latestHandsLandmarks = null; // array of hands, each an array of 21 landmarks
let isDetecting = false;

// ---------------------------------------------------------------
// SOUND EFFECTS (synthesized with Web Audio API — no audio files
// needed, so nothing to go missing). Each mood/gesture key maps to
// a little function that plays a short, distinct sound.
// To customize: edit/add entries in SOUND_LIBRARY, then reference
// the key via `sound: "yourKey"` on any entry in memes.js.
// To use real audio files instead: drop files in a sounds/ folder
// and swap a library entry's body for `new Audio("sounds/x.mp3").play()`.
// ---------------------------------------------------------------
let audioCtx = null;
let soundEnabled = true;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone({ freq = 440, duration = 0.15, type = "sine", startGain = 0.2, delay = 0, glideTo = null }) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  const t0 = ctx.currentTime + delay;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(glideTo, 1), t0 + duration);
  }
  gain.gain.setValueAtTime(startGain, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

const SOUND_LIBRARY = {
  happy: () => {
    // cheerful little ascending arpeggio
    [523, 659, 784, 1047].forEach((freq, i) =>
      playTone({ freq, duration: 0.14, type: "triangle", startGain: 0.18, delay: i * 0.07 })
    );
  },
  sad: () => {
    // classic descending "sad trombone" glide
    playTone({ freq: 300, glideTo: 110, duration: 0.9, type: "sawtooth", startGain: 0.15 });
  },
  angry: () => {
    // harsh short buzz
    playTone({ freq: 90, duration: 0.25, type: "sawtooth", startGain: 0.25 });
    playTone({ freq: 80, duration: 0.25, type: "square", startGain: 0.15, delay: 0.05 });
  },
  surprised: () => {
    // quick upward chime
    playTone({ freq: 700, glideTo: 1400, duration: 0.18, type: "sine", startGain: 0.22 });
  },
  disgusted: () => {
    // wobbly descending "eww"
    playTone({ freq: 260, glideTo: 150, duration: 0.35, type: "square", startGain: 0.15 });
  },
  fearful: () => {
    // tense rising sting
    playTone({ freq: 220, glideTo: 440, duration: 0.4, type: "sawtooth", startGain: 0.14 });
  },
  neutral: () => {
    // soft, barely-there tick
    playTone({ freq: 500, duration: 0.06, type: "sine", startGain: 0.06 });
  },
  shush: () => {
    playTone({ freq: 900, duration: 0.1, type: "sine", startGain: 0.12 });
  },
  flex: () => {
    // rising "power up"
    playTone({ freq: 150, glideTo: 500, duration: 0.5, type: "sawtooth", startGain: 0.2 });
  },
  shook: () => {
    // sharp gasp-like blip
    playTone({ freq: 1000, glideTo: 600, duration: 0.15, type: "triangle", startGain: 0.2 });
  }
};

if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    // First click also unlocks the AudioContext per browser autoplay policy
    getAudioCtx();
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? "🔊 Sound on" : "🔇 Sound off";
    soundToggle.setAttribute("aria-pressed", String(soundEnabled));
    soundToggle.classList.toggle("muted", !soundEnabled);
    if (soundEnabled) playSound("neutral");
  });
}

function playSound(key) {
  if (!soundEnabled) return;
  const fn = SOUND_LIBRARY[key];
  if (fn) {
    try {
      fn();
    } catch (err) {
      console.warn("Sound playback error:", err);
    }
  }
}

// ---------------------------------------------------------------
// DETECTION TUNING: Latency vs Accuracy
// ---------------------------------------------------------------
// Exponential Moving Average (EMA, alpha = 0.42) gives recent frames
// dominant weight, reacting to real expressions in ~350-450ms (~0.4-0.5s)
// while filtering out single-frame twitches and flicker.
// ---------------------------------------------------------------
const EMA_ALPHA = 0.42;
const SWITCH_STREAK_NEEDED = 2;
const MIN_CONFIDENCE = 0.40;
const TARGET_INTERVAL_MS = 110;

let smoothedScores = null;
let candidateExpression = null;
let candidateStreak = 0;
let confirmedExpression = "neutral";
let lastDisplayedKey = null;

// ---------------------------------------------------------------
// EXTENSIBLE POSE/HAND GESTURE SYSTEM
// ---------------------------------------------------------------
// GESTURE_DETECTORS maps gesture keys to their landmark detection functions.
// Each detector receives { pose: latestPoseLandmarks, hands: latestHandsLandmarks,
// faceBox: <face-api detection box or null> } and returns true/false.
//
// To add a new gesture (e.g. anime poses, domain expansion, etc.):
// 1. Add a config entry in memes.js: `gestures: { my_gesture: { image: "...", label: "..." } }`
// 2. Add a detector function below and register it in `GESTURE_DETECTORS`.
// That's it! Smoothing, priority handling, and overlay feedback are automatic.
// ---------------------------------------------------------------

const GESTURE_STREAK_NEEDED = 2; // consecutive frames of gesture to activate
const GESTURE_RELEASE_STREAK = 2; // consecutive frames without gesture to deactivate

let currentActiveGesture = null;
let candidateGesture = null;
let gesturePositiveStreak = 0;
let gestureNegativeStreak = 0;

// Build the score bar rows once
EXPRESSION_ORDER.forEach((key) => {
  const row = document.createElement("div");
  row.className = "score-row";
  row.innerHTML = `
    <div class="score-label">${key}</div>
    <div class="score-bar-bg"><div class="score-bar-fill" id="bar-${key}"></div></div>
  `;
  scoresEl.appendChild(row);
});

// Build the "how to trigger" guide grid from MEME_MAP so it always
// stays in sync with whatever moods/gestures are configured.
const guideGrid = document.getElementById("guideGrid");
if (guideGrid) {
  const guideKeys = [...EXPRESSION_ORDER, ...Object.keys(GESTURE_MAP)];
  guideKeys.forEach((key) => {
    const config = MEME_MAP[key];
    if (!config) return;
    const variant = (config.variants && config.variants[0]) || config;
    const emoji = variant.emoji || "🙂";
    const label = variant.label || key;
    const how = config.how || "Make the matching face or gesture";

    const card = document.createElement("div");
    card.className = "guide-card";
    card.innerHTML = `
      <div class="guide-emoji">${emoji}</div>
      <div class="guide-text">
        <div class="guide-label">${label}</div>
        <div class="guide-how">${how}</div>
      </div>
    `;
    guideGrid.appendChild(card);
  });
}

// ---------------------------------------------------------------
// GEOMETRIC UTILITIES
// ---------------------------------------------------------------
/**
 * Calculates the angle (in degrees) at joint `b` between segments `ba` and `bc`.
 * e.g., for shoulder (a), elbow (b), wrist (c) to get the elbow flexion angle.
 */
function calculateAngle(a, b, c) {
  if (!a || !b || !c) return null;
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}

function dist2D(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

// ---------------------------------------------------------------
// GESTURE DETECTOR FUNCTIONS
// ---------------------------------------------------------------

/**
 * Bicep Flex: Triggered when EITHER arm has an elbow angle bent roughly 65-115°
 * AND the wrist is positioned at or above shoulder height.
 * Uses MediaPipe Pose (arm/elbow tracking is Pose's strength, not Hands').
 * Left arm:  Shoulder=11, Elbow=13, Wrist=15
 * Right arm: Shoulder=12, Elbow=14, Wrist=16
 */
function detectBicepFlex({ pose }) {
  if (!pose || pose.length < 23) return false;

  const minVis = 0.35;
  const isVisible = (p) =>
    p && (p.visibility === undefined || p.visibility > minVis);

  function checkArm(shoulder, elbow, wrist) {
    if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) return false;
    const angle = calculateAngle(shoulder, elbow, wrist);
    const wristAtOrAboveShoulder = wrist.y <= shoulder.y + 0.06;
    const wristAboveElbow = wrist.y < elbow.y;
    return angle >= 65 && angle <= 115 && wristAtOrAboveShoulder && wristAboveElbow;
  }

  const leftFlex = checkArm(pose[11], pose[13], pose[15]);
  const rightFlex = checkArm(pose[12], pose[14], pose[16]);

  return leftFlex || rightFlex;
}

/**
 * Index Finger Up ("shush" / "wait"):
 * Uses MediaPipe Hands (21 real landmarks per hand — actual finger joints,
 * not Pose's coarse 4-point hand approximation).
 * Hand landmark indices: wrist=0, index MCP/PIP/DIP/TIP=5/6/7/8,
 * middle=9/10/11/12, ring=13/14/15/16, pinky=17/18/19/20.
 * Rule: index finger extended (tip well above pip) AND middle/ring/pinky curled
 * (tip below/level with their pip — folded down).
 */
function isFingerExtended(landmarks, pipIdx, tipIdx, margin = 0.03) {
  const pip = landmarks[pipIdx];
  const tip = landmarks[tipIdx];
  if (!pip || !tip) return false;
  return tip.y < pip.y - margin; // tip clearly above pip (normalized y, 0 = top)
}

function isFingerCurled(landmarks, pipIdx, tipIdx, margin = 0.0) {
  const pip = landmarks[pipIdx];
  const tip = landmarks[tipIdx];
  if (!pip || !tip) return false;
  return tip.y > pip.y - margin; // tip at or below pip — folded down
}

function detectIndexUpForHand(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;

  const indexExtended = isFingerExtended(landmarks, 6, 8);
  const middleCurled = isFingerCurled(landmarks, 10, 12);
  const ringCurled = isFingerCurled(landmarks, 14, 16);
  const pinkyCurled = isFingerCurled(landmarks, 18, 20);

  return indexExtended && middleCurled && ringCurled && pinkyCurled;
}

function detectIndexUp({ hands }) {
  if (!hands || hands.length === 0) return false;
  return hands.some((h) => detectIndexUpForHand(h));
}

/**
 * Finger in Mouth ("shook" monkey pose):
 * Uses MediaPipe Hands for a precise fingertip position, checked against the
 * face-api.js detection box (lower-middle region approximates the mouth).
 * Both landmark sets are normalized to the video's pixel dimensions first,
 * since Hands landmarks are normalized [0,1] and the face box is in raw
 * video pixel coordinates.
 */
function detectFingerMouth({ hands, faceBox, videoWidth, videoHeight }) {
  if (!hands || hands.length === 0 || !faceBox || !videoWidth || !videoHeight) {
    return false;
  }

  // Approximate mouth position: horizontally centered, in the lower third of the face box
  const mouthPoint = {
    x: (faceBox.x + faceBox.width / 2) / videoWidth,
    y: (faceBox.y + faceBox.height * 0.78) / videoHeight
  };

  const NEAR_MOUTH_THRESHOLD = 0.09; // normalized distance — generous but face-scaled

  return hands.some((landmarks) => {
    const indexTip = landmarks[8];
    if (!indexTip) return false;
    return dist2D(indexTip, mouthPoint) < NEAR_MOUTH_THRESHOLD;
  });
}

function isThumbExtended(landmarks, margin = 1.15) {
  const tip = landmarks[4];
  const ip = landmarks[3];
  const wrist = landmarks[0];
  if (!tip || !ip || !wrist) return false;
  // Thumb moves sideways rather than up/down, so compare distance-from-wrist
  // of the tip vs the IP joint instead of a simple y-comparison.
  return dist2D(tip, wrist) > dist2D(ip, wrist) * margin;
}

function detectFist({ hands }) {
  if (!hands || hands.length === 0) return false;
  return hands.some((h) => {
    if (!h || h.length < 21) return false;
    const allFingersCurled =
      isFingerCurled(h, 6, 8) &&
      isFingerCurled(h, 10, 12) &&
      isFingerCurled(h, 14, 16) &&
      isFingerCurled(h, 18, 20);
    return allFingersCurled && !isThumbExtended(h);
  });
}

/**
 * Rockstar 🤘: thumb + pinky extended, index/middle/ring curled.
 */
function detectRockstar({ hands }) {
  if (!hands || hands.length === 0) return false;
  return hands.some((h) => {
    if (!h || h.length < 21) return false;
    return (
      isThumbExtended(h) &&
      isFingerExtended(h, 18, 20) &&
      isFingerCurled(h, 6, 8) &&
      isFingerCurled(h, 10, 12) &&
      isFingerCurled(h, 14, 16)
    );
  });
}

/**
 * Open Palm ("i have no monies"): all 5 fingers extended, hand held
 * away from the face (so it doesn't collide with finger_mouth / kidnap-cat).
 */
function detectOpenPalm({ hands, faceBox, videoWidth, videoHeight }) {
  if (!hands || hands.length === 0) return false;
  return hands.some((h) => {
    if (!h || h.length < 21) return false;
    const allExtended =
      isThumbExtended(h) &&
      isFingerExtended(h, 6, 8) &&
      isFingerExtended(h, 10, 12) &&
      isFingerExtended(h, 14, 16) &&
      isFingerExtended(h, 18, 20);
    if (!allExtended) return false;
    if (faceBox && videoWidth && videoHeight) {
      const wrist = h[0];
      const faceCenter = {
        x: (faceBox.x + faceBox.width / 2) / videoWidth,
        y: (faceBox.y + faceBox.height / 2) / videoHeight
      };
      if (dist2D(wrist, faceCenter) < 0.25) return false; // too close to face
    }
    return true;
  });
}

/**
 * Fingers Together ("muehehe"): both hands up with index fingers
 * extended and their tips touching (classic villain steepled-fingers pose).
 * Threshold is intentionally generous (0.15) because when the tips
 * actually touch, MediaPipe's hand tracker often loses precise landmark
 * accuracy for the overlapping hand.
 */
const FINGERS_TOGETHER_THRESHOLD = 0.15;

function detectFingersTogether({ hands }) {
  if (!hands || hands.length < 2) return false;
  const bothIndexUp = hands.every((h) => detectIndexUpForHand(h));
  if (!bothIndexUp) return false;
  const tip0 = hands[0][8];
  const tip1 = hands[1][8];
  if (!tip0 || !tip1) return false;
  lastFingersTogetherDistance = dist2D(tip0, tip1);
  return lastFingersTogetherDistance < FINGERS_TOGETHER_THRESHOLD;
}
let lastFingersTogetherDistance = null;

/**
 * Devastated Cat: both hands raised above the top of the head.
 * Uses MediaPipe Pose — nose(0), wrists(15,16).
 */
function detectHandsAboveHead({ pose }) {
  if (!pose || pose.length < 17) return false;
  const nose = pose[0];
  const leftWrist = pose[15];
  const rightWrist = pose[16];
  if (!nose || !leftWrist || !rightWrist) return false;
  return leftWrist.y < nose.y - 0.05 && rightWrist.y < nose.y - 0.05;
}

/**
 * Crash Out Cat: both hands raised beside the face (roughly shoulder-to-nose
 * height) but NOT above the head — distinguishes it from devastated cat.
 */
function detectHandsBesideFace({ pose }) {
  if (!pose || pose.length < 17) return false;
  const nose = pose[0];
  const leftShoulder = pose[11];
  const rightShoulder = pose[12];
  const leftWrist = pose[15];
  const rightWrist = pose[16];
  if (!nose || !leftShoulder || !rightShoulder || !leftWrist || !rightWrist) return false;
  const atFaceLevel = (wrist, shoulder) => wrist.y >= nose.y - 0.05 && wrist.y <= shoulder.y + 0.05;
  return atFaceLevel(leftWrist, leftShoulder) && atFaceLevel(rightWrist, rightShoulder);
}

/**
 * Kidnap Cat: one hand held close to/over the face, regardless of finger
 * shape (broader than finger_mouth, which needs a specific fingertip
 * near the mouth). Checked after the more specific hand-shape gestures
 * so it only catches "hand generally over face" cases they don't.
 */
function detectHandCoverFace({ hands, faceBox, videoWidth, videoHeight }) {
  if (!hands || hands.length === 0 || !faceBox || !videoWidth || !videoHeight) return false;
  const faceCenter = {
    x: (faceBox.x + faceBox.width / 2) / videoWidth,
    y: (faceBox.y + faceBox.height / 2) / videoHeight
  };
  const COVER_THRESHOLD = 0.15;
  return hands.some((h) => {
    const wrist = h && h[0];
    if (!wrist) return false;
    return dist2D(wrist, faceCenter) < COVER_THRESHOLD;
  });
}

/**
 * Side Eye: head turned to one side while still facing the camera.
 * Approximated with MediaPipe Pose by comparing the nose's horizontal
 * position against the midpoint of the shoulders — a meaningful
 * offset means the head (and gaze) has turned.
 */
function detectSideEye({ pose }) {
  if (!pose || pose.length < 13) return false;
  const nose = pose[0];
  const leftShoulder = pose[11];
  const rightShoulder = pose[12];
  if (!nose || !leftShoulder || !rightShoulder) return false;
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x) || 0.2;
  const offset = Math.abs(nose.x - shoulderMidX) / shoulderWidth;
  return offset > 0.22;
}

// ---------------------------------------------------------------
// GESTURE REGISTRY
// ---------------------------------------------------------------
// Order matters: more specific gestures should be listed before more
// general ones that could also match the same hand pose (e.g. a finger
// near the mouth also looks like "index up" — finger_mouth must be
// checked first so it isn't shadowed). side_eye is checked last since
// it's the most general (just a head turn) and shouldn't override a
// more specific hand gesture happening at the same time.
const GESTURE_DETECTORS = {
  finger_mouth: detectFingerMouth,
  fingers_together: detectFingersTogether,
  rockstar: detectRockstar,
  fist: detectFist,
  hand_cover_face: detectHandCoverFace,
  open_palm: detectOpenPalm,
  index_up: detectIndexUp,
  hands_above_head: detectHandsAboveHead,
  hands_beside_face: detectHandsBesideFace,
  bicep_flex: detectBicepFlex,
  side_eye: detectSideEye
  // Future gestures (e.g. anime poses) are added here with 1 line:
  // your_gesture: detectYourGesture
};

function evaluateGestures(context) {
  for (const [gestureKey, detectorFn] of Object.entries(GESTURE_DETECTORS)) {
    if (GESTURE_MAP[gestureKey] && detectorFn(context)) {
      return gestureKey;
    }
  }
  return null;
}

function processGestureDetection(rawGestureKey) {
  if (rawGestureKey) {
    gestureNegativeStreak = 0;
    if (rawGestureKey === candidateGesture) {
      gesturePositiveStreak += 1;
    } else {
      candidateGesture = rawGestureKey;
      gesturePositiveStreak = 1;
    }

    if (gesturePositiveStreak >= GESTURE_STREAK_NEEDED) {
      currentActiveGesture = candidateGesture;
    }
  } else {
    gesturePositiveStreak = 0;
    gestureNegativeStreak += 1;
    if (gestureNegativeStreak >= GESTURE_RELEASE_STREAK) {
      currentActiveGesture = null;
      candidateGesture = null;
    }
  }

  return currentActiveGesture;
}

// ---------------------------------------------------------------
// MODEL INITIALIZATION & CAMERA
// ---------------------------------------------------------------
async function loadModels() {
  statusEl.textContent = "Loading face, pose & hand models…";

  // Initialize MediaPipe Pose (arm tracking for bicep_flex)
  if (typeof Pose !== "undefined") {
    pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    pose.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    pose.onResults((results) => {
      latestPoseLandmarks =
        results.poseLandmarks && results.poseLandmarks.length > 0
          ? results.poseLandmarks
          : null;
    });
  } else {
    console.warn("MediaPipe Pose library not loaded.");
  }

  // Initialize MediaPipe Hands (finger tracking for index_up / finger_mouth)
  if (typeof Hands !== "undefined") {
    hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0, // lite model — keeps 3-model pipeline responsive
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    hands.onResults((results) => {
      latestHandsLandmarks =
        results.multiHandLandmarks && results.multiHandLandmarks.length > 0
          ? results.multiHandLandmarks
          : null;
    });
  } else {
    console.warn("MediaPipe Hands library not loaded.");
  }

  // Load face-api models
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
  ]);

  statusEl.textContent = "Models loaded. Starting camera…";
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } }
    });
    video.srcObject = stream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });
  } catch (err) {
    statusEl.textContent =
      "Could not access webcam. Check browser permissions and reload.";
    throw err;
  }
}

// ---------------------------------------------------------------
// UI & DISPLAY CONTROLLERS
// ---------------------------------------------------------------
function pickVariant(config) {
  if (config.variants && config.variants.length > 0) {
    const idx = Math.floor(Math.random() * config.variants.length);
    return config.variants[idx];
  }
  return config;
}

function pickMedia(config) {
  if (config.media && config.media.length > 0) {
    const idx = Math.floor(Math.random() * config.media.length);
    return config.media[idx];
  }
  return null;
}

function updateMeme(key) {
  if (key === lastDisplayedKey) return;
  lastDisplayedKey = key;

  const config = MEME_MAP[key] || MEME_CONFIG.expressions.neutral;
  const media = pickMedia(config);

  if (media && media.video) {
    memeWrap.innerHTML = `
      <video class="meme-img" autoplay loop muted playsinline>
        <source src="${media.video}" />
      </video>
    `;
  } else if (media && media.image) {
    memeWrap.innerHTML = `<img class="meme-img" src="${media.image}" alt="${key}" />`;
  } else {
    const variant = pickVariant(config);
    memeWrap.innerHTML = `
      <div class="meme-emoji" id="memeEmoji">${variant.emoji || "🙂"}</div>
      <div class="meme-label" id="memeLabel">${variant.label || key}</div>
      <div class="meme-caption" id="memeCaption">${variant.caption || ""}</div>
    `;
  }

  playSound(config.sound || key);
}

function updateScores(expressions) {
  EXPRESSION_ORDER.forEach((key) => {
    const bar = document.getElementById(`bar-${key}`);
    if (!bar) return;
    const value = expressions[key] || 0;
    bar.style.width = `${Math.round(value * 100)}%`;
  });
}

function pickDominant(expressions) {
  let best = "neutral";
  let bestScore = -1;
  for (const key of EXPRESSION_ORDER) {
    const val = expressions[key] || 0;
    if (val > bestScore) {
      bestScore = val;
      best = key;
    }
  }
  return { best, bestScore };
}

function processExpressions(rawExpressions) {
  if (!smoothedScores) {
    smoothedScores = {};
    EXPRESSION_ORDER.forEach((k) => {
      smoothedScores[k] = rawExpressions[k] || 0;
    });
  } else {
    EXPRESSION_ORDER.forEach((k) => {
      const raw = rawExpressions[k] || 0;
      smoothedScores[k] =
        EMA_ALPHA * raw + (1 - EMA_ALPHA) * (smoothedScores[k] || 0);
    });
  }

  updateScores(smoothedScores);
  const { best, bestScore } = pickDominant(smoothedScores);

  if (bestScore < MIN_CONFIDENCE) {
    return {
      detected: confirmedExpression,
      confidence: bestScore,
      confirmed: confirmedExpression
    };
  }

  if (best === candidateExpression) {
    candidateStreak += 1;
  } else {
    candidateExpression = best;
    candidateStreak = 1;
  }

  if (candidateStreak >= SWITCH_STREAK_NEEDED) {
    confirmedExpression = best;
  }

  return {
    detected: best,
    confidence: bestScore,
    confirmed: confirmedExpression
  };
}

// ---------------------------------------------------------------
// MAIN DETECTION LOOP
// ---------------------------------------------------------------
async function detectLoop() {
  if (isDetecting) return;
  isDetecting = true;

  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320 });

  async function step() {
    if (!isDetecting) return;
    const startTime = performance.now();

    try {
      if (video.readyState >= 2) {
        const displaySize = {
          width: video.videoWidth || video.clientWidth,
          height: video.videoHeight || video.clientHeight
        };

        if (
          overlay.width !== displaySize.width ||
          overlay.height !== displaySize.height
        ) {
          overlay.width = displaySize.width;
          overlay.height = displaySize.height;
          faceapi.matchDimensions(overlay, displaySize);
        }

        // 1. Run face detection
        const faceResult = await faceapi
          .detectSingleFace(video, options)
          .withFaceExpressions();

        // 2. Run pose detection (arms)
        if (pose) {
          await pose.send({ image: video });
        }

        // 3. Run hands detection (fingers)
        if (hands) {
          await hands.send({ image: video });
        }

        // 4. Evaluate gestures with full context
        const gestureContext = {
          pose: latestPoseLandmarks,
          hands: latestHandsLandmarks,
          faceBox: faceResult ? faceResult.detection.box : null,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        };
        const rawGesture = evaluateGestures(gestureContext);
        const activeGesture = processGestureDetection(rawGesture);

        // 5. Evaluate Facial Expressions
        let faceSummary = null;
        if (faceResult) {
          faceSummary = processExpressions(faceResult.expressions);
        }

        // ---------------------------------------------------------------
        // PRIORITY LOGIC: Gestures override Facial Expressions
        // ---------------------------------------------------------------
        if (activeGesture) {
          updateMeme(activeGesture);
          const gestureConfig = GESTURE_MAP[activeGesture];
          const label = gestureConfig ? gestureConfig.label : activeGesture;
          statusEl.textContent = `Detected gesture: ${label} (Priority)`;
        } else if (faceSummary) {
          updateMeme(faceSummary.confirmed);
          statusEl.textContent = `Detected: ${faceSummary.confirmed} (${Math.round(faceSummary.confidence * 100)}%)`;
        } else {
          statusEl.textContent = "No face or gesture detected — center yourself in frame";
        }

        // Debug readout: shows the live fingertip distance for the
        // muehehe ("fingers_together") gesture whenever 2 hands are
        // visible, so the threshold can be tuned if it's too strict/loose.
        if (latestHandsLandmarks && latestHandsLandmarks.length === 2 && lastFingersTogetherDistance !== null) {
          statusEl.textContent += ` — fingertip dist: ${lastFingersTogetherDistance.toFixed(3)} (need < ${FINGERS_TOGETHER_THRESHOLD})`;
        }

        // ---------------------------------------------------------------
        // CANVAS OVERLAY RENDERING: Face box + Pose skeleton + Hand landmarks
        // ---------------------------------------------------------------
        const ctx = overlay.getContext("2d");
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        // Render face detection
        if (faceResult) {
          const resized = faceapi.resizeResults(faceResult, displaySize);
          faceapi.draw.drawDetections(overlay, resized);
        }

        // Render pose skeleton
        if (latestPoseLandmarks) {
          if (window.drawConnectors && window.POSE_CONNECTIONS) {
            drawConnectors(ctx, latestPoseLandmarks, POSE_CONNECTIONS, {
              color: activeGesture === "bicep_flex" ? "#ffd23f" : "rgba(255, 255, 255, 0.4)",
              lineWidth: 2
            });
          }
          if (window.drawLandmarks) {
            drawLandmarks(ctx, latestPoseLandmarks, {
              color: activeGesture === "bicep_flex" ? "#ff5d5d" : "rgba(255, 210, 63, 0.7)",
              lineWidth: 1,
              radius: 3
            });
          }

          if (activeGesture === "bicep_flex") {
            [11, 12, 13, 14, 15, 16].forEach((idx) => {
              const p = latestPoseLandmarks[idx];
              if (p) {
                ctx.beginPath();
                ctx.arc(p.x * overlay.width, p.y * overlay.height, 8, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(255, 210, 63, 0.85)";
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            });
          }
        }

        // Render hand landmarks
        if (latestHandsLandmarks) {
          latestHandsLandmarks.forEach((handLandmarks) => {
            if (window.drawConnectors && window.HAND_CONNECTIONS) {
              drawConnectors(ctx, handLandmarks, HAND_CONNECTIONS, {
                color:
                  activeGesture === "index_up" || activeGesture === "finger_mouth"
                    ? "#ffd23f"
                    : "rgba(255, 255, 255, 0.4)",
                lineWidth: 2
              });
            }
            if (window.drawLandmarks) {
              drawLandmarks(ctx, handLandmarks, {
                color:
                  activeGesture === "index_up" || activeGesture === "finger_mouth"
                    ? "#ff5d5d"
                    : "rgba(255, 210, 63, 0.7)",
                lineWidth: 1,
                radius: 2.5
              });
            }
          });

          if (activeGesture === "index_up" || activeGesture === "finger_mouth") {
            latestHandsLandmarks.forEach((handLandmarks) => {
              const tip = handLandmarks[8];
              if (tip) {
                ctx.beginPath();
                ctx.arc(tip.x * overlay.width, tip.y * overlay.height, 9, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(255, 93, 93, 0.85)";
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            });
          }
        }
      }
    } catch (err) {
      console.warn("Detection frame error:", err);
    }

    const elapsed = performance.now() - startTime;
    const nextDelay = Math.max(10, TARGET_INTERVAL_MS - elapsed);
    setTimeout(step, nextDelay);
  }

  step();
}

(async function init() {
  try {
    await loadModels();
    await startCamera();
    statusEl.textContent = "Camera ready — analyzing expressions and gestures…";

    video.addEventListener(
      "playing",
      () => {
        overlay.width = video.videoWidth || video.clientWidth;
        overlay.height = video.videoHeight || video.clientHeight;
        detectLoop();
      },
      { once: true }
    );

    if (!video.paused && video.readyState >= 2) {
      overlay.width = video.videoWidth || video.clientWidth;
      overlay.height = video.videoHeight || video.clientHeight;
      detectLoop();
    }
  } catch (err) {
    console.error("Initialization error:", err);
  }
})();
