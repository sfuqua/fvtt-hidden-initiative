import { MODULE_NAME, SettingName, RollVisibility } from "./settings";

/**
 * Helper typedef for Combat.rollInitiative.
 */
type InitiativeRoller = (
    ids: string | string[],
    formula?: string | null,
    options?: InitiativeOptions
) => Promise<Combat>;

/**
 * Maps the setting enum to a roll option to be used with rollInitiative.
 */
function getRollMode(setting: RollVisibility): "roll" | "gmroll" | undefined {
    switch (setting) {
        case RollVisibility.GM:
            return "gmroll";
        case RollVisibility.Open:
            return "roll";
        default:
            return undefined;
    }
}

/**
 * Factory function that generates a shim for Combat.rollInitiative, taking the Combat object to bind to and the
 * original Combat.rollInitiative to call for the original effect.
 * @param combat Combat to bind the generated rollInitiative replacement to
 * @param originalFn The original function to call
 * @returns A bound function that can be used to patch combat.rollInitiative
 */
export function createRollInitiativeReplacement(combat: Combat, originalFn: InitiativeRoller): InitiativeRoller {
    async function rollInitiative(
        this: Combat,
        ids: string | string[],
        formula: string | null = null,
        options: InitiativeOptions = {}
    ): Promise<Combat> {
        // Determine whether we should fill in a value for options.rollMode using module settings.
        // If a rollMode was specified somehow, just use that as-is.
        if (options.rollMode) {
            // Perform the actual roll with our shimmed parameters
            await originalFn.call(this, ids, formula, options);
            return this;
        }

        // First we need to partition the rolls into NPCs and players
        const npcIds: string[] = [];
        const playerIds: string[] = [];
        const idArr = typeof ids === "string" ? [ids] : ids;
        for (const id of idArr) {
            const combatant = this.getCombatant(id);
            if (combatant) {
                if (combatant.players && combatant.players.length > 0) {
                    playerIds.push(id);
                } else {
                    npcIds.push(id);
                }
            }
        }

        if (npcIds.length > 0) {
            let npcSetting = game.settings.get(MODULE_NAME, SettingName.NpcRoll) as RollVisibility;
            npcSetting = typeof npcSetting === "string" ? npcSetting : RollVisibility.Default;
            await originalFn.call(this, npcIds, formula, { ...options, rollMode: getRollMode(npcSetting) });
        }

        if (playerIds.length > 0) {
            let playerSetting = game.settings.get(MODULE_NAME, SettingName.PlayerRoll) as RollVisibility;
            playerSetting = typeof playerSetting === "string" ? playerSetting : RollVisibility.Default;
            await originalFn.call(this, playerIds, formula, { ...options, rollMode: getRollMode(playerSetting) });
        }

        return this;
    }

    return rollInitiative.bind(combat);
}
