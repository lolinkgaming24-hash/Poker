import type { BattleScene } from "#app/battle-scene";
import { FixedInt } from "#utils/common";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";

/** Array containing all duration-related properties to be mutated. */
const PROPERTIES = ["delay", "completeDelay", "loopDelay", "duration", "repeatDelay", "hold", "startDelay"] as const;

/**
 * Override various Phaser methods to alter their time-related properties based on the current game speed.
 * Any duration values passed that are {@linkcode FixedInt}s will be treated as fixed values and preserved.
 * @privateRemarks
 * While this may sound ominous, there is effectively no other way to do what we want to do within the constraints set by Phaser,
 * as altering game speed would affect all time-related aspects of the game (including ones we want to keep fixed).
 */
export function initGameSpeed(this: BattleScene): void {
  /** Mutate a duration value based on the current speed. */
  const transformValue = (duration: number | FixedInt): number => {
    if (duration instanceof FixedInt) {
      return duration.value;
    }
    return Math.ceil(duration / this.gameSpeed);
  };

  /**
   * Recursively mutate an object's duration-related properties.
   * @param obj - The object to mutate
   * @param allowArray - (Default `false`) Whether to allow mutating arrays of tween configs at the top level.
   */
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This goes down to 13 complexity if moved outside of `initGameSpeed` (and is only here to access a single function)
  const mutateProperties = (obj: object, allowArray = false): void => {
    // We do not mutate Tweens or TweenChain objects directly
    if (obj instanceof Phaser.Tweens.Tween || obj instanceof Phaser.Tweens.TweenChain) {
      return;
    }

    // mutate top-level arrays of tween configs if applicable (ensuring we don't recursively mutate them)
    if (Array.isArray(obj)) {
      if (!allowArray) {
        return;
      }
      for (const tween of obj) {
        mutateProperties(tween);
      }
      return;
    }

    for (const prop of PROPERTIES) {
      if (typeof obj[prop] === "number" || obj[prop] instanceof FixedInt) {
        obj[prop] = transformValue(obj[prop]);
      }
    }

    // If the object has a 'tweens' property that is an array, then it is a tween chain
    // and we need to mutate its properties as well
    if (Object.hasOwn(obj, "tweens") && Array.isArray(obj.tweens)) {
      mutateProperties(obj.tweens, true);
    }
  };

  // #region Method overrides
  const originalAddEvent = this.time.addEvent;
  this.time.addEvent = function (this: Phaser.Time.Clock, config) {
    if (!(config instanceof Phaser.Time.TimerEvent) && config.delay) {
      config.delay = transformValue(config.delay);
    }
    return originalAddEvent.apply(this, [config]);
  } satisfies typeof originalAddEvent;

  const originalTweensAdd = this.tweens.add;
  this.tweens.add = function (this: Phaser.Tweens.TweenManager, config) {
    mutateProperties(config);
    return originalTweensAdd.call(this, config);
  } satisfies typeof originalTweensAdd;

  const originalTweensChain = this.tweens.chain;
  this.tweens.chain = function (this: Phaser.Tweens.TweenManager, config): Phaser.Tweens.TweenChain {
    mutateProperties(config);
    return originalTweensChain.call(this, config);
  } satisfies typeof originalTweensChain;

  const originalAddCounter = this.tweens.addCounter;
  this.tweens.addCounter = function (this: Phaser.Tweens.TweenManager, config) {
    mutateProperties(config);
    return originalAddCounter.call(this, config);
  } satisfies typeof originalAddCounter;

  const originalCreate = this.tweens.create;
  this.tweens.create = function (this: Phaser.Tweens.TweenManager, config) {
    mutateProperties(config, true);
    return originalCreate.call(this, config);
  } satisfies typeof originalCreate;

  const originalAddMultiple = this.tweens.addMultiple;
  this.tweens.addMultiple = function (this: Phaser.Tweens.TweenManager, config) {
    mutateProperties(config, true);
    return originalAddMultiple.call(this, config);
  } satisfies typeof originalAddMultiple;

  const originalFadeOut = SoundFade.fadeOut;
  // TODO: These overloads don't account for the 2 functions being overloaded to work without a scene as the first parameter,
  // hence why we need type assertions instead of `satisfies` guards
  SoundFade.fadeOut = ((scene: Phaser.Scene, sound: Phaser.Sound.BaseSound, duration: number, destroy?: boolean) =>
    originalFadeOut(scene, sound, transformValue(duration), destroy)) as typeof originalFadeOut;

  const originalFadeIn = SoundFade.fadeIn;
  SoundFade.fadeIn = ((
    scene: Phaser.Scene,
    sound: string | Phaser.Sound.BaseSound,
    duration: number,
    endVolume?: number,
    startVolume?: number,
  ) => originalFadeIn(scene, sound, transformValue(duration), endVolume, startVolume)) as typeof originalFadeIn;

  // #endregion Method overrides
}
