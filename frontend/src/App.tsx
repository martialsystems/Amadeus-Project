import { useEffect, useRef, useState } from "react";
import Live2DCharacter from "./components/Live2DCharacter";
import type { Live2DCharacterHandle } from "./components/Live2DCharacter";
import ZzzLayer from "./components/ZzzLayer";
import { sendInteraction } from "./api";
import { startOverlayPointer } from "./overlayPointer";
import { startSleepTimer } from "./sleepTimer";
import { interactions } from "./interactions";
import type { InteractionName } from "./interactions";

export default function App() {
  const [busy, setBusy] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const characterRef = useRef<Live2DCharacterHandle>(null);
  const sleepRef = useRef<ReturnType<typeof startSleepTimer> | null>(null);

  function wake() {
    setSleeping(false);
    characterRef.current?.setSleeping(false);
  }

  function noteActivity() {
    sleepRef.current?.poke();
  }

  useEffect(() => {
    const timer = startSleepTimer({
      onSleep() {
        setSleeping(true);
        characterRef.current?.setSleeping(true);
      },
      onWake() {
        wake();
      },
    });
    sleepRef.current = timer;
    return () => {
      timer.stop();
      sleepRef.current = null;
    };
  }, []);

  useEffect(() => {
    return startOverlayPointer({
      hitTest: (x, y) => characterRef.current?.hitTest(x, y) ?? false,
      onActivity: noteActivity,
    });
  }, []);

  async function handleInteraction(name: InteractionName) {
    if (busy) return;
    noteActivity();

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
        {sleeping ? <ZzzLayer /> : null}

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
