import { MODULE_NAME, SettingName, RollVisibility } from "./settings.js";

/**
 * String to show in place of real initiative, for creatures who are pending.
 */
export const UNKNOWN_MASK = "?";
export const REVEALED_MASK = "-";

/**
 * Translates an initiative string to a sortable numeric value.
 * Null is sorted to the end, ? is sorted right before that, otherwise
 * a number is used.
 */
function initiativeToInt(value: string | null) {
    if (!value) {
        return Number.MIN_SAFE_INTEGER;
    } else if (value === UNKNOWN_MASK) {
        return Number.MIN_SAFE_INTEGER + 1;
    } else {
        return Number(value);
    }
}

/**
 * How to treat the initiative of a combatant/turn.
 */
export enum InitiativeStatus {
    /**
     * This creature has rolled initiative, but the current
     * user doesn't know what it is or where they fall in turn order.
     */
    Hidden,

    /**
     * This creature has slotted into the turn order somewhere,
     * but its actual value is still a mystery.
     */
    Masked,

    /**
     * This creature's initiative number is known to the current user.
     */
    Public,

    /**
     * This creature hasn't rolled yet.
     */
    Unrolled,
}

export const SORT_KEY = Symbol("InitiativeSortKey");
export const TURN_INDEX = Symbol("TurnIndex");
export const STATUS = Symbol("InitiativeStatus");

export type HiddenInitiativeCombatTrackerData = Omit<CombatTrackerData, "turns"> & {
    turns: Array<
        CombatTurnData & {
            [SORT_KEY]: number;
            [TURN_INDEX]: number;
            [STATUS]: InitiativeStatus;
        }
    >;
};

export type HiddenInitiativeCombatTracker = Omit<CombatTracker, "getData"> & {
    getData(): Promise<HiddenInitiativeCombatTrackerData>;
};

type CombatTrackerConstructor = new (...args: ConstructorParameters<typeof CombatTracker>) => CombatTracker;
type HiddenInitiativeCombatTrackerConstructor = new (
    ...args: ConstructorParameters<typeof CombatTracker>
) => HiddenInitiativeCombatTracker;

/**
 * Extension of the Foundry VTT CombatTracker that handles massaging the
 * data presented to the view in order to facilitate hiding initiative from players.
 * Dynamic/runtime extension pattern borrowed from https://www.bryntum.com/blog/the-mixin-pattern-in-typescript-all-you-need-to-know/
 * in order to allow merging classes from different modules.
 */
export const WithHiddenInitiative = <T extends CombatTrackerConstructor>(
    BaseTracker: T
): HiddenInitiativeCombatTrackerConstructor => {
    class HiddenInitiativeMixinClass extends BaseTracker {
        constructor(...args: ConstructorParameters<typeof CombatTracker>) {
            super(...args);
        }

        /**
         * Provides data to the CombatTracker render template.
         */
        getData = async (): Promise<HiddenInitiativeCombatTrackerData> => {
            const baseData = await super.getData();

            // Whether to show numbers instead of masking as battle wears on
            const revealKnownInitiative = !!game.settings.get(MODULE_NAME, SettingName.RevealValues);

            const activeIndex = baseData.turns.findIndex((t) => t.active);
            const maskedTurns: HiddenInitiativeCombatTrackerData["turns"] = baseData.turns.map((t, i) => {
                if (!t.hasRolled) {
                    return {
                        ...t,
                        [STATUS]: InitiativeStatus.Unrolled,
                        [SORT_KEY]: initiativeToInt(null),
                        [TURN_INDEX]: i,
                    };
                }

                // We want to mask the initiative (show a ?, sort to top) if:
                // - round <= 1
                // - i > activeIndex
                const initiativeUnknown = baseData.round === 0 || (baseData.round === 1 && i > activeIndex);

                // We show the real number, treating initiative as public, if any of these are true:
                // - This creature's turn order is known (!initiativeUnknown) and settings say we should reveal
                // - The current user owns this turn
                // - The creature has associated players (gated on a setting)

                // For players we hedge towards lenient (default Foundry) settings; as long as we haven't locked them to GM visibility,
                // players can see each other's initiative in the trackers.
                const shouldHidePlayers = game.settings.get(MODULE_NAME, SettingName.PlayerRoll) === RollVisibility.GM;

                // For NPCs we lean in the opposite direction given the design intent of this module.
                // We always hide initiative for NPCs unless the user has explicitly opted into open rolls.
                const shouldRevealNpcs = game.settings.get(MODULE_NAME, SettingName.NpcRoll) === RollVisibility.Open;

                const isPlayerTurn = !!t.players && t.players.length > 0;
                if (
                    (!initiativeUnknown && revealKnownInitiative) ||
                    t.owner ||
                    (!shouldHidePlayers && isPlayerTurn) ||
                    (shouldRevealNpcs && !isPlayerTurn)
                ) {
                    return {
                        ...t,
                        [STATUS]: InitiativeStatus.Public,
                        [SORT_KEY]: initiativeToInt(t.initiative),
                        [TURN_INDEX]: i,
                    };
                }

                // At this point, we can assume:
                // - The current client is not a DM
                // - The current client does not have "permission" to view this monster's initiative

                return {
                    ...t,
                    initiative: initiativeUnknown ? UNKNOWN_MASK : REVEALED_MASK,
                    [STATUS]: initiativeUnknown ? InitiativeStatus.Hidden : InitiativeStatus.Masked,
                    [SORT_KEY]: initiativeToInt(initiativeUnknown ? UNKNOWN_MASK : t.initiative),
                    [TURN_INDEX]: i,
                };
            });

            // Once we've masked initiative, it's time to sort.
            maskedTurns.sort((a, b) => {
                // First sort by initiative (high to low).
                let cmp = b[SORT_KEY] - a[SORT_KEY];

                if (cmp !== 0) {
                    return cmp;
                }

                if (a[STATUS] === InitiativeStatus.Hidden && b[STATUS] === InitiativeStatus.Hidden) {
                    // If initiative for both are hidden, sort by name.
                    cmp = (a.name || "").localeCompare(b.name || "");
                    if (cmp !== 0) {
                        return cmp;
                    }
                }

                // As a final tiebreaker use original ordering as a tie breaker (low to high).
                return cmp !== 0 ? cmp : a[TURN_INDEX] - b[TURN_INDEX];
            });

            // Overwrite the original turns
            return {
                ...baseData,
                turns: maskedTurns,
            };
        };
    }

    // Prior to Foundry 0.7.1, it was necessary to masquerade as the CombatTracker,
    // otherwise we'd see a renderHiddenInitiativeCombatTracker hook but not renderCombatTracker.
    // As of 0.7.1, hooks are called for the entire inheritance chain instead, so we can set our name
    // to HiddenInitiativeCombatTracker instead (and if we don't, other modules will see renderCombatTracker twice
    // and potentially duplicate their UI).
    const constructorName = isNewerVersion(game.data.version, "0.7.0")
        ? "HiddenInitiativeCombatTracker"
        : "CombatTracker";
    Object.defineProperty(HiddenInitiativeMixinClass.prototype.constructor, "name", { value: constructorName });

    return HiddenInitiativeMixinClass;
};
