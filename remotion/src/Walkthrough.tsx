import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { ExamIntro } from './components/ExamIntro';
import { QuestionSlide } from './components/QuestionSlide';
import { CheckpointSlide } from './components/CheckpointSlide';
import { ExamOutro } from './components/ExamOutro';
import { theme } from './theme';

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

const INTRO_SECONDS = 8;
const OUTRO_SECONDS = 10;
const CHECKPOINT_SECONDS = 6;

export const PracticeExamWalkthrough: React.FC<PracticeExamProps> = ({
  title,
  examTitle,
  sourceApp,
  questions,
  fps,
}) => {
  let cursor = 0;
  const introFrames = INTRO_SECONDS * fps;
  const outroFrames = OUTRO_SECONDS * fps;
  const checkpointFrames = CHECKPOINT_SECONDS * fps;
  const midpoint = questions.length > 20 ? 20 : -1;

  return (
    <AbsoluteFill style={{ background: theme.bgPrimary, color: theme.textPrimary, fontFamily: 'Inter, Arial, sans-serif' }}>
      <AnimatedBackground />

      <Sequence from={cursor} durationInFrames={introFrames}>
        <ExamIntro title={title} examTitle={examTitle} sourceApp={sourceApp} questionCount={questions.length} />
      </Sequence>
      {cursor += introFrames}

      {questions.flatMap((question, index) => {
        const from = cursor;
        const duration = Math.ceil(question.durationSeconds * fps);
        cursor += duration;
        const nodes = [
          <Sequence key={question.id} from={from} durationInFrames={duration}>
            <QuestionSlide question={question} totalQuestions={questions.length} fps={fps} />
            {question.audioFileName && <Audio src={staticFile(question.audioFileName)} />}
          </Sequence>,
        ];

        if (index + 1 === midpoint) {
          const checkpointFrom = cursor;
          cursor += checkpointFrames;
          nodes.push(
            <Sequence key="checkpoint" from={checkpointFrom} durationInFrames={checkpointFrames}>
              <CheckpointSlide completed={midpoint} total={questions.length} />
            </Sequence>,
          );
        }

        return nodes;
      })}

      <Sequence from={cursor} durationInFrames={outroFrames}>
        <ExamOutro title={title} questionCount={questions.length} />
      </Sequence>
    </AbsoluteFill>
  );
};

const AnimatedBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame % 240, [0, 240], [0, 1]);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${135 + shift * 20}deg, ${theme.bgGradientStart}, ${theme.bgGradientMid} 48%, ${theme.bgGradientEnd})`,
      }}
    />
  );
};
