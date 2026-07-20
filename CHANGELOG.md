# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by [Keep a Changelog](https://keepachangelog.com/)
and this project follows Semantic Versioning (SemVer).

## [Unreleased]

### Changed

- Centralize cross-platform app paths, restructure README roadmap, add auto changelog CI (0fee72f)

### Chore

- Update CHANGELOG.md [skip ci] (fd9cc3e)
- Update CHANGELOG.md [skip ci] (6e71873)

### Other

- Add manual auto-tag version workflow (major/minor/patch/prerelease) (1e3da64)
- Bump version from 0.1.2-alpha to 0.2.0-alpha (ce27c9f)

## [0.1.2-alpha] - 2026-06-24

### Changed

- Add keybindbar panel, migrate Mongo events to MongodbBuilder (a644948)

### Other

- Add CLI usage instructions to README

Added usage instructions for CLI installation and usage. (2bfa119)

## [0.1.1-alpha.2] - 2026-06-22

### Changed

- Move compass.json to cfg dir and add default cfg handling (5f3cab5)

### Chore

- Bump version to 0.1.1-alpha.2 (78303f2)

## [0.1.1-alpha.1] - 2026-06-22

### Chore

- Bump version to 0.1.1-alpha.1 (4c5a2f7)

## [0.1.1-alpha] - 2026-06-22

### Added

- Add interactive Tree panel and Form panel for MongoDB browsing (a4d0694)

### Changed

- Replace dropdown with tree panel & form input for MongoDB (7c4490a)

### Chore

- Remove package-lock.json from .gitignore (8b3a2d7)

### Fixed

- Enable input focus on form fields (a491b50)

### Other

- Add SLSA generic generator workflow

This workflow generates SLSA provenance files for the project, satisfying level 3 requirements. (010582e)
- Update SLSA generator workflow version to v2.1.0 (e300804)
- Update SLSA workflow for artifact generation and permissions (1a30e0d)
- Add CodeQL analysis workflow configuration

This workflow file sets up CodeQL analysis for the repository, specifying triggers for pushes and pull requests on the master branch, as well as a scheduled run. (cd43251)

## [0.1.0-alpha] - 2026-06-20

### Added

- QueryPanel TUI and funcation query simple (6f01a00)
- Navigation and Keybind and Update Readme (f770b19)
- Readme Additional roadmap and toast funcation for future (3e321c9)
- Keybinding-help and update README roadmap (6658c01)
- Implement delete record with confirmation dialog (ceda789)
- QueryHistory and autocomplete popup (2625df3)
- QueryHistory and autocomplete popup (96a48c5)
- Implement screen singleton and optimize editor rendering (fc12cf7)
- Mark insert new record as complete (2d27c5f)
- Add monitor panel and record duplication functionality (d3f2f04)
- Add query service, state, logger, TS migration (e0a2fd4)

### Changed

- AppInstance.eventBus, add pagination to keybindings/rendering (b89e954)

### Documentation

- Add monitor panel feature to README checklist (7d334bd)
- Add architecture roadmap and usage note (377a0eb)
- Add shift+l and shift+h shortcuts for workspace pagination (7477af7)

### Fixed

- Readme checkbox (ade4914)

### Other

- Init Project and Additional Readme (75a000b)
- Add demo section with image to README

Added a demo section with an image to the README. (9a21761)
- Update README with demo section and images

Added demo section with images and last updated date. (60c011f)
- Update tag .md (f66121f)
- Merge pull request #1 from Fuse441/feature/keybinding-help

feat: keybinding-help and update README roadmap (6c7d5f7)
- Merge pull request #2 from Fuse441/feature/keybinding-help

fix: readme checkbox (d40acb4)
- Merge pull request #3 from Fuse441/feature/delete-record-with-confirmation

feat: implement delete record with confirmation dialog (3e3efdf)
- Update query history & autocomplete status to complete (2dee845)
- Add GitHub funding configuration (0b3611d)
- Update README.md (f1bd5a6)
- Add sponsorship section to README

Added a sponsorship section to encourage support for the project. (71d05cf)
- Update funding information format in FUNDING.yml (44b690b)
- Merge branch 'master' into feature/query-history (a8f3d45)
- Merge pull request #4 from Fuse441/feature/query-history

Feature/query history (c4c131d)
- Update README with new navigation images (1f82ee8)
- Merge pull request #5 from Fuse441/feature/insert-new-record

Feature/insert new record (79ed013)
- Merge pull request #6 from Fuse441/refactor/event-driven-architecture

feat: add query service, state, logger, TS migration (e7c4467)
- Update README with MongoDB connection instructions

Add note about manual MongoDB connection configuration. (8c39694)
- Merge pull request #7 from Fuse441/refactor/event-driven-architecture

refactor: appInstance.eventBus, add pagination to keybindings/rendering (c14f061)
- V0.1.0-alpha (2463ef8)


