# ruflo — Use it from any device, any time

This setup lets you run your hardened ruflo on any machine with **no servers**. The split:

- **Code travels via Git** — this fork (`github.com/tjaiyen/ruflo`, branch `harden-helpers`).
- **Memory travels via Google Drive** — ruflo's *durable* memory is the Markdown in your
  Obsidian vault and `~/.claude/projects/<slug>/memory/MEMORY.md`, which Google Drive already syncs
  across your devices.
- **The local cache is rebuilt per device** — the SQLite/AgentDB under `.claude-flow/data/` is just a
  fast local cache that ruflo regenerates from that Markdown on each machine (via the SessionStart
  memory import + `intelligence.cjs` bootstrap). Nothing about the cache needs to sync.

> Why this works on Windows now: the bootstrap that rebuilds the cache from `MEMORY.md` previously
> only matched POSIX paths, so on Windows it silently found nothing. **FIX 5** in this branch makes
> the project-dir slug match Claude Code's real convention, so memory is picked up on every OS.

## One-time setup on each new device

1. **Clone the fork to LOCAL disk — not inside Google Drive.**
   Google Drive can't create the symlinks this repo uses and can corrupt an open SQLite file, so keep
   the working copy off the synced drive.
   ```
   git clone https://github.com/tjaiyen/ruflo.git
   cd ruflo
   git checkout harden-helpers
   ```

2. **Wire ruflo into Claude Code on this device.**
   ```
   npx ruflo@latest init          # fresh machine
   # or, if ruflo was set up here before:
   npx ruflo@latest init upgrade  # preserves existing data
   ```

3. **Make sure your memory is present (Google Drive synced).**
   Confirm the Drive client has synced your Obsidian vault and that
   `~/.claude/projects/<this-project-slug>/memory/MEMORY.md` exists. ruflo's SessionStart hook imports
   from it automatically — open Claude Code and you should see a `[INTELLIGENCE] Loaded N patterns`
   line confirming the memory was picked up.

## Day-to-day across devices

- **Pull the latest code** before working: `git pull origin harden-helpers` (origin = your fork).
- **Memory updates** flow automatically: MEMORY.md changes saved on one device sync via Drive and are
  re-imported by the next device's SessionStart. Edit memory through your normal Obsidian/Claude flow.
- **Don't run two devices against the same clone at once on Drive** — keep each device's clone local.

## What is intentionally NOT used here

- No hosted database, no always-on server, no `flow-nexus` (that integration isn't functional).
- ruflo *can* do shared live memory via a PostgreSQL (`RUVECTOR_*`) backend or expose a remote MCP
  server over HTTP — those are heavier, infra-bound options. If you ever want a true single shared
  brain (vs. per-device caches rebuilt from synced Markdown), that's the upgrade path.

## Debugging

Set `RUFLO_DEBUG=1` to surface the new diagnostics added in this branch: truncation warnings when a
stored memory value is clipped, and suppressed-rejection / signal-flush messages from the hooks.
