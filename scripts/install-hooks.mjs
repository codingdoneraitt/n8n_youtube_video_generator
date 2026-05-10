import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(projectDir, '..');
const hooksPath = 'n8n_practice_exam_generator/.githooks';

execFileSync('git', ['config', 'core.hooksPath', hooksPath], {
  cwd: repoRoot,
  stdio: 'inherit',
});

console.log(`Git hooks installed: ${hooksPath}`);
