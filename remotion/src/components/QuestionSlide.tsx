import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import type { WalkthroughQuestion } from '../Walkthrough';
import { theme } from '../theme';

interface Props {
  question: WalkthroughQuestion;
  totalQuestions: number;
  fps: number;
}

export const QuestionSlide: React.FC<Props> = ({ question, totalQuestions, fps }) => {
  const frame = useCurrentFrame();
  const revealAnswerAt = Math.round(question.durationSeconds * fps * 0.52);
  const showAnswer = frame >= revealAnswerAt;
  const progress = question.number / totalQuestions;

  return (
    <AbsoluteFill style={{ padding: 72 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ color: theme.accentBlue, fontSize: 28, fontWeight: 900 }}>
          Question {question.number} / {totalQuestions}
        </div>
        <div style={{ color: theme.textMuted, fontSize: 24, fontWeight: 700 }}>
          {[question.topic, question.difficulty].filter(Boolean).join(' • ')}
        </div>
      </div>

      <div style={{ height: 10, background: '#253044', borderRadius: 999, overflow: 'hidden', marginBottom: 42 }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: theme.accent, borderRadius: 999 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 42, height: 790 }}>
        <section
          style={{
            background: 'rgba(21, 29, 47, 0.9)',
            border: `2px solid ${theme.border}`,
            borderRadius: 8,
            padding: 42,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h2 style={{ fontSize: fitQuestionText(question.question), lineHeight: 1.12, margin: 0, letterSpacing: 0 }}>
            {question.question}
          </h2>
          <div style={{ marginTop: 40, display: 'grid', gap: 18 }}>
            {question.options.map((option, index) => (
              <Option
                key={`${question.id}-${index}`}
                label={String.fromCharCode(65 + index)}
                text={option}
                correct={showAnswer && isCorrect(option, question.correctAnswers)}
              />
            ))}
          </div>
        </section>

        <section
          style={{
            background: showAnswer ? 'rgba(20, 83, 45, 0.32)' : 'rgba(15, 23, 42, 0.62)',
            border: `2px solid ${showAnswer ? theme.accentGreen : theme.border}`,
            borderRadius: 8,
            padding: 42,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {showAnswer ? <Answer question={question} frame={frame - revealAnswerAt} /> : <ThinkTimer frame={frame} fps={fps} />}
        </section>
      </div>
    </AbsoluteFill>
  );
};

const Option: React.FC<{ label: string; text: string; correct: boolean }> = ({ label, text, correct }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '54px 1fr',
      alignItems: 'center',
      gap: 18,
      padding: '18px 20px',
      borderRadius: 8,
      border: `2px solid ${correct ? theme.accentGreen : theme.border}`,
      background: correct ? 'rgba(34, 197, 94, 0.16)' : 'rgba(30, 41, 59, 0.72)',
      fontSize: fitOptionText(text),
      lineHeight: 1.16,
      fontWeight: 700,
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
        background: correct ? theme.accentGreen : theme.bgCardStrong,
        color: correct ? '#052e16' : theme.textPrimary,
        fontWeight: 900,
      }}
    >
      {label}
    </div>
    <div>{text}</div>
  </div>
);

const ThinkTimer: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const pulse = interpolate(frame % 60, [0, 30, 60], [0.76, 1, 0.76]);
  const seconds = Math.max(1, 6 - Math.floor(frame / fps));
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: theme.textMuted, fontSize: 28, fontWeight: 800, textTransform: 'uppercase' }}>Think first</div>
      <div style={{ fontSize: 152, lineHeight: 1, margin: '22px 0', color: theme.accent, transform: `scale(${pulse})` }}>
        {seconds}
      </div>
      <div style={{ color: theme.textSecondary, fontSize: 30, lineHeight: 1.25 }}>Pick your answer before the reveal.</div>
    </div>
  );
};

const Answer: React.FC<{ question: WalkthroughQuestion; frame: number }> = ({ question, frame }) => {
  const opacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{ opacity }}>
      <div style={{ color: theme.accentGreen, fontSize: 28, fontWeight: 900, textTransform: 'uppercase' }}>Correct answer</div>
      <div style={{ fontSize: 46, lineHeight: 1.08, margin: '18px 0 30px', fontWeight: 900 }}>
        {question.correctAnswers.join(', ')}
      </div>
      <div style={{ color: theme.textSecondary, fontSize: fitExplanationText(question.explanation), lineHeight: 1.22, fontWeight: 650 }}>
        {question.explanation}
      </div>
    </div>
  );
};

function isCorrect(option: string, answers: string[]): boolean {
  const normalized = option.trim().toLowerCase();
  return answers.some((answer) => {
    const a = answer.trim().toLowerCase();
    return normalized === a || normalized.startsWith(`${a}.`) || a.startsWith(normalized);
  });
}

function fitQuestionText(text: string): number {
  if (text.length > 220) return 38;
  if (text.length > 150) return 44;
  return 52;
}

function fitOptionText(text: string): number {
  if (text.length > 120) return 22;
  if (text.length > 80) return 26;
  return 30;
}

function fitExplanationText(text: string): number {
  if (text.length > 420) return 24;
  if (text.length > 260) return 28;
  return 32;
}
