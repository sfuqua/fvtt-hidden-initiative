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
// Need to either patch Combat.prototype.rollInitiative with this,
// or patch it before rendering each combat tracker.
export async function rollInitiative(ids, formula = null, options = {}) {
    // TODO: Check IDs and settings to determine whether to gmroll by default
    const shouldGmRoll = true;
    options = Object.assign(Object.assign({}, options), { rollMode: options.rollMode ? options.rollMode : shouldGmRoll ? "gmroll" : undefined });
    // TODO: Replace with a parameter or something
    await this.rollInitiative(ids, formula, options);
    return this;
}
export class HiddenInitiativeCombatTracker extends CombatTracker {
    constructor() {
        super();
    }
    /**
     * Provides data to the CombatTracker render template.
     */
    async getData() {
        const baseData = await super.getData();
        // TODO: Tamper with monster initiative and sort order in baseData.turns
        return baseData;
    }
}
// TODO: Module settings for "default to hidden monsters"?
// TODO: Override 'toggleCombat' on token?
// We could await the original result, and then immediately update
// the combatant to a hidden state based on the module setting + token ID
// To mark a combatant as "hidden":
// combat.updateCombatant({ _id: c._id, hidden: true })
// Note: hidden defaults to the status of the token
// Combat.setupTurns is responsible for generating a list of "turn" objects that are sorted by initiative, then name
// All players get ALL turns, UI filtering happens later in CombatTracker.getData()
// This generates a *separate* turns[] array:
/*
    return mergeObject(data, {
      round: combat.data.round,
      turn: combat.data.turn,
      turns: turns,
      control: hasControl
    });
*/
// Called when the user opens the combat tracker settings panel
Hooks.on("renderCombatTrackerConfig", (config, html, data) => {
    // TODO
});
Hooks.on("renderCombatTracker", (tracker, html, data) => {
    // TODO
    // data.turns contains the turns that *will be* rendered.
    // That is, potentially contains visible monsters (NOT hidden ones, they're already gone).
    // We can check to see !turn.players || turn.players.length > 0 in order to find monsters.
    // Maybe if data.turn === 0, update initiative HTML to "?"
    // Alternate approach:
    // Override CombatTracker.getData; call it, and then re-map 'turns'
    // For non-player turns, we could do check: if (!(player || owner)), replace initiative and sort to top
});
// Hooks.on("renderSidebarTab") with name "combat"
// Hooks.on("updateCombatant") [via Hooks.callAll(`update${type}`)]
// c.players = c.actor ? players.filter(u => c.actor.hasPerm(u, "OWNER"))
// const players = game.users.players;
