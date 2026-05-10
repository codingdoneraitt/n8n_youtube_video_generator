-- Reserve a batch of unused questions for a single practice exam video.
-- n8n should pass:
--   $1 = source_app
--   $2 = limit, usually 40

WITH picked AS (
  SELECT id
  FROM question_bank
  WHERE source_app = $1
    AND status = 'unused'
  ORDER BY random()
  LIMIT $2
  FOR UPDATE SKIP LOCKED
)
UPDATE question_bank q
SET status = 'processing',
    reserved_at = now(),
    updated_at = now()
FROM picked
WHERE q.id = picked.id
RETURNING q.id, q.source_question_id, q.question;
