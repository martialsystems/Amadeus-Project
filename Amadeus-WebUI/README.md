# Amadeus WebUI MVP

Text-first React/Vite frontend for the existing Amadeus Flask backend.

## Run

Keep the existing Amadeus Flask backend running on port 5000, then:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Integration

Place this folder at `Amadeus-Project/WebUI/`. No existing Python file is changed for the MVP.

## Included

- Loads existing memory from `/getMemory`
- Sends chat to `/`
- Gets/sets current LLM model
- Resets memory
- Responsive UI
- Character viewport reserved for Live2D Cubism

## Next step

Embed Cubism SDK for Web in the left character viewport, then serve TTS audio to the browser so playback/lip-sync lives in the frontend.
