export type TKeybindName = "tree" | "workspace" | "query" | "record" | "grid";
export type THelpOnlySection = "editor" | "autocomplete" | "global" | "colorPicker" | "indexes" | "collectionStats" | "schemaAnalysis" | "commandPalette";
export interface IKeybind {
  key: string;
  description: string;
}
export type TKeybind = Record<TKeybindName, IKeybind[]>;
export type THelpSections = Record<THelpOnlySection, IKeybind[]>;
