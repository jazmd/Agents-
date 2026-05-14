/**
 * V3 CLI Test Command
 * Multi-repo test discovery and execution via workspace.yaml
 */

import type { Command, CommandContext, CommandResult } from '../types.js';
import { output } from '../output.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { spawn } from 'child_process';
import { parse as parseYaml } from 'yaml';

interface WorkspaceTestRepo {
  name: string;
  path: string;
  command?: string;
  framework?: string;
}

interface WorkspaceTestConfig {
  discover?: boolean;
  scanSubRepos?: boolean;
  pattern?: string[];
  exclude?: string[];
  repos?: WorkspaceTestRepo[];
}

interface WorkspaceConfig {
  name?: string;
  ruflo?: {
    tests?: WorkspaceTestConfig;
  };
}

interface TestResult {
  name: string;
  path: string;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  passed: boolean;
}

async function loadWorkspace(workspacePath: string): Promise<WorkspaceConfig | null> {
  try {
    const content = await fs.readFile(workspacePath, 'utf-8');
    return parseYaml(content) as WorkspaceConfig;
  } catch {
    return null;
  }
}

async function findWorkspaceFile(startDir: string): Promise<string | null> {
  for (const name of ['workspace.yaml', 'workspace.yml']) {
    const candidate = path.join(startDir, name);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // not found
    }
  }
  return null;
}

async function repoHasPackageJson(repoPath: string): Promise<boolean> {
  try {
    await fs.access(path.join(repoPath, 'package.json'));
    return true;
  } catch {
    return false;
  }
}

function runCommand(
  cmd: string,
  cwd: string,
  onLine: (line: string, isErr: boolean) => void
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const [prog, ...args] = cmd.split(' ');
    const child = spawn(prog, args, {
      cwd,
      shell: true,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      for (const line of text.split('\n').filter(Boolean)) onLine(line, false);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      for (const line of text.split('\n').filter(Boolean)) onLine(line, true);
    });

    child.on('close', (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });

    child.on('error', (err) => {
      resolve({ exitCode: 1, stdout, stderr: err.message });
    });
  });
}

async function runRepoTests(
  repo: WorkspaceTestRepo,
  baseDir: string,
  verbose: boolean
): Promise<TestResult> {
  const repoPath = path.resolve(baseDir, repo.path);
  const cmd = repo.command ?? 'npm test';
  const start = Date.now();

  if (verbose) {
    output.printInfo(`  Running: ${output.highlight(cmd)} in ${output.dim(repoPath)}`);
  }

  const { exitCode, stdout, stderr } = await runCommand(
    cmd,
    repoPath,
    (line, isErr) => {
      if (verbose) {
        if (isErr) output.writeln(output.dim(`    [stderr] ${line}`));
        else output.writeln(output.dim(`    ${line}`));
      }
    }
  );

  return {
    name: repo.name,
    path: repoPath,
    command: cmd,
    exitCode,
    stdout,
    stderr,
    duration: Date.now() - start,
    passed: exitCode === 0,
  };
}

async function runSequential(
  repos: WorkspaceTestRepo[],
  baseDir: string,
  verbose: boolean
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  for (const repo of repos) {
    output.printInfo(`Running tests: ${output.highlight(repo.name)}`);
    const result = await runRepoTests(repo, baseDir, verbose);
    printRepoResult(result);
    results.push(result);
  }
  return results;
}

async function runParallel(
  repos: WorkspaceTestRepo[],
  baseDir: string,
  verbose: boolean
): Promise<TestResult[]> {
  output.printInfo(`Running ${repos.length} repos in parallel...`);
  const results = await Promise.all(
    repos.map((repo) => runRepoTests(repo, baseDir, verbose))
  );
  for (const r of results) printRepoResult(r);
  return results;
}

function printRepoResult(result: TestResult): void {
  const icon = result.passed ? output.success('✔') : output.error('✖');
  const duration = `(${(result.duration / 1000).toFixed(1)}s)`;
  output.writeln(`  ${icon} ${result.name} ${output.dim(duration)}`);
  if (!result.passed && result.stderr) {
    const lines = result.stderr.split('\n').filter(Boolean).slice(0, 5);
    for (const line of lines) output.writeln(output.dim(`     ${line}`));
  }
}

function printSummary(results: TestResult[], totalMs: number): void {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  output.writeln('');
  output.printBox(
    [
      `Repos tested: ${results.length}`,
      `Passed:       ${passed}`,
      `Failed:       ${failed}`,
      `Total time:   ${(totalMs / 1000).toFixed(1)}s`,
    ].join('\n'),
    'Test Summary'
  );

  if (failed > 0) {
    output.writeln('');
    output.writeln(output.bold('Failed repos:'));
    for (const r of results.filter((r) => !r.passed)) {
      output.writeln(`  ${output.error('✖')} ${r.name}  (exit ${r.exitCode})`);
    }
  }
}

