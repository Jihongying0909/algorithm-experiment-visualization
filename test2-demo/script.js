const algorithms = {
  bruteforce: {
    label: "蛮力法",
    code: [
      "def closest_pair_bruteforce(points):",
      "    min_dist = float('inf')",
      "    best_pair = None",
      "    n = len(points)",
      "    for i in range(n):",
      "        for j in range(i + 1, n):",
      "            dx = points[i][0] - points[j][0]",
      "            dy = points[i][1] - points[j][1]",
      "            dist = (dx * dx + dy * dy) ** 0.5",
      "            if dist < min_dist:",
      "                min_dist = dist",
      "                best_pair = (i, j)",
      "    return best_pair, min_dist"
    ],
    lines: {
      initMin: 2,
      initBest: 3,
      initN: 4,
      loopI: 5,
      loopJ: 6,
      calcDx: 7,
      calcDy: 8,
      calcDist: 9,
      compare: 10,
      updateMin: 11,
      updateBest: 12,
      return: 13
    }
  },
  divide: {
    label: "分治法",
    code: [
      "def closest_pair_divide(points):",
      "    pts = sorted(points, key=lambda p: p[0])",
      "    def solve(arr):",
      "        n = len(arr)",
      "        if n <= 3:",
      "            return brute_force(arr)",
      "        mid = n // 2",
      "        mid_x = arr[mid][0]",
      "        left_pair, left_dist = solve(arr[:mid])",
      "        right_pair, right_dist = solve(arr[mid:])",
      "        best_pair, d = (left_pair, left_dist) if left_dist < right_dist else (right_pair, right_dist)",
      "        strip = [p for p in arr if abs(p[0] - mid_x) < d]",
      "        strip.sort(key=lambda p: p[1])",
      "        for i in range(len(strip)):",
      "            for j in range(i + 1, len(strip)):",
      "                if strip[j][1] - strip[i][1] >= d:",
      "                    break",
      "                dist = distance(strip[i], strip[j])",
      "                if dist < d:",
      "                    d = dist",
      "                    best_pair = (strip[i], strip[j])",
      "        return best_pair, d",
      "    return solve(pts)"
    ],
    lines: {
      sort: 2,
      enterSolve: 3,
      readN: 4,
      baseCheck: 5,
      baseReturn: 6,
      mid: 7,
      midX: 8,
      solveLeft: 9,
      solveRight: 10,
      mergeBest: 11,
      buildStrip: 12,
      sortStrip: 13,
      stripLoopI: 14,
      stripLoopJ: 15,
      breakCheck: 16,
      breakLine: 17,
      stripDist: 18,
      stripUpdateIf: 19,
      stripUpdateDist: 20,
      stripUpdatePair: 21,
      returnSolve: 22,
      returnMain: 23
    }
  }
};

