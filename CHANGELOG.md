# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by [Keep a Changelog](https://keepachangelog.com/)
and this project follows Semantic Versioning (SemVer).

---

## [0.1.1-alpha] - 2026-06-22

### Added

- Added interactive Tree panel for browsing MongoDB databases and collections.
- Added reusable Form panel for connection and user input.
- Added tree event handlers for navigation and selection.
- Added `IConfigurationMongoConnection` type definitions.

### Changed

- Replaced dropdown-based database navigation with a Tree panel.
- Refactored connection workflow to use the new Form panel.
- Improved MongoDB event registration and connection management.
- Refactored screen layout and workspace rendering.
- Updated keybindings and input handling.
- Improved helper utilities and configuration management.
- Updated package configuration for CLI distribution.

### Removed

- Removed the legacy Input panel.
- Removed the previous dropdown-based navigation flow.

### Known Issues

- CLI startup may fail after global installation due to application bootstrap initialization order. (`mongoterm` works in development but may fail when executed from the installed package.)
- Some modules still depend on the global `appInstance`, which may cause circular dependency issues during startup.

## [0.1.0-alpha] - 2026-06-20

### Added

- Initial public alpha release
- MongoDB connection support
- Database explorer
- Collection explorer
- Query editor
- Document viewer
- Insert document
- Delete document
- Duplicate document
- Query history
- Keyboard navigation
- Workspace monitor
- Keybinding help popup

### Changed

- Refactored project structure
- Introduced event-driven architecture
- Improved workspace rendering

### Known Issues

- Connection management is still manual.
- Virtual scrolling is under development.
- Architecture is being migrated to OOP.
