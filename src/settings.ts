export const MODULE_NAME = "hidden-initiative";
export enum SettingName {
    NpcRoll = "npcRollVisibility",
    PlayerRoll = "playerRollVisibility",
}

/**
 * Specifies the way in which initiative is rolled.
 */
export enum RollVisibility {
    /**
     * Rolls are only visible by the rolling player and the GM.
     */
    GM = "gm",

    /**
     * Rolls are visible to all players.
     */
    Open = "open",

    /**
     * The player's chat setting determines how to roll.
     */
    Default = "default",
}