const els = {
  pointCount: document.getElementById("pointCount"),
  algorithmSelect: document.getElementById("algorithmSelect"),
  generateBtn: document.getElementById("generateBtn"),
  codeContainer: document.getElementById("codeContainer"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  prevStateBtn: document.getElementById("prevStateBtn"),
  nextStateBtn: document.getElementById("nextStateBtn"),
  autoplayBtn: document.getElementById("autoplayBtn"),
  stopAutoplayBtn: document.getElementById("stopAutoplayBtn"),
  stepSlider: document.getElementById("stepSlider"),
  stepIndicator: document.getElementById("stepIndicator"),
  statusTitle: document.getElementById("statusTitle"),
  currentPair: document.getElementById("currentPair"),
  currentDistance: document.getElementById("currentDistance"),
  bestPair: document.getElementById("bestPair"),
  bestDistance: document.getElementById("bestDistance"),
  canvas: document.getElementById("plotCanvas")
};

const ctx = els.canvas.getContext("2d");

let points = [];
let steps = [];
let currentStepIndex = 0;
let autoplayTimer = null;
const autoplayIntervalMs = 300;

renderCode();
generateSimulation();

els.generateBtn.addEventListener("click", generateSimulation);
els.algorithmSelect.addEventListener("change", () => {
  renderCode();
  generateSimulation();
});
els.prevBtn.addEventListener("click", () => goToStep(currentStepIndex - 1));
els.nextBtn.addEventListener("click", () => goToStep(currentStepIndex + 1));
els.prevStateBtn.addEventListener("click", () => goToStep(findPreviousVisualChangeIndex(currentStepIndex)));
els.nextStateBtn.addEventListener("click", () => goToStep(findNextVisualChangeIndex(currentStepIndex)));
els.stepSlider.addEventListener("input", (event) => goToStep(Number(event.target.value)));
window.addEventListener("resize", () => drawScene(steps[currentStepIndex]));
els.autoplayBtn.addEventListener("click", startAutoplay);
els.stopAutoplayBtn.addEventListener("click", stopAutoplay);

function getActiveAlgorithm() {
  return algorithms[els.algorithmSelect.value] || algorithms.bruteforce;
}

function renderCode() {
  const active = getActiveAlgorithm();
  els.codeContainer.innerHTML = "";
  active.code.forEach((line, index) => {
    const row = document.createElement("div");
    row.className = "code-line";
    row.dataset.line = String(index + 1);

    const lineNumber = document.createElement("span");
    lineNumber.className = "line-number";
    lineNumber.textContent = String(index + 1).padStart(2, "0");

    const lineText = document.createElement("span");
    lineText.textContent = line;

    row.append(lineNumber, lineText);
    els.codeContainer.appendChild(row);
  });
}

function generateSimulation() {
  stopAutoplay();
  const count = clamp(Number(els.pointCount.value) || 8, 3, 18);
  els.pointCount.value = count;
  points = createRandomPoints(count);
  const mode = els.algorithmSelect.value;
  steps = mode === "divide" ? buildDivideSteps(points) : buildBruteForceSteps(points);
  els.stepSlider.max = String(Math.max(steps.length - 1, 0));
  goToStep(0);
}

function setAutoplayUi(isPlaying) {
  els.autoplayBtn.disabled = isPlaying;
  els.stopAutoplayBtn.disabled = !isPlaying;
}

function startAutoplay() {
  if (autoplayTimer) {
    return;
  }
  if (!steps.length) {
    return;
  }
  setAutoplayUi(true);
  autoplayTimer = setInterval(() => {
    const lastIndex = Math.max(steps.length - 1, 0);
    if (currentStepIndex >= lastIndex) {
      stopAutoplay();
      return;
    }
    goToStep(currentStepIndex + 1);
  }, autoplayIntervalMs);
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  if (els.autoplayBtn && els.stopAutoplayBtn) {
    setAutoplayUi(false);
  }
}

function createRandomPoints(count) {
  const created = [];
  const minGap = 20;
  let attempts = 0;

  while (created.length < count && attempts < 5000) {
    attempts += 1;
    const x = randomInt(8, 92);
    const y = randomInt(8, 92);
    const safe = created.every((point) => Math.hypot(point.x - x, point.y - y) > minGap);

    if (safe) {
      created.push({ id: created.length, x, y });
    }
  }

  while (created.length < count) {
    created.push({ id: created.length, x: randomInt(8, 92), y: randomInt(8, 92) });
  }

  return created;
}

function buildBruteForceSteps(data) {
  const trace = [];
  const lines = algorithms.bruteforce.lines;
  const n = data.length;
  let minDist = Infinity;
  let bestPair = null;

  trace.push(makeStep("初始化", "设置最短距离为无穷大", lines.initMin, { bestPair, bestDistance: minDist }));
  trace.push(makeStep("初始化", "设置当前最优点对为空", lines.initBest, { bestPair, bestDistance: minDist }));
  trace.push(makeStep("初始化", `读取点数量 n = ${n}`, lines.initN, { bestPair, bestDistance: minDist }));

  for (let i = 0; i < n; i += 1) {
    trace.push(makeStep("进入外层循环", `固定第一个点 P${i + 1}`, lines.loopI, {
      bestPair,
      bestDistance: minDist,
      activeIds: [data[i].id]
    }));

    for (let j = i + 1; j < n; j += 1) {
      const pair = { i: data[i].id, j: data[j].id };
      const dx = data[i].x - data[j].x;
      const dy = data[i].y - data[j].y;
      const dist = Math.hypot(dx, dy);

      trace.push(makeStep("进入内层循环", `选择待比较点对 P${pair.i + 1} 与 P${pair.j + 1}`, lines.loopJ, {
        currentPair: pair,
        bestPair,
        bestDistance: minDist
      }));
      trace.push(makeStep("正在比较", `计算 dx = ${dx.toFixed(2)}`, lines.calcDx, {
        currentPair: pair,
        bestPair,
        bestDistance: minDist
      }));
      trace.push(makeStep("正在比较", `计算 dy = ${dy.toFixed(2)}`, lines.calcDy, {
        currentPair: pair,
        bestPair,
        bestDistance: minDist
      }));
      trace.push(makeStep("正在比较", `得到距离 ${dist.toFixed(2)}`, lines.calcDist, {
        currentPair: pair,
        currentDistance: dist,
        bestPair,
        bestDistance: minDist
      }));

      if (dist < minDist) {
        trace.push(makeStep("更新判断", `${dist.toFixed(2)} < ${formatDistance(minDist)}，满足更新条件`, lines.compare, {
          currentPair: pair,
          currentDistance: dist,
          bestPair,
          bestDistance: minDist
        }));
        minDist = dist;
        bestPair = pair;
        trace.push(makeStep("更新最优解", `更新最短距离为 ${dist.toFixed(2)}`, lines.updateMin, {
          currentPair: pair,
          currentDistance: dist,
          bestPair,
          bestDistance: minDist
        }));
        trace.push(makeStep("更新最优解", `更新最优点对为 P${pair.i + 1} 与 P${pair.j + 1}`, lines.updateBest, {
          currentPair: pair,
          currentDistance: dist,
          bestPair,
          bestDistance: minDist
        }));
      } else {
        trace.push(makeStep("比较完成", `${dist.toFixed(2)} >= ${formatDistance(minDist)}，保持当前最优解`, lines.compare, {
          currentPair: pair,
          currentDistance: dist,
          bestPair,
          bestDistance: minDist
        }));
      }
    }
  }

  trace.push(makeStep("执行完成", "返回最终最近点对与最短距离", lines.return, {
    currentPair: bestPair,
    currentDistance: minDist,
    bestPair,
    bestDistance: minDist
  }));

  return trace;
}

function buildDivideSteps(data) {
  const trace = [];
  const lines = algorithms.divide.lines;
  const sorted = [...data].sort((a, b) => a.x - b.x || a.y - b.y);

  trace.push(makeStep("初始化", "按 x 坐标对所有点进行排序", lines.sort, {
    activeIds: sorted.map((point) => point.id)
  }));

  const result = solveDivide(sorted, 0, trace, lines);

  trace.push(makeStep("执行完成", "分治递归结束，返回全局最优解", lines.returnMain, {
    currentPair: result.bestPair,
    currentDistance: result.bestDistance,
    bestPair: result.bestPair,
    bestDistance: result.bestDistance,
    activeIds: sorted.map((point) => point.id)
  }));

  return normalizeBestTrace(trace);
}

function solveDivide(arr, depth, trace, lines) {
  const ids = arr.map((point) => point.id);
  trace.push(makeStep("递归进入", `处理子问题，规模 n = ${arr.length}，深度 ${depth}`, lines.enterSolve, {
    activeIds: ids,
    depth
  }));
  trace.push(makeStep("读取规模", `当前子问题包含 ${arr.length} 个点`, lines.readN, {
    activeIds: ids,
    depth
  }));

  if (arr.length <= 3) {
    trace.push(makeStep("基线情况", "点数不超过 3，转为子问题蛮力求解", lines.baseCheck, {
      activeIds: ids,
      depth
    }));

    let minDist = Infinity;
    let bestPair = null;

    for (let i = 0; i < arr.length; i += 1) {
      for (let j = i + 1; j < arr.length; j += 1) {
        const pair = { i: arr[i].id, j: arr[j].id };
        const dist = distanceBetween(arr[i], arr[j]);
        trace.push(makeStep("基线比较", `在小规模子问题中比较 P${pair.i + 1} 与 P${pair.j + 1}`, lines.baseReturn, {
          currentPair: pair,
          currentDistance: dist,
          bestPair,
          bestDistance: minDist,
          activeIds: ids,
          depth
        }));

        if (dist < minDist) {
          minDist = dist;
          bestPair = pair;
          trace.push(makeStep("基线更新", `子问题最优解更新为 ${dist.toFixed(2)}`, lines.baseReturn, {
            currentPair: pair,
            currentDistance: dist,
            bestPair,
            bestDistance: minDist,
            activeIds: ids,
            depth
          }));
        }
      }
    }

    trace.push(makeStep("子问题返回", "返回该子区间的最近点对", lines.baseReturn, {
      currentPair: bestPair,
      currentDistance: minDist,
      bestPair,
      bestDistance: minDist,
      activeIds: ids,
      depth
    }));

    return { bestPair, bestDistance: minDist };
  }

  trace.push(makeStep("分治判断", "点数大于 3，继续划分左右子区间", lines.baseCheck, {
    activeIds: ids,
    depth
  }));

  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);
  const midX = arr[mid].x;

  trace.push(makeStep("划分区间", `中点下标 mid = ${mid}`, lines.mid, {
    activeIds: ids,
    leftIds: left.map((point) => point.id),
    rightIds: right.map((point) => point.id),
    splitX: midX,
    depth
  }));
  trace.push(makeStep("确定分割线", `以 x = ${midX} 为分割线`, lines.midX, {
    activeIds: ids,
    leftIds: left.map((point) => point.id),
    rightIds: right.map((point) => point.id),
    splitX: midX,
    depth
  }));

  trace.push(makeStep("递归左侧", `递归求解左半部分，共 ${left.length} 个点`, lines.solveLeft, {
    activeIds: left.map((point) => point.id),
    splitX: midX,
    depth
  }));
  const leftResult = solveDivide(left, depth + 1, trace, lines);

  trace.push(makeStep("递归右侧", `递归求解右半部分，共 ${right.length} 个点`, lines.solveRight, {
    activeIds: right.map((point) => point.id),
    splitX: midX,
    bestPair: leftResult.bestPair,
    bestDistance: leftResult.bestDistance,
    depth
  }));
  const rightResult = solveDivide(right, depth + 1, trace, lines);

  let bestPair = leftResult.bestDistance <= rightResult.bestDistance ? leftResult.bestPair : rightResult.bestPair;
  let bestDistance = Math.min(leftResult.bestDistance, rightResult.bestDistance);

  trace.push(makeStep("合并最优", `左右子问题合并，当前 d = ${formatDistance(bestDistance)}`, lines.mergeBest, {
    bestPair,
    bestDistance,
    activeIds: ids,
    leftIds: left.map((point) => point.id),
    rightIds: right.map((point) => point.id),
    splitX: midX,
    depth
  }));

  const strip = arr.filter((point) => Math.abs(point.x - midX) < bestDistance).sort((a, b) => a.y - b.y);

  trace.push(makeStep("构造条带", `选出距离分割线小于 d 的点，共 ${strip.length} 个`, lines.buildStrip, {
    bestPair,
    bestDistance,
    activeIds: ids,
    stripIds: strip.map((point) => point.id),
    splitX: midX,
    depth
  }));
  trace.push(makeStep("条带排序", "按 y 坐标对条带中的点排序", lines.sortStrip, {
    bestPair,
    bestDistance,
    activeIds: ids,
    stripIds: strip.map((point) => point.id),
    splitX: midX,
    depth
  }));

  for (let i = 0; i < strip.length; i += 1) {
    trace.push(makeStep("扫描条带", `固定条带点 P${strip[i].id + 1}`, lines.stripLoopI, {
      bestPair,
      bestDistance,
      activeIds: ids,
      stripIds: strip.map((point) => point.id),
      splitX: midX,
      depth
    }));

    for (let j = i + 1; j < strip.length; j += 1) {
      const pair = { i: strip[i].id, j: strip[j].id };
      const yGap = strip[j].y - strip[i].y;

      trace.push(makeStep("扫描条带", `考察条带点对 P${pair.i + 1} 与 P${pair.j + 1}`, lines.stripLoopJ, {
        currentPair: pair,
        bestPair,
        bestDistance,
        activeIds: ids,
        stripIds: strip.map((point) => point.id),
        splitX: midX,
        depth
      }));

      if (yGap >= bestDistance) {
        trace.push(makeStep("提前剪枝", `${yGap.toFixed(2)} >= ${formatDistance(bestDistance)}，停止当前内层扫描`, lines.breakCheck, {
          currentPair: pair,
          bestPair,
          bestDistance,
          activeIds: ids,
          stripIds: strip.map((point) => point.id),
          splitX: midX,
          depth
        }));
        trace.push(makeStep("提前剪枝", "执行 break，进入下一条带基点", lines.breakLine, {
          bestPair,
          bestDistance,
          activeIds: ids,
          stripIds: strip.map((point) => point.id),
          splitX: midX,
          depth
        }));
        break;
      }

      const dist = distanceBetween(strip[i], strip[j]);
      trace.push(makeStep("跨区比较", `计算跨分割线点对距离 ${dist.toFixed(2)}`, lines.stripDist, {
        currentPair: pair,
        currentDistance: dist,
        bestPair,
        bestDistance,
        activeIds: ids,
        stripIds: strip.map((point) => point.id),
        splitX: midX,
        depth
      }));

      if (dist < bestDistance) {
        trace.push(makeStep("更新判断", `${dist.toFixed(2)} < ${formatDistance(bestDistance)}，更新条带最优解`, lines.stripUpdateIf, {
          currentPair: pair,
          currentDistance: dist,
          bestPair,
          bestDistance,
          activeIds: ids,
          stripIds: strip.map((point) => point.id),
          splitX: midX,
          depth
        }));
        bestDistance = dist;
        bestPair = pair;
        trace.push(makeStep("更新最优解", `更新 d = ${dist.toFixed(2)}`, lines.stripUpdateDist, {
          currentPair: pair,
          currentDistance: dist,
          bestPair,
          bestDistance,
          activeIds: ids,
          stripIds: strip.map((point) => point.id),
          splitX: midX,
          depth
        }));
        trace.push(makeStep("更新最优解", `更新最优点对为 P${pair.i + 1} 与 P${pair.j + 1}`, lines.stripUpdatePair, {
          currentPair: pair,
          currentDistance: dist,
          bestPair,
          bestDistance,
          activeIds: ids,
          stripIds: strip.map((point) => point.id),
          splitX: midX,
          depth
        }));
      }
    }
  }

  trace.push(makeStep("子问题返回", "返回当前递归层的最优结果", lines.returnSolve, {
    currentPair: bestPair,
    currentDistance: bestDistance,
    bestPair,
    bestDistance,
    activeIds: ids,
    stripIds: strip.map((point) => point.id),
    splitX: midX,
    depth
  }));

  return { bestPair, bestDistance };
}

