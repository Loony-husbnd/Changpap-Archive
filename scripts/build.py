#!/usr/bin/env python3
"""videos/ 폴더를 스캔해 videos.json 과 썸네일(thumbs/)을 만든다.

선택: meta.json 으로 제목/아티스트/태그를 덮어쓸 수 있다.
  {"파일명.mp4": {"title": "제목", "artist": "댄서", "tags": ["솔로", "2024"]}}
"""
import json, subprocess, sys, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VIDEOS, THUMBS = ROOT / "videos", ROOT / "thumbs"
EXTS = {".mp4", ".webm", ".m4v", ".mov", ".mkv", ".ogv"}
BROWSER_OK = {".mp4", ".webm", ".m4v", ".ogv"}

def probe(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "json", str(p)], capture_output=True, text=True)
    try:
        return float(json.loads(r.stdout)["format"]["duration"])
    except Exception:
        return 0.0

def thumb(p, dur, out):
    if out.exists() and out.stat().st_mtime >= p.stat().st_mtime:
        return True
    r = subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(dur * 0.1), "-i", str(p),
                        "-frames:v", "1", "-vf", "scale=480:-2", "-q:v", "4", str(out)])
    return r.returncode == 0

def main():
    if not shutil.which("ffprobe"):
        print("ffmpeg/ffprobe 가 필요합니다 (썸네일·길이 추출용).", file=sys.stderr); sys.exit(1)
    meta_path = ROOT / "meta.json"
    meta = json.loads(meta_path.read_text("utf-8")) if meta_path.exists() else {}
    THUMBS.mkdir(exist_ok=True)
    cfg_path = ROOT / "config.json"
    cfg = json.loads(cfg_path.read_text("utf-8")) if cfg_path.exists() else {}
    base = cfg.get("mediaBase", "").rstrip("/")  # 예: https://videos.example.com
    items = []
    for p in sorted(VIDEOS.rglob("*")):
        if p.suffix.lower() not in EXTS or p.name.startswith("."):
            continue
        rel = p.relative_to(ROOT).as_posix()
        key = p.relative_to(VIDEOS).as_posix()
        m = meta.get(key) or meta.get(p.name) or {}
        dur = probe(p)
        tp = THUMBS / (p.stem + ".jpg")
        ok = thumb(p, dur, tp)
        if p.suffix.lower() not in BROWSER_OK:
            print(f"! {key}: 브라우저에서 재생이 안 될 수 있음 (mp4/H.264 로 변환 권장)")
        items.append({
            "id": p.stem if p.stem.isascii() else key.replace("/", "-").rsplit(".", 1)[0],
            "file": f"{base}/{key}" if base else rel,
            "title": m.get("title") or p.stem.replace("_", " "),
            "artist": m.get("artist", ""),
            "tags": m.get("tags", []) + ([p.parent.name] if p.parent != VIDEOS else []),
            "duration": round(dur, 1),
            "thumb": tp.relative_to(ROOT).as_posix() if ok else "",
            "added": int(p.stat().st_mtime),
        })
    (ROOT / "videos.json").write_text(json.dumps(items, ensure_ascii=False, indent=1), "utf-8")
    print(f"영상 {len(items)}개 → videos.json")

main()
