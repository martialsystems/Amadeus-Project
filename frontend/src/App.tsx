import { useEffect, useRef, useState } from "react";
import Live2DCharacter from "./components/Live2DCharacter";
import type { Live2DCharacterHandle } from "./components/Live2DCharacter";
import { sendInteraction } from "./api";
import { startOverlayPointer } from "./overlayPointer";
import { interactions } from "./interactions";
import type { InteractionName } from "./interactions";

export default function App() {
  const [busy, setBusy] = useState(false);
  const characterRef = useRef<Live2DCharacterHandle>(null);

  useEffect(() => {
    return startOverlayPointer({
      hitTest: (x, y) => characterRef.current?.hitTest(x, y) ?? false,
    });
  }, []);

  async function handleInteraction(name: InteractionName) {
    if (busy) return;

    const interaction = interactions[name];
    const result = characterRef.current?.playMotion(interaction.motion) ?? "not-ready";
    if (result !== "started") return;

    const speechReady = characterRef.current?.prepareSpeech().then(
      () => true,
      () => false,
    );
    setBusy(true);

    try {
      const reply = await sendInteraction(interaction.backendId);
      if (reply.speechUrl && await speechReady) {
        await characterRef.current?.playSpeech(reply.speechUrl);
      }
    } catch (error) {
      console.error("Interaction failed:", error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="overlay">
      <div className="character-viewport">
        <Live2DCharacter
          ref={characterRef}
          onSpeechError={(message) => console.error(message)}
        />

        {(Object.keys(interactions) as InteractionName[]).map((name) => {
          const interaction = interactions[name];
          return (
            <button
              key={name}
              type="button"
              className="touch-button"
              style={interaction.position}
              aria-label={interaction.label}
              disabled={busy}
              onClick={() => void handleInteraction(name)}
            >
              {interaction.label}
            </button>
          );
        })}
      </div>
    </main>
  );
}
