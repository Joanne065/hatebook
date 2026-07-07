#!/usr/bin/env python3
"""Merge 小恨书2.docx quotes into existing default-data.json without removing anything."""
import json
import re
import uuid
from pathlib import Path

from docx import Document

ROOT = Path(__file__).resolve().parent.parent
DOCX = Path("/Users/joanne/Desktop/小恨书2.docx")
OUT = ROOT / "src" / "data" / "default-data.json"

AUTHOR_HEADER_RE = re.compile(r"^(?:\d+\.)?(.+?)\s*/\s*(.+)$")
SOURCE_RE = re.compile(r"^——(.+)$")
ORIGINAL_INLINE_RE = re.compile(r"(.+?)原文[：:]\s*(.+)")
ORIGINAL_LINE_RE = re.compile(r"^(?:英语|英文|德语|法语|俄语|日语|韩语|意大利语|西班牙语|葡萄牙语|原文|.+?原文)[：:]\s*(.+)$")
LIFESPAN_RE = re.compile(r"^\d{4}")
IP_RE = re.compile(r"^IP[：:]\s*(.+)$", re.I)
ZODIAC_RE = re.compile(r"(白羊座|金牛座|双子座|巨蟹座|狮子座|处女座|天秤座|天蝎座|射手座|摩羯座|水瓶座|双鱼座)")


def slugify(name_en: str) -> str:
    s = name_en.lower().strip()
    s = re.sub(r"[^\w\u4e00-\u9fff]+", "-", s)
    return s.strip("-") or str(uuid.uuid4())[:8]


def parse_tags(line: str) -> list[str]:
    parts = re.split(r"[、,，]", line)
    return [p.strip() for p in parts if p.strip()]


def is_author_header(line: str):
    if line.startswith("·") or SOURCE_RE.match(line) or ORIGINAL_LINE_RE.match(line):
        return None
    m = AUTHOR_HEADER_RE.match(line)
    if not m:
        return None
    name_en = m.group(2).strip()
    if not re.search(r"[A-Za-z]", name_en):
        return None
    return m


def parse_docx(path: Path) -> list[dict]:
    doc = Document(str(path))
    lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    authors: list[dict] = []
    current: dict | None = None
    quote: dict | None = None
    meta_stage = 0

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

    def skip_meta_line(line: str) -> bool:
        nonlocal meta_stage
        if meta_stage >= 5:
            return False
        if IP_RE.match(line):
            current["ip"] = IP_RE.match(line).group(1).strip()
            meta_stage = max(meta_stage, 1)
            return True
        if meta_stage >= 1 and LIFESPAN_RE.match(line):
            lifespan_raw = line
            zodiac_match = ZODIAC_RE.search(lifespan_raw)
            if zodiac_match:
                current["lifespan"] = lifespan_raw.replace(zodiac_match.group(1), "").strip()
                if zodiac_match.group(1) not in current["tags"]:
                    current["tags"].append(zodiac_match.group(1))
            else:
                current["lifespan"] = line
            meta_stage = max(meta_stage, 2)
            return True
        if meta_stage == 2 and not line.startswith("·") and not SOURCE_RE.match(line):
            current["profession"] = line
            meta_stage = 3
            return True
        if meta_stage == 3 and not line.startswith("·") and not SOURCE_RE.match(line):
            current["bio"] = line
            meta_stage = 4
            return True
        if meta_stage == 4 and not line.startswith("·") and not SOURCE_RE.match(line):
            tags = parse_tags(line)
            zodiac_match = ZODIAC_RE.search(line)
            if zodiac_match and zodiac_match.group(1) not in tags:
                tags.append(zodiac_match.group(1))
            current["tags"] = tags
            meta_stage = 5
            return True
        return False

    for line in lines:
        header = is_author_header(line)
        if header:
            finish_author()
            name_cn, name_en = header.group(1).strip(), header.group(2).strip()
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

        if skip_meta_line(line):
            continue

        src = SOURCE_RE.match(line)
        if src:
            if quote:
                quote["source"] = src.group(1).strip()
                finish_quote()
            continue

        orig_inline = ORIGINAL_INLINE_RE.match(line)
        if orig_inline and quote:
            quote["originalLabel"] = orig_inline.group(1).strip()
            quote["original"] = orig_inline.group(2).strip()
            continue

        orig_line = ORIGINAL_LINE_RE.match(line)
        if orig_line and quote:
            label = line.split("：", 1)[0].split(":", 1)[0].strip()
            quote["originalLabel"] = label.replace("原文", "").strip() or label
            quote["original"] = orig_line.group(1).strip()
            continue

        if line.startswith("·"):
            finish_quote()
            meta_stage = 5
            quote = {
                "id": str(uuid.uuid4()),
                "text": line.lstrip("·").strip(),
                "original": "",
                "originalLabel": "",
                "source": "",
            }
            continue

        if meta_stage >= 5 or (not current["ip"] and not LIFESPAN_RE.match(line)):
            finish_quote()
            meta_stage = 5
            quote = {
                "id": str(uuid.uuid4()),
                "text": line,
                "original": "",
                "originalLabel": "",
                "source": "",
            }

    finish_author()
    return authors


def norm(s: str) -> str:
    return re.sub(r"\s+", "", s or "")


def find_existing_author(existing: list, incoming: dict):
    inc_cn, inc_en = incoming["nameCn"], incoming["nameEn"].lower()
    inc_slug = incoming["id"]
    for a in existing:
        if a["id"] == inc_slug:
            return a
        if a["nameEn"].lower() == inc_en:
            return a
        if a["nameCn"] == inc_cn:
            return a
        if inc_cn in a["nameCn"] or a["nameCn"] in inc_cn:
            return a
        if inc_en.split()[0] and inc_en.split()[0] in a["nameEn"].lower():
            return a
    return None


def quote_key(q: dict) -> str:
    return norm(q.get("text", ""))


def merge(existing_authors: list, incoming_authors: list):
    merged = [json.loads(json.dumps(a, ensure_ascii=False)) for a in existing_authors]
    added_quotes = 0
    added_authors = 0

    for inc in incoming_authors:
        target = find_existing_author(merged, inc)
        if target:
            existing_texts = {quote_key(q) for q in target["quotes"]}
            for q in inc["quotes"]:
                key = quote_key(q)
                if not key or key in existing_texts:
                    continue
                target["quotes"].append(q)
                existing_texts.add(key)
                added_quotes += 1
            for field in ("ip", "lifespan", "profession", "bio", "tags"):
                if not target.get(field) and inc.get(field):
                    target[field] = inc[field]
        else:
            used_ids = {a["id"] for a in merged}
            author_id = inc["id"]
            if author_id in used_ids:
                author_id = f"{author_id}-{uuid.uuid4().hex[:6]}"
            inc = {**inc, "id": author_id}
            merged.append(inc)
            added_authors += 1
            added_quotes += len(inc["quotes"])

    return merged, added_quotes, added_authors


def main():
    if not DOCX.exists():
        raise SystemExit(f"Missing docx: {DOCX}")

    existing_payload = json.loads(OUT.read_text(encoding="utf-8"))
    incoming = parse_docx(DOCX)
    merged, added_quotes, added_authors = merge(existing_payload["authors"], incoming)

    total_quotes = sum(len(a["quotes"]) for a in merged)
    payload = {"authors": merged, "version": existing_payload.get("version", 1)}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Merged: +{added_authors} authors, +{added_quotes} quotes")
    print(f"Total: {len(merged)} authors, {total_quotes} quotes -> {OUT}")


if __name__ == "__main__":
    main()
