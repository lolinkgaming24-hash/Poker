import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, test } from "vitest";

describe("Moves - Parting Shot", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .moveset([MoveId.PARTING_SHOT, MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(5)
      .enemyLevel(5);
  });

  test("Parting Shot when buffed by prankster should fail against dark types", async () => {
    game.override.enemySpecies(SpeciesId.POOCHYENA).ability(AbilityId.PRANKSTER);
    await game.classicMode.startBattle(SpeciesId.MURKROW, SpeciesId.MEOWTH);

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    game.move.select(MoveId.PARTING_SHOT);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.MURKROW);
  });

  test("Parting shot should fail against good as gold ability", async () => {
    game.override.enemySpecies(SpeciesId.GHOLDENGO).enemyAbility(AbilityId.GOOD_AS_GOLD);
    await game.classicMode.startBattle(SpeciesId.MURKROW, SpeciesId.MEOWTH);

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    game.move.select(MoveId.PARTING_SHOT);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.MURKROW);
  });

  it("Parting shot should fail if target is -6/-6 de-buffed", async () => {
    game.override.moveset([MoveId.PARTING_SHOT, MoveId.MEMENTO, MoveId.SPLASH]);
    await game.classicMode.startBattle(
      SpeciesId.MEOWTH,
      SpeciesId.MEOWTH,
      SpeciesId.MEOWTH,
      SpeciesId.MURKROW,
      SpeciesId.ABRA,
    );

    // Use Memento three times in a row to drive the enemy's ATK and SPATK to -6.
    // Each Memento KOs the user, so we immediately send in the next party member.
    game.move.select(MoveId.MEMENTO);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.select(MoveId.MEMENTO);
    game.doSelectPartyPokemon(2);
    await game.toNextTurn();

    game.move.select(MoveId.MEMENTO);
    game.doSelectPartyPokemon(3);
    await game.toNextTurn();

    // Verify the setup: enemy is at minimum stat stages and Murkrow is now the active Pokémon.
    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-6);
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-6);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.MURKROW);

    // Parting Shot should fail entirely when the target is already at minimum stages,
    // leaving stats unchanged and keeping the user in the field.
    game.move.select(MoveId.PARTING_SHOT);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-6);
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-6);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.MURKROW);
  });

  it("Parting shot shouldn't allow switch out when mist is active", async () => {
    game.override.enemySpecies(SpeciesId.ALTARIA).enemyAbility(AbilityId.NONE).enemyMoveset([MoveId.MIST]);
    await game.classicMode.startBattle(SpeciesId.SNORLAX, SpeciesId.MEOWTH);

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    // Turn 1: Use Splash to allow the opponent to set up Mist before Parting Shot is used.
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    // Turn 2: Parting Shot is now blocked by the active Mist — stat stages must remain unchanged
    // and no switch-out should be triggered.
    game.move.select(MoveId.PARTING_SHOT);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.SNORLAX);
  });

  it("Parting shot shouldn't allow switch out against clear body ability", async () => {
    game.override.enemySpecies(SpeciesId.TENTACOOL).enemyAbility(AbilityId.CLEAR_BODY);
    await game.classicMode.startBattle(SpeciesId.SNORLAX, SpeciesId.MEOWTH);

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    // Clear Body blocks all stat reductions, so Parting Shot's condition for switching out
    // is never met — the user should remain in the field.
    game.move.select(MoveId.PARTING_SHOT);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.SNORLAX);
  });

  it("should lower stats without failing if no alive party members available to switch", async () => {
    await game.classicMode.startBattle(SpeciesId.MURKROW, SpeciesId.MEOWTH);

    // Eliminate the only available party member so there is no valid switch target.
    const meowth = game.scene.getPlayerParty()[1];
    meowth.hp = 0;

    // Parting Shot should still apply its stat drop normally — the move itself does not fail
    // when there are no eligible replacements; only the switch-out is skipped.
    game.move.select(MoveId.PARTING_SHOT);
    await game.toNextTurn();

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-1);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.MURKROW);
  });

  it("should lower stats and switch out when target has no immunities and user has a party", async () => {
    await game.classicMode.startBattle(SpeciesId.SNORLAX, SpeciesId.MEOWTH);

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    // Parting Shot successfully drops stats and forces a switch.
    // We queue the attack and immediately queue the party selection for the switch phase.
    game.move.select(MoveId.PARTING_SHOT);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    // Stats must drop and Snorlax must be replaced by Meowth.
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-1);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.MEOWTH);
  });

  it("should increase stats and trigger switch out against a target with Contrary", async () => {
    // Inkay has the Contrary ability naturally
    game.override.enemySpecies(SpeciesId.INKAY).enemyAbility(AbilityId.CONTRARY);
    await game.classicMode.startBattle(SpeciesId.SNORLAX, SpeciesId.MEOWTH);

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    game.move.select(MoveId.PARTING_SHOT);

    // We queue the party selection to resolve the switch phase smoothly
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    // Contrary inverts the drop, so stats should actually be +1
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(1);

    // Because the stat change (even if positive) was successful, the switch must occur
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.MEOWTH);
  });
});