function makeStep(status, detail, line, payload = {}) {
  return {
    status,
    detail,
    line,
    currentPair: payload.currentPair ? { ...payload.currentPair } : null,
    currentDistance: Number.isFinite(payload.currentDistance) ? payload.currentDistance : null,
    bestPair: payload.bestPair ? { ...payload.bestPair } : null,
    bestDistance: Number.isFinite(payload.bestDistance) ? payload.bestDistance : null,
    activeIds: payload.activeIds ? [...payload.activeIds] : [],
    leftIds: payload.leftIds ? [...payload.leftIds] : [],
    rightIds: payload.rightIds ? [...payload.rightIds] : [],
    stripIds: payload.stripIds ? [...payload.stripIds] : [],
    splitX: Number.isFinite(payload.splitX) ? payload.splitX : null,
    depth: payload.depth ?? 0
  };
}

function normalizeBestTrace(trace) {
  let runningBestPair = null;
  let runningBestDistance = Infinity;

  return trace.map((step) => {
    if (step.bestPair && Number.isFinite(step.bestDistance) && step.bestDistance < runningBestDistance) {
      runningBestPair = { ...step.bestPair };
      runningBestDistance = step.bestDistance;
    }

    return {
      ...step,
      bestPair: runningBestPair ? { ...runningBestPair } : null,
      bestDistance: Number.isFinite(runningBestDistance) ? runningBestDistance : null
    };
  });
}

