import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const previews = ['fee-management-copy-20261026'];
const project = path.dirname(fileURLToPath(import.meta.url));
const shouldBuild = process.env.GITHUB_ACTIONS === 'true' || process.argv.includes('--build');
if (shouldBuild) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli || !existsSync(npmCli)) throw new Error('Run npm run build -- --build.');
  const run = (command, args, cwd = project) => execFileSync(command, args, { cwd, stdio: 'inherit' });
  for (const branch of previews) {
    const temporary = mkdtempSync(path.join(tmpdir(), 'ansu-branch-preview-'));
    const source = path.join(temporary, 'source');
    const output = path.resolve(project, 'dist', 'branches', branch);
    if (!output.startsWith(path.resolve(project, 'dist', 'branches') + path.sep)) throw new Error('Invalid preview output path');
    console.log(`Building branch preview: ${branch}`);
    run('git', ['fetch', '--depth', '1', 'origin', branch]);
    run('git', ['worktree', 'add', '--detach', source, 'FETCH_HEAD']);
    run(process.execPath, [npmCli, 'ci', '--no-audit', '--no-fund'], source);
    run(process.execPath, [path.join(source, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--base', `/A--a/branches/${branch}/`, '--outDir', output, '--emptyOutDir'], source);
  }
} else {
  console.log('Branch previews are built during GitHub Pages deployment.');
}