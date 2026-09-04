import { FormEvent, useEffect, useRef, useState } from "react";

import {
  getCurrentModel,
  getMemory,
  MemoryMessage,
  resetMemory,
  sendMessage,
  setModel,
} from "./api";

export default function App() {
  const [messages, setMessages] = useState<MemoryMessage[]>([]);
  const [input, setInput] = useState("");
  const [model, setModelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Connecting to Amadeus...");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

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
      const [memory, currentModel] = await Promise.all([
        getMemory(),
        getCurrentModel(),
      ]);

      setMessages(memory);
      setModelName(currentModel);
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
            "I couldn't reach the backend. Make sure the Flask server is running on port 5000.",
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

    if (!nextModel) {
      return;
    }

    try {
      await setModel(nextModel);

      setStatus(`Model set to ${nextModel}`);
      setSettingsOpen(false);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not change model"
      );
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

          <div className="character-placeholder">
            <span>LIVE2D</span>

            <strong>
              Character viewport
            </strong>

            <small>
              Cubism model goes here next
            </small>
          </div>
        </div>

        <footer className="system-footer">
          <span
            className={
              status === "Online"
                ? "status-dot online"
                : "status-dot"
            }
          />

          <span>
            {status}
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
          onMouseDown={() => {
            setSettingsOpen(false);
          }}
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
                onClick={() => {
                  setSettingsOpen(false);
                }}
              >
                ×
              </button>
            </div>

            <label>
              LLM model

              <input
                value={model}
                onChange={(event) => {
                  setModelName(event.target.value);
                }}
                placeholder="deepseek/deepseek-v3.2-exp"
              />
            </label>

            <div className="modal-actions">
              <button
                className="ghost-button"
                onClick={() => {
                  setSettingsOpen(false);
                }}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={saveModel}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

