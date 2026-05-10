# YouTube Upload Placeholder

YouTube upload is part of the main workflow as a guarded placeholder.

The renderer writes:

```text
data/artifacts/<job-id>/practice-exam-walkthrough.mp4
data/artifacts/<job-id>/youtube-metadata.json
```

The main workflow pauses at **Human Approval Gate** after the MP4 is rendered.
After approval, the placeholder exits unless:

```text
YOUTUBE_UPLOAD_ENABLED=true
```

When ready, replace the placeholder Code node with the n8n YouTube node:

1. Download `artifactUrl` as binary.
2. Download `metadataUrl` as JSON.
3. Upload MP4 with title, description, and tags.
4. Keep the `Human Approval Gate` and `YOUTUBE_UPLOAD_ENABLED` guard so accidental uploads are impossible.
