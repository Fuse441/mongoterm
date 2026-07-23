export type TKeybindName = "tree" | "workspace" | "query" | "record";
export type THelpOnlySection = "editor" | "autocomplete" | "global";
export interface IKeybind {
  key: string;
  description: string;
}
export type TKeybind = Record<TKeybindName, IKeybind[]>;
export type THelpSections = Record<THelpOnlySection, IKeybind[]>;
