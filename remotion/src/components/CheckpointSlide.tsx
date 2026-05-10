import React from 'react';
import { AbsoluteFill } from 'remotion';
import { theme } from '../theme';

export const CheckpointSlide: React.FC<{ completed: number; total: number }> = ({ completed, total }) => (
  <AbsoluteFill style={{ padding: 96, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
    <div style={{ color: theme.accent, fontSize: 32, fontWeight: 900, textTransform: 'uppercase' }}>Checkpoint</div>
    <h2 style={{ margin: '22px 0', fontSize: 86, lineHeight: 1.02 }}>
      {completed} questions down, {total - completed} to go.
    </h2>
    <p style={{ margin: 0, maxWidth: 980, color: theme.textSecondary, fontSize: 34, lineHeight: 1.28 }}>
      Keep tracking the patterns: qualifiers, service boundaries, and the reason the wrong answers are wrong.
    </p>
  </AbsoluteFill>
);
