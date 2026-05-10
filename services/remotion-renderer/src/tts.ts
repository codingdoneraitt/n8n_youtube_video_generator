import type { RenderQuestion } from './schema.js';

export interface GeneratedAudioAsset {
  fileName: string;
  contentBase64: string;
}

export async function generateTogetherAudioAssets(questions: RenderQuestion[]): Promise<GeneratedAudioAsset[]> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    throw new Error('TOGETHER_API_KEY is required when dryRun is false and no audioAssets are provided');
  }

  const model = process.env.TOGETHER_TTS_MODEL || 'hexgrad/Kokoro-82M';
  const voice = process.env.TOGETHER_TTS_VOICE || 'af_bella';
  const speed = Number(process.env.TOGETHER_TTS_SPEED || 0.95);
  const assets: GeneratedAudioAsset[] = [];

  for (const [index, question] of questions.entries()) {
    const response = await fetch('https://api.together.ai/v1/audio/speech', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
        speed,
        response_format: 'mp3',
        input: buildNarration(question, index + 1),
      }),
    });

    if (!response.ok) {
      throw new Error(`Together TTS failed for question ${index + 1}: ${response.status} ${await response.text()}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 512) {
      throw new Error(`Together TTS returned an unexpectedly small audio file for question ${index + 1}`);
    }

    assets.push({
      fileName: `q-${String(index + 1).padStart(2, '0')}.mp3`,
      contentBase64: buffer.toString('base64'),
    });
  }

  return assets;
}

function buildNarration(question: RenderQuestion, number: number): string {
  const options = question.options.map((option, index) => {
    const text = typeof option === 'string' ? option : option.text;
    return `${String.fromCharCode(65 + index)}. ${text}`;
  });
  const answers = question.correctAnswers?.length
    ? question.correctAnswers
    : Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : question.correctAnswer
        ? [question.correctAnswer]
        : [];

  return [
    `Question ${number}.`,
    question.question,
    'Options.',
    ...options,
    'The correct answer is:',
    answers.join(', '),
    question.explanation ? `Explanation. ${question.explanation}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}
