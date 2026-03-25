import { DexAttr } from "#enums/dex-attr";
import { SpeciesId } from "#enums/species-id";
import type { SystemSaveData } from "#types/save-data";
import type { SystemSaveMigrator } from "#types/save-migrators";
import { getPokemonSpecies } from "#utils/pokemon-utils";

/**
 * 
 * @param data - {@linkcode SystemSaveData}
 */
const migrateGreninjaBattleBondForm: SystemSaveMigrator = {
  version: "1.12.0",
  migrate: (data: SystemSaveData): void => {
    if (data.starterData && data.dexData && (!data.starterData[SpeciesId.BATTLE_BOND_GRENINJA] || !data.dexData[SpeciesId.BATTLE_BOND_GRENINJA])) {
      data.dexData[SpeciesId.BATTLE_BOND_GRENINJA] = data.dexData[SpeciesId.GRENINJA];

      const caughtAttr = data.dexData[SpeciesId.GRENINJA]?.caughtAttr;
      if (caughtAttr) {
        data.starterData[SpeciesId.BATTLE_BOND_GRENINJA] = data.starterData[SpeciesId.GRENINJA];
      }
    }
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [migrateGreninjaBattleBondForm] as const;
