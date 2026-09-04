import { useEffect, useRef } from "react";
import { KurisuController } from "../live2d/KurisuController";

export default function Live2DCharacter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const controller = new KurisuController(
      canvasRef.current,
      "/live2d/kurisu/kurisu.model3.json"
    );

    void controller.initialize();

    return () => {
      controller.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="live2d-canvas"
    />
  );
}