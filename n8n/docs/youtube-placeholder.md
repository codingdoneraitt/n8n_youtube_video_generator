# YouTube Upload Placeholder

YouTube upload is intentionally not part of the active POC path yet.

The renderer writes:

```text
data/artifacts/<job-id>/practice-exam-walkthrough.mp4
data/artifacts/<job-id>/youtube-metadata.json
```

The placeholder workflow is:

```text
03_upload_to_youtube_placeholder.json
```

It is manual-trigger only. It exits unless:

```text
YOUTUBE_UPLOAD_ENABLED=true
```

When ready, replace the `No Operation` node with the n8n YouTube node:

1. Download `artifactUrl` as binary.
2. Download `metadataUrl` as JSON.
3. Upload MP4 with title, description, and tags.
4. Keep the `Upload Guard` node so accidental uploads are impossible.
