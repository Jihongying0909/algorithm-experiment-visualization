function parseGraph(text) {
  const tokens = text.trim().split(/\s+/).map(Number).filter(n => !Number.isNaN(n));
  if (tokens.length < 2) throw new Error("输入不足：至少需要 V E");
  const V = tokens[0];
  const E = tokens[1];
  const need = 2 + E * 2;
  if (tokens.length < need) throw new Error("输入边数量不足，请检查 E 与后续边行数");

  const edges = [];
  const adj = new Map();
  for (let i = 0; i < V; i += 1) adj.set(i, []);

  const rawVertices = new Set();
  let idx = 2;
  for (let eid = 0; eid < E; eid += 1) {
    const u = tokens[idx++];
    const v = tokens[idx++];
    edges.push({ u, v, eid });
    rawVertices.add(u);
    rawVertices.add(v);
  }

  const minId = rawVertices.size ? Math.min(...rawVertices) : 0;
  const labels = Array.from({ length: V }, (_, i) => minId + i);
  const idToIndex = new Map(labels.map((label, i) => [label, i]));

  for (const e of edges) {
    if (!idToIndex.has(e.u) || !idToIndex.has(e.v)) continue;
    const a = idToIndex.get(e.u);
    const b = idToIndex.get(e.v);
    adj.get(a).push({ to: b, eid: e.eid });
    adj.get(b).push({ to: a, eid: e.eid });
    e.a = a;
    e.b = b;
  }

  return { V, E: edges.length, edges, adj, labels };
}

function countComponents(graph, removedEid) {
  const visited = new Array(graph.V).fill(false);
  let comp = 0;
  for (let s = 0; s < graph.V; s += 1) {
    if (visited[s]) continue;
    comp += 1;
    const q = [s];
    visited[s] = true;
    for (let head = 0; head < q.length; head += 1) {
      const u = q[head];
      for (const { to, eid } of graph.adj.get(u)) {
        // 跳过 removedEid 等价于临时删除该边
        if (eid === removedEid) continue;
        if (!visited[to]) {
          visited[to] = true;
          q.push(to);
        }
      }
    }
  }
  return comp;
}

function generateSteps(graph) {
  const steps = [];
  const original = countComponents(graph, -1);
  for (const e of graph.edges) {
    const nComp = countComponents(graph, e.eid);
    const isBridge = nComp > original;
    steps.push({
      line: 2,
      mode: "test",
      edge: e,
      original,
      nComp,
      isBridge
    });
    steps.push({
      line: isBridge ? 5 : 4,
      mode: "result",
      edge: e,
      original,
      nComp,
      isBridge
    });
  }
  return { original, steps };
}

const els = {
  graphInput: document.getElementById("graphInput"),
  loadBtn: document.getElementById("loadBtn"),
  startBtn: document.getElementById("startBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  resetBtn: document.getElementById("resetBtn"),
  speedRange: document.getElementById("speedRange"),
  graphSvg: document.getElementById("graphSvg"),
  pseudoItems: Array.from(document.querySelectorAll("#pseudoList li")),
  veText: document.getElementById("veText"),
  origCompText: document.getElementById("origCompText"),
  currentEdgeText: document.getElementById("currentEdgeText"),
  newCompText: document.getElementById("newCompText"),
  decisionText: document.getElementById("decisionText"),
  progressText: document.getElementById("progressText"),
  logBox: document.getElementById("logBox"),
  resultLine: document.getElementById("resultLine")
};

let state = {
  graph: null,
  steps: [],
  original: 0,
  bridges: [],
  index: -1,
  timer: null
};

function sampleInput() {
  return [
    "8 10",
    "1 2",
    "2 3",
    "3 1",
    "3 4",
    "4 5",
    "5 6",
    "6 4",
    "6 7",
    "7 8",
    "8 6"
  ].join("\n");
}

function layoutPositions(V, w, h) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.36;
  return Array.from({ length: V }, (_, i) => {
    const t = (2 * Math.PI * i) / V - Math.PI / 2;
    return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
  });
}

function drawGraph(currentEid = null, bridgeSet = new Set(), mode = "") {
  const g = state.graph;
  if (!g) return;
  const svg = els.graphSvg;
  svg.innerHTML = "";

  const vb = svg.viewBox.baseVal;
  const pos = layoutPositions(g.V, vb.width, vb.height);

  for (const e of g.edges) {
    if (e.a == null || e.b == null) continue;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", pos[e.a].x);
    line.setAttribute("y1", pos[e.a].y);
    line.setAttribute("x2", pos[e.b].x);
    line.setAttribute("y2", pos[e.b].y);
    line.classList.add("edge");

    if (e.eid === currentEid && mode === "test") {
      line.classList.add("testing");
    } else if (bridgeSet.has(e.eid)) {
      line.classList.add("bridge");
    }
    if (currentEid !== null && e.eid !== currentEid && mode === "test") {
      line.classList.add("dim");
    }
    svg.appendChild(line);
  }

  for (let i = 0; i < g.V; i += 1) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", pos[i].x);
    c.setAttribute("cy", pos[i].y);
    c.setAttribute("r", 16);
    c.setAttribute("class", "node");
    svg.appendChild(c);

    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", pos[i].x);
    t.setAttribute("y", pos[i].y);
    t.setAttribute("class", "node-label");
    t.textContent = String(g.labels[i]);
    svg.appendChild(t);
  }
}

