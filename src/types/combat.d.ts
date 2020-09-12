declare interface CombatTrackerConfig {
    /**
     * Gets the values that are used to populate the 'Tracked Resource' dropdown in the config.
     * Each key in the dictionary is a header (e.g., "Attribute Bars", "Single Values").
     * Each value is an entry under that heading, such as "abilities.cha.proficient".
     */
    getAttributeChoices(): Record<string, string[]>;
}

/**
 * Helper typedef for Combat.rollInitiative, up through FVTT 0.7.1.
 */
declare type LegacyInitiativeRoller = (
    ids: string | string[],
    formula?: string | null,
    options?: MessageOptions
) => Promise<Combat>;

/**
 * New typedef for Combat.rollInitiative, as of FVTT 0.7.2.
 * Notably, the previous "formula" is now merged into a new options structure.
 */
declare type InitiativeRoller = (ids: string | string[], options?: InitiativeOptions) => Promise<Combat>;

declare class Combat {
    /**
     * The currently active Combatant (whose turn it is).
     */
    readonly combatant: Combatant;
    getCombatant(id: string): Combatant | undefined;
    getCombatantByToken(tokenId: string): Combatant | undefined;
    rollInitiative: LegacyInitiativeRoller | InitiativeRoller;
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

    readonly actor?: Actor;
    readonly players?: User[];

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

/**
 * Data used to render a turn. Contains everything from CombatTurn, plus a little more.
 */
type CombatTurnData = CombatTurn & {
    /**
     * Combatant ID.
     */
    _id: string;

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
};

declare type MessageOptions = {
    rollMode?: "roll" | "gmroll";
};

declare type InitiativeOptions = {
    formula?: string | null;
    updateTurn?: boolean;
    messageOptions?: MessageOptions;
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
    readonly turns: CombatTurnData[];
}

/**
 * TODO: Other values as needed from https://foundryvtt.com/api/CombatTracker.html
 */
declare class CombatTracker extends SidebarTab {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]);

    /**
     * The currently tracked combat encounter.
     */
    readonly combat: Combat | null;
    createPopout(): CombatTracker;
    getData(): Promise<CombatTrackerData>;
}
