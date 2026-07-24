#!/usr/bin/env node
/**
 * Local MCP server that serves the mongoterm GitHub wiki
 * (https://github.com/Fuse441/mongoterm/wiki) as MCP resources/tools, so any
 * MCP-capable AI assistant running on a dev's machine can read Architecture,
 * Keybindings, Features, and Roadmap without a human pasting them in.
 *
 * Run directly with `npm run mcp` (stdio transport — point your MCP client
 * config at this command, e.g. `tsx src/mcp/wiki.server.ts` or the built
 * `dist/src/mcp/wiki.server.js`).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const WIKI_OWNER = "Fuse441";
const WIKI_REPO = "mongoterm";

// The wiki's own known pages (see the repo's wiki: Home, Architecture,
// Keybindings, Features, Roadmap). get_wiki_page below isn't limited to
// this list — it can fetch any page name — this is just what gets
// pre-registered as a browsable MCP resource.
const WIKI_PAGES = [
  "Home",
  "Architecture",
  "Keybindings",
  "Features",
  "Roadmap",
] as const;

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { body: string; fetchedAt: number }>();

function wikiPageUrl(page: string): string {
  return `https://raw.githubusercontent.com/wiki/${WIKI_OWNER}/${WIKI_REPO}/${encodeURIComponent(page)}.md`;
}

async function fetchWikiPage(page: string): Promise<string> {
  const cached = cache.get(page);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.body;
  }

  const res = await fetch(wikiPageUrl(page));
  if (!res.ok) {
    throw new Error(`Wiki page "${page}" not found (HTTP ${res.status})`);
  }
  const body = await res.text();
  cache.set(page, { body, fetchedAt: Date.now() });
  return body;
}

const server = new McpServer({
  name: "mongoterm-wiki",
  version: "1.0.0",
});

for (const page of WIKI_PAGES) {
  server.registerResource(
    page,
    `wiki://${page}`,
    {
      title: `mongoterm wiki: ${page}`,
      description: `The "${page}" page from the mongoterm GitHub wiki`,
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        { uri: uri.href, mimeType: "text/markdown", text: await fetchWikiPage(page) },
      ],
    }),
  );
}

server.registerTool(
  "list_wiki_pages",
  {
    title: "List mongoterm wiki pages",
    description: "List every mongoterm wiki page pre-registered as a resource",
  },
  async () => ({
    content: [{ type: "text", text: WIKI_PAGES.join("\n") }],
  }),
);

server.registerTool(
  "get_wiki_page",
  {
    title: "Get a mongoterm wiki page",
    description:
      "Fetch a mongoterm wiki page by name (e.g. Architecture, Keybindings, Features, Roadmap, Home)",
    inputSchema: {
      page: z.string().describe('Wiki page name, e.g. "Architecture"'),
    },
  },
  async ({ page }) => {
    try {
      return { content: [{ type: "text", text: await fetchWikiPage(page) }] };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("mongoterm-mcp fatal error:", error);
  process.exit(1);
});
