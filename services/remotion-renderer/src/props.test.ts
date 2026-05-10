import test from 'node:test';
import assert from 'node:assert/strict';
import { RenderRequestSchema } from './schema.js';
import { buildPracticeExamProps } from './props.js';

test('buildPracticeExamProps normalizes question options and answers', () => {
  // Arrange: renderer input can arrive from n8n as object-shaped options and
  // base64 audio assets, so this protects the workflow-to-renderer contract.
  const request = RenderRequestSchema.parse({
    dryRun: true,
    questions: [
      {
        id: 'q1',
        question: 'What is the answer?',
        options: [{ text: 'A' }, { text: 'B' }],
        correctAnswer: 'B',
        explanation: 'Because B is correct.',
      },
    ],
    audioAssets: [{ fileName: 'q-01.wav', contentBase64: Buffer.from('fake').toString('base64') }],
  });

  // Act: build the Remotion-safe props object used by the composition.
  const props = buildPracticeExamProps(request);

  // Assert: the composition receives plain option strings, matched audio, and
  // a non-zero duration so render jobs cannot silently produce empty videos.
  assert.equal(props.questions.length, 1);
  assert.equal(props.questions[0].audioFileName, 'q-01.wav');
  assert.deepEqual(props.questions[0].options, ['A', 'B']);
  assert.deepEqual(props.questions[0].correctAnswers, ['B']);
  assert.ok(props.durationInFrames > 0);
});

test('buildPracticeExamProps maps letter answers to option text', () => {
  // Arrange: practice-exam exports often store correct answers as letters,
  // while the video should display the human-readable option text.
  const request = RenderRequestSchema.parse({
    dryRun: true,
    questions: [
      {
        id: 'q1',
        question: 'Pick one.',
        options: ['First', 'Second', 'Third', 'Fourth'],
        correctAnswers: ['C'],
        explanation: 'Third is correct.',
      },
    ],
  });

  // Act: normalize the render payload into composition props.
  const props = buildPracticeExamProps(request);

  // Assert: answer letters are resolved before rendering, which keeps answer
  // reveals and highlighted options aligned for every question format.
  assert.deepEqual(props.questions[0].correctAnswers, ['Third']);
});

test('buildPracticeExamProps preserves multiple explicit answers', () => {
  // Arrange: some exam formats include multiple correct answers as full option
  // text, which should pass through without being mistaken for letter labels.
  const request = RenderRequestSchema.parse({
    dryRun: true,
    questions: [
      {
        id: 'q1',
        question: 'Select two.',
        options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
        correctAnswers: ['Alpha', 'Gamma'],
        explanation: 'Both Alpha and Gamma apply.',
      },
    ],
  });

  // Act: convert the API contract into Remotion props.
  const props = buildPracticeExamProps(request);

  // Assert: multi-answer reveals remain readable and exact.
  assert.deepEqual(props.questions[0].correctAnswers, ['Alpha', 'Gamma']);
});

test('buildPracticeExamProps accepts legacy correctAnswer arrays', () => {
  // Arrange: older Study Buddy exports may use correctAnswer instead of
  // correctAnswers, so this protects backward-compatible imports.
  const request = RenderRequestSchema.parse({
    dryRun: true,
    questions: [
      {
        id: 'q1',
        question: 'Pick the valid pair.',
        options: ['One', 'Two', 'Three', 'Four'],
        correctAnswer: ['A', 'D'],
        explanation: 'One and Four are the valid pair.',
      },
    ],
  });

  // Act: normalize the legacy payload.
  const props = buildPracticeExamProps(request);

  // Assert: array-style legacy answers are converted from letters to text.
  assert.deepEqual(props.questions[0].correctAnswers, ['One', 'Four']);
});

test('buildPracticeExamProps matches unpadded mp3 audio assets', () => {
  // Arrange: n8n-generated files may be named q-1.mp3 instead of q-01.mp3,
  // and the renderer should accept both naming styles.
  const request = RenderRequestSchema.parse({
    dryRun: true,
    questions: [
      {
        id: 'q1',
        question: 'Which node branches on a condition?',
        options: ['If node', 'Merge node'],
        correctAnswer: 'If node',
        explanation: 'If nodes route true and false branches.',
      },
    ],
    audioAssets: [{ fileName: 'q-1.mp3', contentBase64: Buffer.from('fake').toString('base64') }],
  });

  // Act: locate the matching audio file while building props.
  const props = buildPracticeExamProps(request);

  // Assert: audio is attached to the correct question without requiring one
  // exact file naming convention.
  assert.equal(props.questions[0].audioFileName, 'q-1.mp3');
});

