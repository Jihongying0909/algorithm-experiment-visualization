"""
Plot one runtime curve figure per k value (five strategies per figure).

Input:
  latest random_scale_by_k_*/summary_results.csv
  or specify a csv path as argv[1]

Output:
  <result_dir>/plots_by_k/k_<k>_runtime.png
"""

from __future__ import annotations

from pathlib import Path
import csv
import sys
from collections import defaultdict

import matplotlib.pyplot as plt


STRATEGIES = [
    "1_feasibility",
    "2_optimality",
    "3_search_order_MRV_DH",
    "4_dedup_redundancy",
    "5_tabucol",
]
TARGET_K_ORDER = [5, 10, 15, 20, 25]

COLORS = {
    "1_feasibility": "#ef4444",
    "2_optimality": "#f59e0b",
    "3_search_order_MRV_DH": "#2563eb",
    "4_dedup_redundancy": "#7c3aed",
    "5_tabucol": "#059669",
}

MARKERS = {
    "1_feasibility": "o",
    "2_optimality": "s",
    "3_search_order_MRV_DH": "^",
    "4_dedup_redundancy": "D",
    "5_tabucol": "P",
}


def pick_latest_summary(base: Path) -> Path:
    dirs = sorted([p for p in base.glob("random_scale_by_k_*") if p.is_dir()], key=lambda p: p.name)
    if not dirs:
        raise FileNotFoundError("No random_scale_by_k_* directory found.")
    latest = dirs[-1]
    csv_path = latest / "summary_results.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Missing summary file: {csv_path}")
    return csv_path


def main() -> None:
    base = Path(__file__).resolve().parent
    if len(sys.argv) > 1:
        in_csv = Path(sys.argv[1])
        if not in_csv.is_absolute():
            in_csv = base / in_csv
    else:
        in_csv = pick_latest_summary(base)

    rows = []
    with in_csv.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        raise ValueError("CSV is empty.")

    required = {"k", "n", "strategy", "avg_time_sec", "timeout_sec"}
    if not required.issubset(set(rows[0].keys())):
        raise ValueError(f"CSV missing required columns: {sorted(required)}")

    by_k = defaultdict(list)
    for r in rows:
        by_k[int(float(r["k"]))].append(r)

    out_dir = in_csv.parent / "plots_by_k"
    out_dir.mkdir(parents=True, exist_ok=True)

    ordered_ks = [k for k in TARGET_K_ORDER if k in by_k] + [k for k in sorted(by_k.keys()) if k not in TARGET_K_ORDER]
    for k in ordered_ks:
        part = by_k[k]
        timeout_sec = float(part[0]["timeout_sec"])

        plt.figure(figsize=(10.8, 6.2), dpi=150)
        for st in STRATEGIES:
            data = [r for r in part if r["strategy"] == st]
            if not data:
                continue
            data.sort(key=lambda r: int(float(r["n"])))
            xs = [int(float(r["n"])) for r in data]
            ys = [float(r["avg_time_sec"]) for r in data]
            plt.plot(
                xs,
                ys,
                color=COLORS[st],
                marker=MARKERS[st],
                linewidth=2.1,
                label=st,
            )

        # timeout reference line
        plt.axhline(timeout_sec, color="#9ca3af", linestyle="--", linewidth=1.5, label=f"timeout={timeout_sec:.0f}s")
        plt.xlabel("Graph Scale (n)")
        plt.ylabel("Average Runtime (seconds)")
        plt.title(f"Random Scale Efficiency Comparison (k={k})")
        plt.grid(True, linestyle="--", alpha=0.35)
        plt.legend()
        plt.tight_layout()

        out_png = out_dir / f"k_{k}_runtime.png"
        plt.savefig(out_png, bbox_inches="tight")
        plt.close()
        print(f"Saved: {out_png}")

    missing = [k for k in TARGET_K_ORDER if k not in by_k]
    if missing:
        print(f"Missing k data (not plotted): {missing}")
    print(f"\nAll figures folder: {out_dir}")


if __name__ == "__main__":
    main()
