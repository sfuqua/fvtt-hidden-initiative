export const MODULE_NAME = "hidden-initiative";
export var SettingName;
(function (SettingName) {
    SettingName["NpcRoll"] = "npcRollVisibility";
    SettingName["PlayerRoll"] = "playerRollVisibility";
})(SettingName || (SettingName = {}));
/**
 * Specifies the way in which initiative is rolled.
 */
export var RollVisibility;
(function (RollVisibility) {
    /**
     * Rolls are only visible by the rolling player and the GM.
     */
    RollVisibility["GM"] = "gm";
    /**
     * Rolls are visible to all players.
     */
    RollVisibility["Open"] = "open";
    /**
     * The player's chat setting determines how to roll.
     */
    RollVisibility["Default"] = "default";
})(RollVisibility || (RollVisibility = {}));
