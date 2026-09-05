import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { KurisuController } from "../live2d/KurisuController";

import type { PlayMotionResult } from "../live2d/MotionPlayer";

export type Live2DCharacterHandle = {
  playMotion: (group: string) => PlayMotionResult;
};

const Live2DCharacter = forwardRef<Live2DCharacterHandle>(
  function Live2DCharacter(_, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const controllerRef = useRef<KurisuController | null>(null);

    useImperativeHandle(ref, () => ({
      playMotion(group: string) {
        return controllerRef.current?.playMotion(group) ?? "not-ready";
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