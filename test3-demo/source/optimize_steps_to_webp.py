from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


METHOD_DIRS = [
    "1_feasibility",
    "2_optimality",
    "3_search_order_MRV_DH",
    "4_dedup_redundancy",
    "5_tabucol",
]


def convert_png_to_webp(root: Path, quality: int, max_width: int) -> tuple[int, int]:
    converted = 0
    skipped = 0

    for method in METHOD_DIRS:
        folder = root / method
        if not folder.exists():
            continue

        for png in folder.glob("step_*.png"):
            webp = png.with_suffix(".webp")
            if webp.exists() and webp.stat().st_mtime >= png.stat().st_mtime:
                skipped += 1
                continue

            with Image.open(png) as im:
                im = im.convert("RGB")
                w, h = im.size
                if w > max_width:
                    new_h = int(h * (max_width / w))
                    im = im.resize((max_width, new_h), Image.Resampling.LANCZOS)
                im.save(webp, "WEBP", quality=quality, method=6)
            converted += 1

    return converted, skipped


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert step PNG files to compressed WebP files.")
    parser.add_argument(
        "--root",
        default=r"D:\Study_study\python_code\algorithm\test3\github_pages_ready",
        help="Root folder containing method directories.",
    )
    parser.add_argument("--quality", type=int, default=72, help="WebP quality (0-100).")
    parser.add_argument("--max-width", type=int, default=1600, help="Resize if wider than this width.")
    args = parser.parse_args()

    root = Path(args.root)
    converted, skipped = convert_png_to_webp(root, args.quality, args.max_width)
    print(f"done: converted={converted}, skipped={skipped}, root={root}")


if __name__ == "__main__":
    main()

