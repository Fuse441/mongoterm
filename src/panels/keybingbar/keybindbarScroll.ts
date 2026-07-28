import { IKeybind } from "./keybindbar.interface";

interface EntryRange {
  start: number;
  keyStart: number;
  keyEnd: number;
  end: number;
  key: string;
  description: string;
}

function buildRanges(entries: IKeybind[]): { ranges: EntryRange[]; totalLength: number } {
  const ranges: EntryRange[] = [];
  let pos = 0;
  for (const { key, description } of entries) {
    const start = pos;
    const keyStart = start + 1; // "["
    const keyEnd = keyStart + key.length;
    const end = keyEnd + `] - ${description}  `.length;
    ranges.push({ start, keyStart, keyEnd, end, key, description });
    pos = end;
  }
  return { ranges, totalLength: pos };
}

// Renders the visible [offset, offset + width) window of the plain
// "[key] - description  " concatenation, re-wrapping {bold}/{/bold} around
// whatever part of each key falls inside the window — slicing the tagged
// string directly could cut a tag in half.
export function renderKeybindWindow(
  entries: IKeybind[],
  offset: number,
  width: number,
): { content: string; maxOffset: number } {
  const { ranges, totalLength } = buildRanges(entries);
  const maxOffset = Math.max(0, totalLength - width);
  const clampedOffset = Math.min(Math.max(0, offset), maxOffset);
  const winStart = clampedOffset;
  const winEnd = clampedOffset + width;

  let content = "";
  for (const entry of ranges) {
    if (entry.end <= winStart || entry.start >= winEnd) continue;

    const sliceStart = Math.max(entry.start, winStart);
    const sliceEnd = Math.min(entry.end, winEnd);
    const plainSegment = `[${entry.key}] - ${entry.description}  `;

    for (let pos = sliceStart; pos < sliceEnd; ) {
      const inKey = pos >= entry.keyStart && pos < entry.keyEnd;
      const segEnd = inKey
        ? Math.min(sliceEnd, entry.keyEnd)
        : Math.min(sliceEnd, pos < entry.keyStart ? entry.keyStart : entry.end);
      const chunk = plainSegment.slice(pos - entry.start, segEnd - entry.start);
      content += inKey ? `{bold}${chunk}{/bold}` : chunk;
      pos = segEnd;
    }
  }

  return { content, maxOffset };
}
