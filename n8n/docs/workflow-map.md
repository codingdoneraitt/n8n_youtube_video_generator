# Workflow Map

## Generate Practice Exam Walkthrough

The checked-in workflow is a safe dry-run starter. For the first POC, keep it file-based:

1. **Read Binary/File**
   - Read `/files/questions.json`.
2. **Code: Select 40**
   - Parse the array.
   - Slice the first 40.
   - Normalize `question`, `options`, `correctAnswers`, `explanation`.
3. **Optional Loop: Together AI TTS**
   - Skip while `dryRun=true`.
   - Add `audioAssets[]` when enabled.
4. **HTTP Request: Start Render**
   - `POST {{$env.RENDERER_BASE_URL}}/render`.
5. **Wait + Poll**
   - Poll `/jobs/:id` until `done` or `failed`.

The production version replaces file selection with Postgres state:

1. **Postgres: reserve questions**
   - Select 40 `unused` rows with `FOR UPDATE SKIP LOCKED`.
   - Mark them `processing`.
   - Create a `video_runs` row.
2. **Loop Over Items**
   - Build a narration string for each question.
   - Call Together AI `POST /v1/audio/speech`.
   - Convert returned binary to renderer `audioAssets[]`.
3. **HTTP Request: Start Render**
   - `POST {{$env.RENDERER_BASE_URL}}/render`.
4. **Wait + Poll**
   - Poll `/jobs/:id` until `done` or `failed`.
5. **Metadata**
   - Deterministic title/description/tags first.
   - Optional AI SEO metadata later.
6. **YouTube**
   - Upload only when `YOUTUBE_DRY_RUN=false`.
7. **Postgres update**
   - Mark questions published or failed.

## Error Handler

Use this as the workflow-level error workflow. Extend it with Slack/Discord and
Postgres failure updates once credentials are available.
