import assert from "node:assert/strict";
import { SpeechPlayer } from "../src/audio/SpeechPlayer";

class FakeAudio extends EventTarget {
  static instance: FakeAudio;
  paused = true;
  error: object | null = null;
  src = "";
  constructor() { super(); FakeAudio.instance = this; }
  load() {}
  removeAttribute() { this.src = ""; }
  pause() { this.paused = true; this.dispatchEvent(new Event("pause")); }
  async play() { this.paused = false; this.dispatchEvent(new Event("playing")); }
}
let resume: (() => void) | undefined;
let deferResume = false;
class FakeContext {
  state = "suspended";
  destination = {};
  createAnalyser() {
    return { fftSize: 256, connect() {}, disconnect() {},
      getByteTimeDomainData(samples: Uint8Array) { samples.fill(150); } };
  }
  createMediaElementSource() { return { connect() {}, disconnect() {} }; }
  async resume() {
    if (deferResume) await new Promise<void>(resolve => { resume = resolve; });
    this.state = "running";
  }
  async close() { this.state = "closed"; }
}
const globals = globalThis as any;
const original = [globals.Audio, globals.AudioContext, globals.requestAnimationFrame, globals.cancelAnimationFrame];
globals.Audio = FakeAudio;
globals.AudioContext = FakeContext;
let frame: (() => void) | undefined;
globals.requestAnimationFrame = (callback: () => void) => { frame = callback; return 1; };
globals.cancelAnimationFrame = () => { frame = undefined; };
try {
  let speaking = false;
  let amplitude = 0;
  const player = new SpeechPlayer({ onSpeakingChange: value => { speaking = value; }, onAmplitude: value => { amplitude = value; } });
  await player.play("http://speech/test");
  assert.equal(speaking, true);
  frame?.();
  assert.ok(amplitude >= 0 && amplitude <= 1);
  FakeAudio.instance.dispatchEvent(new Event("waiting"));
  assert.equal(speaking, false);
  assert.equal(amplitude, 0);
  FakeAudio.instance.dispatchEvent(new Event("playing"));
  assert.equal(speaking, true);
  player.stop();
  assert.equal(speaking, false);
  assert.equal(amplitude, 0);
  player.destroy();
  player.destroy();
  deferResume = true;
  const pending = new SpeechPlayer({ onSpeakingChange() {}, onAmplitude() {} });
  const playing = pending.play("http://speech/stale");
  pending.destroy();
  resume?.();
  await playing;
  assert.equal(FakeAudio.instance.src, "", "destroy prevents delayed playback from resuming");
  console.log("PASS: speech buffering/resume, stop, mouth reset, destruction during audio unlock");
} finally {
  [globals.Audio, globals.AudioContext, globals.requestAnimationFrame, globals.cancelAnimationFrame] = original;
}
