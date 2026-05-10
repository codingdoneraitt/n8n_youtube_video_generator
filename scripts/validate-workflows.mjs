import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const workflowsDir = new URL('../n8n/workflows/', import.meta.url);

let files = [];
try {
  files = (await readdir(workflowsDir)).filter((file) => file.endsWith('.json'));
} catch {
  console.warn('No n8n/workflows directory found yet.');
  process.exit(0);
}

let failures = 0;
for (const file of files) {
  const fullPath = join(workflowsDir.pathname, file);
  try {
    const parsed = JSON.parse(await readFile(fullPath, 'utf-8'));
    if (!parsed.name || !Array.isArray(parsed.nodes) || typeof (parsed.connections ?? {}) !== 'object') {
      throw new Error('Workflow must include name, nodes[], and connections object.');
    }
    const ids = new Set();
    for (const node of parsed.nodes) {
      if (!node.id || !node.name || !node.type) {
        throw new Error(`Invalid node in ${file}: every node needs id, name, and type.`);
      }
      if (ids.has(node.id)) throw new Error(`Duplicate node id ${node.id}`);
      ids.add(node.id);
    }
    console.log(`ok ${file}`);
  } catch (error) {
    failures++;
    console.error(`fail ${file}: ${error.message}`);
  }
}

process.exit(failures === 0 ? 0 : 1);
