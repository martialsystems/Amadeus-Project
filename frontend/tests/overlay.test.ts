import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const timerSrc = await readFile(new URL("../src/sleepTimer.ts", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const main = await readFile(new URL("../electron/main.cjs", import.meta.url), "utf8");

assert.doesNotMatch(app, /Message Amadeus/);
assert.doesNotMatch(app, /Conversation/);
assert.doesNotMatch(app, /sendMessage/);
assert.match(app, /className="overlay"/);
assert.match(app, /sendInteraction/);
assert.match(app, /ZzzLayer/);
assert.match(app, /startSleepTimer/);
assert.match(timerSrc, /IDLE_SLEEP_MS = 45_000/);
assert.match(css, /\.overlay\s*\{/);
assert.match(css, /\.zzz-layer/);
assert.doesNotMatch(css, /\.chat-panel/);
assert.match(main, /transparent:\s*true/);
assert.match(main, /alwaysOnTop:\s*true/);
assert.match(main, /WINDOW_WIDTH = 480/);
assert.match(main, /WINDOW_HEIGHT = 640/);
assert.match(main, /setIgnoreMouseEvents/);
