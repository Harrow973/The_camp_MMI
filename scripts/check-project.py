#!/usr/bin/env python3
"""
Project integrity checks for The Camp.

Usage:
  python3 scripts/check-project.py
"""

from __future__ import annotations

import glob
import os
import re
import subprocess
import sys


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def html_files() -> list[str]:
    return ["index.html"] + sorted(glob.glob("pages/*/*.html", root_dir=ROOT))


def all_html_files() -> list[str]:
    return sorted(glob.glob("**/*.html", root_dir=ROOT, recursive=True))


def all_css_files() -> list[str]:
    return sorted(glob.glob("**/*.css", root_dir=ROOT, recursive=True))


def all_js_files() -> list[str]:
    return sorted(glob.glob("scripts/**/*.js", root_dir=ROOT, recursive=True))


def has_inline_style_or_script() -> tuple[list[str], list[str]]:
    inline_style = []
    inline_script = []
    for rel in html_files():
        path = os.path.join(ROOT, rel)
        txt = read_text(path)
        if "<style" in txt.lower():
            inline_style.append(rel)
        if re.search(r"<script(?![^>]*\bsrc=)", txt, re.IGNORECASE):
            inline_script.append(rel)
    return inline_style, inline_script


def check_html_refs() -> list[tuple[str, str, str]]:
    missing: list[tuple[str, str, str]] = []
    for rel in all_html_files():
        path = os.path.join(ROOT, rel)
        txt = read_text(path)
        base_match = re.search(r"<base\s+href=[\"']([^\"']+)[\"']", txt, re.IGNORECASE)
        base_href = base_match.group(1) if base_match else ""

        for match in re.finditer(
            r"(?:src|href|poster)=[\"']([^\"']+)[\"']", txt, re.IGNORECASE
        ):
            raw = match.group(1)
            if raw.startswith(
                ("http://", "https://", "data:", "#", "mailto:", "tel:", "javascript:")
            ):
                continue
            rel_target = raw.split("?")[0].split("#")[0]
            if not rel_target:
                continue

            root_dir = os.path.dirname(path)
            if base_href:
                root_dir = os.path.normpath(os.path.join(root_dir, base_href))
            resolved = os.path.normpath(os.path.join(root_dir, rel_target))
            if not os.path.exists(resolved):
                missing.append((rel, rel_target, os.path.relpath(resolved, ROOT)))
    return missing


def check_css_refs() -> list[tuple[str, str, str, str]]:
    missing: list[tuple[str, str, str, str]] = []
    for rel in all_css_files():
        path = os.path.join(ROOT, rel)
        txt = read_text(path)

        for m in re.finditer(
            r"@import\s+url\([\"']([^\"']+)[\"']\)", txt, re.IGNORECASE
        ):
            raw = m.group(1)
            if raw.startswith(("http://", "https://", "data:")):
                continue
            resolved = os.path.normpath(os.path.join(os.path.dirname(path), raw))
            if not os.path.exists(resolved):
                missing.append((rel, "@import", raw, os.path.relpath(resolved, ROOT)))

        for m in re.finditer(r"url\(([^\)]+)\)", txt, re.IGNORECASE):
            raw = m.group(1).strip().strip("\"'")
            if not raw or raw.startswith(("http://", "https://", "data:", "#")):
                continue
            rel_target = raw.split("?")[0].split("#")[0]
            resolved = os.path.normpath(os.path.join(os.path.dirname(path), rel_target))
            if not os.path.exists(resolved):
                missing.append((rel, "url()", raw, os.path.relpath(resolved, ROOT)))

    return missing


def check_js_syntax() -> list[tuple[str, str]]:
    failures: list[tuple[str, str]] = []
    for rel in all_js_files():
        path = os.path.join(ROOT, rel)
        proc = subprocess.run(["node", "--check", path], capture_output=True, text=True)
        if proc.returncode != 0:
            failures.append((rel, proc.stderr.strip()))
    return failures


def main() -> int:
    os.chdir(ROOT)

    inline_style, inline_script = has_inline_style_or_script()
    missing_html = check_html_refs()
    missing_css = check_css_refs()
    js_failures = check_js_syntax()

    print("=== The Camp Integrity Check ===")
    print(f"Active pages checked: {len(html_files())}")
    print(f"Inline style pages: {len(inline_style)}")
    print(f"Inline script pages: {len(inline_script)}")
    print(f"Missing HTML refs: {len(missing_html)}")
    print(f"Missing CSS refs: {len(missing_css)}")
    print(f"JS syntax failures: {len(js_failures)}")

    ok = not (
        inline_style or inline_script or missing_html or missing_css or js_failures
    )
    if ok:
        print("\nOK: all checks passed.")
        return 0

    if inline_style:
        print("\nInline style found in:")
        for rel in inline_style[:20]:
            print(f"- {rel}")

    if inline_script:
        print("\nInline script found in:")
        for rel in inline_script[:20]:
            print(f"- {rel}")

    if missing_html:
        print("\nMissing HTML references:")
        for rel, target, resolved in missing_html[:30]:
            print(f"- {rel}: {target} -> {resolved}")

    if missing_css:
        print("\nMissing CSS references:")
        for rel, kind, target, resolved in missing_css[:30]:
            print(f"- {rel} [{kind}]: {target} -> {resolved}")

    if js_failures:
        print("\nJS syntax errors:")
        for rel, err in js_failures[:10]:
            print(f"- {rel}\n{err}\n")

    return 1


if __name__ == "__main__":
    sys.exit(main())
