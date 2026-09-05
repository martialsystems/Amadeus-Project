import { CubismModelSettingJson } from "@framework/cubismmodelsettingjson";
import { CubismMatrix44 } from "@framework/math/cubismmatrix44";
import { CubismUserModel } from "@framework/model/cubismusermodel";
import { CubismMotion } from "@framework/motion/cubismmotion";

export class KurisuModel extends CubismUserModel {
  private modelSetting: CubismModelSettingJson | null = null;
  private modelHomeDir = "";

  private gl: WebGLRenderingContext;
  private textures: WebGLTexture[] = [];
  private lastUpdateTime = 0;
  private idleMotion: CubismMotion | null = null;
  private tapMotion: CubismMotion | null = null;

  constructor(gl: WebGLRenderingContext) {
    super();

    this.gl = gl;
  }

  async load(modelJsonPath: string): Promise<void> {
    console.log("Loading model3.json:", modelJsonPath);

    const response = await fetch(modelJsonPath);

    if (!response.ok) {
      throw new Error(
        `Failed to load model JSON: ${response.status} ${modelJsonPath}`
      );
    }

    const jsonBuffer = await response.arrayBuffer();

    this.modelSetting = new CubismModelSettingJson(
      jsonBuffer,
      jsonBuffer.byteLength
    );

    const slashIndex = modelJsonPath.lastIndexOf("/");

    this.modelHomeDir =
      slashIndex >= 0
        ? modelJsonPath.substring(0, slashIndex + 1)
        : "";

    await this.loadMoc();

    this.createRenderer(
      this.gl.canvas.width,
      this.gl.canvas.height
    );

    this.getRenderer().startUp(this.gl);

    await this.loadTextures();
    this.idleMotion = await this.loadMotionGroup("Idle", true);
    this.tapMotion = await this.loadMotionGroup("TapReaction", false);

    if (this._motionManager && this.idleMotion && this.tapMotion) {
      this._motionManager.startMotionPriority(this.idleMotion, false, 1);
    }    

    this.lastUpdateTime = performance.now();
    console.log("Kurisu model loaded successfully");
  }

  private async loadMoc(): Promise<void> {
    if (!this.modelSetting) {
      throw new Error("Model setting not initialized");
    }

    const mocFile = this.modelSetting.getModelFileName();

    if (!mocFile) {
      throw new Error(
        "No Moc file specified in model3.json"
      );
    }

    const mocPath = this.modelHomeDir + mocFile;

    console.log("Loading moc3:", mocPath);

    const response = await fetch(mocPath);

    if (!response.ok) {
      throw new Error(
        `Failed to load moc3: ${response.status} ${mocPath}`
      );
    }

    const mocBuffer = await response.arrayBuffer();

    this.loadModel(mocBuffer);

    if (!this.getModel()) {
      throw new Error(
        "Cubism failed to create model from moc3"
      );
    }

    console.log("moc3 loaded");
  }

  private async loadTextures(): Promise<void> {
    if (!this.modelSetting) {
      throw new Error("Model setting not initialized");
    }

    const textureCount =
      this.modelSetting.getTextureCount();

    console.log(
      `Loading ${textureCount} Live2D texture(s)`
    );

    for (let i = 0; i < textureCount; i++) {
      const textureFile =
        this.modelSetting.getTextureFileName(i);

      if (!textureFile) {
        continue;
      }

      const texturePath =
        this.modelHomeDir + textureFile;

      console.log("Loading texture:", texturePath);

      const texture =
        await this.createWebGLTexture(texturePath);

      this.textures.push(texture);

      this.getRenderer().bindTexture(i, texture);
    }

    this.getRenderer().setIsPremultipliedAlpha(
      true
    );
  }

  private createWebGLTexture(
    path: string
  ): Promise<WebGLTexture> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        const texture = this.gl.createTexture();

        if (!texture) {
          reject(
            new Error(
              `Unable to create WebGL texture: ${path}`
            )
          );

          return;
        }

        this.gl.bindTexture(
          this.gl.TEXTURE_2D,
          texture
        );

