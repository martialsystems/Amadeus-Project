# Interaction recordings

Put your WAV or MP3 recordings in this directory. For example:

    frontend/public/audio/headpat-01.wav

In `backend/chat.py`, find `INTERACTION_RESPONSES`. Each variant pairs its displayed text with its recording:

```python
2: [
    {"text": "Hm? What is it?", "audio_url": "/audio/headpat-01.wav"},
    {"text": "You have my attention.", "audio_url": "/audio/headpat-02.wav"},
],
```

ID 1 is shoulder touch, 2 is head pat, and 3 is arm poke. IDs must match `backendId` in `frontend/src/interactions.ts`. The frontend's `motion` field still determines which reaction animation plays.

The backend randomly selects ONE variant, records its text in memory, and returns that same variant's text and audio URL. Use `None` for recordings you have not added yet. No recordings are included with this patch.

URLs must start with `/audio/`, without `frontend/public`. Filenames are case-sensitive. Restart Flask after editing the Python mapping; refresh the browser after adding files. To test one recording deterministically, temporarily keep just that variant in its list.

The reaction begins on click. Its matching recording starts when the backend reply arrives and the browser is ready to play. Audio drives mouth movement during the reaction. After the reaction, the body uses Talk until the recording finishes, then Idle. A new voiced interaction replaces any current speech; an unvoiced interaction leaves current speech playing. This is not frame-exact choreography.

Missing or invalid audio is reported in the status bar; the selected text and reaction still work. These prerecorded interactions do not call the LLM or GPT-SoVITS and need no API key. To change the spoken words, replace the recording too—editing the displayed text does not regenerate audio.
