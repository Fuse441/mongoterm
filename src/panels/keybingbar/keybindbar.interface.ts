export type TKeybindName = "tree" | "workspace" | "query" | "record";
export interface IKeybind {
  key: string;
  description: string;
}
export type TKeybind = Record<TKeybindName, IKeybind[]>;
