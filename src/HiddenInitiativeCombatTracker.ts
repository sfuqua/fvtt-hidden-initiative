/**
 * String to show in place of real initiative, for creatures who are pending.
 */
const MASK = "?";

/**
 * Translates an initiative string to a sortable numeric value.
 * Null is sorted to the end, ? is sorted to the beginning, otherwise
 * a number is used.
 */
function initiativeToInt(value: string | null) {
    if (!value) {
        return Number.MIN_SAFE_INTEGER;
    } else if (value === MASK) {
        return Number.MAX_SAFE_INTEGER;
    } else {
        return Number(value);
    }
}

const SORT_KEY = Symbol("InitiativeSortKey");
const TURN_INDEX = Symbol("TurnIndex");

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
    async getData(): Promise<CombatTrackerData> {
        const baseData = await super.getData();

        const activeIndex = baseData.turns.findIndex((t) => t.active);
        const maskedTurns = baseData.turns.map((t, i) => {
            if (t.owner || t.players?.length > 0) {
                // If the current player owns this turn's actor, or if this turn
                // is associated with one or more players, don't tamper with it.
                return {
                    ...t,
                    [SORT_KEY]: initiativeToInt(t.initiative),
                    [TURN_INDEX]: i,
                };
            }

            // At this point, we can assume:
            // - The current client is not a DM
            // - The current client does not have "permission" to view this monster's initiative

            // We want to mask the initiative (show a ?, sort to top) if:
            // - round === 0
            // - i > activeIndex
            const shouldMask = baseData.round === 0 && i > activeIndex;

            // If shouldMask is false, we just replace the initiative string with null.
            // We never want to show the real number.
            const maskedInitiative = t.hasRolled && shouldMask ? MASK : null;
            // If we should mask, we sort based on the mask value, otherwise we sort based on the real (hidden) value.
            const sortKey = shouldMask ? initiativeToInt(maskedInitiative) : initiativeToInt(t.initiative);
            return {
                ...t,
                [SORT_KEY]: sortKey,
                [TURN_INDEX]: i,
                initiative: maskedInitiative,
            };
        });

        // Once we've masked initiative, it's time to sort.
        maskedTurns.sort((a, b) => {
            const cmp = b[SORT_KEY] - a[SORT_KEY];

            // Use original ordering as a tie breaker/
            return cmp !== 0 ? cmp : b[TURN_INDEX] - a[TURN_INDEX];
        });

        // Overwrite the original turns
        return {
            ...baseData,
            turns: maskedTurns,
        };
    }
}
