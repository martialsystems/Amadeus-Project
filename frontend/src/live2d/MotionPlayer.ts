import { CubismModelSettingJson } from "@framework/cubismmodelsettingjson";
import { CubismModel } from "@framework/model/cubismmodel";
import { CubismMotion } from "@framework/motion/cubismmotion";
import { CubismMotionManager } from "@framework/motion/cubismmotionmanager";

export type PlayMotionResult = "started" | "busy" | "not-ready" | "missing";

/** Owns motion assets and the idle/reaction lifecycle. No React or WebGL code. */
export class MotionPlayer {
  private readonly manager = new CubismMotionManager();
  private readonly motions = new Map<string, CubismMotion[]>();
  private ready = false;
  private released = false;
  private speaking = false;

  constructor(
    private readonly idleGroup = "Idle",
    private readonly talkGroup = "Talk"
  ) {
    // Motions may contain timeline events even when the app does not use them.
    this.manager.setEventCallback(() => {});
  }

  async load(
    settings: CubismModelSettingJson,
    directory: string,
    signal: AbortSignal
  ): Promise<void> {
    const eyeBlinkIds = Array.from(
      { length: settings.getEyeBlinkParameterCount() },
      (_, index) => settings.getEyeBlinkParameterId(index)
    );
    const lipSyncIds = Array.from(
      { length: settings.getLipSyncParameterCount() },
      (_, index) => settings.getLipSyncParameterId(index)
    );

    for (let groupIndex = 0; groupIndex < settings.getMotionGroupCount(); groupIndex++) {
      const group = settings.getMotionGroupName(groupIndex);
      const variants: CubismMotion[] = [];
      this.motions.set(group, variants);

      for (let index = 0; index < settings.getMotionCount(group); index++) {
        const file = settings.getMotionFileName(group, index);
        if (!file) throw new Error(`Missing motion file: ${group}[${index}]`);
        const response = await fetch(directory + file, { signal });
        if (!response.ok) throw new Error(`Failed to load ${file}: ${response.status}`);
        const buffer = await response.arrayBuffer();
        signal.throwIfAborted();
        if (this.released) return;

        const motion = CubismMotion.create(buffer, buffer.byteLength);
        if (!motion) throw new Error(`Could not create motion: ${file}`);
        variants.push(motion);
        motion.setEffectIds(eyeBlinkIds, lipSyncIds);
        motion.setLoop(group === this.idleGroup || group === this.talkGroup);
        motion.setLoopFadeIn(false);
        const fadeIn = settings.getMotionFadeInTimeValue(group, index);
        const fadeOut = settings.getMotionFadeOutTimeValue(group, index);
        // model3.json overrides are optional. Otherwise retain the fades
        // CubismMotion.create() loaded from the motion3.json file.
        if (fadeIn >= 0) motion.setFadeInTime(fadeIn);
        if (fadeOut >= 0) motion.setFadeOutTime(fadeOut);
      }
    }

    this.ready = true;
    this.startBaseline();
  }

  playMotion(group: string, index = 0): PlayMotionResult {
    if (!this.ready || this.released) return "not-ready";
    const motion = this.motions.get(group)?.[index];
    if (!motion) return "missing";
    const baseline = group === this.idleGroup || group === this.talkGroup;
    const priority = baseline ? 1 : 2;
    if (this.manager.getCurrentPriority() > 1) return "busy";
    this.manager.startMotionPriority(motion, false, priority);
    return "started";
  }

  setSpeaking(speaking: boolean): void {
    if (this.speaking === speaking) return;
    this.speaking = speaking;
    if (!this.ready || this.released) return;

    if (this.manager.getCurrentPriority() <= 1) this.startBaseline();
  }

  update(model: CubismModel, deltaSeconds: number): void {
    if (!this.ready || this.released) return;
    if (this.manager.isFinished()) this.startBaseline();
    this.manager.updateMotion(model, deltaSeconds);
  }

  private startBaseline(): void {
    const motion =
      (this.speaking ? this.motions.get(this.talkGroup)?.[0] : null) ??
      this.motions.get(this.idleGroup)?.[0];
    if (motion) this.manager.startMotionPriority(motion, false, 1);
  }

  release(): void {
    if (this.released) return;
    this.released = true;
    this.ready = false;
    this.speaking = false;
    this.manager.release();
    for (const variants of this.motions.values()) {
      for (const motion of variants) motion.release();
    }
    this.motions.clear();
  }
}
