/** Load an image into a texture; cancellation prevents late GPU allocations. */
export function loadTexture(
  gl: WebGLRenderingContext,
  path: string,
  signal: AbortSignal
): Promise<WebGLTexture> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const image = new Image();
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      cleanup();
      image.src = "";
      reject(signal.reason);
    };
    signal.addEventListener("abort", abort, { once: true });
    image.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load texture: ${path}`));
    };
    image.onload = () => {
      cleanup();
      const texture = gl.createTexture();
      if (!texture) {
        reject(new Error(`Unable to create texture: ${path}`));
        return;
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      resolve(texture);
    };
    image.src = path;
  });
}
