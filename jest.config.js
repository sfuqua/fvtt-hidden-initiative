module.exports = {
    preset: "ts-jest",
    moduleNameMapper: {
        "^(.+).js$": "$1",
    },
    setupFiles: ["./jest.setup.js"],
};
