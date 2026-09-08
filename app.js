const MODEL_URL =
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const statusEl = document.getElementById("status");
const memeWrap = document.getElementById("memeWrap");
const scoresEl = document.getElementById("scores");

let pose = null;
let hands = null;
let latestPoseLandmarks = null;
let latestHandsLandmarks = null; // array of hands, each an array of 21 landmarks
let isDetecting = false;

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

// ---------------------------------------------------------------
// GESTURE REGISTRY
// ---------------------------------------------------------------
// Order matters: more specific gestures should be listed before more
// general ones that could also match the same hand pose (e.g. a finger
// near the mouth also looks like "index up" — finger_mouth must be
// checked first so it isn't shadowed).
const GESTURE_DETECTORS = {
  bicep_flex: detectBicepFlex,
  finger_mouth: detectFingerMouth,
  index_up: detectIndexUp
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
function updateMeme(key) {
  if (key === lastDisplayedKey) return;
  lastDisplayedKey = key;

  const config = MEME_MAP[key] || MEME_CONFIG.expressions.neutral;

  if (config.image) {
    memeWrap.innerHTML = `<img class="meme-img" src="${config.image}" alt="${config.label}" />`;
  } else {
    memeWrap.innerHTML = `
      <div class="meme-emoji" id="memeEmoji">${config.emoji || "🙂"}</div>
      <div class="meme-label" id="memeLabel">${config.label}</div>
      <div class="meme-caption" id="memeCaption">${config.caption || ""}</div>
    `;
  }
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
