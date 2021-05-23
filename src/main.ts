import {
    HiddenInitiativeCombatTrackerData,
    STATUS,
    InitiativeStatus,
    WithHiddenInitiative,
} from "./HiddenInitiativeCombatTracker.js";
import {
    createRollInitiativeReplacement,
    createLegacyRollInitiativeReplacement,
} from "./createRollInitiativeReplacement.js";
import { loc } from "./loc.js";
import { RollVisibility, MODULE_NAME, SettingName } from "./settings.js";

// Note - below are original design notes before I started development.
// Have not audited them to see if they're up to date, but don't want to delete just yet.

/**
 * CURRENT BEHAVIOR (for visible monsters)
 * 1. All initiative rolls are public (announced to chat by default), including for monsters
 * 2. As soon as a monster (or player) has initiative, it renders in the table and re-sorts itself
 */

/**
 * DESIRED BEHAVIOR (for visible monsters)
 * 1. Track a list of "Unpredictable threats" (monsters with hidden initiative)
 *     a. GM can see initiative for these monsters, players cannot
 *     b. Players see initiative as "?" for monsters that haven't gone yet, and they are sorted to the bottom of the list
 *         atm, combatants are rendered in #combat-tracker as list items (.combatant) with data-combatant-id
 *         this applies to both the sidebar and the popout, so it should be feasible to pull them out into a separate list
 *         initiative is shown in a div.token-initiative underneath the relevant li.combatant
 * 2. On a monster's turn, flag it with "publicInitiative" which removes the "?" and enables proper sorting
 * 3. gmroll monster initiative by default
 *      Need to override rollInitiative and provide a messageOptions["rollMode"] === "gmroll" to the super.rollInitiative
 *      Only for monsters, though, let players do their thing (maybe? ooh that could be a gmroll too)
 */

// TODO: Override 'toggleCombat' on token?
// We could await the original result, and then immediately update
// the combatant to a hidden state based on the module setting + token ID

Hooks.on("init", () => {
    game.settings.register(MODULE_NAME, SettingName.RevealValues, {
        name: loc("Setting.RevealInitiative.Title"),
        hint: loc("Setting.RevealInitiative.Hint"),
        type: Boolean,
        config: true,
        default: true,
        scope: "world",
        onChange: (newValue) => {
            console.log(
                `[${MODULE_NAME}]: Initiative reveal setting changed to ${newValue}, re-rendering CombatTracker`
            );
            ui.combat.render();
        },
    });

    game.settings.register(MODULE_NAME, SettingName.NpcRoll, {
        name: loc("Setting.NpcRoll.Title"),
        hint: loc("Setting.NpcRoll.Description"),
        type: String,
        config: true,
        default: RollVisibility.GM,
        choices: {
            [RollVisibility.Default]: "Setting.RollType.Default",
            [RollVisibility.GM]: "Setting.RollType.GM",
            [RollVisibility.Open]: "Setting.RollType.Open",
        },
        scope: "world",
        onChange: (newValue) => {
            console.log(`[${MODULE_NAME}]: New NPC roll visibility: ${newValue}; re-rendering CombatTracker`);
            ui.combat.render();
        },
    });

    game.settings.register(MODULE_NAME, SettingName.PlayerRoll, {
        name: loc("Setting.PlayerRoll.Title"),
        hint: loc("Setting.PlayerRoll.Description"),
        type: String,
        config: true,
        default: RollVisibility.GM,
        choices: {
            [RollVisibility.Default]: "Setting.RollType.Default",
            [RollVisibility.GM]: "Setting.RollType.GM",
            [RollVisibility.Open]: "Setting.RollType.Open",
        },
        scope: "world",
        onChange: (newValue) => {
            console.log(`[${MODULE_NAME}]: New player roll visibility: ${newValue}; re-rendering CombatTracker`);
            ui.combat.render();
        },
    });

    // Override the default CombatTracker with our extension
    CONFIG.ui.combat = WithHiddenInitiative(CONFIG.ui.combat);
});

/**
 * Dictionary key to use to track whether a Combast instance has already been patched by this module.
 */
const ROLL_SHIMMED = Symbol("RollShimmed");

/**
 * Data key to track whether we've updated the HTML of a given Turn already.
 */
const TURN_UPDATED_KEY = "hidden-initiative-repainted";

// Hook into the rendering of the combat tracker so that we can do two things:
// 1. Shim the Combat.rollInitiative function
// 2. Update the rendered HTML with a "..." for unrolled initiative
// TODO: Group turns into separate lists, with headers.
Hooks.on(
    "renderCombatTracker",
    (tracker: CombatTracker, html: JQuery<HTMLElement>, data: HiddenInitiativeCombatTrackerData) => {
        // Monkeypatch the Combat.rollInitiative function if we haven't already for this instance
        const shimmedCombat = (data.combat as unknown) as { [ROLL_SHIMMED]?: boolean };
        if (data.combat && !shimmedCombat[ROLL_SHIMMED]) {
            shimmedCombat[ROLL_SHIMMED] = true;
            if (isNewerVersion(game.data.version, "0.7.1")) {
                // 0.7.2 changed the signature of rollInitiative
                const originalRollFn = data.combat.rollInitiative as InitiativeRoller;
                data.combat.rollInitiative = createRollInitiativeReplacement(data.combat, originalRollFn);
            } else {
                const originalRollFn = data.combat.rollInitiative as LegacyInitiativeRoller;
                data.combat.rollInitiative = createLegacyRollInitiativeReplacement(data.combat, originalRollFn);
            }
        }

        // TODO
        // data.turns contains the turns that *will be* rendered.
        // That is, potentially contains visible monsters (NOT hidden ones, they're already gone).
        // We can check to see !turn.players || turn.players.length > 0 in order to find monsters.
        // Maybe if data.turn === 0, update initiative HTML to "?"
        // Alternate approach:
        // Override CombatTracker.getData; call it, and then re-map 'turns'
        // For non-player turns, we could do check: if (!(player || owner)), replace initiative and sort to top
        // console.log(JSON.stringify(data));
        for (const t of data.turns) {
            if (t[STATUS] === InitiativeStatus.Unrolled && !t.owner) {
                const initiativeNode = html.find(`[data-combatant-id='${t._id}'] > div.token-initiative`);
                if (initiativeNode && !initiativeNode.data(TURN_UPDATED_KEY)) {
                    initiativeNode.data(TURN_UPDATED_KEY, true).append('<span class="initiative">...</span>');
                }
            }
        }
    }
);

// Since we overwrite the CombatTracker with a different class,
// we're stomping over the default "getCombatTrackerEntryContext" hook.
// Pass it through to other modules.
// TODO: Should probably revisit this every Foundry release to make sure it's
// still a necessary and functional workaround...
Hooks.on(
    "getHiddenInitiativeCombatTrackerEntryContext",
    (...args: any[]) => {
        Hooks.call("getCombatTrackerEntryContext", ...args);
    }
)

// Same^
Hooks.on(
    "getHiddenInitiativeCombatTrackerHeaderButtons ",
    (...args: any[]) => {
        Hooks.call("getCombatTrackerHeaderButtons ", ...args);
    }
)