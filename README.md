## ❤️ Support this project

If you like this project, consider sponsoring:

👉 https://github.com/sponsors/Fuse441

# Mongoterm

A lightweight **Terminal User Interface (TUI)** for managing and exploring MongoDB directly from the terminal.

Mongoterm allows developers to connect to MongoDB, browse databases and collections, and inspect documents without leaving the command line. The goal is to provide a fast, keyboard-driven experience similar to graphical tools but fully inside the terminal.

## 🎯 Roadmap

### Core

- [x] Hint action bar
- [x] Query history & autocomplete
- [ ] Fix project structure

### Editor

- [ ] Syntax highlighting in record editor
- [ ] Validate JSON before save
- [ ] Undo / redo support

### Record Management

- [x] Delete record with confirmation
- [ ] Insert new record
- [ ] Duplicate record
- [ ] Bulk delete

### Query

- [ ] Query builder (no need to type raw JSON)
- [ ] Save favorite queries
- [ ] Pagination / limit results
- [ ] Sort & filter UI

### UX

- [x] Keybinding help popup (`?`)
- [ ] Connection manager (multiple connections)
- [ ] Dark / light theme toggle
- [ ] Loading indicator for slow queries

### Export

- [ ] Export result as JSON file
- [ ] Export result as CSV

## ✨ Features

- Manage MongoDB connections
- Browse databases
- Browse collections
- View documents from collections
- Interactive dropdown navigation
- Keyboard-driven interface
- Lightweight terminal UI

## 🚧 Project Status

**Work in Progress**

Mongoterm is currently under active development.
New features and improvements are continuously being added, and the interface or APIs may change.

## 🛠 Tech Stack

- Node.js
- neo-blessed (Terminal UI library)
- MongoDB Node.js Driver

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

Run the application:

```bash
node index.js
```

Then select a connection and start exploring your MongoDB databases from the terminal.

## 🎯 Goals

The main goal of this project is to create a **fast and minimal MongoDB client for the terminal**, providing a developer-friendly experience for working with MongoDB without needing a graphical interface.

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome.
Feel free to open issues or submit pull requests.

## 📄 License

MIT License

## Demo

![demo](./demo.gif)

## Navigation

<img width="1410" height="1078" alt="image" src="https://github.com/user-attachments/assets/d71ad6df-389e-4cab-83fc-3926a5bc3208" />

| From       | Key               | To          |
| ---------- | ----------------- | ----------- |
| connection | `l` / `→`         | workspace   |
| workspace  | `h` / `←`         | connection  |
| workspace  | `k` / `↑`         | query input |
| workspace  | `l` / `→`         | records     |
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
