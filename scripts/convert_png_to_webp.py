#!/usr/bin/env python3
"""
Convert recursively PNG/JPG images to WebP with backup.

Usage examples:
  python3 scripts/convert_png_to_webp.py
  python3 scripts/convert_png_to_webp.py --img-dir img --quality 90
  python3 scripts/convert_png_to_webp.py --replace

Behavior:
  1) Backup all target image files found in --img-dir into --backup-root/<timestamp>/
  2) Convert images -> WebP recursively (same relative paths)
  3) If --replace is set, delete original files after successful conversion
"""

from __future__ import annotations

import argparse
import datetime as dt
import shutil
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert PNG/JPG images to WebP with backup"
    )
    parser.add_argument(
        "--img-dir", default="img", help="Source image directory (default: img)"
    )
    parser.add_argument(
        "--backup-root",
        default="backups",
        help="Backup root directory (default: backups)",
    )
    parser.add_argument(
        "--quality", type=int, default=85, help="WebP quality 0-100 (default: 85)"
    )
    parser.add_argument("--lossless", action="store_true", help="Use lossless WebP")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete original files after successful conversion",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip conversion if target .webp already exists",
    )
    parser.add_argument(
        "--extensions",
        default="png,jpg,jpeg",
        help="Comma-separated source extensions (default: png,jpg,jpeg)",
    )
    return parser.parse_args()


def collect_image_files(root: Path, extensions: set[str]) -> list[Path]:
    return sorted(
        p
        for p in root.rglob("*")
        if p.is_file() and p.suffix.lower().lstrip(".") in extensions
    )


def create_backup_dir(backup_root: Path) -> Path:
    timestamp = dt.datetime.now().strftime("img-png-backup-%Y%m%d-%H%M%S")
    backup_dir = backup_root / timestamp
    backup_dir.mkdir(parents=True, exist_ok=False)
    return backup_dir


def backup_files(files: list[Path], source_root: Path, backup_dir: Path) -> None:
    for src in files:
        rel = src.relative_to(source_root)
        dst = backup_dir / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


def main() -> int:
    args = parse_args()

    try:
        from PIL import Image
    except ImportError:
        print(
            "ERROR: Pillow is required. Install with: pip install pillow",
            file=sys.stderr,
        )
        return 1

    source_root = Path(args.img_dir).resolve()
    backup_root = Path(args.backup_root).resolve()

    if not source_root.exists() or not source_root.is_dir():
        print(f"ERROR: image directory not found: {source_root}", file=sys.stderr)
        return 1

    if not (0 <= args.quality <= 100):
        print("ERROR: --quality must be between 0 and 100", file=sys.stderr)
        return 1

    extensions = {
        ext.strip().lower().lstrip(".")
        for ext in args.extensions.split(",")
        if ext.strip()
    }
    if not extensions:
        print("ERROR: --extensions cannot be empty", file=sys.stderr)
        return 1

    image_files = collect_image_files(source_root, extensions)
    if not image_files:
        ext_list = ", ".join(sorted(extensions))
        print(f"No image files ({ext_list}) found in: {source_root}")
        return 0

    backup_dir = create_backup_dir(backup_root)
    backup_files(image_files, source_root, backup_dir)

    converted = 0
    skipped = 0
    failed = 0

    for src_path in image_files:
        webp_path = src_path.with_suffix(".webp")

        if webp_path.exists() and args.skip_existing:
            skipped += 1
            continue

        try:
            with Image.open(src_path) as img:
                if img.mode not in ("RGB", "RGBA"):
                    img = img.convert("RGBA" if "A" in img.getbands() else "RGB")

                save_kwargs = {
                    "format": "WEBP",
                    "quality": args.quality,
                    "method": 6,
                    "lossless": args.lossless,
                }
                img.save(webp_path, **save_kwargs)

            if args.replace:
                src_path.unlink()

            converted += 1
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"FAILED: {src_path} -> {webp_path} ({exc})", file=sys.stderr)

    print("Conversion complete")
    print(f"- source: {source_root}")
    print(f"- backup: {backup_dir}")
    print(f"- files total: {len(image_files)}")
    print(f"- converted: {converted}")
    print(f"- skipped: {skipped}")
    print(f"- failed: {failed}")
    print(f"- replace originals: {'yes' if args.replace else 'no'}")

    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
