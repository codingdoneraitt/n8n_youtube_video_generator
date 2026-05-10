import React from 'react';
import { Composition } from 'remotion';
import { PracticeExamWalkthrough, type PracticeExamProps } from './Walkthrough';

export const Root: React.FC = () => {
  return (
    <Composition<PracticeExamProps>
      id="PracticeExamWalkthrough"
      component={PracticeExamWalkthrough}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        title: 'Practice Exam Walkthrough',
        examTitle: 'Practice Exam',
        sourceApp: 'sample',
        questions: [],
        durationInFrames: 300,
        fps: 30,
      }}
      calculateMetadata={({ props }) => ({
        durationInFrames: props.durationInFrames || 300,
        fps: props.fps || 30,
        width: 1920,
        height: 1080,
      })}
    />
  );
};
