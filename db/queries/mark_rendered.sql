-- n8n should pass:
--   $1 = run UUID
--   $2 = renderer job id
--   $3 = artifact URL

UPDATE video_runs
SET status = 'rendered',
    renderer_job_id = $2,
    artifact_url = $3,
    updated_at = now()
WHERE id = $1
RETURNING *;
