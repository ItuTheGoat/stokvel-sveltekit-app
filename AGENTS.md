## Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **Add-ons**: eslint, tailwindcss, mcp, prettier
- **Package scripts**: Use `bun run <script>` for npm scripts and `bunx`. Firebase: `deploy:firestore`, `deploy:storage`, or `deploy:firebase:all`.

---

## Svelte MCP Strategy

You have access to Svelte 5 and SvelteKit documentation via MCP. Use these tools **discretionary** rather than mandatory to ensure a fast, seamless dev experience.

### Tool Usage Heuristics:

1. **list-sections & get-documentation**
  - **Skip if:** The request involves standard Svelte 5 syntax you already know (e.g., simple `$state`, `$derived`, or basic routing).
  - **Use if:** The user asks about complex SvelteKit internals, specific edge cases in Svelte 5 snippets, or features added in very recent minor releases.
  - **Efficiency:** If you know the specific topic, go straight to `get-documentation` if the path is predictable, or use `list-sections` only if the exact documentation path is ambiguous.
2. **svelte-autofixer**
  - **Skip if:** You are making minor CSS changes, updating HTML attributes, or fixing a simple logic error.
  - **Use if:** You are writing a new component from scratch, performing a large-scale refactor of Runes, or the user reports a cryptic compiler error.
  - **Constraint:** Do not loop this tool. Run it once; if suggestions remain that you can fix manually, do so in the final code block without re-running the tool.
3. **playground-link**
  - **Constraint:** Only generate if the user explicitly requests a shareable link. Do not ask the user if they want one after every message.

