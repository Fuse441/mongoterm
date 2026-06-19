import { state } from "@/shared/state";

export function getConnectionNames() {
  return (state.connections || [])
    .map((c) => c?.favorite?.name)
    .filter(Boolean);
}
