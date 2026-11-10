#!/usr/bin/env python3
"""Render the reviewed Health narration and authored visual cards into lesson videos."""

import argparse
import hashlib
import json
import math
import re
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs/course/health"
PUBLIC = ROOT / "public/course/health"
VIDEOS = PUBLIC / "videos"
CREAM = "#f2f0e9"
PAPER = "#faf9f5"
FOREST = "#103c30"
GOLD = "#c49a29"
MUTED = "#66736c"
GEORGIA = "/System/Library/Fonts/Supplemental/Georgia.ttf"
GEORGIA_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
AVENIR = "/System/Library/Fonts/Avenir.ttc"


def font(size, serif=False, bold=False):
    return ImageFont.truetype(GEORGIA_BOLD if serif and bold else GEORGIA if serif else AVENIR, size)


def wrap(draw, text, face, max_width):
    words = str(text).split()
    lines, line = [], ""
    for word in words:
        candidate = (line + " " + word).strip()
        if line and draw.textbbox((0, 0), candidate, font=face)[2] > max_width:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    return lines


def fitted_lines(draw, text, face, max_width, limit):
    lines = wrap(draw, text, face, max_width)
    if len(lines) <= limit:
        return lines
    visible = lines[:limit]
    tail = visible[-1]
    while tail and draw.textbbox((0, 0), tail + "…", font=face)[2] > max_width:
        tail = tail[:-1]
    visible[-1] = tail.rstrip() + "…"
    return visible


