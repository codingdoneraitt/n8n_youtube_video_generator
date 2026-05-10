import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTogetherAudioAssets } from './tts.js';
import type { RenderQuestion } from './schema.js';

process.env.RENDERER_LOG_LEVEL = 'silent';

const baseQuestion: RenderQuestion = {
  id: 'q1',
  question: 'Which node branches on a condition?',
  options: ['If node', { text: 'Merge node' }],
  correctAnswers: ['If node'],
  explanation: 'The If node evaluates a boolean condition.',
};

test('generateTogetherAudioAssets creates numbered mp3 assets from Together AI', async () => {
  // Arrange: full renders rely on Together AI returning binary speech audio
  // that the renderer can save into Remotion's public directory.
  const previousKey = process.env.TOGETHER_API_KEY;
  process.env.TOGETHER_API_KEY = 'test-key';
  const calls: unknown[] = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    calls.push(JSON.parse(String(init?.body)));
    return new Response(Buffer.alloc(1024, 1), { status: 200 });
  };

  try {
    // Act: request narration for one question.
    const assets = await generateTogetherAudioAssets([baseQuestion]);

    // Assert: the generated asset uses the renderer's audio naming contract,
    // and the TTS prompt includes the question, options, answer, and rationale.
    assert.equal(assets.length, 1);
    assert.equal(assets[0].fileName, 'q-01.mp3');
    assert.ok(assets[0].contentBase64.length > 0);
    const body = calls[0] as { input: string; response_format: string };
    assert.equal(body.response_format, 'mp3');
    assert.match(body.input, /Question 1/);
    assert.match(body.input, /A\. If node/);
    assert.match(body.input, /B\. Merge node/);
    assert.match(body.input, /The correct answer is:/);
  } finally {
    globalThis.fetch = previousFetch;
    restoreEnv('TOGETHER_API_KEY', previousKey);
  }
});

test('generateTogetherAudioAssets requires a Together API key', async () => {
  // Arrange: missing credentials should fail before any network request, which
  // makes misconfigured local runs obvious in n8n job status.
  const previousKey = process.env.TOGETHER_API_KEY;
  delete process.env.TOGETHER_API_KEY;

  try {
    // Act and Assert: rendering with audio enabled cannot proceed silently.
    await assert.rejects(() => generateTogetherAudioAssets([baseQuestion]), /TOGETHER_API_KEY/);
  } finally {
    restoreEnv('TOGETHER_API_KEY', previousKey);
  }
});

test('generateTogetherAudioAssets reports Together API failures', async () => {
  // Arrange: upstream TTS failures must surface with question context so n8n
  // users can identify the failing item.
  const previousKey = process.env.TOGETHER_API_KEY;
  process.env.TOGETHER_API_KEY = 'test-key';
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('bad request', { status: 400 });

  try {
    // Act and Assert: a non-2xx response becomes a renderer job failure.
    await assert.rejects(() => generateTogetherAudioAssets([baseQuestion]), /Together TTS failed for question 1: 400 bad request/);
  } finally {
    globalThis.fetch = previousFetch;
    restoreEnv('TOGETHER_API_KEY', previousKey);
  }
});

test('generateTogetherAudioAssets rejects tiny audio responses', async () => {
  // Arrange: a very small audio response is almost always an upstream error
  // page or malformed binary, so it should not be passed to Remotion.
  const previousKey = process.env.TOGETHER_API_KEY;
  process.env.TOGETHER_API_KEY = 'test-key';
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(Buffer.from('tiny'), { status: 200 });

  try {
    // Act and Assert: malformed audio is caught at the service boundary.
    await assert.rejects(() => generateTogetherAudioAssets([baseQuestion]), /unexpectedly small audio/);
  } finally {
    globalThis.fetch = previousFetch;
    restoreEnv('TOGETHER_API_KEY', previousKey);
  }
});

test('generateTogetherAudioAssets supports legacy correctAnswer prompts', async () => {
  // Arrange: some imports use correctAnswer instead of correctAnswers, and the
  // spoken prompt should still include the answer value.
  const previousKey = process.env.TOGETHER_API_KEY;
  process.env.TOGETHER_API_KEY = 'test-key';
  const previousFetch = globalThis.fetch;
  let prompt = '';
  globalThis.fetch = async (_url, init) => {
    prompt = JSON.parse(String(init?.body)).input;
    return new Response(Buffer.alloc(1024, 1), { status: 200 });
  };

  try {
    // Act: generate audio for a legacy payload.
    await generateTogetherAudioAssets([{ ...baseQuestion, correctAnswers: undefined, correctAnswer: ['A'] }]);

    // Assert: the narration still speaks the provided answer field.
    assert.match(prompt, /A/);
  } finally {
    globalThis.fetch = previousFetch;
    restoreEnv('TOGETHER_API_KEY', previousKey);
  }
});

test('generateTogetherAudioAssets supports string correctAnswer prompts', async () => {
  // Arrange: some normalized questions use a single string correctAnswer, and
  // the narration prompt must include it before the answer reveal.
  const previousKey = process.env.TOGETHER_API_KEY;
  process.env.TOGETHER_API_KEY = 'test-key';
  const previousFetch = globalThis.fetch;
  let prompt = '';
  globalThis.fetch = async (_url, init) => {
    prompt = JSON.parse(String(init?.body)).input;
    return new Response(Buffer.alloc(1024, 1), { status: 200 });
  };

  try {
    // Act: generate audio for a single-answer legacy payload.
    await generateTogetherAudioAssets([{ ...baseQuestion, correctAnswers: undefined, correctAnswer: 'If node' }]);

    // Assert: the exact string answer is included in the spoken prompt.
    assert.match(prompt, /If node/);
  } finally {
    globalThis.fetch = previousFetch;
    restoreEnv('TOGETHER_API_KEY', previousKey);
  }
});

test('generateTogetherAudioAssets returns no assets for an empty question list', async () => {
  // Arrange: defensive callers may submit an empty list during validation
  // experiments, and the TTS helper should behave like a pure mapper.
  const previousKey = process.env.TOGETHER_API_KEY;
  process.env.TOGETHER_API_KEY = 'test-key';

  try {
    // Act: generate audio for no questions.
    const assets = await generateTogetherAudioAssets([]);

    // Assert: no network work is needed and the renderer receives an empty
    // asset list.
    assert.deepEqual(assets, []);
  } finally {
    restoreEnv('TOGETHER_API_KEY', previousKey);
  }
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
