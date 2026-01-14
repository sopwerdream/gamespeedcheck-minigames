/**
 * Aim Test (Web) — GameSpeedCheck
 * - 30s round
 * - 1 target at a time
 * - hit +10
 * - miss -2
 * - target shrinks over time
 * - metrics: score, accuracy, hits/misses, time left
 * - No build tool. Works on GitHub Pages.
 * - Optional: postMessage to parent (Bolt embed)
 */

const stage = document.getElementById("stage");
const target = document.getElementById("target");

const overlay = document.getElementById("overlay");
const resultOverlay = document.getElementById("resultOverlay");

const startBtn = document.getElementById("startBtn");
const practiceBtn = document.getElementById("practiceBtn");
const retryBtn = document.getElementById("retryBtn");
const copyBtn = document.getElementById("copyBtn");

const timeLeftEl = document.getElementById("timeLeft");
const scoreEl = document.getElementById("score");
const accuracyEl = document.getElementById("accuracy");
const hitsEl = document.getElementById("hits");
const missesEl = document.getElementById("misses");

const rScore = document.getElementById("rScore");
const rAcc = document.getElementById("rAcc");
const rHits = document.getElementById("rHits");
const rMisses = document.getElementById("rMisses");
const rNote = document.getElementById("rNote");

// ---------------------------
// Game Config
// ---------------------------
const ROUND_SECONDS = 30.0;

const SCORE_HIT = 10;
const SCORE_MISS = -2;

// Target size shrinks over time:
const SIZE_START = 92;  // px
const SIZE_END = 44;    // px

// Target spawn padding within stage bounds:
const PAD = 18;

// ---------------------------
// Game State
// ---------------------------
let running = false;
let practice = false;

let startTime = 0;
let endTime = 0;

let rafId = 0;

let score = 0;
let hits = 0;
let misses = 0;
let shots = 0; // hits+misses

// For extra metrics (optional):
let hitTimes = []; // reaction-like measurement between spawns and hit
let lastSpawnAt = 0;

// ---------------------------
// Helpers
// ---------------------------
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function now(){ return performance.now(); }

function lerp(a,b,t){ return a + (b-a)*t; }

function setText(el, text){ el.textContent = String(text); }

function calcAccuracy(){
  if (shots <= 0) return 0;
  return Math.round((hits / shots) * 100);
}

function setHUD(){
  setText(scoreEl, score);
  setText(hitsEl, hits);
  setText(missesEl, misses);
  setText(accuracyEl, calcAccuracy());
}

function setTimeLeft(sec){
  // show 1 decimal for "e-sport" feel
  setText(timeLeftEl, sec.toFixed(1));
}

function getStageRect(){
  return stage.getBoundingClientRect();
}

function setTargetSize(px){
  target.style.width = `${px}px`;
  target.style.height = `${px}px`;
}

function randomPosition(sizePx){
  const rect = getStageRect();

  // available area inside stage, excluding HUD overlays.
  // We position using stage's coordinate space (relative).
  const w = rect.width;
  const h = rect.height;

  // Keep away from very bottom footer text a little
  const bottomSafe = 42;

  const x = PAD + (Math.random() * (w - PAD*2 - sizePx));
  const y = PAD + (Math.random() * (h - PAD*2 - bottomSafe - sizePx));

  return { x, y };
}

function placeTarget(sizePx){
  const { x, y } = randomPosition(sizePx);
  // use left/top in stage coordinate space
  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
  target.style.transform = `translate(0,0)`; // we position directly
  lastSpawnAt = now();
}

function showTarget(){
  target.style.display = "block";
}

function hideTarget(){
  target.style.display = "none";
}

function showOverlay(){
  overlay.style.display = "flex";
}

function hideOverlay(){
  overlay.style.display = "none";
}

function showResultOverlay(){
  resultOverlay.hidden = false;
}

function hideResultOverlay(){
  resultOverlay.hidden = true;
}

function resetGame(){
  running = false;
  cancelAnimationFrame(rafId);

  score = 0;
  hits = 0;
  misses = 0;
  shots = 0;
  hitTimes = [];
  lastSpawnAt = 0;

  setHUD();
  setTimeLeft(ROUND_SECONDS);

  hideTarget();
}

