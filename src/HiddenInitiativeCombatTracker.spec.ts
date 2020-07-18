/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
    HiddenInitiativeCombatTracker,
    SORT_KEY,
    TURN_INDEX,
    InitiativeStatus,
    STATUS,
    UNKNOWN_MASK,
    REVEALED_MASK,
} from "./HiddenInitiativeCombatTracker";
import { SettingName, RollVisibility } from "./settings";

/**
 * Values of 'Turn' that the HiddenInitiativeCombatTracker depends on,
 * to work around Code not making the global types available.
 */
interface Turn {
    hasRolled?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    players?: any[];
    active?: boolean;
    owner?: boolean;
    initiative: string | null;
    [SORT_KEY]?: number;
    [TURN_INDEX]?: number;
    [STATUS]?: InitiativeStatus;
}

/**
 * Similarly - return value of Combat.getData to handle the global
 * types being unavailable.
 */
interface Data {
    turns: Turn[];
    round: number;
}

/**
 * Jest mock that can be used to tweak the return value of
 * super.getData().
 */
const baseGetData = jest.fn<Data, []>();

// @ts-ignore
global.CombatTracker.prototype.getData = baseGetData;

// @ts-ignore
global.game = {
    settings: {
        get: jest.fn(),
    },
};

// @ts-ignore
const getSetting = game.settings.get as jest.Mock<unknown, [string, SettingName]>;

/**
 * Helper to mock specified settings.
 * @param npcRoll Value to use for NPC roll visibility
 * @param playerRoll Value to ues for player roll visibility
 * @param revealRollValues Whether to reveal hidden initiative values for turns that have already passed
 */
function mockSettings(npcRoll: RollVisibility, playerRoll: RollVisibility, revealRollValues = false) {
    getSetting.mockImplementation((_module, setting) => {
        if (setting === SettingName.NpcRoll) {
            return npcRoll;
        } else if (setting === SettingName.PlayerRoll) {
            return playerRoll;
        } else if (setting === SettingName.RevealValues) {
            return revealRollValues;
        }

        return undefined;
    });
}

