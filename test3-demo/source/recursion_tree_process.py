"""
Export recursion-tree growth process with fixed symmetric layout.

Usage:
    python recursion_tree_process.py

Outputs:
    ./recursion_tree_process_steps/tree_step_000.png, tree_step_001.png, ...
Each image includes:
1) Left panel: current map coloring assignment.
2) Right panel: recursion-tree growth with fixed node positions,
   pruning marks, backtracking marks, and current-node highlight.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import matplotlib.pyplot as plt


@dataclass
class TraceNode:
    node_id: int
    parent_id: Optional[int]
    depth: int
    region: str
    color: int
    path: Tuple[int, ...]


@dataclass
class TraceEvent:
    node_id: int
    status: str  # chosen | pruned | backtracked | solution
    assignment: Dict[str, int]
    message: str


def build_small_map() -> Dict[str, List[str]]:
    """
    Internal graph is relabeled so natural display order A->B->C->D->E->F->G
    still produces a DFS trace with pruning/backtracking.
    """
    return {
        "A": ["B", "C", "D"],
        "B": ["A", "C", "F"],
        "C": ["A", "B", "D", "F", "G"],
        "D": ["A", "C", "G"],
        "E": ["F", "G"],
        "F": ["B", "C", "E", "G"],
        "G": ["C", "D", "E", "F"],
    }


def is_safe(region: str, color: int, graph: Dict[str, List[str]], assignment: Dict[str, int]) -> bool:
    for neighbor in graph[region]:
        if assignment.get(neighbor) == color:
            return False
    return True


def build_trace(
    graph: Dict[str, List[str]], color_count: int = 4
) -> Tuple[List[TraceNode], List[Tuple[int, int]], List[TraceEvent], bool]:
    regions = sorted(graph.keys())
    assignment: Dict[str, int] = {}
    nodes: List[TraceNode] = []
    edges: List[Tuple[int, int]] = []
    events: List[TraceEvent] = []
    node_by_id: Dict[int, TraceNode] = {}
    next_id = 0
    solved = False

    def new_node(parent_id: Optional[int], depth: int, region: str, color: int, path: Tuple[int, ...]) -> int:
        nonlocal next_id
        node_id = next_id
        next_id += 1
        node = TraceNode(node_id=node_id, parent_id=parent_id, depth=depth, region=region, color=color, path=path)
        nodes.append(node)
        node_by_id[node_id] = node
        if parent_id is not None:
            edges.append((parent_id, node_id))
        return node_id

    root_id = new_node(None, -1, "ROOT", 0, ())
    events.append(TraceEvent(root_id, "chosen", dict(assignment), "Start DFS from root"))

    def dfs(index: int, parent_id: int) -> bool:
        nonlocal solved
        if index == len(regions):
            solved = True
            events.append(TraceEvent(parent_id, "solution", dict(assignment), "Complete solution found"))
            return True

        region = regions[index]
        parent_path = node_by_id[parent_id].path
        for color in range(1, color_count + 1):
            node_id = new_node(parent_id, index, region, color, parent_path + (color,))
            if is_safe(region, color, graph, assignment):
                assignment[region] = color
                events.append(TraceEvent(node_id, "chosen", dict(assignment), f"Choose {region}={color}"))
                if dfs(index + 1, node_id):
                    return True
                del assignment[region]
                events.append(TraceEvent(node_id, "backtracked", dict(assignment), f"Backtrack {region}={color}"))
            else:
                trial_assignment = dict(assignment)
                trial_assignment[region] = color
                events.append(TraceEvent(node_id, "pruned", trial_assignment, f"Prune {region}={color} (conflict)"))
        return False

    dfs(0, root_id)
    return nodes, edges, events, solved


def build_tree_layout(nodes: List[TraceNode], edges: List[Tuple[int, int]]) -> Dict[int, Tuple[float, float]]:
    """
    Precompute a tidy, non-overlapping layout from the full final tree.
    Positions are then fixed for all steps (no jitter during growth).
    """
    node_by_id = {n.node_id: n for n in nodes}
    children: Dict[int, List[int]] = {n.node_id: [] for n in nodes}
    for p, c in edges:
        children[p].append(c)

    # Keep children ordered by color id so visual branches are stable and symmetric.
    for p in children:
        children[p].sort(key=lambda cid: node_by_id[cid].color)

    root_id = next(n.node_id for n in nodes if n.parent_id is None)
    pos: Dict[int, Tuple[float, float]] = {}
    next_x = 0.0
    leaf_gap = 1.25
    y_gap = 1.28

    def place(node_id: int) -> float:
        nonlocal next_x
        childs = children[node_id]
        depth = node_by_id[node_id].depth + 1
        y = -depth * y_gap
        if not childs:
            x = next_x
            next_x += leaf_gap
            pos[node_id] = (x, y)
            return x

        child_xs = [place(c) for c in childs]
        x = (child_xs[0] + child_xs[-1]) / 2.0
        pos[node_id] = (x, y)
        return x

    place(root_id)

    # Center around vertical axis x=0 for cleaner symmetry.
    root_x = pos[root_id][0]
    for node_id, (x, y) in list(pos.items()):
        pos[node_id] = (x - root_x, y)

    return pos


def statuses_upto_step(events: List[TraceEvent], step: int, node_count: int) -> List[str]:
    state = ["unvisited"] * node_count
    for i in range(step + 1):
        e = events[i]
        state[e.node_id] = e.status
    return state


def first_seen_index(events: List[TraceEvent], node_count: int) -> List[int]:
    first = [-1] * node_count
    for i, e in enumerate(events):
        if first[e.node_id] < 0:
            first[e.node_id] = i
    return first


def render_step(
    step: int,
    nodes: List[TraceNode],
    edges: List[Tuple[int, int]],
    events: List[TraceEvent],
    graph: Dict[str, List[str]],
    layout: Dict[int, Tuple[float, float]],
    first_seen: List[int],
    out_path: Path,
) -> None:
    event = events[step]
    current = event.node_id
    state = statuses_upto_step(events, step, len(nodes))

    fig = plt.figure(figsize=(18.0, 10.2), dpi=150, facecolor="#f3f6fb")
    gs = fig.add_gridspec(1, 2, width_ratios=[1.0, 1.85], wspace=0.08)
    ax_map = fig.add_subplot(gs[0, 0])
    ax_tree = fig.add_subplot(gs[0, 1])

    # Shared color scheme: tree nodes use same map colors by color id.
    map_colors = {1: "#ff7676", 2: "#67b7ff", 3: "#7fdb90", 4: "#ffe07a"}
    edge_by_status = {
        "unvisited": "#94a3b8",
        "chosen": "#2563eb",
        "pruned": "#dc2626",
        "backtracked": "#3b82f6",
        "solution": "#1d4ed8",
    }

    # -------- Left: map --------
    map_pos = {
        "A": (0.50, 0.84),
        "B": (0.22, 0.60),
        "C": (0.50, 0.54),
        "D": (0.78, 0.72),
        "E": (0.34, 0.24),
        "F": (0.66, 0.23),
        "G": (0.86, 0.42),
    }
    ax_map.set_title("Current Map Coloring", fontsize=15, fontweight="bold", color="#223a61")
    ax_map.set_xlim(0, 1)
    ax_map.set_ylim(0, 1)
    ax_map.set_xticks([])
    ax_map.set_yticks([])
    ax_map.set_aspect("equal", adjustable="box")
    ax_map.set_facecolor("#ffffff")
    for s in ax_map.spines.values():
        s.set_edgecolor("#d3dced")
        s.set_linewidth(1.6)

    drawn = set()
    for u, neighbors in graph.items():
        x1, y1 = map_pos[u]
        for v in neighbors:
            key = tuple(sorted((u, v)))
            if key in drawn:
                continue
            x2, y2 = map_pos[v]
            ax_map.plot([x1, x2], [y1, y2], color="#8ea2c1", linewidth=2.6, zorder=1)
            drawn.add(key)
    for r, (x, y) in map_pos.items():
        fill = map_colors.get(event.assignment.get(r, 0), "#dbe4f2")
        ax_map.scatter([x], [y], s=2500, c=[fill], edgecolors="#2b3f5f", linewidths=2.2, zorder=2)
        ax_map.text(x, y, r, ha="center", va="center", fontsize=13.5, fontweight="bold", color="#1f2f49", zorder=3)

    assign_text = ", ".join([f"{k}={v}" for k, v in sorted(event.assignment.items())]) or "(empty)"
    ax_map.text(0.02, 0.03, f"Assignment: {assign_text}", transform=ax_map.transAxes, fontsize=10.5, color="#29456f")

    # -------- Right: fixed symmetric recursion tree --------
    ax_tree.set_title("Recursion Tree Construction (Fixed Balanced Layout)", fontsize=15, fontweight="bold", color="#223a61")
    ax_tree.set_facecolor("#ffffff")
    for s in ax_tree.spines.values():
        s.set_edgecolor("#d3dced")
        s.set_linewidth(1.6)
    ax_tree.set_xticks([])
    ax_tree.set_yticks([])

    # Edges for nodes already generated by this step.
    for p, c in edges:
        if first_seen[p] <= step and first_seen[c] <= step:
            if nodes[p].region == "ROOT":
                continue
            x1, y1 = layout[p]
            x2, y2 = layout[c]
            line_color = "#c4cfdd"
            lw = 1.6
            if c == current:
                line_color = "#6b7280"
                lw = 2.8
            ax_tree.plot([x1, x2], [y1, y2], color=line_color, linewidth=lw, zorder=1)

    # Visible nodes keep fixed positions; fill color = map color id.
    for n in nodes:
        if first_seen[n.node_id] > step:
            continue
        x, y = layout[n.node_id]
        st = state[n.node_id]
        fill = "#dbe4f2" if n.region == "ROOT" else map_colors.get(n.color, "#dbe4f2")
        edge = edge_by_status.get(st, "#5a6f92")
        size = 650
        lw = 1.6
        if n.node_id == current:
            edge = "#1b2f4d"
            size = 820
            lw = 2.9
        ax_tree.scatter([x], [y], s=size, c=[fill], edgecolors=edge, linewidths=lw, zorder=2)

        label = "ROOT" if n.region == "ROOT" else f"{n.region}\n{n.color}"
        ax_tree.text(x, y, label, ha="center", va="center", fontsize=9.4, color="#1f2f49", zorder=3)

        if st == "pruned":
            dx = 0.11
            dy = 0.11
            ax_tree.plot([x - dx, x + dx], [y - dy, y + dy], color="#9a6a3a", linewidth=2.1, zorder=4)
            ax_tree.plot([x - dx, x + dx], [y + dy, y - dy], color="#9a6a3a", linewidth=2.1, zorder=4)
        elif st == "backtracked":
            ax_tree.text(x, y - 0.33, "<-", ha="center", va="center", fontsize=11, color="#7a5ea8", zorder=4)

    # Fixed frame across all steps (no auto-pan / no reflow).
    xs_all = [xy[0] for xy in layout.values()]
    ys_all = [xy[1] for xy in layout.values()]
    ax_tree.set_xlim(min(xs_all) - 0.9, max(xs_all) + 0.9)
    ax_tree.set_ylim(min(ys_all) - 0.9, max(ys_all) + 0.9)

    fig.suptitle(
        f"Recursion Tree Construction  |  Step {step + 1}/{len(events)}  |  {event.message}",
        fontsize=16,
        fontweight="bold",
        color="#1e3458",
        y=0.97,
    )
    legend = "Node fill = map color; border = status (chosen / pruned / backtracked / solution); dark border = current."
    ax_tree.text(0.015, 0.03, legend, transform=ax_tree.transAxes, fontsize=10.2, color="#2b466f")

    fig.savefig(out_path, bbox_inches="tight")
    plt.close(fig)


def export_process_images() -> None:
    graph = build_small_map()
    nodes, edges, events, solved = build_trace(graph, color_count=4)
    if not solved:
        raise RuntimeError("No solution found with 4 colors.")

    out_dir = Path(__file__).resolve().parent / "recursion_tree_process_steps"
    out_dir.mkdir(parents=True, exist_ok=True)

    layout = build_tree_layout(nodes, edges)
    first_seen = first_seen_index(events, len(nodes))
    for i in range(len(events)):
        out = out_dir / f"tree_step_{i:03d}.png"
        render_step(i, nodes, edges, events, graph, layout, first_seen, out)

    backtrack_count = sum(1 for e in events if e.status == "backtracked")
    prune_count = sum(1 for e in events if e.status == "pruned")
    print(f"Exported {len(events)} process images to: {out_dir}")
    print(f"Backtracking events: {backtrack_count}, Pruning events: {prune_count}")


if __name__ == "__main__":
    export_process_images()
