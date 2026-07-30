import blessed from "neo-blessed";
import { theme } from "@/config/app.config";
import { logger } from "@/utils/logger/logger.service";
import { appInstance } from "@/app";

export type TreeNodeType = "connection" | "database" | "collection";

export interface TreeNode {
  id: string;
  label: string;
  type: TreeNodeType;
  expanded: boolean;
  loading: boolean;
  loaded: boolean;
  children: TreeNode[];
  meta?: any;
  parent?: TreeNode;
}

export interface TreeCallbacks {
  onExpand?: (node: TreeNode) => Promise<void> | void;
  onCollapse?: (node: TreeNode) => void;
  onSelectLeaf?: (node: TreeNode) => void;
}

const TOGGLE_OPEN = "▾";
const TOGGLE_CLOSED = "▸";
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const NODE_STYLE: Record<
  TreeNodeType,
  { icon: string; color: string; bold?: boolean }
> = {
  connection: { icon: "■", color: "white", bold: true },
  database: { icon: "◆", color: "cyan" },
  collection: { icon: "▪", color: "green" },
};

export function createTree(parent: any, options: any) {
  const id = "tree";
  const list: any = blessed.list({
    id,
    parent,
    keys: true,
    mouse: true,
    vi: true,
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    border: "line",
    scrollbar: { ch: " " },
    style: {
      border: { fg: theme.border.blur },
      selected: { bg: "green", fg: "black" },
      item: { fg: "white" },
    },
    ...options,
  });

  list.on("focus", () => {
    list.style.border.fg = theme.border.focus;
    appInstance.setKeybindbarContent(id);
    list.screen.render();
  });
  list.on("blur", () => {
    list.style.border.fg = theme.border.blur;
    list.screen.render();
  });

  const roots: TreeNode[] = [];
  let visible: TreeNode[] = [];
  let spinnerTimer: ReturnType<typeof setInterval> | null = null;
  let spinnerFrame = 0;
  let callbacks: TreeCallbacks = {};

  function depthOf(node: TreeNode): number {
    let d = 0;
    let p = node.parent;
    while (p) {
      d++;
      p = p.parent;
    }
    return d;
  }

  function flatten(): TreeNode[] {
    const out: TreeNode[] = [];
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        out.push(n);
        if (n.expanded && n.children.length) walk(n.children);
      }
    };
    walk(roots);
    return out;
  }

  function formatRow(node: TreeNode, isSelected: boolean): string {
    const indent = "  ".repeat(depthOf(node));
    const hasChildren = node.type !== "collection";
    let toggle = " ";
    if (hasChildren) {
      toggle = node.loading
        ? SPINNER_FRAMES[spinnerFrame % SPINNER_FRAMES.length]
        : node.expanded
          ? TOGGLE_OPEN
          : TOGGLE_CLOSED;
    }
    const { icon, color: defaultColor, bold } = NODE_STYLE[node.type];
    const color =
      node.type === "connection" && node.meta?.color
        ? node.meta.color
        : defaultColor;
    const group =
      node.type === "connection" && node.meta?.group
        ? `[${node.meta.group}] `
        : "";

    // The selected row's bg/fg (style.selected, set below) is meant to be
    // the single source of contrast for a highlighted item. Any {color-fg}
    // tag baked into the label (per-connection color-coding, the gray group
    // label) overrides that fg per-character when blessed parses tags — so
    // e.g. a green-tagged collection row on the tree's green selected
    // background rendered as invisible green-on-green text. Skip the color
    // tags entirely on the selected row so it always uses the plain
    // selected style instead.
    if (isSelected) {
      return `${indent}${toggle} ${group}${icon} ${node.label}`;
    }

    const open = bold ? `{bold}{${color}-fg}` : `{${color}-fg}`;
    const close = bold ? `{/${color}-fg}{/bold}` : `{/${color}-fg}`;
    const groupTag = group ? `{gray-fg}${group}{/gray-fg}` : "";
    return `${indent}${toggle} ${groupTag}${open}${icon} ${node.label}${close}`;
  }

  // Reentrancy guard: restyleSelection() calls list.setItems()/list.select(),
  // both of which emit "select item" internally (see List.prototype.setItems
  // in neo-blessed), which would otherwise call back into the handler below
  // and recurse.
  let restyling = false;

  function render() {
    visible = flatten();
    const prevSelected = list.selected ?? 0;
    if (!visible.length) {
      list.setItems([
        "{gray-fg}No saved connections — press Ctrl+E to add one{/gray-fg}",
      ]);
    } else {
      const selectedIndex = Math.min(prevSelected, visible.length - 1);
      restyling = true;
      list.setItems(
        visible.map((node, i) => formatRow(node, i === selectedIndex)),
      );
      list.select(selectedIndex);
      restyling = false;
    }
    list.screen.render();
  }

  // Plain up/down navigation (vi/arrow keys, built into `List` since
  // `keys`/`vi` are set) doesn't go through render() above — it just moves
  // `list.selected`. Re-run the tag-stripping in formatRow whenever the
  // selection moves so the newly-selected row loses its color tag too,
  // not just whichever row was selected the last time render() ran.
  list.on("select item", () => {
    if (restyling || !visible.length) return;
    restyling = true;
    const selectedIndex = list.selected;
    list.setItems(
      visible.map((node, i) => formatRow(node, i === selectedIndex)),
    );
    list.select(selectedIndex);
    restyling = false;
    list.screen.render();
  });

  function syncSpinner() {
    const anyLoading = visible.some((n) => n.loading);
    if (anyLoading && !spinnerTimer) {
      spinnerTimer = setInterval(() => {
        spinnerFrame++;
        render();
      }, 80);
    } else if (!anyLoading && spinnerTimer) {
      clearInterval(spinnerTimer);
      spinnerTimer = null;
    }
  }

  function setRoots(nodes: TreeNode[]) {
    roots.length = 0;
    roots.push(...nodes);
    render();
  }

  function makeNode(
    type: TreeNodeType,
    label: string,
    parent?: TreeNode,
    meta?: any,
  ): TreeNode {
    return {
      id: `${type}-${label}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      type,
      expanded: false,
      loading: false,
      loaded: type === "collection",
      children: [],
      meta,
      parent,
    };
  }

  async function toggleNode(node: TreeNode) {
    if (node.type === "collection") {
      callbacks.onSelectLeaf?.(node);
      return;
    }
    if (node.expanded) {
      node.expanded = false;
      callbacks.onCollapse?.(node);
      render();
      return;
    }
    node.expanded = true;
    if (!node.loaded) {
      node.loading = true;
      render();
      syncSpinner();
      try {
        await callbacks.onExpand?.(node);
      } finally {
        node.loading = false;
        node.loaded = true;
        syncSpinner();
        render();
      }
    } else {
      render();
    }
  }

  list.on("select", (_item: any, index: number) => {
    const node = visible[index];
    if (node) toggleNode(node);
  });

  list.key(["right", "l"], () => {
    const node = visible[list.selected];
    if (node && node.type !== "collection" && !node.expanded) toggleNode(node);
  });
  list.key(["left", "h"], () => {
    const node = visible[list.selected];
    if (node && node.expanded) toggleNode(node);
  });

  function getSelectedNode(): TreeNode | undefined {
    return visible[list.selected];
  }

  function removeNode(node: TreeNode) {
    if (node.parent) {
      node.parent.children = node.parent.children.filter((c) => c !== node);
    } else {
      const idx = roots.indexOf(node);
      if (idx !== -1) roots.splice(idx, 1);
    }
    render();
  }

  return {
    el: list as blessed.Widgets.ListElement,
    setRoots,
    makeNode,
    getRoots: () => roots,
    getSelectedNode,
    removeNode,
    setCallbacks: (cb: TreeCallbacks) => (callbacks = cb),
    render,
  };
}
