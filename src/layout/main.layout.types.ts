import { TreeNode } from "@/panels/tree/tree.panel";
import blessed from "blessed";
export type TResponseLayout = {
  panels: Partial<TLayoutScreen["_panels"]>;
  dropdowns: Partial<TLayoutScreen["_dropdowns"]>;
};
type TDropdown = {
  header: blessed.Widgets.BoxElement;
  list: blessed.Widgets.ListElement;
};
type TTree = {
  el: blessed.Widgets.ListElement;
  render(): void;
  setRoots(...nodes: TreeNode[]): void;
};
export type TLayoutScreen = {
  _panels: {
    tree: any;
    connection: blessed.Widgets.BoxElement;
    workspace: blessed.Widgets.BoxElement;
    query: blessed.Widgets.BoxElement;
    monitor: blessed.Widgets.BoxElement;
    keybindbar: blessed.Widgets.BoxElement;
  };
  _dropdowns: {
    connectionDD: TDropdown;
    databaseDD: TDropdown;
    collectionDD: TDropdown;
  };
};

export interface IMainLayout {
  panels: Partial<TLayoutScreen["_panels"]>;
  dropdowns: Partial<TLayoutScreen["_dropdowns"]>;
}
