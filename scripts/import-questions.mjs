import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

function normalizeQuestion(raw, index) {
  const questionText = raw.question || raw.text || raw.prompt;
  const options = raw.options || raw.answers || raw.choices;
  const correctAnswers = raw.correctAnswers || raw.correct_answers || raw.correctAnswer || raw.answer;

  if (!questionText || !Array.isArray(options) || options.length < 2) {
    throw new Error(`Question ${index + 1} is missing question/options fields`);
  }

  const normalizedCorrect = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers].filter(Boolean);
  if (normalizedCorrect.length === 0) {
    throw new Error(`Question ${index + 1} is missing correct answer data`);
  }

  return {
    id: String(raw.id || raw.questionId || raw.uuid || `q-${index + 1}`),
    question: String(questionText),
    options: options.map((option) => (typeof option === 'string' ? option : option.text || option.label || String(option))),
    correctAnswers: normalizedCorrect.map(String),
    explanation: String(raw.explanation || raw.rationale || ''),
    topic: raw.topic ? String(raw.topic) : undefined,
    difficulty: raw.difficulty ? String(raw.difficulty) : undefined,
  };
}

function hashQuestion(question) {
  return createHash('sha256')
    .update(JSON.stringify({ question: question.question, options: question.options, correctAnswers: question.correctAnswers }))
    .digest('hex');
}

const inputPath = process.argv[2];
const sourceApp = process.argv[3] || (inputPath ? basename(inputPath).replace(/\.json$/, '') : 'unknown');
const outputMode = process.argv.includes('--sql') ? 'sql' : 'json';

if (!inputPath) {
  console.error('Usage: node scripts/import-questions.mjs /path/to/questions.json source_app');
  process.exit(1);
}

const raw = JSON.parse(await readFile(inputPath, 'utf-8'));
const list = Array.isArray(raw) ? raw : raw.questions;
if (!Array.isArray(list)) throw new Error('Expected a JSON array or an object with questions[]');

const questions = list.map(normalizeQuestion);
const rows = questions.map((question) => ({
  source_app: sourceApp,
  source_question_id: question.id,
  content_hash: hashQuestion(question),
  question,
}));

if (outputMode === 'sql') {
  console.log('BEGIN;');
  for (const row of rows) {
    console.log(
      [
        'INSERT INTO question_bank (source_app, source_question_id, content_hash, question)',
        `VALUES (${sql(row.source_app)}, ${sql(row.source_question_id)}, ${sql(row.content_hash)}, ${sqlJson(row.question)}::jsonb)`,
        'ON CONFLICT (content_hash) DO UPDATE SET',
        '  source_app = EXCLUDED.source_app,',
        '  source_question_id = EXCLUDED.source_question_id,',
        '  question = EXCLUDED.question,',
        '  updated_at = now();',
      ].join('\n'),
    );
  }
  console.log('COMMIT;');
} else {
  console.log(JSON.stringify(rows, null, 2));
}

function sql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  return sql(JSON.stringify(value));
}
