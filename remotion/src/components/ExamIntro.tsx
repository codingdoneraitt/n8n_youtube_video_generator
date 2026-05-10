import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';

interface Props {
  title: string;
  examTitle: string;
  sourceApp: string;
  questionCount: number;
}

export const ExamIntro: React.FC<Props> = ({ title, examTitle, sourceApp, questionCount }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: 'clamp' });
  const y = interpolate(frame, [0, 24], [30, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ padding: 96, justifyContent: 'center' }}>
      <div style={{ opacity, transform: `translateY(${y}px)` }}>
        <div style={{ color: theme.accentBlue, fontSize: 30, fontWeight: 800, textTransform: 'uppercase' }}>
          {examTitle}
        </div>
        <h1 style={{ margin: '24px 0 18px', fontSize: 84, lineHeight: 1.02, maxWidth: 1480, letterSpacing: 0 }}>
          {title}
        </h1>
        <div style={{ display: 'flex', gap: 18, marginTop: 34 }}>
          <Pill>{questionCount} questions</Pill>
          <Pill>Answer walkthrough</Pill>
          <Pill>{sourceApp}</Pill>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      border: `2px solid ${theme.border}`,
      background: 'rgba(21, 29, 47, 0.82)',
      color: theme.textSecondary,
      padding: '14px 20px',
      borderRadius: 8,
      fontSize: 24,
      fontWeight: 700,
    }}
  >
    {children}
  </div>
);
