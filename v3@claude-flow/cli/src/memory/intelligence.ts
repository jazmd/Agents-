  // Prefer local directory if it already exists
  if (existsSync(localDir)) {
    return localDir;
  }
  // If local .claude-flow exists (indicating local preference), use localDir (will be created by ensureDataDir)
  if (existsSync(join(cwd, '.claude-flow'))) {
    return localDir;
  }
  return homeDir;