test('buildPracticeExamProps supports all audio naming variants and no-audio fallback', () => {
  // Arrange: audio files can come from local scripts or n8n HTTP nodes, so the
  // renderer accepts padded/unpadded wav/mp3 names and leaves missing audio unset.
  const request = RenderRequestSchema.parse({
    dryRun: true,
    questions: [
      {
        id: 'q1',
        question: 'First?',
        options: ['Yes', 'No'],
        correctAnswer: 'Yes',
      },
      {
        id: 'q2',
        question: 'Second?',
        options: ['Yes', 'No'],
        correctAnswer: 'No',
      },
      {
        id: 'q3',
        question: 'Third?',
        options: ['Yes', 'No'],
        correctAnswer: 'Yes',
      },
    ],
    audioAssets: [
      { fileName: 'q-01.mp3', contentBase64: Buffer.from('fake').toString('base64') },
      { fileName: 'q-2.wav', contentBase64: Buffer.from('fake').toString('base64') },
    ],
  });

  // Act: resolve optional audio assets for each question.
  const props = buildPracticeExamProps(request);

  // Assert: supported file names are attached, and missing audio remains safe
  // for dry-run or text-only renders.
  assert.equal(props.questions[0].audioFileName, 'q-01.mp3');
  assert.equal(props.questions[1].audioFileName, 'q-2.wav');
  assert.equal(props.questions[2].audioFileName, undefined);
});

test('buildPracticeExamProps falls back from empty correctAnswers to correctAnswer', () => {
  // Arrange: malformed upstream data may include an empty correctAnswers array
  // plus a legacy correctAnswer field; the renderer should still recover.
  const request = {
    dryRun: true,
    title: 'Practice Exam Walkthrough',
    examTitle: 'Practice Exam',
    sourceApp: 'unit-test',
    audioAssets: [],
    fps: 30,
    width: 1920,
    height: 1080,
    questions: [
      {
        id: 'q1',
        question: 'Which option is correct?',
        options: ['Alpha', 'Beta'],
        correctAnswers: [],
        correctAnswer: 'B',
        explanation: 'Beta is correct.',
      },
    ],
  };

  // Act: normalize the mixed-format answer fields.
  const props = buildPracticeExamProps(request);

  // Assert: the non-empty legacy answer is used instead of rendering an empty
  // answer reveal.
  assert.deepEqual(props.questions[0].correctAnswers, ['Beta']);
});

test('buildPracticeExamProps tolerates missing answer fields for schema-compatible drafts', () => {
  // Arrange: the schema allows draft payloads without answers so validation
  // errors can be handled before publishing, but rendering should not crash.
  const request = RenderRequestSchema.parse({
    dryRun: true,
    questions: [
      {
        id: 'q1',
        question: 'Draft question?',
        options: ['Alpha', 'Beta'],
      },
    ],
  });

  // Act: build props from a draft payload.
  const props = buildPracticeExamProps(request);

  // Assert: drafts render with no answer reveal content rather than throwing
  // inside the renderer process.
  assert.deepEqual(props.questions[0].correctAnswers, []);
});

test('buildPracticeExamProps keeps out-of-range answer letters visible', () => {
  // Arrange: bad source data can reference an answer letter that has no matching
  // option, and preserving it makes the defect visible in review artifacts.
  const request = RenderRequestSchema.parse({
    dryRun: true,
    questions: [
      {
        id: 'q1',
        question: 'Pick one.',
        options: ['Alpha', 'Beta'],
        correctAnswer: 'H',
      },
    ],
  });

  // Act: normalize a payload with an out-of-range answer letter.
  const props = buildPracticeExamProps(request);

  // Assert: the renderer does not crash or invent an answer when the letter is
  // outside the option list.
  assert.deepEqual(props.questions[0].correctAnswers, ['H']);
});

test('buildPracticeExamProps includes checkpoint duration for long exams', () => {
  // Arrange: the production POC renders 40 questions, so this verifies the
  // long-form timing branch that inserts the midpoint checkpoint.
  const questions = Array.from({ length: 21 }, (_, index) => ({
    id: `q${index + 1}`,
    question: `Question ${index + 1}?`,
    options: ['Alpha', 'Beta'],
    correctAnswer: 'Alpha',
  }));
  const request = RenderRequestSchema.parse({
    dryRun: false,
    fps: 30,
    questions,
  });

  // Act: calculate the final Remotion duration.
  const props = buildPracticeExamProps(request);

  // Assert: non-dry-run timing uses 32 seconds per question and includes the
  // six-second midpoint checkpoint for exams longer than 20 questions.
  const expectedSeconds = 8 + 10 + 6 + 21 * 32;
  assert.equal(props.durationInFrames, expectedSeconds * 30);
});

test('RenderRequestSchema applies defaults and rejects unsafe run ids', () => {
  // Arrange: n8n should be able to submit a minimal valid payload, while
  // path-like run ids must be rejected before artifact paths are created.
  const minimalPayload = {
    questions: [
      {
        id: 'q1',
        question: 'What is n8n?',
        options: ['Automation platform', 'Database'],
        correctAnswer: 'Automation platform',
      },
    ],
  };

  // Act: parse a minimal valid payload and an unsafe payload.
  const parsed = RenderRequestSchema.parse(minimalPayload);
  const unsafe = RenderRequestSchema.safeParse({ ...minimalPayload, runId: '../escape' });

  // Assert: defaults keep the API ergonomic, and unsafe ids are blocked.
  assert.equal(parsed.title, 'Practice Exam Walkthrough');
  assert.equal(parsed.examTitle, 'Practice Exam');
  assert.equal(parsed.sourceApp, 'sample');
  assert.equal(parsed.dryRun, false);
  assert.equal(unsafe.success, false);
});
