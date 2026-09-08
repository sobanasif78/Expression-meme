const MODEL_URL =
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const statusEl = document.getElementById("status");
const memeWrap = document.getElementById("memeWrap");
const memeEmoji = document.getElementById("memeEmoji");
const memeLabel = document.getElementById("memeLabel");
const memeCaption = document.getElementById("memeCaption");
const scoresEl = document.getElementById("scores");

let lastExpression = null;
let detectionInterval = null;

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

async function loadModels() {
  statusEl.textContent = "Loading models…";
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
  ]);
  statusEl.textContent = "Models loaded. Starting camera…";
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
    });
  } catch (err) {
    statusEl.textContent =
      "Could not access webcam. Check browser permissions and reload.";
    throw err;
  }
}

function updateMeme(expression) {
  if (expression === lastExpression) return;
  lastExpression = expression;

  const config = MEME_MAP[expression] || MEME_MAP.neutral;

  if (config.image) {
    memeWrap.innerHTML = `<img class="meme-img" src="${config.image}" alt="${config.label}" />`;
  } else {
    memeWrap.innerHTML = `
      <div class="meme-emoji" id="memeEmoji">${config.emoji}</div>
      <div class="meme-label" id="memeLabel">${config.label}</div>
      <div class="meme-caption" id="memeCaption">${config.caption}</div>
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
  return best;
}

async function detectLoop() {
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(overlay, displaySize);

  detectionInterval = setInterval(async () => {
    const result = await faceapi
      .detectSingleFace(video, options)
      .withFaceExpressions();

    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (result) {
      const resized = faceapi.resizeResults(result, displaySize);
      faceapi.draw.drawDetections(overlay, resized);

      const dominant = pickDominant(result.expressions);
      updateMeme(dominant);
      updateScores(result.expressions);
      statusEl.textContent = `Detected: ${dominant}`;
    } else {
      statusEl.textContent = "No face detected — center yourself in frame";
    }
  }, 300);
}

(async function init() {
  await loadModels();
  await startCamera();
  statusEl.textContent = "Camera ready — analyzing expressions…";
  video.addEventListener(
    "play",
    () => {
      overlay.width = video.clientWidth;
      overlay.height = video.clientHeight;
      detectLoop();
    },
    { once: true }
  );
})();
