// Need to either patch Combat.prototype.rollInitiative with this,
// or patch it before rendering each combat tracker.
export async function rollInitiative(
    this: Combat,
    ids: string | string[],
    formula: string | null = null,
    options: InitiativeOptions = {}
): Promise<Combat> {
    // TODO: Check IDs and settings to determine whether to gmroll by default
    const shouldGmRoll = true;
    options = {
        ...options,
        rollMode: options.rollMode ? options.rollMode : shouldGmRoll ? "gmroll" : undefined,
    };

    // TODO: Replace with a parameter or something
    await this.rollInitiative(ids, formula, options);

    return this;
}
