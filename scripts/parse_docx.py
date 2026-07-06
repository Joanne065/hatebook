#!/usr/bin/env python3
"""Parse 小恨书.docx into default-data.json"""
import json
import re
import uuid
from pathlib import Path

from docx import Document

ROOT = Path(__file__).resolve().parent.parent
DOCX = ROOT / "小恨书.docx"
OUT = ROOT / "src" / "data" / "default-data.json"

ORIGINAL_RE = re.compile(r"(.+?)原文[：:]\s*(.+)")
AUTHOR_HEADER_RE = re.compile(r"^\d+\.(.+?)\s*/\s*(.+)$")
SOURCE_RE = re.compile(r"^——(.+)$")
LIFESPAN_RE = re.compile(r"^\d{4}")
ZODIAC_RE = re.compile(r"(白羊座|金牛座|双子座|巨蟹座|狮子座|处女座|天秤座|天蝎座|射手座|摩羯座|水瓶座|双鱼座)")


def slugify(name_en: str) -> str:
    s = name_en.lower().strip()
    s = re.sub(r"[^\w\u4e00-\u9fff]+", "-", s)
    return s.strip("-") or str(uuid.uuid4())[:8]


def parse_tags(line: str) -> list[str]:
    parts = re.split(r"[、,，]", line)
    return [p.strip() for p in parts if p.strip()]


def main():
    doc = Document(str(DOCX))
    lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    authors: list[dict] = []
    current: dict | None = None
    quote: dict | None = None
    meta_stage = 0  # 0=ip, 1=lifespan, 2=profession, 3=bio, 4=tags

    def finish_quote():
        nonlocal quote
        if current and quote and quote.get("text"):
            current["quotes"].append(quote)
        quote = None

    def finish_author():
        nonlocal current, meta_stage
        finish_quote()
        if current and current.get("quotes"):
            authors.append(current)
        current = None
        meta_stage = 0

    for line in lines:
        m = AUTHOR_HEADER_RE.match(line)
        if m:
            finish_author()
            name_cn, name_en = m.group(1).strip(), m.group(2).strip()
            current = {
                "id": slugify(name_en),
                "nameCn": name_cn,
                "nameEn": name_en,
                "ip": "",
                "lifespan": "",
                "profession": "",
                "bio": "",
                "tags": [],
                "quotes": [],
            }
            continue

        if not current:
            continue

        if meta_stage < 5 and not line.startswith("·") and not SOURCE_RE.match(line) and not ORIGINAL_RE.match(line):
            if meta_stage == 0 and (line.startswith("IP：") or line.startswith("IP:")):
                current["ip"] = line.split("：", 1)[-1].split(":", 1)[-1].strip()
                meta_stage = 1
                continue
            if meta_stage == 1 and LIFESPAN_RE.match(line):
                lifespan_raw = line
                zodiac_match = ZODIAC_RE.search(lifespan_raw)
                if zodiac_match:
                    current["lifespan"] = lifespan_raw.replace(zodiac_match.group(1), "").strip()
                    if zodiac_match.group(1) not in current["tags"]:
                        current["tags"].append(zodiac_match.group(1))
                else:
                    current["lifespan"] = line
                meta_stage = 2
                continue
            if meta_stage == 2:
                current["profession"] = line
                meta_stage = 3
                continue
            if meta_stage == 3:
                current["bio"] = line
                meta_stage = 4
                continue
            if meta_stage == 4:
                tags = parse_tags(line)
                zodiac_match = ZODIAC_RE.search(line)
                if zodiac_match and zodiac_match.group(1) not in tags:
                    tags.append(zodiac_match.group(1))
                current["tags"] = tags
                meta_stage = 5
                continue

        src = SOURCE_RE.match(line)
        if src:
            if quote:
                quote["source"] = src.group(1).strip()
                finish_quote()
            continue

        orig = ORIGINAL_RE.match(line)
        if orig and quote:
            quote["originalLabel"] = orig.group(1).strip()
            quote["original"] = orig.group(2).strip()
            continue

        if line.startswith("·"):
            finish_quote()
            quote = {
                "id": str(uuid.uuid4()),
                "text": line.lstrip("·").strip(),
                "original": "",
                "originalLabel": "",
                "source": "",
            }
            continue

        # Standalone quote line (no bullet)
        if meta_stage >= 5:
            finish_quote()
            quote = {
                "id": str(uuid.uuid4()),
                "text": line,
                "original": "",
                "originalLabel": "",
                "source": "",
            }

    finish_author()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    total_quotes = sum(len(a["quotes"]) for a in authors)
    payload = {"authors": authors, "version": 1}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(authors)} authors, {total_quotes} quotes -> {OUT}")


if __name__ == "__main__":
    main()
