#!/usr/bin/env python3
"""Download author portraits into public/avatars and update avatar-manifest.json."""
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HELPERS = ROOT / "src" / "utils" / "helpers.ts"
DATA = ROOT / "src" / "data" / "default-data.json"
MANIFEST = ROOT / "src" / "data" / "avatar-manifest.json"
OUT = ROOT / "public" / "avatars"


def load_wiki_urls() -> dict[str, str]:
    text = HELPERS.read_text(encoding="utf-8")
    block = text.split("AUTHOR_AVATARS", 1)[1].split("};", 1)[0]
    return dict(re.findall(r"'([^']+)': '(https://[^']+)'", block))


def safe_filename(author_id: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "_", author_id) + ".jpg"


def wiki_titles(name_en: str, name_cn: str) -> list[str]:
    titles: list[str] = []
    en = name_en.strip().split("/")[0].strip()
    if en and re.search(r"[A-Za-z]", en):
        titles.append(en)
    parts = re.split(r"[·・]", name_cn)
    if parts:
        titles.append(parts[-1].strip())
        titles.append(parts[0].strip())
    titles.append(name_cn.strip())
    seen: set[str] = set()
    out: list[str] = []
    for t in titles:
        if t and t not in seen:
            seen.add(t)
            out.append(t)
    return out


def fetch_wiki_thumb(name_en: str, name_cn: str):
    for title in wiki_titles(name_en, name_cn):
        for lang in ("en", "zh"):
            url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title)}"
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "XiaoHenShu/1.0"})
                with urllib.request.urlopen(req, timeout=20) as resp:
                    data = json.loads(resp.read().decode())
                thumb = data.get("thumbnail", {}).get("source")
                if thumb:
                    return thumb
            except Exception:
                continue
    return None


def download_url(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "XiaoHenShu/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        dest.write_bytes(resp.read())


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    wiki_urls = load_wiki_urls()
    authors = json.loads(DATA.read_text(encoding="utf-8"))["authors"]
    manifest: dict[str, str] = {}
    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    for author in authors:
        aid = author["id"]
        if aid in manifest:
            local_file = OUT / manifest[aid].replace("avatars/", "")
            if local_file.exists():
                print(f"keep {aid}")
                continue

        dest = OUT / safe_filename(aid)
        urls_to_try = []
        thumb = fetch_wiki_thumb(author.get("nameEn", ""), author.get("nameCn", ""))
        if thumb:
            urls_to_try.append(thumb)
        if aid in wiki_urls:
            urls_to_try.append(wiki_urls[aid])

        ok = False
        for url in urls_to_try:
            try:
                download_url(url, dest)
                manifest[aid] = f"avatars/{dest.name}"
                print(f"ok {aid}")
                ok = True
                time.sleep(0.4)
                break
            except Exception as e:
                print(f"fail {aid}: {e}")
                time.sleep(0.8)
        if not ok:
            print(f"skip {aid}")

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"manifest: {len(manifest)} avatars")


if __name__ == "__main__":
    main()
