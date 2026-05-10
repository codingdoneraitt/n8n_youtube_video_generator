import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateWorkflow } from './validate-workflows.mjs';

test('validateWorkflow rejects blocked env expressions before n8n import', () => {
  // Arrange: build a minimal workflow with the exact `$env` pattern blocked by the Compose security posture.
  // This is useful because n8n would otherwise fail only after a user manually imports and runs the workflow.
  const workflow = workflowWithNodes([
    {
      id: 'start-render',
      name: 'Start Render',
      type: 'n8n-nodes-base.httpRequest',
      parameters: { url: "={{$env.RENDERER_BASE_URL || 'http://remotion-renderer:3030'}}/render" }
    }
  ]);

  // Act: validate the exported workflow contract the same way CI validates checked-in workflow JSON.
  const act = () => validateWorkflow(workflow);

  // Assert: env reads are rejected locally so the secure n8n runtime setting can stay enabled.
  assert.throws(act, /must not read \$env/);
});

test('validateWorkflow rejects legacy IF node schemas that break n8n 2 comparisons', () => {
  // Arrange: reproduce the older IF node condition format that triggered compareOperationFunctions errors.
  // This is useful because the JSON is syntactically valid but incompatible with the n8n 2.x typed condition engine.
  const workflow = workflowWithNodes([
    {
      id: 'render-done',
      name: 'Render Done?',
      type: 'n8n-nodes-base.if',
      typeVersion: 1,
      parameters: {
        conditions: {
          string: [{ value1: '={{$json.status}}', operation: 'equals', value2: 'done' }]
        }
      }
    }
  ]);

  // Act: validate the workflow compatibility contract.
  const act = () => validateWorkflow(workflow);

  // Assert: the validator fails fast with a useful reason instead of letting n8n fail at runtime.
  assert.throws(act, /typeVersion 2\+ typed conditions/);
});

test('validateWorkflow accepts the n8n 2 typed IF node condition shape', () => {
  // Arrange: build the supported IF node schema used by the practice exam render polling loop.
  // This is useful because it guards the exact branch that decides whether to loop or finish the render.
  const workflow = workflowWithNodes([
    {
      id: 'render-done',
      name: 'Render Done?',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
          conditions: [
            {
              id: 'render-status-is-done',
              leftValue: '={{$json.status}}',
              rightValue: 'done',
              operator: { type: 'string', operation: 'equals' }
            }
          ],
          combinator: 'and'
        },
        options: {}
      }
    }
  ]);

  // Act: validate the workflow.
  validateWorkflow(workflow);

  // Assert: a compatible IF node passes without throwing.
  assert.ok(true);
});

function workflowWithNodes(nodes) {
  return {
    name: 'Workflow Contract Test',
    nodes,
    connections: {}
  };
}
