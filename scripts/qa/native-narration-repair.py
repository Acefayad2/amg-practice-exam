#!/usr/bin/env python3
"""Native-only, hash-bound audio repairs with exact video packet preservation.

This script is prepared locally for inspection. Run only in the Higgsfield
sandbox, with a reserved final-MP4 upload URL supplied by the calling wrapper.
It never publishes QA reports. The wrapper uploads the produced MP4 in the
same native invocation and confirms only a successful HTTP 200 upload.
"""

import argparse
import datetime
import hashlib
import json
import pathlib
import re
import shutil
import subprocess

import numpy as np


def digest(path):
    h = hashlib.sha256()
    with open(path, "rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def command(args):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError("Native media operation failed; inspect its known local output safely")
    return result.stdout, result.stderr


def probe(path):
    return json.loads(command([
        "ffprobe", "-v", "error", "-show_streams", "-show_format",
        "-of", "json", str(path),
    ])[0])


def video_hash(path):
    return command([
        "ffmpeg", "-v", "error", "-i", str(path), "-map", "0:v:0",
        "-c", "copy", "-f", "hash", "-hash", "sha256", "-",
    ])[0].strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("config")
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()
    config_path = pathlib.Path(args.config)
    config = json.loads(config_path.read_text())
    source = pathlib.Path(config["sourcePath"])
    target = pathlib.Path(args.output_dir)
    if not str(source).startswith("/home/user/") or not str(target).startswith("/home/user/"):
        raise ValueError("Media processing is restricted to native sandbox paths")
    if digest(source) != config["sourceFileSha256"]:
        raise ValueError("Source file identity mismatch")
    target.mkdir(parents=True, exist_ok=False)
    before = probe(source)
    audio = next(s for s in before["streams"] if s["codec_type"] == "audio")
    channels, rate = int(audio["channels"]), int(audio["sample_rate"])
    duration = float(before["format"]["duration"])
    if abs(duration - config["expectedDuration"]) > .001:
        raise ValueError("Unexpected source duration")
    raw, edited = target / "original.f32", target / "edited.f32"
    command([
        "ffmpeg", "-v", "error", "-threads", "1", "-i", str(source),
        "-map", "0:a:0", "-f", "f32le", "-acodec", "pcm_f32le",
        "-ar", str(rate), "-ac", str(channels), "-y", str(raw),
    ])
    shutil.copyfile(raw, edited)
    original = np.memmap(raw, dtype="<f4", mode="r").reshape(-1, channels)
    changed = np.memmap(edited, dtype="<f4", mode="r+").reshape(-1, channels)
    intervals, evidence = [], []
    last_end = 0
    for index, edit in enumerate(config["edits"]):
        start, end = float(edit["replaceStart"]), float(edit["replaceEnd"])
        if not (last_end <= start < end <= duration):
            raise ValueError("Invalid or overlapping repair interval")
        left, right = round(start * rate), round(end * rate)
        if right > len(changed):
            raise ValueError("Repair exceeds decoded audio samples")
        changed[left:right] = 0
        detail = dict(edit)
        ramp_seconds = float(edit.get("quietEdgeRampSeconds", .01))
        if not 0 < ramp_seconds <= .02:
            raise ValueError("Quiet-edge ramp must be positive and no longer than 20 milliseconds")
        ramp = round(ramp_seconds * rate)
        if ramp < 2 or 2 * ramp >= right - left:
            raise ValueError("Repair interval cannot accommodate the quiet-edge ramps")
        if left > 0:
            changed[left:left + ramp] = original[left:left + ramp] * np.linspace(1, 0, ramp)[:, None]
        changed[right - ramp:right] = original[right - ramp:right] * np.linspace(0, 1, ramp)[:, None]
        detail["quietEdgeRampSeconds"] = ramp / rate
        detail["leadingSourceRampApplied"] = left > 0
        detail["quietEdgeRampScope"] = "Source-preserving fade to/from zero wholly inside the measured quiet repair boundaries"
        if left == 0:
            detail["fileStartQualification"] = "At time zero there is no preceding audio to join; keep the leading region silent to avoid retaining a clipped original opening phoneme."
        if edit["kind"] == "tts-speech-patch":
            if edit["preparedPcmChannels"] != channels or edit["preparedPcmSampleRate"] != rate:
                raise ValueError("Prepared speech PCM layout/rate does not match the source")
            patch = pathlib.Path(edit["preparedPcmPath"])
            if not str(patch).startswith("/home/user/") or digest(patch) != edit["preparedPcmSha256"]:
                raise ValueError("Prepared speech patch identity mismatch")
            samples = np.memmap(patch, dtype="<f4", mode="r").reshape(-1, channels)
            at = round(edit["patchAt"] * rate)
            if not left + ramp <= at < at + len(samples) <= right - ramp:
                raise ValueError("Prepared speech patch overlaps a quiet-edge ramp or exceeds its interval")
            changed[at:at + len(samples)] = samples
            detail["patchDuration"] = len(samples) / rate
        elif edit["kind"] != "duplicate-speech-removal":
            raise ValueError("Unsupported repair kind")
        intervals.append((left, right))
        evidence.append(detail)
        last_end = end
    changed.flush()
    cursor = 0
    for left, right in intervals + [(len(original), len(original))]:
        if not np.array_equal(original[cursor:left], changed[cursor:left]):
            raise ValueError("PCM changed outside an authorized repair interval")
        cursor = right
    if not np.isfinite(changed).all() or np.abs(changed).max() >= 1:
        raise ValueError("Non-finite or full-scale repaired PCM")
    final = target / "final.mp4"
    command([
        "ffmpeg", "-v", "error", "-threads", "1", "-i", str(source),
        "-f", "f32le", "-ar", str(rate), "-ac", str(channels), "-i", str(edited),
        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac",
        "-b:a", "192k", "-t", str(config["expectedDuration"]),
        "-movflags", "+faststart", "-y", str(final),
    ])
    after = probe(final)
    original_hash, final_hash = video_hash(source), video_hash(final)
    if original_hash != final_hash:
        raise ValueError("Compressed video bitstream changed")
    old_video = next(s for s in before["streams"] if s["codec_type"] == "video")
    new_video = next(s for s in after["streams"] if s["codec_type"] == "video")
    for key in ("codec_name", "width", "height", "nb_frames", "duration", "time_base", "avg_frame_rate"):
        if old_video.get(key) != new_video.get(key):
            raise ValueError("Video frame/timing metadata changed")
    if abs(float(after["format"]["duration"]) - config["expectedDuration"]) > .001:
        raise ValueError("Final container duration changed")
    command(["ffmpeg", "-v", "error", "-threads", "1", "-i", str(final), "-f", "null", "-"])
    _, volume = command([
        "ffmpeg", "-hide_banner", "-threads", "1", "-i", str(final), "-vn",
        "-af", "silencedetect=noise=-42dB:d=0.8,volumedetect", "-f", "null", "-",
    ])
    (target / "audio-stats.txt").write_text(volume)
    silence_intervals = []
    for match in re.finditer(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", volume):
        end, length = map(float, match.groups())
        silence_intervals.append({"start": end - length, "end": end, "duration": length})
    starts = re.findall(r"silence_start: ([\d.]+)", volume)
    if len(starts) > len(silence_intervals):
        start = float(starts[-1])
        silence_intervals.append({"start": start, "end": duration, "duration": duration - start})
    if any(item["duration"] > 2.5 for item in silence_intervals):
        raise ValueError("Repaired file contains an unresolved long silence")
    volume_db = {
        "mean_volume": float(re.search(r"mean_volume: ([-\d.]+)", volume).group(1)),
        "max_volume": float(re.search(r"max_volume: ([-\d.]+)", volume).group(1)),
    }
    if volume_db["max_volume"] >= 0:
        raise ValueError("Full-scale peak after final AAC encode")
    _, loudness = command([
        "ffmpeg", "-hide_banner", "-threads", "1", "-i", str(final), "-vn",
        "-af", "loudnorm=I=-18:TP=-1.5:LRA=7:print_format=json", "-f", "null", "-",
    ])
    loudness_stats = json.loads(loudness[loudness.rfind("{"):])
    if not (-19 <= float(loudness_stats["input_i"]) <= -17 and float(loudness_stats["input_tp"]) <= -1):
        raise ValueError("Final audio level is outside the reviewed course range")
    report = {
        "number": config["number"], "status": "repaired-awaiting-full-review",
        "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "configSha256": digest(config_path), "scriptSha256": digest(__file__),
        "inputFileSha256": digest(source), "outputFileSha256": digest(final),
        "video": config["outputVideo"], "mediaId": config["outputMediaId"],
        "repairs": evidence, "unmodifiedPcmOutsideInterval": True,
        "pcmComparisonScope": "Exact decoded float32 PCM before final AAC encoding; final AAC samples are not claimed identical.",
        "originalVideoStreamHash": original_hash, "finalVideoStreamHash": final_hash,
        "pictureUnchanged": True, "duration": float(after["format"]["duration"]),
        "decodeExitCode": 0, "technical": after,
        "loudness": loudness_stats, "volumeDb": volume_db,
        "silenceIntervals": silence_intervals,
    }
    if len(evidence) == 1:
        report["repair"] = evidence[0]
        for key in ("generation", "generatedAudioFileSha256"):
            if key in evidence[0]:
                report[key] = evidence[0][key]
    (target / "repair.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"number": config["number"], "status": report["status"], "outputFileSha256": report["outputFileSha256"]}))


if __name__ == "__main__":
    main()
