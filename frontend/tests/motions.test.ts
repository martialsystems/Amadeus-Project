import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CubismFramework } from "@framework/live2dcubismframework";
import { CubismModelSettingJson } from "@framework/cubismmodelsettingjson";
import { CubismMoc } from "@framework/model/cubismmoc";
import { MotionPlayer } from "../src/live2d/MotionPlayer";
import { KurisuModel } from "../src/live2d/KurisuModel";

const base = new URL("../public/live2d/kurisu/", import.meta.url);
const arrayBuffer = (buffer: Uint8Array) => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
const json = JSON.parse(await readFile(new URL("kurisu.model3.json", base), "utf8"));
// A new group must work without adding methods or fields to the player.
json.FileReferences.Motions.Wave = json.FileReferences.Motions.TapReaction;
const expectedMotionRequests = Object.values(json.FileReferences.Motions).reduce(
  (count: number, variants: any) => count + variants.length,
  0
);
const settingsBytes = new TextEncoder().encode(JSON.stringify(json));
const originalFetch = globalThis.fetch;
let requests = 0;
globalThis.fetch = async (input, init) => {
  init?.signal?.throwIfAborted();
  requests++;
  const file = new URL(String(input)).pathname.split("/").pop()!;
  return new Response(await readFile(new URL(file, base)));
};

CubismFramework.startUp();
CubismFramework.initialize();
const settings = new CubismModelSettingJson(arrayBuffer(settingsBytes), settingsBytes.byteLength);
const moc = CubismMoc.create(arrayBuffer(await readFile(new URL("kurisu.moc3", base))));
assert.ok(moc);
const model = moc.createModel();
assert.ok(model);
model.saveParameters();
const player = new MotionPlayer();
const frame = () => {
  model.loadParameters();
  player.update(model, 1 / 60);
  model.update();
};
const advance = (seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) frame();
};

try {
  assert.equal(player.playMotion("TapReaction"), "not-ready");
  await player.load(settings, "http://assets/", new AbortController().signal);
  assert.equal(requests, expectedMotionRequests, "all groups are discovered and preloaded");
  assert.equal(player.playMotion("Unknown"), "missing");
  advance(1);
  const angle = CubismFramework.getIdManager().getId("Param4");
  assert.notEqual(model.getParameterValueById(angle), 0, "idle updates the actual model");
  assert.equal(player.playMotion("TapReaction"), "started");
  assert.equal(player.playMotion("TapReaction"), "busy");
  advance(4);
  const mouth = CubismFramework.getIdManager().getId("ParamMouthOpenY");
  const mouthIndex = model.getParameterIndex(mouth);
  assert.equal(model.getParameterValueById(mouth), model.getParameterDefaultValue(mouthIndex), "reaction-only parameters return to base pose");
  assert.equal(player.playMotion("TapReaction"), "started", "reaction can replay after idle resumes");
  advance(4);
  assert.equal(player.playMotion("Wave"), "started", "new groups need no player changes");
  advance(4);
  assert.equal(requests, expectedMotionRequests, "clicks never fetch motion files");
  const internal = player as any;
  player.setSpeaking(true);
  advance(7);
  assert.equal(internal.manager.isFinished(), false, "talk continues beyond one cycle");
  assert.equal(player.playMotion("PatReaction"), "started");
  assert.equal(player.playMotion("TapReaction"), "busy", "reactions cannot interrupt each other");
  player.setSpeaking(false);
  assert.equal(internal.manager.getCurrentPriority(), 2, "ending speech preserves active reaction");
  advance(20);
  assert.equal(internal.manager.getCurrentPriority(), 1, "reaction returns to baseline");
  player.setSpeaking(true);
  assert.equal(player.playMotion("PatReaction"), "started");
  advance(20);
  assert.equal(internal.speaking, true);
  assert.equal(internal.manager.getCurrentPriority(), 1, "reaction returns to talk while speaking");
  player.setSpeaking(false);
  player.release();
  player.release();
  assert.equal(player.playMotion("Wave"), "not-ready");
  console.log("PASS: preload, actual model updates, one-shot reaction, idle recovery, repeat clicks, new groups, disposal");

  // Destroy while a fetch is pending: no model or GPU work may resume afterward.
  globalThis.fetch = (_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal!.reason), { once: true });
  });
  const pendingModel = new KurisuModel({} as WebGLRenderingContext);
  const loading = pendingModel.load("http://assets/kurisu.model3.json");
  pendingModel.release();
  pendingModel.release();
  await assert.rejects(loading, { name: "AbortError" });
  assert.equal(pendingModel.playMotion("TapReaction"), "not-ready");
  console.log("PASS: destruction cancels pending model loading");
} finally {
  player.release();
  moc.deleteModel(model);
  moc.release();
  settings.release();
  CubismFramework.dispose();
  globalThis.fetch = originalFetch;
}
