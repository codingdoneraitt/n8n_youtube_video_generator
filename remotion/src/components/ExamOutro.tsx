import React from 'react';
import { AbsoluteFill } from 'remotion';
import { theme } from '../theme';

export const ExamOutro: React.FC<{ title: string; questionCount: number }> = ({ title, questionCount }) => (
  <AbsoluteFill style={{ padding: 96, justifyContent: 'center' }}>
    <div style={{ color: theme.accentGreen, fontSize: 32, fontWeight: 900, textTransform: 'uppercase' }}>Walkthrough complete</div>
    <h2 style={{ margin: '24px 0', fontSize: 78, lineHeight: 1.04 }}>{questionCount} questions reviewed</h2>
    <p style={{ margin: 0, maxWidth: 1260, color: theme.textSecondary, fontSize: 34, lineHeight: 1.28 }}>
      Rewatch the questions you missed, write down the traps, and use the explanations as your next study plan.
    </p>
    <div style={{ marginTop: 44, color: theme.textMuted, fontSize: 24, fontWeight: 700 }}>{title}</div>
  </AbsoluteFill>
);
