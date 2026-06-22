"""
Export step-by-step images for map-coloring backtracking (no animation).

Usage:
    python map_coloring_gui.py

Outputs:
    ./map_coloring_steps/step_000.png, step_001.png, ...
Each image includes:
1) Left: map with current colored regions.
2) Right: recursion tree with current recursion position highlighted.
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


@dataclass
class TraceEvent:
    node_id: int
    status: str  # chosen | pruned | backtracked | solution
    assignment: Dict[str, int]
    message: str


def build_small_map() -> Dict[str, List[str]]:
    return {
        "A": ["B", "C", "D"],
        "B": ["A", "C", "E"],
        "C": ["A", "B", "D", "E", "F"],
        "D": ["A", "C", "F", "G"],
        "E": ["B", "C", "F"],
        "F": ["C", "D", "E", "G"],
        "G": ["D", "F"],
    }


def is_safe(region: str, color: int, graph: Dict[str, List[str]], assignment: Dict[str, int]) -> bool:
    for neighbor in graph[region]:
        if assignment.get(neighbor) == color:
            return False
    return True


def build_trace(
    graph: Dict[str, List[str]], color_count: int = 4
) -> Tuple[List[TraceNode], List[Tuple[int, int]], List[TraceEvent], bool]:
    regions = list(graph.keys())
    assignment: Dict[str, int] = {}
    nodes: List[TraceNode] = []
    edges: List[Tuple[int, int]] = []
    events: List[TraceEvent] = []
    next_id = 0
    solved = False

    def new_node(parent_id: Optional[int], depth: int, region: str, color: int) -> int:
        nonlocal next_id
        node_id = next_id
        next_id += 1
        nodes.append(TraceNode(node_id, parent_id, depth, region, color))
        if parent_id is not None:
            edges.append((parent_id, node_id))
        return node_id

    root_id = new_node(None, -1, "ROOT", 0)
    events.append(TraceEvent(root_id, "chosen", dict(assignment), "Start DFS from root"))

    def dfs(index: int, parent_id: int) -> bool:
        nonlocal solved
        if index == len(regions):
            solved = True
            events.append(TraceEvent(parent_id, "solution", dict(assignment), "Complete solution found"))
            return True

        region = regions[index]
        for color in range(1, color_count + 1):
            node_id = new_node(parent_id, index, region, color)
            if is_safe(region, color, graph, assignment):
                assignment[region] = color
                events.append(TraceEvent(node_id, "chosen", dict(assignment), f"Choose {region}=C{color}"))
                if dfs(index + 1, node_id):
                    return True
                del assignment[region]
                events.append(TraceEvent(node_id, "backtracked", dict(assignment), f"Backtrack {region}=C{color}"))
            else:
                events.append(TraceEvent(node_id, "pruned", dict(assignment), f"Prune {region}=C{color} (conflict)"))
        return False

    dfs(0, root_id)
    return nodes, edges, events, solved


def build_tree_layout(nodes: List[TraceNode], edges: List[Tuple[int, int]]) -> Dict[int, Tuple[float, float]]:
    """Symmetric layout: parent centered over its subtree."""
    node_by_id = {n.node_id: n for n in nodes}
    children: Dict[int, List[int]] = {n.node_id: [] for n in nodes}
    for p, c in edges:
        children[p].append(c)

    root_id = next(n.node_id for n in nodes if n.parent_id is None)
    subtree_width: Dict[int, float] = {}

    def calc_width(node_id: int) -> float:
        childs = children[node_id]
        if not childs:
            subtree_width[node_id] = 1.0
            return 1.0
        w = sum(calc_width(c) for c in childs)
        subtree_width[node_id] = max(w, 1.0)
        return subtree_width[node_id]

    calc_width(root_id)
    pos: Dict[int, Tuple[float, float]] = {}
    x_scale = 1.05
    y_gap = 1.25

    def place(node_id: int, left: float) -> None:
        width = subtree_width[node_id]
        depth = node_by_id[node_id].depth + 1
        center_x = left + width / 2.0
        pos[node_id] = (center_x * x_scale, -depth * y_gap)

        cursor = left
        for c in children[node_id]:
            place(c, cursor)
            cursor += subtree_width[c]

    place(root_id, 0.0)
    return pos


def make_status_upto_step(events: List[TraceEvent], step: int, node_count: int) -> List[str]:
    status = ["unvisited"] * node_count
    for i in range(step + 1):
        e = events[i]
        status[e.node_id] = e.status
    return status


def render_step_image(
    step: int,
    nodes: List[TraceNode],
    edges: List[Tuple[int, int]],
    events: List[TraceEvent],
    graph: Dict[str, List[str]],
    out_path: Path,
) -> None:
    event = events[step]
    status_list = make_status_upto_step(events, step, len(nodes))
    tree_pos = build_tree_layout(nodes, edges)

    map_positions = {
        "A": (0.50, 0.84),
        "B": (0.22, 0.60),
        "C": (0.50, 0.54),
        "D": (0.78, 0.72),
        "E": (0.34, 0.24),
        "F": (0.66, 0.23),
        "G": (0.86, 0.42),
    }

    status_colors = {
        "unvisited": "#d8e1ef",
        "chosen": "#6cb4ff",
        "pruned": "#f8a5a5",
        "backtracked": "#f5c47a",
        "solution": "#7dd7a7",
    }
    map_colors = {1: "#ff7676", 2: "#67b7ff", 3: "#7fdb90", 4: "#ffe07a"}

    fig = plt.figure(figsize=(15.5, 8.8), dpi=150, facecolor="#f4f7fc")
    gs = fig.add_gridspec(1, 2, width_ratios=[1.05, 1.85], wspace=0.08)
    ax_map = fig.add_subplot(gs[0, 0])
    ax_tree = fig.add_subplot(gs[0, 1])

    # --- left: map ---
    ax_map.set_title("Current Map Coloring", fontsize=15, fontweight="bold", color="#223a61")
    ax_map.set_xlim(0, 1)
    ax_map.set_ylim(0, 1)
    ax_map.set_xticks([])
    ax_map.set_yticks([])
    ax_map.set_facecolor("#ffffff")
    ax_map.set_aspect("equal", adjustable="box")
    for s in ax_map.spines.values():
        s.set_edgecolor("#d0dbec")
        s.set_linewidth(1.6)

    drawn = set()
    for u, neighbors in graph.items():
        x1, y1 = map_positions[u]
        for v in neighbors:
            key = tuple(sorted((u, v)))
            if key in drawn:
                continue
            x2, y2 = map_positions[v]
            ax_map.plot([x1, x2], [y1, y2], color="#8ea2c1", linewidth=2.6, zorder=1)
            drawn.add(key)

    for region, (x, y) in map_positions.items():
        fill = map_colors.get(event.assignment.get(region, 0), "#d8e1ef")
        ax_map.scatter([x], [y], s=2500, c=[fill], edgecolors="#2b3f5f", linewidths=2.2, zorder=2)
        ax_map.text(x, y, region, ha="center", va="center", fontsize=12, fontweight="bold", color="#1f2f49", zorder=3)

    assign_text = ", ".join([f"{k}=C{v}" for k, v in sorted(event.assignment.items())]) or "(empty)"
    ax_map.text(0.02, 0.03, f"Assignment: {assign_text}", fontsize=10.5, color="#29456f", transform=ax_map.transAxes)

    # --- right: recursion tree ---
    ax_tree.set_title("Recursion Tree (Current Step Highlighted)", fontsize=15, fontweight="bold", color="#223a61")
    ax_tree.set_facecolor("#ffffff")
    for s in ax_tree.spines.values():
        s.set_edgecolor("#d0dbec")
        s.set_linewidth(1.6)
    ax_tree.set_xticks([])
    ax_tree.set_yticks([])

    # draw edges
    for p, c in edges:
        x1, y1 = tree_pos[p]
        x2, y2 = tree_pos[c]
        edge_color = "#bfccdf"
        lw = 1.5
        if c == event.node_id:
            edge_color = "#2f7de1"
            lw = 2.8
        ax_tree.plot([x1, x2], [y1, y2], color=edge_color, linewidth=lw, zorder=1)

    # draw nodes
    for n in nodes:
        x, y = tree_pos[n.node_id]
        st = status_list[n.node_id]
        fill = status_colors[st]
        edge = "#556a8f"
        lw = 1.4
        size = 640
        if n.node_id == event.node_id:
            edge = "#1d2f4c"
            lw = 2.8
            size = 820

        ax_tree.scatter([x], [y], s=size, c=[fill], edgecolors=edge, linewidths=lw, zorder=2)
        if n.region == "ROOT":
            label = "ROOT"
        else:
            label = f"{n.region}\nC{n.color}"
        ax_tree.text(x, y, label, ha="center", va="center", fontsize=7.8, color="#1f2f49", zorder=3)

    xs = [p[0] for p in tree_pos.values()]
    ys = [p[1] for p in tree_pos.values()]
    ax_tree.set_xlim(min(xs) - 0.8, max(xs) + 0.8)
    ax_tree.set_ylim(min(ys) - 0.8, max(ys) + 0.8)

    fig.suptitle(
        f"Step {step + 1}/{len(events)}  |  {event.message}",
        fontsize=16,
        fontweight="bold",
        color="#1e3458",
        y=0.98,
    )

    fig.savefig(out_path, bbox_inches="tight")
    plt.close(fig)


def export_all_steps() -> None:
    graph = build_small_map()
    nodes, edges, events, solved = build_trace(graph, color_count=4)
    if not solved:
        raise RuntimeError("No solution found with 4 colors.")

    out_dir = Path(__file__).resolve().parent / "map_coloring_steps"
    out_dir.mkdir(parents=True, exist_ok=True)

    for i in range(len(events)):
        out_path = out_dir / f"step_{i:03d}.png"
        render_step_image(i, nodes, edges, events, graph, out_path)

    print(f"Exported {len(events)} step images to: {out_dir}")


if __name__ == "__main__":
    export_all_steps()
