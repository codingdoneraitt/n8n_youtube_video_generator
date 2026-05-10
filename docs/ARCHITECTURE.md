# Architecture

## Boundary

n8n is the orchestrator. It reads input, calls external APIs, handles retries, polls render state, and later can publish to YouTube.

The Remotion renderer is the media boundary. It accepts a validated render request, writes optional audio assets into a per-job public directory, renders MP4, and writes metadata beside the artifact.

## Golden Path

1. `questions.json` contains the 40-question exam.
2. n8n reads the file and builds one render payload.
3. n8n calls `POST /render` on the renderer.
4. The renderer returns `202` with a job id.
5. n8n waits and polls `GET /jobs/:id`.
6. On `done`, the MP4 is available at `data/artifacts/<job-id>/practice-exam-walkthrough.mp4`.
7. YouTube metadata is available as `youtube-metadata.json`.

## Why This Shape

- n8n stays low-code and operationally visible.
- Rendering stays in typed TypeScript where Remotion can be tested and versioned.
- The render request is the contract between the workflow and code.
- The YouTube step can be enabled later without changing the render pipeline.
