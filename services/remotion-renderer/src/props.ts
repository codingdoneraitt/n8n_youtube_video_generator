import type { RenderQuestion, RenderRequest } from './schema.js';

export interface WalkthroughQuestion {
  id: string;
  number: number;
  question: string;
  options: string[];
  correctAnswers: string[];
  explanation: string;
  topic?: string;
  difficulty?: string;
  audioFileName?: string;
  durationSeconds: number;
}

export interface PracticeExamProps {
  title: string;
  examTitle: string;
  sourceApp: string;
  questions: WalkthroughQuestion[];
  durationInFrames: number;
  fps: number;
}

function optionText(option: RenderQuestion['options'][number]): string {
  return typeof option === 'string' ? option : option.text;
}

function normalizeCorrectAnswers(question: RenderQuestion): string[] {
  const rawAnswers = question.correctAnswers?.length
    ? question.correctAnswers
    : Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : typeof question.correctAnswer === 'string'
        ? [question.correctAnswer]
        : [];

  const options = question.options.map(optionText);
  return rawAnswers.map((answer) => {
    const trimmed = answer.trim();
    const letterMatch = trimmed.match(/^[A-H]$/i);
    if (!letterMatch) return trimmed;

    const index = trimmed.toUpperCase().charCodeAt(0) - 65;
    return options[index] || trimmed;
  });
}

function hasAudio(audioFileNames: Set<string>, questionNumber: number): string | undefined {
  const candidates = [
    `q-${String(questionNumber).padStart(2, '0')}.wav`,
    `q-${String(questionNumber).padStart(2, '0')}.mp3`,
    `q-${questionNumber}.wav`,
    `q-${questionNumber}.mp3`,
  ];
  return candidates.find((name) => audioFileNames.has(name));
}

export function buildPracticeExamProps(request: RenderRequest): PracticeExamProps {
  const audioFileNames = new Set(request.audioAssets.map((asset) => asset.fileName));
  const secondsPerQuestion = request.dryRun ? 12 : 32;
  const introSeconds = 8;
  const outroSeconds = 10;
  const checkpointSeconds = request.questions.length > 20 ? 6 : 0;

  const questions: WalkthroughQuestion[] = request.questions.map((question, index) => {
    const number = index + 1;
    return {
      id: question.id,
      number,
      question: question.question,
      options: question.options.map(optionText),
      correctAnswers: normalizeCorrectAnswers(question),
      explanation: question.explanation || '',
      topic: question.topic,
      difficulty: question.difficulty,
      audioFileName: hasAudio(audioFileNames, number),
      durationSeconds: secondsPerQuestion,
    };
  });

  const totalSeconds =
    introSeconds +
    outroSeconds +
    checkpointSeconds +
    questions.reduce((sum, question) => sum + question.durationSeconds, 0);

  return {
    title: request.title,
    examTitle: request.examTitle,
    sourceApp: request.sourceApp,
    questions,
    fps: request.fps,
    durationInFrames: Math.ceil(totalSeconds * request.fps),
  };
}
