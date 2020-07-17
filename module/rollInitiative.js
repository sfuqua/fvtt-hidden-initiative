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
