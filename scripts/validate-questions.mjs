import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const inputPath = process.argv[2] || 'questions.json';
const exactArg = process.argv.find((arg) => arg.startsWith('--exact='));
const minArg = process.argv.find((arg) => arg.startsWith('--min='));
const maxArg = process.argv.find((arg) => arg.startsWith('--max='));

const exact = exactArg ? Number(exactArg.split('=')[1]) : undefined;
const min = minArg ? Number(minArg.split('=')[1]) : 1;
const max = maxArg ? Number(maxArg.split('=')[1]) : 80;

const raw = JSON.parse(await readFile(inputPath, 'utf-8'));
const questions = Array.isArray(raw) ? raw : raw.questions;

if (!Array.isArray(questions)) fail('Expected a JSON array or an object with questions[].');
if (exact !== undefined && questions.length !== exact) fail(`Expected exactly ${exact} questions, found ${questions.length}.`);
if (questions.length < min) fail(`Expected at least ${min} questions, found ${questions.length}.`);
if (questions.length > max) fail(`Expected no more than ${max} questions, found ${questions.length}.`);

const ids = new Set();
const hashes = new Map();

questions.forEach((question, index) => {
  const label = `question[${index}]`;
  assertString(question.id, `${label}.id`);
  assertString(question.question, `${label}.question`);
  if (ids.has(question.id)) fail(`Duplicate question id: ${question.id}`);
  ids.add(question.id);

  if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 8) {
    fail(`${label}.options must contain 2-8 options.`);
  }

  const optionTexts = question.options.map((option, optionIndex) => {
    const text = typeof option === 'string' ? option : option?.text;
    assertString(text, `${label}.options[${optionIndex}]`);
    return text;
  });

  const answers = Array.isArray(question.correctAnswers)
    ? question.correctAnswers
    : Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : question.correctAnswer
        ? [question.correctAnswer]
        : [];

  if (answers.length === 0) fail(`${label} needs at least one correct answer.`);
  for (const answer of answers) {
    assertString(answer, `${label}.correctAnswers[]`);
    if (!matchesOption(answer, optionTexts)) {
      fail(`${label} correct answer "${answer}" does not match an option or option letter.`);
    }
  }

  assertString(question.explanation, `${label}.explanation`);
  assertString(question.topic, `${label}.topic`);
  assertString(question.difficulty, `${label}.difficulty`);

  const hash = createHash('sha256')
    .update(`${question.question.trim().toLowerCase()}\n${optionTexts.join('\n').toLowerCase()}`)
    .digest('hex');
  const existing = hashes.get(hash);
  if (existing) fail(`Duplicate question content: ${existing} and ${question.id}`);
  hashes.set(hash, question.id);
});

console.log(`ok ${inputPath}: ${questions.length} questions validated`);

function matchesOption(answer, optionTexts) {
  const normalized = normalize(answer);
  if (optionTexts.some((option) => normalize(option) === normalized)) return true;

  const letter = normalized.match(/^[a-h]$/)?.[0];
  if (!letter) return false;
  return letter.charCodeAt(0) - 97 < optionTexts.length;
}

function assertString(value, name) {
  if (typeof value !== 'string' || value.trim().length === 0) fail(`${name} must be a non-empty string.`);
}

function normalize(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function fail(message) {
  console.error(`fail ${message}`);
  process.exit(1);
}
