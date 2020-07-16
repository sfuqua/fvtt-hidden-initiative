import type * as Strings from "./strings/en.json";

/**
 * Supported resource keys.
 */
export type LocKey = keyof typeof Strings;

/**
 * Shortcut to localize a string key.
 * @param key Resource key to localize
 */
export const loc = (key: LocKey): string => game.i18n.localize(key);
