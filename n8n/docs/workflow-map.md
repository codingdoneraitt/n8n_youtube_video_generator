# Workflow Map

## Generate Practice Exam Walkthrough

The checked-in workflow is the full local POC path:

1. **Read Binary/File**
   - Read `/files/questions.json`.
2. **Code: Select 40**
   - Parse the array.
   - Slice the first 40.
   - Normalize `question`, `options`, `correctAnswers`, `explanation`.
3. **Together AI TTS**
   - The renderer generates narration when `dryRun=false`.
   - `TOGETHER_API_KEY` must be set in `.env`.
4. **HTTP Request: Start Render**
   - `POST {{$env.RENDERER_BASE_URL}}/render`.
5. **Wait + Poll**
   - Poll `/jobs/:id` until `done` or `failed`.
6. **Human Approval Gate**
   - Pause before any upload action.
7. **YouTube Upload Placeholder**
   - Reports skipped unless `YOUTUBE_UPLOAD_ENABLED=true`.

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
