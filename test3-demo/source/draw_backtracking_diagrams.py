"""
Generate six schematic figures (A-F) for backtracking concepts.

Output files:
    A_solution_space.png
    B_state_space_tree.png
    C_dfs_strategy.png
    D_pruning_idea.png
    E_constraint_and_bound.png
    F_backtrack_process.png
"""

from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch


OUT_DIR = Path(__file__).resolve().parent


def setup_ax(title: str):
    fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.set_xticks([])
    ax.set_yticks([])
    ax.set_frame_on(False)
    ax.set_title(title, fontsize=15, weight="bold", pad=14)
    return fig, ax


def box(ax, xy, w, h, text, fc="#eef4ff", ec="#3b5aa3", fs=10):
    x, y = xy
    rect = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        linewidth=1.8,
        edgecolor=ec,
        facecolor=fc,
    )
    ax.add_patch(rect)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs)


def arrow(ax, p1, p2, color="#2f3e63", lw=1.6, style="-|>"):
    a = FancyArrowPatch(p1, p2, arrowstyle=style, mutation_scale=12, linewidth=lw, color=color)
    ax.add_patch(a)


def draw_a_solution_space():
    fig, ax = setup_ax("A. Solution Space (Variables and Color Domains)")

    box(ax, (0.7, 4.1), 2.0, 1.0, "Region A\n{1,2,3,4}")
    box(ax, (3.1, 4.1), 2.0, 1.0, "Region B\n{1,2,3,4}")
    box(ax, (5.5, 4.1), 2.0, 1.0, "Region C\n{1,2,3,4}")
    box(ax, (7.9, 4.1), 1.4, 1.0, "...")

    box(ax, (2.8, 2.2), 4.4, 1.1, "Cartesian Product of Assignments\n(A,B,C,...)")
    box(ax, (2.2, 0.7), 5.6, 0.9, "Search Space Size: k^n  (colors^regions)", fc="#fff2e8", ec="#b2581f")

    arrow(ax, (1.7, 4.05), (4.0, 3.35))
    arrow(ax, (4.1, 4.05), (4.6, 3.35))
    arrow(ax, (6.5, 4.05), (5.2, 3.35))
    arrow(ax, (8.6, 4.05), (6.0, 3.35))
    arrow(ax, (5.0, 2.15), (5.0, 1.63))

    ax.text(0.7, 5.45, "Each variable = one region", fontsize=10, color="#35508f")
    ax.text(0.7, 5.15, "Each domain = available colors", fontsize=10, color="#35508f")

    fig.savefig(OUT_DIR / "A_solution_space.png", bbox_inches="tight")
    plt.close(fig)


def _node(ax, x, y, label, color="#f8fbff", edge="#4a5f99"):
    c = Circle((x, y), 0.33, facecolor=color, edgecolor=edge, linewidth=1.8)
    ax.add_patch(c)
    ax.text(x, y, label, ha="center", va="center", fontsize=9)


def draw_b_state_space_tree():
    fig, ax = setup_ax("B. State Space Tree (Map Coloring Assignments)")
    # levels
    _node(ax, 5.0, 5.3, "root")
    _node(ax, 3.4, 4.1, "A=1")
    _node(ax, 5.0, 4.1, "A=2")
    _node(ax, 6.6, 4.1, "A=3")

    _node(ax, 2.3, 2.9, "B=1")
    _node(ax, 3.4, 2.9, "B=2")
    _node(ax, 4.5, 2.9, "B=3")
    _node(ax, 5.6, 2.9, "B=1")
    _node(ax, 6.7, 2.9, "B=2")
    _node(ax, 7.8, 2.9, "B=3")

    leaves = [(2.3, 1.6, "C=2"), (3.4, 1.6, "C=3"), (4.5, 1.6, "C=1"), (5.6, 1.6, "C=3"), (6.7, 1.6, "C=1")]
    for x, y, t in leaves:
        _node(ax, x, y, t, color="#edf9ed", edge="#4d944d")

    for x in [3.4, 5.0, 6.6]:
        arrow(ax, (5.0, 4.98), (x, 4.43))

    for p in [(3.4, [2.3, 3.4, 4.5]), (5.0, [4.5, 5.6]), (6.6, [6.7, 7.8])]:
        px, arr = p
        for x in arr:
            arrow(ax, (px, 3.77), (x, 3.22))

    for x0, _, _ in leaves:
        parent = 3.4 if x0 <= 4.5 else (5.6 if x0 == 5.6 else 6.7)
        arrow(ax, (parent, 2.57), (x0, 1.93))

    ax.text(0.9, 0.7, "Path from root to leaf = one complete coloring assignment", fontsize=10, color="#2e4f95")

    fig.savefig(OUT_DIR / "B_state_space_tree.png", bbox_inches="tight")
    plt.close(fig)


def draw_c_dfs_strategy():
    fig, ax = setup_ax("C. DFS Search Strategy (Go Deep then Backtrack)")

    coords = {
        "r": (1.2, 5.0),
        "1": (3.0, 5.0),
        "2": (4.8, 5.0),
        "3": (6.6, 5.0),
        "1a": (3.0, 3.5),
        "1b": (4.8, 3.5),
        "2a": (4.8, 2.0),
        "2b": (6.6, 2.0),
    }

    for k, (x, y) in coords.items():
        _node(ax, x, y, k)
    edges = [("r", "1"), ("1", "2"), ("2", "3"), ("1", "1a"), ("2", "1b"), ("1b", "2a"), ("2", "2b")]
    for u, v in edges:
        arrow(ax, coords[u], coords[v], color="#7086b9", lw=1.2)

    path = ["r", "1", "2", "1b", "2a"]
    for i in range(len(path) - 1):
        arrow(ax, coords[path[i]], coords[path[i + 1]], color="#d94848", lw=2.8)

    arrow(ax, coords["2a"], coords["1b"], color="#f08a24", lw=2.4, style="<|-")
    ax.text(5.1, 1.25, "Dead end -> backtrack", fontsize=10, color="#bb5a00")
    ax.text(0.8, 0.7, "DFS explores a branch to depth first, then returns to try alternatives.", fontsize=10)

    fig.savefig(OUT_DIR / "C_dfs_strategy.png", bbox_inches="tight")
    plt.close(fig)


