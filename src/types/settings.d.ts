/**
 * Fields that are expected to be part of a setting registration.
 */
declare type CommonSettingRegistrationFields<T> = {
    /**
     * Title for the setting.
     */
    name: string;

    /**
     * Description of the setting and its behavior.
     */
    hint: string;

    scope: "client" | "world";
    default: T;

    /**
     * If specified, the resulting setting will be a select menu.
     */
    choices?: Record<string, T>;
    onChange?: (newValue: T) => void;
};

/**
 * Registration for a setting backed by a number.
 */
declare type NumericSettingRegistration = CommonSettingRegistrationFields<number> & {
    type: typeof Number;

    /**
     * If specified, the resulting setting is a range slider.
     */
    range?: {
        min: number;
        max: number;
        step: number;
    };
};

/**
 * Registration for a flag setting.
 */
declare type BooleanSettingRegistration = CommonSettingRegistrationFields<boolean> & {
    type: typeof Boolean;
};

/**
 * Registration for a string setting.
 */
declare type StringSettingRegistration = CommonSettingRegistrationFields<string> & {
    type: typeof String;
};

/**
 * The data payload needed when registering a setting with Foundry.
 */
declare type SettingRegistration = NumericSettingRegistration | BooleanSettingRegistration | StringSettingRegistration;

declare class ClientSettings {
    /**
     * Attempts to access a setting value. Throws if the setting is not registered.
     * Returns the setting registered default value if not set.
     *
     * @param module {String}   The module namespace under which the setting is registered
     * @param key {String}      The setting key to retrieve
     *
     * @example
     * // Retrieve the current setting value
     * game.settings.get("myModule", "myClientSetting");
     */
    get(module: string, key: string): unknown;

    /**
     * Register a new game setting under this setting scope. Can be safely called every time the module initializes,
     * does not overwrite any actual setting data.
     *
     * @param {string} module   The namespace under which the setting is registered
     * @param {string} key      The key name for the setting under the namespace module
     * @param {Object} data     Configuration for setting data
     *
     * @example
     * // Register a client setting
     * game.settings.register("myModule", "myClientSetting", {
     *   name: "Register a Module Setting with Choices",
     *   hint: "A description of the registered setting and its behavior.",
     *   scope: "client",     // This specifies a client-stored setting
     *   config: true,        // This specifies that the setting appears in the configuration view
     *   type: String,
     *   choices: {           // If choices are defined, the resulting setting will be a select menu
     *     "a": "Option A",
     *     "b": "Option B"
     *   },
     *   default: "a",        // The default value for the setting
     *   onChange: value => { // A callback function which triggers when the setting is changed
     *     console.log(value)
     *   }
     * });
     *
     * @example
     * // Register a world setting
     * game.settings.register("myModule", "myWorldSetting", {
     *   name: "Register a Module Setting with a Range slider",
     *   hint: "A description of the registered setting and its behavior.",
     *   scope: "world",      // This specifies a world-level setting
     *   config: true,        // This specifies that the setting appears in the configuration view
     *   type: Number,
     *   range: {             // If range is specified, the resulting setting will be a range slider
     *     min: 0,
     *     max: 100,
     *     step: 10
     *   }
     *   default: 50,         // The default value for the setting
     *   onChange: value => { // A callback function which triggers when the setting is changed
     *     console.log(value)
     *   }
     * });
     */
    register(module: string, key: string, data: SettingRegistration): void;

    /**
     * Attempts to update a setting and communicates to the other players if needed. Throws if the setting is not registered.
     * Returns a promise that resolves to the updated setting value.
     *
     * @param module {String}   The module namespace under which the setting is registered
     * @param key {String}      The setting key to retrieve
     * @param value             The data to assign to the setting key
     *
     * @example
     * // Update the current value of a setting
     * game.settings.set("myModule", "myClientSetting", "b");
     */
    async set<T>(module: string, key: string, value: T): Promise<T>;
}
