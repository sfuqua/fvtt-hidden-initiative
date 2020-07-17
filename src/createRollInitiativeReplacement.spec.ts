import { createRollInitiativeReplacement } from "./createRollInitiativeReplacement";
import { SettingName, RollVisibility } from "./settings";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.game = {
    settings: {
        get: jest.fn(),
    },
};

const MOCK_COMBAT = ({
    getCombatant(id: string) {
        if (id.startsWith("pc")) {
            return {
                players: ["test-player"],
            };
        } else {
            return {};
        }
    },
} as unknown) as Combat;

const getSetting = game.settings.get as jest.Mock;

describe("Generated functions", () => {
    const rollInitiative = jest.fn();
    afterEach(() => {
        rollInitiative.mockReset();
    });

    afterEach(() => {
        getSetting.mockReset();
    });

    it("acts as a pass-through if rollMode is specified", async () => {
        const fn = createRollInitiativeReplacement(MOCK_COMBAT, rollInitiative);
        await fn("test", null, { rollMode: "gmroll" });
        expect(rollInitiative).toHaveBeenCalledWith("test", null, { rollMode: "gmroll" });
    });

    it("partitions based on combatant type", async () => {
        const fn = createRollInitiativeReplacement(MOCK_COMBAT, rollInitiative);
        await fn(["pc1", "npc", "pc2"]);
        expect(rollInitiative).toHaveBeenCalledTimes(2);
        expect(rollInitiative.mock.calls[0]).toEqual([["npc"], null, { rollMode: undefined }]);
        expect(rollInitiative.mock.calls[1]).toEqual([["pc1", "pc2"], null, { rollMode: undefined }]);
    });

    it("uses settings for NPCs", async () => {
        const fn = createRollInitiativeReplacement(MOCK_COMBAT, rollInitiative);
        getSetting.mockImplementation((module: string, setting: SettingName) =>
            setting === SettingName.NpcRoll ? RollVisibility.GM : undefined
        );
        await fn("npc");
        expect(rollInitiative).toHaveBeenCalledWith(["npc"], null, { rollMode: "gmroll" });
    });

    it("uses settings for players", async () => {
        const fn = createRollInitiativeReplacement(MOCK_COMBAT, rollInitiative);
        getSetting.mockImplementation((module: string, setting: SettingName) =>
            setting === SettingName.PlayerRoll ? RollVisibility.Open : undefined
        );
        await fn("pc1");
        expect(rollInitiative).toHaveBeenCalledWith(["pc1"], null, { rollMode: "roll" });
    });
});
