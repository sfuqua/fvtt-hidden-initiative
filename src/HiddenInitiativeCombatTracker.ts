/**
 * String to show in place of real initiative, for creatures who are pending.
 */
const UNKNOWN_MASK = "?";
const REVEALED_MASK = "-";

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
     * but it's actual value is still a mystery.
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

/**
 * Extension of the Foundry VTT CombatTracker that handles massaging the
 * data presented to the view in order to facilitate hiding initiative from players.
 */
export class HiddenInitiativeCombatTracker extends CombatTracker {
    constructor() {
        super();
    }

    /**
     * Provides data to the CombatTracker render template.
     */
    async getData(): Promise<HiddenInitiativeCombatTrackerData> {
        const baseData = await super.getData();

        const activeIndex = baseData.turns.findIndex((t) => t.active);
        const maskedTurns: HiddenInitiativeCombatTrackerData["turns"] = baseData.turns.map((t, i) => {
            if (!t.hasRolled) {
                return {
                    ...t,
                    initiative: "+",
                    [STATUS]: InitiativeStatus.Unrolled,
                    [SORT_KEY]: initiativeToInt(null),
                    [TURN_INDEX]: i,
                };
            }

            if (t.owner || t.players?.length > 0) {
                // If the current player owns this turn's actor, or if this turn
                // is associated with one or more players, don't tamper with it.
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

            // We want to mask the initiative (show a ?, sort to top) if:
            // - round <= 1
            // - i > activeIndex
            const initiativeUnknown = baseData.round === 0 || (baseData.round === 1 && i > activeIndex);
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
            const cmp = b[SORT_KEY] - a[SORT_KEY];

            // Use original ordering as a tie breaker (low to high).
            return cmp !== 0 ? cmp : a[TURN_INDEX] - b[TURN_INDEX];
        });

        // Overwrite the original turns
        return {
            ...baseData,
            turns: maskedTurns,
        };
    }
}
