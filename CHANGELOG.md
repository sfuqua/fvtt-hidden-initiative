# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.3.1 - 2020/10/21

### Changed

-   Manifest update for 0.7.5 support

## 0.3.0 - 2020/09/11

### Fixed

-   Now supports the new overload of `Combat.rollInitiative` added in FVTT 0.7.2 (as well as older versions)

## 0.2.1 - 2020/07/19

### Changed

-   Creatures with unknown initiative are now sorted amongst themselves alphabetically instead of in original turn order

## 0.2.0 - 2020/07/19

### Fixed

-   Addressed some compatibility issues with other combat modules

## 0.1.3 - 2020/07/18 (initial Foundry release)

### Fixed

-   Republishing due to GitHub bug

## 0.1.2

### Fixed

-   Addressed a problem with displaying unrolled initiative

## 0.1.1

### Changed

-   Added `compatibleCoreVersion` (0.6.5) to the module manifest

## 0.1.0

### Changed

-   Packaging and manifest updates to test auto-update

## 0.0.2

### Changed

-   Tweaks to packaging and build workflow for automated publishing support

## 0.0.1

### Added

Initial module version while in development, with the following features:

-   Customize chat visibility of initiative rolls, with separate toggles for players and NPCs
-   Show "unrolled" initiative separately from "unknown" initiative in the combat tracker
-   Allow keeping NPC initiative ambiguous, and don't sort them properly in the player-visible table until they've taken a turn
