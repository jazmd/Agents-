---
name: plugin
description: Manage plugins and marketplaces — add registries, install plugins, list what's available
---

# 🔌 Plugin Manager

Manage RuFlo plugins and marketplace registries. Maps to `npx ruflo@latest plugins …` commands.

## Add a Marketplace

Register a GitHub-hosted marketplace so its plugins can be installed with `@registry` syntax:

```bash
npx ruflo@latest plugins marketplace add ruvnet/ruflo
npx ruflo@latest plugins marketplace add ruvnet/claude-flow
```

After adding, install from it using `name@registry`:
```bash
npx ruflo@latest plugins install -n ruflo-core@ruflo
npx ruflo@latest plugins install -n @claude-flow/neural@claude-flow
```

## List Registered Marketplaces

```bash
npx ruflo@latest plugins marketplace list
```

## Install a Plugin

```bash
# From default IPFS registry
npx ruflo@latest plugins install -n community-analytics

# From a named marketplace
npx ruflo@latest plugins install -n ruflo-core@ruflo
npx ruflo@latest plugins install -n @claude-flow/neural@claude-flow

# From a local path
npx ruflo@latest plugins install -n ./my-plugin
```

## List Available Plugins

```bash
# All plugins from IPFS registry
npx ruflo@latest plugins list

# Only installed plugins
npx ruflo@latest plugins list --installed

# Filter by category
npx ruflo@latest plugins list --category security
```

## Search

```bash
npx ruflo@latest plugins search -q neural
npx ruflo@latest plugins search -q security --verified
```

## Plugin Info

```bash
npx ruflo@latest plugins info -n @claude-flow/neural
```

## Uninstall / Toggle

```bash
npx ruflo@latest plugins uninstall -n community-analytics
npx ruflo@latest plugins toggle -n analytics --enable
npx ruflo@latest plugins toggle -n analytics --disable
```

## Create a New Plugin

```bash
npx ruflo@latest plugins create -n my-plugin
npx ruflo@latest plugins create -n my-plugin -t hooks
```

---

## Handling `/plugin add owner/repo`

When the user runs `/plugin add owner/repo`, execute:

```bash
npx ruflo@latest plugins marketplace add owner/repo
```

This fetches `.claude-plugin/marketplace.json` from that GitHub repo (or reads it locally
if already present), registers it under the repo name, and saves to
`.claude-flow/plugins/marketplaces.json`.

## Handling `/plugin install name[@registry]`

```bash
npx ruflo@latest plugins install -n <name>
# or with registry qualifier:
npx ruflo@latest plugins install -n <name>@<registry>
```
