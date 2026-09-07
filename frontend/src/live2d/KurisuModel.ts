import { CubismModelSettingJson } from "@framework/cubismmodelsettingjson";
import { CubismFramework } from "@framework/live2dcubismframework";
import { CubismMatrix44 } from "@framework/math/cubismmatrix44";
import { CubismUserModel } from "@framework/model/cubismusermodel";
import { MotionPlayer } from "./MotionPlayer";
import type { PlayMotionResult } from "./MotionPlayer";
import { loadTexture } from "./textureLoader";

/** Loads the character and delegates animation and texture work. */
export class KurisuModel extends CubismUserModel {
  private settings: CubismModelSettingJson | null = null;
  private readonly motions = new MotionPlayer();
  private readonly loading = new AbortController();
  private readonly textures: WebGLTexture[] = [];
  private released = false;
  private ready = false;
  private speaking = false;
  private sleeping = false;
  private sleepBlend = 0;
  private lipSyncValue = 0;
  private readonly mouthOpenId = CubismFramework.getIdManager().getId("ParamMouthOpenY");
  private readonly eyeOpenId = CubismFramework.getIdManager().getId("ParamEyeROpen");

  constructor(private readonly gl: WebGLRenderingContext) {
    super();
  }

  async load(modelJsonPath: string): Promise<void> {
    const signal = this.loading.signal;
    const directory = modelJsonPath.slice(0, modelJsonPath.lastIndexOf("/") + 1);
    const json = await this.fetchBuffer(modelJsonPath);
    signal.throwIfAborted();
    this.settings = new CubismModelSettingJson(json, json.byteLength);

    const mocFile = this.settings.getModelFileName();
    if (!mocFile) throw new Error("No Moc file configured in model3.json");
    const moc = await this.fetchBuffer(directory + mocFile);
    signal.throwIfAborted();
    this.loadModel(moc);
    if (!this.getModel()) throw new Error("Cubism could not create the model");
    // Seed the pose restored by the first animation frame.
    this.getModel().saveParameters();

    this.createRenderer(this.gl.canvas.width, this.gl.canvas.height);
    const renderer = this.getRenderer();
    renderer.startUp(this.gl);
    for (let index = 0; index < this.settings.getTextureCount(); index++) {
      const file = this.settings.getTextureFileName(index);
      if (!file) continue;
      const texture = await loadTexture(this.gl, directory + file, signal);
      if (signal.aborted) {
        this.gl.deleteTexture(texture);
        signal.throwIfAborted();
      }
      this.textures.push(texture);
      renderer.bindTexture(index, texture);
    }
    renderer.setIsPremultipliedAlpha(true);

    await this.motions.load(this.settings, directory, signal);
    signal.throwIfAborted();
    this.ready = true;
  }

  private async fetchBuffer(path: string): Promise<ArrayBuffer> {
    const response = await fetch(path, { signal: this.loading.signal });
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    return response.arrayBuffer();
  }

  playMotion(group: string): PlayMotionResult {
    return this.ready ? this.motions.playMotion(group) : "not-ready";
  }

  setSpeaking(speaking: boolean): void {
    this.speaking = speaking;
    this.motions.setSpeaking(speaking);

    if (!speaking) {
      this.lipSyncValue = 0;
      if (this.ready) this.getModel().setParameterValueById(this.mouthOpenId, 0);
    }
  }

  setLipSyncValue(value: number): void {
    this.lipSyncValue = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  }

  setSleeping(sleeping: boolean): void {
    this.sleeping = sleeping;
  }

  update(deltaSeconds: number): void {
    if (!this.ready) return;
    const model = this.getModel();
    model.loadParameters();
    this.motions.update(model, deltaSeconds);
    // Carry the blended motion pose into the next frame. Saving before
    // lip-sync keeps audio-driven mouth values out of the motion baseline.
    model.saveParameters();
    if (this.speaking) {
      model.setParameterValueById(this.mouthOpenId, this.lipSyncValue);
    }
    const sleepTarget = this.sleeping ? 1 : 0;
    const sleepStep = deltaSeconds / 0.4;
    if (this.sleepBlend < sleepTarget) {
      this.sleepBlend = Math.min(sleepTarget, this.sleepBlend + sleepStep);
    } else if (this.sleepBlend > sleepTarget) {
      this.sleepBlend = Math.max(sleepTarget, this.sleepBlend - sleepStep);
    }
    if (this.sleepBlend > 0) {
      const open = model.getParameterValueById(this.eyeOpenId);
      model.setParameterValueById(this.eyeOpenId, open * (1 - this.sleepBlend));
    }
    model.update();
  }

  draw(matrix: CubismMatrix44, viewport: number[]): void {
    if (!this.ready) return;
    const finalMatrix = new CubismMatrix44();
    finalMatrix.setMatrix(matrix.getArray());
    finalMatrix.multiplyByMatrix(this.getModelMatrix());
    const renderer = this.getRenderer();
    renderer.setMvpMatrix(finalMatrix);
    // WebGL uses null for the canvas framebuffer; the SDK declaration omits it.
    renderer.setRenderState(null!, viewport);
    renderer.drawModel("/cubism-shaders/WebGL/");
  }

  override release(): void {
    if (this.released) return;
    this.released = true;
    this.ready = false;
    this.speaking = false;
    this.sleeping = false;
    this.sleepBlend = 0;
    this.lipSyncValue = 0;
    this.loading.abort();
    this.motions.release();
    super.release();
    for (const texture of this.textures) this.gl.deleteTexture(texture);
    this.textures.length = 0;
    this.settings?.release();
    this.settings = null;
  }
}
