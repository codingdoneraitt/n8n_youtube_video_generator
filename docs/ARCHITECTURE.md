# Architecture

## Boundary

n8n is the orchestrator. It reads input, handles retries, polls render state, pauses for human approval, and later can publish to YouTube.

The Remotion renderer is the media boundary. It accepts a validated render request, writes optional audio assets into a per-job public directory, renders MP4, and writes metadata beside the artifact.

## Golden Path

1. `questions.json` contains the 40-question exam.
2. n8n reads the file and builds one render payload.
3. n8n calls `POST /render` on the renderer.
4. The renderer generates Together AI narration, renders MP4, and returns status through a job id.
5. n8n waits and polls `GET /jobs/:id`.
6. On `done`, the MP4 is available at `data/artifacts/<job-id>/practice-exam-walkthrough.mp4`.
7. n8n pauses at the human approval gate.
8. The guarded YouTube placeholder only proceeds when `YOUTUBE_UPLOAD_ENABLED=true`.

## Why This Shape

- n8n stays low-code and operationally visible.
- Rendering stays in typed TypeScript where Remotion can be tested and versioned.
- The render request is the contract between the workflow and code.
- The YouTube step is in the same workflow, behind a human approval gate and environment flag.
