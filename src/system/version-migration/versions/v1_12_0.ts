import { DexAttr } from "#enums/dex-attr";
import { SpeciesId } from "#enums/species-id";
import { RibbonData } from "#system/ribbons/ribbon-data";
import type { SystemSaveData } from "#types/save-data";
import type { SystemSaveMigrator } from "#types/save-migrators";

const migrateGreninjaBattleBondForm: SystemSaveMigrator = {
  version: "1.12.0",
  migrate: (data: SystemSaveData): void => {
    if (data.starterData && data.dexData) {
      // Check whether player has Battle Bond form unlocked on Froakie?
      data.starterData[SpeciesId.BATTLE_BOND_GRENINJA] = {
        moveset: data.starterData[SpeciesId.FROAKIE].moveset,
        eggMoves: 0,
        candyCount: 0,
        friendship: 0,
        abilityAttr: 1,
        passiveAttr: 0,
        valueReduction: 0,
        classicWinCount: 0,
      };

      const defaultStarterAttr =
        DexAttr.NON_SHINY | DexAttr.MALE | DexAttr.FEMALE | DexAttr.DEFAULT_VARIANT | DexAttr.DEFAULT_FORM;

      data.dexData[SpeciesId.BATTLE_BOND_GRENINJA] = {
        seenAttr: defaultStarterAttr,
        caughtAttr: defaultStarterAttr,
        natureAttr: data.dexData[SpeciesId.FROAKIE].natureAttr,
        seenCount: 0,
        caughtCount: 0,
        hatchedCount: 0,
        ivs: [15, 15, 15, 15, 15, 15],
        ribbons: RibbonData.fromJSON("0"),
      };

      // Need to alter Froakie evo line dex entry to remove Battle Bond form data?

      // Need to do something with data.unlocks?
    }
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [migrateGreninjaBattleBondForm] as const;
