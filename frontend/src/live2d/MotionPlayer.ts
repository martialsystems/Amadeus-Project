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

  constructor(private readonly idleGroup = "Idle") {
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
        motion.setLoop(group === this.idleGroup);
        motion.setLoopFadeIn(false);
        const fadeIn = settings.getMotionFadeInTimeValue(group, index);
        const fadeOut = settings.getMotionFadeOutTimeValue(group, index);
        motion.setFadeInTime(fadeIn >= 0 ? fadeIn : 0.2);
        motion.setFadeOutTime(fadeOut >= 0 ? fadeOut : 0.2);
      }
    }

    this.ready = true;
    this.startIdle();
  }

  playMotion(group: string, index = 0): PlayMotionResult {
    if (!this.ready || this.released) return "not-ready";
    const motion = this.motions.get(group)?.[index];
    if (!motion) return "missing";
    // All non-idle groups are one-shot reactions. Ignore clicks while reacting.
    if (this.manager.getCurrentPriority() > 1) return "busy";
    this.manager.startMotionPriority(motion, false, group === this.idleGroup ? 1 : 2);
    return "started";
  }

  update(model: CubismModel, deltaSeconds: number): void {
    if (!this.ready || this.released) return;
    if (this.manager.isFinished()) this.startIdle();
    this.manager.updateMotion(model, deltaSeconds);
  }

  private startIdle(): void {
    const motion = this.motions.get(this.idleGroup)?.[0];
    if (motion) this.manager.startMotionPriority(motion, false, 1);
  }

  release(): void {
    if (this.released) return;
    this.released = true;
    this.ready = false;
    this.manager.release();
    for (const variants of this.motions.values()) {
      for (const motion of variants) motion.release();
    }
    this.motions.clear();
  }
}
