import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  '.env.example',
  '.gitignore',
  '.dockerignore',
  '.github/workflows/ci.yml',
  '.github/workflows/security.yml',
  '.github/dependabot.yml',
  '.github/CODEOWNERS',
  'README.md',
  'SECURITY.md',
  'docker-compose.yml',
  'diagrams/architecture.drawio',
  'diagrams/architecture.svg',
  'diagrams/manual-render-flow.drawio',
  'diagrams/manual-render-flow.svg',
  'diagrams/quality-gates.drawio',
  'diagrams/quality-gates.svg',
  'package-lock.json',
  'questions.json',
  'n8n/workflows/01_generate_practice_exam_walkthrough.json',
  'services/remotion-renderer/Dockerfile',
];

const failures = [];

for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    failures.push(`missing required file: ${file}`);
  }
}

await assertContains('.gitignore', '.env', '.gitignore must ignore .env');
await assertContains('.gitignore', 'data/', '.gitignore must ignore render artifacts');
await assertContains('.dockerignore', '.env', '.dockerignore must exclude local env files');
await assertContains('README.md', 'Run This POC', 'README must keep the top-level runbook');
await assertContains('SECURITY.md', 'npm run security', 'SECURITY.md must document security checks');
await assertContains('.github/workflows/ci.yml', 'docker-quality', 'CI must verify Docker build quality');
await assertContains('.github/workflows/security.yml', 'CodeQL', 'Security workflow must run CodeQL');
await assertContains('diagrams/architecture.drawio', '<mxfile', 'architecture diagram must be a draw.io file');
await assertContains('diagrams/manual-render-flow.drawio', '<mxfile', 'manual render diagram must be a draw.io file');
await assertContains('diagrams/quality-gates.drawio', '<mxfile', 'quality gates diagram must be a draw.io file');
await assertContains('diagrams/architecture.svg', '<svg', 'architecture preview must be an SVG file');
await assertContains('diagrams/manual-render-flow.svg', '<svg', 'manual render preview must be an SVG file');
await assertContains('diagrams/quality-gates.svg', '<svg', 'quality gates preview must be an SVG file');

const envExample = await readFile('.env.example', 'utf-8');
if (/TOGETHER_API_KEY=.+\S/.test(envExample)) {
  failures.push('.env.example must not contain a Together AI API key');
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`fail ${failure}`);
  process.exit(1);
}

console.log('ok repository hygiene');

async function assertContains(file, needle, message) {
  try {
    const text = await readFile(file, 'utf-8');
    if (!text.includes(needle)) failures.push(message);
  } catch {
    failures.push(`cannot read ${file}`);
  }
}
