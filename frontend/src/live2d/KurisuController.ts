import { CubismMatrix44 } from "@framework/math/cubismmatrix44";

import { initializeCubism } from "./cubismBootstrap";
import { KurisuModel } from "./KurisuModel";

export class KurisuController {
  private canvas: HTMLCanvasElement;
  private modelPath: string;

  private gl: WebGLRenderingContext | null = null;
  private model: KurisuModel | null = null;

  private animationFrame = 0;
  private destroyed = false;

  constructor(
    canvas: HTMLCanvasElement,
    modelPath: string
  ) {
    this.canvas = canvas;
    this.modelPath = modelPath;
  }

  async initialize(): Promise<void> {
    initializeCubism();

    const gl = this.canvas.getContext(
      "webgl",
      {
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
      }
    );

    if (!gl) {
      throw new Error(
        "WebGL is not available"
      );
    }

    this.gl = gl;

    this.resize();

    window.addEventListener(
      "resize",
      this.handleResize
    );

    this.model = new KurisuModel(gl);

    try {
      await this.model.load(
        this.modelPath
      );
    } catch (error) {
      console.error(
        "Failed to initialize Kurisu:",
        error
      );

      throw error;
    }

    this.render();
  }

  private handleResize = (): void => {
    this.resize();
  };

  private resize(): void {
    const rect =
      this.canvas.getBoundingClientRect();

    const dpr =
      window.devicePixelRatio || 1;

    const width = Math.max(
      1,
      Math.floor(rect.width * dpr)
    );

    const height = Math.max(
      1,
      Math.floor(rect.height * dpr)
    );

    if (
      this.canvas.width !== width ||
      this.canvas.height !== height
    ) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    if (this.gl) {
      this.gl.viewport(
        0,
        0,
        width,
        height
      );

      this.model?.setRenderTargetSize(
        width,
        height
      );
    }
  }

  private render = (): void => {
    if (
      this.destroyed ||
      !this.gl ||
      !this.model
    ) {
      return;
    }

    const gl = this.gl;

    this.resize();

    gl.viewport(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    gl.clearColor(
      0,
      0,
      0,
      0
    );

    gl.clear(
      gl.COLOR_BUFFER_BIT
    );

    this.model.update();

    const matrix =
      new CubismMatrix44();

    const aspect =
      this.canvas.width /
      this.canvas.height;

    if (aspect > 1) {
      matrix.scale(
        1 / aspect,
        1
      );
    } else {
      matrix.scale(
        1,
        aspect
      );
    }

    const viewport = [
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    ];

    this.model.draw(
      matrix,
      viewport
    );

    this.animationFrame =
      requestAnimationFrame(
        this.render
      );
  };

  destroy(): void {
    this.destroyed = true;

    cancelAnimationFrame(
      this.animationFrame
    );

    window.removeEventListener(
      "resize",
      this.handleResize
    );

    this.model?.release();
    this.model = null;

    this.gl = null;
  }
}