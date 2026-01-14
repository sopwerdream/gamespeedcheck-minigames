const screens = {
  loading: document.getElementById("loading"),
  title: document.getElementById("title"),
  game: document.getElementById("game"),
  result: document.getElementById("result"),
};

const target = document.getElementById("target");

const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const accEl = document.getElementById("acc");
const hitsEl = document.getElementById("hits");
const missesEl = document.getElementById("misses");

const rScore = document.getElementById("rScore");
const rAcc = document.getElementById("rAcc");
const rHits = document.getElementById("rHits");
const rMisses = document.getElementById("rMisses");

const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");

let time = 30;
let score = 0, hits = 0, misses = 0;
let timer = null;

function show(name){
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

/* LOADING → TITLE */
setTimeout(() => {
  show("title");
}, 1200);

/* START GAME */
startBtn.onclick = () => {
  reset();
  show("game");
  spawn();
  timer = setInterval(tick, 100);
};

/* GAME LOOP */
function tick(){
  time -= 0.1;
  if (time <= 0){
    endGame();
  }
  updateHUD();
}

function spawn(){
  const size = Math.max(30, 80 - (30 - time) * 1.2);
  target.style.width = target.style.height = size + "px";

  target.style.left = Math.random() * (window.innerWidth - size) + "px";
  target.style.top = Math.random() * (window.innerHeight - size) + "px";
}

target.onclick = (e) => {
  e.stopPropagation();
  score += 10;
  hits++;
  spawn();
};

document.getElementById("stage").onclick = () => {
  misses++;
  score -= 2;
};

/* END */
function endGame(){
  clearInterval(timer);
  rScore.textContent = score;
  rHits.textContent = hits;
  rMisses.textContent = misses;
  rAcc.textContent = hits + misses === 0 ? 0 : Math.round(hits/(hits+misses)*100);
  show("result");
}

/* RETRY */
retryBtn.onclick = () => {
  show("title");
};

/* HELPERS */
function reset(){
  time = 30;
  score = hits = misses = 0;
  updateHUD();
}

function updateHUD(){
  timeEl.textContent = time.toFixed(1);
  scoreEl.textContent = score;
  hitsEl.textContent = hits;
  missesEl.textContent = misses;
  accEl.textContent = hits + misses === 0 ? 0 : Math.round(hits/(hits+misses)*100);
}