function setPseudo(lineNum) {
  for (const item of els.pseudoItems) {
    item.classList.toggle("active", Number(item.dataset.line) === lineNum);
  }
}

function appendLog(text) {
  const div = document.createElement("div");
  div.textContent = text;
  els.logBox.appendChild(div);
  els.logBox.scrollTop = els.logBox.scrollHeight;
}

function renderStep() {
  const total = state.steps.length;
  const i = state.index;
  els.progressText.textContent = `${Math.max(i + 1, 0)}/${total}`;
  if (i < 0 || i >= total) {
    drawGraph(null, new Set(state.bridges), "");
    return;
  }

  const st = state.steps[i];
  const e = st.edge;
  setPseudo(st.line);
  drawGraph(st.edge.eid, new Set(state.bridges), st.mode);

  els.currentEdgeText.textContent = `${e.u} - ${e.v} (id=${e.eid})`;
  els.origCompText.textContent = String(st.original);
  els.newCompText.textContent = String(st.nComp);
  els.decisionText.textContent = st.mode === "test"
    ? "正在测试这条边"
    : (st.isBridge ? "是桥" : "不是桥");

  if (st.mode === "result" && st.isBridge && !state.bridges.includes(e.eid)) {
    state.bridges.push(e.eid);
  }

  const bridgePairs = state.bridges
    .map(eid => state.graph.edges[eid])
    .filter(Boolean)
    .map(ed => `${ed.u} ${ed.v}`);
  els.resultLine.textContent = `Bridges: ${bridgePairs.length ? bridgePairs.join(" | ") : "（当前无）"}；Total bridges: ${bridgePairs.length}`;
}

function stopTimer() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
}

function play() {
  stopTimer();
  const interval = Number(els.speedRange.value);
  state.timer = setInterval(() => {
    if (state.index >= state.steps.length - 1) {
      stopTimer();
      appendLog("动画结束：所有边已检查完成。");
      return;
    }
    state.index += 1;
    const st = state.steps[state.index];
    if (st.mode === "test") {
      appendLog(`测试边 ${st.edge.u}-${st.edge.v}：删除后连通块 ${st.nComp}（原始 ${st.original}）`);
    } else {
      appendLog(`结论：边 ${st.edge.u}-${st.edge.v} ${st.isBridge ? "是桥" : "不是桥"}`);
    }
    renderStep();
  }, interval);
}

function loadGraph() {
  try {
    const graph = parseGraph(els.graphInput.value);
    const { original, steps } = generateSteps(graph);
    state.graph = graph;
    state.original = original;
    state.steps = steps;
    state.bridges = [];
    state.index = -1;
    stopTimer();

    els.veText.textContent = `${graph.V}, ${graph.E}`;
    els.origCompText.textContent = String(original);
    els.currentEdgeText.textContent = "-";
    els.newCompText.textContent = "-";
    els.decisionText.textContent = "准备就绪";
    els.progressText.textContent = `0/${steps.length}`;
    els.logBox.innerHTML = "";
    els.resultLine.textContent = "Bridges: （尚未开始）";
    setPseudo(1);
    drawGraph();
    appendLog(`图加载成功：V=${graph.V}, E=${graph.E}, original_components=${original}`);
  } catch (err) {
    alert(err.message || String(err));
  }
}

function step(delta) {
  if (!state.graph) return;
  stopTimer();
  state.index = Math.max(-1, Math.min(state.steps.length - 1, state.index + delta));
  renderStep();
}

els.loadBtn.addEventListener("click", loadGraph);
els.startBtn.addEventListener("click", () => {
  if (!state.graph) loadGraph();
  play();
});
els.pauseBtn.addEventListener("click", stopTimer);
els.prevBtn.addEventListener("click", () => step(-1));
els.nextBtn.addEventListener("click", () => step(1));
els.resetBtn.addEventListener("click", () => {
  stopTimer();
  state.index = -1;
  state.bridges = [];
  els.logBox.innerHTML = "";
  els.resultLine.textContent = "Bridges: （尚未开始）";
  setPseudo(1);
  renderStep();
});

els.graphInput.value = sampleInput();
loadGraph();
