# Contributions

(Not fleshing this much out yet until the module is off the ground)

## Structure

This module is structured as a private NPM package. You should be able to clone it, run `npm install`, and be on your way.

All code is written in TypeScript and lives under "src/".
Build output (the installable module) gets copied to "module/"; by default in a fresh clone, only the module manifest lives in that folder.

Strings (strings/en.json) live in the src/ directory, and are automatically copied into the module directory by the TypeScript compiler.

## Foundry VTT TypeScript definitions

This package uses a combination of [foundry-pc-types](https://gitlab.com/Eranziel/foundry-pc-types) and [custom type definitions](src/types) where foundry-pc-types uses `any` or is otherwise missing concrete definitions.

## Testing changes

First, build your changes (`npm run build`); this will generate an installable module in the "module" directory.

Then either copy the folder into your Foundry VTT "modules/" data folder (renamed "hidden-intiative/"), or create a symlink called "hidden-initiative/" from the modules directory to your local module directory.

## Merging your code

Pull requests into master are welcome and I will review them if they show up.
