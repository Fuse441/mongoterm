import blessed from "blessed";
export type TResponseLayout = {
  panels: Partial<TLayoutScreen["_panels"]>;
  dropdowns: Partial<TLayoutScreen["_dropdowns"]>;
};
type TDropdown = {
  header: blessed.Widgets.BoxElement;
  list: blessed.Widgets.ListElement;
};
export type TLayoutScreen = {
  _panels: {
    connection: blessed.Widgets.BoxElement;
    workspace: blessed.Widgets.BoxElement;
    query: blessed.Widgets.BoxElement;
    monitor: blessed.Widgets.BoxElement;
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