        this.gl.pixelStorei(
          this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
          1
        );

        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          image
        );

        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MIN_FILTER,
          this.gl.LINEAR
        );

        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MAG_FILTER,
          this.gl.LINEAR
        );

        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_S,
          this.gl.CLAMP_TO_EDGE
        );

        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_T,
          this.gl.CLAMP_TO_EDGE
        );

        this.gl.bindTexture(
          this.gl.TEXTURE_2D,
          null
        );

        resolve(texture);
      };

      image.onerror = () => {
        reject(
          new Error(
            `Failed to load texture image: ${path}`
          )
        );
      };

      image.src = path;
    });
  }

  private async loadMotionGroup(
    group: string,
    loop: boolean
  ): Promise<CubismMotion | null> {
    const settings = this.modelSetting;

    if (!settings) {
      throw new Error("Model settings are not initialized");
    }

    const file = settings.getMotionFileName(group, 0);

    if (!file) {
      throw new Error(`No motion configured for ${group}`);
    }

    const response = await fetch(this.modelHomeDir + file);

    if (!response.ok) {
      throw new Error(
        `Failed to load ${group}: ${response.status}`
      );
    }

    const buffer = await response.arrayBuffer();

    if (!this._motionManager) {
      return null;
    }

    const motion = this.loadMotion(
      buffer,
      buffer.byteLength,
      group
    );

    if (!motion) {
      throw new Error(`Could not create ${group} motion`);
    }

    const eyeBlinkIds = Array.from(
      { length: settings.getEyeBlinkParameterCount() },
      (_, index) => settings.getEyeBlinkParameterId(index)
    );

    const lipSyncIds = Array.from(
      { length: settings.getLipSyncParameterCount() },
      (_, index) => settings.getLipSyncParameterId(index)
    );

    motion.setEffectIds(eyeBlinkIds, lipSyncIds);
    motion.setLoop(loop);
    motion.setLoopFadeIn(false);
    motion.setFadeInTime(0.2);
    motion.setFadeOutTime(0.2);

    return motion;
  }

playTapReaction(): void {
  if (!this._motionManager || !this.tapMotion || !this.idleMotion) {
    return;
  }

  // Ignore additional animation triggers while reacting.
  if (this._motionManager.getCurrentPriority() > 1) {
    return;
  }

  // Keep the motion in memory so it can be played again.
  this._motionManager.startMotionPriority(this.tapMotion, false, 2);
}


  update(): void {
    const model = this.getModel();
    const manager = this._motionManager;

    if (!model || !manager) {
      return;
    }

    const now = performance.now();
    const deltaTimeSeconds =
      this.lastUpdateTime === 0
        ? 0
        : Math.min((now - this.lastUpdateTime) / 1000, 0.1);

    this.lastUpdateTime = now;

    // Resume idle when the reaction has finished.
    if (manager.isFinished() && this.idleMotion) {
      manager.startMotionPriority(this.idleMotion, false, 1);
    }

    // Start from the saved base pose each frame.
    // This prevents reaction-only parameters from staying stuck.
    model.loadParameters();
    manager.updateMotion(model, deltaTimeSeconds);
    model.update();
  }

  draw(
    matrix: CubismMatrix44,
    viewport: number[]
  ): void {
    if (!this.getModel()) {
      return;
    }

    const finalMatrix =
      new CubismMatrix44();

    finalMatrix.setMatrix(
      matrix.getArray()
    );

    finalMatrix.multiplyByMatrix(
      this.getModelMatrix()
    );

    const renderer = this.getRenderer();

    renderer.setMvpMatrix(finalMatrix);

    renderer.setRenderState(
      null,
      viewport
    );

    renderer.drawModel(
      "/cubism-shaders/WebGL/"
    );
  }

  override release(): void {
    for (const texture of this.textures) {
      this.gl.deleteTexture(texture);
    }

    this.textures = [];

    // Release the manager before releasing our cached motions.
    super.release();

    this.idleMotion?.release();
    this.tapMotion?.release();

    this.idleMotion = null;
    this.tapMotion = null;
  }
}