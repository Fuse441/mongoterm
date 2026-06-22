import blessed from "neo-blessed";
import { theme } from "@/config/app.config";

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
  const list: any = blessed.list({
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

  function formatRow(node: TreeNode): string {
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
    const { icon, color, bold } = NODE_STYLE[node.type];
    const open = bold ? `{bold}{${color}-fg}` : `{${color}-fg}`;
    const close = bold ? `{/${color}-fg}{/bold}` : `{/${color}-fg}`;
    return `${indent}${toggle} ${open}${icon} ${node.label}${close}`;
  }

  function render() {
    visible = flatten();
    const prevSelected = list.selected ?? 0;
    if (!visible.length) {
      list.setItems([
        "{gray-fg}No saved connections — press Ctrl+E to add one{/gray-fg}",
      ]);
    } else {
      list.setItems(visible.map(formatRow));
      list.select(Math.min(prevSelected, visible.length - 1));
    }
    list.screen.render();
  }

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

  return {
    el: list as blessed.Widgets.ListElement,
    setRoots,
    makeNode,
    getRoots: () => roots,
    setCallbacks: (cb: TreeCallbacks) => (callbacks = cb),
    render,
  };
}