// ---------------------------
// Round Control
// ---------------------------
function startRound(isPractice=false){
  practice = isPractice;
  resetGame();

  hideOverlay();
  hideResultOverlay();

  running = true;
  startTime = now();
  endTime = startTime + (ROUND_SECONDS * 1000);

  // Initial size at start
  setTargetSize(SIZE_START);
  placeTarget(SIZE_START);
  showTarget();

  // click miss area: stage click counts miss if not clicking target
  // ensure pointer events are active
  stage.classList.add("running");

  rafId = requestAnimationFrame(tick);
}

function endRound(){
  running = false;
  cancelAnimationFrame(rafId);
  hideTarget();

  // Results
  const acc = calcAccuracy();
  rScore.textContent = String(score);
  rAcc.textContent = String(acc);
  rHits.textContent = String(hits);
  rMisses.textContent = String(misses);

  let avgHitMs = null;
  if (hitTimes.length > 0){
    const sum = hitTimes.reduce((a,b)=>a+b,0);
    avgHitMs = Math.round(sum / hitTimes.length);
  }

  const noteParts = [];
  noteParts.push(`Shots: ${shots}`);
  if (avgHitMs !== null) noteParts.push(`Avg Hit Time: ${avgHitMs} ms`);
  noteParts.push(practice ? "Mode: PRACTICE" : "Mode: 30s");
  rNote.textContent = noteParts.join(" • ");

  showResultOverlay();

  // Optional: send to parent (Bolt iframe)
  try {
    window.parent?.postMessage({
      type: "GSC_SCORE",
      game: "aim-test",
      score,
      accuracy: acc,
      hits,
      misses,
      shots,
      avgHitMs,
      mode: practice ? "practice" : "30s"
    }, "*");
  } catch {}
}

function tick(){
  if (!running) return;

  const t = now();
  const msLeft = endTime - t;
  const secLeft = clamp(msLeft / 1000, 0, ROUND_SECONDS);

  setTimeLeft(secLeft);

  // shrink target over time (0..1 progress)
  const progress = clamp((t - startTime) / (ROUND_SECONDS*1000), 0, 1);
  const size = Math.round(lerp(SIZE_START, SIZE_END, progress));
  setTargetSize(size);

  if (msLeft <= 0){
    setTimeLeft(0);
    endRound();
    return;
  }

  rafId = requestAnimationFrame(tick);
}

// ---------------------------
// Input Handling
// ---------------------------
target.addEventListener("click", (e) => {
  if (!running) return;
  e.stopPropagation(); // prevent counting as miss

  // hit
  shots += 1;
  hits += 1;
  score += SCORE_HIT;

  // record time from spawn to hit (reaction-like)
  const dt = now() - lastSpawnAt;
  hitTimes.push(dt);

  setHUD();

  // respawn target (with current size)
  const currentSize = parseFloat(target.style.width) || SIZE_START;
  placeTarget(currentSize);

  // tiny feedback: quick pulse
  target.animate(
    [{ transform: "translate(0,0) scale(1)" }, { transform: "translate(0,0) scale(1.06)" }, { transform: "translate(0,0) scale(1)" }],
    { duration: 140, easing: "ease-out" }
  );
});

stage.addEventListener("click", () => {
  if (!running) return;

  // miss (clicking empty area)
  shots += 1;
  misses += 1;
  score += SCORE_MISS;

  setHUD();

  // optional: small shake feedback on stage
  stage.animate(
    [{ transform: "translateX(0)" }, { transform: "translateX(-2px)" }, { transform: "translateX(2px)" }, { transform: "translateX(0)" }],
    { duration: 120, easing: "ease-out" }
  );
});

// Buttons
startBtn.addEventListener("click", () => startRound(false));
practiceBtn.addEventListener("click", () => startRound(true));
retryBtn.addEventListener("click", () => startRound(practice));

copyBtn.addEventListener("click", async () => {
  const acc = calcAccuracy();
  const text =
`GameSpeedCheck — Aim Test (Web)
Score: ${score}
Accuracy: ${acc}%
Hits/Misses: ${hits}/${misses}
Shots: ${shots}
Link: ${location.href}`;

  try{
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "COPIED!";
    setTimeout(()=> copyBtn.textContent = "COPY SUMMARY", 900);
  } catch {
    // fallback
    window.prompt("Copy:", text);
  }
});

// Init
resetGame();
showOverlay();
hideResultOverlay();
