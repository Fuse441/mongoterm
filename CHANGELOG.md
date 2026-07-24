# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by [Keep a Changelog](https://keepachangelog.com/)
and this project follows Semantic Versioning (SemVer).

## [Unreleased]

### Chore

- Update CHANGELOG.md [skip ci] (7e042a2)
- Bump esbuild (a8c06a3)
- Update CHANGELOG.md [skip ci] (abf402e)

### Other

- Merge pull request #11 from Fuse441/fix/editor-query-shell

docs: expand roadmap with Compass-parity feature gaps, mark import/ex… (8d21308)
- Merge pull request #8 from Fuse441/dependabot/npm_and_yarn/npm_and_yarn-53cbaf2a5b

chore(deps-dev): bump esbuild from 0.28.0 to 0.28.1 in the npm_and_yarn group across 1 directory (f0c0b7b)
- Merge branch 'master' into feat/mcp-wiki-server (2ff1752)
- Merge pull request #12 from Fuse441/feat/mcp-wiki-server

Feat/mcp wiki server (3760cb9)

## [0.4.1] - 2026-07-24

### Chore

- Update CHANGELOG.md [skip ci] (f9356c9)

### Other

- Merge pull request #10 from Fuse441/fix/editor-query-shell

Connection import/export + pagination and scroll fixes (25e7fb7)

## [0.4.0] - 2026-07-23

### Chore

- Update CHANGELOG.md [skip ci] (2299b84)

### Other

- Merge pull request #9 from Fuse441/fix/editor-query-shell

Fix record editor/query input, add autocomplete, sort/paging, and query shell (883c043)

## [0.3.0] - 2026-07-20

### Added

- Add edit/delete for saved connections (connection CRUD) (8631447)
- Add create/drop for databases (database CRUD) (db0754b)
- Fix record editor/query input, add autocomplete, sort/paging, and query shell (7ae1a19)
- Add Compass/mongosh-URI import and export for connections (2cffbbc)
- Add local MCP server that serves the mongoterm wiki (9acd7d2)

### Chore

- Update CHANGELOG.md [skip ci] (a11341a)
- Update CHANGELOG.md [skip ci] (e4c8bd7)
- Update CHANGELOG.md [skip ci] (f16aa04)
- Update CHANGELOG.md [skip ci] (00fa2c2)
- Update CHANGELOG.md [skip ci] (bf7d46a)

### Documentation

- Expand roadmap with Compass-parity feature gaps, mark import/export done (3720b58)
- Point every AI coding tool at CLAUDE.md as the source of truth (e7755e6)

### Fixed

- Wire connection/database/collection CRUD into the real tree UI (34aebd4)
- Creating a database from the tree used the wrong node (5b02d4d)
- Reachable last page and vim g/G jump-to-top/bottom in workspace (4d4a6a0)

### Other

- Update installation command to use latest version (e774ee2)

## [0.2.14] - 2026-07-20

### Chore

- Update CHANGELOG.md [skip ci] (a48ad90)

### Other

- Add repository field to package.json

Added repository information to package.json (491869d)

## [0.2.13] - 2026-07-20

### Chore

- Update CHANGELOG.md [skip ci] (453d8e2)
- Update CHANGELOG.md [skip ci] (823db85)

### Fixed

- Rewrite corrupted publish-npm.yml as manual workflow_dispatch (892cad4)

### Other

- Update npm publish workflow for manual triggering (8284acc)

## [0.2.12] - 2026-07-20

### Chore

- Update CHANGELOG.md [skip ci] (1fc04e1)
- Update CHANGELOG.md [skip ci] (cd10101)
- Remove scratch diagnostic workflows (f10222e)
- Update CHANGELOG.md [skip ci] (fc942e8)

### Testing

- Add scratch tag-trigger workflow for diagnosis (4692c9d)
- Add scratch v* tag-trigger workflow for diagnosis (2b28ce4)

## [0.2.11] - 2026-07-20

### Chore

- Update CHANGELOG.md [skip ci] (5278f86)

### Other

- Fix secret token casing in tag-release.yml (cef4f9a)

## [0.2.9] - 2026-07-20

### Chore

- Update CHANGELOG.md [skip ci] (b53b6ce)

### Other

- Rename npm-publish.yml to publish-npm.yml (db480bf)

## [0.2.8] - 2026-07-20

### Chore

- Update CHANGELOG.md [skip ci] (7ab0944)
- Update CHANGELOG.md [skip ci] (a5656bb)

### Other

- Update npm-publish workflow trigger

Change trigger from workflow_run to push on tags. (560e182)
- Change token to NPM_mongoterm in tag-release.yml

Updated GitHub Actions workflow to use NPM_mongoterm token. (37d4fd5)

## [0.2.7] - 2026-07-20

### Chore

- Update CHANGELOG.md [skip ci] (a58e7d2)
- Update CHANGELOG.md [skip ci] (2a4a252)

### Other

- Update npm-publish workflow trigger

Change trigger from push tags to workflow_run for Tag Release. (a6b9698)

## [0.2.6] - 2026-07-20

### Other

- 0.2.6 (167c050)

## [0.2.5] - 2026-07-20

### Chore

- Update CHANGELOG.md [skip ci] (43b5d0f)
- Update CHANGELOG.md [skip ci] (fb6b1dd)

### Other

- Change GitHub token to thanos-for-developer (8e9548a)
- Update token in tag-release workflow (6f24cf1)

## [0.2.4] - 2026-07-20

### Added

- Validate JSON before save (30c0a20)

### Chore

- Update CHANGELOG.md [skip ci] (4cbf0ae)

### Fixed

- Remove circular import crash in helper.ts (Cannot read CONFIG_PATH) (8754a16)

## [0.2.2] - 2026-07-20

### Chore

- Update CHANGELOG.md [skip ci] (71205a8)

### Other

- Add npm publish workflow, fix broken package (missing dist/LICENSE) (e71eeb3)

## [0.2.0] - 2026-07-20

### Changed

- Centralize cross-platform app paths, restructure README roadmap, add auto changelog CI (0fee72f)

### Chore

- Update CHANGELOG.md [skip ci] (fd9cc3e)
- Update CHANGELOG.md [skip ci] (6e71873)
- Update CHANGELOG.md [skip ci] (0ffca99)

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


