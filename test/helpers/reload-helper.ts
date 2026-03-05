import { TitlePhase } from "#phases/title-phase";
import type { GameManager } from "#test/framework/game-manager";
import { GameManagerHelper } from "#test/helpers/game-manager-helper";
import type { SessionSaveData } from "#types/save-data";
import { vi } from "vitest";

/**
 * Helper to allow reloading sessions in unit tests.
 */
export class ReloadHelper extends GameManagerHelper {
  sessionData: SessionSaveData;

  constructor(game: GameManager) {
    super(game);

    // Whenever the game saves the session, save it to the reloadHelper instead
    vi.spyOn(game.scene.gameData, "saveAll").mockImplementation(async () => {
      this.sessionData = game.scene.gameData.getSessionSaveData();
      return true;
    });
  }

  /**
   * Simulate reloading the session from the title screen, until reaching the
   * beginning of the first turn (equivalent to running `startBattle()`) for
   * the reloaded session.
   */
  async reloadSession(): Promise<void> {
    const scene = this.game.scene;
    const titlePhase = new TitlePhase();

    scene.phaseManager.clearPhaseQueue();

    // Set the last saved session to the desired session data
    vi.spyOn(scene.gameData, "getSession").mockReturnValue(Promise.resolve(this.sessionData));
    scene.phaseManager.unshiftPhase(titlePhase);
    this.game.endPhase(); // End the currently ongoing battle

    await titlePhase["loadSaveSlot"](0); // Load the desired session data

    await this.game.phaseInterceptor.to("CommandPhase");
    console.log("==================[New Turn (Reloaded)]==================");
  }
}
