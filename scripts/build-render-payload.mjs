import { readFile } from 'node:fs/promises';

const inputPath = process.argv[2] || 'questions.json';
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 40;
const dryRun = !process.argv.includes('--with-audio');

const raw = JSON.parse(await readFile(inputPath, 'utf-8'));
const list = Array.isArray(raw) ? raw : raw.questions;
if (!Array.isArray(list)) throw new Error('Expected a JSON array or an object with questions[]');
if (list.length === 0) throw new Error('No questions found');

const selected = list.slice(0, Math.min(limit, list.length)).map((question, index) => ({
  id: String(question.id || question.questionId || `q-${index + 1}`),
  question: String(question.question || question.text || question.prompt),
  options: normalizeOptions(question.options || question.answers || question.choices),
  correctAnswers: normalizeAnswers(question.correctAnswers || question.correct_answers || question.correctAnswer || question.answer),
  explanation: String(question.explanation || question.rationale || ''),
  ...(question.topic ? { topic: String(question.topic) } : {}),
  ...(question.difficulty ? { difficulty: String(question.difficulty) } : {}),
}));

const payload = {
  runId: `local-${Date.now()}`,
  title: 'Practice Exam Walkthrough',
  examTitle: 'Practice Exam',
  sourceApp: 'questions-json',
  dryRun,
  questions: selected,
  audioAssets: [],
};

console.log(JSON.stringify(payload, null, 2));

function normalizeOptions(options) {
  if (!Array.isArray(options) || options.length < 2) {
    throw new Error('Each question needs at least two options');
  }
  return options.map((option) => (typeof option === 'string' ? option : option.text || option.label || String(option)));
}

function normalizeAnswers(answers) {
  const list = Array.isArray(answers) ? answers : [answers].filter(Boolean);
  if (list.length === 0) throw new Error('Each question needs at least one correct answer');
  return list.map(String);
}