function goToStep(index) {
  currentStepIndex = clamp(index, 0, Math.max(steps.length - 1, 0));
  const step = steps[currentStepIndex];
  if (!step) {
    return;
  }

  els.stepSlider.value = String(currentStepIndex);
  els.stepIndicator.textContent = `步骤 ${currentStepIndex + 1} / ${steps.length}`;
  els.prevBtn.disabled = currentStepIndex === 0;
  els.nextBtn.disabled = currentStepIndex === steps.length - 1;
  els.prevStateBtn.disabled = findPreviousVisualChangeIndex(currentStepIndex) === currentStepIndex;
  els.nextStateBtn.disabled = findNextVisualChangeIndex(currentStepIndex) === currentStepIndex;

  updateStatus(step);
  highlightCode(step.line);
  drawScene(step);
}

function findPreviousVisualChangeIndex(fromIndex) {
  if (!steps.length) {
    return 0;
  }
  for (let i = fromIndex - 1; i >= 0; i -= 1) {
    if (hasVisualChange(steps[i], steps[fromIndex])) {
      return i;
    }
  }
  return fromIndex;
}

function findNextVisualChangeIndex(fromIndex) {
  if (!steps.length) {
    return 0;
  }
  for (let i = fromIndex + 1; i < steps.length; i += 1) {
    if (hasVisualChange(steps[i], steps[fromIndex])) {
      return i;
    }
  }
  return fromIndex;
}

