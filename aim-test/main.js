/* ===============================
   Aim Test — Standard Benchmark
   =============================== */

const SCREENS = {
  loading: document.getElementById("loading"),
  title: document.getElementById("title"),
  game: document.getElementById("game"),
  result: document.getElementById("result"),
};

const stage = document.getElementById("stage");
const target = document.getElementById("target");

const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const backBtn = document.getElementById("backBtn");

/* HUD */
const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const accEl = document.getElementById("acc");
const hitsEl = document.getElementById("hits");
const missesEl = document.getElementById("misses");

/* Result */
const rScore = document.getElementById("rScore");
const rAcc = document.getElementById("rAcc");
const rHits = document.getElementById("rHits");
const rMisses = document.getElementById("rMisses");

/* Config */
const ROUND_TIME = 30;
const HIT_SCORE = 10;
const MISS_SCORE = -2;

const SIZE_START = 80;
const SIZE_END = 42;

let time = ROUND_TIME;
let score = 0;
let hits = 0;
let misses = 0;
let shots = 0;

let timer = null;
let running = false;

/* Screen control */
function show(name) {
  Object.values(SCREENS).forEach(s => s.classList.remove("active"));
  SCREENS[name].classList.add("active");
}

/* Init: Loading → Title */
setTimeout(() => {
  show("title");
}, 1000);

/* Game start */
startBtn.onclick = () => {
  reset();
  show("game");
  running = true;
  spawnTarget();
  timer = setInterval(tick, 100);
};

/* Retry = play again immediately */
retryBtn.onclick = () => {
  reset();
  show("game");
  running = true;
  spawnTarget();
  timer = setInterval(tick, 100);
};

/* Back = go to title */
backBtn.onclick = () => {
  show("title");
};

/* Game loop */
function tick() {
  time -= 0.1;
  if (time <= 0) {
    endGame();
    return;
  }
  updateHUD();
}

/* Spawn / move target */
function spawnTarget() {
  const progress = 1 - time / ROUND_TIME;
  const size = Math.max(
    SIZE_END,
    SIZE_START - progress * (SIZE_START - SIZE_END)
  );

  target.style.width = size + "px";
  target.style.height = size + "px";

  const rect = stage.getBoundingClientRect();
  const edge = Math.floor(Math.random() * 4);

  let x, y;
  const margin = 20;

  if (edge === 0) { // top
    x = Math.random() * (rect.width - size);
    y = margin;
  } else if (edge === 1) { // right
    x = rect.width - size - margin;
    y = Math.random() * (rect.height - size);
  } else if (edge === 2) { // bottom
    x = Math.random() * (rect.width - size);
    y = rect.height - size - margin;
  } else { // left
    x = margin;
    y = Math.random() * (rect.height - size);
  }

  target.style.left = x + "px";
  target.style.top = y + "px";
}

/* Hit */
target.onclick = (e) => {
  if (!running) return;
  e.stopPropagation();

  score += HIT_SCORE;
  hits++;
  shots++;

  target.style.transform = "scale(0.9)";
  setTimeout(() => target.style.transform = "scale(1)", 80);

  spawnTarget();
  updateHUD();
};

/* Miss */
stage.onclick = () => {
  if (!running) return;
  score += MISS_SCORE;
  misses++;
  shots++;
  updateHUD();
};

/* End */
function endGame() {
  running = false;
  clearInterval(timer);

  rScore.textContent = score;
  rHits.textContent = hits;
  rMisses.textContent = misses;
  rAcc.textContent =
    shots === 0 ? 0 : Math.round((hits / shots) * 100);

  show("result");
}

/* Helpers */
function reset() {
  clearInterval(timer);
  time = ROUND_TIME;
  score = hits = misses = shots = 0;
  updateHUD();
}

function updateHUD() {
  timeEl.textContent = time.toFixed(1);
  scoreEl.textContent = score;
  hitsEl.textContent = hits;
  missesEl.textContent = misses;
  accEl.textContent =
    shots === 0 ? 0 : Math.round((hits / shots) * 100);
}
