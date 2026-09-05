import { FormEvent, useEffect, useRef, useState } from "react";
import Live2DCharacter from "./components/Live2DCharacter";
import type { Live2DCharacterHandle } from "./components/Live2DCharacter";
import {
  getCurrentModel,
  getApiKeyStatus,
  setApiKey,
  getMemory,
  MemoryMessage,
  resetMemory,
  sendMessage,
  setModel,
  sendInteraction,
} from "./api";

import { interactions } from "./interactions";
import type { InteractionName } from "./interactions";

export default function App() {
  const [messages, setMessages] = useState<MemoryMessage[]>([]);
  const [input, setInput] = useState("");
  const [model, setModelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Connecting to Amadeus...");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [apiKey, setApiKeyInput] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const missingKey = hasApiKey === false;
  const idleStatus = status === "Online" || status === "Memory cleared" || status.startsWith("Model set to ");
  const footerStatus = missingKey && idleStatus ? "No API key" : status;

  function closeSettings() {
    if (savingSettings) return;
    setApiKeyInput("");
    setSettingsError("");
    setSettingsOpen(false);
  }

  const bottomRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<Live2DCharacterHandle>(null);

  useEffect(() => {
    void initialize();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function initialize() {
    try {
      const [memory, currentModel, configured] = await Promise.all([
        getMemory(),
        getCurrentModel(),
        getApiKeyStatus(),
      ]);

      setMessages(memory);
      setModelName(currentModel);
      setHasApiKey(configured);
      setStatus("Online");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Backend unavailable"
      );
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    const text = input.trim();

    if (!text || loading) {
      return;
    }

    if (hasApiKey !== true) {
      setSettingsOpen(true);
      return;
    }

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: text,
      },
    ]);

    setInput("");
    setLoading(true);
    setStatus("Amadeus is thinking...");

    try {
      const reply = await sendMessage(text);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: reply,
        },
      ]);

      setStatus("Online");
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error ? error.message : "The request failed. Please try again.",
        },
      ]);

      setStatus(
        error instanceof Error
          ? error.message
          : "Request failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveModel() {
    const nextModel = model.trim();

    if (savingSettings || loading) return;
    if (!nextModel) {
      setSettingsError("Enter an LLM model.");
      return;
    }

    setSavingSettings(true);
    setSettingsError("");
    let keySaved = false;
    try {
      if (apiKey.trim()) {
        await setApiKey(apiKey.trim());
        keySaved = true;
        setHasApiKey(true);
        setApiKeyInput("");
      }
      await setModel(nextModel);

      setStatus(`Model set to ${nextModel}`);
      setSettingsOpen(false);
    } catch (error) {
      setSettingsError(
        (keySaved ? "API key saved, but model update failed. " : "") +
        (error instanceof Error ? error.message : "Could not save settings")
      );
    } finally {
      setSavingSettings(false);
    }
  }

  async function clearMemory() {
    const confirmed = window.confirm(
      "Clear Amadeus's conversation memory?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await resetMemory();

      setMessages([]);
      setStatus("Memory cleared");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not clear memory"
      );
    }
  }

  async function handleInteraction(name: InteractionName) {
    if (loading) return;

    const interaction = interactions[name];
    const result = characterRef.current?.playMotion(interaction.motion) ?? "not-ready";
    if (result === "busy") return;
    if (result !== "started") {
      setStatus(result === "missing" ? "Reaction animation is missing" : "Character is still loading");
      return;
    }

    setLoading(true);

    try {
      const reply = await sendInteraction(interaction.backendId);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: reply,
        },
      ]);

      setStatus("Online");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Interaction failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      {/* Character Panel */}
      <section className="character-panel">
        <header className="brand">
          <div className="brand-mark">
            A
          </div>

          <div>
            <h1>AMADEUS</h1>
            <p>Personal AI Companion</p>
          </div>
        </header>

        <div className="character-stage">
          <div className="scanline" />

          <div className="character-viewport">
            <Live2DCharacter ref={characterRef} />

            {(Object.keys(interactions) as InteractionName[]).map((name) => {
              const interaction = interactions[name];
              return (
                <button
                  key={name}
                  type="button"
                  className="touch-button"
                  style={interaction.position}
                  aria-label={interaction.label}
                  disabled={loading}
                  onClick={() => void handleInteraction(name)}
                >
                  {interaction.label}
                </button>
              );
            })}
          </div>
        </div>

        <footer className="system-footer" role="status" aria-live="polite">
          <span
            className={
              footerStatus === "No API key" ? "status-dot warning" : status === "Online"
                ? "status-dot online"
                : "status-dot"
            }
          />

          <span>
            {footerStatus}
          </span>
        </footer>
      </section>

      {/* Chat Panel */}
      <section className="chat-panel">
        <div className="chat-toolbar">
          <div>
            <span className="eyebrow">
              LAB MEMBER 004
            </span>

            <h2>
              Conversation
            </h2>
          </div>

          <div className="toolbar-actions">
            <button
              className="ghost-button"
              onClick={() => setSettingsOpen(true)}
            >
              Settings
            </button>

            <button
              className="ghost-button danger"
              onClick={clearMemory}
            >
              Reset memory
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <span>
                AMADEUS SYSTEM READY
              </span>

              <h3>
                Start a conversation.
              </h3>

              <p>
                Your existing Flask backend and memory system
                are still doing the actual work.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <article
              key={`${message.created_at ?? "message"}-${index}`}
              className={`message ${
                message.role === "user"
                  ? "user"
                  : "assistant"
              }`}
            >
              <div className="message-meta">
                {message.role === "user"
                  ? "YOU"
                  : "AMADEUS"}

                {message.created_at && (
                  <time>
                    {message.created_at}
                  </time>
                )}
              </div>

              <div className="bubble">
                {message.content}
              </div>
            </article>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <article className="message assistant">
              <div className="message-meta">
                AMADEUS
              </div>

              <div className="bubble typing">
                <i />
                <i />
                <i />
              </div>
            </article>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Message Input */}
        <form
          className="composer"
          onSubmit={submit}
        >
          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();

                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Message Amadeus..."
            rows={1}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
          >
            Send
          </button>
        </form>
      </section>

      {/* Settings Modal */}
      {settingsOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={closeSettings}
        >
          <div
            className="modal"
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">
                  SYSTEM CONFIGURATION
                </span>

                <h3>
                  Settings
                </h3>
              </div>

              <button
                className="close-button"
                onClick={closeSettings}
                disabled={savingSettings}
              >
                ×
              </button>
            </div>

            <label>
              OpenRouter API key
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKeyInput(event.target.value)}
                placeholder={hasApiKey ? "Enter a replacement key" : "Enter your API key"}
                autoComplete="new-password"
                spellCheck={false}
                disabled={savingSettings}
                aria-describedby="api-key-help"
              />
            </label>
            <p className="settings-help" id="api-key-help">
              {hasApiKey ? "A key is saved. Leave blank to keep it." : "No API key is saved."}
              {" "}Saved on the computer running Amadeus. Saving does not verify the key.
            </p>

            <label>
              LLM model

              <input
                value={model}
                disabled={savingSettings}
                onChange={(event) => {
                  setModelName(event.target.value);
                }}
                placeholder="deepseek/deepseek-v3.2-exp"
              />
            </label>

            {settingsError && <p className="settings-error" role="alert">{settingsError}</p>}

            <div className="modal-actions">
              <button
                className="ghost-button"
                onClick={closeSettings}
                disabled={savingSettings}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={saveModel}
                disabled={savingSettings || loading}
              >
                {savingSettings ? "Saving..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
