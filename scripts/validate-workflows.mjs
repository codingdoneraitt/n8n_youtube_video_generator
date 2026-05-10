import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const workflowsDir = new URL('../n8n/workflows/', import.meta.url);

if (import.meta.url === `file://${process.argv[1]}`) {
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
      validateWorkflow(JSON.parse(await readFile(fullPath, 'utf-8')), file);
      console.log(`ok ${file}`);
    } catch (error) {
      failures++;
      console.error(`fail ${file}: ${error.message}`);
    }
  }

  process.exit(failures === 0 ? 0 : 1);
}

export function validateWorkflow(parsed, file = 'workflow.json') {
  if (!parsed.name || !Array.isArray(parsed.nodes) || typeof (parsed.connections ?? {}) !== 'object') {
    throw new Error('Workflow must include name, nodes[], and connections object.');
  }

  if (JSON.stringify(parsed).includes('$env')) {
    throw new Error(`${file}: workflow expressions must not read $env because n8n Code/env access is blocked.`);
  }

  const names = new Set(parsed.nodes.map((node) => node.name));
  const ids = new Set();
  for (const node of parsed.nodes) {
    validateNodeIdentity(node, ids, file);
    validateIfNode(node, file);
  }

  validateConnections(parsed.connections, names, file);
}

function validateNodeIdentity(node, ids, file) {
  if (!node.id || !node.name || !node.type) {
    throw new Error(`Invalid node in ${file}: every node needs id, name, and type.`);
  }
  if (ids.has(node.id)) throw new Error(`Duplicate node id ${node.id}`);
  ids.add(node.id);
}

function validateIfNode(node, file) {
  if (node.type !== 'n8n-nodes-base.if') return;

  if (Number(node.typeVersion || 0) < 2) {
    throw new Error(`${file}: IF node "${node.name}" must use typeVersion 2+ typed conditions.`);
  }

  const conditions = node.parameters?.conditions;
  const firstCondition = conditions?.conditions?.[0];
  const operation = firstCondition?.operator?.operation;
  if (!Array.isArray(conditions?.conditions) || !operation) {
    throw new Error(`${file}: IF node "${node.name}" must use typed operator conditions.`);
  }
}

function validateConnections(connections, names, file) {
  for (const [sourceName, outputs] of Object.entries(connections)) {
    if (!names.has(sourceName)) {
      throw new Error(`${file}: connection source "${sourceName}" does not match a node name.`);
    }
    for (const output of outputs.main ?? []) {
      for (const target of output ?? []) {
        if (!names.has(target.node)) {
          throw new Error(`${file}: connection target "${target.node}" does not match a node name.`);
        }
      }
    }
  }
}
