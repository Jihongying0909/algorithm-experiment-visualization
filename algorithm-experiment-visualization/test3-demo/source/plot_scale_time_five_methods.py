"""
Plot runtime-vs-scale curves for FIVE methods.

Input CSV can be either:
1) raw records with columns: n, strategy, time_sec
2) summary records with columns: n, strategy, avg_time_sec

Output:
  scale_time_five_methods.png

Usage examples:
  python plot_scale_time_five_methods.py
  python plot_scale_time_five_methods.py random_scale_five_strategies_raw.csv
  python plot_scale_time_five_methods.py random_scale_five_strategies_summary.csv out.png
"""

from __future__ import annotations

from pathlib import Path
import csv
import sys
from collections import defaultdict
from statistics import mean

import matplotlib.pyplot as plt


DEFAULT_METHODS = [
    "1_feasibility",
    "2_optimality",
    "3_search_order_MRV_DH",
    "4_dedup_redundancy",
    "5_tabucol",
]


def _to_int(x: str):
    try:
        return int(float(x))
    except Exception:
        return None


def _to_float(x: str):
    try:
        return float(x)
    except Exception:
        return None


def load_scale_strategy_times(csv_path: Path):
    """
    Returns dict:
      data[strategy][n] = avg_time
    """
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fields = set(reader.fieldnames or [])

    if not rows:
        raise ValueError("CSV is empty.")

    if "n" not in fields or "strategy" not in fields:
        raise ValueError("CSV must contain columns: n, strategy, and time_sec or avg_time_sec.")

    # Case A: summary CSV already has avg_time_sec
    if "avg_time_sec" in fields:
        out = defaultdict(dict)
        for r in rows:
            n = _to_int(r.get("n", ""))
            st = (r.get("strategy", "") or "").strip()
            t = _to_float(r.get("avg_time_sec", ""))
            if n is None or not st or t is None:
                continue
            out[st][n] = t
        return out

    # Case B: raw CSV with time_sec, aggregate by mean
    if "time_sec" in fields:
        bag = defaultdict(lambda: defaultdict(list))
        for r in rows:
            n = _to_int(r.get("n", ""))
            st = (r.get("strategy", "") or "").strip()
            t = _to_float(r.get("time_sec", ""))
            if n is None or not st or t is None:
                continue
            bag[st][n].append(t)

        out = defaultdict(dict)
        for st, d in bag.items():
            for n, arr in d.items():
                if arr:
                    out[st][n] = mean(arr)
        return out

    raise ValueError("CSV needs either time_sec (raw) or avg_time_sec (summary).")


def choose_default_csv(base: Path) -> Path:
    # Prefer five-strategy outputs first, then older four-strategy ones.
    candidates = [
        "random_scale_five_strategies_summary.csv",
        "random_scale_five_strategies_raw.csv",
        "random_scale_four_strategies_summary.csv",
        "random_scale_four_strategies_raw.csv",
    ]
    for name in candidates:
        p = base / name
        if p.exists():
            return p
    raise FileNotFoundError(
        "No default CSV found. Please pass CSV path explicitly.\n"
        "Expected one of: random_scale_five_strategies_summary.csv, "
        "random_scale_five_strategies_raw.csv, random_scale_four_strategies_summary.csv, "
        "random_scale_four_strategies_raw.csv"
    )


def plot_lines(data, out_png: Path):
    styles = {
        "1_feasibility": ("#ef4444", "o"),
        "2_optimality": ("#f59e0b", "s"),
        "3_search_order_MRV_DH": ("#2563eb", "^"),
        "4_dedup_redundancy": ("#7c3aed", "D"),
        "5_tabucol": ("#059669", "P"),
    }

    plt.figure(figsize=(10.8, 6.6), dpi=150)

    any_line = False
    for method in DEFAULT_METHODS:
        if method not in data or not data[method]:
            continue
        pairs = sorted(data[method].items(), key=lambda x: x[0])
        xs = [x for x, _ in pairs]
        ys = [y for _, y in pairs]
        color, marker = styles.get(method, ("#374151", "o"))
        plt.plot(xs, ys, marker=marker, linewidth=2.1, color=color, label=method)
        any_line = True

    if not any_line:
        raise ValueError("No valid (n, strategy, time) data found for plotting.")

    plt.xlabel("Graph Scale (n)")
    plt.ylabel("Runtime (seconds)")
    plt.title("Scale vs Runtime (Five Methods)")
    plt.grid(True, linestyle="--", alpha=0.35)
    plt.legend()
    plt.tight_layout()
    plt.savefig(out_png, bbox_inches="tight")
    plt.close()


def main():
    base = Path(__file__).resolve().parent
    if len(sys.argv) >= 2:
        in_csv = Path(sys.argv[1])
        if not in_csv.is_absolute():
            in_csv = base / in_csv
    else:
        in_csv = choose_default_csv(base)

    if len(sys.argv) >= 3:
        out_png = Path(sys.argv[2])
        if not out_png.is_absolute():
            out_png = base / out_png
    else:
        out_png = base / "scale_time_five_methods.png"

    data = load_scale_strategy_times(in_csv)
    plot_lines(data, out_png)
    print(f"Input: {in_csv}")
    print(f"Output: {out_png}")


if __name__ == "__main__":
    main()