def draw_d_pruning_idea():
    fig, ax = setup_ax("D. Pruning Idea (Cut Invalid Branches Early)")
    _node(ax, 5.0, 5.2, "A=1")
    _node(ax, 3.2, 3.8, "B=1")
    _node(ax, 5.0, 3.8, "B=2")
    _node(ax, 6.8, 3.8, "B=3")
    _node(ax, 2.0, 2.2, "C=1")
    _node(ax, 3.2, 2.2, "C=2")
    _node(ax, 5.0, 2.2, "C=1")
    _node(ax, 6.8, 2.2, "C=2")
    _node(ax, 8.0, 2.2, "C=3")

    for x in [3.2, 5.0, 6.8]:
        arrow(ax, (5.0, 4.87), (x, 4.15))
    for start, targets in [(3.2, [2.0, 3.2]), (5.0, [5.0]), (6.8, [6.8, 8.0])]:
        for t in targets:
            arrow(ax, (start, 3.47), (t, 2.53))

    ax.plot([3.0, 3.4], [3.95, 3.65], color="#d62828", linewidth=4)
    ax.plot([3.0, 3.4], [3.65, 3.95], color="#d62828", linewidth=4)
    ax.text(2.2, 4.25, "Conflict: A and B adjacent\nsame color", fontsize=9, color="#b71c1c")

    ax.plot([4.82, 5.18], [2.38, 2.02], color="#d62828", linewidth=4)
    ax.plot([4.82, 5.18], [2.02, 2.38], color="#d62828", linewidth=4)
    ax.text(4.2, 1.65, "Prune", fontsize=10, color="#b71c1c")

    box(ax, (0.8, 0.5), 8.4, 0.8, "If partial assignment violates constraints, stop expanding this branch.", fc="#fff4e8", ec="#b4661d", fs=10)
    fig.savefig(OUT_DIR / "D_pruning_idea.png", bbox_inches="tight")
    plt.close(fig)


def draw_e_constraint_and_bound():
    fig, ax = setup_ax("E. Constraint Function and Bound Function")

    box(ax, (0.8, 3.6), 3.8, 1.5, "Constraint Function\ncheck adjacency rule:\nneighbor colors differ", fc="#edf8ff", ec="#2374a3")
    box(ax, (5.4, 3.6), 3.8, 1.5, "Bound Function\nestimate future potential:\ncan still reach better solution?", fc="#eefbe9", ec="#4f8f2f")
    box(ax, (3.1, 1.2), 3.8, 1.3, "Keep only promising nodes\nfor deeper exploration", fc="#fff3df", ec="#b2761a")

    arrow(ax, (2.7, 3.58), (4.0, 2.55), color="#2374a3", lw=2.2)
    arrow(ax, (7.3, 3.58), (6.0, 2.55), color="#4f8f2f", lw=2.2)

    ax.text(1.0, 0.6, "Constraint: feasibility filter", fontsize=10, color="#225f82")
    ax.text(6.0, 0.6, "Bound: optimality filter", fontsize=10, color="#476f2d")

    fig.savefig(OUT_DIR / "E_constraint_and_bound.png", bbox_inches="tight")
    plt.close(fig)


def draw_f_backtrack_process():
    fig, ax = setup_ax("F. Backtracking Process (Try -> Judge -> Recurse -> Undo)")
    steps = [
        ("Try assignment", (0.8, 3.8), "#eaf3ff", "#2f6fb2"),
        ("Constraint check", (2.8, 3.8), "#eefbe9", "#4f8f2f"),
        ("Recurse deeper", (4.8, 3.8), "#fff4e8", "#b26a1d"),
        ("Reach leaf?", (6.8, 3.8), "#f5edff", "#6e45b7"),
        ("Output solution", (6.8, 1.9), "#e9fff7", "#1e8a67"),
        ("Undo (backtrack)", (4.8, 1.9), "#ffecef", "#ba304f"),
        ("Try next value", (2.8, 1.9), "#fff8e8", "#b5841d"),
    ]

    for text, pos, fc, ec in steps:
        box(ax, pos, 1.7, 1.0, text, fc=fc, ec=ec, fs=9)

    arrow(ax, (2.5, 4.3), (2.8, 4.3))
    arrow(ax, (4.5, 4.3), (4.8, 4.3))
    arrow(ax, (6.5, 4.3), (6.8, 4.3))
    arrow(ax, (7.65, 3.8), (7.65, 2.9))
    arrow(ax, (6.8, 2.4), (6.5, 2.4))
    arrow(ax, (4.8, 2.4), (4.5, 2.4))
    arrow(ax, (2.8, 2.4), (2.5, 2.4))
    arrow(ax, (1.55, 2.9), (1.55, 3.8))

    ax.text(0.8, 0.8, "Loop until all values are tried or a stop condition is met.", fontsize=10, color="#304055")
    fig.savefig(OUT_DIR / "F_backtrack_process.png", bbox_inches="tight")
    plt.close(fig)


def main():
    draw_a_solution_space()
    draw_b_state_space_tree()
    draw_c_dfs_strategy()
    draw_d_pruning_idea()
    draw_e_constraint_and_bound()
    draw_f_backtrack_process()
    print("Generated 6 figures in:", OUT_DIR)


if __name__ == "__main__":
    main()
