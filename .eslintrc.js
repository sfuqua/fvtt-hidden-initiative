module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "import"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier/@typescript-eslint",
    ],
    rules: {
        "@typescript-eslint/no-use-before-define": "off",

        // Redundant with TS compiler
        "@typescript-eslint/no-unused-vars": "off",

        "import/order": [
            "error",
            {
                // Enforce newlines between import groups (and no newlines within groups)
                "newlines-between": "always",
                // Import builtins first, then external modules, then everything else as a final group
                groups: ["builtin", "external", ["parent", "sibling", "index"]],
                alphabetize: {
                    order: "asc",
                },
            },
        ],

        eqeqeq: "error",
        "no-return-await": "warn",
        "no-single-line-block-comment": "off",
        "no-throw-literal": "error",
        "no-var": "error",
        "prefer-promise-reject-errors": "error",
        "prefer-regex-literals": "warn",
    },
};
