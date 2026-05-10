# Runbook

## Start

```bash
npm start
```

## Health Checks

```bash
curl http://localhost:3030/healthz
```

n8n should be available at <http://localhost:5678>.

## Artifact Location

Rendered files are stored in:

```text
data/artifacts/<job-id>/
```

Expected files:

- `input-props.json`
- `practice-exam-walkthrough.mp4`
- `youtube-metadata.json`

## Common Issues

If n8n cannot call the renderer, confirm Docker Compose started `remotion-renderer` and that the workflow calls `http://remotion-renderer:3030`.

If the renderer fails quickly, inspect `GET /jobs/<job-id>` and the container logs.

If `npm run validate:questions` fails, fix `questions.json` before rendering. The workflow expects exactly 40 complete questions for this POC.
