const COUNTS = {
  "1_feasibility": 47,
  "2_optimality": 180,
  "3_search_order_MRV_DH": 18,
  "4_dedup_redundancy": 54,
  "5_tabucol": 5,
  "6_small_scale_demo": 27
};

const LABELS = {
  "1_feasibility": "Feasibility",
  "2_optimality": "Optimality",
  "3_search_order_MRV_DH": "SearchOrder(MRV+DH)",
  "4_dedup_redundancy": "Dedup",
  "5_tabucol": "Tabucol",
  "6_small_scale_demo": "Small-Scale Demo"
};

const methodSelect = document.getElementById("methodSelect");
const firstBtn = document.getElementById("firstBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const lastBtn = document.getElementById("lastBtn");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const info = document.getElementById("info");
const stepImg = document.getElementById("stepImg");

let method = methodSelect.value;
let idx = 0;
let autoplayTimer = null;
const AUTOPLAY_MS = 500;

function fileName(i) {
  return `step_${String(i).padStart(3, "0")}.png`;
}

function srcOf(m, i) {
  return `./${m}/${fileName(i)}`;
}

function preloadNeighbors() {
  const n = COUNTS[method];
  for (let d = -2; d <= 2; d++) {
    const j = idx + d;
    if (j < 0 || j >= n) continue;
    const im = new Image();
    im.src = srcOf(method, j);
  }
}

function clamp() {
  const n = COUNTS[method];
  if (idx < 0) idx = 0;
  if (idx > n - 1) idx = n - 1;
}

function update() {
  clamp();
  const n = COUNTS[method];
  const src = srcOf(method, idx);
  stepImg.onerror = () => {
    info.textContent = `Image load failed: ${src}`;
  };
  stepImg.src = src;
  info.textContent = `${LABELS[method]} | step ${idx + 1}/${n} | ${fileName(idx)}`;

  firstBtn.disabled = idx === 0;
  prevBtn.disabled = idx === 0;
  nextBtn.disabled = idx === n - 1;
  lastBtn.disabled = idx === n - 1;
  stopBtn.disabled = autoplayTimer === null;

  preloadNeighbors();
}

function stopAutoplay() {
  if (autoplayTimer !== null) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  update();
}

function startAutoplay() {
  if (autoplayTimer !== null) return;
  autoplayTimer = setInterval(() => {
    const n = COUNTS[method];
    if (idx >= n - 1) {
      stopAutoplay();
      return;
    }
    idx += 1;
    update();
  }, AUTOPLAY_MS);
  update();
}

methodSelect.addEventListener("change", () => {
  stopAutoplay();
  method = methodSelect.value;
  idx = 0;
  update();
});
firstBtn.addEventListener("click", () => { idx = 0; update(); });
prevBtn.addEventListener("click", () => { idx -= 1; update(); });
nextBtn.addEventListener("click", () => { idx += 1; update(); });
lastBtn.addEventListener("click", () => { idx = COUNTS[method] - 1; update(); });
playBtn.addEventListener("click", startAutoplay);
stopBtn.addEventListener("click", stopAutoplay);

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") prevBtn.click();
  if (e.key === "ArrowRight") nextBtn.click();
  if (e.key === "Home") firstBtn.click();
  if (e.key === "End") lastBtn.click();
});

update();