describe("HiddenInitiativeCombatTracker", () => {
    let tracker: HiddenInitiativeCombatTracker;

    beforeEach(() => {
        tracker = new HiddenInitiativeCombatTracker();
    });

    afterEach(() => {
        getSetting.mockReset();
        baseGetData.mockReset();
    });

    /**
     * Helper to remove some boilerplate for testing how data gets reorganized and overwritten.
     */
    async function test(testData: {
        round: number;
        originalTurns: Turn[];
        expectedOverrides: Array<{
            status: InitiativeStatus;
            initiative?: string | null;
            originalIndex: number;
        }>;
    }) {
        // Populate the result of super.getData()
        baseGetData.mockReturnValue({
            round: testData.round,
            turns: testData.originalTurns,
        });

        // Drop SORT_KEY from the output because it's annoying to test
        const data = await tracker.getData();
        const turns = data.turns.map((t) => {
            const { [SORT_KEY]: _dropped, ...rest } = t;
            return rest;
        });

        // Validate the expected output
        expect({ ...data, turns }).toEqual({
            round: testData.round,
            turns: testData.expectedOverrides.map((t, i) => ({
                ...testData.originalTurns[t.originalIndex],
                initiative: t.initiative || testData.originalTurns[t.originalIndex].initiative,
                [TURN_INDEX]: t.originalIndex,
                [STATUS]: t.status,
            })),
        });
    }

    describe("when player rolls are open and NPC rolls are hidden", () => {
        beforeEach(() => {
            mockSettings(RollVisibility.GM, RollVisibility.Open, false);
        });

        it("does not obscure unrolled values", () => {
            return test({
                round: 0,
                originalTurns: [
                    {
                        hasRolled: false,
                        initiative: null,
                    },
                ],
                expectedOverrides: [
                    {
                        originalIndex: 2,
                        status: InitiativeStatus.Unrolled,
                    },
                ],
            });
        });

        it("does not obscure rolled owned values", () => {
            return test({
                round: 0,
                originalTurns: [
                    {
                        hasRolled: true,
                        owner: true,
                        initiative: "5",
                    },
                ],
                expectedOverrides: [
                    {
                        originalIndex: 0,
                        status: InitiativeStatus.Public,
                    },
                ],
            });
        });

        it("does not obscure unowned values from other players", () => {
            return test({
                round: 0,
                originalTurns: [
                    {
                        hasRolled: true,
                        owner: false,
                        players: ["asdf"],
                        initiative: "5",
                    },
                ],
                expectedOverrides: [
                    {
                        originalIndex: 0,
                        status: InitiativeStatus.Public,
                    },
                ],
            });
        });

        it("obscures NPC values", () => {
            return test({
                round: 0,
                originalTurns: [
                    {
                        hasRolled: true,
                        owner: false,
                        players: [],
                        initiative: "5",
                    },
                ],
                expectedOverrides: [
                    {
                        originalIndex: 0,
                        initiative: UNKNOWN_MASK,
                        status: InitiativeStatus.Hidden,
                    },
                ],
            });
        });

        it("sorts unrolled, visible, and public initiative properly", () => {
            return test({
                round: 0,
                originalTurns: [
                    {
                        hasRolled: true,
                        owner: false,
                        initiative: "20",
                    },
                    {
                        hasRolled: true,
                        owner: false,
                        initiative: "1",
                    },
                    {
                        hasRolled: false,
                        owner: true,
                        initiative: null,
                    },
                    {
                        hasRolled: true,
                        owner: true,
                        initiative: "5",
                    },
                    {
                        hasRolled: true,
                        players: ["asdf"],
                        initiative: "15",
                    },
                ],
                expectedOverrides: [
                    {
                        originalIndex: 4,
                        status: InitiativeStatus.Public,
                    },
                    {
                        originalIndex: 3,
                        status: InitiativeStatus.Public,
                    },
                    {
                        originalIndex: 0,
                        initiative: UNKNOWN_MASK,
                        status: InitiativeStatus.Hidden,
                    },
                    {
                        originalIndex: 1,
                        initiative: UNKNOWN_MASK,
                        status: InitiativeStatus.Hidden,
                    },
                    {
                        originalIndex: 2,
                        status: InitiativeStatus.Unrolled,
                    },
                ],
            });
        });

        it("gradually reveals NPCs on their turns", () => {
            return test({
                round: 1,
                originalTurns: [
                    {
                        hasRolled: true,
                        initiative: "20",
                    },
                    {
                        hasRolled: true,
                        initiative: "15",
                    },
                    {
                        hasRolled: true,
                        initiative: "10",
                        active: true,
                    },
                    {
                        hasRolled: true,
                        initiative: "5",
                    },
                    {
                        hasRolled: true,
                        initiative: "1",
                    },
                ],
                expectedOverrides: [
                    {
                        originalIndex: 0,
                        initiative: REVEALED_MASK,
                        status: InitiativeStatus.Masked,
                    },
                    {
                        originalIndex: 1,
                        initiative: REVEALED_MASK,
                        status: InitiativeStatus.Masked,
                    },
                    {
                        originalIndex: 2,
                        initiative: REVEALED_MASK,
                        status: InitiativeStatus.Masked,
                    },
                    {
                        originalIndex: 3,
                        initiative: UNKNOWN_MASK,
                        status: InitiativeStatus.Hidden,
                    },
                    {
                        originalIndex: 4,
                        initiative: UNKNOWN_MASK,
                        status: InitiativeStatus.Hidden,
                    },
                ],
            });
        });

        it("always reveals after the first round", () => {
            return test({
                round: 2,
                originalTurns: [
                    {
                        active: true,
                        hasRolled: true,
                        initiative: "20",
                    },
                    {
                        hasRolled: true,
                        initiative: "15",
                    },
                ],
                expectedOverrides: [
                    {
                        originalIndex: 0,
                        initiative: REVEALED_MASK,
                        status: InitiativeStatus.Masked,
                    },
                    {
                        originalIndex: 1,
                        initiative: REVEALED_MASK,
                        status: InitiativeStatus.Masked,
                    },
                ],
            });
        });
    });

    describe("when NPCs are hidden but set to reveal over combat", () => {
        beforeEach(() => {
            mockSettings(RollVisibility.GM, RollVisibility.Open, true);
        });

        it("reveals NPC initiative values as needed", () => {
            return test({
                round: 1,
                originalTurns: [
                    {
                        active: true,
                        hasRolled: true,
                        initiative: "20",
                    },
                    {
                        hasRolled: true,
                        initiative: "15",
                    },
                ],
                expectedOverrides: [
                    {
                        originalIndex: 0,
                        status: InitiativeStatus.Public,
                    },
                    {
                        originalIndex: 1,
                        initiative: UNKNOWN_MASK,
                        status: InitiativeStatus.Hidden,
                    },
                ],
            });
        });
    });

    describe("when players are also hidden", () => {
        beforeEach(() => {
            mockSettings(RollVisibility.GM, RollVisibility.GM, true);
        });

        it("hides non-owner player values", () => {
            return test({
                round: 0,
                originalTurns: [
                    {
                        owner: false,
                        players: ["b"],
                        hasRolled: true,
                        initiative: "20",
                    },
                    {
                        owner: true,
                        players: ["a"],
                        hasRolled: true,
                        initiative: "15",
                    },
                ],
                expectedOverrides: [
                    {
                        originalIndex: 1,
                        status: InitiativeStatus.Public,
                    },
                    {
                        originalIndex: 0,
                        initiative: UNKNOWN_MASK,
                        status: InitiativeStatus.Hidden,
                    },
                ],
            });
        });
    });
});
