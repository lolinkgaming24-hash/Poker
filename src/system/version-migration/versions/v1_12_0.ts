import { SpeciesId } from "#enums/species-id";
import type { SystemSaveData } from "#types/save-data";
import type { SystemSaveMigrator } from "#types/save-migrators";

const migrateGreninjaBattleBondForm: SystemSaveMigrator = {
  version: "1.12.0",
  migrate: (data: SystemSaveData): void => {
    if (
      data.starterData
      && data.dexData
      && (data.starterData[SpeciesId.BATTLE_BOND_GRENINJA] == null
        || data.dexData[SpeciesId.BATTLE_BOND_GRENINJA] == null)
    ) {
      data.dexData[SpeciesId.BATTLE_BOND_GRENINJA] = data.dexData[SpeciesId.GRENINJA];
      data.starterData[SpeciesId.BATTLE_BOND_GRENINJA] = data.starterData[SpeciesId.FROAKIE];
      data.starterData[SpeciesId.BATTLE_BOND_GRENINJA].abilityAttr = 1;
    }
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [migrateGreninjaBattleBondForm] as const;
