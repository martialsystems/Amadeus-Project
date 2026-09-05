# Amadeus frontend

Run `npm ci` once, then `npm run dev`. `npm run build` checks the app's types and produces the production bundle. Flask normally listens on port 5050.

## Add an interaction

1. Put the exported motion under `public/live2d/kurisu/`.
2. Add its file to a group in `kurisu.model3.json` under `FileReferences.Motions`:

   ```json
   "Wave": [{ "File": "kurisu.wave.motion3.json" }]
   ```

3. Add an entry in `src/interactions.ts`, using a backend ID your Flask interaction dictionary supports:

   ```ts
   wave: {
     backendId: 4,
     motion: "Wave",
     label: "Wave",
     position: { top: "30%", left: "65%", width: "70px", height: "70px" },
   },
   ```

The UI creates a button for each entry. Positions are relative to the character viewport; adjust them here when positioning hit areas. Buttons are transparent, with a visible keyboard-focus outline. For placement debugging, temporarily give `.touch-button` a colored background in `styles.css`.

All registered motion groups are preloaded. `Idle` loops; other groups play once, even when their exported JSON says `Loop: true`. A reaction interrupts idle and idle resumes when it ends. Clicks during a reaction are ignored, including the corresponding backend request. Playback starts before the Flask request. New backend IDs still need matching server-side events/responses.

The generic API is `characterRef.current?.playMotion("Wave")`. There is no need to add a new method in the component, controller, or model for each animation. Interaction buttons use the first motion in a group; `MotionPlayer.playMotion(group, index)` also supports selecting a variant.

## Responsibilities

- `interactions.ts`: backend IDs, motion groups, labels, and button positions.
- `components/Live2DCharacter.tsx`: React canvas lifecycle and the imperative `playMotion` handle.
- `live2d/KurisuController.ts`: WebGL context, resizing, frame timing, and render loop.
- `live2d/KurisuModel.ts`: model loading, drawing, and asset cleanup.
- `live2d/MotionPlayer.ts`: motion discovery, caching, priorities, and return to idle.
- `live2d/textureLoader.ts`: cancellable image/texture loading.

Model destruction aborts outstanding asset loads. This also supports React Strict Mode's development mount/cleanup cycle. Physics and audio synchronization are separate future features.

## Verification

Run `npm test` for motion and cleanup checks against the bundled Cubism Core and real character assets. These tests need neither Flask nor a browser. They cover preloading, repeated reactions, automatic idle recovery, adding a new motion group, and cancellation during loading. Use `npm run build` for the production build.

## TypeScript

`tsconfig.cubism.json` builds declarations for the vendored SDK using its own compiler settings. The app consumes those declarations while retaining strict type checking. Vite continues bundling the original SDK source. Generated declarations and build metadata live in `node_modules/.cache/`.
