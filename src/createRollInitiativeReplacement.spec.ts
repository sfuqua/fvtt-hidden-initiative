/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
    createLegacyRollInitiativeReplacement,
    createRollInitiativeReplacement,
} from "./createRollInitiativeReplacement";
import { SettingName, RollVisibility } from "./settings";

// @ts-ignore
global.game = {
    data: {
        version: "0.8.5",
    },
    settings: {
        get: jest.fn(),
    },
};

// @ts-ignore
global.isNewerVersion = jest.fn(() => true);

const mockGetCombatantById = (id: string) => {
    if (id.startsWith("pc")) {
        return {
            players: ["test-player"],
        };
    } else {
        return {};
    }
};

const MOCK_COMBAT = ({
    combatants: {
        get: mockGetCombatantById
    },
    getCombatant: mockGetCombatantById,
    // @ts-ignore
} as unknown) as Combat;

// @ts-ignore
const getSetting = game.settings.get as jest.Mock<unknown, [string, SettingName]>;

describe("Generated functions", () => {
    const rollInitiative = jest.fn();

    afterEach(() => {
        getSetting.mockReset();
        rollInitiative.mockReset();
    });

    describe("createLegacyRollInitiativeReplacement", () => {
        it("acts as a pass-through if rollMode is specified", async () => {
            const fn = createLegacyRollInitiativeReplacement(MOCK_COMBAT, rollInitiative);
            await fn("test", null, { rollMode: "gmroll" });
            expect(rollInitiative).toHaveBeenCalledWith("test", null, { rollMode: "gmroll" });
        });

        it("partitions based on combatant type", async () => {
            const fn = createLegacyRollInitiativeReplacement(MOCK_COMBAT, rollInitiative);
            await fn(["pc1", "npc", "pc2"]);
            expect(rollInitiative).toHaveBeenCalledTimes(2);
            expect(rollInitiative.mock.calls[0]).toEqual([["npc"], null, { rollMode: undefined }]);
            expect(rollInitiative.mock.calls[1]).toEqual([["pc1", "pc2"], null, { rollMode: undefined }]);
        });

        it("uses settings for NPCs", async () => {
            const fn = createLegacyRollInitiativeReplacement(MOCK_COMBAT, rollInitiative);
            getSetting.mockImplementation((module: string, setting: SettingName) =>
                setting === SettingName.NpcRoll ? RollVisibility.GM : undefined
            );
            await fn("npc");
            expect(rollInitiative).toHaveBeenCalledWith(["npc"], null, { rollMode: "gmroll" });
        });

        it("uses settings for players", async () => {
            const fn = createLegacyRollInitiativeReplacement(MOCK_COMBAT, rollInitiative);
            getSetting.mockImplementation((module, setting) =>
                setting === SettingName.PlayerRoll ? RollVisibility.Open : undefined
            );
            await fn("pc1");
            expect(rollInitiative).toHaveBeenCalledWith(["pc1"], null, { rollMode: "roll" });
        });
    });

    describe("createRollInitiativeReplacement", () => {
        it("acts as a pass-through if rollMode is specified", async () => {
            const fn = createRollInitiativeReplacement(MOCK_COMBAT, rollInitiative);
            await fn("test", { messageOptions: { rollMode: "gmroll" } });
            expect(rollInitiative).toHaveBeenCalledWith("test", { messageOptions: { rollMode: "gmroll" } });
        });

        it("partitions based on combatant type", async () => {
            const fn = createRollInitiativeReplacement(MOCK_COMBAT, rollInitiative);
            await fn(["pc1", "npc", "pc2"]);
            expect(rollInitiative).toHaveBeenCalledTimes(2);
            expect(rollInitiative.mock.calls[0]).toEqual([["npc"], { messageOptions: { rollMode: undefined } }]);
            expect(rollInitiative.mock.calls[1]).toEqual([["pc1", "pc2"], { messageOptions: { rollMode: undefined } }]);
        });

        it("uses settings for NPCs", async () => {
            const fn = createRollInitiativeReplacement(MOCK_COMBAT, rollInitiative);
            getSetting.mockImplementation((module: string, setting: SettingName) =>
                setting === SettingName.NpcRoll ? RollVisibility.GM : undefined
            );
            await fn("npc");
            expect(rollInitiative).toHaveBeenCalledWith(["npc"], { messageOptions: { rollMode: "gmroll" } });
        });

        it("uses settings for players", async () => {
            const fn = createRollInitiativeReplacement(MOCK_COMBAT, rollInitiative);
            getSetting.mockImplementation((module, setting) =>
                setting === SettingName.PlayerRoll ? RollVisibility.Open : undefined
            );
            await fn("pc1");
            expect(rollInitiative).toHaveBeenCalledWith(["pc1"], { messageOptions: { rollMode: "roll" } });
        });
    });
});
