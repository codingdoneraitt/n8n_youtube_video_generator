import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'data', '.n8n']);
const ignoredFiles = new Set(['package-lock.json']);
const scannedExtensions = new Set(['.js', '.mjs', '.ts', '.tsx', '.json', '.yml', '.yaml', '.md', '.example', '.toml']);

const failures = [];

for await (const file of walk(root)) {
  const rel = relative(root, file);
  const text = await readFile(file, 'utf-8');

  if (/(api[_-]?key|secret|token|password)\s*[:=]\s*['"][A-Za-z0-9_./+=-]{24,}['"]/i.test(text)) {
    failures.push(`${rel}: possible hardcoded secret`);
  }
  if (/\beval\s*\(/.test(text) || /\bnew\s+Function\s*\(/.test(text)) {
    failures.push(`${rel}: dynamic code execution pattern`);
  }
  if (/ignoreCertificateErrors:\s*true/.test(text)) {
    failures.push(`${rel}: Chromium certificate validation is disabled`);
  }
  if (/N8N_USER_MANAGEMENT_DISABLED:\s*["']true["']/.test(text)) {
    failures.push(`${rel}: n8n user management must remain enabled`);
  }
}

const compose = await readFile(join(root, 'docker-compose.yml'), 'utf-8');
requireText(compose, 'N8N_BLOCK_ENV_ACCESS_IN_NODE: "true"', 'docker-compose.yml: Code nodes must not read arbitrary env vars');
requireText(compose, 'N8N_RESTRICT_FILE_ACCESS_TO: /files', 'docker-compose.yml: file access must be restricted to /files');

const mainWorkflow = await readFile(join(root, 'n8n/workflows/01_generate_practice_exam_walkthrough.json'), 'utf-8');
requireText(mainWorkflow, 'Human Approval Gate', 'Main workflow must keep the human approval gate before YouTube upload');
requireText(mainWorkflow, 'YOUTUBE_UPLOAD_ENABLED', 'YouTube placeholder must stay guarded by YOUTUBE_UPLOAD_ENABLED');

if (failures.length > 0) {
  for (const failure of failures) console.error(`fail ${failure}`);
  process.exit(1);
}

console.log('ok static security scan');

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }
    if (ignoredFiles.has(entry.name)) continue;
    if (!shouldScan(entry.name)) continue;
    yield fullPath;
  }
}

function shouldScan(fileName) {
  if (fileName === '.env.example' || fileName === '.gitignore' || fileName === '.dockerignore') return true;
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 && scannedExtensions.has(fileName.slice(dot));
}

function requireText(text, needle, message) {
  if (!text.includes(needle)) failures.push(message);
}