export const testCommand: Command = {
  name: 'test',
  description: 'Discover and run tests across multi-repo workspace',
  aliases: ['t'],
  options: [
    {
      name: 'workspace',
      short: 'w',
      description: 'Path to workspace.yaml (default: auto-detect in cwd)',
      type: 'string',
    },
    {
      name: 'repo',
      short: 'r',
      description: 'Run only specific repo(s) — comma-separated names',
      type: 'string',
    },
    {
      name: 'parallel',
      short: 'p',
      description: 'Run repos in parallel (default: true)',
      type: 'boolean',
      default: true,
    },
    {
      name: 'sequential',
      short: 's',
      description: 'Run repos one at a time',
      type: 'boolean',
      default: false,
    },
    {
      name: 'framework',
      short: 'f',
      description: 'Filter repos by test framework (e.g. jest, karma)',
      type: 'string',
    },
    {
      name: 'dry-run',
      short: 'd',
      description: 'Print what would run without executing',
      type: 'boolean',
      default: false,
    },
    {
      name: 'verbose',
      short: 'v',
      description: 'Stream test output as it runs',
      type: 'boolean',
      default: false,
    },
  ],
  examples: [
    { command: 'ruflo test', description: 'Run all tests defined in workspace.yaml' },
    { command: 'ruflo test --repo bidchex-backend', description: 'Run tests for a single repo' },
    { command: 'ruflo test --framework jest', description: 'Run only jest repos' },
    { command: 'ruflo test --sequential --verbose', description: 'Run sequentially with live output' },
    { command: 'ruflo test --dry-run', description: 'Preview what commands would run' },
  ],
  action: async (ctx: CommandContext): Promise<CommandResult> => {
    const workspaceOpt = ctx.flags.workspace as string | undefined;
    const repoFilter = ctx.flags.repo as string | undefined;
    const parallelFlag = ctx.flags.parallel as boolean;
    const sequentialFlag = ctx.flags.sequential as boolean;
    const frameworkFilter = ctx.flags.framework as string | undefined;
    const dryRun = (ctx.flags['dryRun'] ?? ctx.flags['dry-run']) as boolean;
    const verbose = ctx.flags.verbose as boolean;

    const useParallel = !sequentialFlag && parallelFlag;

    // Locate workspace.yaml
    const cwd = process.cwd();
    const workspaceFile = workspaceOpt
      ? path.resolve(workspaceOpt)
      : await findWorkspaceFile(cwd);

    if (!workspaceFile) {
      output.printError(
        'No workspace.yaml found. Run from a multi-repo root or pass --workspace <path>.'
      );
      return { success: false, message: 'workspace.yaml not found' };
    }

    const workspace = await loadWorkspace(workspaceFile);
    if (!workspace) {
      output.printError(`Failed to parse ${workspaceFile}`);
      return { success: false, message: 'parse error' };
    }

    const testConfig = workspace.ruflo?.tests;
    if (!testConfig?.repos?.length) {
      output.printError(
        'No test repos configured. Add a ruflo.tests.repos section to workspace.yaml.'
      );
      return { success: false, message: 'no test repos configured' };
    }

    const baseDir = path.dirname(workspaceFile);

    // Filter repos
    let repos = testConfig.repos;

    if (repoFilter) {
      const names = repoFilter.split(',').map((n) => n.trim());
      repos = repos.filter((r) => names.includes(r.name));
      if (!repos.length) {
        output.printError(`No repos matched filter: ${repoFilter}`);
        return { success: false, message: 'no matching repos' };
      }
    }

    if (frameworkFilter) {
      repos = repos.filter((r) => r.framework === frameworkFilter);
      if (!repos.length) {
        output.printError(`No repos with framework: ${frameworkFilter}`);
        return { success: false, message: 'no matching repos' };
      }
    }

    // Verify repo paths exist
    const verified: WorkspaceTestRepo[] = [];
    for (const repo of repos) {
      const repoPath = path.resolve(baseDir, repo.path);
      try {
        await fs.access(repoPath);
        verified.push(repo);
      } catch {
        output.printWarning(`Skipping ${repo.name} — path not found: ${repoPath}`);
      }
    }

    if (!verified.length) {
      output.printError('No valid repo paths found.');
      return { success: false, message: 'no valid repos' };
    }

    const wsName = workspace.name ?? 'workspace';
    output.printBox(
      [
        `Workspace: ${wsName}`,
        `Config:    ${workspaceFile}`,
        `Repos:     ${verified.length}`,
        `Mode:      ${useParallel ? 'parallel' : 'sequential'}`,
      ].join('\n'),
      'Ruflo Test Runner'
    );
    output.writeln('');

    // Dry run
    if (dryRun) {
      output.writeln(output.bold('Would run:'));
      for (const repo of verified) {
        const cmd = repo.command ?? 'npm test';
        const repoPath = path.resolve(baseDir, repo.path);
        output.writeln(`  ${output.highlight(repo.name)}`);
        output.writeln(`    cd ${repoPath}`);
        output.writeln(`    ${cmd}`);
      }
      return { success: true };
    }

    const start = Date.now();
    const results = useParallel
      ? await runParallel(verified, baseDir, verbose)
      : await runSequential(verified, baseDir, verbose);

    printSummary(results, Date.now() - start);

    const allPassed = results.every((r) => r.passed);
    return {
      success: allPassed,
      data: {
        total: results.length,
        passed: results.filter((r) => r.passed).length,
        failed: results.filter((r) => !r.passed).length,
        results,
      },
    };
  },
};

export default testCommand;