function hasVisualChange(candidate, current) {
  return serializeVisualState(candidate) !== serializeVisualState(current);
}

function serializeVisualState(step) {
  return JSON.stringify({
    currentPair: step.currentPair ?? null,
    bestPair: step.bestPair ?? null,
    activeIds: step.activeIds ?? [],
    leftIds: step.leftIds ?? [],
    rightIds: step.rightIds ?? [],
    stripIds: step.stripIds ?? [],
    splitX: normalizeVisualNumber(step.splitX)
  });
}

function normalizeVisualNumber(value) {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : null;
}

function updateStatus(step) {
  els.statusTitle.textContent = `${step.status} · ${step.detail}`;
  els.currentPair.textContent = formatPair(step.currentPair);
  els.currentDistance.textContent = formatDistance(step.currentDistance);
  els.bestPair.textContent = formatPair(step.bestPair);
  els.bestDistance.textContent = formatDistance(step.bestDistance);
}

function highlightCode(lineNumber) {
  const lines = els.codeContainer.querySelectorAll(".code-line");
  lines.forEach((line) => {
    const active = Number(line.dataset.line) === lineNumber;
    line.classList.toggle("active", active);
    if (active) {
      line.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  });
}

function drawScene(step) {
  const { width, height } = els.canvas;
  const padding = { top: 42, right: 42, bottom: 48, left: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);
  drawGrid(width, height, padding, plotWidth, plotHeight);

  if (Number.isFinite(step.splitX) && (step.leftIds.length || step.rightIds.length)) {
    drawPartitionRegions(step, padding, plotWidth, plotHeight);
  }

  if (Number.isFinite(step.splitX)) {
    const x = padding.left + (step.splitX / 100) * plotWidth;
    ctx.save();
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = "rgba(124, 92, 255, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
    ctx.restore();
  }

  if (step.bestPair) {
    drawConnection(getPointById(step.bestPair.i), getPointById(step.bestPair.j), padding, plotWidth, plotHeight, "#5d7cff", 6, []);
  }

  if (step.currentPair) {
    drawConnection(getPointById(step.currentPair.i), getPointById(step.currentPair.j), padding, plotWidth, plotHeight, "#ff7ab6", 4, [8, 8]);
  }

  points.forEach((point) => {
    const position = toCanvasPoint(point, padding, plotWidth, plotHeight);
    const isCurrent = includesPair(step.currentPair, point.id);
    const isBest = includesPair(step.bestPair, point.id);
    const isStrip = step.stripIds.includes(point.id);
    const isActive = step.activeIds.includes(point.id);

    const haloColor = isCurrent
      ? "rgba(255, 122, 182, 0.24)"
      : isBest
        ? "rgba(93, 124, 255, 0.18)"
        : isStrip
          ? "rgba(124, 92, 255, 0.16)"
          : isActive
            ? "rgba(146, 113, 255, 0.11)"
            : "rgba(146, 113, 255, 0.08)";

    const fill = isCurrent ? "#ff7ab6" : isBest ? "#5d7cff" : "#cfbeff";

    ctx.beginPath();
    ctx.fillStyle = haloColor;
    ctx.arc(position.x, position.y, isActive || isStrip ? 15 : 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = fill;
    ctx.arc(position.x, position.y, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3a3057";
    ctx.font = "600 14px 'Space Grotesk', 'Noto Sans SC', sans-serif";
    ctx.fillText(`P${point.id + 1}`, position.x + 10, position.y - 12);
  });
}

function drawPartitionRegions(step, padding, plotWidth, plotHeight) {
  const splitCanvasX = padding.left + (step.splitX / 100) * plotWidth;
  const top = padding.top;
  const left = padding.left;
  const regionHeight = plotHeight;
  const fullWidth = plotWidth;

  ctx.save();

  if (step.leftIds.length) {
    ctx.fillStyle = "rgba(124, 92, 255, 0.08)";
    ctx.fillRect(left, top, Math.max(splitCanvasX - left, 0), regionHeight);
  }

  if (step.rightIds.length) {
    ctx.fillStyle = "rgba(255, 122, 182, 0.08)";
    ctx.fillRect(splitCanvasX, top, Math.max(left + fullWidth - splitCanvasX, 0), regionHeight);
  }

  ctx.fillStyle = "rgba(79, 68, 115, 0.78)";
  ctx.font = "600 13px 'Space Grotesk', 'Noto Sans SC', sans-serif";

  if (step.leftIds.length) {
    ctx.fillText(`左区域 (${step.leftIds.length})`, left + 12, top + 20);
  }

  if (step.rightIds.length) {
    ctx.fillText(`右区域 (${step.rightIds.length})`, splitCanvasX + 12, top + 20);
  }

  ctx.restore();
}

function drawGrid(width, height, padding, plotWidth, plotHeight) {
  ctx.save();
  ctx.strokeStyle = "rgba(128, 104, 191, 0.12)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 10; i += 1) {
    const x = padding.left + (plotWidth / 10) * i;
    const y = padding.top + (plotHeight / 10) * i;

    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(74, 58, 112, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  ctx.fillStyle = "#6f648f";
  ctx.font = "500 12px 'Space Grotesk', 'Noto Sans SC', sans-serif";

  for (let i = 0; i <= 10; i += 1) {
    const labelX = Math.round((100 / 10) * i);
    const x = padding.left + (plotWidth / 10) * i;
    ctx.fillText(String(labelX), x - 8, height - padding.bottom + 22);
  }

  for (let i = 0; i <= 10; i += 1) {
    const labelY = Math.round((100 / 10) * i);
    const y = height - padding.bottom - (plotHeight / 10) * i;
    ctx.fillText(String(labelY), padding.left - 34, y + 4);
  }

  ctx.fillStyle = "#4f4473";
  ctx.font = "700 14px 'Space Grotesk', 'Noto Sans SC', sans-serif";
  ctx.fillText("X", width - padding.right + 10, height - padding.bottom + 4);
  ctx.fillText("Y", padding.left - 2, padding.top - 14);
  ctx.restore();
}

function drawConnection(pointA, pointB, padding, plotWidth, plotHeight, color, lineWidth, dash) {
  if (!pointA || !pointB) {
    return;
  }

  const a = toCanvasPoint(pointA, padding, plotWidth, plotHeight);
  const b = toCanvasPoint(pointB, padding, plotWidth, plotHeight);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function toCanvasPoint(point, padding, plotWidth, plotHeight) {
  return {
    x: padding.left + (point.x / 100) * plotWidth,
    y: els.canvas.height - padding.bottom - (point.y / 100) * plotHeight
  };
}

function getPointById(id) {
  return points.find((point) => point.id === id) || null;
}

function includesPair(pair, pointId) {
  return Boolean(pair) && (pair.i === pointId || pair.j === pointId);
}

function formatPair(pair) {
  if (!pair) {
    return "-";
  }
  return `P${pair.i + 1} - P${pair.j + 1}`;
}

function formatDistance(value) {
  if (!Number.isFinite(value)) {
    return "∞";
  }
  return value.toFixed(2);
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
