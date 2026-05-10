-- n8n should pass:
--   $1 = run UUID
--   $2 = source_app
--   $3 = question ids as bigint[]
--   $4 = metadata JSON

INSERT INTO video_runs (id, source_app, status, question_ids, metadata)
VALUES ($1, $2, 'planned', $3, $4::jsonb)
RETURNING *;
