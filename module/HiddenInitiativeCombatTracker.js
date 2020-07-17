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
function initiativeToInt(value) {
    if (!value) {
        return Number.MIN_SAFE_INTEGER;
    }
    else if (value === UNKNOWN_MASK) {
        return Number.MIN_SAFE_INTEGER + 1;
    }
    else {
        return Number(value);
    }
}
/**
 * How to treat the initiative of a combatant/turn.
 */
export var InitiativeStatus;
(function (InitiativeStatus) {
    /**
     * This creature has rolled initiative, but the current
     * user doesn't know what it is or where they fall in turn order.
     */
    InitiativeStatus[InitiativeStatus["Hidden"] = 0] = "Hidden";
    /**
     * This creature has slotted into the turn order somewhere,
     * but it's actual value is still a mystery.
     */
    InitiativeStatus[InitiativeStatus["Masked"] = 1] = "Masked";
    /**
     * This creature's initiative number is known to the current user.
     */
    InitiativeStatus[InitiativeStatus["Public"] = 2] = "Public";
    /**
     * This creature hasn't rolled yet.
     */
    InitiativeStatus[InitiativeStatus["Unrolled"] = 3] = "Unrolled";
})(InitiativeStatus || (InitiativeStatus = {}));
export const SORT_KEY = Symbol("InitiativeSortKey");
export const TURN_INDEX = Symbol("TurnIndex");
export const STATUS = Symbol("InitiativeStatus");
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
    async getData() {
        const baseData = await super.getData();
        const activeIndex = baseData.turns.findIndex((t) => t.active);
        const maskedTurns = baseData.turns.map((t, i) => {
            var _a;
            if (!t.hasRolled) {
                return Object.assign(Object.assign({}, t), { initiative: "+", [STATUS]: InitiativeStatus.Unrolled, [SORT_KEY]: initiativeToInt(null), [TURN_INDEX]: i });
            }
            if (t.owner || ((_a = t.players) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                // If the current player owns this turn's actor, or if this turn
                // is associated with one or more players, don't tamper with it.
                return Object.assign(Object.assign({}, t), { [STATUS]: InitiativeStatus.Public, [SORT_KEY]: initiativeToInt(t.initiative), [TURN_INDEX]: i });
            }
            // At this point, we can assume:
            // - The current client is not a DM
            // - The current client does not have "permission" to view this monster's initiative
            // We want to mask the initiative (show a ?, sort to top) if:
            // - round <= 1
            // - i > activeIndex
            const initiativeUnknown = baseData.round === 0 || (baseData.round === 1 && i > activeIndex);
            return Object.assign(Object.assign({}, t), { initiative: initiativeUnknown ? UNKNOWN_MASK : REVEALED_MASK, [STATUS]: initiativeUnknown ? InitiativeStatus.Hidden : InitiativeStatus.Masked, [SORT_KEY]: initiativeToInt(initiativeUnknown ? UNKNOWN_MASK : t.initiative), [TURN_INDEX]: i });
        });
        // Once we've masked initiative, it's time to sort.
        maskedTurns.sort((a, b) => {
            // First sort by initiative (high to low).
            const cmp = b[SORT_KEY] - a[SORT_KEY];
            // Use original ordering as a tie breaker (low to high).
            return cmp !== 0 ? cmp : a[TURN_INDEX] - b[TURN_INDEX];
        });
        // Overwrite the original turns
        return Object.assign(Object.assign({}, baseData), { turns: maskedTurns });
    }
}
