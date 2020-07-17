declare interface CombatTrackerConfig {
    /**
     * Gets the values that are used to populate the 'Tracked Resource' dropdown in the config.
     * Each key in the dictionary is a header (e.g., "Attribute Bars", "Single Values").
     * Each value is an entry under that heading, such as "abilities.cha.proficient".
     */
    getAttributeChoices(): Record<string, string[]>;
}

declare class Combat {
    /**
     * The currently active Combatant (whose turn it is).
     */
    readonly combatant: Combatant;
    getCombatant(id: string): Combatant | undefined;
    getCombatantByToken(tokenId: string): Combatant | undefined;
    rollInitiative(
        ids: string | string[],
        formula: string | null = null,
        options: InitiativeOptions = {}
    ): Promise<Combat>;
    setInitiative(id: string, value: string): Promise<void>;
    updateCombatant(newData: { _id: string } & Partial<Combatant>): Promise<void>;
}

declare interface CombatSettings {
    resource: string;
    skipDefeated: boolean;
}

declare interface CombatTrackerConfigData {
    attributeChoices: Record<string, string[]>;
    settings: CombatSettings;
}

declare interface Combatant {
    /**
     * Hash representing a unique ID for this combatant.
     */
    readonly _id: string;

    /**
     * Whether this combatant is visible to players.
     */
    readonly hidden: boolean;

    /**
     * Whether this combatant is marked as defeated in the tracker.
     */
    readonly defeated: boolean;

    /**
     * Numeric string representing the combatant's initiative, used to rank turn order.
     */
    readonly initiative: string;
}

/**
 * Represents the base data that a Combat uses to represent an individual and their initiative.
 * All players have access to all CombatTurns, but only a subset end up rendering.
 */
declare interface CombatTurn {
    // TODO: token, actor
    players: User[];
    owner: boolean;
    visible: boolean;
}

declare type InitiativeOptions = {
    rollMode?: "roll" | "gmroll";
};

declare interface CombatTrackerData {
    readonly user: User;
    readonly combats: Combat[];
    readonly combat: Combat | null;

    /**
     * Alias for combats.length.
     */
    readonly combatCount: number;

    readonly settings: CombatSettings;
    readonly round: number;

    /**
     * Index into the Combat.turns array of the active turn.
     * NOT guaranteed to be clamped to data.turns.
     */
    readonly turn: number;

    /**
     * Subset of Combat.turns that are visible to this user.
     */
    readonly turns: Array<
        CombatTurn & {
            /**
             * Either the token name or actor name.
             */
            name: string;

            /**
             * Whether this is the current turn.
             */
            active: boolean;

            /**
             * Result of parsing the Combat.turn initiative string.
             * If the result was not a number, it is coerced to null.
             */
            initiative: string | null;

            /**
             * initiative !== null.
             */
            hasRolled: boolean;

            /**
             * className (e.g., "active defeated").
             */
            css: string;
        }
    >;
}

/**
 * TODO: Other values as needed from https://foundryvtt.com/api/CombatTracker.html
 */
declare class CombatTracker {
    /**
     * The currently tracked combat encounter.
     */
    readonly combat: Combat | null;
    createPopout(): CombatTracker;
    getData(): Promise<CombatTrackerData>;
}
