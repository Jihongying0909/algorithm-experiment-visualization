import { Step, TreeEdge, TreeNode } from '../types';

type Result = { trials: number; floor: number };

const clone2D = (arr: number[][]) => arr.map((r) => [...r]);

function makeLogger() {
  const logs: string[] = [];
  let no = 0;
  const addLog = (msg: string) => {
    no += 1;
    logs.push(`Step ${no}: ${msg}`);
  };
  return { logs, addLog };
}

export function generateBruteForceSteps(K: number, N: number): Step[] {
  const steps: Step[] = [];
  const { logs, addLog } = makeLogger();
  addLog(`输入 K=${K}, N=${N}`);
  const stack: string[] = [];
  const heat = Array.from({ length: K + 1 }, () => Array(N + 1).fill(0));
  let calls = 0;
  let repeats = 0;
  const seen = new Map<string, number>();
  const nodes: TreeNode[] = [];
  const edges: TreeEdge[] = [];

  const push = (s: Partial<Step> & Pick<Step, 'pseudoLine' | 'description' | 'action' | 'currentState'>) => {
    addLog(s.description);
    steps.push({
      id: steps.length + 1,
      algorithm: 'bruteforce',
      logs: [...logs],
      callStack: [...stack],
      heatmap: clone2D(heat),
      treeNodes: nodes.map((n) => ({ ...n })),
      treeEdges: edges.map((e) => ({ ...e })),
      metrics: { calls, hits: 0, states: seen.size, filled: 0 },
      ...s,
    });
  };

  const solve = (k: number, n: number, parent?: string, branch?: 'broken' | 'safe'): Result => {
    calls += 1;
    const id = `${k},${n},${calls}`;
    const key = `${k},${n}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if ((seen.get(key) ?? 0) > 1) repeats += 1;
    heat[k][n] += 1;
    stack.push(`solve(${k},${n})`);
    nodes.push({ id, label: `T(${k},${n})`, x: 40 + (stack.length - 1) * 130, y: 50 + steps.length * 2, state: 'active' });
    if (parent && branch) edges.push({ from: parent, to: id, label: branch });

    addLog(`调用 solve(${k},${n})`);
    push({ pseudoLine: 6, description: `进入状态 (${k},${n})`, action: 'call', currentState: { eggs: k, floors: n } });

    push({ pseudoLine: 1, description: '检查 N=0 边界', action: 'check', currentState: { eggs: k, floors: n } });
    if (n === 0) {
      push({ pseudoLine: 1, description: 'N=0，返回(0,0)', action: 'base', currentState: { eggs: k, floors: n }, returnValue: 0 });
      stack.pop();
      return { trials: 0, floor: 0 };
    }

    push({ pseudoLine: 2, description: '检查 N=1 边界', action: 'check', currentState: { eggs: k, floors: n } });
    if (n === 1) {
      push({ pseudoLine: 2, description: 'N=1，返回(1,1)', action: 'base', currentState: { eggs: k, floors: n }, returnValue: 1 });
      stack.pop();
      return { trials: 1, floor: 1 };
    }

    push({ pseudoLine: 3, description: '检查 K=1 边界', action: 'check', currentState: { eggs: k, floors: n } });
    if (k === 1) {
      push({ pseudoLine: 3, description: `K=1，返回(${n},1)`, action: 'base', currentState: { eggs: k, floors: n }, returnValue: n });
      stack.pop();
      return { trials: n, floor: 1 };
    }

    let best = Number.POSITIVE_INFINITY;
    let bestFloor = 1;
    push({ pseudoLine: 4, description: 'minTrials ← +∞', action: 'assign', currentState: { eggs: k, floors: n }, best });
    push({ pseudoLine: 5, description: 'bestFloor ← 1', action: 'assign', currentState: { eggs: k, floors: n }, bestFloor });

    for (let x = 1; x <= n; x += 1) {
      addLog(`枚举 x=${x}`);
      push({ pseudoLine: 6, description: `for x: 当前 x=${x}`, action: 'loop', currentState: { eggs: k, floors: n }, x, best, bestFloor });

      push({ pseudoLine: 7, description: `broken ← solve(${k - 1},${x - 1})`, action: 'call-broken', currentState: { eggs: k, floors: n }, x, best, bestFloor });
      const broken = solve(k - 1, x - 1, id, 'broken').trials;

      push({ pseudoLine: 8, description: `safe ← solve(${k},${n - x})`, action: 'call-safe', currentState: { eggs: k, floors: n }, x, broken, best, bestFloor });
      const safe = solve(k, n - x, id, 'safe').trials;

      const worst = 1 + Math.max(broken, safe);
      push({ pseudoLine: 9, description: `worst ← 1 + max(${broken},${safe}) = ${worst}`, action: 'calc', currentState: { eggs: k, floors: n }, x, broken, safe, worst, best, bestFloor });

      push({ pseudoLine: 10, description: `if worst(${worst}) < minTrials(${best})`, action: 'if-check', currentState: { eggs: k, floors: n }, x, broken, safe, worst, best, bestFloor });
      if (worst < best) {
        best = worst;
        bestFloor = x;
        push({ pseudoLine: 11, description: `minTrials ← ${best}`, action: 'assign', currentState: { eggs: k, floors: n }, x, broken, safe, worst, best, bestFloor });
        push({ pseudoLine: 12, description: `bestFloor ← ${bestFloor}`, action: 'assign', currentState: { eggs: k, floors: n }, x, broken, safe, worst, best, bestFloor });
      }
    }

    push({ pseudoLine: 13, description: `return (${best},${bestFloor})`, action: 'return', currentState: { eggs: k, floors: n }, best, bestFloor, returnValue: best });
    stack.pop();
    return { trials: best, floor: bestFloor };
  };

  solve(K, N);
  return steps;
}

export function generateTopDownSteps(K: number, N: number): Step[] {
  const steps: Step[] = [];
  const memo = new Map<string, Result>();
  const { logs, addLog } = makeLogger();
  addLog(`输入 K=${K}, N=${N}`);
  const stack: string[] = [];
  const heat = Array.from({ length: K + 1 }, () => Array(N + 1).fill(0));
  let calls = 0;
  let hits = 0;

  const push = (s: Partial<Step> & Pick<Step, 'pseudoLine' | 'description' | 'action' | 'currentState'>) => {
    addLog(s.description);
    const memoObj: Step['memo'] = {};
    memo.forEach((v, k) => {
      memoObj[k] = { trials: v.trials, floor: v.floor, status: 'new' };
    });
    steps.push({
      id: steps.length + 1,
      algorithm: 'topdown',
      memo: memoObj,
      logs: [...logs],
      callStack: [...stack],
      heatmap: clone2D(heat),
      metrics: { calls, hits, states: memo.size, filled: 0 },
      ...s,
    });
  };

  const solve = (k: number, n: number): Result => {
    calls += 1;
    const key = `${k},${n}`;
    stack.push(`solve(${k},${n})`);
    heat[k][n] += 1;

    push({ pseudoLine: 1, description: `检查 memo 是否包含 (${k},${n})`, action: 'memo-check', currentState: { eggs: k, floors: n } });
    if (memo.has(key)) {
      hits += 1;
      const val = memo.get(key)!;
      addLog(`memo 命中 solve(${k},${n})`);
      push({ pseudoLine: 1, description: `memo 命中，返回(${val.trials},${val.floor})`, action: 'hit', currentState: { eggs: k, floors: n }, returnValue: val.trials, best: val.trials, bestFloor: val.floor });
      stack.pop();
      return val;
    }

    push({ pseudoLine: 2, description: '检查 N=0', action: 'check', currentState: { eggs: k, floors: n } });
    if (n === 0) { stack.pop(); return { trials: 0, floor: 0 }; }
    push({ pseudoLine: 3, description: '检查 N=1', action: 'check', currentState: { eggs: k, floors: n } });
    if (n === 1) { stack.pop(); return { trials: 1, floor: 1 }; }
    push({ pseudoLine: 4, description: '检查 K=1', action: 'check', currentState: { eggs: k, floors: n } });
    if (k === 1) { stack.pop(); return { trials: n, floor: 1 }; }

    let best = Number.POSITIVE_INFINITY;
    let bestFloor = 1;
    push({ pseudoLine: 5, description: 'bestTrials ← +∞', action: 'assign', currentState: { eggs: k, floors: n }, best });
    push({ pseudoLine: 6, description: 'bestFloor ← 1', action: 'assign', currentState: { eggs: k, floors: n }, bestFloor });

    for (let x = 1; x <= n; x += 1) {
      push({ pseudoLine: 7, description: `for x: 当前 x=${x}`, action: 'loop', currentState: { eggs: k, floors: n }, x, best, bestFloor });
      push({ pseudoLine: 8, description: `broken ← solve(${k - 1},${x - 1})`, action: 'call-broken', currentState: { eggs: k, floors: n }, x, best, bestFloor });
      const broken = solve(k - 1, x - 1).trials;
      push({ pseudoLine: 9, description: `safe ← solve(${k},${n - x})`, action: 'call-safe', currentState: { eggs: k, floors: n }, x, broken, best, bestFloor });
      const safe = solve(k, n - x).trials;
      const worst = 1 + Math.max(broken, safe);
      push({ pseudoLine: 10, description: `worst ← 1 + max(${broken},${safe}) = ${worst}`, action: 'calc', currentState: { eggs: k, floors: n }, x, broken, safe, worst, best, bestFloor });
      push({ pseudoLine: 11, description: `if worst(${worst}) < bestTrials(${best})`, action: 'if-check', currentState: { eggs: k, floors: n }, x, broken, safe, worst, best, bestFloor });
      if (worst < best) {
        best = worst;
        bestFloor = x;
        push({ pseudoLine: 12, description: `bestTrials ← ${best}`, action: 'assign', currentState: { eggs: k, floors: n }, x, best, bestFloor });
        push({ pseudoLine: 13, description: `bestFloor ← ${bestFloor}`, action: 'assign', currentState: { eggs: k, floors: n }, x, best, bestFloor });
      }
    }

    memo.set(key, { trials: best, floor: bestFloor });
    addLog(`写入 memo(${k},${n})`);
    push({ pseudoLine: 14, description: `memo[${key}] ← (${best},${bestFloor})`, action: 'memo-write', currentState: { eggs: k, floors: n }, best, bestFloor, returnValue: best });
    push({ pseudoLine: 15, description: `return memo[${key}]`, action: 'return', currentState: { eggs: k, floors: n }, best, bestFloor, returnValue: best });
    stack.pop();
    return { trials: best, floor: bestFloor };
  };

  solve(K, N);
  return steps;
}

export function generateBottomUpSteps(K: number, N: number): Step[] {
  const steps: Step[] = [];
  const { logs, addLog } = makeLogger();
  addLog(`输入 K=${K}, N=${N}`);
  const dp = Array.from({ length: K + 1 }, () => Array(N + 1).fill(0));
  const choice = Array.from({ length: K + 1 }, () => Array(N + 1).fill(0));
  const heat = Array.from({ length: K + 1 }, () => Array(N + 1).fill(0));
  let filled = 0;

  const push = (s: Partial<Step> & Pick<Step, 'pseudoLine' | 'description' | 'action' | 'currentState'>) => {
    addLog(s.description);
    steps.push({
      id: steps.length + 1,
      algorithm: 'bottomup',
      dpTable: clone2D(dp),
      choiceTable: clone2D(choice),
      heatmap: clone2D(heat),
      logs: [...logs],
      metrics: { calls: 0, hits: 0, states: (K + 1) * (N + 1), filled },
      ...s,
    });
  };

  push({ pseudoLine: 1, description: 'create dp[K+1][N+1]', action: 'init', currentState: { eggs: K, floors: N } });
  push({ pseudoLine: 2, description: 'create choice[K+1][N+1]', action: 'init', currentState: { eggs: K, floors: N } });
  for (let f = 0; f <= N; f += 1) dp[1][f] = f;
  push({ pseudoLine: 3, description: 'initialize dp[1][f] = f', action: 'init', currentState: { eggs: 1, floors: N } });
  for (let e = 1; e <= K; e += 1) { dp[e][0] = 0; if (N >= 1) dp[e][1] = 1; }
  push({ pseudoLine: 4, description: 'initialize dp[e][0], dp[e][1]', action: 'init', currentState: { eggs: K, floors: N } });

  for (let e = 2; e <= K; e += 1) {
    push({ pseudoLine: 5, description: `for e: 当前 e=${e}`, action: 'loop-e', currentState: { eggs: e, floors: N } });
    for (let f = 2; f <= N; f += 1) {
      push({ pseudoLine: 6, description: `for f: 当前 f=${f}`, action: 'loop-f', currentState: { eggs: e, floors: f } });
      let best = Number.POSITIVE_INFINITY;
      let bestX = 1;
      push({ pseudoLine: 7, description: 'best ← +∞', action: 'assign', currentState: { eggs: e, floors: f }, best });
      push({ pseudoLine: 8, description: 'bestX ← 1', action: 'assign', currentState: { eggs: e, floors: f }, bestFloor: bestX });
      for (let x = 1; x <= f; x += 1) {
        push({ pseudoLine: 9, description: `for x: 当前 x=${x}`, action: 'loop-x', currentState: { eggs: e, floors: f }, x, best, bestFloor: bestX });
        const broken = dp[e - 1][x - 1];
        const safe = dp[e][f - x];
        const worst = 1 + Math.max(broken, safe);
        push({ pseudoLine: 10, description: `worst = 1 + max(${broken},${safe}) = ${worst}`, action: 'calc', currentState: { eggs: e, floors: f }, x, broken, safe, worst, best, bestFloor: bestX });
        push({ pseudoLine: 11, description: `if worst(${worst}) < best(${best})`, action: 'if-check', currentState: { eggs: e, floors: f }, x, worst, best, bestFloor: bestX });
        if (worst < best) {
          best = worst;
          bestX = x;
          push({ pseudoLine: 12, description: `best ← ${best}`, action: 'assign', currentState: { eggs: e, floors: f }, x, best, bestFloor: bestX });
          push({ pseudoLine: 13, description: `bestX ← ${bestX}`, action: 'assign', currentState: { eggs: e, floors: f }, x, best, bestFloor: bestX });
        }
      }
      dp[e][f] = best;
      choice[e][f] = bestX;
      heat[e][f] += 1;
      filled += 1;
      push({ pseudoLine: 14, description: `dp[${e}][${f}] ← ${best}`, action: 'write', currentState: { eggs: e, floors: f }, best, bestFloor: bestX, returnValue: best });
      push({ pseudoLine: 15, description: `choice[${e}][${f}] ← ${bestX}`, action: 'write', currentState: { eggs: e, floors: f }, best, bestFloor: bestX, returnValue: best });
    }
  }
  push({ pseudoLine: 16, description: `return (dp[K][N], choice[K][N]) = (${dp[K][N]}, ${choice[K][N]})`, action: 'return', currentState: { eggs: K, floors: N }, returnValue: dp[K][N], bestFloor: choice[K][N] });
  return steps;
}

export function generateReachDpSteps(K: number, N: number): Step[] {
  const steps: Step[] = [];
  const reach = Array(K + 1).fill(0);
  const { logs, addLog } = makeLogger();
  addLog(`输入 K=${K}, N=${N}`);
  let m = 0;

  const push = (desc: string, k?: number) => {
    addLog(desc);
    steps.push({
      id: steps.length + 1,
      algorithm: 'reach',
      pseudoLine: 10,
      description: desc,
      action: 'reach-update',
      currentState: { eggs: k ?? K, floors: N },
      reach: [...reach],
      best: m,
      returnValue: reach[K],
      logs: [...logs],
      metrics: { calls: 0, hits: 0, states: K, filled: m },
    });
  };

  while (reach[K] < N && m < 200) {
    m += 1;
    for (let k = K; k >= 1; k -= 1) {
      addLog(`m=${m}, 更新 reach[${k}]`);
      reach[k] = reach[k] + reach[k - 1] + 1;
      push(`m=${m}, reach[${k}] ← reach[${k}] + reach[${k - 1}] + 1`, k);
    }
  }
  return steps;
}

