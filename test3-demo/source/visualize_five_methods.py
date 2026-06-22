"""
Generate process visualizations for 5 map-coloring methods.

Output folders:
  five_method_visualizations/
    1_feasibility/
    2_optimality/
    3_search_order_MRV_DH/
    4_dedup_redundancy/
    5_tabucol/

Each folder contains step-by-step PNG images.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import random

import matplotlib.pyplot as plt


@dataclass
class Strategy:
    name: str
    use_bound: bool
    use_mrv_dh: bool
    use_dedup: bool
    stop_at_first: bool
    use_tabucol: bool = False


@dataclass
class TraceNode:
    node_id: int
    parent_id: Optional[int]
    depth: int
    region: str
    color: int


@dataclass
class TraceEvent:
    node_id: int
    status: str
    assignment: Dict[str, int]
    message: str


def build_demo_graph() -> Dict[str, List[str]]:
    # Small graph for clear visualization.
    return {
        "A": ["B", "C", "D"],
        "B": ["A", "C", "E"],
        "C": ["A", "B", "D", "E", "F"],
        "D": ["A", "C", "F"],
        "E": ["B", "C", "F", "G"],
        "F": ["C", "D", "E", "G"],
        "G": ["E", "F"],
    }


MAP_POS = {
    "A": (0.50, 0.85),
    "B": (0.22, 0.64),
    "C": (0.50, 0.58),
    "D": (0.78, 0.73),
    "E": (0.28, 0.28),
    "F": (0.62, 0.28),
    "G": (0.86, 0.45),
}

COLOR_MAP = {1: "#ff7676", 2: "#67b7ff", 3: "#7fdb90", 4: "#ffe07a"}


def build_trace_for_backtracking(
    graph: Dict[str, List[str]],
    k: int,
    strategy: Strategy,
    max_events: int = 240,
) -> Tuple[List[TraceNode], List[Tuple[int, int]], List[TraceEvent]]:
    regions = sorted(graph.keys())
    assignment: Dict[str, int] = {}
    nodes: List[TraceNode] = []
    edges: List[Tuple[int, int]] = []
    events: List[TraceEvent] = []
    next_id = 0

    incumbent_used = k

    def emit(node_id: int, status: str, msg: str, assn: Optional[Dict[str, int]] = None) -> None:
        if len(events) >= max_events:
            return
        events.append(TraceEvent(node_id=node_id, status=status, assignment=dict(assignment if assn is None else assn), message=msg))

    def new_node(parent_id: Optional[int], depth: int, region: str, color: int) -> int:
        nonlocal next_id
        nid = next_id
        next_id += 1
        nodes.append(TraceNode(nid, parent_id, depth, region, color))
        if parent_id is not None:
            edges.append((parent_id, nid))
        return nid

    def used_count() -> int:
        return len(set(assignment.values()))

    def safe(v: str, c: int) -> bool:
        for u in graph[v]:
            if assignment.get(u) == c:
                return False
        return True

    def domain_size(v: str) -> int:
        cnt = 0
        for c in range(1, k + 1):
            if safe(v, c):
                cnt += 1
        return cnt

    root = new_node(None, -1, "ROOT", 0)
    emit(root, "chosen", "Start search")

    def select_var(unassigned: List[str]) -> str:
        if strategy.use_mrv_dh:
            # MRV + DH
            return min(unassigned, key=lambda x: (domain_size(x), -len(graph[x]), x))
        return unassigned[0]

    def order_values(v: str) -> List[int]:
        vals = [c for c in range(1, k + 1) if safe(v, c)]
        # Least constraining values.
        scored = []
        for c in vals:
            impact = 0
            for u in graph[v]:
                if u not in assignment:
                    for cc in range(1, k + 1):
                        if cc == c:
                            continue
                        if all((assignment.get(w) != cc) for w in graph[u] if w != v):
                            pass
                    if safe(u, c):
                        impact += 1
            scored.append((impact, c))
        scored.sort()
        ordered = [c for _, c in scored]

        if strategy.use_dedup:
            used = set(assignment.values())
            new_vals = [c for c in ordered if c not in used]
            if new_vals:
                mn = min(new_vals)
                ordered = [c for c in ordered if c in used or c == mn]
        return ordered

    def dfs(parent_id: int) -> bool:
        nonlocal incumbent_used
        if len(events) >= max_events:
            return False
        if len(assignment) == len(regions):
            emit(parent_id, "solution", "Found complete coloring")
            if strategy.use_bound:
                incumbent_used = min(incumbent_used, used_count())
            return True

        if strategy.use_bound and used_count() > incumbent_used:
            emit(parent_id, "pruned", f"Prune by bound (used={used_count()} > best={incumbent_used})")
            return False

        unassigned = [r for r in regions if r not in assignment]
        v = select_var(unassigned)
        found = False

        for c in range(1, k + 1):
            nid = new_node(parent_id, len(assignment), v, c)
            if c not in order_values(v):
                # Not in legal/order set: show as pruned by rule.
                tmp = dict(assignment)
                tmp[v] = c
                emit(nid, "pruned", f"Skip {v}={c} by ordering/symmetry", tmp)
                continue

            if safe(v, c):
                assignment[v] = c
                emit(nid, "chosen", f"Choose {v}={c}")
                ok = dfs(nid)
                if ok:
                    found = True
                    if strategy.stop_at_first:
                        return True
                assignment.pop(v, None)
                emit(nid, "backtracked", f"Backtrack {v}={c}")
            else:
                tmp = dict(assignment)
                tmp[v] = c
                emit(nid, "pruned", f"Conflict prune {v}={c}", tmp)

        return found

    dfs(root)
    return nodes, edges, events


def tree_layout(nodes: List[TraceNode], edges: List[Tuple[int, int]]) -> Dict[int, Tuple[float, float]]:
    by_id = {n.node_id: n for n in nodes}
    ch: Dict[int, List[int]] = {n.node_id: [] for n in nodes}
    for p, c in edges:
        ch[p].append(c)
    for p in ch:
        ch[p].sort(key=lambda cid: (by_id[cid].region, by_id[cid].color))

    root = next(n.node_id for n in nodes if n.parent_id is None)
    pos: Dict[int, Tuple[float, float]] = {}
    x_cursor = 0.0
    gap = 1.2
    y_gap = 1.2

    def place(v: int) -> float:
        nonlocal x_cursor
        kids = ch[v]
        depth = by_id[v].depth + 1
        y = -depth * y_gap
        if not kids:
            x = x_cursor
            x_cursor += gap
            pos[v] = (x, y)
            return x
        xs = [place(u) for u in kids]
        x = (xs[0] + xs[-1]) / 2.0
        pos[v] = (x, y)
        return x

    place(root)
    root_x = pos[root][0]
    for nid in list(pos.keys()):
        x, y = pos[nid]
        pos[nid] = (x - root_x, y)
    return pos


def render_backtracking_step(
    out_path: Path,
    graph: Dict[str, List[str]],
    nodes: List[TraceNode],
    edges: List[Tuple[int, int]],
    events: List[TraceEvent],
    step: int,
) -> None:
    event = events[step]
    state = ["unvisited"] * len(nodes)
    first_seen = [-1] * len(nodes)
    for i, e in enumerate(events[: step + 1]):
        state[e.node_id] = e.status
        if first_seen[e.node_id] < 0:
            first_seen[e.node_id] = i
    lay = tree_layout(nodes, edges)

    fig = plt.figure(figsize=(14.5, 8.2), dpi=140, facecolor="#f3f6fb")
    gs = fig.add_gridspec(1, 2, width_ratios=[1.0, 1.85], wspace=0.08)
    ax_map = fig.add_subplot(gs[0, 0])
    ax_tree = fig.add_subplot(gs[0, 1])

    # map
    ax_map.set_xlim(0, 1)
    ax_map.set_ylim(0, 1)
    ax_map.set_aspect("equal", adjustable="box")
    ax_map.set_xticks([])
    ax_map.set_yticks([])
    ax_map.set_facecolor("white")
    ax_map.set_title("Map Coloring State", fontsize=14, fontweight="bold", color="#223a61")
    for s in ax_map.spines.values():
        s.set_edgecolor("#d2dceb")
    drawn = set()
    for u, nbrs in graph.items():
        x1, y1 = MAP_POS[u]
        for v in nbrs:
            k = tuple(sorted((u, v)))
            if k in drawn:
                continue
            x2, y2 = MAP_POS[v]
            ax_map.plot([x1, x2], [y1, y2], color="#8ea2c1", linewidth=2.4, zorder=1)
            drawn.add(k)
    for r, (x, y) in MAP_POS.items():
        fill = COLOR_MAP.get(event.assignment.get(r, 0), "#dbe4f2")
        ax_map.scatter([x], [y], s=2200, c=[fill], edgecolors="#2b3f5f", linewidths=2.0, zorder=2)
        ax_map.text(x, y, r, ha="center", va="center", fontsize=12.5, fontweight="bold", color="#1f2f49")
    assign_text = ", ".join([f"{k}={v}" for k, v in sorted(event.assignment.items())]) or "(empty)"
    ax_map.text(0.02, 0.03, f"Assignment: {assign_text}", transform=ax_map.transAxes, fontsize=10.2, color="#29456f")

    # tree
    ax_tree.set_xticks([])
    ax_tree.set_yticks([])
    ax_tree.set_facecolor("white")
    ax_tree.set_title("Search Tree", fontsize=14, fontweight="bold", color="#223a61")
    for s in ax_tree.spines.values():
        s.set_edgecolor("#d2dceb")

    border_color = {
        "unvisited": "#94a3b8",
        "chosen": "#2563eb",
        "pruned": "#dc2626",
        "backtracked": "#3b82f6",
        "solution": "#16a34a",
    }
    for p, c in edges:
        if first_seen[p] <= step and first_seen[c] <= step and first_seen[p] >= 0 and first_seen[c] >= 0:
            if nodes[p].region == "ROOT":
                continue
            x1, y1 = lay[p]
            x2, y2 = lay[c]
            col = "#c4cfdd"
            lw = 1.5
            if c == event.node_id:
                col = "#6b7280"
                lw = 2.6
            ax_tree.plot([x1, x2], [y1, y2], color=col, linewidth=lw, zorder=1)

    for n in nodes:
        if first_seen[n.node_id] < 0 or first_seen[n.node_id] > step:
            continue
        x, y = lay[n.node_id]
        st = state[n.node_id]
        fill = "#dbe4f2" if n.region == "ROOT" else COLOR_MAP.get(n.color, "#dbe4f2")
        edge = border_color.get(st, "#5a6f92")
        size = 620
        lw = 1.5
        if n.node_id == event.node_id:
            size = 820
            lw = 2.8
            edge = "#1b2f4d"
        ax_tree.scatter([x], [y], s=size, c=[fill], edgecolors=edge, linewidths=lw, zorder=2)
        label = "ROOT" if n.region == "ROOT" else f"{n.region}\n{n.color}"
        ax_tree.text(x, y, label, ha="center", va="center", fontsize=8.8, color="#1f2f49", zorder=3)
        if st == "pruned":
            dx = 0.11
            dy = 0.11
            ax_tree.plot([x - dx, x + dx], [y - dy, y + dy], color="#b91c1c", linewidth=1.8, zorder=4)
            ax_tree.plot([x - dx, x + dx], [y + dy, y - dy], color="#b91c1c", linewidth=1.8, zorder=4)
        elif st == "backtracked":
            ax_tree.text(x, y - 0.30, "<-", ha="center", va="center", fontsize=10.5, color="#1d4ed8", zorder=4)

    xs = [p[0] for p in lay.values()]
    ys = [p[1] for p in lay.values()]
    ax_tree.set_xlim(min(xs) - 0.8, max(xs) + 0.8)
    ax_tree.set_ylim(min(ys) - 0.9, max(ys) + 0.9)

    fig.suptitle(f"Step {step + 1}/{len(events)}  |  {event.message}", fontsize=15, fontweight="bold", color="#1e3458")
    fig.tight_layout()
    fig.savefig(out_path, bbox_inches="tight")
    plt.close(fig)


def run_tabucol_trace(
    graph: Dict[str, List[str]],
    k: int,
    max_iters: int = 90,
    seed: int = 42,
) -> List[TraceEvent]:
    regions = sorted(graph.keys())
    idx = {r: i for i, r in enumerate(regions)}
    n = len(regions)
    adj_idx = [[] for _ in range(n)]
    for r in regions:
        u = idx[r]
        for nb in graph[r]:
            adj_idx[u].append(idx[nb])

    rng = random.Random(seed)
    colors = [rng.randrange(k) for _ in range(n)]  # 0..k-1
    acc = [[0] * k for _ in range(n)]
    for v in range(n):
        for u in adj_idx[v]:
            acc[v][colors[u]] += 1
    conflicts = sum(acc[v][colors[v]] for v in range(n)) // 2
    tabu = [[0] * k for _ in range(n)]
    best = conflicts
    it = 0
    events: List[TraceEvent] = []
    events.append(
        TraceEvent(
            node_id=0,
            status="chosen",
            assignment={regions[i]: colors[i] + 1 for i in range(n)},
            message=f"Init random coloring, conflicts={conflicts}",
        )
    )

    while conflicts > 0 and it < max_iters:
        it += 1
        tenure = int(0.6 * max(conflicts, 1)) + rng.randrange(11)
        bv, bc, bd, ties = -1, -1, n + 1, 0
        for v in range(n):
            oc = colors[v]
            if acc[v][oc] == 0:
                continue
            for c in range(k):
                if c == oc:
                    continue
                delta = acc[v][c] - acc[v][oc]
                if tabu[v][c] > it and conflicts + delta >= best:
                    continue
                if delta < bd:
                    bv, bc, bd, ties = v, c, delta, 1
                elif delta == bd:
                    ties += 1
                    if rng.randrange(ties) == 0:
                        bv, bc = v, c
        if bv == -1:
            bad = [v for v in range(n) if acc[v][colors[v]] > 0]
            if not bad:
                break
            bv = bad[rng.randrange(len(bad))]
            bc = rng.randrange(k - 1)
            if bc >= colors[bv]:
                bc += 1
            bd = acc[bv][bc] - acc[bv][colors[bv]]
        oc = colors[bv]
        tabu[bv][oc] = it + tenure
        for u in adj_idx[bv]:
            acc[u][oc] -= 1
            acc[u][bc] += 1
        colors[bv] = bc
        conflicts += bd
        if conflicts < best:
            best = conflicts
        events.append(
            TraceEvent(
                node_id=it,
                status="chosen",
                assignment={regions[i]: colors[i] + 1 for i in range(n)},
                message=f"Iter {it}: recolor {regions[bv]}->{bc + 1}, conflicts={conflicts}",
            )
        )

    final_msg = "Solved (conflicts=0)" if conflicts == 0 else f"Stop at iter={it}, conflicts={conflicts}"
    events.append(
        TraceEvent(
            node_id=it + 1,
            status="solution" if conflicts == 0 else "backtracked",
            assignment={regions[i]: colors[i] + 1 for i in range(n)},
            message=final_msg,
        )
    )
    return events


def render_tabucol_step(out_path: Path, graph: Dict[str, List[str]], events: List[TraceEvent], step: int) -> None:
    event = events[step]
    fig, ax = plt.subplots(figsize=(8.6, 7.4), dpi=140, facecolor="#f3f6fb")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_aspect("equal", adjustable="box")
    ax.set_xticks([])
    ax.set_yticks([])
    ax.set_facecolor("white")
    ax.set_title("Tabucol Local Search State", fontsize=14, fontweight="bold", color="#223a61")
    for s in ax.spines.values():
        s.set_edgecolor("#d2dceb")

    drawn = set()
    for u, nbrs in graph.items():
        x1, y1 = MAP_POS[u]
        for v in nbrs:
            key = tuple(sorted((u, v)))
            if key in drawn:
                continue
            x2, y2 = MAP_POS[v]
            cu = event.assignment.get(u, 0)
            cv = event.assignment.get(v, 0)
            is_conf = cu > 0 and cv > 0 and cu == cv
            ax.plot([x1, x2], [y1, y2], color=("#dc2626" if is_conf else "#8ea2c1"), linewidth=(3.0 if is_conf else 2.2), zorder=1)
            drawn.add(key)

    for r, (x, y) in MAP_POS.items():
        fill = COLOR_MAP.get(event.assignment.get(r, 0), "#dbe4f2")
        ax.scatter([x], [y], s=2300, c=[fill], edgecolors="#2b3f5f", linewidths=2.1, zorder=2)
        ax.text(x, y, f"{r}\n{event.assignment.get(r, 0)}", ha="center", va="center", fontsize=11.5, fontweight="bold", color="#1f2f49")

    ax.text(0.02, 0.03, event.message, transform=ax.transAxes, fontsize=10.5, color="#29456f")
    fig.suptitle(f"Step {step + 1}/{len(events)}", fontsize=14, fontweight="bold", color="#1e3458")
    fig.tight_layout()
    fig.savefig(out_path, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    base = Path(__file__).resolve().parent
    out_root = base / "five_method_visualizations"
    out_root.mkdir(parents=True, exist_ok=True)

    graph = build_demo_graph()
    k = 4
    strategies = [
        Strategy("1_feasibility", use_bound=False, use_mrv_dh=False, use_dedup=False, stop_at_first=True),
        Strategy("2_optimality", use_bound=True, use_mrv_dh=False, use_dedup=False, stop_at_first=False),
        Strategy("3_search_order_MRV_DH", use_bound=False, use_mrv_dh=True, use_dedup=False, stop_at_first=True),
        Strategy("4_dedup_redundancy", use_bound=False, use_mrv_dh=True, use_dedup=True, stop_at_first=True),
        Strategy("5_tabucol", use_bound=False, use_mrv_dh=False, use_dedup=False, stop_at_first=True, use_tabucol=True),
    ]

    for st in strategies:
        folder = out_root / st.name
        folder.mkdir(parents=True, exist_ok=True)
        print(f"Generating {st.name} -> {folder}")

        if st.use_tabucol:
            events = run_tabucol_trace(graph, k=k, max_iters=80, seed=42)
            for i in range(len(events)):
                render_tabucol_step(folder / f"step_{i:03d}.png", graph, events, i)
        else:
            nodes, edges, events = build_trace_for_backtracking(graph, k=k, strategy=st, max_events=180)
            if not events:
                continue
            for i in range(len(events)):
                render_backtracking_step(folder / f"step_{i:03d}.png", graph, nodes, edges, events, i)

    print(f"Done. Output root: {out_root}")


if __name__ == "__main__":
    main()
