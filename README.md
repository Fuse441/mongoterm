## ❤️ Support this project

If you like this project, consider sponsoring:

👉 https://github.com/sponsors/Fuse441

# Mongoterm
How to Use CLI 
👉 https://www.npmjs.com/package/mongoterm?activeTab=readme
```bash
npm i -g mongoterm@alpha
mongoterm
```


A lightweight **Terminal User Interface (TUI)** for managing and exploring MongoDB directly from the terminal.

Mongoterm allows developers to connect to MongoDB, browse databases and collections, and inspect documents without leaving the command line. The goal is to provide a fast, keyboard-driven experience similar to graphical tools but fully inside the terminal.

## 🎯 Roadmap

<details open>
<summary><strong>🏗️ Architecture</strong></summary>

- [ ] Remove global singletons
- [ ] Introduce a Composition Root
- [ ] Inject dependencies via constructors
- [ ] Refactor to an OOP architecture
- [ ] Extract reusable framework into a separate library
- [x] Centralize cross-platform app paths (macOS / Linux / Windows, any drive)

</details>

<details>
<summary><strong>⚙️ Core</strong></summary>

- [x] Hint action bar
- [x] Query history & autocomplete
- [x] Fix project structure
- [x] Monitor Panel
- [x] Refactor generate record

</details>

<details>
<summary><strong>📝 Editor</strong></summary>

- [ ] Syntax highlighting in record editor
- [ ] Validate JSON before save
- [ ] Undo / redo support

</details>

<details>
<summary><strong>🗂️ Record Management</strong></summary>

- [x] Delete record with confirmation
- [x] Insert new record
- [x] Duplicate record
- [ ] Bulk delete

</details>

<details>
<summary><strong>🔎 Query</strong></summary>

- [ ] Query builder (no need to type raw JSON)
- [ ] Save favorite queries
- [ ] Pagination / limit results
- [ ] Sort & filter UI

</details>

<details>
<summary><strong>🎨 UX</strong></summary>

- [x] Keybinding help popup (`?`)
- [ ] Connection manager (multiple connections)
- [ ] Dark / light theme toggle
- [ ] Loading indicator for slow queries

</details>

<details>
<summary><strong>📤 Export</strong></summary>

- [ ] Export result as JSON file
- [ ] Export result as CSV

</details>

<details>
<summary><strong>🚀 CI / CD</strong></summary>

- [x] Automated CHANGELOG.md generation from Conventional Commits
- [x] Auto-tag version bump (major / minor / patch / prerelease) via `workflow_dispatch`
- [x] CodeQL security analysis
- [x] SLSA provenance publishing on release
- [ ] Automated release workflow (build + publish to npm)
- [ ] Cross-platform smoke tests (macOS / Linux / Windows)

</details>

## ✨ Features

- Manage MongoDB connections
- Browse databases
- Browse collections
- View documents from collections
- Interactive dropdown navigation
- Keyboard-driven interface
- Lightweight terminal UI
- Cross-platform: works the same on **macOS**, **Linux**, and **Windows** (config/log paths resolve to the user's home directory regardless of OS or drive)

## 🚧 Project Status

**Work in Progress**

Mongoterm is currently under active development.
New features and improvements are continuously being added, and the interface or APIs may change.

## 🛠 Tech Stack

- Node.js
- TypeScript
- neo-blessed (Terminal UI library)
- MongoDB Node.js Driver

## 🖥️ Cross-Platform Support

Mongoterm stores its configuration (`compass.json`) and logs (`app.log`) under a single
`~/.mongoterm` directory, resolved via Node's `os.homedir()`. This means it works
consistently across:

- **macOS** — `~/.mongoterm`
- **Linux** — `~/.mongoterm`
- **Windows** — `C:\Users\<you>\.mongoterm` (or whichever drive hosts your user profile)

No manual path configuration is required on any platform.

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/Fuse441/mongoterm.git
cd mongoterm
```

Install dependencies:

```bash
npm install
```

## ▶️ Usage

Note

At the moment, connections must be configured manually.
Please edit your MongoDB connection in the Compass configuration file before running the application.
Run the application:

```bash
npm run dev
```

Then select a connection and start exploring your MongoDB databases from the terminal.

## 🎯 Goals

The main goal of this project is to create a **fast and minimal MongoDB client for the terminal**, providing a developer-friendly experience for working with MongoDB without needing a graphical interface.

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome.
Feel free to open issues or submit pull requests.

Please follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, ...)
for your commit messages — [CHANGELOG.md](./CHANGELOG.md) is generated automatically from them via CI on every push to `master`.

## 🔄 CI/CD

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `tag-release.yml` | Manual (`workflow_dispatch`), pick `major` / `minor` / `patch` / `prerelease` | Bumps `package.json`/`package-lock.json`, commits, and pushes a matching `vX.Y.Z` git tag |
| `changelog.yml` | Push to `master`, new `v*` tag | Regenerates `CHANGELOG.md` from Conventional Commits using [git-cliff](https://git-cliff.org) and commits it back |
| `codeql.yml` | Push/PR to `master`, weekly schedule | Static security analysis (CodeQL) |
| `generator-generic-ossf-slsa3-publish.yml` | GitHub Release published | Builds the project and publishes SLSA level 3 provenance for release artifacts |

## 📄 License

MIT License

## Demo

![demo](./demo.gif)

## Navigation

<img width="1190" height="759" alt="image" src="https://github.com/user-attachments/assets/b5bdd03f-d4ed-42d9-9839-c21c2e8a3f2b" />

| From       | Key               | To          |
| ---------- | ----------------- | ----------- |
| connection | `l` / `→`         | workspace   |
| workspace  | `h` / `←`         | connection  |
| workspace  | `k` / `↑`         | query input |
| workspace  | `l` / `→`         | records     |
| workspace  | `shift+l`         | next page   |
| workspace  | `shift+h`         | prev Page   |
| query      | `j` / `↓` / `esc` | workspace   |
| query      | `h` / `←`         | connection  |
| record     | `j` / `↓`         | next record |
| record     | `k` / `↑`         | prev record |
| record     | `h` / `esc`       | workspace   |

### Global shortcuts

| Key         | Action                        |
| ----------- | ----------------------------- |
| `enter`     | submit query (in query panel) |
| `S-c`       | focus connection panel        |
| `S-w`       | focus workspace               |
| `c`         | copy record to clipboard      |
| `q` / `C-c` | quit                          |