def draw_slide(lesson, block, section, destination):
    im = Image.new("RGB", (1280, 720), CREAM)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 1280, 9), fill=GOLD)
    mark = Image.open(ROOT / "public/course/assets/amg-mark.webp").convert("RGB")
    side = min(mark.size)
    left = (mark.width - side) // 2
    top = (mark.height - side) // 2
    mark = mark.crop((left, top, left + side, top + side)).resize((72, 72), Image.Resampling.LANCZOS)
    mask = Image.new("L", (72, 72))
    ImageDraw.Draw(mask).ellipse((0, 0, 71, 71), fill=255)
    im.paste(mark, (54, 40), mask)
    d.text((146, 48), "AMG  /  LEARNING", font=font(20), fill=FOREST)
    d.text((146, 76), "MARYLAND ACCIDENT & HEALTH", font=font(14), fill=GOLD)
    d.text((1020, 55), f"LESSON {lesson['number']:02d}  /  60", font=font(16), fill=MUTED)
    d.line((58, 131, 1222, 131), fill="#d8d2c2", width=2)
    d.text((58, 155), f"SECTION {section + 1:02d}  /  06", font=font(17), fill="#906d1d")
    title = block["title"]
    title_font = font(48 if len(title) < 38 else 41, serif=True, bold=True)
    title_lines = wrap(d, title, title_font, 1155)[:2]
    y = 188
    for line in title_lines:
        d.text((56, y), line, font=title_font, fill=FOREST)
        y += 57
    cards_top = max(297, y + 27)
    items = block["visual"]["items"]
    count = len(items)
    cols = 3 if count > 3 else count
    rows = (count + cols - 1) // cols
    gap = 18
    card_w = (1164 - gap * (cols - 1)) // cols
    card_h = min(230, (618 - cards_top - gap * (rows - 1)) // rows)
    heading_font = font(23 if cols <= 2 else 20, serif=True, bold=True)
    detail_font = font(18 if cols <= 2 else 16)
    for i, item in enumerate(items):
        col, row = i % cols, i // cols
        x = 58 + col * (card_w + gap)
        top = cards_top + row * (card_h + gap)
        d.rounded_rectangle((x, top, x + card_w, top + card_h), 18, fill=PAPER, outline="#dedacd", width=2)
        d.rectangle((x + 21, top + 21, x + 62, top + 26), fill=GOLD)
        title_lines = fitted_lines(d, item[0], heading_font, card_w - 42, 3)
        yy = top + 42
        for line in title_lines:
            d.text((x + 21, yy), line, font=heading_font, fill=FOREST)
            yy += 29
        yy += 9
        for line in fitted_lines(d, item[1], detail_font, card_w - 42, 5 if rows == 1 else 3):
            d.text((x + 21, yy), line, font=detail_font, fill=MUTED)
            yy += 23
    d.line((58, 657, 1222, 657), fill="#d8d2c2", width=2)
    d.rounded_rectangle((58, 678, 1222, 684), 3, fill="#ddd7ca")
    d.rounded_rectangle((58, 678, 58 + int(1164 * (section + 1) / 6), 684), 3, fill=GOLD)
    d.text((58, 630), lesson["title"], font=font(17), fill=FOREST)
    d.text((1070, 630), "AMG HEALTH", font=font(14), fill=GOLD)
    im.save(destination, optimize=True)


def timestamp(seconds):
    ms = round(seconds * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def caption_chunks(text):
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    chunks = []
    for sentence in sentences:
        words = sentence.split()
        groups = max(1, math.ceil(len(words) / 14))
        group_size = math.ceil(len(words) / groups)
        while words:
            chunks.append(" ".join(words[:group_size]))
            words = words[group_size:]
    return chunks


def update_captions(lesson_number, clips):
    key = f"{lesson_number:02d}"
    source = PUBLIC / f"lesson-{key}" / "lesson-data.js"
    lesson = json.loads(source.read_text().split(" = ", 1)[1].rstrip(";\n"))
    selected = [clips[lesson_number * 100 + i] for i in range(6)]
    captions = ["WEBVTT", ""]
    offset = 0.0
    for block, clip in zip(lesson["blocks"], selected):
        parts = caption_chunks(block["narration"])
        total_words = sum(len(part.split()) for part in parts)
        cursor = offset
        for part in parts:
            span = clip["duration_sec"] * len(part.split()) / total_words
            captions.extend((f"{timestamp(cursor)} --> {timestamp(cursor + span)}", part, ""))
            cursor += span
        offset += clip["duration_sec"]
    (SOURCE / f"captions-{key}.vtt").write_text("\n".join(captions))


def render(lesson_number, clips):
    key = f"{lesson_number:02d}"
    source = PUBLIC / f"lesson-{key}" / "lesson-data.js"
    lesson = json.loads(source.read_text().split(" = ", 1)[1].rstrip(";\n"))
    selected = [clips[lesson_number * 100 + i] for i in range(6)]
    VIDEOS.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=f"amg-h{key}-") as temporary:
        work = Path(temporary)
        slides, audio = [], []
        for i, (block, clip) in enumerate(zip(lesson["blocks"], selected)):
            slide = work / f"slide-{i}.png"
            draw_slide(lesson, block, i, slide)
            slides.append(slide)
            audio.append(PUBLIC / "audio" / clip["file"])
        slides_manifest = work / "slides.ffconcat"
        audio_manifest = work / "audio.ffconcat"
        slides_manifest.write_text("ffconcat version 1.0\n" + "".join(f"file '{slide}'\nduration {clip['duration_sec']:.4f}\n" for slide, clip in zip(slides, selected)) + f"file '{slides[-1]}'\n")
        audio_manifest.write_text("ffconcat version 1.0\n" + "".join(f"file '{file}'\n" for file in audio))
        output = VIDEOS / f"health-{key}.mp4"
        command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-safe", "0", "-f", "concat", "-i", str(slides_manifest), "-safe", "0", "-f", "concat", "-i", str(audio_manifest), "-map", "0:v", "-map", "1:a", "-vf", "fps=1,format=yuv420p", "-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage", "-crf", "29", "-c:a", "aac", "-b:a", "80k", "-ar", "48000", "-movflags", "+faststart", "-shortest", str(output)]
        subprocess.run(command, check=True)
        poster = VIDEOS / f"health-{key}.png"
        poster.write_bytes(slides[0].read_bytes())
    probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height", "-of", "json", str(output)]))
    duration = float(probe["format"]["duration"])
    if not (180 <= duration <= 330):
        raise ValueError(f"Unexpected lesson {key} duration: {duration}")
    if not {"h264", "aac"}.issubset({stream["codec_name"] for stream in probe["streams"]}):
        raise ValueError(f"Missing video or audio in lesson {key}")
    update_captions(lesson_number, clips)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    receipt = {"number": lesson_number, "status": "ready", "video": f"/course/health/videos/health-{key}.mp4", "poster": f"/course/health/videos/health-{key}.png", "duration": round(duration, 3), "narrator": {"name": "Zoe"}, "format": "Narrated instructional slides", "sha256": digest}
    (SOURCE / f"media-{key}.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(f"Health {key}: {duration:.1f}s, {output.stat().st_size / 1_000_000:.1f} MB", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lesson", type=int, action="append")
    parser.add_argument("--captions-only", action="store_true")
    args = parser.parse_args()
    selections = json.loads((SOURCE / "narration-reviewed.json").read_text())["clips"]
    clips = {row["index"]: row for row in selections}
    for lesson_number in args.lesson or range(1, 61):
        if args.captions_only:
            update_captions(lesson_number, clips)
        else:
            render(lesson_number, clips)


if __name__ == "__main__":
    main()
