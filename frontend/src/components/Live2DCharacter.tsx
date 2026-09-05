import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { KurisuController } from "../live2d/KurisuController";

export type Live2DCharacterHandle = {
  playTapReaction: () => void;
};

const Live2DCharacter = forwardRef<Live2DCharacterHandle>(
  function Live2DCharacter(_, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const controllerRef = useRef<KurisuController | null>(null);

    useImperativeHandle(ref, () => ({
      playTapReaction() {
        controllerRef.current?.playTapReaction();
      },
    }), []);

    useEffect(() => {
      if (!canvasRef.current) {
        return;
      }

      const controller = new KurisuController(
        canvasRef.current,
        "/live2d/kurisu/kurisu.model3.json"
      );

      controllerRef.current = controller;

      void controller.initialize().catch((error) => {
        console.error("Character initialization failed:", error);
      });

      return () => {
        controllerRef.current = null;
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
);

export default Live2DCharacter;