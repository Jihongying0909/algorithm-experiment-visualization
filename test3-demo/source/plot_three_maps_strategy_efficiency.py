"""
Plot strategy efficiency curves for task-2 (three .col maps).

Data source:
  benchmark_outputs_with_tabucol_*/pruning_benchmark_results_with_tabucol.csv

Behavior:
  - Auto-select latest benchmark_outputs_with_tabucol_* folder by name.
  - X-axis: map instance order (le450_5a, le450_15b, le450_25a)
  - Y-axis: runtime (seconds)
  - One curve per strategy (1..5)
  - Timeout points are drawn with hollow markers.

Output:
  three_maps_strategy_efficiency.png
"""

from __future__ import annotations

from pathlib import Path
import csv
import re

import matplotlib.pyplot as plt


MAP_ORDER = ["le450_5a.col", "le450_15b.col", "le450_25a.col"]
STRATEGY_ORDER = [
    "1_feasibility",
    "2_optimality",
    "3_search_order_MRV_DH",
    "4_dedup_redundancy",
    "5_tabucol",
]


def pick_latest_result_dir(base: Path) -> Path:
    dirs = [p for p in base.glob("benchmark_outputs_with_tabucol_*") if p.is_dir()]
    if not dirs:
        raise FileNotFoundError("No benchmark_outputs_with_tabucol_* folder found.")
    # Folder name has timestamp suffix, lexicographic sort works.
    dirs.sort(key=lambda p: p.name)
    return dirs[-1]


def map_short_name(fname: str) -> str:
    m = re.match(r"le450_(\d+\w?)\.col", fname)
    return m.group(1) if m else fname


def load_rows(csv_path: Path):
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def main() -> None:
    base = Path(__file__).resolve().parent
    latest_dir = pick_latest_result_dir(base)
    in_csv = latest_dir / "pruning_benchmark_results_with_tabucol.csv"
    if not in_csv.exists():
        raise FileNotFoundError(f"Missing file: {in_csv}")

    rows = load_rows(in_csv)

    # data[strategy][map] = (time_sec, status)
    data = {s: {} for s in STRATEGY_ORDER}
    for r in rows:
        s = (r.get("strategy") or "").strip()
        m = (r.get("file") or "").strip()
        if s in data and m in MAP_ORDER:
            data[s][m] = (float(r["time_sec"]), (r.get("status") or "").strip())

    x = list(range(len(MAP_ORDER)))
    xticklabels = [map_short_name(m) for m in MAP_ORDER]

    colors = {
        "1_feasibility": "#ef4444",
        "2_optimality": "#f59e0b",
        "3_search_order_MRV_DH": "#2563eb",
        "4_dedup_redundancy": "#7c3aed",
        "5_tabucol": "#059669",
    }
    markers = {
        "1_feasibility": "o",
        "2_optimality": "s",
        "3_search_order_MRV_DH": "^",
        "4_dedup_redundancy": "D",
        "5_tabucol": "P",
    }

    plt.figure(figsize=(10.8, 6.2), dpi=150)

    for s in STRATEGY_ORDER:
        ys = []
        status_flags = []
        for m in MAP_ORDER:
            if m in data[s]:
                t, st = data[s][m]
                ys.append(t)
                status_flags.append(st)
            else:
                ys.append(float("nan"))
                status_flags.append("")

        plt.plot(
            x,
            ys,
            label=s,
            color=colors[s],
            marker=markers[s],
            linewidth=2.2,
            markersize=7,
        )

        # Timeout point overlay: hollow marker for visual distinction.
        for xi, yi, st in zip(x, ys, status_flags):
            if st == "timeout":
                plt.scatter(
                    [xi],
                    [yi],
                    s=95,
                    facecolors="none",
                    edgecolors=colors[s],
                    linewidths=2.0,
                    zorder=5,
                )

    plt.xticks(x, xticklabels)
    plt.xlabel("Map Instance (le450_*)")
    plt.ylabel("Runtime (seconds)")
    plt.title("Strategy Efficiency Comparison on Three Maps")
    plt.grid(True, linestyle="--", alpha=0.35)
    plt.legend()
    plt.tight_layout()

    out_png = latest_dir / "three_maps_strategy_efficiency.png"
    plt.savefig(out_png, bbox_inches="tight")
    plt.close()

    print(f"Input CSV: {in_csv}")
    print(f"Output PNG: {out_png}")
    print("Note: Hollow markers indicate timeout runs.")


if __name__ == "__main__":
    main()

