#!/usr/bin/env python3
"""Bake English reaction WAVs from the Kurisu reference clip.

Uses Coqui XTTS v2 and backend/assets/reference_audio/kurisu10s.wav.
Japanese originals belong in backend/assets/reaction_audio/ja/.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# Coqui XTTS v2 asks for the CPML non-commercial agreement on first download.
os.environ.setdefault("COQUI_TOS_AGREED", "1")

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from chat_interactions import INTERACTION_RESPONSES  # noqa: E402

REF_WAV = BACKEND_DIR / "assets" / "reference_audio" / "kurisu10s.wav"
AUDIO_DIR = BACKEND_DIR / "assets" / "reaction_audio"
JA_DIR = AUDIO_DIR / "ja"


def spoken_text(raw: str) -> str:
    text = (raw or "").strip().strip("“”\"'")
    text = text.replace("…", "...")
    text = text.replace("—", ", ")
    return " ".join(text.split())


def reaction_jobs() -> list[tuple[Path, str]]:
    jobs: list[tuple[Path, str]] = []
    seen: set[Path] = set()
    for variants in INTERACTION_RESPONSES.values():
        for variant in variants:
            audio_url = variant.get("audio_url")
            text = spoken_text(str(variant.get("text") or ""))
            if not audio_url or not text:
                continue
            path = BACKEND_DIR / str(audio_url)
            if path in seen:
                continue
            seen.add(path)
            jobs.append((path, text))
    return jobs


def check_layout() -> None:
    if not REF_WAV.is_file():
        raise SystemExit(f"Missing speaker sample: {REF_WAV}")
    missing_ja = [path.name for path, _text in reaction_jobs() if not (JA_DIR / path.name).is_file()]
    if missing_ja:
        raise SystemExit("Missing Japanese originals in ja/: " + ", ".join(missing_ja))


def bake(jobs: list[tuple[Path, str]]) -> None:
    try:
        from TTS.api import TTS
    except ImportError as error:
        raise SystemExit(
            "Coqui TTS is not installed. Create backend/.venv-xtts and pip install 'coqui-tts[codec]' torch torchaudio 'transformers>=4.43,<5'."
        ) from error

    if not REF_WAV.is_file():
        raise SystemExit(f"Missing speaker sample: {REF_WAV}")

    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    for path, text in jobs:
        print(f"[bake] {path.name}: {text}")
        tts.tts_to_file(
            text=text,
            speaker_wav=str(REF_WAV),
            language="en",
            file_path=str(path),
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate inputs; do not synthesize.")
    args = parser.parse_args()
    jobs = reaction_jobs()
    if not jobs:
        raise SystemExit("No reaction lines with audio_url were found.")
    check_layout()
    print(f"[bake] {len(jobs)} English lines from {REF_WAV.name}")
    if args.check:
        return 0
    bake(jobs)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
