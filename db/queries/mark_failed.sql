-- n8n should pass:
--   $1 = run UUID
--   $2 = error message

WITH updated_run AS (
  UPDATE video_runs
  SET status = 'failed',
      error = $2,
      updated_at = now()
  WHERE id = $1
  RETURNING question_ids
)
UPDATE question_bank
SET status = 'failed',
    last_error = $2,
    updated_at = now()
WHERE id = ANY((SELECT question_ids FROM updated_run)::bigint[])
RETURNING id, source_question_id, last_error;
